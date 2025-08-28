# Visual Translator Worker

A robust, TypeScript-based job processor for handling translation jobs in the Visual Translator application. This worker handles OCR processing, AI translation, and result storage with comprehensive error handling and monitoring.

## Features

- 🎧 **Real-time Job Processing**: Listens to Supabase real-time subscriptions for new jobs
- 🔍 **OCR Integration**: Extracts text from documents and images
- 🌐 **AI Translation**: Uses Google Gemini Pro for high-quality translations
- 📊 **Concurrent Processing**: Handles multiple jobs simultaneously with configurable limits
- ✅ **Data Validation**: Full Zod schema validation for all data structures
- 🛡️ **Error Handling**: Comprehensive error handling with job status tracking
- 📝 **Logging**: Detailed logging for monitoring and debugging
- 🔄 **Recovery**: Processes pending jobs on startup

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Supabase      │    │   Job Processor  │    │   AI Services   │
│   Real-time     │───▶│   Worker         │───▶│   (Gemini API)  │
│   Subscriptions │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   OCR Service    │
                       │   (Vision API /  │
                       │   Mock Service)  │
                       └──────────────────┘
```

## Job Processing Flow

1. **Job Detection**: Real-time subscription detects new `ai_jobs` with status `pending`
2. **Status Update**: Job status updated to `processing`
3. **Asset Download**: Downloads the asset file from Supabase Storage
4. **OCR Processing**: Extracts text blocks from the document/image
5. **Translation**: Translates each text block using Gemini API
6. **Result Assembly**: Combines OCR and translation results into structured format
7. **Validation**: Validates the complete result against Zod schemas
8. **Storage**: Saves results to `ai_results` table
9. **Completion**: Updates job status to `completed` or `failed`

## Installation

```bash
cd worker
npm install
```

## Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Configure your environment variables:
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
GEMINI_API_KEY=your_gemini_api_key

# Optional OCR Service
OCR_SERVICE_URL=https://your-ocr-service.com/api/ocr

# Worker Settings
MAX_CONCURRENT_JOBS=3
```

## Usage

### Development Mode

```bash
npm run dev
```

This starts the worker with TypeScript support and hot reloading.

### Production Mode

```bash
npm run build
npm start
```

### Processing Existing Jobs

The worker automatically processes any pending jobs on startup, then listens for new jobs in real-time.

## Job Types

### Translation Jobs

```typescript
interface TranslationJob {
  id: string
  user_id: string
  asset_id: string
  job_type: 'translate'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  config: {
    sourceLanguage: string | 'auto'
    targetLanguage: string
    assetType: string
    filename: string
  }
}
```

## Result Structure

The worker produces results that match the `analysisResultSchema`:

```typescript
interface AnalysisResult {
  originalText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  confidence: number
  detectedLanguage?: string
  textBlocks: Array<{
    id: string
    originalText: string
    translatedText: string
    confidence: number
    position: { x: number; y: number; width: number; height: number }
  }>
  metadata: {
    ocrEngine: string
    translationEngine: string
    processingTime: number
    pages: number
    totalBlocks: number
    documentType: string
    filename: string
  }
}
```

## OCR Integration

### Mock OCR (Development)

For development and testing, the worker includes a mock OCR service that generates sample text blocks.

### External OCR Services

For production, integrate with services like:

- **Google Cloud Vision API**
- **AWS Textract**
- **Azure Computer Vision**
- **Custom OCR endpoints**

Set the `OCR_SERVICE_URL` environment variable to use an external service.

### OCR API Contract

External OCR services should return:

```typescript
interface OCRResult {
  blocks: Array<{
    id: string
    text: string
    confidence: number
    bbox: { x: number; y: number; width: number; height: number }
  }>
  pages: number
  language?: string
}
```

## Translation Integration

### Gemini Pro API

The worker uses Google's Gemini Pro model for translations:

- **High Quality**: Advanced language understanding
- **Low Temperature**: Consistent, reliable translations
- **Context Aware**: Includes document context for better translations
- **Error Handling**: Comprehensive error handling and retries

### Translation Configuration

```typescript
const translationConfig = {
  temperature: 0.1,        // Low for consistency
  maxOutputTokens: 1000,   // Sufficient for most text blocks
  model: 'gemini-pro'      // Latest Gemini model
}
```

