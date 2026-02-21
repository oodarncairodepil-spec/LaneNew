// Download utilities for exporting summaries

import jsPDF from 'jspdf';

export type DownloadFormat = 'txt' | 'md' | 'pdf';

interface DownloadOptions {
  filename: string;
  content: string;
  format: DownloadFormat;
}

export function downloadSummary({ filename, content, format }: DownloadOptions) {
  if (format === 'pdf') {
    downloadAsPDF(filename, content);
    return;
  }

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

function generatePDFBlob(content: string): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;
  const lineHeight = 7;
  const fontSize = 11;

  // Split content into lines and process
  const lines = content.split('\n');
  
  lines.forEach((line) => {
    // Check if we need a new page
    if (yPosition > pageHeight - margin - lineHeight) {
      doc.addPage();
      yPosition = margin;
    }

    // Handle markdown formatting
    if (line.startsWith('# ')) {
      // Main title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      const text = line.substring(2).trim();
      const splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * (lineHeight + 2) + 5;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'normal');
    } else if (line.startsWith('## ')) {
      // Section heading
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const text = line.substring(3).trim();
      const splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * (lineHeight + 1) + 4;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'normal');
    } else if (line.startsWith('### ')) {
      // Subsection heading
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const text = line.substring(4).trim();
      const splitText = doc.splitTextToSize(text, maxWidth);
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * (lineHeight + 1) + 3;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'normal');
    } else if (line.trim() === '---') {
      // Separator
      yPosition += lineHeight;
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight + 2;
    } else if (line.trim() === '') {
      // Empty line
      yPosition += lineHeight / 2;
    } else {
      // Regular text - handle inline bold
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      
      // Simple approach: remove markdown formatting for now
      // (jsPDF doesn't support inline formatting easily without additional libraries)
      const text = line.replace(/\*\*/g, '').trim();
      if (text) {
        const splitText = doc.splitTextToSize(text, maxWidth);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * lineHeight;
      } else {
        yPosition += lineHeight;
      }
    }
  });

  return doc.output('blob');
}

function downloadAsPDF(filename: string, content: string) {
  const blob = generatePDFBlob(content);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generatePDFPreview(content: string): string {
  const blob = generatePDFBlob(content);
  return URL.createObjectURL(blob);
}

export function formatResourceSummary(description: string, link: string, summary: string, format: DownloadFormat): string {
  if (format === 'md') {
    return `# ${description}\n\n**Source:** [${link}](${link})\n\n## Summary\n\n${summary}`;
  }
  return `${description}\n${'='.repeat(description.length)}\n\nSource: ${link}\n\nSummary:\n${summary}`;
}

export function formatLessonSummary(
  lessonTitle: string,
  lessonSummary: string,
  projectQuestions: string,
  objectives: Array<{ title: string; resources: Array<{ description: string; summary: string }> }>,
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
        if (obj.title) {
          content += `### ${obj.title}\n\n`;
        }
        obj.resources.forEach(res => {
          if (res.summary) {
            if (res.description) {
              content += `#### ${res.description}\n\n${res.summary}\n\n`;
            } else {
              content += `${res.summary}\n\n`;
            }
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
      if (obj.title) {
        content += `${obj.title}\n`;
      }
      obj.resources.forEach(res => {
        if (res.summary) {
          if (res.description) {
            content += `    - ${res.description}\n      ${res.summary}\n\n`;
          } else {
            content += `    - ${res.summary}\n\n`;
          }
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
    objectives: Array<{ title: string; resources: Array<{ description: string; summary: string }> }>;
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
        if (obj.title) {
          content += `### ${obj.title}\n\n`;
        }
        obj.resources.forEach(res => {
          if (res.summary) {
            if (res.description) {
              content += `- **${res.description}**: ${res.summary}\n`;
            } else {
              content += `- ${res.summary}\n`;
            }
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
        if (obj.title) {
          content += `  ${obj.title}\n`;
        }
        obj.resources.forEach(res => {
          if (res.summary) {
            if (res.description) {
              content += `      • ${res.description}: ${res.summary}\n`;
            } else {
              content += `      • ${res.summary}\n`;
            }
          }
        });
        content += '\n';
      });
  });
  return content;
}
