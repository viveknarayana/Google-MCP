import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { google } from 'googleapis';
import dotenv from 'dotenv';
import { z } from "zod";

dotenv.config();

// creating client for google api access
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// creating MCP server
const server = new McpServer({
  name: "google-calendar",
  version: "1.0.0"
});

// gets auth url
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

// figure out setting auth code - persist code or is there other way to store?

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);