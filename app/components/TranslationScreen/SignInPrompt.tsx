"use client";

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

interface SignInPromptProps {
  error: string | null;
}

export function SignInPrompt({ error }: SignInPromptProps) {
  const { t } = useI18n();

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
    } catch (err) {
      console.error('Sign in error:', err);
    }
  };

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