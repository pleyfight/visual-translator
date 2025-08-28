import React from 'react';
import type { ProgressStep } from '../../lib/frontend-contracts';

export function ProgressSteps({ steps }: { steps: ProgressStep[] }) {
  return (
    <ol style={{ display: 'flex', gap: 16, listStyle: 'none', padding: 0, margin: 0 }}>
      {steps.map((s) => (
        <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden>{s.completed ? '✅' : '⭕'}</span>
          <span>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}