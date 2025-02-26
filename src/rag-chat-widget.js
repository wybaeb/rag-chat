import { createStyles } from './styles';
import { loadChatHistory, clearChatHistory } from './message-handler';
import { createElement, appendChildren } from './utils';
import { marked } from 'marked';

function initRagChat(config = {}) {
    const defaultConfig = {
        token: '',
        url: 'http://localhost:3000/generate', // Изменим значение по умолчанию
        buttonPosition: 'bottom-right',
        buttonColor: '#635bff',
        buttonCaption: '💬',
        chatBackgroundColor: 'rgba(255, 255, 255, 0.9)',
        chatBorderColor: '#ccc',
        inputBackgroundColor: '#f0f0f0',
        sendButtonColor: '#635bff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        chatTitle: 'Panteo.ai',
        clearButtonCaption: '🗑️ Clear History',
        mobileBreakpointWidth: 768, // width in px when chat switches to mobile mode
        mobileBreakpointHeight: 600, // height in px when chat switches to mobile mode
        buttonCloseCaption: '✕',
        buttonOpenCaption: '💬',
        mobileCloseCaption: '✕',
    };

    const mergedConfig = { ...defaultConfig, ...config };
    
    const styles = createStyles(mergedConfig);

    let chatHistory = [];
    let isWaitingForResponse = false;
    let isChatOpen = false;

    const chatButton = createElement('button', styles.chatButton, {
        innerHTML: mergedConfig.buttonOpenCaption
    });
    const chatContainer = createElement('div', styles.chatContainer);
    const chatHeader = createElement('div', {
        ...styles.chatHeader,
        display: 'flex',
        alignItems: 'center',
        padding: '15px',
        position: 'relative',
    });
    const chatTitle = createElement('div', {
        flexGrow: 1,
        padding: '0',
    }, {
        innerHTML: mergedConfig.chatTitle
    });
    const clearButton = createElement('button', {
        ...styles.clearButton,
        marginRight: '0',
    }, {
        innerHTML: mergedConfig.clearButtonCaption
    });
    const chatMessages = createElement('div', {
        ...styles.chatMessages,
        overflowX: 'auto', // Добавляем горизонтальную прокрутку
    });
    const inputContainer = createElement('div', styles.inputContainer);
    const chatInput = createElement('input', styles.chatInput, { type: 'text', placeholder: 'Type your message...' });
    const sendButton = createElement('button', styles.sendButton, { innerHTML: '&#10148;' });
    const preloaderContainer = createElement('div', styles.preloaderContainer);
    const preloader = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    preloader.setAttribute('width', '60');
    preloader.setAttribute('height', '60');
    preloader.setAttribute('viewBox', '0 0 60 60');
    preloader.innerHTML = `
        <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#a75bff;stop-opacity:1" />
                <stop offset="57%" style="stop-color:#635bff;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#635bff;stop-opacity:0" />
            </linearGradient>
        </defs>
        <circle cx="30" cy="30" r="25" stroke="url(#gradient)" stroke-width="5" fill="none">
            <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 30 30"
                to="360 30 30"
                dur="1s"
                repeatCount="indefinite" />
        </circle>
    `;
    Object.assign(preloader.style, styles.preloader);

    preloaderContainer.style.display = 'none';
    preloaderContainer.appendChild(preloader);

    const mobileCloseButton = createElement('button', {
        position: 'absolute',
        right: '15px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'transparent',
        border: 'none',
        color: 'inherit',
        fontSize: '16px',
        cursor: 'pointer',
        padding: '8px 12px',
        display: 'none',
        borderRadius: '8px',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.3s ease',
        width: '40px',
        visibility: 'hidden',
        opacity: 0,
        '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
        }
    }, {
        innerHTML: mergedConfig.mobileCloseCaption
    });

    appendChildren(chatHeader, [chatTitle, clearButton, mobileCloseButton]);
    appendChildren(inputContainer, [chatInput, sendButton]);
    appendChildren(chatContainer, [chatHeader, chatMessages, preloaderContainer, inputContainer]);
    appendChildren(document.body, [chatButton, chatContainer]);

    chatButton.onclick = function() {
        isChatOpen = !isChatOpen;
        chatContainer.style.display = isChatOpen ? 'flex' : 'none';
        
        if (window.innerWidth <= mergedConfig.mobileBreakpointWidth) {
            chatButton.style.display = 'none';
            clearButton.style.marginRight = '40px';
            mobileCloseButton.style.visibility = 'visible';
            mobileCloseButton.style.opacity = '1';
            mobileCloseButton.style.display = 'flex';
        } else {
            chatButton.innerHTML = isChatOpen ? mergedConfig.buttonCloseCaption : mergedConfig.buttonOpenCaption;
        }
    };

    mobileCloseButton.onclick = function() {
        isChatOpen = false;
        chatContainer.style.display = 'none';
        chatButton.style.display = 'block';
        clearButton.style.marginRight = '0';
        mobileCloseButton.style.visibility = 'hidden';
        mobileCloseButton.style.opacity = '0';
        mobileCloseButton.style.display = 'none';
        chatButton.innerHTML = mergedConfig.buttonOpenCaption;
    };

    const sendMessage = async () => {
        const message = chatInput.value.trim();
        if (message && !isWaitingForResponse) {
            chatInput.value = '';
            isWaitingForResponse = true;
            preloaderContainer.style.display = 'block';
            try {
                await handleMessage(message, chatMessages, chatHistory, mergedConfig);
            } finally {
                isWaitingForResponse = false;
                preloaderContainer.style.display = 'none';
            }
        }
    };

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    sendButton.addEventListener('click', sendMessage);

    clearButton.addEventListener('click', () => {
        clearChatHistory(chatMessages, chatHistory);
    });

    loadChatHistory(chatMessages, chatHistory, mergedConfig);

    const addMessage = (sender, text) => {
        const messageElement = createElement('div', sender === 'User' ? styles.messageUser : styles.messageAgent);
        messageElement.innerHTML = sender === 'User' ? text : marked(text);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return messageElement;
    };

    const handleMessage = async (message) => {
        addMessage('User', message);
        chatInput.value = '';
        isWaitingForResponse = true;
        preloaderContainer.style.display = 'block';

        const agentMessageElement = addMessage('Agent', '');

        try {
            const response = await fetch(mergedConfig.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${mergedConfig.token}`
                },
                body: JSON.stringify({
                    messages: [...chatHistory, { role: "user", content: message }],
                    maxSimilarNumber: 20,
                    stream: true,
                    lastMessagesContextNumber: 20
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let agentResponse = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                agentResponse += chunk;
                agentMessageElement.innerHTML = marked(agentResponse);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }

            chatHistory.push({ role: 'user', content: message });
            chatHistory.push({ role: 'assistant', content: agentResponse });

            if (chatHistory.length > 40) {
                chatHistory = chatHistory.slice(-40);
            }

            localStorage.setItem('ragChatHistory', JSON.stringify(chatHistory));
        } catch (error) {
            console.error('Error in handleMessage:', error);
            agentMessageElement.innerHTML = `Error: ${error.message}`;
        } finally {
            isWaitingForResponse = false;
            preloaderContainer.style.display = 'none';
        }
    };

    // Create resize handle with proper styles
    const resizeHandle = createElement('div', {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '20px',
        height: '20px',
        cursor: 'nw-resize',
        backgroundColor: 'transparent', // Make it invisible but functional
        zIndex: '1002',
        transform: 'translate(-50%, -50%)', // Better touch target
        touchAction: 'none', // Prevent scrolling while resizing
    });

    // Make chat container ready for resize
    Object.assign(chatContainer.style, {
        resize: 'none', // Disable default resize
        position: 'fixed', // Ensure proper positioning
        overflow: 'hidden',
    });

    // Add resize handle to container
    chatContainer.appendChild(resizeHandle);

    // Load saved dimensions
    const savedDimensions = JSON.parse(localStorage.getItem('ragChatDimensions') || '{}');
    if (savedDimensions.width && savedDimensions.height) {
        chatContainer.style.width = savedDimensions.width + 'px';
        chatContainer.style.height = savedDimensions.height + 'px';
    }

    // Resize functionality
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    resizeHandle.addEventListener('mousedown', initResize);
    resizeHandle.addEventListener('touchstart', initResize);

    function initResize(e) {
        isResizing = true;
        startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
        startWidth = chatContainer.offsetWidth;
        startHeight = chatContainer.offsetHeight;

        // Add temporary event listeners
        document.addEventListener('mousemove', resize);
        document.addEventListener('touchmove', resize);
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('touchend', stopResize);

        // Prevent text selection while resizing
        document.body.style.userSelect = 'none';
        e.preventDefault();
    }

    function resize(e) {
        if (!isResizing) return;

        const isMobileWidth = window.innerWidth <= mergedConfig.mobileBreakpointWidth;
        const isMobileHeight = window.innerHeight <= mergedConfig.mobileBreakpointHeight;
        
        if (isMobileWidth || isMobileHeight) {
            return; // Prevent resizing in mobile mode
        }

        const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;

        const deltaX = startX - clientX;
        const deltaY = startY - clientY;

        const newWidth = Math.max(300, startWidth + deltaX);
        const newHeight = Math.max(400, startHeight + deltaY);

        const margin = 20;
        const maxWidth = window.innerWidth - parseInt(chatContainer.style.right) - margin;
        const maxHeight = window.innerHeight - parseInt(chatContainer.style.bottom) - margin;

        chatContainer.style.width = Math.min(newWidth, maxWidth) + 'px';
        chatContainer.style.height = Math.min(newHeight, maxHeight) + 'px';

        localStorage.setItem('ragChatDimensions', JSON.stringify({
            width: chatContainer.offsetWidth,
            height: chatContainer.offsetHeight
        }));
    }

    function stopResize() {
        isResizing = false;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('touchmove', resize);
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('touchend', stopResize);
        document.body.style.userSelect = '';
    }

    // Add visual feedback for resize handle
    resizeHandle.addEventListener('mouseover', () => {
        chatContainer.style.cursor = 'nw-resize';
    });

    resizeHandle.addEventListener('mouseout', () => {
        chatContainer.style.cursor = 'default';
    });

    // Update existing window resize handler
    window.addEventListener('resize', () => {
        const isMobileWidth = window.innerWidth <= mergedConfig.mobileBreakpointWidth;
        const isMobileHeight = window.innerHeight <= mergedConfig.mobileBreakpointHeight;
        
        if (isMobileWidth || isMobileHeight) {
            // Mobile mode
            resizeHandle.style.display = 'none';
            Object.assign(chatContainer.style, {
                width: '100vw',
                height: '100vh',
                bottom: '0',
                right: '0',
                border: 'none',
                borderRadius: '0',
                boxShadow: 'none',
            });
            
            if (isChatOpen) {
                chatButton.style.display = 'none';
                clearButton.style.marginRight = '40px';
                mobileCloseButton.style.visibility = 'visible';
                mobileCloseButton.style.opacity = '1';
                mobileCloseButton.style.display = 'flex';
            }
        } else {
            // Desktop mode
            resizeHandle.style.display = 'block';
            const margin = 20;
            const maxWidth = window.innerWidth - parseInt(chatContainer.style.right) - margin;
            const maxHeight = window.innerHeight - parseInt(chatContainer.style.bottom) - margin;
            
            // Load saved dimensions but constrain them
            const savedDimensions = JSON.parse(localStorage.getItem('ragChatDimensions') || '{}');
            const width = Math.min(savedDimensions.width || 400, maxWidth);
            const height = Math.min(savedDimensions.height || 500, maxHeight);
            
            Object.assign(chatContainer.style, {
                width: `${width}px`,
                height: `${height}px`,
                bottom: '95px',
                right: '20px',
                border: `1px solid ${mergedConfig.chatBorderColor}`,
                borderRadius: '20px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            });
            
            chatButton.style.display = 'block';
            clearButton.style.marginRight = '0';
            mobileCloseButton.style.visibility = 'hidden';
            mobileCloseButton.style.opacity = '0';
            mobileCloseButton.style.display = 'none';
        }
    });
}

export default function RagChat(config) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initRagChat(config));
    } else {
        initRagChat(config);
    }
}
