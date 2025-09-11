// Extract types for better maintainability
export interface Asset {
  id: string;
  filename: string;
  file_type: string;
  url?: string;
}

export interface Job {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  translated_asset?: Asset;
}

export interface User {
  id: string;
  email?: string;
}

export interface TranslationState {
  activeTab: 'documents' | 'images';
  selectedFile: File | null;
  sourceLanguage: string;
  targetLanguage: string;
  isProcessing: boolean;
  apiKey: string;
  showApiKeyInput: boolean;
  translatedFile: File | null;
  uploadedAsset: Asset | null;
  currentJob: Job | null;
  error: string | null;
  user: User | null;
}