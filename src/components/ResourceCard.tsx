import type { Resource } from '@/types/study';
import { useStudy } from '@/contexts/StudyContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Video, FileText, ExternalLink, MoreVertical, Trash2, Edit, Download, CheckCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { downloadSummary, formatResourceSummary } from '@/lib/download';
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
  const { updateResourceStatus } = useStudy();
  const Icon = resource.type === 'video' ? Video : FileText;

  const handleDownload = (format: 'txt' | 'md') => {
    const content = formatResourceSummary(resource.title, resource.link, resource.summary, format);
    downloadSummary({
      filename: resource.title.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
      content,
      format,
    });
  };

  const toggleComplete = () => {
    const newStatus: ProgressStatus = resource.status === 'completed' ? 'not_started' : 'completed';
    updateResourceStatus(courseId, lessonId, objectiveId, resource.id, newStatus);
  };

  return (
    <Card className="p-3 bg-card/50 border-border/50">
      <div className="flex items-start gap-3">
        <button
          onClick={toggleComplete}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-success transition-colors"
        >
          <CheckCircle 
            className={`h-5 w-5 ${resource.status === 'completed' ? 'text-success fill-success/20' : ''}`} 
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={`truncate font-medium text-sm ${resource.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {resource.title}
            </span>
          </div>

          {resource.link && (
            <a
              href={resource.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-info hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              Open resource
            </a>
          )}

          {resource.summary && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {resource.summary}
            </p>
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
    </Card>
  );
}
