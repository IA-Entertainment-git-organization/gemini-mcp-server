# gemini-mcp-server

A TypeScript implementation of a Model Context Protocol (MCP) server that integrates with Google's Gemini model using direct API calls.

<a href="https://glama.ai/mcp/servers/@IA-Entertainment-git-organization/gemini-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@IA-Entertainment-git-organization/gemini-mcp-server/badge" alt="Gemini Server MCP server" />
</a>

## Features

- Uses direct calls to the Gemini API (no deprecated SDK)
- Supports the latest Gemini 2.0 Flash model
- Implements MCP protocol for seamless integration with Claude
- Maintains conversation context for natural interactions

## MCP Tools

### generate_text
*From server: gemini*

Generate text using Gemini model with configurable parameters.

## Prerequisites

- Node.js 18 or higher
- Google Gemini API key
- TypeScript
- Claude Desktop app

## Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR-USERNAME/gemini-mcp-server.git
cd gemini-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build:
```bash
npm run build
```

## Claude Desktop Integration

To use this server with Claude Desktop:

1. Open Claude Desktop
2. Go to Settings > Developer
3. Click "Edit Config"
4. Add the following configuration:

```json
"gemini": {
  "command": "node",
  "args": ["path\\to\\dist\\gemini_mcp_server.js"],
  "env": {
    "GEMINI_API_KEY": "gemini_api_key"
  },
  "cwd": "path\\to\\gemini-mcp-server"
}
```

Replace:
- `/path/to/gemini-mcp-server` with the absolute path to your repository
- `your_api_key_here` with your actual Google Gemini API key

The server will now be available in Claude Desktop's MCP server list.

## API Implementation

This server uses direct HTTP requests to the Gemini API endpoint. The API request format follows Google's official documentation:

```
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=GEMINI_API_KEY" \
-H 'Content-Type: application/json' \
-X POST \
-d '{
  "contents": [{
    "parts":[{"text": "Explain how AI works"}]
    }]
   }'
```

## Testing

You can test the direct API implementation using the example script:
```
node dist/example_direct_api.js "Your prompt here"
```

## License

MIT