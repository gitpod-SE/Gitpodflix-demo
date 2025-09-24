// YouTube Data API v3 service for backend
import axios from 'axios';

interface YouTubeVideoDetails {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  publishedAt: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
}

interface YouTubeApiResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      publishedAt: string;
      channelTitle: string;
      thumbnails: any;
    };
    contentDetails: {
      duration: string;
    };
    statistics: {
      viewCount?: string;
      likeCount?: string;
    };
  }>;
}

/**
 * YouTube service for backend API integration
 */
export class YouTubeService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
  }

  /**
   * Check if YouTube API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Extract YouTube video ID from URL
   */
  extractVideoId(url: string): string | null {
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
  }

  /**
   * Parse YouTube duration format (PT#M#S) to seconds
   */
  private parseYouTubeDuration(duration: string): number {
    if (!duration || typeof duration !== 'string') {
      return 180; // Default fallback
    }

    // YouTube duration format: PT#H#M#S (e.g., "PT4M13S" = 4 minutes 13 seconds)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    
    if (!match) {
      console.warn('Invalid YouTube duration format:', duration);
      return 180; // Default fallback
    }

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Get fallback video details when API is unavailable
   */
  private getFallbackVideoDetails(videoId: string): YouTubeVideoDetails {
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
   * Fetch video details from YouTube API
   */
  async getVideoDetails(videoId: string): Promise<YouTubeVideoDetails> {
    if (!this.isConfigured()) {
      console.warn('YouTube API not configured. Using fallback data.');
      return this.getFallbackVideoDetails(videoId);
    }

    try {
      const response = await axios.get<YouTubeApiResponse>(
        `${this.baseUrl}/videos`,
        {
          params: {
            id: videoId,
            part: 'contentDetails,snippet,statistics',
            key: this.apiKey
          },
          timeout: 10000 // 10 second timeout
        }
      );

      if (!response.data.items || response.data.items.length === 0) {
        console.warn(`No video found for ID: ${videoId}`);
        return this.getFallbackVideoDetails(videoId);
      }

      const video = response.data.items[0];
      return {
        id: videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        duration: this.parseYouTubeDuration(video.contentDetails.duration),
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
   * Batch fetch multiple video details
   */
  async getBatchVideoDetails(videoIds: string[]): Promise<YouTubeVideoDetails[]> {
    if (!videoIds || videoIds.length === 0) {
      return [];
    }

    if (!this.isConfigured()) {
      return videoIds.map(id => this.getFallbackVideoDetails(id));
    }

    try {
      // YouTube API allows up to 50 video IDs per request
      const batchSize = 50;
      const results: YouTubeVideoDetails[] = [];

      for (let i = 0; i < videoIds.length; i += batchSize) {
        const batch = videoIds.slice(i, i + batchSize);
        const idsParam = batch.join(',');

        const response = await axios.get<YouTubeApiResponse>(
          `${this.baseUrl}/videos`,
          {
            params: {
              id: idsParam,
              part: 'contentDetails,snippet,statistics',
              key: this.apiKey
            },
            timeout: 15000 // 15 second timeout for batch requests
          }
        );

        if (response.data.items) {
          const batchResults = response.data.items.map(video => ({
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            duration: this.parseYouTubeDuration(video.contentDetails.duration),
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

  /**
   * Get video duration only (optimized for performance)
   */
  async getVideoDuration(videoId: string): Promise<number> {
    if (!this.isConfigured()) {
      return 180; // Default fallback
    }

    try {
      const response = await axios.get<YouTubeApiResponse>(
        `${this.baseUrl}/videos`,
        {
          params: {
            id: videoId,
            part: 'contentDetails',
            key: this.apiKey
          },
          timeout: 5000 // 5 second timeout for duration-only requests
        }
      );

      if (!response.data.items || response.data.items.length === 0) {
        return 180; // Default fallback
      }

      const duration = response.data.items[0].contentDetails.duration;
      return this.parseYouTubeDuration(duration);

    } catch (error) {
      console.error('Error fetching YouTube video duration:', error);
      return 180; // Default fallback
    }
  }
}

// Export singleton instance
export const youtubeService = new YouTubeService();
export default youtubeService;