// Custom hook for YouTube video data management
import { useState, useEffect } from 'react';
import { youtubeService } from '../services/youtubeService.js';
import { extractYouTubeVideoId } from '../utils/youtubeUtils.js';

/**
 * Custom hook for fetching and managing YouTube video data
 * @param {string} videoUrl - YouTube video URL
 * @returns {object} - Video data and loading state
 */
export const useYouTubeVideo = (videoUrl) => {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!videoUrl) {
      setVideoData(null);
      setError(null);
      return;
    }

    const fetchVideoData = async () => {
      setLoading(true);
      setError(null);

      try {
        const videoId = extractYouTubeVideoId(videoUrl);
        
        if (!videoId) {
          throw new Error('Invalid YouTube URL');
        }

        const data = await youtubeService.getVideoDetails(videoId);
        setVideoData(data);
        
      } catch (err) {
        console.error('Error fetching YouTube video data:', err);
        setError(err.message);
        setVideoData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [videoUrl]);

  return {
    videoData,
    loading,
    error,
    videoId: videoData?.id || null,
    duration: videoData?.duration || 180,
    title: videoData?.title || 'Loading...',
    isConfigured: youtubeService.isConfigured()
  };
};

/**
 * Custom hook for batch fetching YouTube video data
 * @param {string[]} videoUrls - Array of YouTube video URLs
 * @returns {object} - Batch video data and loading state
 */
export const useYouTubeVideoBatch = (videoUrls) => {
  const [videosData, setVideosData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!videoUrls || videoUrls.length === 0) {
      setVideosData([]);
      setError(null);
      return;
    }

    const fetchBatchVideoData = async () => {
      setLoading(true);
      setError(null);

      try {
        const videoIds = videoUrls
          .map(url => extractYouTubeVideoId(url))
          .filter(id => id !== null);

        if (videoIds.length === 0) {
          throw new Error('No valid YouTube URLs provided');
        }

        const data = await youtubeService.getBatchVideoDetails(videoIds);
        setVideosData(data);
        
      } catch (err) {
        console.error('Error fetching batch YouTube video data:', err);
        setError(err.message);
        setVideosData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBatchVideoData();
  }, [videoUrls]);

  return {
    videosData,
    loading,
    error,
    isConfigured: youtubeService.isConfigured()
  };
};

export default useYouTubeVideo;