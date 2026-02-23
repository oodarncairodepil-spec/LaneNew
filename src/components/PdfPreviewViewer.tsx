import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { cn } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';

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

type ZoomMode = 'fit' | number; // number = scale factor (e.g. 0.5 = 50%, 1 = 100%, 1.5 = 150%)

const ZOOM_PERCENT_MIN = 25;
const ZOOM_PERCENT_MAX = 300;
const ZOOM_PERCENT_STEP = 25;

export function PdfPreviewViewer({ pdfUrl, className = '', title }: PdfPreviewViewerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<ZoomMode>('fit');
  const [measureWidth, setMeasureWidth] = useState<number>(0);
  const [screenSize, setScreenSize] = useState({ w: 0, h: 0 });

  const isZoomedOut = typeof zoom === 'number' && zoom < 1;
  const useMinWidthZero = zoom === 'fit' || isZoomedOut;

  const zoomPercentDisplay = zoom === 'fit' ? 100 : Math.round(zoom * 100);
  const handleZoomMinus = () => {
    setZoom((prev) => {
      const pct = prev === 'fit' ? 100 : prev * 100;
      const next = Math.max(ZOOM_PERCENT_MIN, pct - ZOOM_PERCENT_STEP);
      return next / 100;
    });
  };
  const handleZoomPlus = () => {
    setZoom((prev) => {
      const pct = prev === 'fit' ? 100 : prev * 100;
      const next = Math.min(ZOOM_PERCENT_MAX, pct + ZOOM_PERCENT_STEP);
      return next / 100;
    });
  };
  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') return;
    const value = Math.max(ZOOM_PERCENT_MIN, Math.min(ZOOM_PERCENT_MAX, parseInt(raw, 10) || ZOOM_PERCENT_MIN));
    setZoom(value / 100);
  };

  // Re-measure when wrapper or visual viewport resizes (e.g. dialog open, orientation change, mobile browser chrome)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || zoom !== 'fit') return;

    const updateWidth = () => {
      const vv = typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.width : window.innerWidth;
      const w = el.clientWidth;
      const capped = Math.min(w > 0 ? w : vv, vv - 8);
      setMeasureWidth(Math.max(200, capped - 8));
    };

    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateWidth);
    }
    return () => {
      ro.disconnect();
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateWidth);
      }
    };
  }, [zoom]);

  useEffect(() => {
    const update = () => {
      if (typeof window === 'undefined') return;
      const vv = window.visualViewport;
      setScreenSize({
        w: vv ? Math.round(vv.width) : window.innerWidth,
        h: vv ? Math.round(vv.height) : window.innerHeight,
      });
    };
    update();
    window.addEventListener('resize', update);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', update);
    }
    return () => {
      window.removeEventListener('resize', update);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', update);
      }
    };
  }, []);

  useEffect(() => {
    if (!pdfUrl || !wrapperRef.current) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const getContainerWidth = () => {
      if (zoom !== 'fit') {
        const el = wrapperRef.current;
        const w = el?.clientWidth ?? window.innerWidth - 24;
        return Math.max(200, w - 16);
      }
      if (measureWidth > 0) return measureWidth;
      const vv = typeof window !== 'undefined' && window.visualViewport ? window.visualViewport.width : window.innerWidth;
      const el = wrapperRef.current;
      const w = el?.clientWidth;
      const fromEl = w > 0 ? w - 8 : null;
      const fromViewport = vv - 16;
      const contentWidth = fromEl != null ? Math.min(fromEl, fromViewport) : fromViewport;
      return Math.max(200, contentWidth);
    };

    const load = async () => {
      try {
        const pdf = await getDocument({ url: pdfUrl }).promise;
        if (cancelled || !containerRef.current) return;

        const numPages = pdf.numPages;
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);
        // Wait one frame so dialog/layout has run and wrapper has real width
        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => requestAnimationFrame(r));
        if (cancelled) return;
        const containerWidth = getContainerWidth();
        const container = containerRef.current;
        container.innerHTML = '';

        // Scale: "fit" = fit to container width; number = scale factor (zoomPercent/100, e.g. 0.5 = 50%, 1 = 100%)
        const getScaleForPage = (baseViewport: { width: number }) =>
          zoom === 'fit' ? containerWidth / baseViewport.width : zoom;

        for (let i = 1; i <= numPages; i++) {
          if (cancelled) break;
          try {
            const page = await pdf.getPage(i);
            const baseViewport = page.getViewport({ scale: 1 });
            const scale = getScaleForPage(baseViewport);
            const viewport = page.getViewport({ scale });
            const scaledViewport = viewport.clone({ scale: viewport.scale * outputScale });

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;

            canvas.width = Math.floor(scaledViewport.width);
            canvas.height = Math.floor(scaledViewport.height);
            canvas.style.display = 'block';
            canvas.style.margin = '0 auto 1rem';
            canvas.style.minWidth = '0';
            canvas.style.boxSizing = 'border-box';
            if (zoom === 'fit') {
              canvas.style.width = '100%';
              canvas.style.height = 'auto';
              canvas.style.maxWidth = '100%';
            } else {
              const viewportWidthPx = Math.floor(viewport.width);
              if (typeof zoom === 'number' && zoom < 1) {
                const maxDisplayWidth = typeof window !== 'undefined' && window.visualViewport
                  ? window.visualViewport.width - 16
                  : (typeof window !== 'undefined' ? window.innerWidth - 16 : 400);
                canvas.style.width = `${Math.min(viewportWidthPx, maxDisplayWidth)}px`;
                canvas.style.height = 'auto';
                canvas.style.maxWidth = '100%';
              } else {
                canvas.style.width = `${viewportWidthPx}px`;
                canvas.style.height = 'auto';
                canvas.style.maxWidth = 'none';
              }
            }

            const renderContext = {
              canvasContext: ctx,
              canvas,
              viewport: scaledViewport,
              transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
            };
            await page.render(renderContext).promise;
            container.appendChild(canvas);
          } catch (pageError) {
            console.warn(`PDF page ${i} failed to render`, pageError);
          }
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
  }, [pdfUrl, zoom, measureWidth]);

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 text-destructive ${className}`}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={cn('w-full', useMinWidthZero ? 'min-w-0' : 'min-w-max', className)}
      aria-label={title}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Zoom toolbar: full width, responsive - stop propagation so clicks don't close dialog or trigger card navigation */}
      <div
        className="sticky top-0 z-10 flex items-center gap-2 p-2 bg-background/95 backdrop-blur border-b shrink-0"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setZoom('fit');
          }}
          className={`px-2 py-1 text-xs rounded border transition-colors ${
            zoom === 'fit' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-border'
          }`}
        >
          Fit width
        </button>
        <div className="flex items-center gap-0.5 border rounded">
          <button
            type="button"
            aria-label="Decrease zoom"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleZoomMinus();
            }}
            className="p-1.5 hover:bg-muted rounded-l border-r"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={zoomPercentDisplay}
            onChange={handleZoomInputChange}
            className="w-12 text-center text-xs py-1 bg-transparent border-0 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Zoom percentage"
          />
          <button
            type="button"
            aria-label="Increase zoom"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleZoomPlus();
            }}
            className="p-1.5 hover:bg-muted rounded-r"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="text-xs text-muted-foreground">%</span>
        {screenSize.w > 0 && screenSize.h > 0 && (
          <span
            className="text-xs text-muted-foreground ml-1"
            title={`Viewport: ${screenSize.w}×${screenSize.h}px`}
          >
            Screen: {screenSize.w}×{screenSize.h}
          </span>
        )}
      </div>
      {loading && (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <p>Loading PDF…</p>
        </div>
      )}
      <div
        ref={containerRef}
        className={cn(
          'flex flex-col items-center w-full box-border overflow-visible',
          useMinWidthZero ? 'min-w-0 px-1' : 'min-w-max p-2'
        )}
      />
    </div>
  );
}
