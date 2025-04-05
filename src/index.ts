import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { z } from "zod";

// Load environment variables
dotenv.config();

// Check for required environment variables
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
  throw new Error('Missing required environment variables');
}

console.log(process.env.GOOGLE_REDIRECT_URI)

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Create MCP server instance
const server = new McpServer({
  name: "google-calendar",
  version: "1.0.0"
});

// Tool to get auth URL
server.tool(
  "get-auth-url",
  "Get Google OAuth2 authorization URL",
  {},
  async () => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar']
    });

    return {
      content: [{
        type: "text",
        text: `Please visit this URL to authorize the application: ${authUrl}`
      }]
    };
  }
);

// Tool to set auth code
server.tool(
  "set-auth-code",
  "Set the authorization code from Google OAuth2",
  {
    code: z.string().describe("The authorization code from Google OAuth2 callback")
  },
  async ({ code }) => {
    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      
      return {
        content: [{
          type: "text",
          text: "Successfully authenticated with Google Calendar!"
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error setting authentication: ${error?.message || 'Unknown error'}`
        }]
      };
    }
  }
);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);