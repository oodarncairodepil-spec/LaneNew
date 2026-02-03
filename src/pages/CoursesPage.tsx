import { useState } from 'react';
import { useStudy } from '@/contexts/StudyContext';
import { PageHeader } from '@/components/PageHeader';
import { CourseCard } from '@/components/CourseCard';
import { CourseFormDialog } from '@/components/CourseFormDialog';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, GraduationCap } from 'lucide-react';

export default function CoursesPage() {
  const { courses } = useStudy();
  const [showForm, setShowForm] = useState(false);

  const totalCourses = courses.length;
  const completedCourses = courses.filter(c => c.status === 'completed').length;
  const inProgressCourses = courses.filter(c => c.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-6 pb-24">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Study Progress
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track your journey to your degree
          </p>
        </div>

        {/* Stats */}
        {totalCourses > 0 && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-card p-3 text-center card-shadow">
              <div className="text-2xl font-bold text-foreground">{totalCourses}</div>
              <div className="text-xs text-muted-foreground">Courses</div>
            </div>
            <div className="rounded-lg bg-card p-3 text-center card-shadow">
              <div className="text-2xl font-bold text-warning">{inProgressCourses}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div className="rounded-lg bg-card p-3 text-center card-shadow">
              <div className="text-2xl font-bold text-success">{completedCourses}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>
        )}

        {/* Course List */}
        {courses.length > 0 ? (
          <div className="space-y-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpen className="h-8 w-8" />}
            title="No courses yet"
            description="Create your first course to start tracking your study progress."
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            }
          />
        )}

        {/* FAB */}
        {courses.length > 0 && (
          <Button
            onClick={() => setShowForm(true)}
            size="lg"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg sm:bottom-8 sm:right-8"
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}

        <CourseFormDialog open={showForm} onOpenChange={setShowForm} />
      </div>
    </div>
  );
}
