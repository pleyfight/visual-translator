"use client";

import { Button } from '@/components/ui/button';
import { LanguageDropdown } from '../LanguageDropdown';
import { ArrowRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface LanguageSelectionPanelProps {
  sourceLanguage: string;
  targetLanguage: string;
  onSourceLanguageChange: (language: string) => void;
  onTargetLanguageChange: (language: string) => void;
  onTranslate: () => void;
  canTranslate: boolean;
  isProcessing: boolean;
  apiKey: string;
  tabType: 'documents' | 'images';
}

export function LanguageSelectionPanel({
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onTranslate,
  canTranslate,
  isProcessing,
  apiKey,
  tabType
}: LanguageSelectionPanelProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Language Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.sourceLanguage}
          </label>
          <LanguageDropdown
            selectedLanguage={sourceLanguage}
            onLanguageSelect={onSourceLanguageChange}
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
            onLanguageSelect={onTargetLanguageChange}
            type="target"
            placeholder={t.selectTargetLanguage}
          />
        </div>
      </div>

      {/* Translate Button */}
      <Button
        onClick={onTranslate}
        disabled={!canTranslate || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing 
          ? t.translating 
          : tabType === 'documents' 
            ? t.translateDocument 
            : t.translateImage
        }
      </Button>

      {/* Status Messages */}
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
  );
}