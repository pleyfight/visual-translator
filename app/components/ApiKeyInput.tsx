"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Save, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  onSave: () => void;
}

export function ApiKeyInput({ apiKey, setApiKey, onSave }: ApiKeyInputProps) {
  const { t } = useI18n();
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(!apiKey);

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave();
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (apiKey) {
      setIsEditing(false);
    } else {
      onSave(); // Close modal if no existing key
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t.apiConfiguration}</h3>
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey">{t.geminiApiKey}</Label>
        <div className="relative">
          <Input
            id="apiKey"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={t.enterApiKey}
            className="pr-10"
            disabled={!isEditing}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          {t.apiKeyStoredLocally}
        </p>
      </div>

      <div className="flex space-x-2">
        {isEditing ? (
          <>
            <Button onClick={handleSave} disabled={!apiKey.trim()} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {t.save}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              {t.cancel}
            </Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-1">
            {t.editApiKey}
          </Button>
        )}
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>{t.getApiKeyFromGoogle}</p>
        <p>{t.freeTierUsage}</p>
        <p>{t.requiredForTranslation}</p>
      </div>
    </div>
  );
}