import React from 'react';
import type { TranslationProgressProps } from '../../lib/frontend-contracts';

export function TranslationProgress({ isProcessing, onComplete }: TranslationProgressProps) {
  return (
    <div role="status" aria-live="polite">
      {isProcessing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="spinner" aria-hidden>⏳</span>
          <span>Translating…</span>
        </div>
      ) : (
        <button onClick={onComplete} style={{ padding: '8px 12px' }}>
          Done
        </button>
      )}
    </div>
  );
}