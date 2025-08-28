"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { validateTranslations, validateUILanguage } from './schemas';

export interface Translations {
  // Navigation & UI
  visualTranslator: string;
  addApiKey: string;
  documentTranslation: string;
  preserveFormatting: string;
  documentsTab: string;
  imagesTab: string;
  
  // File Upload
  uploadDocument: string;
  uploadImage: string;
  dragAndDrop: string;
  supportsFormats: string;
  removeFile: string;
  
  // Language & Translation
  sourceLanguage: string;
  targetLanguage: string;
  translateDocument: string;
  translateImage: string;
  translating: string;
  processing: string;
  
  // Progress Steps
  processingFile: string;
  analyzingContent: string;
  translatingText: string;
  finalizing: string;
  translationInProgress: string;
  pleaseWait: string;
  
  // Document Viewer
  documentViewer: string;
  originalDocument: string;
  translatedDocument: string;
  preview: string;
  download: string;
  translatedTo: string;
  
  // API Key Management
  apiConfiguration: string;
  geminiApiKey: string;
  enterApiKey: string;
  apiKeyStoredLocally: string;
  save: string;
  cancel: string;
  editApiKey: string;
  getApiKeyFromGoogle: string;
  freeTierUsage: string;
  requiredForTranslation: string;
  
  // Validation Messages
  pleaseAddApiKey: string;
  selectSourceLanguage: string;
  selectTargetLanguage: string;
  
  // Authentication
  signInToStart: string;
  signInAnonymously: string;
  
  // Languages (ISO codes)
  auto: string;
}

