import { useNavigate } from 'react-router-dom';
import type { Lesson } from '@/types/study';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { FileText, MoreVertical, Trash2, Target } from 'lucide-react';
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

  const totalObjectives = lesson.objectives.length;
  const completedObjectives = lesson.objectives.filter(o => o.status === 'completed').length;
  const totalResources = lesson.objectives.reduce((acc, o) => acc + o.resources.length, 0);

  return (
    <Card 
      className="group cursor-pointer card-shadow card-hover animate-fade-in"
      onClick={() => navigate(`/course/${courseId}/lesson/${lesson.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
              <FileText className="h-4 w-4" />
            </div>
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

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Target className="h-3.5 w-3.5" />
            {completedObjectives}/{totalObjectives} objectives
          </span>
          <span>{totalResources} resources</span>
          <StatusBadge status={lesson.status} size="sm" />
        </div>
      </CardContent>
    </Card>
  );
}
