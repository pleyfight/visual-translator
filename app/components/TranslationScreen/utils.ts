import { Asset } from './types';

// API call utilities to follow DRY principle
export const apiClient = {
  async upload(file: File): Promise<{ asset: Asset }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }
    
    return response.json();
  },

  async createJob(assetId: string, targetLanguage: string, sourceLanguage: string) {
    const response = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId,
        targetLanguage,
        sourceLanguage,
        jobType: 'translate'
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create translation job');
    }
    
    return response.json();
  }
};

// Error handling utility
export const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// File download utility
export const downloadTranslatedFile = async (url: string, fileName: string): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type });
};