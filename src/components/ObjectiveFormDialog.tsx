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
import type { ProgressStatus } from '@/types/study';

interface ObjectiveFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; summary: string; status: ProgressStatus }) => void;
  initialData?: {
    title: string;
    summary: string;
  };
  isEditing?: boolean;
}

export function ObjectiveFormDialog({ open, onOpenChange, onSubmit, initialData, isEditing }: ObjectiveFormDialogProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [summary, setSummary] = useState(initialData?.summary || '');

  useEffect(() => {
    if (open) {
      if (isEditing && initialData) {
        setTitle(initialData.title);
        setSummary(initialData.summary || '');
      } else {
        setTitle(initialData?.title || '');
        setSummary(initialData?.summary || '');
      }
    } else {
      // Reset when dialog closes
      if (!isEditing) {
        setTitle('');
        setSummary('');
      }
    }
  }, [open, initialData, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const submitData: { title: string; summary: string; status: ProgressStatus } = {
      title: title.trim(),
      summary: summary.trim(),
      status: 'not_started',
    };

    onSubmit(submitData);

    if (!isEditing) {
      setTitle('');
      setSummary('');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Objective' : 'Add New Objective'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update objective details.' : 'Create a new learning objective.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="objective-title">Objective Title *</Label>
              <Input
                id="objective-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Understand core concepts"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="objective-summary">Summary</Label>
              <Textarea
                id="objective-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Enter a summary or description of this objective..."
                rows={4}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground">
                Optional summary or description of what this objective covers.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {isEditing ? 'Save Changes' : 'Add Objective'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
