import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudy } from '@/contexts/StudyContext';
import { PageHeader } from '@/components/PageHeader';
import { LessonCard } from '@/components/LessonCard';
import { LessonFormDialog } from '@/components/LessonFormDialog';
import { CourseFormDialog } from '@/components/CourseFormDialog';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, FileText, Edit, Download } from 'lucide-react';
import { downloadSummary, formatCourseSummary } from '@/lib/download';
import type { ProgressStatus } from '@/types/study';

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { getCourse, addLesson, deleteLesson, updateCourse, updateCourseStatus, getCourseStats } = useStudy();

  const course = getCourse(courseId!);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);

  if (!course) {
    navigate('/');
    return null;
  }

  const stats = getCourseStats(course);

  const handleAddLesson = (data: { title: string; summary: string; projectQuestions: string; status: ProgressStatus }) => {
    addLesson(courseId!, data);
  };

  const handleStatusChange = (status: ProgressStatus) => {
    updateCourseStatus(courseId!, status);
  };

  const handleSummaryChange = (summary: string) => {
    updateCourse(courseId!, { summary });
  };

  const handleDownload = (format: 'txt' | 'md') => {
    const content = formatCourseSummary(
      course.title,
      course.description,
      course.summary,
      course.lessons.map(l => ({
        title: l.title,
        summary: l.summary,
        objectives: l.objectives.map(o => ({
          title: o.title,
          resources: o.resources.map(r => ({ title: r.title, summary: r.summary })),
        })),
      })),
      format
    );
    downloadSummary({
      filename: course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
      content,
      format,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-6 pb-24">
        <PageHeader
          title={course.title}
          description={course.description}
          backTo="/"
          actions={
            <Button variant="outline" size="sm" onClick={() => setShowCourseForm(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          }
        />

        {/* Progress & Status */}
        <Card className="mb-6 card-shadow">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <ProgressBar value={stats.progressPercent} showLabel size="md" />
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{stats.completedLessons}/{stats.totalLessons} lessons</span>
                  <span>{stats.completedResources}/{stats.totalResources} resources</span>
                </div>
              </div>
              <Select value={course.status} onValueChange={(v) => handleStatusChange(v as ProgressStatus)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Course Summary */}
        <Card className="mb-6 card-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Course Summary</CardTitle>
              {course.summary && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleDownload('txt')}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              value={course.summary}
              onChange={(e) => handleSummaryChange(e.target.value)}
              placeholder="Add your course summary and notes here..."
              rows={4}
              className="resize-y"
            />
          </CardContent>
        </Card>

        {/* Lessons */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Lessons</h2>
          <Button size="sm" onClick={() => setShowLessonForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lesson
          </Button>
        </div>

        {course.lessons.length > 0 ? (
          <div className="space-y-3">
            {course.lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                courseId={courseId!}
                onDelete={() => deleteLesson(courseId!, lesson.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No lessons yet"
            description="Add your first lesson to organize your study material."
            action={
              <Button onClick={() => setShowLessonForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Lesson
              </Button>
            }
          />
        )}

        <LessonFormDialog
          open={showLessonForm}
          onOpenChange={setShowLessonForm}
          onSubmit={handleAddLesson}
        />

        <CourseFormDialog
          open={showCourseForm}
          onOpenChange={setShowCourseForm}
          courseId={courseId}
          initialData={{
            title: course.title,
            description: course.description,
            summary: course.summary,
          }}
        />
      </div>
    </div>
  );
}
