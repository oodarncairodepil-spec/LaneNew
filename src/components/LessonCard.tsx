import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Lesson } from '@/types/study';
import { Card, CardContent } from '@/components/ui/card';
import { MoreVertical, Trash2, Target, CheckCircle2, Eye, ScrollText, Play, Pause, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { generatePDFPreview } from '@/lib/download';
import { speakText, pauseSpeech, resumeSpeech, getEnglishVoices } from '@/lib/speech';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface LessonCardProps {
  lesson: Lesson;
  courseId: string;
  onDelete: () => void;
}

const statusBorderClass: Record<Lesson['status'], string> = {
  not_started: 'border-border',
  in_progress: 'border-warning/60',
  completed: 'border-success/60',
};

const MOBILE_BREAKPOINT = 768;

export function LessonCard({ lesson, courseId, onDelete }: LessonCardProps) {
  const navigate = useNavigate();
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [ttsSpeaking, setTtsSpeaking] = useState(false);
  const [ttsPaused, setTtsPaused] = useState(false);
  const [englishVoices, setEnglishVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
  );
  const [previewGoalIndex, setPreviewGoalIndex] = useState<number | 'all'>('all');
  const [showGoalPickerSheet, setShowGoalPickerSheet] = useState(false);
  const [goalPickerMode, setGoalPickerMode] = useState<'text' | 'pdf'>('text');

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!showTextPreview && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setTtsSpeaking(false);
      setTtsPaused(false);
    }
  }, [showTextPreview]);

  // Warm up voices when text preview opens (helps mobile load voices after user gesture)
  useEffect(() => {
    if (showTextPreview && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, [showTextPreview]);

  // Load English (US/UK) voices when text preview is open; refresh when voices load (e.g. on mobile)
  useEffect(() => {
    if (!showTextPreview || typeof window === 'undefined' || !window.speechSynthesis) return;
    const update = () => setEnglishVoices(getEnglishVoices());
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
  }, [showTextPreview]);

  const textPreviewContent = (lesson.goals || [])
    .map((_, i) => ((lesson.goalAnswers || [])[i] || '').trim())
    .filter(Boolean)
    .join('\n\n');

  const getPreviewContent = (goalIndex: number | 'all'): string => {
    if (goalIndex === 'all') return textPreviewContent;
    return (lesson.goalAnswers || [])[goalIndex]?.trim() ?? '';
  };

  const totalObjectives = lesson.objectives?.length || 0;
  const completedObjectives = lesson.objectives?.filter(o => o?.status === 'completed').length || 0;

  const totalResources = (lesson.objectives || []).reduce((sum, o) => sum + (o.resources?.length || 0), 0);
  const completedResources = (lesson.objectives || []).reduce(
    (sum, o) => sum + (o.resources?.filter(r => r?.status === 'completed').length || 0),
    0
  );

  // Calculate goals completion
  const totalGoals = lesson.goals?.length || 0;
  const completedGoals = lesson.goalAnswers?.filter((answer, index) => {
    return answer && answer.trim().length > 0 && index < (lesson.goals?.length || 0);
  }).length || 0;
  
  // Check if all goals are filled (have answers) - same logic as LessonDetailPage
  const allGoalsFilled = lesson.goals && lesson.goals.length > 0 && 
    lesson.goals.every((_, idx) => {
      const ans = (lesson.goalAnswers || [])[idx] || '';
      return ans.trim().length > 0;
    });

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

  const getResourcesColorClass = () => {
    if (totalResources === 0) return 'text-muted-foreground';
    if (completedResources === 0) return 'text-muted-foreground';
    if (completedResources === totalResources) return 'text-success';
    return 'text-warning';
  };

  const openPDFWithContent = (content: string) => {
    if (!content.trim()) return;
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    const url = generatePDFPreview(content);
    setPdfPreviewUrl(url);
    setShowPDFPreview(true);
  };

  const handlePreviewPDF = (e: React.MouseEvent, content?: string) => {
    e.stopPropagation();
    if (!lesson.goals || lesson.goals.length === 0) return;
    const toUse = content ?? (lesson.goalAnswers || [])
      .map((a, i) => (i < (lesson.goals?.length ?? 0) ? (a || '').trim() : ''))
      .filter(Boolean)
      .join('\n\n');
    if (!toUse.trim()) return;
    openPDFWithContent(toUse);
  };

  const handleClosePDFPreview = (open: boolean) => {
    if (!open) {
      setShowPDFPreview(false);
      if (pdfPreviewUrl) {
        setTimeout(() => {
          URL.revokeObjectURL(pdfPreviewUrl);
          setPdfPreviewUrl(null);
        }, 100);
      }
    }
  };

  return (
    <Card 
      className={cn(
        'group cursor-pointer card-shadow card-hover animate-fade-in border-l-4',
        statusBorderClass[lesson.status]
      )}
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
              <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8 shrink-0">
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

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {totalGoals > 0 && (
              <div className="flex items-center gap-2">
                <span className={cn("flex items-center gap-1", getGoalsColorClass())}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {completedGoals}/{totalGoals} goals
                </span>
                {allGoalsFilled && (
                  isMobile ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 sm:h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (totalGoals > 1) {
                          setGoalPickerMode('text');
                          setShowGoalPickerSheet(true);
                        } else {
                          setPreviewGoalIndex(0);
                          setShowTextPreview(true);
                        }
                      }}
                    >
                      <ScrollText className="h-3 w-3 mr-1" />
                      Preview text
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 sm:h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (totalGoals > 1) {
                          setGoalPickerMode('pdf');
                          setShowGoalPickerSheet(true);
                        } else {
                          setPreviewGoalIndex(0);
                          handlePreviewPDF(e, getPreviewContent(0));
                        }
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview PDF
                    </Button>
                  )
                )}
              </div>
            )}
            <span className={cn("flex items-center gap-1", getObjectivesColorClass())}>
              <Target className="h-3.5 w-3.5" />
              {completedObjectives}/{totalObjectives} objectives
            </span>
            {totalResources > 0 && (
              <span className={cn("flex items-center gap-1", getResourcesColorClass())}>
                <FileText className="h-3.5 w-3.5" />
                {completedResources}/{totalResources} resources
              </span>
            )}
          </div>
        </div>
      </CardContent>

      {/* Goal picker Sheet (multiple goals): choose which goal to preview */}
      <Sheet open={showGoalPickerSheet} onOpenChange={setShowGoalPickerSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Preview which goal?</SheetTitle>
          </SheetHeader>
          <div className="grid gap-2 py-4">
            {(lesson.goals || []).map((_, i) => {
              const answer = (lesson.goalAnswers || [])[i] || '';
              const firstLine = answer.trim().split(/\n/)[0] || '';
              const snippet = firstLine.length > 56 ? firstLine.slice(0, 56) + '…' : firstLine;
              return (
                <Button
                  key={i}
                  variant="outline"
                  className="w-full justify-start h-12 min-h-[44px] text-left normal-case font-normal"
                  onClick={(e) => {
                    e.stopPropagation();
                    const idx = i;
                    setPreviewGoalIndex(idx);
                    setShowGoalPickerSheet(false);
                    if (goalPickerMode === 'text') setShowTextPreview(true);
                    else openPDFWithContent(getPreviewContent(idx));
                  }}
                >
                  <span className="truncate block w-full text-left">{snippet || `Goal ${i + 1}`}</span>
                </Button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* PDF Preview Dialog - Fullscreen (desktop) */}
      <Dialog open={showPDFPreview} onOpenChange={handleClosePDFPreview}>
        <DialogContent
          className="max-w-none w-screen h-screen max-h-screen p-0 m-0 translate-x-0 translate-y-0 left-0 top-0 rounded-none"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Lesson Goals PDF Preview</DialogTitle>
          <DialogDescription className="sr-only">Preview of lesson goals and answers as PDF</DialogDescription>
          <div className="relative w-full h-full flex flex-col">
            <div className="absolute top-4 right-4 z-50">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClosePDFPreview(false);
                }}
                className="bg-background/90 backdrop-blur-sm"
              >
                Close
              </Button>
            </div>
            {pdfPreviewUrl && (
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full border-0"
                title="Lesson Goals PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full-screen text preview (mobile) */}
      <Dialog open={showTextPreview} onOpenChange={setShowTextPreview}>
        <DialogContent
          className="max-w-none w-screen h-[100dvh] h-screen max-h-screen p-0 m-0 translate-x-0 translate-y-0 left-0 top-0 rounded-none flex flex-col [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">Lesson goals content</DialogTitle>
          <DialogDescription className="sr-only">Full-screen preview of lesson goal answers</DialogDescription>
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-none flex items-center justify-between h-14 shrink-0 px-4 border-b gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {totalGoals > 1 && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {previewGoalIndex === 'all' ? 'All goals' : `Goal ${(previewGoalIndex as number) + 1}`}
                  </span>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    const text = getPreviewContent(previewGoalIndex) || '';
                    if (ttsSpeaking && ttsPaused) {
                      // Re-speak from start with current selected voice (resume keeps old voice)
                      if (text) {
                        speakText(text, {
                          voice: selectedVoice,
                          onEnd: () => {
                            setTtsSpeaking(false);
                            setTtsPaused(false);
                          },
                        });
                        setTtsPaused(false);
                      }
                    } else if (ttsSpeaking && !ttsPaused) {
                      pauseSpeech();
                      setTtsPaused(true);
                    } else if (text) {
                      speakText(text, {
                        voice: selectedVoice,
                        onEnd: () => {
                          setTtsSpeaking(false);
                          setTtsPaused(false);
                        },
                      });
                      setTtsSpeaking(true);
                      setTtsPaused(false);
                    }
                  }}
                  className="bg-background/90 backdrop-blur-sm shrink-0"
                  aria-label={
                    ttsSpeaking ? (ttsPaused ? 'Resume' : 'Pause') : 'Play text to speech'
                  }
                  disabled={!getPreviewContent(previewGoalIndex)?.trim()}
                >
                  {ttsSpeaking ? (
                    ttsPaused ? (
                      <>
                        <Play className="h-4 w-4 mr-1.5" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4 mr-1.5" />
                        Pause
                      </>
                    )
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1.5" />
                      Play
                    </>
                  )}
                </Button>
                <Select
                  value={selectedVoice ? `${selectedVoice.name}|${selectedVoice.lang}` : 'default'}
                  onOpenChange={(open) => open && setEnglishVoices(getEnglishVoices())}
                  onValueChange={(val) => {
                    if (val === 'default') {
                      setSelectedVoice(null);
                      return;
                    }
                    const v = englishVoices.find((v) => `${v.name}|${v.lang}` === val);
                    if (v) setSelectedVoice(v);
                  }}
                  disabled={ttsSpeaking && !ttsPaused}
                >
                  <SelectTrigger className="w-[180px] h-9 text-xs bg-background/90 backdrop-blur-sm">
                    <SelectValue placeholder="Voice (en-US / en-GB)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default (UK preferred)</SelectItem>
                    {englishVoices.map((v) => (
                      <SelectItem key={`${v.name}|${v.lang}`} value={`${v.name}|${v.lang}`}>
                        {v.name} ({v.lang})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {ttsSpeaking && !ttsPaused && (
                  <span className="text-xs text-muted-foreground shrink-0">Pause to change voice</span>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => { e.stopPropagation(); setShowTextPreview(false); }}
                className="bg-background/90 backdrop-blur-sm shrink-0"
              >
                Close
              </Button>
            </div>
            <div
              className="flex-1 min-h-0 overflow-auto p-4 text-foreground bg-background"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed max-w-prose">
                {getPreviewContent(previewGoalIndex) || 'No content'}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
