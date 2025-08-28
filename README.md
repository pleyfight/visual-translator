# Visual Translator

A browser-based web application that allows users to upload images, extract text using OCR (Optical Character Recognition), and translate the extracted text into different languages.

## Features

- 📸 Image upload with drag-and-drop support
- 🔍 Client-side OCR using Tesseract.js
- 🌍 Pluggable translation providers (DeepL, Google Translate, LibreTranslate)
- 🎨 Modern UI built with Next.js App Router and Tailwind CSS
- 📱 Responsive design for desktop and mobile

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **OCR**: Tesseract.js (client-side)
- **UI Components**: Radix UI
- **Package Manager**: npm

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd visual-translator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file and configure translation providers:
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### Translation Providers

The application supports multiple translation providers. Configure them using environment variables:

#### 1. No-op Provider (Default)
```bash
TRANSLATION_PROVIDER=noop
```
Returns the input text unchanged or shows a helpful error message.

#### 2. DeepL
```bash
TRANSLATION_PROVIDER=deepl
DEEPL_API_KEY=your_deepl_api_key_here
DEEPL_API_URL=https://api-free.deepl.com/v2/translate
```

#### 3. Google Translate
```bash
TRANSLATION_PROVIDER=google
GOOGLE_TRANSLATE_API_KEY=your_google_api_key_here
```

#### 4. LibreTranslate
```bash
TRANSLATION_PROVIDER=libretranslate
LIBRETRANSLATE_API_URL=https://libretranslate.de/translate
LIBRETRANSLATE_API_KEY=your_libretranslate_api_key_here
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run tests

## Usage

1. **Upload an image**: Click the upload area or drag and drop an image file
2. **Extract text**: The app will automatically run OCR on the uploaded image
3. **Select target language**: Choose your desired translation language
4. **Translate**: Click the translate button to get the translated text

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Global layout and HTML template
│   ├── page.tsx           # Main application page
│   ├── globals.css        # Global Tailwind CSS styles
│   └── api/
│       └── translate/
│           └── route.ts   # Translation API endpoint
├── lib/
│   └── translate.ts       # Translation provider dispatcher
├── providers/             # Translation provider implementations
│   ├── deepl.ts
│   ├── google.ts
│   ├── libretranslate.ts
│   └── noop.ts
├── public/                # Static assets
└── ...config files
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.