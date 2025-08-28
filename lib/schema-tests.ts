/**
 * Schema Validation Tests
 * 
 * This file contains tests to validate that our Zod schemas work correctly.
 * Run with: node --loader ts-node/esm lib/schema-tests.ts
 */

const { 
  translationSchema,
  languageCodeSchema,
  uiLanguageSchema,
  jobRequestSchema,
  validateTranslations,
  validateLanguageCode,
  validateUILanguage
} = require('./schemas');

// Test data
const sampleTranslations = {
  visualTranslator: 'Visual Translator',
  addApiKey: 'Add API Key',
  documentTranslation: 'Document Translation',
  preserveFormatting: 'Preserve Formatting',
  documentsTab: 'Documents',
  imagesTab: 'Images',
  uploadDocument: 'Upload Document',
  uploadImage: 'Upload Image',
  dragAndDrop: 'Drag and Drop',
  supportsFormats: 'Supports Formats',
  removeFile: 'Remove File',
  sourceLanguage: 'Source Language',
  targetLanguage: 'Target Language',
  translateDocument: 'Translate Document',
  translateImage: 'Translate Image',
  translating: 'Translating...',
  processing: 'Processing...',
  processingFile: 'Processing File',
  analyzingContent: 'Analyzing Content',
  translatingText: 'Translating Text',
  finalizing: 'Finalizing',
  translationInProgress: 'Translation in Progress',
  pleaseWait: 'Please Wait',
  documentViewer: 'Document Viewer',
  originalDocument: 'Original Document',
  translatedDocument: 'Translated Document',
  preview: 'Preview',
  download: 'Download',
  translatedTo: 'Translated To',
  apiConfiguration: 'API Configuration',
  geminiApiKey: 'Gemini API Key',
  enterApiKey: 'Enter API Key',
  apiKeyStoredLocally: 'API Key Stored Locally',
  save: 'Save',
  cancel: 'Cancel',
  editApiKey: 'Edit API Key',
  getApiKeyFromGoogle: 'Get API Key from Google',
  freeTierUsage: 'Free Tier Usage',
  requiredForTranslation: 'Required for Translation',
  pleaseAddApiKey: 'Please Add API Key',
  selectSourceLanguage: 'Select Source Language',
  selectTargetLanguage: 'Select Target Language',
  signInToStart: 'Sign In to Start',
  signInAnonymously: 'Sign In Anonymously',
  auto: 'Auto-detect',
};

const runTests = () => {
  console.log('🧪 Running Schema Validation Tests...\n');

  // Test 1: Translation Schema
  console.log('1. Testing Translation Schema:');
  const translationTest = validateTranslations(sampleTranslations);
  if (translationTest.success) {
    console.log('✅ Translation schema validation passed');
  } else {
    console.log('❌ Translation schema validation failed:', translationTest.error.errors);
  }

  // Test 2: Language Code Schema
  console.log('\n2. Testing Language Code Schema:');
  const validLanguages = ['en', 'es', 'fr', 'de', 'zh', 'ja', 'auto'];
  const invalidLanguages = ['invalid', 'xxx', '', 123];

  validLanguages.forEach(lang => {
    const test = validateLanguageCode(lang);
    if (test.success) {
      console.log(`✅ ${lang} is valid`);
    } else {
      console.log(`❌ ${lang} should be valid but failed`);
    }
  });

  invalidLanguages.forEach(lang => {
    const test = validateLanguageCode(lang);
    if (!test.success) {
      console.log(`✅ ${lang} correctly rejected`);
    } else {
      console.log(`❌ ${lang} should be invalid but passed`);
    }
  });

  // Test 3: UI Language Schema
  console.log('\n3. Testing UI Language Schema:');
  const validUILanguages = ['en', 'es', 'fr', 'de'];
  const invalidUILanguages = ['zh', 'ja', 'invalid', ''];

  validUILanguages.forEach(lang => {
    const test = validateUILanguage(lang);
    if (test.success) {
      console.log(`✅ UI language ${lang} is valid`);
    } else {
      console.log(`❌ UI language ${lang} should be valid but failed`);
    }
  });

  invalidUILanguages.forEach(lang => {
    const test = validateUILanguage(lang);
    if (!test.success) {
      console.log(`✅ UI language ${lang} correctly rejected`);
    } else {
      console.log(`❌ UI language ${lang} should be invalid but passed`);
    }
  });

  // Test 4: Job Request Schema
  console.log('\n4. Testing Job Request Schema:');
  
  const validJobRequest = {
    assetId: '123e4567-e89b-12d3-a456-426614174000',
    targetLanguage: 'es',
    sourceLanguage: 'en',
    jobType: 'translate' as const
  };

  const jobTest = jobRequestSchema.safeParse(validJobRequest);
  if (jobTest.success) {
    console.log('✅ Valid job request passed');
  } else {
    console.log('❌ Valid job request failed:', jobTest.error.errors);
  }

  const invalidJobRequest = {
    assetId: 'invalid-uuid',
    targetLanguage: 'invalid-lang',
  };

  const invalidJobTest = jobRequestSchema.safeParse(invalidJobRequest);
  if (!invalidJobTest.success) {
    console.log('✅ Invalid job request correctly rejected');
  } else {
    console.log('❌ Invalid job request should have failed');
  }

  // Test 5: Missing Translation Keys
  console.log('\n5. Testing Missing Translation Keys:');
  const incompleteTranslations = {
    visualTranslator: 'Visual Translator',
    addApiKey: 'Add API Key',
    // Missing many required keys...
  };

  const incompleteTest = validateTranslations(incompleteTranslations);
  if (!incompleteTest.success) {
    console.log('✅ Incomplete translations correctly rejected');
    console.log(`   Missing ${incompleteTest.error.errors.length} required keys`);
  } else {
    console.log('❌ Incomplete translations should have failed');
  }

  console.log('\n🎉 Schema validation tests completed!');
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests };
