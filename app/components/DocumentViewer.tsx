"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Eye } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface DocumentViewerProps {
  originalFile: File | null;
  translatedFile: File | null;
  targetLanguage: string;
}

export function DocumentViewer({ originalFile, translatedFile, targetLanguage }: DocumentViewerProps) {
  const { t } = useI18n();

  const handleDownload = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreview = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">{t.documentViewer}</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Document */}
        {originalFile && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.originalDocument}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Eye className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-gray-600">{originalFile.name}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePreview(originalFile)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t.preview}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDownload(originalFile)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t.download}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Translated Document */}
        {translatedFile && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.translatedDocument}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-[3/4] bg-green-50 rounded-lg flex items-center justify-center border border-green-200">
                <div className="text-center space-y-2">
                  <Eye className="w-8 h-8 text-green-600 mx-auto" />
                  <p className="text-sm text-green-800">{translatedFile.name}</p>
                  <p className="text-xs text-green-600">{t.translatedTo} {targetLanguage}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePreview(translatedFile)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t.preview}
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleDownload(translatedFile)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t.download}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}