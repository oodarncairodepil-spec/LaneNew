import { useState, useEffect } from 'react';
import { useStudy } from '@/contexts/StudyContext';
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

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    title: string;
    description: string;
    summary: string;
    goals?: string[];
  };
  courseId?: string;
}

export function CourseFormDialog({ open, onOpenChange, initialData, courseId }: CourseFormDialogProps) {
  const { addCourse, updateCourse } = useStudy();
  const isEditing = Boolean(courseId);

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [goals, setGoals] = useState<string[]>(initialData?.goals && initialData.goals.length > 0 ? initialData.goals : ['']);

  // Update state when initialData changes (e.g., when editing)
  useEffect(() => {
    if (open) {
      setTitle(initialData?.title || '');
      setDescription(initialData?.description || '');
      setSummary(initialData?.summary || '');
      setGoals(initialData?.goals && initialData.goals.length > 0 ? initialData.goals : ['']);
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const filteredGoals = goals.filter(goal => goal.trim() !== '');

    const data = {
      title: title.trim(),
      description: description.trim(),
      summary: summary.trim(),
      goals: filteredGoals,
      status: 'not_started' as ProgressStatus,
    };

    if (isEditing && courseId) {
      await updateCourse(courseId, data);
    } else {
      await addCourse(data);
    }

    onOpenChange(false);
    setTitle('');
    setDescription('');
    setSummary('');
    setGoals(['']);
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
            <DialogTitle>{isEditing ? 'Edit Course' : 'Create New Course'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update your course details.' : 'Add a new course to track your progress.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Introduction to Psychology"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the course..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Course Summary</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Your notes and summary for this course..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Course Goals</Label>
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
              {isEditing ? 'Save Changes' : 'Create Course'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
