import React from 'react';
import type { DocumentViewerProps } from '../../lib/frontend-contracts';
import { useObjectUrl } from '../hooks/useObjectUrl';

export function DocumentViewer({ originalFile, translatedFile, targetLanguage }: DocumentViewerProps) {
  const originalUrl = useObjectUrl(originalFile);
  const translatedUrl = useObjectUrl(translatedFile);

  const ImageOrFallback = ({ url, file }: { url: string | null; file: File | null }) => {
    if (!file) return <div style={{ color: '#888' }}>No file</div>;
    const isImage = file.type.startsWith('image/');
    if (isImage && url) {
      return (
        <img
          src={url}
          alt={file.name}
          style={{ maxWidth: '100%', height: 'auto', border: '1px solid #eee', borderRadius: 6 }}
        />
      );
    }
    if (url) {
      return (
        <object data={url} type={file.type} width="100%" height={480}>
          <p>Preview not available. Download: <a href={url} download={file.name}>{file.name}</a></p>
        </object>
      );
    }
    return <div>{file.name}</div>;
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ color: '#666' }}>Target language: {targetLanguage}</div>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Original</div>
          <ImageOrFallback url={originalUrl} file={originalFile} />
        </div>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Translated</div>
          <ImageOrFallback url={translatedUrl} file={translatedFile} />
        </div>
      </div>
    </div>
  );
}