import { useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const PDF_DIALOG_HEIGHT_VAR = '--pdf-dialog-height';

interface PdfPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export function PdfPreviewDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onClose,
}: PdfPreviewDialogProps) {
  useEffect(() => {
    if (open) {
      const setHeight = () => {
        const h = typeof window !== 'undefined' && window.visualViewport
          ? window.visualViewport.height
          : window.innerHeight;
        document.documentElement.style.setProperty(
          PDF_DIALOG_HEIGHT_VAR,
          `${h}px`
        );
      };
      setHeight();
      window.addEventListener('resize', setHeight);
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.addEventListener('resize', setHeight);
      }
      return () => {
        window.removeEventListener('resize', setHeight);
        if (typeof window !== 'undefined' && window.visualViewport) {
          window.visualViewport.removeEventListener('resize', setHeight);
        }
        document.documentElement.style.removeProperty(PDF_DIALOG_HEIGHT_VAR);
      };
    }
  }, [open]);

  const handleClose = () => {
    onClose?.();
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed inset-0 z-50 flex flex-col w-full min-h-0 border-0 bg-background p-0',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
          style={{
            height: `var(${PDF_DIALOG_HEIGHT_VAR}, 100dvh)`,
            maxHeight: `var(${PDF_DIALOG_HEIGHT_VAR}, 100dvh)`,
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="sr-only">
              {description}
            </DialogPrimitive.Description>
          )}
          {/* Fixed header so scroll area gets remaining space */}
          <div className="flex-none flex items-center justify-end h-14 shrink-0 px-4 border-b">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="bg-background/90 backdrop-blur-sm"
            >
              Close
            </Button>
          </div>
          {/* Single scroll area: allow both vertical and horizontal scroll when content overflows */}
          <div
            className="flex-1 min-h-0 overflow-auto w-full"
            style={{
              flex: '1 1 0',
              minHeight: 0,
              height: 0,
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
