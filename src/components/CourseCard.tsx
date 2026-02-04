import { useNavigate } from 'react-router-dom';
import type { Course } from '@/types/study';
import { useStudy } from '@/contexts/StudyContext';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressBar } from '@/components/ProgressBar';
import { cn } from '@/lib/utils';
import { BookOpen, CheckCircle2, MoreVertical, Target, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const navigate = useNavigate();
  const { deleteCourse, getCourseStats } = useStudy();
  const stats = getCourseStats(course);

  const getStatColorClass = (completed: number, total: number) => {
    if (total === 0) return 'text-muted-foreground';
    if (completed === 0) return 'text-muted-foreground';
    if (completed >= total) return 'text-success';
    return 'text-warning';
  };

  return (
    <Card 
      className="group cursor-pointer card-shadow card-hover animate-fade-in"
      onClick={() => navigate(`/course/${course.id}`)}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                {course.title}
              </h3>
              {course.description && (
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                  {course.description}
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
                onClick={async (e) => {
                  e.stopPropagation();
                  await deleteCourse(course.id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 flex items-center gap-x-3 text-xs whitespace-nowrap overflow-x-auto">
          <span className={cn('flex items-center gap-1 shrink-0', getStatColorClass(stats.completedLessons, stats.totalLessons))}>
            {stats.completedLessons}/{stats.totalLessons} {stats.totalLessons === 1 ? 'lesson' : 'lessons'}
          </span>
          <span className={cn('flex items-center gap-1 shrink-0', getStatColorClass(stats.completedGoals, stats.totalGoals))}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            {stats.completedGoals}/{stats.totalGoals} {stats.totalGoals === 1 ? 'goal' : 'goals'}
          </span>
          <span className={cn('flex items-center gap-1 shrink-0', getStatColorClass(stats.completedObjectives, stats.totalObjectives))}>
            <Target className="h-3.5 w-3.5" />
            {stats.completedObjectives}/{stats.totalObjectives} {stats.totalObjectives === 1 ? 'objective' : 'objectives'}
          </span>
          <span className={cn('flex items-center gap-1 shrink-0', getStatColorClass(stats.completedResources, stats.totalResources))}>
            {stats.completedResources}/{stats.totalResources} {stats.totalResources === 1 ? 'resource' : 'resources'}
          </span>
        </div>

        <div className="mt-3">
          <ProgressBar value={stats.progressPercent} showLabel size="sm" />
        </div>
      </CardContent>
    </Card>
  );
}
