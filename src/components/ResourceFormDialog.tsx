import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ProgressStatus, ResourceType, Resource } from '@/types/study';
import { Video, FileText } from 'lucide-react';

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; link: string; type: ResourceType; summary: string; status: ProgressStatus }) => void;
  initialData?: Resource;
  isEditing?: boolean;
}

export function ResourceFormDialog({ open, onOpenChange, onSubmit, initialData, isEditing }: ResourceFormDialogProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [link, setLink] = useState(initialData?.link || '');
  const [type, setType] = useState<ResourceType>(initialData?.type || 'document');
  const [summary, setSummary] = useState(initialData?.summary || '');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setLink(initialData.link);
      setType(initialData.type);
      setSummary(initialData.summary);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      link: link.trim(),
      type,
      summary: summary.trim(),
      status: initialData?.status || 'not_started',
    });

    if (!isEditing) {
      setTitle('');
      setLink('');
      setType('document');
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
              <Label htmlFor="resource-title">Resource Title *</Label>
              <Input
                id="resource-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Introduction Video"
                required
              />
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
              <Label>Resource Type</Label>
              <RadioGroup value={type} onValueChange={(v) => setType(v as ResourceType)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="video" id="type-video" />
                  <Label htmlFor="type-video" className="flex items-center gap-1.5 cursor-pointer">
                    <Video className="h-4 w-4" />
                    Video
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="document" id="type-document" />
                  <Label htmlFor="type-document" className="flex items-center gap-1.5 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    Document
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-summary">Summary</Label>
              <Textarea
                id="resource-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Enter your notes and summary of this resource..."
                rows={6}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground">
                This summary can be downloaded as TXT or Markdown for offline study.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {isEditing ? 'Save Changes' : 'Add Resource'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
