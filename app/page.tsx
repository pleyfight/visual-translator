'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Tesseract from 'tesseract.js'
import Image from 'next/image'
import { Upload, Loader2, FileImage, Languages } from 'lucide-react'

interface TranslationRequest {
  text: string
  targetLang: string
}

export default function Home() {
  const [image, setImage] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [ocrText, setOcrText] = useState<string>('')
  const [translatedText, setTranslatedText] = useState<string>('')
  const [targetLang, setTargetLang] = useState<string>('es')
  const [isProcessingOcr, setIsProcessingOcr] = useState<boolean>(false)
  const [isTranslating, setIsTranslating] = useState<boolean>(false)
  const [ocrProgress, setOcrProgress] = useState<number>(0)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setImage(file)
      setImageUrl(URL.createObjectURL(file))
      setOcrText('')
      setTranslatedText('')
      processOcr(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    multiple: false
  })

  const processOcr = async (file: File) => {
    setIsProcessingOcr(true)
    setOcrProgress(0)
    
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100))
          }
        }
      })
      setOcrText(text.trim())
    } catch (error) {
      console.error('OCR Error:', error)
      setOcrText('Error extracting text from image.')
    } finally {
      setIsProcessingOcr(false)
      setOcrProgress(0)
    }
  }

  const translateText = async () => {
    if (!ocrText.trim()) return

    setIsTranslating(true)
    setTranslatedText('')

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: ocrText,
          targetLang
        } as TranslationRequest),
      })

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`)
      }

      const data = await response.json()
      setTranslatedText(data.translatedText || 'Translation failed')
    } catch (error) {
      console.error('Translation Error:', error)
      setTranslatedText('Error translating text. Please check your configuration.')
    } finally {
      setIsTranslating(false)
    }
  }

  const languages = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Visual Translator
        </h1>
        <p className="text-lg text-gray-600">
          Upload an image, extract text with OCR, and translate to any language
        </p>
      </div>

      {/* Image Upload Area */}
      <div className="mb-8">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            {imageUrl ? (
              <div className="relative max-h-64 w-full">
                <Image
                  src={imageUrl}
                  alt="Uploaded"
                  width={400}
                  height={256}
                  className="rounded-lg shadow-md object-contain max-h-64 w-auto mx-auto"
                />
              </div>
            ) : (
              <Upload className="w-12 h-12 text-gray-400" />
            )}
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive
                  ? 'Drop the image here'
                  : 'Drag & drop an image, or click to select'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports PNG, JPG, JPEG, GIF, BMP, WebP
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* OCR Processing */}
      {isProcessingOcr && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Extracting text from image...
              </p>
              <div className="mt-1 bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
              <p className="text-xs text-blue-700 mt-1">{ocrProgress}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Extracted Text */}
      {ocrText && (
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-3">
            <FileImage className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Extracted Text
            </h2>
          </div>
          <div className="bg-white p-4 border border-gray-200 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
              {ocrText}
            </pre>
          </div>
        </div>
      )}

      {/* Translation Section */}
      {ocrText && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Languages className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Translation
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <button
                onClick={translateText}
                disabled={isTranslating || !ocrText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Translating...</span>
                  </>
                ) : (
                  <span>Translate</span>
                )}
              </button>
            </div>
          </div>

          {translatedText && (
            <div className="bg-white p-4 border border-gray-200 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-800">
                {translatedText}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}