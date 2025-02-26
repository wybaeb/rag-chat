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
    mobileBreakpointHeight: 600 // Height threshold for mobile layout
});
```

## Building from Source

If you need to customize the widget further, you can build it from source:

### 1. Setup
```bash
git clone https://github.com/yourusername/rag-chat-widget.git
cd rag-chat-widget
npm install
```

### 2. Configuration
Copy `.env.example` to `.env` and set your values:
```
RAG_CHAT_TOKEN=your_actual_token
RAG_CHAT_URL=https://your-actual-url.com/api/generate
```

### 3. Build Options

#### Development Version
```bash
npm run build     # Creates dist/rag-chat-widget.bundle.js
# or
npm run dev      # Starts development server at http://localhost:9000
```
- Includes source maps
- Keeps console logs
- Unminified for debugging

#### Production Version
```bash
npm run build:prod        # Unix/Mac
npm run build:prod:win    # Windows
```
- Creates minified dist/rag-chat-widget.min.js
- Removes console logs and comments
- Optimized for production use

