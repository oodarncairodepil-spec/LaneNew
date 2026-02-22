import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, CheckCircle2, Eye, FileText } from 'lucide-react';
import { downloadSummary, generatePDFPreview } from '@/lib/download';
import { cn } from '@/lib/utils';

interface GoalItemProps {
  goal: string;
  answer: string;
  index: number;
  onAnswerChange: (index: number, answer: string) => void;
  onDownload?: (format: 'txt' | 'md') => void;
  onPreviewPDF?: (content: string) => void;
}

export function GoalItem({ goal, answer, index, onAnswerChange, onDownload, onPreviewPDF }: GoalItemProps) {
  const [localAnswer, setLocalAnswer] = useState(answer);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync local state with prop when answer changes externally
  useEffect(() => {
    setLocalAnswer(answer);
  }, [answer]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Find the most natural-sounding female voice
  const findFemaleVoice = (): SpeechSynthesisVoice | null => {
    if (!voices.length) return null;

    const preferredNames = [
      'Samantha',
      'Samantha Premium',
      'Karen',
      'Victoria',
      'Fiona',
      'Moira',
      'Tessa',
      'Veena',
      'Google UK English Female',
      'Microsoft Zira',
      'Microsoft Hazel',
    ];
    
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

    const enhancedVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      return (
        (name.includes('enhanced') || name.includes('premium') || name.includes('neural')) &&
        (v.lang.startsWith('en'))
      );
    });
    if (enhancedVoice) return enhancedVoice;

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

    const femaleVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      return (
        name.includes('female') &&
        (v.lang.startsWith('en') || v.lang === 'en-US' || v.lang === 'en-GB')
      );
    });
    if (femaleVoice) return femaleVoice;

    const englishVoice = voices.find(v => 
      v.lang.startsWith('en') || v.lang === 'en-US' || v.lang === 'en-GB'
    );
    if (englishVoice) return englishVoice;

    return voices[0] || null;
  };

  const handlePlayPause = () => {
    const textToRead = localAnswer || goal;
    if (!textToRead || !textToRead.trim()) return;

    if (isPlaying) {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
        utteranceRef.current = null;
      }
      setIsPlaying(false);
    } else {
      if (!window.speechSynthesis) {
        console.warn('Speech synthesis not supported');
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance();
      
      // Preprocess text for better pronunciation
      let processedText = textToRead
        .replace(/\n+/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();

      utterance.text = processedText;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voice = findFemaleVoice();
      if (voice) {
        utterance.voice = voice;
      } else {
        utterance.lang = 'en-US';
      }

      utterance.onend = () => {
        setIsPlaying(false);
        utteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const handleAnswerChange = (value: string) => {
    setLocalAnswer(value);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce the update to avoid too many API calls
    timeoutRef.current = setTimeout(() => {
      onAnswerChange(index, value);
    }, 300);
  };

  const handleDownload = (format: 'txt' | 'md') => {
    if (!localAnswer && !goal) return;

    let content = '';
    if (format === 'md') {
      content = `## Goal ${index + 1}\n\n**Question:** ${goal}\n\n**Answer:**\n\n${localAnswer || '(No answer yet)'}`;
    } else {
      content = `Goal ${index + 1}\n${'='.repeat(10)}\n\nQuestion: ${goal}\n\nAnswer:\n${localAnswer || '(No answer yet)'}`;
    }

    downloadSummary({
      filename: `goal_${index + 1}_${goal.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
      content,
      format,
    });
  };

  const handlePreviewPDF = () => {
    if (!localAnswer || !localAnswer.trim()) return;
    
    // Only include the markdown text from the answer, nothing else
    const content = localAnswer.trim();
    
    if (onPreviewPDF) {
      onPreviewPDF(content);
    } else {
      // Fallback: generate preview directly
      const url = generatePDFPreview(content);
      window.open(url, '_blank');
    }
  };

  const handleDownloadPDF = () => {
    if (!localAnswer || !localAnswer.trim()) return;
    
    // Only include the markdown text from the answer, nothing else
    const content = localAnswer.trim();
    
    downloadSummary({
      filename: `goal_${index + 1}_${goal.substring(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
      content,
      format: 'pdf',
    });
  };

  const hasAnswer = localAnswer && localAnswer.trim().length > 0;

  return (
    <li className={cn(
      "flex items-start gap-2 p-3 rounded-lg border transition-colors",
      hasAnswer 
        ? "bg-success/5 border-success/50" 
        : "bg-transparent border-transparent"
    )}>
      <div className="mt-1">
        {hasAnswer ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <span className="text-muted-foreground">•</span>
        )}
      </div>
      <div className="flex-1 space-y-2">
        <span className="text-sm font-medium block">{goal}</span>
        <Textarea
          value={localAnswer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          placeholder="Write your answer here (Markdown supported)..."
          rows={4}
          className={cn(
            "resize-y text-sm transition-colors",
            hasAnswer && "border-success/50 focus-visible:ring-success/20"
          )}
        />
        <div className="flex items-center gap-2">
          {hasAnswer && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                className="h-8"
              >
                {isPlaying ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Play
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviewPDF}
                className="h-8"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadPDF}
                className="h-8"
              >
                <FileText className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </>
          )}
          {onDownload && (localAnswer || goal) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload('txt')}
                className="h-8"
              >
                <Download className="mr-2 h-4 w-4" />
                TXT
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload('md')}
                className="h-8"
              >
                <Download className="mr-2 h-4 w-4" />
                MD
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

