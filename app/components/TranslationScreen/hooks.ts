"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TranslationState, User, Job } from './types';

// Custom hook for authentication
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

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

  return { user };
};

// Custom hook for API key management
export const useApiKey = () => {
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const saveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey);
  };

  return { apiKey, setApiKey, saveApiKey };
};

// Custom hook for job monitoring
export const useJobMonitor = (job: Job | null) => {
  useEffect(() => {
    if (!job?.id) return;

    const channel = supabase
      .channel(`jobs:${job.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `id=eq.${job.id}`,
        },
        (payload) => {
          // This would be handled by the parent component
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [job?.id]);
};