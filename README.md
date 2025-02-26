# RAG Chat Widget

RAG Chat Widget is a customizable chat interface compatible with ChatGPT API, designed for easy integration into web applications. It's part of the [Panteo.ai](https://panteo.ai) project, which focuses on advanced AI-powered solutions.

## Main Features

- Compatible with ChatGPT API
- Customizable UI
- Easy integration
- Supports streaming responses
- Markdown rendering for rich text responses
- Responsive design with mobile-optimized interface
- Adaptive layout for different screen sizes

## Usage as External Script

After building the project, you can use the generated `/dist/rag-chat-widget.bundle.js` file as an external static script in any HTML file. Here's a minimal example of how to include and initialize the RAG Chat Widget:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RAG Chat Example</title>
</head>
<body>
    <h1>Welcome to RAG Chat Example</h1>

    <!-- Include the RAG Chat Widget script -->
    <script src="path/to/rag-chat-widget.bundle.js"></script>
    
    <!-- Initialize the RAG Chat Widget -->
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            RagChat({
                token: 'your_token_here',
                url: 'https://your-api-url.com/generate',
                buttonPosition: 'bottom-right',
                chatTitle: 'My RAG Chat',
                buttonOpenCaption: '💬',
                buttonCloseCaption: '✕',
                mobileBreakpointWidth: 768,
                mobileBreakpointHeight: 600
            });
        });
    </script>
</body>
</html>
```

Make sure to replace `'path/to/rag-chat-widget.bundle.js'` with the actual path to your bundle file, and provide your actual token and API URL.

## Setup and Usage

1. Copy the `.env.example` file and rename it to `.env`.
2. Fill the `.env` file with your actual data:
   ```
   RAG_CHAT_TOKEN=your_actual_token
   RAG_CHAT_URL=https://your-actual-url.com/api/generate
   ```
3. Install dependencies: `npm install`
4. To run the server with a production build: `npm start`
   This will build the project and start the server at http://localhost:3000
5. For development with hot reloading: `npm run dev`
   This will start the development server at http://localhost:9000

## Configuration

The RagChat widget can be customized using the following configuration options:

```javascript
RagChat({
    token: 'your_token_here', // API authentication token
    url: 'https://api-url.com/generate', // API endpoint URL
    buttonPosition: 'bottom-right', // Position of the chat button ('top-left', 'top-right', 'bottom-left', 'bottom-right')
    buttonColor: '#635bff', // Color of the chat button
    buttonOpenCaption: '💬', // Caption for chat button in closed state
    buttonCloseCaption: '✕', // Caption for chat button in open state
    mobileCloseCaption: '✕', // Caption for mobile close button
    chatBackgroundColor: 'rgba(255, 255, 255, 0.9)', // Background color of the chat window
    chatBorderColor: '#ccc', // Border color of the chat window
    inputBackgroundColor: '#f0f0f0', // Background color of the input field
    sendButtonColor: '#635bff', // Color of the send button
    fontFamily: 'Arial, sans-serif', // Font family for the chat
    fontSize: '14px', // Font size for the chat
    chatTitle: 'RAG Chat', // Title of the chat window
    clearButtonCaption: '🗑️ Clear History', // Caption for the clear history button
    mobileBreakpointWidth: 768, // Width threshold for mobile layout (in pixels)
    mobileBreakpointHeight: 600 // Height threshold for mobile layout (in pixels)
});
```

### Responsive Design Features

The widget now includes responsive design features:

- **Desktop Mode:**
  - Floating chat window with customizable size
  - Toggle button that switches between open/close captions
  - Standard clear history button

- **Mobile Mode** (screen width ≤ mobileBreakpointWidth or height ≤ mobileBreakpointHeight):
  - Full-screen chat interface
  - Dedicated close button in the header
  - Optimized layout for mobile devices
  - Automatic layout switching based on screen size

The widget automatically adapts its layout and behavior based on the device's screen size, providing an optimal user experience across all devices.