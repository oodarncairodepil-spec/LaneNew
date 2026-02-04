import { useNavigate } from 'react-router-dom';
import type { Lesson } from '@/types/study';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { MoreVertical, Trash2, Target, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface LessonCardProps {
  lesson: Lesson;
  courseId: string;
  onDelete: () => void;
}

export function LessonCard({ lesson, courseId, onDelete }: LessonCardProps) {
  const navigate = useNavigate();

  const totalObjectives = lesson.objectives?.length || 0;
  const completedObjectives = lesson.objectives?.filter(o => o?.status === 'completed').length || 0;

  // Calculate goals completion
  const totalGoals = lesson.goals?.length || 0;
  const completedGoals = lesson.goalAnswers?.filter((answer, index) => {
    return answer && answer.trim().length > 0 && index < (lesson.goals?.length || 0);
  }).length || 0;

  // Get color classes for goals based on completion status
  const getGoalsColorClass = () => {
    if (totalGoals === 0) return 'text-muted-foreground';
    if (completedGoals === 0) return 'text-muted-foreground';
    if (completedGoals === totalGoals) return 'text-success';
    return 'text-warning';
  };

  // Get color classes for objectives based on completion status
  const getObjectivesColorClass = () => {
    if (totalObjectives === 0) return 'text-muted-foreground';
    if (completedObjectives === 0) return 'text-muted-foreground';
    if (completedObjectives === totalObjectives) return 'text-success';
    return 'text-warning';
  };

  return (
    <Card 
      className="group cursor-pointer card-shadow card-hover animate-fade-in"
      onClick={() => navigate(`/course/${courseId}/lesson/${lesson.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
                {lesson.title}
              </h3>
              {lesson.summary && (
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                  {lesson.summary}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Lesson
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            {totalGoals > 0 && (
              <span className={cn("flex items-center gap-1", getGoalsColorClass())}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {completedGoals}/{totalGoals} goals
              </span>
            )}
            <span className={cn("flex items-center gap-1", getObjectivesColorClass())}>
              <Target className="h-3.5 w-3.5" />
              {completedObjectives}/{totalObjectives} objectives
            </span>
          </div>
          <StatusBadge status={lesson.status} size="sm" />
        </div>
      </CardContent>
    </Card>
  );
}
