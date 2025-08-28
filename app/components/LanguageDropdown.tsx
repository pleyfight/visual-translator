"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

interface LanguageDropdownProps {
  selectedLanguage: string;
  onLanguageSelect: (language: string) => void;
  type: 'source' | 'target';
  placeholder?: string;
}

const languages: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
];

// For source language, we might want to include auto-detect
const sourceLanguages: LanguageOption[] = [
  { code: 'auto', name: 'Auto-detect', flag: '🔍' },
  ...languages,
];

export function LanguageDropdown({ selectedLanguage, onLanguageSelect, type, placeholder }: LanguageDropdownProps) {
  const availableLanguages = type === 'source' ? sourceLanguages : languages;
  const selectedLang = availableLanguages.find(lang => lang.code === selectedLanguage);

  return (
    <Select value={selectedLanguage} onValueChange={onLanguageSelect}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {selectedLang && (
            <div className="flex items-center space-x-2">
              <span className="text-lg">{selectedLang.flag}</span>
              <span>{selectedLang.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableLanguages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <div className="flex items-center space-x-2">
              <span className="text-lg">{language.flag}</span>
              <span>{language.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}