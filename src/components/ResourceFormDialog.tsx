import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ProgressStatus, Resource } from '@/types/study';

/** Try to get page title from URL; returns null on CORS/network error or no title. */
async function fetchTitleFromUrl(urlString: string): Promise<string | null> {
  try {
    const url = new URL(urlString);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const res = await fetch(urlString, { method: 'GET', mode: 'cors', signal: AbortSignal.timeout(8000) });
    const html = await res.text();
    const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const raw = match?.[1] ?? null;
    if (!raw) return null;
    return raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 300) || null;
  } catch {
    return null;
  }
}

function descriptionFromHostname(urlString: string): string {
  try {
    const hostname = new URL(urlString).hostname.replace(/^www\./, '');
    return `Resource from ${hostname}`;
  } catch {
    return 'Resource';
  }
}

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { description: string; link: string; summary: string; status: ProgressStatus }) => void;
  initialData?: Resource;
  isEditing?: boolean;
}

export function ResourceFormDialog({ open, onOpenChange, onSubmit, initialData, isEditing }: ResourceFormDialogProps) {
  const [description, setDescription] = useState(initialData?.description || '');
  const [link, setLink] = useState(initialData?.link || '');
  const [summary, setSummary] = useState(initialData?.summary || '');

  useEffect(() => {
    if (open) {
      if (isEditing && initialData) {
        setDescription(initialData.description || '');
        setLink(initialData.link || '');
        setSummary(initialData.summary || '');
      } else {
        setDescription(initialData?.description || '');
        setLink(initialData?.link || '');
        setSummary(initialData?.summary || '');
      }
    } else {
      if (!isEditing) {
        setDescription('');
        setLink('');
        setSummary('');
      }
    }
  }, [open, initialData, isEditing]);

  const fillDescriptionFromLink = useCallback(async () => {
    const trimmed = link.trim();
    if (!trimmed || isEditing) return;
    try {
      const u = new URL(trimmed);
      if (!['http:', 'https:'].includes(u.protocol)) return;
    } catch {
      return;
    }
    const title = await fetchTitleFromUrl(trimmed);
    setDescription((prev) => (prev.trim() ? prev : title || descriptionFromHostname(trimmed)));
  }, [link, isEditing]);

  useEffect(() => {
    if (isEditing || !link.trim()) return;
    try {
      new URL(link.trim());
    } catch {
      return;
    }
    const t = setTimeout(async () => {
      const title = await fetchTitleFromUrl(link.trim());
      setDescription((prev) => (prev.trim() ? prev : title || descriptionFromHostname(link.trim())));
    }, 700);
    return () => clearTimeout(t);
  }, [link, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!link.trim()) return;

    onSubmit({
      description: description.trim(),
      link: link.trim(),
      summary: summary.trim(),
      status: initialData?.status || 'not_started',
    });

    if (!isEditing) {
      setDescription('');
      setLink('');
      setSummary('');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update resource details and summary.' : 'Add a video or document resource.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resource-link">Resource Link *</Label>
              <Input
                id="resource-link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onBlur={() => fillDescriptionFromLink()}
                placeholder="https://..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Description will be filled automatically from the page title when possible.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-description">Description</Label>
              <Input
                id="resource-description"
                value={description || ''}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the resource (e.g., 'Introduction to React')"
              />
              <p className="text-xs text-muted-foreground">
                Optional. A short description to identify this resource.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource-summary">Summary</Label>
              <Textarea
                id="resource-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Enter your detailed notes and summary of this resource. This can be downloaded as TXT or Markdown for offline study."
                rows={6}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground">
                Optional detailed notes and summary. This will be included in downloadable study materials.
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!link?.trim()}>
              {isEditing ? 'Save Changes' : 'Add Resource'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
