// Download utilities for exporting summaries

export type DownloadFormat = 'txt' | 'md';

interface DownloadOptions {
  filename: string;
  content: string;
  format: DownloadFormat;
}

export function downloadSummary({ filename, content, format }: DownloadOptions) {
  const mimeType = format === 'md' ? 'text/markdown' : 'text/plain';
  const extension = format === 'md' ? '.md' : '.txt';
  
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatResourceSummary(title: string, link: string, summary: string, format: DownloadFormat): string {
  if (format === 'md') {
    return `# ${title}\n\n**Source:** [${link}](${link})\n\n## Summary\n\n${summary}`;
  }
  return `${title}\n${'='.repeat(title.length)}\n\nSource: ${link}\n\nSummary:\n${summary}`;
}

export function formatLessonSummary(
  lessonTitle: string,
  lessonSummary: string,
  projectQuestions: string,
  objectives: Array<{ title: string; resources: Array<{ title: string; summary: string }> }>,
  format: DownloadFormat
): string {
  if (format === 'md') {
    let content = `# ${lessonTitle}\n\n`;
    if (lessonSummary) {
      content += `## Lesson Summary\n\n${lessonSummary}\n\n`;
    }
    if (projectQuestions) {
      content += `## Project Questions\n\n${projectQuestions}\n\n`;
    }
    if (objectives.length > 0) {
      content += `## Objectives\n\n`;
      objectives.forEach(obj => {
        content += `### ${obj.title}\n\n`;
        obj.resources.forEach(res => {
          if (res.summary) {
            content += `#### ${res.title}\n\n${res.summary}\n\n`;
          }
        });
      });
    }
    return content;
  }
  
  // TXT format
  let content = `${lessonTitle}\n${'='.repeat(lessonTitle.length)}\n\n`;
  if (lessonSummary) {
    content += `LESSON SUMMARY\n${'-'.repeat(14)}\n${lessonSummary}\n\n`;
  }
  if (projectQuestions) {
    content += `PROJECT QUESTIONS\n${'-'.repeat(17)}\n${projectQuestions}\n\n`;
  }
  if (objectives.length > 0) {
    content += `OBJECTIVES\n${'-'.repeat(10)}\n\n`;
    objectives.forEach(obj => {
      content += `${obj.title}\n`;
      obj.resources.forEach(res => {
        if (res.summary) {
          content += `  - ${res.title}\n    ${res.summary}\n\n`;
        }
      });
    });
  }
  return content;
}

export function formatCourseSummary(
  courseTitle: string,
  courseDescription: string,
  courseSummary: string,
  lessons: Array<{
    title: string;
    summary: string;
    objectives: Array<{ title: string; resources: Array<{ title: string; summary: string }> }>;
  }>,
  format: DownloadFormat
): string {
  if (format === 'md') {
    let content = `# ${courseTitle}\n\n`;
    if (courseDescription) {
      content += `${courseDescription}\n\n`;
    }
    if (courseSummary) {
      content += `## Course Summary\n\n${courseSummary}\n\n`;
    }
    lessons.forEach(lesson => {
      content += `---\n\n## ${lesson.title}\n\n`;
      if (lesson.summary) {
        content += `${lesson.summary}\n\n`;
      }
      lesson.objectives.forEach(obj => {
        content += `### ${obj.title}\n\n`;
        obj.resources.forEach(res => {
          if (res.summary) {
            content += `- **${res.title}**: ${res.summary}\n`;
          }
        });
        content += '\n';
      });
    });
    return content;
  }
  
  // TXT format
  let content = `${courseTitle.toUpperCase()}\n${'='.repeat(courseTitle.length)}\n\n`;
  if (courseDescription) {
    content += `${courseDescription}\n\n`;
  }
  if (courseSummary) {
    content += `COURSE SUMMARY\n${'-'.repeat(14)}\n${courseSummary}\n\n`;
  }
  lessons.forEach(lesson => {
    content += `\n${'─'.repeat(40)}\n\n`;
    content += `${lesson.title}\n${'-'.repeat(lesson.title.length)}\n\n`;
    if (lesson.summary) {
      content += `${lesson.summary}\n\n`;
    }
    lesson.objectives.forEach(obj => {
      content += `  ${obj.title}\n`;
      obj.resources.forEach(res => {
        if (res.summary) {
          content += `    • ${res.title}: ${res.summary}\n`;
        }
      });
      content += '\n';
    });
  });
  return content;
}
