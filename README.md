# Google Calendar MCP Integration

A Model Context Protocol (MCP) integration for Google Calendar.

## Features

### Current Functionality
- **Event Management**
  - Create new calendar events
  - Delete existing events
  - List events for the current week
  - Reschedule events 

### Authentication
- OAuth2 authentication with Google Calendar API

## Setup

1. **Environment Variables**
   Create a `.env` file with your Google OAuth2 credentials:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_REDIRECT_URI=your_redirect_uri
   ```

2. **Installation**
   ```bash
   npm install
   ```

3. **Build**
   ```bash
   npm run build
   ```

## Usage

### Available Commands

1. **Create Event**
   - Creates a new calendar event
   - Supports natural language time inputs
   ```
   "Create an event for tomorrow at 2 PM"
   ``` 

2. **List Events**
   - Shows all events for the next 7 days
   - Includes event IDs for management
   ```
   "Show my events for the week"
   ```
3. **Delete Event**
   - Removes an event using its ID
```
"Delete the meeting tomorrow"
```
4. **Reschedule Event**
   - Combines delete and create to move events
```
 "Move my 2 PM meeting to 4 PM"
```
## Dependencies

- @modelcontextprotocol/sdk
- googleapis
- dotenv
- zod

## Contributing

Do whatever
