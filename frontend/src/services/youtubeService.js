// YouTube Data API v3 service for fetching video metadata
import { getYouTubeDuration, parseYouTubeDuration } from '../utils/youtubeUtils.js';

/**
 * YouTube API service class for handling video metadata
 */
class YouTubeService {
  constructor() {
    this.apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  /**
   * Check if YouTube API is configured
   * @returns {boolean} - True if API key is available
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * Fetch video details from YouTube API
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<object>} - Video details object
   */
  async getVideoDetails(videoId) {
    if (!this.isConfigured()) {
      console.warn('YouTube API not configured. Using fallback data.');
      return this.getFallbackVideoDetails(videoId);
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/videos?id=${videoId}&part=contentDetails,snippet,statistics&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        console.warn(`No video found for ID: ${videoId}`);
        return this.getFallbackVideoDetails(videoId);
      }

      const video = data.items[0];
      return {
        id: videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        duration: parseYouTubeDuration(video.contentDetails.duration),
        publishedAt: video.snippet.publishedAt,
        channelTitle: video.snippet.channelTitle,
        viewCount: parseInt(video.statistics.viewCount || '0', 10),
        likeCount: parseInt(video.statistics.likeCount || '0', 10),
        thumbnails: video.snippet.thumbnails
      };

    } catch (error) {
      console.error('Error fetching YouTube video details:', error);
      return this.getFallbackVideoDetails(videoId);
    }
  }

  /**
   * Get fallback video details when API is unavailable
   * @param {string} videoId - YouTube video ID
   * @returns {object} - Fallback video details
   */
  getFallbackVideoDetails(videoId) {
    return {
      id: videoId,
      title: 'Video Title Unavailable',
      description: 'Video description unavailable - YouTube API not configured',
      duration: 180, // 3 minutes default
      publishedAt: new Date().toISOString(),
      channelTitle: 'Unknown Channel',
      viewCount: 0,
      likeCount: 0,
      thumbnails: {
        default: { url: `https://img.youtube.com/vi/${videoId}/default.jpg` },
        medium: { url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` },
        high: { url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }
      }
    };
  }

  /**
   * Batch fetch multiple video details
   * @param {string[]} videoIds - Array of YouTube video IDs
   * @returns {Promise<object[]>} - Array of video details
   */
  async getBatchVideoDetails(videoIds) {
    if (!videoIds || videoIds.length === 0) {
      return [];
    }

    if (!this.isConfigured()) {
      return videoIds.map(id => this.getFallbackVideoDetails(id));
    }

    try {
      // YouTube API allows up to 50 video IDs per request
      const batchSize = 50;
      const results = [];

      for (let i = 0; i < videoIds.length; i += batchSize) {
        const batch = videoIds.slice(i, i + batchSize);
        const idsParam = batch.join(',');

        const response = await fetch(
          `${this.baseUrl}/videos?id=${idsParam}&part=contentDetails,snippet,statistics&key=${this.apiKey}`
        );

        if (!response.ok) {
          throw new Error(`YouTube API batch request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.items) {
          const batchResults = data.items.map(video => ({
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            duration: parseYouTubeDuration(video.contentDetails.duration),
            publishedAt: video.snippet.publishedAt,
            channelTitle: video.snippet.channelTitle,
            viewCount: parseInt(video.statistics.viewCount || '0', 10),
            likeCount: parseInt(video.statistics.likeCount || '0', 10),
            thumbnails: video.snippet.thumbnails
          }));
          
          results.push(...batchResults);
        }
      }

      return results;

    } catch (error) {
      console.error('Error fetching batch YouTube video details:', error);
      return videoIds.map(id => this.getFallbackVideoDetails(id));
    }
  }
}

// Export singleton instance
export const youtubeService = new YouTubeService();
export default youtubeService;