## Error Handling

### Job Failure Recovery

- Failed jobs are marked with status `failed`
- Error messages are stored in the `error_message` field
- Workers can be restarted to retry failed jobs (manual intervention)

### Common Error Scenarios

1. **Asset Download Failure**: File not found or access denied
2. **OCR Processing Failure**: Unsupported file format or corrupted file
3. **Translation API Failure**: API rate limits or service outages
4. **Validation Failure**: Result doesn't match expected schema
5. **Database Failure**: Connection issues or constraint violations

### Error Logging

```typescript
// Error logs include:
- Job ID and user context
- Error message and stack trace
- Processing stage where error occurred
- Asset information and configuration
```

## Monitoring

### Health Checks

The worker provides several monitoring capabilities:

```typescript
// Active job tracking
processor.activeJobs        // Set of currently processing job IDs
processor.maxConcurrentJobs // Maximum concurrent job limit
processor.isRunning         // Worker operational status
```

### Log Output

```bash
🤖 Starting Visual Translator Job Processor
✅ Supabase connection established
🔄 Checking for pending jobs...
📋 Found 2 pending jobs
📨 New job received: 123e4567-e89b-12d3-a456-426614174000
🚀 Processing job 123e4567-e89b-12d3-a456-426614174000
📊 Updating job status to processing
📥 Downloading asset for job
🔍 Running OCR on document.pdf
🌐 Translating 5 text blocks
📝 Combining results
✅ Validating analysis result
💾 Saving results
✅ Job completed successfully
```

## Performance

### Concurrency

- **Default**: 3 concurrent jobs
- **Configurable**: Set `MAX_CONCURRENT_JOBS` environment variable
- **Memory Aware**: Monitor memory usage when increasing concurrency

### Optimization Tips

1. **File Size Limits**: Implement reasonable file size limits (10MB default)
2. **OCR Caching**: Cache OCR results for identical files
3. **Translation Batching**: Batch small text blocks for API efficiency
4. **Resource Monitoring**: Monitor CPU and memory usage
5. **Rate Limiting**: Respect AI service rate limits

## Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["npm", "start"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: visual-translator-worker
spec:
  replicas: 3
  selector:
    matchLabels:
      app: visual-translator-worker
  template:
    metadata:
      labels:
        app: visual-translator-worker
    spec:
      containers:
      - name: worker
        image: visual-translator-worker:latest
        env:
        - name: SUPABASE_URL
          valueFrom:
            secretKeyRef:
              name: supabase-config
              key: url
        - name: SUPABASE_SERVICE_ROLE_KEY
          valueFrom:
            secretKeyRef:
              name: supabase-config
              key: service-role-key
```

### Process Management

For production deployments, use process managers like:

- **PM2**: `pm2 start job-processor.js --instances 3`
- **systemd**: Create service files for automatic restart
- **Docker Compose**: Multi-container orchestration
- **Kubernetes**: Scalable container deployment

## Testing

### Unit Tests

```bash
npm test
```

### Integration Testing

```bash
# Test with mock data
npm run test:integration

# Test with real services
npm run test:e2e
```

### Manual Testing

```bash
# Start worker in development mode
npm run dev

# Trigger a job via API
curl -X POST http://localhost:3000/api/jobs \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"assetId": "asset-uuid", "targetLanguage": "es"}'
```

## Troubleshooting

### Common Issues

1. **Worker Not Starting**
   - Check environment variables
   - Verify Supabase connection
   - Check port availability

2. **Jobs Not Processing**
   - Verify real-time subscriptions are active
   - Check job status in database
   - Review worker logs for errors

3. **OCR Failures**
   - Verify file format support
   - Check OCR service availability
   - Review file size limits

4. **Translation Failures**
   - Verify Gemini API key
   - Check API rate limits
   - Review text content for issues

### Debug Mode

```bash
DEBUG=* npm run dev
```

### Log Levels

Set `WORKER_LOG_LEVEL` to control verbosity:
- `error`: Only errors
- `warn`: Warnings and errors
- `info`: General information (default)
- `debug`: Detailed debugging information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests
4. Update documentation
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
