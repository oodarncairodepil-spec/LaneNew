import { useMemo, useEffect } from 'react';
import type { Resource } from '@/types/study';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { CustomVideoPlayer } from '@/components/CustomVideoPlayer';
import { isVideoUrl, convertToEmbedUrl } from '@/lib/resource-utils';

interface ResourceViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: Resource;
}

export function ResourceViewer({ open, onOpenChange, resource }: ResourceViewerProps) {
  const isVideo = useMemo(() => isVideoUrl(resource.link), [resource.link]);
  const embedUrl = useMemo(() => {
    if (!resource.link) return null;
    return convertToEmbedUrl(resource.link);
  }, [resource.link]);

  const isDirectVideoFile = useMemo(() => {
    if (!resource.link) return false;
    return /\.(mp4|webm|mov|avi|mkv)$/i.test(resource.link);
  }, [resource.link]);

  // Prevent body scroll when viewer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="fixed inset-0 z-[100] max-w-none w-full h-full p-0 gap-0 border-0 bg-black/95 translate-x-0 translate-y-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="relative w-full h-full flex flex-col">
          {/* Video player - Embedded (YouTube/Vimeo) */}
          {isVideo && embedUrl && !isDirectVideoFile && (
            <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
              <div className="w-full max-w-7xl aspect-video">
                <CustomVideoPlayer
                  src={resource.link || ''}
                  title={resource.description}
                  isEmbedded={true}
                  embedUrl={embedUrl}
                  autoplay={false}
                  onClose={() => onOpenChange(false)}
                />
              </div>
            </div>
          )}

          {/* Video player - Direct video file */}
          {isVideo && isDirectVideoFile && resource.link && (
            <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
              <div className="w-full max-w-7xl aspect-video">
                <CustomVideoPlayer
                  src={resource.link}
                  title={resource.description}
                  autoplay={true}
                  onClose={() => onOpenChange(false)}
                />
              </div>
            </div>
          )}

          {/* Document/Website iframe */}
          {!isVideo && resource.link && (
            <iframe
              src={resource.link}
              className="w-full h-full border-0"
              title={resource.description || 'Resource viewer'}
              allow="fullscreen"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          )}

          {/* Fallback for resources without links */}
          {!resource.link && (
            <div className="w-full h-full flex items-center justify-center p-4">
              <p className="text-white">No resource link available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

