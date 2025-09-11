// OCR Service interface
export interface OCRResult {
  blocks: Array<{
    id: string;
    text: string;
    confidence: number;
    bbox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  pages: number;
  language?: string;
}

export class OCRService {
  async processDocument(fileBuffer: Buffer, mimeType: string, filename?: string): Promise<OCRResult> {
    // Mock OCR implementation for development
    console.log('🔍 Starting OCR processing for:', filename || 'unknown file');
    console.log('⚠️ Using mock OCR service for development');
    
    const mockContent = this.generateMockContent(mimeType);
    const blocks = this.createTextBlocks(mockContent);
    
    // Simulate processing time
    await this.simulateProcessingTime();
    
    const result: OCRResult = {
      blocks,
      pages: Math.ceil(blocks.length / 10),
      language: this.detectLanguage(mockContent.join(' ')),
    };
    
    console.log(`✅ Mock OCR completed: ${blocks.length} text blocks, ${result.pages} page(s)`);
    return result;
  }

  private generateMockContent(mimeType: string): string[] {
    if (mimeType.includes('pdf') || mimeType.includes('document')) {
      return [
        "Document Title: Annual Report 2024",
        "Executive Summary",
        "This report presents our company's achievements and financial performance for the fiscal year 2024.",
        "Key Performance Indicators:",
        "• Revenue increased by 15% compared to previous year",
        "• Customer satisfaction rate: 92%",
        "• Market expansion into 3 new regions",
        "Financial Overview",
        "Total revenue: $2.5 million",
        "Operating expenses: $1.8 million",
        "Net profit: $700,000",
        "Future Outlook",
        "We project continued growth in the coming year with strategic investments in technology and talent."
      ];
    } else if (mimeType.includes('image')) {
      return [
        "Welcome to Our Store",
        "Special Offer: 20% OFF",
        "Valid until December 31st",
        "Terms and conditions apply",
        "Visit us at: www.example.com",
        "Contact: info@example.com",
        "Phone: +1-555-0123"
      ];
    } else {
      return [
        "Sample text document content",
        "This is a plain text file with multiple lines",
        "Each line represents a paragraph or section",
        "Perfect for translation testing purposes"
      ];
    }
  }

  private createTextBlocks(mockContent: string[]) {
    return mockContent.map((text, index) => ({
      id: `block_${index + 1}`,
      text: text.trim(),
      confidence: Math.max(0.85, 0.95 + (crypto.getRandomValues(new Uint8Array(1))[0] / 255 * 0.05)),
      bbox: {
        x: 50 + (index % 2) * 300,
        y: 80 + (index * 45),
        width: Math.min(text.length * 8, 400),
        height: text.includes(':') || text.includes('•') ? 25 : 35,
      },
    }));
  }

  private async simulateProcessingTime() {
    // Simulate processing time with secure randomness
    const delay = 500 + (crypto.getRandomValues(new Uint8Array(1))[0] / 255 * 1000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private detectLanguage(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('hola') || lowerText.includes('gracias') || lowerText.includes('señor')) return 'es';
    if (lowerText.includes('bonjour') || lowerText.includes('merci') || lowerText.includes('monsieur')) return 'fr';
    if (lowerText.includes('guten tag') || lowerText.includes('danke') || lowerText.includes('herr')) return 'de';
    if (lowerText.includes('こんにちは') || lowerText.includes('ありがとう')) return 'ja';
    if (lowerText.includes('你好') || lowerText.includes('谢谢')) return 'zh';
    
    return 'en';
  }
}

export const ocrService = new OCRService();