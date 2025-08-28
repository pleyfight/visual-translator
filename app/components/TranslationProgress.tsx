"use client";

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, FileText, Languages, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface ProgressStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  completed: boolean;
}

interface TranslationProgressProps {
  isProcessing: boolean;
  onComplete: () => void;
}

export function TranslationProgress({ isProcessing, onComplete }: TranslationProgressProps) {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps: ProgressStep[] = [
    {
      id: 'upload',
      label: t.processingFile,
      icon: <FileText className="w-5 h-5" />,
      completed: currentStep > 0,
    },
    {
      id: 'analyze',
      label: t.analyzingContent,
      icon: <Sparkles className="w-5 h-5" />,
      completed: currentStep > 1,
    },
    {
      id: 'translate',
      label: t.translatingText,
      icon: <Languages className="w-5 h-5" />,
      completed: currentStep > 2,
    },
    {
      id: 'complete',
      label: t.finalizing,
      icon: <CheckCircle className="w-5 h-5" />,
      completed: currentStep > 3,
    },
  ];

  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return prev;
        }
        return prev + 1;
      });

      setProgress((prev) => {
        const newProgress = ((currentStep + 1) / steps.length) * 100;
        return Math.min(newProgress, 100);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isProcessing, currentStep, steps.length, onComplete]);

  if (!isProcessing) return null;

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t.translationInProgress}
        </h3>
        <p className="text-sm text-gray-600">
          {t.pleaseWait}
        </p>
      </div>

      <div className="space-y-4">
        <Progress value={progress} className="w-full" />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center space-x-3 p-3 rounded-lg border transition-colors",
                step.completed
                  ? "bg-green-50 border-green-200"
                  : index === currentStep
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-50 border-gray-200"
              )}
            >
              <div
                className={cn(
                  "flex-shrink-0",
                  step.completed
                    ? "text-green-600"
                    : index === currentStep
                    ? "text-blue-600"
                    : "text-gray-400"
                )}
              >
                {step.completed ? (
                  <CheckCircle className="w-5 h-5" />
                ) : index === currentStep ? (
                  <Clock className="w-5 h-5 animate-pulse" />
                ) : (
                  step.icon
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  step.completed
                    ? "text-green-900"
                    : index === currentStep
                    ? "text-blue-900"
                    : "text-gray-600"
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}