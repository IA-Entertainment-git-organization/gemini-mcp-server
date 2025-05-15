import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from 'dotenv';
import { z } from "zod";
import { GeminiApiClient } from './gemini_api_client';
import fetch from 'node-fetch';

// Immediately send the startup message before anything else can write to stdout
process.stdout.write(JSON.stringify({
  jsonrpc: "2.0",
  method: "startup",
  params: {
    transport: "stdio"
  }
}) + '\n');

// Redirect stdout to stderr for everything else
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = (chunk: any, ...args: any[]) => {
  return process.stderr.write(chunk, ...args);
};

// Redirect console methods to stderr
const consoleMethods = ['log', 'info', 'warn', 'error', 'debug'] as const;
consoleMethods.forEach(method => {
  (console as any)[method] = (...args: any[]) => process.stderr.write(`[${method}] ` + args.join(' ') + '\n');
});

// Suppress npm and Node.js startup messages
process.env.NODE_ENV = 'production';
process.env.NO_UPDATE_NOTIFIER = '1';
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';
process.env.npm_config_loglevel = 'silent';

// Load environment variables
config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? '';
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

// Model ID for Gemini
const MODEL_ID = 'gemini-2.0-flash';

// Define tool schemas
const generateTextSchema = z.object({
  prompt: z.string().min(1),
  temperature: z.number().min(0).max(1).optional(),
  maxOutputTokens: z.number().min(1).max(8192).optional(),
  topK: z.number().min(1).max(40).optional(),
  topP: z.number().min(0).max(1).optional(),
  stream: z.boolean().optional(),
});

type GenerateTextParams = z.infer<typeof generateTextSchema>;

class GeminiMCPServer {
  private apiClient: GeminiApiClient;
  private server: McpServer;
  private transport: StdioServerTransport;
  private chatHistory: Array<{ role: string, parts: Array<{ text: string }> }> = [];

  constructor() {
    this.apiClient = new GeminiApiClient(GEMINI_API_KEY, MODEL_ID);
    
    this.server = new McpServer({
      name: "gemini",
      version: "1.0.0",
      capabilities: {
        tools: {
          generate_text: {
            description: "Generate text using Gemini Pro model",
            streaming: true
          }
        }
      }
    });

    this.transport = new StdioServerTransport();
  }

  private async generateText(params: GenerateTextParams) {
    try {
      const { prompt, temperature = 0.7, maxOutputTokens = 8192, topK, topP, stream = false } = params;
      
      console.log('Sending message to Gemini:', prompt);

      // Add user message to history
      this.chatHistory.push({
        role: 'user',
        parts: [{ text: prompt }]
      });

      // Make a direct API call to Gemini
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent?key=${GEMINI_API_KEY}`;
      
      const body = {
        contents: this.chatHistory,
        generationConfig: {
          temperature,
          maxOutputTokens,
          topK,
          topP,
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const responseData = await response.json();
      
      if (!responseData.candidates || !responseData.candidates[0] || !responseData.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      // Extract the text from the response
      const responseText = responseData.candidates[0].content.parts
        .map((part: any) => part.text || '')
        .join('');
      
      console.log('Received response from Gemini:', responseText);

      // Add assistant response to history
      this.chatHistory.push(responseData.candidates[0].content);

      return {
        content: [{
          type: "text" as const,
          text: responseText
        }]
      };
    } catch (err) {
      console.error('Error generating content:', err);
      return {
        content: [{
          type: "text" as const,
          text: err instanceof Error ? err.message : 'Internal error'
        }],
        isError: true
      };
    }
  }

  async start() {
    try {
      console.info('Initializing Gemini MCP server...');

      // Register generate_text tool
      this.server.tool(
        "generate_text",
        generateTextSchema.shape,
        async (args: GenerateTextParams) => this.generateText(args)
      );

      // Restore stdout for MCP communication
      process.stdout.write = originalStdoutWrite;
      
      // Connect using stdio transport
      await this.server.connect(this.transport);
      console.info('Server started successfully and waiting for messages...');
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async stop() {
    try {
      // Note: Disconnect is not yet supported in MCP SDK
      // await this.server.disconnect();
      console.info('Server stopped successfully');
    } catch (error) {
      console.error('Error stopping server:', error);
      process.exit(1);
    }
  }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.info('Server shutting down');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

// Start the server
const server = new GeminiMCPServer();
server.start().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});