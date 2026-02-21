import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudy } from '@/contexts/StudyContext';
import { PageHeader } from '@/components/PageHeader';
import { ObjectiveCard } from '@/components/ObjectiveCard';
import { ObjectiveFormDialog } from '@/components/ObjectiveFormDialog';
import { LessonFormDialog } from '@/components/LessonFormDialog';
import { ResourceFormDialog } from '@/components/ResourceFormDialog';
import { EmptyState } from '@/components/EmptyState';
import { GoalItem } from '@/components/GoalItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Target, Edit, Download, HelpCircle, Copy, FileText, Eye } from 'lucide-react';
import { downloadSummary, formatLessonSummary, generatePDFPreview } from '@/lib/download';
import { useToast } from '@/hooks/use-toast';
import type { ProgressStatus, Resource } from '@/types/study';

export default function LessonDetailPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const {
    getLesson,
    updateLesson,
    addObjective,
    updateObjective,
    deleteObjective,
    addResource,
    updateResource,
    deleteResource,
    loading,
  } = useStudy();

  const lesson = getLesson(courseId!, lessonId!);
  const { toast } = useToast();
  const [showObjectiveForm, setShowObjectiveForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [showObjectivesPDFPreview, setShowObjectivesPDFPreview] = useState(false);
  const [objectivesPdfPreviewUrl, setObjectivesPdfPreviewUrl] = useState<string | null>(null);

  // Cleanup on unmount - MUST be before any early returns
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
      if (objectivesPdfPreviewUrl) {
        URL.revokeObjectURL(objectivesPdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl, objectivesPdfPreviewUrl]);

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

  const handleSummaryChange = async (summary: string) => {
    await updateLesson(courseId!, lessonId!, { summary });
  };

  const handleProjectQuestionsChange = async (projectQuestions: string) => {
    await updateLesson(courseId!, lessonId!, { projectQuestions });
  };

  const handleGoalAnswerChange = async (index: number, answer: string) => {
    const currentAnswers = lesson.goalAnswers || [];
    const newAnswers = [...currentAnswers];
    newAnswers[index] = answer;
    // Ensure array length matches goals length
    while (newAnswers.length < (lesson.goals?.length || 0)) {
      newAnswers.push('');
    }
    
    // Check if all goals have answers
    const allGoalsHaveAnswers = lesson.goals && lesson.goals.length > 0 && 
      lesson.goals.every((_, idx) => {
        const ans = newAnswers[idx] || '';
        return ans.trim().length > 0;
      });
    
    // Update lesson with new answers and status
    await updateLesson(courseId!, lessonId!, { 
      goalAnswers: newAnswers,
      ...(allGoalsHaveAnswers && { status: 'completed' as ProgressStatus })
    });
  };

  const handleDownloadGoals = (format: 'txt' | 'md' | 'pdf') => {
    if (!lesson.goals || lesson.goals.length === 0) return;

    const answers = lesson.goalAnswers || [];
    let content = '';
    
    if (format === 'md' || format === 'pdf') {
      content = `# ${lesson.title} - Goals and Answers\n\n`;
      lesson.goals.forEach((goal, index) => {
        content += `## Goal ${index + 1}\n\n**Question:** ${goal}\n\n**Answer:**\n\n${answers[index] || '(No answer yet)'}\n\n---\n\n`;
      });
    } else {
      content = `${lesson.title} - Goals and Answers\n${'='.repeat(lesson.title.length + 20)}\n\n`;
      lesson.goals.forEach((goal, index) => {
        content += `Goal ${index + 1}\n${'-'.repeat(10)}\n\nQuestion: ${goal}\n\nAnswer:\n${answers[index] || '(No answer yet)'}\n\n${'='.repeat(40)}\n\n`;
      });
    }

    downloadSummary({
      filename: `${lesson.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_goals`,
      content,
      format,
    });
  };

  const handlePreviewPDF = () => {
    if (!lesson.goals || lesson.goals.length === 0) return;

    const answers = lesson.goalAnswers || [];
    const content = `# ${lesson.title} - Goals and Answers\n\n`;
    const fullContent = content + lesson.goals.map((goal, index) => {
      return `## Goal ${index + 1}\n\n**Question:** ${goal}\n\n**Answer:**\n\n${answers[index] || '(No answer yet)'}\n\n---\n\n`;
    }).join('');

    // Clean up previous URL if exists
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }

    const url = generatePDFPreview(fullContent);
    setPdfPreviewUrl(url);
    setShowPDFPreview(true);
  };

  // Cleanup PDF preview URL on unmount or when dialog closes
  const handleClosePDFPreview = () => {
    setShowPDFPreview(false);
    if (pdfPreviewUrl) {
      // Delay cleanup to allow iframe to finish loading
      setTimeout(() => {
        URL.revokeObjectURL(pdfPreviewUrl);
        setPdfPreviewUrl(null);
      }, 100);
    }
  };

  const handleDownloadObjectivesPDF = () => {
    if (!lesson.objectives || lesson.objectives.length === 0) return;

    let content = `# ${lesson.title} - Objectives Summary\n\n`;
    lesson.objectives.forEach((objective, index) => {
      content += `## Objective ${index + 1}: ${objective.title}\n\n`;
      if (objective.summary && objective.summary.trim()) {
        content += `${objective.summary}\n\n`;
      } else {
        content += `*(No summary or notes yet)*\n\n`;
      }
      content += `---\n\n`;
    });

    downloadSummary({
      filename: `${lesson.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_objectives`,
      content,
      format: 'pdf',
    });
  };

  const handlePreviewObjectivesPDF = () => {
    if (!lesson.objectives || lesson.objectives.length === 0) return;

    let content = `# ${lesson.title} - Objectives Summary\n\n`;
    lesson.objectives.forEach((objective, index) => {
      content += `## Objective ${index + 1}: ${objective.title}\n\n`;
      if (objective.summary && objective.summary.trim()) {
        content += `${objective.summary}\n\n`;
      } else {
        content += `*(No summary or notes yet)*\n\n`;
      }
      content += `---\n\n`;
    });

    // Clean up previous URL if exists
    if (objectivesPdfPreviewUrl) {
      URL.revokeObjectURL(objectivesPdfPreviewUrl);
    }

    const url = generatePDFPreview(content);
    setObjectivesPdfPreviewUrl(url);
    setShowObjectivesPDFPreview(true);
  };

  const handleCloseObjectivesPDFPreview = () => {
    setShowObjectivesPDFPreview(false);
    if (objectivesPdfPreviewUrl) {
      setTimeout(() => {
        URL.revokeObjectURL(objectivesPdfPreviewUrl);
        setObjectivesPdfPreviewUrl(null);
      }, 100);
    }
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

  const handleCopyAllLinks = async () => {
    try {
      // Collect all links from all objectives' resources
      const links: string[] = [];
      
      lesson.objectives.forEach((objective) => {
        objective.resources.forEach((resource) => {
          if (resource.link && resource.link.trim()) {
            links.push(resource.link.trim());
          }
        });
      });

      // Remove duplicates
      const uniqueLinks = Array.from(new Set(links));

      if (uniqueLinks.length === 0) {
        toast({
          title: 'No links to copy',
          description: 'There are no links in the objectives.',
          variant: 'default',
        });
        return;
      }

      // Copy to clipboard (one link per line)
      const linksText = uniqueLinks.join('\n');
      await navigator.clipboard.writeText(linksText);

      toast({
        title: 'Links copied!',
        description: `Copied ${uniqueLinks.length} link${uniqueLinks.length === 1 ? '' : 's'} to clipboard.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to copy links:', error);
      toast({
        title: 'Failed to copy links',
        description: 'Please try again or copy manually.',
        variant: 'destructive',
      });
    }
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Lesson Goals</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviewPDF}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadGoals('pdf')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-4">
                {lesson.goals.map((goal, index) => (
                  <GoalItem
                    key={index}
                    goal={goal}
                    answer={lesson.goalAnswers?.[index] || ''}
                    index={index}
                    onAnswerChange={handleGoalAnswerChange}
                  />
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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyAllLinks}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Links
            </Button>
            <Button size="sm" onClick={() => setShowObjectiveForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Objective
            </Button>
          </div>
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
            goalAnswers: lesson.goalAnswers || [],
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

        {/* PDF Preview Dialog - Fullscreen (Lesson Goals) */}
        <Dialog open={showPDFPreview} onOpenChange={handleClosePDFPreview}>
          <DialogContent className="max-w-none w-screen h-screen max-h-screen p-0 m-0 translate-x-0 translate-y-0 left-0 top-0 rounded-none">
            <div className="relative w-full h-full flex flex-col">
              {/* Minimal header with close button */}
              <div className="absolute top-4 right-4 z-50">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClosePDFPreview}
                  className="bg-background/90 backdrop-blur-sm"
                >
                  Close
                </Button>
              </div>
              {/* Fullscreen PDF iframe */}
              {pdfPreviewUrl && (
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* PDF Preview Dialog - Fullscreen (Objectives) */}
        <Dialog open={showObjectivesPDFPreview} onOpenChange={handleCloseObjectivesPDFPreview}>
          <DialogContent className="max-w-none w-screen h-screen max-h-screen p-0 m-0 translate-x-0 translate-y-0 left-0 top-0 rounded-none">
            <div className="relative w-full h-full flex flex-col">
              {/* Minimal header with close button */}
              <div className="absolute top-4 right-4 z-50">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCloseObjectivesPDFPreview}
                  className="bg-background/90 backdrop-blur-sm"
                >
                  Close
                </Button>
              </div>
              {/* Fullscreen PDF iframe */}
              {objectivesPdfPreviewUrl && (
                <iframe
                  src={objectivesPdfPreviewUrl}
                  className="w-full h-full border-0"
                  title="Objectives PDF Preview"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
