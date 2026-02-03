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

interface LessonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; summary: string; projectQuestions: string; status: ProgressStatus }) => void;
  initialData?: {
    title: string;
    summary: string;
    projectQuestions: string;
  };
  isEditing?: boolean;
}

export function LessonFormDialog({ open, onOpenChange, onSubmit, initialData, isEditing }: LessonFormDialogProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [projectQuestions, setProjectQuestions] = useState(initialData?.projectQuestions || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      title: title.trim(),
      summary: summary.trim(),
      projectQuestions: projectQuestions.trim(),
      status: 'not_started',
    });

    if (!isEditing) {
      setTitle('');
      setSummary('');
      setProjectQuestions('');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Lesson' : 'Add New Lesson'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update lesson details.' : 'Create a new lesson for this course.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Lesson Title *</Label>
              <Input
                id="lesson-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Chapter 1: Foundations"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-summary">Summary</Label>
              <Textarea
                id="lesson-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Key takeaways from this lesson..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-questions">Project Questions / Notes</Label>
              <Textarea
                id="project-questions"
                value={projectQuestions}
                onChange={(e) => setProjectQuestions(e.target.value)}
                placeholder="Questions or points to address related to your project..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {isEditing ? 'Save Changes' : 'Add Lesson'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
