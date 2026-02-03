import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ProgressStatus, Resource } from '@/types/study';

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { description: string; link: string; summary: string; status: ProgressStatus }) => void;
  initialData?: Resource;
  isEditing?: boolean;
}

export function ResourceFormDialog({ open, onOpenChange, onSubmit, initialData, isEditing }: ResourceFormDialogProps) {
  const [description, setDescription] = useState(initialData?.description || '');
  const [link, setLink] = useState(initialData?.link || '');
  const [summary, setSummary] = useState(initialData?.summary || '');

  useEffect(() => {
    if (open) {
      if (isEditing && initialData) {
        setDescription(initialData.description || '');
        setLink(initialData.link || '');
        setSummary(initialData.summary || '');
      } else {
        setDescription(initialData?.description || '');
        setLink(initialData?.link || '');
        setSummary(initialData?.summary || '');
      }
    } else {
      if (!isEditing) {
        setDescription('');
        setLink('');
        setSummary('');
      }
    }
  }, [open, initialData, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    onSubmit({
      description: description.trim(),
      link: link.trim(),
      summary: summary.trim(),
      status: initialData?.status || 'not_started',
    });

    if (!isEditing) {
      setDescription('');
      setLink('');
      setSummary('');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update resource details and summary.' : 'Add a video or document resource.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resource-description">Description *</Label>
              <Input
                id="resource-description"
                value={description || ''}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the resource (e.g., 'Introduction to React')"
                required
              />
              <p className="text-xs text-muted-foreground">
                A short description to identify this resource.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-link">Resource Link</Label>
              <Input
                id="resource-link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-summary">Summary</Label>
              <Textarea
                id="resource-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Enter your detailed notes and summary of this resource. This can be downloaded as TXT or Markdown for offline study."
                rows={6}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground">
                Optional detailed notes and summary. This will be included in downloadable study materials.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!description?.trim()}>
              {isEditing ? 'Save Changes' : 'Add Resource'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
