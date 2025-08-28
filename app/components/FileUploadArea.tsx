"use client";

import { useCallback, useState } from 'react';
import { useDropzone, type Accept } from 'react-dropzone';
import { Upload, FileText, Image, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

interface FileUploadAreaProps {
  acceptedTypes: 'documents' | 'images';
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export function FileUploadArea({ acceptedTypes, onFileSelect, selectedFile }: FileUploadAreaProps) {
  const { t } = useI18n();
  const [isDragOver, setIsDragOver] = useState(false);

    const getAcceptedFormats = useCallback((): Accept => {
    if (acceptedTypes === 'documents') {
      return {
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'text/plain': ['.txt'],
      };
    } else {
      return {
        'image/jpeg': ['.jpeg', '.jpg'],
        'image/png': ['.png'],
        'image/webp': ['.webp'],
        'image/gif': ['.gif'],
      };
    }
  }, [acceptedTypes]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
    setIsDragOver(false);
  }, [onFileSelect]);

  const acceptedFormats = getAcceptedFormats();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats,
    multiple: false,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSupportedFormats = () => {
    if (acceptedTypes === 'documents') {
      return 'PDF, DOC, DOCX, TXT';
    } else {
      return 'JPG, PNG, WEBP, GIF';
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive || isDragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          selectedFile && "border-green-500 bg-green-50"
        )}
      >
        <input {...getInputProps()} />
        
        {selectedFile ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              {acceptedTypes === 'documents' ? (
                <FileText className="w-12 h-12 text-green-600" />
              ) : (
                <Image className="w-12 h-12 text-green-600" />
              )}
            </div>
            <div className="space-y-2">
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={removeFile}
              className="mt-2"
            >
              <X className="w-4 h-4 mr-2" />
              {t.removeFile}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <Upload className="w-12 h-12 text-gray-400" />
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop your file here' : (acceptedTypes === 'documents' ? t.uploadDocument : t.uploadImage)}
              </p>
              <p className="text-sm text-gray-500">
                {t.dragAndDrop}
              </p>
              <p className="text-xs text-gray-400">
                {t.supportsFormats}: {getSupportedFormats()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}