const translations: Record<string, Translations> = {
  en: {
    visualTranslator: "Visual Translator",
    addApiKey: "Add API Key",
    documentTranslation: "Document Translation",
    preserveFormatting: "Translate documents while preserving their original formatting",
    documentsTab: "Documents",
    imagesTab: "Images",
    uploadDocument: "Upload documents",
    uploadImage: "Upload images",
    dragAndDrop: "Drag and drop your file here, or click to browse",
    supportsFormats: "Supports",
    removeFile: "Remove",
    sourceLanguage: "Source Language",
    targetLanguage: "Target Language",
    translateDocument: "Translate Document",
    translateImage: "Translate Image",
    translating: "Translating...",
    processing: "Processing...",
    processingFile: "Processing file",
    analyzingContent: "Analyzing content",
    translatingText: "Translating text",
    finalizing: "Finalizing",
    translationInProgress: "Translation in Progress",
    pleaseWait: "Please wait while we process your document...",
    documentViewer: "Document Viewer",
    originalDocument: "Original Document",
    translatedDocument: "Translated Document",
    preview: "Preview",
    download: "Download",
    translatedTo: "Translated to",
    apiConfiguration: "API Configuration",
    geminiApiKey: "Gemini API Key",
    enterApiKey: "Enter your Gemini API key",
    apiKeyStoredLocally: "Your API key is stored locally and never sent to our servers.",
    save: "Save",
    cancel: "Cancel",
    editApiKey: "Edit API Key",
    getApiKeyFromGoogle: "• Get your API key from Google AI Studio",
    freeTierUsage: "• Free tier includes generous usage limits",
    requiredForTranslation: "• Required for translation functionality",
    pleaseAddApiKey: "Please add your API key to start translating",
    selectSourceLanguage: "Please select a source language",
    selectTargetLanguage: "Please select a target language",
    signInToStart: "Sign in to start translating",
    signInAnonymously: "Continue Anonymously",
    auto: "Auto-detect",
  },
  es: {
    visualTranslator: "Traductor Visual",
    addApiKey: "Agregar Clave API",
    documentTranslation: "Traducción de Documentos",
    preserveFormatting: "Traduce documentos manteniendo su formato original",
    documentsTab: "Documentos",
    imagesTab: "Imágenes",
    uploadDocument: "Subir documentos",
    uploadImage: "Subir imágenes",
    dragAndDrop: "Arrastra y suelta tu archivo aquí, o haz clic para navegar",
    supportsFormats: "Soporta",
    removeFile: "Eliminar",
    sourceLanguage: "Idioma Origen",
    targetLanguage: "Idioma Destino",
    translateDocument: "Traducir Documento",
    translateImage: "Traducir Imagen",
    translating: "Traduciendo...",
    processing: "Procesando...",
    processingFile: "Procesando archivo",
    analyzingContent: "Analizando contenido",
    translatingText: "Traduciendo texto",
    finalizing: "Finalizando",
    translationInProgress: "Traducción en Progreso",
    pleaseWait: "Por favor espera mientras procesamos tu documento...",
    documentViewer: "Visor de Documentos",
    originalDocument: "Documento Original",
    translatedDocument: "Documento Traducido",
    preview: "Vista Previa",
    download: "Descargar",
    translatedTo: "Traducido a",
    apiConfiguration: "Configuración de API",
    geminiApiKey: "Clave API de Gemini",
    enterApiKey: "Ingresa tu clave API de Gemini",
    apiKeyStoredLocally: "Tu clave API se almacena localmente y nunca se envía a nuestros servidores.",
    save: "Guardar",
    cancel: "Cancelar",
    editApiKey: "Editar Clave API",
    getApiKeyFromGoogle: "• Obtén tu clave API de Google AI Studio",
    freeTierUsage: "• El nivel gratuito incluye límites de uso generosos",
    requiredForTranslation: "• Requerido para la funcionalidad de traducción",
    pleaseAddApiKey: "Por favor agrega tu clave API para comenzar a traducir",
    selectSourceLanguage: "Por favor selecciona un idioma origen",
    selectTargetLanguage: "Por favor selecciona un idioma destino",
    signInToStart: "Inicia sesión para comenzar a traducir",
    signInAnonymously: "Continuar Anónimamente",
    auto: "Detectar automáticamente",
  },
  fr: {
    visualTranslator: "Traducteur Visuel",
    addApiKey: "Ajouter Clé API",
    documentTranslation: "Traduction de Documents",
    preserveFormatting: "Traduisez des documents en préservant leur formatage original",
    documentsTab: "Documents",
    imagesTab: "Images",
    uploadDocument: "Télécharger documents",
    uploadImage: "Télécharger images",
    dragAndDrop: "Glissez et déposez votre fichier ici, ou cliquez pour parcourir",
    supportsFormats: "Prend en charge",
    removeFile: "Supprimer",
    sourceLanguage: "Langue Source",
    targetLanguage: "Langue Cible",
    translateDocument: "Traduire Document",
    translateImage: "Traduire Image",
    translating: "Traduction...",
    processing: "Traitement...",
    processingFile: "Traitement du fichier",
    analyzingContent: "Analyse du contenu",
    translatingText: "Traduction du texte",
    finalizing: "Finalisation",
    translationInProgress: "Traduction en Cours",
    pleaseWait: "Veuillez patienter pendant que nous traitons votre document...",
    documentViewer: "Visualiseur de Documents",
    originalDocument: "Document Original",
    translatedDocument: "Document Traduit",
    preview: "Aperçu",
    download: "Télécharger",
    translatedTo: "Traduit en",
    apiConfiguration: "Configuration API",
    geminiApiKey: "Clé API Gemini",
    enterApiKey: "Entrez votre clé API Gemini",
    apiKeyStoredLocally: "Votre clé API est stockée localement et n'est jamais envoyée à nos serveurs.",
    save: "Enregistrer",
    cancel: "Annuler",
    editApiKey: "Modifier Clé API",
    getApiKeyFromGoogle: "• Obtenez votre clé API depuis Google AI Studio",
    freeTierUsage: "• Le niveau gratuit inclut des limites d'usage généreuses",
    requiredForTranslation: "• Requis pour la fonctionnalité de traduction",
    pleaseAddApiKey: "Veuillez ajouter votre clé API pour commencer à traduire",
    selectSourceLanguage: "Veuillez sélectionner une langue source",
    selectTargetLanguage: "Veuillez sélectionner une langue cible",
    signInToStart: "Connectez-vous pour commencer à traduire",
    signInAnonymously: "Continuer anonymement",
    auto: "Détection automatique",
  },
  de: {
    visualTranslator: "Visueller Übersetzer",
    addApiKey: "API-Schlüssel hinzufügen",
    documentTranslation: "Dokumentenübersetzung",
    preserveFormatting: "Übersetzen Sie Dokumente unter Beibehaltung ihrer ursprünglichen Formatierung",
    documentsTab: "Dokumente",
    imagesTab: "Bilder",
    uploadDocument: "Dokumente hochladen",
    uploadImage: "Bilder hochladen",
    dragAndDrop: "Ziehen Sie Ihre Datei hierher oder klicken Sie zum Durchsuchen",
    supportsFormats: "Unterstützt",
    removeFile: "Entfernen",
    sourceLanguage: "Quellsprache",
    targetLanguage: "Zielsprache",
    translateDocument: "Dokument übersetzen",
    translateImage: "Bild übersetzen",
    translating: "Übersetzen...",
    processing: "Verarbeitung...",
    processingFile: "Datei wird verarbeitet",
    analyzingContent: "Inhalt wird analysiert",
    translatingText: "Text wird übersetzt",
    finalizing: "Fertigstellung",
    translationInProgress: "Übersetzung läuft",
    pleaseWait: "Bitte warten Sie, während wir Ihr Dokument verarbeiten...",
    documentViewer: "Dokumentbetrachter",
    originalDocument: "Originaldokument",
    translatedDocument: "Übersetztes Dokument",
    preview: "Vorschau",
    download: "Herunterladen",
    translatedTo: "Übersetzt nach",
    apiConfiguration: "API-Konfiguration",
    geminiApiKey: "Gemini API-Schlüssel",
    enterApiKey: "Geben Sie Ihren Gemini API-Schlüssel ein",
    apiKeyStoredLocally: "Ihr API-Schlüssel wird lokal gespeichert und niemals an unsere Server gesendet.",
    save: "Speichern",
    cancel: "Abbrechen",
    editApiKey: "API-Schlüssel bearbeiten",
    getApiKeyFromGoogle: "• Holen Sie sich Ihren API-Schlüssel von Google AI Studio",
    freeTierUsage: "• Kostenlose Stufe enthält großzügige Nutzungsgrenzen",
    requiredForTranslation: "• Erforderlich für Übersetzungsfunktionalität",
    pleaseAddApiKey: "Bitte fügen Sie Ihren API-Schlüssel hinzu, um mit der Übersetzung zu beginnen",
    selectSourceLanguage: "Bitte wählen Sie eine Quellsprache",
    selectTargetLanguage: "Bitte wählen Sie eine Zielsprache",
    signInToStart: "Melden Sie sich an, um mit der Übersetzung zu beginnen",
    signInAnonymously: "Anonym fortfahren",
    auto: "Automatisch erkennen",
  },
};

interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: Translations;
  detectAndSetLanguage: () => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState('en');

  // Validate and set language with Zod schema
  const setValidatedLanguage = (lang: string) => {
    const validation = validateUILanguage(lang);
    if (validation.success) {
      setLanguage(validation.data);
      localStorage.setItem('ui-language', validation.data);
    } else {
      console.warn(`Invalid UI language: ${lang}, falling back to English`);
      setLanguage('en');
    }
  };

  const detectAndSetLanguage = async () => {
    try {
      // Try to get user's location and detect language based on region
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // Use a geolocation API to get country from coordinates
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
              );
              const data = await response.json();
              
              // Map countries to languages
              const countryToLanguage: Record<string, string> = {
                'Spain': 'es',
                'Mexico': 'es',
                'Argentina': 'es',
                'Colombia': 'es',
                'France': 'fr',
                'Germany': 'de',
                'Austria': 'de',
                'Switzerland': 'de',
                // Add more mappings as needed
              };
              
              const detectedLanguage = countryToLanguage[data.countryName] || 'en';
              setLanguage(detectedLanguage);
              localStorage.setItem('preferred-language', detectedLanguage);
            } catch (error) {
              console.warn('Failed to detect language from location:', error);
              fallbackToNavigatorLanguage();
            }
          },
          () => {
            // Geolocation failed, fallback to navigator language
            fallbackToNavigatorLanguage();
          }
        );
      } else {
        fallbackToNavigatorLanguage();
      }
    } catch (error) {
      console.warn('Language detection failed:', error);
      fallbackToNavigatorLanguage();
    }
  };

  const fallbackToNavigatorLanguage = () => {
    // Fallback to browser language
    const browserLang = navigator.language.split('-')[0];
    const validation = validateUILanguage(browserLang);
    const supportedLanguage = validation.success && translations[validation.data] ? validation.data : 'en';
    setValidatedLanguage(supportedLanguage);
  };

  useEffect(() => {
    // Check for saved language preference first
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage) {
      const validation = validateUILanguage(savedLanguage);
      if (validation.success && translations[validation.data]) {
        setLanguage(validation.data);
      } else {
        detectAndSetLanguage();
      }
    } else {
      detectAndSetLanguage();
    }
  }, []);

  // Validate translations on build
  useEffect(() => {
    Object.entries(translations).forEach(([lang, trans]) => {
      const validation = validateTranslations(trans);
      if (!validation.success) {
        console.warn(`Translation validation failed for ${lang}:`, validation.error.errors);
      }
    });
  }, []);

  const contextValue: I18nContextType = {
    language,
    setLanguage: setValidatedLanguage,
    t: translations[language] || translations.en,
    detectAndSetLanguage,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}