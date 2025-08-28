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
import { FileText, Image, Settings, ArrowRight, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

export function TranslationScreen() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'documents' | 'images'>('documents');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<string>('auto');
  const [targetLanguage, setTargetLanguage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [translatedFile, setTranslatedFile] = useState<File | null>(null);
  const [uploadedAsset, setUploadedAsset] = useState<any>(null);
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Check authentication status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load API key from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleFileUpload = async (file: File | null) => {
    if (!file || !user) {
      setSelectedFile(null);
      setUploadedAsset(null);
      return;
    }
    
    setError(null);
    setIsProcessing(true);
    
    try {
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
      
      const data = await response.json();
      setUploadedAsset(data.asset);
      setSelectedFile(file);
      
    } catch (err: any) {
      setError(err.message);
      console.error('Upload error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranslate = async () => {
    if (!uploadedAsset || !targetLanguage || !user) return;
    
    setError(null);
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: uploadedAsset.id,
          targetLanguage,
          sourceLanguage,
          jobType: 'translate'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create translation job');
      }
      
      const data = await response.json();
      setCurrentJob(data.job);
      
      // Poll for job completion
      pollJobStatus(data.job.id);
      
    } catch (err: any) {
      setError(err.message);
      console.error('Translation error:', err);
      setIsProcessing(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/jobs?jobId=${jobId}`);
        const data = await response.json();
        
        if (data.jobs) {
          setCurrentJob(data.jobs);
          
          if (data.jobs.status === 'completed') {
            setIsProcessing(false);
            // Handle completed translation
            if (data.jobs.ai_results && data.jobs.ai_results.length > 0) {
              // Process the translation result
              console.log('Translation completed:', data.jobs.ai_results[0]);
            }
          } else if (data.jobs.status === 'failed') {
            setIsProcessing(false);
            setError(data.jobs.error_message || 'Translation failed');
          } else {
            // Continue polling
            setTimeout(poll, 2000);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
        setTimeout(poll, 5000); // Retry after longer delay
      }
    };
    
    poll();
  };

  const handleApiKeySave = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    setShowApiKeyInput(false);
  };

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const canTranslate = uploadedAsset && targetLanguage && sourceLanguage !== targetLanguage && user;

  // Show sign-in if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <h2 className="text-2xl font-bold text-center">{t.visualTranslator}</h2>
            <p className="text-gray-600 text-center">{t.signInToStart}</p>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignIn} className="w-full">
              {t.signInAnonymously}
            </Button>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
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
                  <Image className="w-4 h-4" />
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

                  {/* Right Side - Language Selection & Actions */}
                  <div className="space-y-6">
                    {/* Language Selection Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t.sourceLanguage}
                        </label>
                        <LanguageDropdown
                          selectedLanguage={sourceLanguage}
                          onLanguageSelect={setSourceLanguage}
                          type="source"
                          placeholder={t.selectSourceLanguage}
                        />
                      </div>
                      
                      <div className="flex justify-center sm:col-span-1">
                        <ArrowRight className="w-6 h-6 text-gray-400 mt-6" />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t.targetLanguage}
                        </label>
                        <LanguageDropdown
                          selectedLanguage={targetLanguage}
                          onLanguageSelect={setTargetLanguage}
                          type="target"
                          placeholder={t.selectTargetLanguage}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleTranslate}
                      disabled={!canTranslate || isProcessing}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? t.translating : t.translateDocument}
                    </Button>

                    {!apiKey && (
                      <p className="text-sm text-amber-600 text-center">
                        {t.pleaseAddApiKey}
                      </p>
                    )}
                    
                    {!targetLanguage && apiKey && (
                      <p className="text-sm text-blue-600 text-center">
                        {t.selectTargetLanguage}
                      </p>
                    )}
                  </div>
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

                  {/* Right Side - Language Selection & Actions */}
                  <div className="space-y-6">
                    {/* Language Selection Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t.sourceLanguage}
                        </label>
                        <LanguageDropdown
                          selectedLanguage={sourceLanguage}
                          onLanguageSelect={setSourceLanguage}
                          type="source"
                          placeholder={t.selectSourceLanguage}
                        />
                      </div>
                      
                      <div className="flex justify-center sm:col-span-1">
                        <ArrowRight className="w-6 h-6 text-gray-400 mt-6" />
                      </div>
                      
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t.targetLanguage}
                        </label>
                        <LanguageDropdown
                          selectedLanguage={targetLanguage}
                          onLanguageSelect={setTargetLanguage}
                          type="target"
                          placeholder={t.selectTargetLanguage}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleTranslate}
                      disabled={!canTranslate || isProcessing}
                      className="w-full"
                      size="lg"
                    >
                      {isProcessing ? t.processing : t.translateImage}
                    </Button>

                    {!apiKey && (
                      <p className="text-sm text-amber-600 text-center">
                        {t.pleaseAddApiKey}
                      </p>
                    )}
                  </div>
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