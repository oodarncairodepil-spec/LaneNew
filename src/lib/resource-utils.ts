/**
 * Utility functions for resource URL handling and conversion
 */

/**
 * Detects if a URL is a video platform or video file
 */
export const isVideoUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  
  const videoPatterns = [
    /youtube\.com/i,
    /youtu\.be/i,
    /vimeo\.com/i,
    /dailymotion\.com/i,
    /twitch\.tv/i,
    /facebook\.com\/watch/i,
    /instagram\.com\/.*\/reel/i,
    /tiktok\.com/i,
    /\.mp4$/i,
    /\.webm$/i,
    /\.mov$/i,
    /\.avi$/i,
    /\.mkv$/i,
  ];
  
  return videoPatterns.some(pattern => pattern.test(url));
};

/**
 * Converts YouTube time parameter to seconds
 * Handles formats: 120, 2m30s, 1h2m30s
 */
const parseYouTubeTime = (timeStr: string): number => {
  // If it's just a number, return it as seconds
  if (/^\d+$/.test(timeStr)) {
    return parseInt(timeStr, 10);
  }

  let totalSeconds = 0;
  
  // Match hours, minutes, and seconds
  const hourMatch = timeStr.match(/(\d+)h/i);
  const minuteMatch = timeStr.match(/(\d+)m/i);
  const secondMatch = timeStr.match(/(\d+)s/i);

  if (hourMatch) totalSeconds += parseInt(hourMatch[1], 10) * 3600;
  if (minuteMatch) totalSeconds += parseInt(minuteMatch[1], 10) * 60;
  if (secondMatch) totalSeconds += parseInt(secondMatch[1], 10);

  return totalSeconds;
};

/**
 * Converts video URLs to embed format
 * Returns null for non-video URLs or URLs that can't be converted
 */
export const convertToEmbedUrl = (url: string): string | null => {
  if (!url) return null;

  // YouTube URL conversion
  // Handle youtu.be format: https://youtu.be/VIDEO_ID?params
  const youtuBeMatch = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]+)/i);
  if (youtuBeMatch) {
    const videoId = youtuBeMatch[1];
    // Extract time parameter if present (t=120, t=2m30s, etc.)
    const timeMatch = url.match(/[?&]t=([^&]+)/i);
    let timeParam = '';
    if (timeMatch) {
      const seconds = parseYouTubeTime(timeMatch[1]);
      if (seconds > 0) {
        timeParam = `?start=${seconds}`;
      }
    }
    return `https://www.youtube.com/embed/${videoId}${timeParam}`;
  }

  // Handle youtube.com/watch format: https://youtube.com/watch?v=VIDEO_ID&params
  const youtubeWatchMatch = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/i);
  if (youtubeWatchMatch) {
    const videoId = youtubeWatchMatch[1];
    // Extract time parameter if present (t=120, t=2m30s, etc.)
    const timeMatch = url.match(/[?&]t=([^&]+)/i);
    let timeParam = '';
    if (timeMatch) {
      const seconds = parseYouTubeTime(timeMatch[1]);
      if (seconds > 0) {
        timeParam = `?start=${seconds}`;
      }
    }
    return `https://www.youtube.com/embed/${videoId}${timeParam}`;
  }

  // Handle youtube.com/embed format (already embed, just return)
  if (/youtube\.com\/embed/i.test(url)) {
    return url;
  }

  // Vimeo URL conversion
  // Handle vimeo.com/VIDEO_ID format: https://vimeo.com/123456789
  const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/i);
  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return `https://player.vimeo.com/video/${videoId}`;
  }

  // Handle player.vimeo.com format (already embed, just return)
  if (/player\.vimeo\.com/i.test(url)) {
    return url;
  }

  // For direct video file links (.mp4, .webm, etc.), return null
  // These will be handled by HTML5 video player in the component
  if (/\.(mp4|webm|mov|avi|mkv)$/i.test(url)) {
    return null;
  }

  // Return null for non-video URLs
  return null;
};

