# RAG Chat Widget

RAG Chat Widget is a customizable chat interface compatible with ChatGPT API, designed for easy integration into web applications. It's part of the [Panteo.ai](https://panteo.ai) project, which focuses on advanced AI-powered solutions.

## Features

- **Desktop Mode:**
  - Floating chat window with customizable size
  - Resizable from multiple points:
    - Top-left corner (diagonal resize)
    - Top edge (vertical resize)
    - Left edge (horizontal resize)
  - Persistent window dimensions between sessions
  - Smart size constraints to prevent overflow

- **Mobile Mode:**
  - Full-screen chat interface
  - Dedicated close button
  - Optimized mobile layout
  - Automatic mode switching based on screen size

## Quick Start

The fastest way to integrate RAG Chat Widget is to use the pre-built minified version directly from our repository:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RAG Chat Example</title>
</head>
<body>
    <!-- Include the RAG Chat Widget script -->
    <script src="https://raw.githubusercontent.com/wybaeb/rag-chat/master/dist/rag-chat-widget.min.js"></script>
    
    <!-- Initialize the widget -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            RagChat({
                token: 'your_token_here',
                url: 'https://your-api-url.com/generate',
                chatTitle: 'My Chat Assistant'
            });
        });
    </script>
</body>
</html>
```

You can also download the minified file directly from our [repository](https://github.com/wybaeb/rag-chat/blob/master/dist/rag-chat-widget.min.js) and host it on your own server.

## Configuration

The RagChat widget can be customized using these configuration options:

```javascript
RagChat({
    // Required settings
    token: 'your_token_here', // API authentication token
    url: 'https://api-url.com/generate', // API endpoint URL

    // Appearance
    buttonPosition: 'bottom-right', // Position of chat button ('top-left', 'top-right', 'bottom-left', 'bottom-right')
    buttonColor: '#635bff', // Color of chat button
    buttonOpenCaption: '💬', // Caption for chat button in closed state
    buttonCloseCaption: '✕', // Caption for chat button in open state
    mobileCloseCaption: '✕', // Caption for mobile close button
    chatTitle: 'RAG Chat', // Title of chat window
    clearButtonCaption: '🗑️ Clear History', // Caption for clear history button

    // Window settings
    chatBackgroundColor: 'rgba(255, 255, 255, 0.9)', // Background color
    chatBorderColor: '#ccc', // Border color
    inputBackgroundColor: '#f0f0f0', // Input field background
    sendButtonColor: '#635bff', // Send button color
    fontFamily: 'Arial, sans-serif', // Font family
    fontSize: '14px', // Font size

    // Size and layout
    chatMargin: 20, // Margin from window edges (pixels)
    minChatWidth: 300, // Minimum width (pixels)
    minChatHeight: 400, // Minimum height (pixels)
    defaultChatWidth: 400, // Default width (pixels)
    defaultChatHeight: 500, // Default height (pixels)
    mobileBreakpointWidth: 768, // Width threshold for mobile layout
    mobileBreakpointHeight: 600, // Height threshold for mobile layout

    // Event handlers
    onStartResponse: function(e) {
        // Called when server starts responding to user message
        console.log('Server starts to respond!', e);
        // e.timestamp - Date when response started
        // e.userMessage - User's message that triggered the response
        // e.response - Fetch response object
    }
});
```

## Event Handlers

The RAG Chat Widget supports event handlers that allow you to hook into various chat lifecycle events.

### onStartResponse

The `onStartResponse` event handler is triggered when the server starts responding to a user's message. This event fires immediately after the server returns a successful HTTP response but before the streaming content begins.

**Usage:**
```javascript
RagChat({
    token: 'your_token_here',
    url: 'https://your-api-url.com/generate',
    onStartResponse: function(eventData) {
        console.log('Server started responding!', eventData);
        
        // Example: Track analytics
        analytics.track('chat_response_started', {
            userMessage: eventData.userMessage,
            timestamp: eventData.timestamp
        });
        
        // Example: Show custom loading indicator
        showCustomLoader();
        
        // Example: Log response time
        window.responseStartTime = eventData.timestamp;
    }
});
```

**Event Data Object:**
- `timestamp` (Date): The exact time when the server started responding
- `userMessage` (string): The user's message that triggered this response
- `response` (Response): The fetch Response object containing status, headers, etc.

**Use Cases:**
- Analytics tracking for response times
- Custom loading indicators
- Logging user interactions
- Performance monitoring
- Custom notifications

**Error Handling:**
If your event handler throws an error, it will be caught and logged to the console without affecting the chat functionality.

## Environment Setup

1. Create your environment configuration:
```bash
cp .env.example .env
```

2. Configure your `.env` file:
```ini
RAG_CHAT_TOKEN=your_token_here
RAG_CHAT_URL=https://your-api-url.com/generate
PORT=9000  # Optional, default is 9000
```

## Development Modes

### 1. Production Mode (Default)
```bash
npm start        # Unix/Mac
# or
npm run start:win  # Windows
```
This will:
- Generate minified production bundle (rag-chat-widget.min.js)
- Start development server at http://localhost:9000
- Open browser automatically
- Use production optimizations
- Remove console logs and debugging info
- Minimize bundle size

### 2. Development Mode
```bash
npm run start:dev
```
Features:
- Start development server with hot reload
- Use unminified code with source maps
- Enable detailed console logging
- Better for debugging and development
- Watch for file changes

### 3. Build Without Server
```bash
npm run build:prod        # Production build (Unix/Mac)
npm run build:prod:win    # Production build (Windows)
npm run build            # Development build
```

The builds will be available in `/dist` directory:
- `rag-chat-widget.min.js` - Production version
- `rag-chat-widget.bundle.js` - Development version

Note: The production version (min.js) is tracked in git and available directly from the repository for easy integration.

### Port Configuration
By default, the development server runs on port 9000. You can change this by:
1. Adding PORT to your .env file:
```ini
PORT=8000  # or any other port
```
2. Or using the PORT environment variable when running:
```bash
PORT=8000 npm start
```

## Building from Source

If you need to customize the widget further, you can build it from source:

### Development

### Quick Start
```bash
git clone https://github.com/wybaeb/rag-chat.git
cd rag-chat
npm install
```

### Running the Project

#### Production Mode (Recommended for Testing)
```bash
npm start        # Unix/Mac
# or
npm run start:win  # Windows
```
This will:
- Generate minified production bundle (rag-chat-widget.min.js)
- Start development server at http://localhost:9000
- Open browser automatically
- Use production optimizations

#### Development Mode
```bash
npm run start:dev
```
This will:
- Start development server with hot reload
- Use unminified code with source maps
- Enable detailed console logging
- Better for debugging and development

### Building Without Server

#### Production Build
```bash
npm run build:prod        # Unix/Mac
npm run build:prod:win    # Windows
```
Creates minified `/dist/rag-chat-widget.min.js`

#### Development Build
```bash
npm run build
```
Creates unminified `/dist/rag-chat-widget.bundle.js`

### Port Configuration
By default, the development server runs on port 9000. You can change this by:
1. Adding PORT to your .env file:
```env
PORT=8000  # or any other port
```
2. Or using the PORT environment variable when running:
```bash
PORT=8000 npm start
```

