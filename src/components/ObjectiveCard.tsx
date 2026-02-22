import { useState, useEffect } from 'react';
import type { Objective } from '@/types/study';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, ChevronDown, ChevronUp, MoreVertical, Trash2, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ResourceCard } from './ResourceCard';

interface ObjectiveCardProps {
  objective: Objective;
  courseId: string;
  lessonId: string;
  onDelete: () => void;
  onAddResource: () => void;
  onDeleteResource: (resourceId: string) => void;
  onEditResource: (resourceId: string) => void;
}

export function ObjectiveCard({
  objective,
  courseId,
  lessonId,
  onDelete,
  onAddResource,
  onDeleteResource,
  onEditResource,
}: ObjectiveCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7257/ingest/1f6182fe-f87d-4bdd-9862-0f5f2955e2db',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ObjectiveCard.tsx:42',message:'ObjectiveCard rendered',data:{objectiveId:objective.id,objectiveTitle:objective.title,lessonId,courseId},timestamp:Date.now(),runId:'debug5',hypothesisId:'E'})}).catch(()=>{});
  }, [objective.id, lessonId, courseId]);
  // #endregion

  const completedResources = objective.resources.filter(r => r.status === 'completed').length;
  const totalResources = objective.resources.length;

  // Determine icon color based on resource statuses
  const getIconColorClasses = () => {
    if (totalResources === 0) {
      // No resources - grey
      return 'bg-muted/20 text-muted-foreground';
    }

    const hasInProgressOrCompleted = objective.resources.some(
      r => r.status === 'in_progress' || r.status === 'completed'
    );
    const allCompleted = objective.resources.every(r => r.status === 'completed');

    if (allCompleted) {
      // All completed - green
      return 'bg-success/20 text-success';
    } else if (hasInProgressOrCompleted) {
      // At least one in progress or completed - orange (current)
      return 'bg-accent/20 text-accent';
    } else {
      // All not started - grey
      return 'bg-muted/20 text-muted-foreground';
    }
  };

  return (
    <Card className="card-shadow animate-fade-in overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${getIconColorClasses()}`}>
              <Target className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate font-medium text-foreground">{objective.title}</h4>
              {objective.summary && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{objective.summary}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {completedResources}/{totalResources} resources completed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Objective
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <CardContent className="p-4">
            <div className="space-y-3">
              {objective.resources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  courseId={courseId}
                  lessonId={lessonId}
                  objectiveId={objective.id}
                  onDelete={() => onDeleteResource(resource.id)}
                  onEdit={() => onEditResource(resource.id)}
                />
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={onAddResource}
                className="w-full border-dashed"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Resource
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
