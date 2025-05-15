// Type definitions for Gemini API interactions

// Configuration for text generation
export interface GenerationConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topK?: number;
  topP?: number;
}

// Part of a content message
export interface Part {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, any>;
  };
  functionResponse?: {
    name: string;
    response: { result: any };
  };
}

// Content message (system, user, or model)
export interface Content {
  role: string;
  parts: Part[];
}

// Response from generateContent API call
export interface GenerateContentResult {
  candidates?: {
    content: {
      parts: Part[];
      role: string;
    };
  }[];
}

// Simple API client for Gemini
export class GeminiApiClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  // Method to get API URL
  getApiUrl(): string {
    return `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
  }
}
