# Visual Translator

A secure, AI-powered document translation application that preserves formatting while translating documents and images. Built with Next.js, Supabase, and Google Gemini AI.

## 🔒 Security Features

- **Encryption in Transit**: All API and database connections use TLS/HTTPS automatically via Supabase
- **Encryption at Rest**: All data in PostgreSQL database and Supabase Storage is encrypted at disk level
- **Row Level Security (RLS)**: Database access controlled by PostgreSQL policies
- **Secure Authentication**: Anonymous authentication with secure session management
- **API Key Security**: Gemini API keys are stored locally and never sent to our servers
- **Service Role Isolation**: Backend worker uses elevated permissions, isolated from client

## 🚀 Features

- **Multi-format Support**: PDF, DOC, DOCX, TXT documents and JPG, PNG, WEBP, GIF images
- **80+ Languages**: Comprehensive language support with auto-detection
- **Format Preservation**: Maintains original document structure and layout
- **Real-time Progress**: Live translation progress tracking
- **Multi-language UI**: Interface available in English, Spanish, French, and German
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Storage + Auth + Realtime)
- **AI**: Google Gemini 1.5 Flash API
- **Authentication**: Supabase Anonymous Auth
- **Deployment**: Vercel (frontend) + Node.js worker

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google AI Studio account (for Gemini API key)

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd visual-translator
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and keys
3. In the SQL Editor, run the migration script:
   ```sql
   -- Copy and paste the content from supabase/migrations/0001_initial_schema.sql
   ```
4. Create a storage bucket named "assets":
   - Go to Storage
   - Create new bucket: `assets`
   - Make it private (not public)

### 3. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/)
2. Create an API key
3. Note: Free tier includes generous usage limits

### 4. Configure Environment Variables

1. Copy the environment template:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` with your actual credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_URL=https://your-project.supabase.co
   GEMINI_API_KEY=your_gemini_api_key
   ```

### 5. Start the Application

```bash
# Start the Next.js frontend
npm run dev

# In a separate terminal, start the AI worker (optional for testing UI)
cd worker
npm install
npm start
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes (upload, jobs)
│   ├── components/        # React components
│   └── globals.css        # Global styles
├── components/ui/         # shadcn/ui components
├── lib/                   # Utility libraries
│   ├── supabase.ts       # Supabase client config
│   ├── i18n.tsx          # Internationalization
│   └── utils.ts          # Helper functions
├── supabase/             # Database schema and migrations
├── worker/               # AI translation worker
└── public/               # Static assets
```

## 🔄 How It Works

1. **File Upload**: User uploads document/image via drag-and-drop interface
2. **Secure Storage**: File is uploaded to Supabase Storage with RLS policies
3. **Job Creation**: Translation job is created in the database
4. **AI Processing**: Worker processes the job using Gemini API
5. **Real-time Updates**: UI receives live updates via Supabase realtime
6. **Result Display**: Translated content is displayed with original formatting

## 🌐 Internationalization

The UI supports multiple languages with automatic region detection:

- **English** (en) - Default
- **Spanish** (es) - Español  
- **French** (fr) - Français
- **German** (de) - Deutsch

Users can manually switch languages using the language selector in the top bar.

## 🚀 Deployment

### Frontend (Vercel)

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Worker (Node.js Server)

The worker can be deployed to any Node.js hosting service:

```bash
# Production worker setup
cd worker
npm install --production
npm start
```

For production, consider using PM2 or similar process manager:

```bash
npm install -g pm2
pm2 start translation-worker.js --name "visual-translator-worker"
```

## 🧪 Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build
```

## 📝 API Documentation

### Upload Endpoint
```
POST /api/upload
Content-Type: multipart/form-data

Body: FormData with 'file' field
Response: { asset: AssetObject, message: string }
```

### Jobs Endpoint
```
POST /api/jobs
Content-Type: application/json

Body: { assetId: string, targetLanguage: string, sourceLanguage?: string }
Response: { job: JobObject, message: string }

GET /api/jobs?jobId=<id>
Response: { jobs: JobObject }
```

## 🔐 Security Considerations

- API keys are stored locally in browser localStorage
- Service role key is only used by backend worker, never exposed to client
- All database access is controlled by RLS policies
- File uploads are validated for type and size
- All communication is over HTTPS
- Authentication is handled by Supabase with secure session management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

---

Built with ❤️ using Next.js, Supabase, and Google Gemini AI
