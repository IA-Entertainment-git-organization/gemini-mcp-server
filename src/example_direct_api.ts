import fetch from 'node-fetch';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

/**
 * A simple example showing how to call Gemini directly using the API
 */
async function callGemini(prompt: string) {
  const model = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  try {
    console.log(`Sending request to Gemini API: "${prompt}"`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    // Extract text from response
    const responseText = data.candidates[0].content.parts
      .map((part: any) => part.text || '')
      .join('');
    
    console.log('\nResponse from Gemini:');
    console.log('-------------------');
    console.log(responseText);
    console.log('-------------------');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Allow running this script directly
if (require.main === module) {
  const prompt = process.argv[2] || 'Explain how AI works in 3 sentences.';
  callGemini(prompt);
}

export { callGemini };
