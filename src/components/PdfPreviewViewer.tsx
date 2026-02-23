import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Vite: use ?url so worker path is correct in build
// @ts-expect-error - Vite handles ?url
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
if (typeof GlobalWorkerOptions !== 'undefined' && !GlobalWorkerOptions.workerSrc) {
  GlobalWorkerOptions.workerSrc = workerUrl;
}

interface PdfPreviewViewerProps {
  /** Blob URL from URL.createObjectURL(pdfBlob) */
  pdfUrl: string;
  className?: string;
  title?: string;
}

export function PdfPreviewViewer({ pdfUrl, className = '', title }: PdfPreviewViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfUrl) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const pdf = await getDocument({ url: pdfUrl }).promise;
        if (cancelled || !containerRef.current) return;

        const numPages = pdf.numPages;
        const outputScale = window.devicePixelRatio || 1;
        const container = containerRef.current;
        container.innerHTML = '';

        for (let i = 1; i <= numPages; i++) {
          if (cancelled) break;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const scaledViewport = viewport.clone({ scale: viewport.scale * outputScale });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;

          canvas.width = Math.floor(scaledViewport.width);
          canvas.height = Math.floor(scaledViewport.height);
          canvas.style.width = `${Math.floor(viewport.width)}px`;
          canvas.style.height = `${Math.floor(viewport.height)}px`;
          canvas.style.display = 'block';
          canvas.style.margin = '0 auto 1rem';
          canvas.style.maxWidth = '100%';

          const renderContext = {
            canvasContext: ctx,
            canvas,
            viewport: scaledViewport,
            transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
          };
          await page.render(renderContext).promise;
          container.appendChild(canvas);
        }

        if (!cancelled) setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load PDF');
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 text-destructive ${className}`}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={`overflow-auto w-full h-full ${className}`} aria-label={title}>
      {loading && (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <p>Loading PDF…</p>
        </div>
      )}
      <div ref={containerRef} className="flex flex-col items-center p-4" />
    </div>
  );
}
