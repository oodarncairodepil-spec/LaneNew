import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudy } from '@/contexts/StudyContext';
import { PageHeader } from '@/components/PageHeader';
import { ObjectiveCard } from '@/components/ObjectiveCard';
import { ObjectiveFormDialog } from '@/components/ObjectiveFormDialog';
import { LessonFormDialog } from '@/components/LessonFormDialog';
import { ResourceFormDialog } from '@/components/ResourceFormDialog';
import { EmptyState } from '@/components/EmptyState';
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
import { Plus, Target, Edit, Download, HelpCircle } from 'lucide-react';
import { downloadSummary, formatLessonSummary } from '@/lib/download';
import type { ProgressStatus, Resource } from '@/types/study';

export default function LessonDetailPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const {
    getLesson,
    updateLesson,
    updateLessonStatus,
    addObjective,
    deleteObjective,
    addResource,
    updateResource,
    deleteResource,
    loading,
  } = useStudy();

  const lesson = getLesson(courseId!, lessonId!);
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl py-6 pb-24">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading lesson...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    navigate(`/course/${courseId}`);
    return null;
  }

  const handleAddObjective = async (data: { title: string; summary: string; status: ProgressStatus }) => {
    await addObjective(courseId!, lessonId!, {
      title: data.title,
      summary: data.summary,
      status: data.status,
    });
  };

  const handleStatusChange = async (status: ProgressStatus) => {
    await updateLessonStatus(courseId!, lessonId!, status);
  };

  const handleSummaryChange = async (summary: string) => {
    await updateLesson(courseId!, lessonId!, { summary });
  };

  const handleProjectQuestionsChange = async (projectQuestions: string) => {
    await updateLesson(courseId!, lessonId!, { projectQuestions });
  };

  const handleAddResource = (objectiveId: string) => {
    setSelectedObjectiveId(objectiveId);
    setEditingResource(null);
    setShowResourceForm(true);
  };

  const handleEditResource = (objectiveId: string, resource: Resource) => {
    setSelectedObjectiveId(objectiveId);
    setEditingResource(resource);
    setShowResourceForm(true);
  };

  const handleResourceSubmit = async (data: { description: string; link: string; summary: string; status: ProgressStatus }) => {
    if (selectedObjectiveId) {
      if (editingResource) {
        await updateResource(courseId!, lessonId!, selectedObjectiveId, editingResource.id, data);
      } else {
        await addResource(courseId!, lessonId!, selectedObjectiveId, data);
      }
    }
  };

  const handleDownload = (format: 'txt' | 'md') => {
    const content = formatLessonSummary(
      lesson.title,
      lesson.summary,
      lesson.projectQuestions,
      lesson.objectives.map(o => ({
        title: o.title,
        resources: o.resources.map(r => ({ description: r.description, summary: r.summary })),
      })),
      format
    );
    downloadSummary({
      filename: lesson.title.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
      content,
      format,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-6 pb-24">
        <PageHeader
          title={lesson.title}
          backTo={`/course/${courseId}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleDownload('md')}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowLessonForm(true)}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          }
        />

        {/* Status */}
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select value={lesson.status} onValueChange={(v) => handleStatusChange(v as ProgressStatus)}>
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

        {/* Lesson Summary */}
        <Card className="mb-4 card-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lesson Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              value={lesson.summary}
              onChange={(e) => handleSummaryChange(e.target.value)}
              placeholder="Add your lesson summary and key takeaways..."
              rows={4}
              className="resize-y"
            />
          </CardContent>
        </Card>

        {/* Lesson Goals */}
        {lesson.goals && lesson.goals.length > 0 && (
          <Card className="mb-6 card-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lesson Goals</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {lesson.goals.map((goal, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span className="flex-1 text-sm">{goal}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Project Questions */}
        <Card className="mb-6 card-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Project Questions / Notes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              value={lesson.projectQuestions}
              onChange={(e) => handleProjectQuestionsChange(e.target.value)}
              placeholder="Questions or points to address for your project..."
              rows={3}
              className="resize-y"
            />
          </CardContent>
        </Card>

        {/* Objectives */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Objectives</h2>
          <Button size="sm" onClick={() => setShowObjectiveForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Objective
          </Button>
        </div>

        {lesson.objectives.length > 0 ? (
          <div className="space-y-4">
            {lesson.objectives.map((objective) => (
              <ObjectiveCard
                key={objective.id}
                objective={objective}
                courseId={courseId!}
                lessonId={lessonId!}
                onDelete={async () => await deleteObjective(courseId!, lessonId!, objective.id)}
                onAddResource={() => handleAddResource(objective.id)}
                onDeleteResource={async (resourceId) => await deleteResource(courseId!, lessonId!, objective.id, resourceId)}
                onEditResource={(resourceId) => {
                  const resource = objective.resources.find(r => r.id === resourceId);
                  if (resource) handleEditResource(objective.id, resource);
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Target className="h-6 w-6" />}
            title="No objectives yet"
            description="Add learning objectives to organize your study resources."
            action={
              <Button onClick={() => setShowObjectiveForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Objective
              </Button>
            }
          />
        )}

        <ObjectiveFormDialog
          open={showObjectiveForm}
          onOpenChange={setShowObjectiveForm}
          onSubmit={handleAddObjective}
        />

        <LessonFormDialog
          open={showLessonForm}
          onOpenChange={setShowLessonForm}
          onSubmit={async (data) => await updateLesson(courseId!, lessonId!, data)}
          initialData={{
            title: lesson.title,
            summary: lesson.summary,
            projectQuestions: lesson.projectQuestions,
            goals: lesson.goals || [],
          }}
          isEditing
        />

        <ResourceFormDialog
          open={showResourceForm}
          onOpenChange={setShowResourceForm}
          onSubmit={handleResourceSubmit}
          initialData={editingResource || undefined}
          isEditing={Boolean(editingResource)}
        />
      </div>
    </div>
  );
}
