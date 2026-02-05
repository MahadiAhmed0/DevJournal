import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not configured. AI features will be unavailable.');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-2.5-flash for fast, efficient text summarization
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.logger.log('Gemini AI service initialized');
  }

  /**
   * Generate a concise summary of the provided text.
   * @param text The text content to summarize
   * @returns A promise resolving to the summary string
   */
  async generateSummary(text: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini AI is not configured. Please set GEMINI_API_KEY.');
    }

    if (!text || text.trim().length === 0) {
      return '';
    }

    const prompt = `Please provide a concise summary (2-3 sentences) of the following text. Focus on the main points and key takeaways. Do not include any preamble like "Here is a summary:" - just provide the summary directly.

Text to summarize:
${text}`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text().trim();

      return summary;
    } catch (error) {
      this.logger.error('Failed to generate summary', error);
      throw new Error('Failed to generate summary. Please try again later.');
    }
  }

  /**
   * Check if the Gemini service is properly configured and available.
   */
  isAvailable(): boolean {
    return !!this.model;
  }
}
