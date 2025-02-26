import { createStyles } from './styles';
import { loadChatHistory, clearChatHistory } from './message-handler';
import { createElement, appendChildren } from './utils';
import { marked } from 'marked';

function initRagChat(config = {}) {
    const defaultConfig = {
        token: '',
        url: 'http://localhost:3000/generate',
        buttonPosition: 'bottom-right',
        buttonColor: '#635bff',
        buttonOpenCaption: '💬',
        buttonCloseCaption: '✕',
        mobileCloseCaption: '✕',
        chatBackgroundColor: 'rgba(255, 255, 255, 0.9)',
        chatBorderColor: '#ccc',
        inputBackgroundColor: '#f0f0f0',
        sendButtonColor: '#635bff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        chatTitle: 'RAG Chat',
        clearButtonCaption: '🗑️ Clear History',
        mobileBreakpointWidth: 768,
        mobileBreakpointHeight: 600,
        chatMargin: 20,
        minChatWidth: 300,
        minChatHeight: 400,
        defaultChatWidth: 400,
        defaultChatHeight: 500,
    };

    const mergedConfig = { ...defaultConfig, ...config };
    const styles = createStyles(mergedConfig);

    // Helper functions
    function saveDimensions(width, height) {
        localStorage.setItem('ragChatDimensions', JSON.stringify({
            width: Math.round(width),
            height: Math.round(height),
            timestamp: Date.now()
        }));
    }

    function getSavedDimensions() {
        const saved = JSON.parse(localStorage.getItem('ragChatDimensions') || '{}');
        return {
            width: saved.width || mergedConfig.defaultChatWidth,
            height: saved.height || mergedConfig.defaultChatHeight,
            timestamp: saved.timestamp || 0
        };
    }

    function applyDimensions(width, height, shouldSave = false) {
        const maxWidth = window.innerWidth - mergedConfig.chatMargin * 2;
        const maxHeight = window.innerHeight - 95 - mergedConfig.chatMargin;
        
        const constrainedWidth = Math.min(Math.max(width, mergedConfig.minChatWidth), maxWidth);
        const constrainedHeight = Math.min(Math.max(height, mergedConfig.minChatHeight), maxHeight);
        
        chatContainer.style.width = `${constrainedWidth}px`;
        chatContainer.style.height = `${constrainedHeight}px`;

        if (shouldSave) {
            saveDimensions(constrainedWidth, constrainedHeight);
        }
    }

    // Get initial dimensions
    const initialDimensions = getSavedDimensions();

    // Create chat container with initial dimensions and remove default resize
    const chatContainer = createElement('div', {
        ...styles.chatContainer,
        width: `${initialDimensions.width}px`,
        height: `${initialDimensions.height}px`,
        resize: 'none', // Disable default resize handle
    });

    let chatHistory = [];
    let isWaitingForResponse = false;
    let isChatOpen = false;

    const chatButton = createElement('button', styles.chatButton, {
        innerHTML: mergedConfig.buttonOpenCaption
    });
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
        overflowX: 'auto',
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
        
        const isMobileWidth = window.innerWidth <= mergedConfig.mobileBreakpointWidth;
        const isMobileHeight = window.innerHeight <= mergedConfig.mobileBreakpointHeight;
        
        if (isMobileWidth || isMobileHeight) {
            chatButton.style.display = 'none';
            clearButton.style.marginRight = '40px';
            Object.assign(mobileCloseButton.style, {
                display: 'flex',
                visibility: 'visible',
                opacity: '1',
                position: 'absolute',
                right: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: '1002'
            });
        } else {
            chatButton.innerHTML = isChatOpen ? mergedConfig.buttonCloseCaption : mergedConfig.buttonOpenCaption;
        }
    };

    mobileCloseButton.onclick = function() {
        isChatOpen = false;
        chatContainer.style.display = 'none';
        chatButton.style.display = 'block';
        clearButton.style.marginRight = '0';
        Object.assign(mobileCloseButton.style, {
            display: 'none',
            visibility: 'hidden',
            opacity: '0'
        });
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

    // Create resize handles
    const resizeHandleTopLeft = createElement('div', {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '20px',
        height: '20px',
        cursor: 'nw-resize',
        backgroundColor: 'transparent',
        zIndex: '1002',
    });

    const resizeHandleTop = createElement('div', {
        position: 'absolute',
        top: '0',
        left: '20px',
        right: '0',
        height: '5px',
        cursor: 'n-resize',
        backgroundColor: 'transparent',
        zIndex: '1002',
    });

    const resizeHandleLeft = createElement('div', {
        position: 'absolute',
        top: '20px',
        left: '0',
        width: '5px',
        bottom: '0',
        cursor: 'w-resize',
        backgroundColor: 'transparent',
        zIndex: '1002',
    });

    // Update window resize handler
    window.addEventListener('resize', () => {
        const isMobileWidth = window.innerWidth <= mergedConfig.mobileBreakpointWidth;
        const isMobileHeight = window.innerHeight <= mergedConfig.mobileBreakpointHeight;
        
        if (isMobileWidth || isMobileHeight) {
            // Mobile mode
            [resizeHandleTopLeft, resizeHandleTop, resizeHandleLeft].forEach(handle => {
                handle.style.display = 'none';
            });
            
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
                Object.assign(mobileCloseButton.style, {
                    display: 'flex',
                    visibility: 'visible',
                    opacity: '1',
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: '1002'
                });
            }
        } else {
            // Desktop mode
            [resizeHandleTopLeft, resizeHandleTop, resizeHandleLeft].forEach(handle => {
                handle.style.display = 'block';
            });
            
            const currentDimensions = getSavedDimensions();
            applyDimensions(currentDimensions.width, currentDimensions.height, false);
            
            Object.assign(chatContainer.style, {
                bottom: '95px',
                right: `${mergedConfig.chatMargin}px`,
                border: `1px solid ${mergedConfig.chatBorderColor}`,
                borderRadius: '20px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                resize: 'none'
            });
            
            chatButton.style.display = 'block';
            clearButton.style.marginRight = '0';
            Object.assign(mobileCloseButton.style, {
                display: 'none',
                visibility: 'hidden',
                opacity: '0'
            });
        }
    });

    // Add resize handles to container
    chatContainer.appendChild(resizeHandleTopLeft);
    chatContainer.appendChild(resizeHandleTop);
    chatContainer.appendChild(resizeHandleLeft);

    // Update hover effects
    [resizeHandleTopLeft, resizeHandleTop, resizeHandleLeft].forEach(handle => {
        handle.addEventListener('mouseover', () => {
            handle.style.backgroundColor = 'rgba(99, 91, 255, 0.1)';
        });
        handle.addEventListener('mouseout', () => {
            handle.style.backgroundColor = 'transparent';
        });
    });

    // Resize state variables
    let isResizing = false;
    let currentHandle = null;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;
    let startHeight = 0;

    // Initialize resize function
    function initResize(e, handle) {
        isResizing = true;
        currentHandle = handle;
        startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        startY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
        startWidth = chatContainer.offsetWidth;
        startHeight = chatContainer.offsetHeight;

        document.addEventListener('mousemove', resize);
        document.addEventListener('touchmove', resize);
        document.addEventListener('mouseup', stopResize);
        document.addEventListener('touchend', stopResize);
        document.body.style.userSelect = 'none';
        e.preventDefault();
    }

    // Update resize function
    function resize(e) {
        if (!isResizing) return;

        const isMobileWidth = window.innerWidth <= mergedConfig.mobileBreakpointWidth;
        const isMobileHeight = window.innerHeight <= mergedConfig.mobileBreakpointHeight;
        
        if (isMobileWidth || isMobileHeight) return;

        const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;

        const deltaX = startX - clientX;
        const deltaY = startY - clientY;

        let newWidth = startWidth;
        let newHeight = startHeight;

        switch(currentHandle) {
            case 'topLeft':
                newWidth = startWidth + deltaX;
                newHeight = startHeight + deltaY;
                break;
            case 'top':
                newHeight = startHeight + deltaY;
                break;
            case 'left':
                newWidth = startWidth + deltaX;
                break;
        }

        applyDimensions(newWidth, newHeight, true);
    }

    function stopResize() {
        if (!isResizing) return;
        isResizing = false;
        currentHandle = null;
        document.removeEventListener('mousemove', resize);
        document.removeEventListener('touchmove', resize);
        document.removeEventListener('mouseup', stopResize);
        document.removeEventListener('touchend', stopResize);
        document.body.style.userSelect = '';
    }

    // Add event listeners for all handles
    resizeHandleTopLeft.addEventListener('mousedown', (e) => initResize(e, 'topLeft'));
    resizeHandleTopLeft.addEventListener('touchstart', (e) => initResize(e, 'topLeft'));
    
    resizeHandleTop.addEventListener('mousedown', (e) => initResize(e, 'top'));
    resizeHandleTop.addEventListener('touchstart', (e) => initResize(e, 'top'));
    
    resizeHandleLeft.addEventListener('mousedown', (e) => initResize(e, 'left'));
    resizeHandleLeft.addEventListener('touchstart', (e) => initResize(e, 'left'));

    // Trigger initial resize to set correct state
    window.dispatchEvent(new Event('resize'));
}

export default function RagChat(config) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initRagChat(config));
    } else {
        initRagChat(config);
    }
}
