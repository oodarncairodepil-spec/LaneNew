import { useState, useEffect, useRef } from 'react';
import type { Resource } from '@/types/study';
import { useStudy } from '@/contexts/StudyContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/StatusBadge';
import { FileText, Video, ExternalLink, MoreVertical, Trash2, Edit, Download, CheckCircle, Play, Pause, Copy, FileText as FileTextIcon, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ResourceViewer } from './ResourceViewer';
import { isVideoUrl } from '@/lib/resource-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { downloadSummary, formatResourceSummary, generatePDFPreview } from '@/lib/download';
import { useToast } from '@/hooks/use-toast';
import type { ProgressStatus } from '@/types/study';

interface ResourceCardProps {
  resource: Resource;
  courseId: string;
  lessonId: string;
  objectiveId: string;
  onDelete: () => void;
  onEdit: () => void;
}

export function ResourceCard({ resource, courseId, lessonId, objectiveId, onDelete, onEdit }: ResourceCardProps) {
  const { updateResourceStatus, updateResource } = useStudy();
  const { toast } = useToast();
  const Icon = isVideoUrl(resource.link) ? Video : FileText;
  const [isPlaying, setIsPlaying] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [summaryText, setSummaryText] = useState(resource.summary || '');
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const handleDownload = (format: 'txt' | 'md') => {
    const content = formatResourceSummary(resource.description, resource.link, resource.summary, format);
    downloadSummary({
      filename: resource.description.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50),
      content,
      format,
    });
  };

  const handleCopyLink = async () => {
    if (!resource.link || !resource.link.trim()) {
      toast({
        title: 'No link to copy',
        description: 'This resource does not have a link.',
        variant: 'default',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(resource.link.trim());
      toast({
        title: 'Link copied!',
        description: 'The resource link has been copied to your clipboard.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: 'Failed to copy link',
        description: 'Please try again or copy manually.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveSummary = async () => {
    await updateResource(courseId, lessonId, objectiveId, resource.id, { summary: summaryText });
    setShowSummaryDialog(false);
    toast({
      title: 'Summary saved',
      description: 'Your summary has been saved successfully.',
      variant: 'default',
    });
  };

  const handleDownloadPDF = () => {
    const content = formatResourceSummary(resource.description, resource.link || '', resource.summary || '', 'md');
    downloadSummary({
      filename: resource.description.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50),
      content,
      format: 'pdf',
    });
  };

  const handlePreviewPDF = () => {
    const content = formatResourceSummary(resource.description, resource.link || '', resource.summary || '', 'md');
    
    // Clean up previous URL if exists
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }

    const url = generatePDFPreview(content);
    setPdfPreviewUrl(url);
    setShowPDFPreview(true);
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

  // Update summary text when resource changes
  useEffect(() => {
    setSummaryText(resource.summary || '');
  }, [resource.summary]);

  const handleStatusChange = async (status: ProgressStatus) => {
    await updateResourceStatus(courseId, lessonId, objectiveId, resource.id, status);
  };

  // Find the most natural-sounding female voice
  const findFemaleVoice = (): SpeechSynthesisVoice | null => {
    if (!voices.length) return null;

    // Priority list: Most natural-sounding voices (best quality first)
    // Samantha is the most natural on macOS, often considered the best
    const preferredNames = [
      'Samantha',           // macOS - Most natural, premium quality
      'Samantha Premium',   // macOS - Enhanced version
      'Karen',             // macOS/iOS - Very natural
      'Victoria',          // macOS - Natural and clear
      'Fiona',             // macOS - Soothing
      'Moira',             // iOS - Natural Irish accent
      'Tessa',             // South African - Natural
      'Veena',             // Indian - Natural
      'Google UK English Female',  // Chrome - Good quality
      'Microsoft Zira',    // Windows - Natural
      'Microsoft Hazel',   // Windows - Natural
    ];
    
    // First: Try exact matches for premium/natural voices
    for (const name of preferredNames) {
      const voice = voices.find(v => {
        const voiceName = v.name;
        return (
          voiceName === name || 
          voiceName.includes(name) ||
          (name === 'Samantha' && voiceName.includes('Samantha') && !voiceName.includes('Enhanced'))
        ) && (
          v.lang.startsWith('en') || 
          v.lang === 'en-US' || 
          v.lang === 'en-GB' ||
          v.lang === 'en-AU' ||
          v.lang === 'en-IE'
        );
      });
      if (voice) return voice;
    }

    // Second: Look for "Enhanced" or "Premium" voices (usually better quality)
    const enhancedVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      return (
        (name.includes('enhanced') || name.includes('premium') || name.includes('neural')) &&
        (v.lang.startsWith('en'))
      );
    });
    if (enhancedVoice) return enhancedVoice;

    // Third: Try to find any known natural female voice with English
    const naturalFemaleVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      return (
        (name.includes('samantha') || name.includes('karen') || name.includes('victoria') || 
         name.includes('fiona') || name.includes('moira') || name.includes('tessa') ||
         name.includes('veena') || name.includes('zira') || name.includes('hazel') ||
         name.includes('susan') || name.includes('anna') || name.includes('melissa')) &&
        (v.lang.startsWith('en') || v.lang === 'en-US' || v.lang === 'en-GB')
      );
    });
    if (naturalFemaleVoice) return naturalFemaleVoice;

    // Fourth: Look for any female voice indicator with English
    const femaleVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      return (
        name.includes('female') &&
        (v.lang.startsWith('en') || v.lang === 'en-US' || v.lang === 'en-GB')
      );
    });
    if (femaleVoice) return femaleVoice;

    // Fifth: Try to find any English voice (fallback)
    const englishVoice = voices.find(v => 
      v.lang.startsWith('en') || v.lang === 'en-US' || v.lang === 'en-GB'
    );
    if (englishVoice) return englishVoice;

    // Last resort: return default voice
    return voices[0] || null;
  };

  const handlePlayPause = () => {
    if (!resource.summary || !resource.summary.trim()) return;

    if (isPlaying) {
      // Stop speech
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Start speech
      if (!window.speechSynthesis) {
        console.warn('Speech synthesis not supported');
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      // Preprocess text for more natural speech
      // Add slight pauses after sentences and improve punctuation handling
      let textToSpeak = resource.summary
        .replace(/\. /g, '. ') // Ensure space after periods
        .replace(/\.\.\./g, '. ') // Replace ellipsis with pause
        .replace(/\n\n/g, '. ') // Replace double newlines with pause
        .replace(/\n/g, ' ') // Replace single newlines with space
        .trim();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const selectedVoice = findFemaleVoice();
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang || 'en-US';
      } else {
        utterance.lang = 'en-US';
      }
      
      // Optimized parameters for more natural, human-like speech
      // These values are tuned based on research for most natural-sounding TTS
      utterance.rate = 0.88;   // Slower rate (0.88) sounds more natural and less robotic
      utterance.pitch = 0.97;  // Slightly lower pitch (0.97) for warmer, more natural female voice
      utterance.volume = 0.92; // Slightly lower volume (0.92) for softer, more pleasant sound

      // Handle events
      utterance.onend = () => {
        setIsPlaying(false);
        utteranceRef.current = null;
      };

      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        setIsPlaying(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  // Load voices and handle cleanup
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    // Load voices immediately (may be empty on first call)
    loadVoices();

    // Listen for voices changed event (voices may load asynchronously)
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Cleanup: stop speech when component unmounts or resource changes
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
      setIsPlaying(false);
      utteranceRef.current = null;
    };
  }, [resource.id]); // Re-run when resource changes

  return (
    <Card className="p-3 bg-card/50 border-border/50">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <CheckCircle 
            className={`h-5 w-5 ${
              resource.status === 'completed' 
                ? 'text-success fill-success/20' 
                : resource.status === 'in_progress'
                ? 'text-warning fill-warning/20'
                : 'text-muted-foreground'
            }`} 
          />
        </div>

        <div className="min-w-0 flex-1">
          {resource.description && (
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className={`truncate font-medium text-sm ${resource.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {resource.description}
              </span>
            </div>
          )}

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {resource.link && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowViewer(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-info hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open resource
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyLink();
                  }}
                  title="Copy link"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
            {resource.summary && resource.summary.trim() && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviewPDF();
                }}
              >
                <Eye className="mr-1.5 h-3 w-3" />
                Preview PDF
              </Button>
            )}
            <Select 
              value={resource.status} 
              onValueChange={(v) => handleStatusChange(v as ProgressStatus)}
            >
              <SelectTrigger className="h-7 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {resource.summary && (
            <div className="mt-2 flex items-start gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 mt-0.5"
                onClick={handlePlayPause}
                aria-label={isPlaying ? 'Pause reading' : 'Play reading'}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <p className="flex-1 text-sm text-muted-foreground line-clamp-2">
                {resource.summary}
              </p>
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Resource
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowSummaryDialog(true)}>
              <FileTextIcon className="mr-2 h-4 w-4" />
              Edit Summary
            </DropdownMenuItem>
            {resource.link && resource.link.trim() && (
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handlePreviewPDF}>
              <Eye className="mr-2 h-4 w-4" />
              Preview PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Download PDF
            </DropdownMenuItem>
            {resource.summary && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDownload('txt')}>
                  <Download className="mr-2 h-4 w-4" />
                  Download as TXT
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('md')}>
                  <Download className="mr-2 h-4 w-4" />
                  Download as Markdown
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Resource
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ResourceViewer
        open={showViewer}
        onOpenChange={setShowViewer}
        resource={resource}
      />

      {/* Summary Edit Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Summary / Notes</DialogTitle>
            <DialogDescription>
              Add or edit your summary and notes for this resource. Supports Markdown formatting.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resource-summary">Summary / Notes (Markdown)</Label>
              <Textarea
                id="resource-summary"
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                placeholder="Add your summary, notes, or key takeaways for this resource (supports Markdown)..."
                rows={8}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground">
                Use Markdown formatting for better organization (e.g., **bold**, *italic*, lists, etc.)
              </p>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setShowSummaryDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveSummary}>
              Save Summary
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog - Fullscreen */}
      <Dialog open={showPDFPreview} onOpenChange={handleClosePDFPreview}>
        <DialogContent className="max-w-none w-screen h-screen max-h-screen p-0 m-0 translate-x-0 translate-y-0 left-0 top-0 rounded-none">
          <div className="relative w-full h-full flex flex-col">
            {/* Minimal header with close button */}
            <div className="absolute top-4 right-4 z-50">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleClosePDFPreview(false)}
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
                title="Resource PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
