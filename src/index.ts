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

//console.log(process.env.GOOGLE_REDIRECT_URI)

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
          text: `Error setting authentication: ${error?.message}`
        }]
      };
    }
  }
);

// Tool to create calendar event
server.tool(
  "create-event",
  "Create a Google Calendar event",
  {
    title: z.string().describe("Title of the event"),
    time: z.string().describe("Time of the event (e.g., '3pm tomorrow', '2024-04-05 15:00')")
  },
  async ({ title, time }) => {
    const eventTime = new Date();
    if (time.toLowerCase().includes('tomorrow')) {
      eventTime.setDate(eventTime.getDate() + 1);
      const timeMatch = time.match(/(\d+)(?::\d+)?\s*(am|pm)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        if (timeMatch[2]?.toLowerCase() === 'pm') hours += 12;
        eventTime.setHours(hours, 0, 0, 0);
      }
    } else {
      eventTime.setTime(Date.parse(time));
    }

    const endTime = new Date(eventTime);
    endTime.setHours(endTime.getHours() + 1);

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: title,
        start: {
          dateTime: eventTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      },
    });

    return {
      content: [{
        type: "text",
        text: `Event created: ${response.data.htmlLink}`
      }]
    };
  }
);

// Tool to list calendar events for the week
server.tool(
  "list-events",
  "List Google Calendar events for the current week",
  {},
  async () => {
    try {
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + 7);
      endOfWeek.setHours(23, 59, 59, 999);

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfWeek.toISOString(),
        timeMax: endOfWeek.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items;
      if (!events || events.length === 0) {
        return {
          content: [{
            type: "text",
            text: "No events found for the week."
          }]
        };
      }

      const eventList = events.map(event => {
        const start = event.start?.dateTime || event.start?.date;
        const formattedDate = new Date(start!).toLocaleString();
        return `${event.summary} - ${formattedDate}`;
      }).join('\n');

      return {
        content: [{
          type: "text",
          text: `Events for the week:\n${eventList}`
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error fetching events: ${error?.message}`
        }]
      };
    }
  }
);

// Start the server
const transport = new StdioServerTransport();
await server.connect(transport);