import React from 'react';
import type { LanguageOption } from '../../lib/frontend-contracts';

export function LanguageSelector({
  options,
  value,
  onChange,
}: {
  options: LanguageOption[];
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label htmlFor="targetLang">Target language</label>
      <select
        id="targetLang"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
      >
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}