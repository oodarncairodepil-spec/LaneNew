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
import { Plus, X } from 'lucide-react';
import type { ProgressStatus } from '@/types/study';

interface LessonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; summary: string; projectQuestions: string; goals?: string[]; status: ProgressStatus }) => Promise<void>;
  initialData?: {
    title: string;
    summary: string;
    projectQuestions: string;
    goals?: string[];
  };
  isEditing?: boolean;
}

export function LessonFormDialog({ open, onOpenChange, onSubmit, initialData, isEditing }: LessonFormDialogProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [projectQuestions, setProjectQuestions] = useState(initialData?.projectQuestions || '');
  const [goals, setGoals] = useState<string[]>(initialData?.goals && initialData.goals.length > 0 ? initialData.goals : ['']);

  useEffect(() => {
    if (open) {
      if (isEditing && initialData) {
        setTitle(initialData.title);
        setSummary(initialData.summary);
        setProjectQuestions(initialData.projectQuestions);
        setGoals(initialData.goals && initialData.goals.length > 0 ? initialData.goals : ['']);
      } else {
        setTitle(initialData?.title || '');
        setSummary(initialData?.summary || '');
        setProjectQuestions(initialData?.projectQuestions || '');
        setGoals(initialData?.goals && initialData.goals.length > 0 ? initialData.goals : ['']);
      }
    } else {
      if (!isEditing) {
        setTitle('');
        setSummary('');
        setProjectQuestions('');
        setGoals(['']);
      }
    }
  }, [open, initialData, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const filteredGoals = goals.filter(goal => goal.trim() !== '');

    await onSubmit({
      title: title.trim(),
      summary: summary.trim(),
      projectQuestions: projectQuestions.trim(),
      goals: filteredGoals,
      status: 'not_started',
    });

    if (!isEditing) {
      setTitle('');
      setSummary('');
      setProjectQuestions('');
      setGoals(['']);
    }
    onOpenChange(false);
  };

  const addGoal = () => {
    setGoals([...goals, '']);
  };

  const removeGoal = (index: number) => {
    if (goals.length > 1) {
      setGoals(goals.filter((_, i) => i !== index));
    }
  };

  const updateGoal = (index: number, value: string) => {
    const newGoals = [...goals];
    newGoals[index] = value;
    setGoals(newGoals);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Lesson Goals</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addGoal}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Goal
                </Button>
              </div>
              <div className="space-y-2">
                {goals.map((goal, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={goal}
                      onChange={(e) => updateGoal(index, e.target.value)}
                      placeholder={`Goal ${index + 1} (e.g., Addresses all of the following emphases...)`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGoal(index)}
                      className="h-10 w-10 shrink-0"
                      disabled={goals.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
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
