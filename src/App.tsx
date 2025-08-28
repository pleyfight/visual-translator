import React, { useCallback, useMemo, useState } from 'react';
import { ApiKeyInput } from './components/ApiKeyInput';
import { LanguageSelector } from './components/LanguageSelector';
import { DocumentViewer } from './components/DocumentViewer';
import { TranslationProgress } from './components/TranslationProgress';
import { ProgressSteps } from './components/ProgressSteps';
import { useToasts, ToastContainer } from './hooks/useToasts';
import { analyzeImage, analyzeImageMock } from './services/analysis';
import type { LanguageOption, ProgressStep } from '../lib/frontend-contracts';

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
];

export function App() {
  const [apiKey, setApiKey] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [translatedFile, setTranslatedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toasts, addToast, removeToast } = useToasts();

  const progressSteps: ProgressStep[] = useMemo(() => [
    { id: 'apikey', label: 'API Key', icon: '🔑', completed: Boolean(apiKey) },
    { id: 'language', label: 'Language', icon: '🌐', completed: Boolean(targetLanguage) },
    { id: 'upload', label: 'Upload', icon: '📁', completed: Boolean(originalFile) },
    { id: 'translate', label: 'Translate', icon: '🔄', completed: Boolean(translatedFile) },
  ], [apiKey, targetLanguage, originalFile, translatedFile]);

  const handleApiKeySave = useCallback(() => {
    addToast({
      title: 'Success',
      description: 'API key saved successfully',
      variant: 'default',
    });
  }, [addToast]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      setTranslatedFile(null); // Reset translation
      addToast({
        title: 'File uploaded',
        description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
        variant: 'default',
      });
    }
  }, [addToast]);

  const handleTranslate = useCallback(async (useMock = false) => {
    if (!originalFile) {
      addToast({
        title: 'Error',
        description: 'Please upload a file first',
        variant: 'destructive',
      });
      return;
    }

    if (!apiKey && !useMock) {
      addToast({
        title: 'Error',
        description: 'Please enter an API key first',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const analysisFunc = useMock ? analyzeImageMock : analyzeImage;
      const result = await analysisFunc({
        imageFile: originalFile,
        targetLanguage,
        apiKey: apiKey || 'mock-key',
      });

      setTranslatedFile(result);
      addToast({
        title: 'Translation complete',
        description: `Successfully translated to ${LANGUAGE_OPTIONS.find(l => l.code === targetLanguage)?.name || targetLanguage}`,
        variant: 'default',
      });
    } catch (error) {
      addToast({
        title: 'Translation failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [originalFile, apiKey, targetLanguage, addToast]);

  const handleTranslationComplete = useCallback(() => {
    addToast({
      title: 'Process complete',
      description: 'You can now download or review the translated file',
      variant: 'default',
    });
  }, [addToast]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24, display: 'grid', gap: 24 }}>
      <header>
        <h1 style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8 }}>Visual Translator</h1>
        <p style={{ color: '#666' }}>Translate text in images and documents</p>
      </header>

      <ProgressSteps steps={progressSteps} />

      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr 1fr' }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <ApiKeyInput
            apiKey={apiKey}
            setApiKey={setApiKey}
            onSave={handleApiKeySave}
          />

          <LanguageSelector
            options={LANGUAGE_OPTIONS}
            value={targetLanguage}
            onChange={setTargetLanguage}
          />

          <div style={{ display: 'grid', gap: 8 }}>
            <label htmlFor="fileInput">Upload File</label>
            <input
              id="fileInput"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleTranslate(false)}
              disabled={isProcessing || !originalFile}
              style={{
                padding: '12px 24px',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: isProcessing || !originalFile ? 'not-allowed' : 'pointer',
                opacity: isProcessing || !originalFile ? 0.6 : 1,
              }}
            >
              {isProcessing ? 'Translating...' : 'Translate (API)'}
            </button>
            <button
              onClick={() => handleTranslate(true)}
              disabled={isProcessing || !originalFile}
              style={{
                padding: '12px 24px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: isProcessing || !originalFile ? 'not-allowed' : 'pointer',
                opacity: isProcessing || !originalFile ? 0.6 : 1,
              }}
            >
              {isProcessing ? 'Processing...' : 'Mock Translate'}
            </button>
          </div>

          <TranslationProgress
            isProcessing={isProcessing}
            onComplete={handleTranslationComplete}
          />
        </div>

        <div>
          <DocumentViewer
            originalFile={originalFile}
            translatedFile={translatedFile}
            targetLanguage={LANGUAGE_OPTIONS.find(l => l.code === targetLanguage)?.name || targetLanguage}
          />
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}