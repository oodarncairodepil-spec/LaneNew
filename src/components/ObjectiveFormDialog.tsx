import { useState } from 'react';
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
  onSubmit: (data: { title: string; description: string; status: ProgressStatus }) => void;
  initialData?: {
    title: string;
    description: string;
  };
  isEditing?: boolean;
}

export function ObjectiveFormDialog({ open, onOpenChange, onSubmit, initialData, isEditing }: ObjectiveFormDialogProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status: 'not_started',
    });

    if (!isEditing) {
      setTitle('');
      setDescription('');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
              <Label htmlFor="objective-description">Description</Label>
              <Textarea
                id="objective-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What you need to learn or achieve..."
                rows={3}
              />
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
