// YouTube utility functions for video handling

/**
 * Extract YouTube video ID from various YouTube URL formats
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if invalid
 */
export const extractYouTubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/i,
    /youtube\.com\/v\/([^&\n?#]+)/i,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Generate YouTube embed URL from video ID
 * @param {string} videoId - YouTube video ID
 * @param {object} options - Embed options
 * @returns {string} - YouTube embed URL
 */
export const getYouTubeEmbedUrl = (videoId, options = {}) => {
  if (!videoId) return null;
  
  const defaultOptions = {
    autoplay: 1,
    mute: 0, // Allow sound by default
    controls: 1, // Show YouTube controls by default
    showinfo: 0,
    rel: 0,
    modestbranding: 1,
    playsinline: 1,
    enablejsapi: 1,
    fs: 1, // Allow fullscreen
    cc_load_policy: 1, // Show closed captions
    iv_load_policy: 3, // Hide annotations
    origin: window.location.origin
  };
  
  const embedOptions = { ...defaultOptions, ...options };
  const params = new URLSearchParams(embedOptions);
  
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
};

/**
 * Generate YouTube thumbnail URL from video ID
 * @param {string} videoId - YouTube video ID
 * @param {string} quality - Thumbnail quality (default, mqdefault, hqdefault, sddefault, maxresdefault)
 * @returns {string} - YouTube thumbnail URL
 */
export const getYouTubeThumbnail = (videoId, quality = 'hqdefault') => {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
};

/**
 * Check if URL is a YouTube URL
 * @param {string} url - URL to check
 * @returns {boolean} - True if YouTube URL
 */
export const isYouTubeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be');
};

/**
 * Get video duration from YouTube API (requires API key)
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<number>} - Duration in seconds
 */
export const getYouTubeDuration = async (videoId) => {
  if (!videoId) {
    console.warn('getYouTubeDuration: No video ID provided');
    return 180; // Default fallback
  }

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.warn('getYouTubeDuration: YouTube API key not configured. Using default duration.');
    return 180; // Default fallback when API key is missing
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.warn(`getYouTubeDuration: No video found for ID ${videoId}`);
      return 180; // Default fallback
    }

    const duration = data.items[0].contentDetails.duration;
    return parseYouTubeDuration(duration);
    
  } catch (error) {
    console.error('getYouTubeDuration: Error fetching video duration:', error);
    return 180; // Default fallback on error
  }
};

/**
 * Parse YouTube duration format (PT#M#S) to seconds
 * @param {string} duration - YouTube duration string (e.g., "PT4M13S")
 * @returns {number} - Duration in seconds
 */
export const parseYouTubeDuration = (duration) => {
  if (!duration || typeof duration !== 'string') {
    return 180; // Default fallback
  }

  // YouTube duration format: PT#H#M#S (e.g., "PT4M13S" = 4 minutes 13 seconds)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) {
    console.warn('parseYouTubeDuration: Invalid duration format:', duration);
    return 180; // Default fallback
  }

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Create YouTube player configuration
 * @param {string} videoId - YouTube video ID
 * @param {object} playerOptions - Player configuration options
 * @returns {object} - Player configuration
 */
export const createYouTubePlayerConfig = (videoId, playerOptions = {}) => {
  return {
    videoId,
    playerVars: {
      autoplay: 1,
      mute: 0, // Enable sound by default
      controls: 1, // Show YouTube controls
      showinfo: 0,
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      enablejsapi: 1,
      fs: 1, // Allow fullscreen
      cc_load_policy: 1, // Show captions
      iv_load_policy: 3, // Hide annotations
      origin: window.location.origin,
      ...playerOptions
    }
  };
};
