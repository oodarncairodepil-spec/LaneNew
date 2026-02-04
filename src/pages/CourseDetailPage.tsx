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
import { GoalItem } from '@/components/GoalItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, FileText, Edit, Download, CheckCircle2, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { downloadSummary, formatCourseSummary } from '@/lib/download';
import { cn } from '@/lib/utils';
import type { ProgressStatus } from '@/types/study';

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { getCourse, addLesson, deleteLesson, updateCourse, getCourseStats, loading } = useStudy();

  const course = getCourse(courseId!);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [isCourseGoalsOpen, setIsCourseGoalsOpen] = useState(false);
  const [isCourseSummaryOpen, setIsCourseSummaryOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl py-6 pb-24">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading course...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    navigate('/');
    return null;
  }

  const stats = getCourseStats(course);
  const courseGoalsTotal = course.goals?.length || 0;
  const courseGoalsCompleted = (course.goalAnswers || [])
    .slice(0, courseGoalsTotal)
    .filter((a) => Boolean(a && a.trim().length > 0)).length;

  // Get color classes for goals based on completion status
  const getGoalsColorClass = () => {
    if (stats.totalGoals === 0) return 'text-muted-foreground';
    if (stats.completedGoals === 0) return 'text-muted-foreground';
    if (stats.completedGoals === stats.totalGoals) return 'text-success';
    return 'text-warning';
  };

  // Get color classes for lessons based on completion status
  const getLessonsColorClass = () => {
    if (stats.totalLessons === 0) return 'text-muted-foreground';
    if (stats.completedLessons === 0) return 'text-muted-foreground';
    if (stats.completedLessons === stats.totalLessons) return 'text-success';
    return 'text-warning';
  };

  // Get color classes for objectives based on completion status
  const getObjectivesColorClass = () => {
    if (stats.totalObjectives === 0) return 'text-muted-foreground';
    if (stats.completedObjectives === 0) return 'text-muted-foreground';
    if (stats.completedObjectives === stats.totalObjectives) return 'text-success';
    return 'text-warning';
  };

  // Get color classes for resources based on completion status
  const getResourcesColorClass = () => {
    if (stats.totalResources === 0) return 'text-muted-foreground';
    if (stats.completedResources === 0) return 'text-muted-foreground';
    if (stats.completedResources === stats.totalResources) return 'text-success';
    return 'text-warning';
  };

  const handleAddLesson = async (data: { title: string; summary: string; projectQuestions: string; goals?: string[]; status: ProgressStatus }) => {
    await addLesson(courseId!, data);
  };

  const handleSummaryChange = async (summary: string) => {
    await updateCourse(courseId!, { summary });
  };

  const handleGoalAnswerChange = async (index: number, answer: string) => {
    const currentAnswers = course.goalAnswers || [];
    const newAnswers = [...currentAnswers];
    newAnswers[index] = answer;
    // Ensure array length matches goals length
    while (newAnswers.length < (course.goals?.length || 0)) {
      newAnswers.push('');
    }
    await updateCourse(courseId!, { goalAnswers: newAnswers });
  };

  const handleDownloadGoals = (format: 'txt' | 'md') => {
    if (!course.goals || course.goals.length === 0) return;

    const answers = course.goalAnswers || [];
    let content = '';
    
    if (format === 'md') {
      content = `# ${course.title} - Goals and Answers\n\n`;
      course.goals.forEach((goal, index) => {
        content += `## Goal ${index + 1}\n\n**Question:** ${goal}\n\n**Answer:**\n\n${answers[index] || '(No answer yet)'}\n\n---\n\n`;
      });
    } else {
      content = `${course.title} - Goals and Answers\n${'='.repeat(course.title.length + 20)}\n\n`;
      course.goals.forEach((goal, index) => {
        content += `Goal ${index + 1}\n${'-'.repeat(10)}\n\nQuestion: ${goal}\n\nAnswer:\n${answers[index] || '(No answer yet)'}\n\n${'='.repeat(40)}\n\n`;
      });
    }

    downloadSummary({
      filename: `${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_goals`,
      content,
      format,
    });
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
          resources: o.resources.map(r => ({ description: r.description, summary: r.summary })),
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
                <div className="mt-2 flex items-center gap-x-3 text-xs whitespace-nowrap overflow-x-auto">
                  <span className={cn("flex items-center gap-1 shrink-0", getLessonsColorClass())}>
                    {stats.completedLessons}/{stats.totalLessons} lessons
                  </span>
                  <span className={cn("flex items-center gap-1 shrink-0", getGoalsColorClass())}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {stats.completedGoals}/{stats.totalGoals} goals
                  </span>
                  <span className={cn("flex items-center gap-1 shrink-0", getObjectivesColorClass())}>
                    <Target className="h-3.5 w-3.5" />
                    {stats.completedObjectives}/{stats.totalObjectives} objectives
                  </span>
                  <span className={cn("flex items-center gap-1 shrink-0", getResourcesColorClass())}>
                    {stats.completedResources}/{stats.totalResources} resources
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Goals */}
        {course.goals && course.goals.length > 0 && (
          <Card className="mb-6 card-shadow">
            <Collapsible open={isCourseGoalsOpen} onOpenChange={setIsCourseGoalsOpen}>
              <CardHeader className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">Course Goals</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {courseGoalsCompleted}/{courseGoalsTotal} goals
                    </span>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {isCourseGoalsOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <ul className="space-y-4">
                    {course.goals.map((goal, index) => (
                      <GoalItem
                        key={index}
                        goal={goal}
                        answer={course.goalAnswers?.[index] || ''}
                        index={index}
                        onAnswerChange={handleGoalAnswerChange}
                      />
                    ))}
                  </ul>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Course Summary */}
        <Card className="mb-6 card-shadow">
          <Collapsible open={isCourseSummaryOpen} onOpenChange={setIsCourseSummaryOpen}>
            <CardHeader className="py-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-base">Course Summary</CardTitle>
                <div className="flex items-center gap-2">
                  {course.summary && (
                    <Button variant="ghost" size="sm" onClick={() => handleDownload('txt')}>
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {isCourseSummaryOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <Textarea
                  value={course.summary}
                  onChange={(e) => handleSummaryChange(e.target.value)}
                  placeholder="Add your course summary and notes here..."
                  rows={4}
                  className="resize-y"
                />
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
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
                onDelete={async () => await deleteLesson(courseId!, lesson.id)}
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
            goals: course.goals || [],
            goalAnswers: course.goalAnswers || [],
          }}
        />
      </div>
    </div>
  );
}
