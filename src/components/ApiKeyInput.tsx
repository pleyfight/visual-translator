import React from 'react';
import type { ApiKeyInputProps } from '../../lib/frontend-contracts';

export function ApiKeyInput({ apiKey, setApiKey, onSave }: ApiKeyInputProps) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label htmlFor="apiKey">API Key</label>
      <input
        id="apiKey"
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter API key"
        style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
      />
      <button onClick={onSave} style={{ padding: '8px 12px' }}>
        Save
      </button>
    </div>
  );
}