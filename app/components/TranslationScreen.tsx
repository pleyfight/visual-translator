"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploadArea } from './FileUploadArea';
import { LanguageDropdown } from './LanguageDropdown';
import { LanguageSelector } from './LanguageSelector';
import { ApiKeyInput } from './ApiKeyInput';
import { TranslationProgress } from './TranslationProgress';
import { DocumentViewer } from './DocumentViewer';
import { JobHistory } from './JobHistory';
import { FileText, Image, Settings, ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { SignInPrompt } from './TranslationScreen/SignInPrompt';
import { LanguageSelectionPanel } from './TranslationScreen/LanguageSelectionPanel';
import { useAuth, useApiKey } from './TranslationScreen/hooks';
import { apiClient, handleError, downloadTranslatedFile } from './TranslationScreen/utils';
import type { Asset, Job } from './TranslationScreen/types';

export function TranslationScreen() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { apiKey, setApiKey, saveApiKey } = useApiKey();
  
  const [activeTab, setActiveTab] = useState<'documents' | 'images'>('documents');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<string>('auto');
  const [targetLanguage, setTargetLanguage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [translatedFile, setTranslatedFile] = useState<File | null>(null);
  const [uploadedAsset, setUploadedAsset] = useState<Asset | null>(null);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);


  const handleFileUpload = async (file: File | null) => {
    if (!file || !user) {
      resetFileSelection();
      return;
    }
    
    setError(null);
    setIsProcessing(true);
    
    try {
      const data = await apiClient.upload(file);
      setUploadedAsset(data.asset);
      setSelectedFile(file);
    } catch (err) {
      setError(handleError(err));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetFileSelection = () => {
    setSelectedFile(null);
    setUploadedAsset(null);
  };

  const handleTranslate = async () => {
    if (!canTranslate()) return;
    
    setError(null);
    setIsProcessing(true);
    
    try {
      const data = await apiClient.createJob(uploadedAsset!.id, targetLanguage, sourceLanguage);
      setCurrentJob(data.job);
    } catch (err) {
      setError(handleError(err));
      setIsProcessing(false);
    }
  };

  const canTranslate = () => {
    return uploadedAsset && targetLanguage && sourceLanguage !== targetLanguage && user;
  };

  // Monitor job status updates
  useEffect(() => {
    if (!currentJob?.id) return;

    const channel = supabase
      .channel(`jobs:${currentJob.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `id=eq.${currentJob.id}`,
        },
        (payload) => {
          setCurrentJob(payload.new as Job);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentJob?.id]);

  // Handle job completion
  useEffect(() => {
    const handleJobCompleted = async () => {
      if (!currentJob?.translated_asset?.url) return;

      try {
        const fileName = currentJob.translated_asset.url.split('/').pop() || 'translated-file';
        const file = await downloadTranslatedFile(currentJob.translated_asset.url, fileName);
        setTranslatedFile(file);
      } catch (err) {
        setError('Failed to load translated file.');
      }
    };

    if (!currentJob) return;

    if (currentJob.status === 'completed') {
      setIsProcessing(false);
      handleJobCompleted();
    } else if (currentJob.status === 'failed') {
      setIsProcessing(false);
      setError(currentJob.error_message || 'Translation failed');
    }
  }, [currentJob]);

  const handleApiKeySave = () => {
    saveApiKey();
    setShowApiKeyInput(false);
  };

  if (!user) {
    return <SignInPrompt error={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">{t.visualTranslator}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiKeyInput(true)}
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>{t.addApiKey}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {t.documentTranslation}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t.preserveFormatting}
          </p>
        </div>

        <Card className="max-w-6xl mx-auto">
          <CardHeader>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'documents' | 'images')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="documents" className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>{t.documentsTab}</span>
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center space-x-2">
                  <Image className="w-4 h-4" alt="" />
                  <span>{t.imagesTab}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-6">
            <Tabs value={activeTab}>
              <TabsContent value="documents" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Side - File Upload */}
                  <div>
                    <FileUploadArea
                      acceptedTypes={activeTab === 'documents' ? 'documents' : 'images'}
                      onFileSelect={handleFileUpload}
                      selectedFile={selectedFile}
                    />
                  </div>

                  <LanguageSelectionPanel
                    sourceLanguage={sourceLanguage}
                    targetLanguage={targetLanguage}
                    onSourceLanguageChange={setSourceLanguage}
                    onTargetLanguageChange={setTargetLanguage}
                    onTranslate={handleTranslate}
                    canTranslate={canTranslate()}
                    isProcessing={isProcessing}
                    apiKey={apiKey}
                    tabType="documents"
                  />
                </div>
              </TabsContent>

              <TabsContent value="images" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Side - File Upload */}
                  <div>
                    <FileUploadArea
                      acceptedTypes="images"
                      onFileSelect={handleFileUpload}
                      selectedFile={selectedFile}
                    />
                  </div>

                  <LanguageSelectionPanel
                    sourceLanguage={sourceLanguage}
                    targetLanguage={targetLanguage}
                    onSourceLanguageChange={setSourceLanguage}
                    onTargetLanguageChange={setTargetLanguage}
                    onTranslate={handleTranslate}
                    canTranslate={canTranslate()}
                    isProcessing={isProcessing}
                    apiKey={apiKey}
                    tabType="images"
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Translation Progress */}
            {isProcessing && (
              <div className="mt-8">
                <TranslationProgress
                  isProcessing={isProcessing}
                  onComplete={() => setIsProcessing(false)}
                />
              </div>
            )}

            {/* Document Viewer */}
            {(selectedFile || translatedFile) && !isProcessing && (
              <div className="mt-8">
                <DocumentViewer
                  originalFile={selectedFile}
                  translatedFile={translatedFile}
                  targetLanguage={targetLanguage}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8">
          <JobHistory />
        </div>
      </main>

      {/* API Key Input Modal */}
      {showApiKeyInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <ApiKeyInput
              apiKey={apiKey}
              setApiKey={setApiKey}
              onSave={handleApiKeySave}
            />
          </div>
        </div>
      )}
    </div>
  );
}