import { useNavigate } from 'react-router-dom';
import type { Course } from '@/types/study';
import { useStudy } from '@/contexts/StudyContext';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/ProgressBar';
import { BookOpen, MoreVertical, Trash2 } from 'lucide-react';
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
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCourse(course.id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span>{stats.totalLessons} {stats.totalLessons === 1 ? 'lesson' : 'lessons'}</span>
          <span>{stats.totalResources} {stats.totalResources === 1 ? 'resource' : 'resources'}</span>
          <StatusBadge status={course.status} size="sm" />
        </div>

        <div className="mt-3">
          <ProgressBar value={stats.progressPercent} showLabel size="sm" />
        </div>
      </CardContent>
    </Card>
  );
}
