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
        chatBorderColor: 'rgba(99, 91, 255, 0.2)',
        inputBackgroundColor: 'rgba(245, 243, 255, 0.5)',
        sendButtonColor: '#635bff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        chatTitle: 'RAG Chat',
        clearButtonCaption: '🗑️ Clear History',
        inputPlaceholder: 'Type your message...',
        mobileBreakpointWidth: 768,
        mobileBreakpointHeight: 600,
        chatMargin: 20,
        minChatWidth: 300,
        minChatHeight: 400,
        defaultChatWidth: 400,
        defaultChatHeight: 500,
        onStartResponse: null,
        // New sidebar mode options
        mode: 'floating', // 'floating', 'sidebar', or 'showcase'
        sidebarSelector: null, // CSS selector for sidebar container
        sidebarToggleSelector: null, // CSS selector for toggle button
        sidebarWidth: '25%', // Width when expanded
        sidebarCollapsedWidth: '0px', // Width when collapsed
        sidebarPosition: 'right', // 'left' or 'right'
        // Showcase mode options
        showcaseSelector: null, // CSS selector for showcase container (if null, appends to body)
        showcaseMaxWidth: '1024px', // Maximum width of centered chat column
        showcaseFontSize: '16px', // Base font size for showcase mode
        showcaseMessageFontSize: '18px', // Message font size for showcase mode
        showcasePadding: '24px', // Padding for showcase mode
        // Welcome question and CAPTCHA options
        welcomeQuestion: null,
        requireWelcomeAnswer: false,
        captchaEnabled: false,
        captchaEndpoint: '/api/captcha/generate',
        captchaVerifyEndpoint: '/api/captcha/verify',
        agentId: null,
        // Localization
        locale: 'en',
        captchaTitle: 'Verify you\'re human',
        captchaPlaceholder: 'Enter the text from the image',
        captchaVerifyButton: 'Verify',
        captchaReloadButton: 'Reload',
        captchaErrorMessage: 'Incorrect CAPTCHA. Please try again.',
        // Auto-open chat (used when embedded in container)
        autoOpen: false,
        // Agreement consent options
        agreements: null, // Array of { id, labelHtml, modalUrl, modalTitle }
        agreementsEndpoint: null,
        agreementsContinueButton: 'Continue',
        agreementsAllRequired: 'Please accept all agreements to continue',
        agreementsModalClose: 'Close',
        // Appearance options
        cover: null, // Cover image URL
        showCover: false, // Show cover before first message
        coverDisplayMode: 'adaptive', // 'adaptive', 'framed', 'natural'
        agentAvatar: null, // Agent avatar image URL
        userAvatar: null, // User avatar image URL
        showAvatar: false, // Show avatars in messages
        avatarBorderRadius: '50%', // Avatar border radius (e.g., '50%' for circle, '0%' for square)
        userLabel: '', // Label for user messages (empty to hide)
        agentLabel: '', // Label for agent messages (empty to hide)
    };

    const mergedConfig = { ...defaultConfig, ...config };
    const styles = createStyles(mergedConfig);
    
    // Inject bouncing dots CSS animation
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        @keyframes bounce {
            0%, 80%, 100% {
                transform: scale(0);
                opacity: 0.5;
            }
            40% {
                transform: scale(1);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(styleEl);

    // Check mode
    const isSidebarMode = mergedConfig.mode === 'sidebar';
    const isShowcaseMode = mergedConfig.mode === 'showcase';
    let sidebarContainer = null;
    let sidebarToggleButton = null;
    let isSidebarOpen = false;
    let showcaseContainer = null;

    // Handle showcase mode
    if (isShowcaseMode) {
        // Auto-open in showcase mode
        mergedConfig.autoOpen = true;
        
        // Find or create showcase container
        if (mergedConfig.showcaseSelector) {
            showcaseContainer = document.querySelector(mergedConfig.showcaseSelector);
        }
        
        if (!showcaseContainer) {
            // Create a default showcase container and append to body
            showcaseContainer = createElement('div', {
                width: '100%',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '40px 20px',
                boxSizing: 'border-box'
            });
            showcaseContainer.id = 'rag-chat-showcase-container';
            document.body.appendChild(showcaseContainer);
        }
    }

    if (isSidebarMode) {
        // Find or create sidebar container
        if (mergedConfig.sidebarSelector) {
            sidebarContainer = document.querySelector(mergedConfig.sidebarSelector);
        }
        
        if (!sidebarContainer) {
            console.error('Sidebar mode requires a valid sidebarSelector');
            return;
        }

        // Find toggle button
        if (mergedConfig.sidebarToggleSelector) {
            sidebarToggleButton = document.querySelector(mergedConfig.sidebarToggleSelector);
        }

        // Set initial sidebar styles
        Object.assign(sidebarContainer.style, {
            width: mergedConfig.sidebarCollapsedWidth,
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            position: 'relative',
            borderLeft: mergedConfig.sidebarPosition === 'right' ? '1px solid rgba(99, 91, 255, 0.15)' : 'none',
            borderRight: mergedConfig.sidebarPosition === 'left' ? '1px solid rgba(99, 91, 255, 0.15)' : 'none',
        });
    }

    // Helper functions
    function saveDimensions(width, height) {
        if (!isSidebarMode) {
            localStorage.setItem('ragChatDimensions', JSON.stringify({
                width: Math.round(width),
                height: Math.round(height),
                timestamp: Date.now()
            }));
        }
    }

    function getSavedDimensions() {
        if (isSidebarMode) {
            return {
                width: '100%',
                height: '100%',
                timestamp: Date.now()
            };
        }
        const saved = JSON.parse(localStorage.getItem('ragChatDimensions') || '{}');
        return {
            width: saved.width || mergedConfig.defaultChatWidth,
            height: saved.height || mergedConfig.defaultChatHeight,
            timestamp: saved.timestamp || 0
        };
    }

    function applyDimensions(width, height, shouldSave = false) {
        if (isSidebarMode) {
            chatContainer.style.width = '100%';
            chatContainer.style.height = '100%';
            return;
        }

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

    function toggleSidebar() {
        if (!isSidebarMode || !sidebarContainer) return;

        isSidebarOpen = !isSidebarOpen;
        
        if (isSidebarOpen) {
            sidebarContainer.style.width = mergedConfig.sidebarWidth;
            chatContainer.style.display = 'flex';
            
            // Apply mobile-like fullscreen styling for sidebar mode
            Object.assign(chatContainer.style, {
                width: '100%',
                height: '100%',
                position: 'relative',
                bottom: 'auto',
                right: 'auto',
                border: 'none',
                borderRadius: '0',
                boxShadow: 'none',
                backdropFilter: 'none'
            });
            
            // Hide resize handles in sidebar mode
            if (resizeHandleTopLeft) resizeHandleTopLeft.style.display = 'none';
            if (resizeHandleTop) resizeHandleTop.style.display = 'none';
            if (resizeHandleLeft) resizeHandleLeft.style.display = 'none';
            
            // Update button styling for sidebar mode
            if (sidebarToggleButton) {
                sidebarToggleButton.innerHTML = mergedConfig.buttonCloseCaption;
                sidebarToggleButton.setAttribute('title', 'Close chat');
            }
            
            // Adjust clear button margin for close button
            if (clearButton) {
                clearButton.style.marginRight = '40px';
            }
        } else {
            sidebarContainer.style.width = mergedConfig.sidebarCollapsedWidth;
            setTimeout(() => {
                if (!isSidebarOpen) {
                    chatContainer.style.display = 'none';
                }
            }, 300); // Wait for transition to complete
            
            if (sidebarToggleButton) {
                sidebarToggleButton.innerHTML = mergedConfig.buttonOpenCaption;
                sidebarToggleButton.setAttribute('title', 'Open chat');
            }
            
            // Reset clear button margin
            if (clearButton) {
                clearButton.style.marginRight = '0';
            }
        }
    }

    // Get initial dimensions
    const initialDimensions = getSavedDimensions();

    // Create chat container with mode-specific styles
    const chatContainerStyles = isShowcaseMode ? {
        ...styles.showcaseChatContainer,
        width: '100%',
        maxWidth: mergedConfig.showcaseMaxWidth,
        height: '600px',
        display: 'flex', // Always visible in showcase mode
    } : isSidebarMode ? {
        ...styles.sidebarChatContainer,
        width: '100%',
        height: '100%',
        display: 'none', // Initially hidden in sidebar mode
    } : {
        ...styles.chatContainer,
        width: `${initialDimensions.width}px`,
        height: `${initialDimensions.height}px`,
        resize: 'none', // Disable default resize handle
    };

    const chatContainer = createElement('div', chatContainerStyles);

    let chatHistory = [];
    let isWaitingForResponse = false;
    let isChatOpen = mergedConfig.autoOpen || false;

    // Welcome question and CAPTCHA state
    let welcomeAnswered = false;
    let captchaToken = null;
    let captchaVerified = false;
    let isShowingCaptcha = false;
    let captchaContainer = null;

    // Agreement consent state
    let agreementsAccepted = false;
    let agreementStates = {}; // Map of agreement id -> checked state
    let agreementsContainer = null;

    // Create chat button (only for floating mode)
    const chatButton = (!isSidebarMode && !isShowcaseMode) ? createElement('button', styles.chatButton, {
        innerHTML: mergedConfig.buttonOpenCaption
    }) : null;

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
        marginRight: isSidebarMode ? '40px' : '0',
    }, {
        innerHTML: mergedConfig.clearButtonCaption
    });
    const chatMessages = createElement('div', {
        ...styles.chatMessages,
        overflowX: 'auto',
    });
    const inputContainer = createElement('div', styles.inputContainer);
    const chatInput = createElement('input', styles.chatInput, { type: 'text', placeholder: mergedConfig.inputPlaceholder });
    const sendButton = createElement('button', styles.sendButton, { innerHTML: '&#10148;' });

    // Close button for sidebar mode
    const sidebarCloseButton = isSidebarMode ? createElement('button', {
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
        borderRadius: '8px',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.3s ease',
        width: '40px',
        '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
        }
    }, {
        innerHTML: mergedConfig.buttonCloseCaption
    }) : null;

    // Mobile close button (for floating mode only, not showcase)
    const mobileCloseButton = (!isSidebarMode && !isShowcaseMode) ? createElement('button', {
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
    }) : null;

    // Build header based on mode
    if (isSidebarMode && sidebarCloseButton) {
        appendChildren(chatHeader, [chatTitle, clearButton, sidebarCloseButton]);
    } else if (mobileCloseButton) {
        appendChildren(chatHeader, [chatTitle, clearButton, mobileCloseButton]);
    } else {
        appendChildren(chatHeader, [chatTitle, clearButton]);
    }

    appendChildren(inputContainer, [chatInput, sendButton]);
    appendChildren(chatContainer, [chatHeader, chatMessages, inputContainer]);

    // Append to appropriate container
    if (isShowcaseMode && showcaseContainer) {
        // Showcase mode: append to showcase container
        showcaseContainer.appendChild(chatContainer);
    } else if (isSidebarMode && sidebarContainer) {
        sidebarContainer.appendChild(chatContainer);
        
        // Set up toggle button functionality
        if (sidebarToggleButton) {
            sidebarToggleButton.onclick = toggleSidebar;
            sidebarToggleButton.innerHTML = mergedConfig.buttonOpenCaption;
            sidebarToggleButton.setAttribute('title', 'Open chat');
        }

        // Set up close button functionality
        if (sidebarCloseButton) {
            sidebarCloseButton.onclick = toggleSidebar;
        }
    } else {
        appendChildren(document.body, [chatButton, chatContainer]);
    }

    // Chat button functionality (floating mode only)
    if (chatButton) {
        chatButton.onclick = function() {
            isChatOpen = !isChatOpen;
            chatContainer.style.display = isChatOpen ? 'flex' : 'none';
            
            // Initialize security features when chat opens for the first time
            if (isChatOpen && !welcomeAnswered && (mergedConfig.requireWelcomeAnswer || mergedConfig.captchaEnabled)) {
                initializeSecurityFeatures();
            }
            
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
    }

    // Mobile close button functionality (floating mode only)
    if (mobileCloseButton) {
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
    }

    const sendMessage = async () => {
        const message = chatInput.value.trim();
        if (message && !isWaitingForResponse) {
            chatInput.value = '';
            isWaitingForResponse = true;
            try {
                await handleMessage(message, chatMessages, chatHistory, mergedConfig);
            } finally {
                isWaitingForResponse = false;
            }
        }
    };

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    sendButton.addEventListener('click', sendMessage);

    // Render cover image if configured and history is empty
    let coverElement = null;
    const renderCover = () => {
        if (mergedConfig.showCover && mergedConfig.cover && !coverElement) {
            // Determine display mode
            const mode = mergedConfig.coverDisplayMode || 'adaptive';
            const coverUrl = mergedConfig.cover;
            
            // Check if image is transparent format (PNG, SVG, WebP with transparency)
            const isTransparentFormat = coverUrl.match(/\.(png|svg|webp)(\?|$)/i);
            
            // Determine final display style
            let useFrame = mode === 'framed';
            if (mode === 'adaptive') {
                useFrame = !isTransparentFormat; // Use frame for non-transparent formats
            }
            
            coverElement = createElement('div', {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                marginBottom: '12px',
            });
            
            const imgStyles = {
                maxWidth: '100%',
                maxHeight: '300px',
                objectFit: 'contain',
            };
            
            // Add frame styling if needed
            if (useFrame) {
                imgStyles.borderRadius = '16px';
                imgStyles.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                imgStyles.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                imgStyles.padding = '12px';
            }
            
            const coverImg = createElement('img', imgStyles, {
                src: coverUrl,
                alt: 'Cover'
            });
            
            coverElement.appendChild(coverImg);
            chatMessages.insertBefore(coverElement, chatMessages.firstChild);
        }
    };
    
    const removeCover = () => {
        if (coverElement && coverElement.parentNode) {
            coverElement.parentNode.removeChild(coverElement);
            coverElement = null;
        }
    };

    const addMessage = (sender, text, showBouncingDots = false) => {
        // Check if mobile view for avatar placement
        const isMobileView = window.innerWidth <= mergedConfig.mobileBreakpointWidth;
        
        // Create message container with avatar if needed
        const messageContainer = createElement('div', {
            display: 'flex',
            flexDirection: isMobileView ? 'column' : (sender === 'User' ? 'row-reverse' : 'row'),
            alignItems: isMobileView ? (sender === 'User' ? 'flex-end' : 'flex-start') : 'flex-end',
            gap: '8px',
            marginBottom: '12px',
            marginLeft: sender === 'User' ? '0' : '12px',
            marginRight: sender === 'User' ? '12px' : '0',
        });
        
        // Create avatar element if configured (will be added later in correct order)
        let avatarElement = null;
        if (mergedConfig.showAvatar && sender === 'Agent' && mergedConfig.agentAvatar) {
            // Check if avatar is PNG format for adaptive styling
            const isPngAvatar = mergedConfig.agentAvatar.match(/\.(png|webp)(\?|$)/i);
            
            avatarElement = createElement('img', {
                width: '32px',
                height: '32px',
                borderRadius: mergedConfig.avatarBorderRadius,
                objectFit: 'cover',
                flexShrink: '0',
                boxShadow: isPngAvatar ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.1)',
            }, {
                src: mergedConfig.agentAvatar,
                alt: 'Agent'
            });
        } else if (mergedConfig.showAvatar && sender === 'User' && mergedConfig.userAvatar) {
            // Check if avatar is PNG format for adaptive styling
            const isPngAvatar = mergedConfig.userAvatar.match(/\.(png|webp)(\?|$)/i);
            
            avatarElement = createElement('img', {
                width: '32px',
                height: '32px',
                borderRadius: mergedConfig.avatarBorderRadius,
                objectFit: 'cover',
                flexShrink: '0',
                boxShadow: isPngAvatar ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.1)',
            }, {
                src: mergedConfig.userAvatar,
                alt: 'User'
            });
        }
        
        // On desktop: add avatar before message wrapper
        // On mobile: avatar will be added after message wrapper (below the bubble)
        if (avatarElement && !isMobileView) {
            messageContainer.appendChild(avatarElement);
        }
        
        // Create message content wrapper
        const messageWrapper = createElement('div', {
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            maxWidth: '80%',
            minWidth: sender === 'User' ? '0' : '0',
            width: 'auto',
        });
        
        // Add label if configured
        const label = sender === 'User' ? mergedConfig.userLabel : mergedConfig.agentLabel;
        if (label) {
            const labelElement = createElement('div', {
                fontSize: '11px',
                color: 'rgba(0, 0, 0, 0.54)',
                paddingLeft: sender === 'User' ? '0' : '4px',
                paddingRight: sender === 'User' ? '4px' : '0',
                textAlign: sender === 'User' ? 'right' : 'left',
                fontWeight: '500',
            }, {
                textContent: label
            });
            messageWrapper.appendChild(labelElement);
        }
        
        // Create message bubble
        const messageElement = createElement('div', sender === 'User' ? styles.messageUser : styles.messageAgent);
        
        if (showBouncingDots) {
            // Create bouncing dots loader
            const dotsContainer = createElement('div', {
                display: 'flex',
                gap: '4px',
                alignItems: 'center',
                padding: '4px 0',
            });
            
            for (let i = 0; i < 3; i++) {
                const dot = createElement('div', {
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(99, 91, 255, 0.6)',
                    animation: `bounce 1.4s infinite ease-in-out both`,
                    animationDelay: `${i * 0.16}s`,
                });
                dotsContainer.appendChild(dot);
            }
            
            messageElement.appendChild(dotsContainer);
        } else {
            messageElement.innerHTML = sender === 'User' ? text : marked(text);
        }
        
        messageWrapper.appendChild(messageElement);
        messageContainer.appendChild(messageWrapper);
        
        // On mobile: add avatar after message wrapper (below the bubble)
        if (avatarElement && isMobileView) {
            messageContainer.appendChild(avatarElement);
        }
        
        chatMessages.appendChild(messageContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageElement;
    };
    
    // Load chat history and render with avatars and labels
    loadChatHistory(chatMessages, chatHistory, mergedConfig);
    chatHistory.forEach(msg => {
        const sender = msg.role === 'user' ? 'User' : 'Agent';
        addMessage(sender, msg.content);
    });
    
    // Show cover if history is empty
    if (chatHistory.length === 0) {
        renderCover();
    }

    // CAPTCHA functions
    const loadCaptcha = async () => {
        try {
            if (!mergedConfig.agentId) {
                console.error('Agent ID required for CAPTCHA');
                return;
            }

            const response = await fetch(`${mergedConfig.captchaEndpoint}?agentId=${mergedConfig.agentId}`);
            const data = await response.json();
            
            if (data.token && data.image) {
                renderCaptchaUI(data.image, data.token);
            }
        } catch (error) {
            console.error('Error loading CAPTCHA:', error);
        }
    };

    const verifyCaptcha = async (answer, token) => {
        try {
            const response = await fetch(mergedConfig.captchaVerifyEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    answer: answer,
                    agentId: mergedConfig.agentId
                })
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error verifying CAPTCHA:', error);
            return { success: false, error: 'Verification failed' };
        }
    };

    const renderCaptchaUI = (imageDataUrl, token) => {
        if (captchaContainer) {
            removeCaptchaUI();
        }

        isShowingCaptcha = true;

        // Add agent message introducing CAPTCHA
        const captchaIntroText = mergedConfig.locale === 'ru' 
            ? 'Прежде чем ответить, прошу подтвердить, что вы человек:'
            : 'Before I respond, please confirm that you are human:';
        addMessage('Agent', captchaIntroText);

        // Modern glassmorphism container matching design system
        captchaContainer = createElement('div', {
            padding: '24px',
            margin: '16px 12px',
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            textAlign: 'center',
            transition: 'all 0.22s cubic-bezier(0.22, 0.61, 0.36, 1)'
        });

        // Title with design system typography
        const title = createElement('div', {
            marginBottom: '16px',
            fontWeight: '600',
            fontSize: '16px',
            color: 'rgba(0, 0, 0, 0.88)',
            letterSpacing: '-0.01em'
        }, { textContent: mergedConfig.captchaTitle });

        // Image container for proper sizing
        const imageContainer = createElement('div', {
            width: '100%',
            maxWidth: '300px',
            margin: '0 auto 16px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(99, 91, 255, 0.2)',
            boxShadow: '0 1px 4px rgba(99, 91, 255, 0.1)',
            backgroundColor: 'rgba(245, 243, 255, 0.3)'
        });

        const captchaImage = createElement('img', {
            width: '100%',
            height: 'auto',
            display: 'block'
        }, { src: imageDataUrl });

        imageContainer.appendChild(captchaImage);

        // Input field matching design system
        const inputField = createElement('input', {
            width: '100%',
            maxWidth: '300px',
            padding: '12px 16px',
            marginBottom: '12px',
            border: '1px solid rgba(99, 91, 255, 0.25)',
            borderRadius: '12px',
            fontSize: '16px',
            fontFamily: 'var(--bc-font-sans, ui-sans-serif, system-ui, -apple-system)',
            boxSizing: 'border-box',
            backgroundColor: 'rgba(245, 243, 255, 0.3)',
            color: 'rgba(0, 0, 0, 0.88)',
            transition: 'all 0.22s cubic-bezier(0.22, 0.61, 0.36, 1)',
            outline: 'none'
        }, { 
            type: 'text',
            placeholder: mergedConfig.captchaPlaceholder,
            id: 'captchaInput'
        });

        // Focus state for input
        inputField.addEventListener('focus', () => {
            inputField.style.borderColor = mergedConfig.sendButtonColor || '#635bff';
            inputField.style.boxShadow = `0 0 0 3px rgba(99, 91, 255, 0.15)`;
        });
        inputField.addEventListener('blur', () => {
            inputField.style.borderColor = 'rgba(99, 91, 255, 0.25)';
            inputField.style.boxShadow = 'none';
        });

        // Error message with design system colors
        const errorDiv = createElement('div', {
            color: '#FF3B30',
            fontSize: '13px',
            marginBottom: '12px',
            minHeight: '18px',
            fontWeight: '500'
        });

        // Button container with proper spacing
        const buttonContainer = createElement('div', {
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            maxWidth: '300px',
            margin: '0 auto'
        });

        // Primary verify button with design system styling
        const verifyButton = createElement('button', {
            flex: '1',
            padding: '12px 24px',
            backgroundColor: mergedConfig.sendButtonColor || '#D100FF',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            fontFamily: 'var(--bc-font-sans, ui-sans-serif, system-ui, -apple-system)',
            transition: 'all 0.22s cubic-bezier(0.22, 0.61, 0.36, 1)',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.12)',
            outline: 'none'
        }, { textContent: mergedConfig.captchaVerifyButton });

        // Hover and active states for verify button
        verifyButton.addEventListener('mouseenter', () => {
            if (!verifyButton.disabled) {
                verifyButton.style.transform = 'translateY(-1px)';
                verifyButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.18)';
            }
        });
        verifyButton.addEventListener('mouseleave', () => {
            verifyButton.style.transform = 'translateY(0)';
            verifyButton.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.12)';
        });
        verifyButton.addEventListener('mousedown', () => {
            if (!verifyButton.disabled) {
                verifyButton.style.transform = 'scale(0.98)';
            }
        });
        verifyButton.addEventListener('mouseup', () => {
            verifyButton.style.transform = 'translateY(-1px)';
        });

        // Secondary reload button (ghost style)
        const reloadButton = createElement('button', {
            padding: '12px 20px',
            backgroundColor: 'transparent',
            color: 'rgba(99, 91, 255, 0.8)',
            border: '1px solid rgba(99, 91, 255, 0.3)',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            fontFamily: 'var(--bc-font-sans, ui-sans-serif, system-ui, -apple-system)',
            transition: 'all 0.22s cubic-bezier(0.22, 0.61, 0.36, 1)',
            outline: 'none'
        }, { textContent: mergedConfig.captchaReloadButton });

        // Hover state for reload button
        reloadButton.addEventListener('mouseenter', () => {
            reloadButton.style.backgroundColor = 'rgba(99, 91, 255, 0.08)';
            reloadButton.style.borderColor = 'rgba(99, 91, 255, 0.5)';
        });
        reloadButton.addEventListener('mouseleave', () => {
            reloadButton.style.backgroundColor = 'transparent';
            reloadButton.style.borderColor = 'rgba(99, 91, 255, 0.3)';
        });

        let currentToken = token;

        verifyButton.onclick = async () => {
            const answer = inputField.value.trim();
            if (!answer) {
                errorDiv.textContent = mergedConfig.captchaPlaceholder;
                return;
            }

            verifyButton.disabled = true;
            verifyButton.style.opacity = '0.6';
            verifyButton.style.cursor = 'not-allowed';
            verifyButton.textContent = mergedConfig.locale === 'ru' ? 'Проверка...' : 'Verifying...';
            errorDiv.textContent = '';

            const result = await verifyCaptcha(answer, currentToken);

            if (result.success) {
                captchaToken = result.newToken;
                captchaVerified = true;
                removeCaptchaUI();
                
                // Reset placeholder after successful CAPTCHA verification
                chatInput.placeholder = mergedConfig.inputPlaceholder;
                
                // Check if agreements need to be shown next
                if (mergedConfig.agreements) {
                    renderAgreementsUI();
                } else {
                    checkAndEnableChat();
                    // Send pending message if all checks passed and no agreements required
                    sendPendingMessageIfReady();
                }
                
            } else {
                errorDiv.textContent = result.error || mergedConfig.captchaErrorMessage;
                inputField.value = '';
                verifyButton.disabled = false;
                verifyButton.style.opacity = '1';
                verifyButton.style.cursor = 'pointer';
                verifyButton.textContent = mergedConfig.captchaVerifyButton;
                // Auto-reload CAPTCHA on failure
                await loadNewCaptcha();
            }
        };

        reloadButton.onclick = async () => {
            await loadNewCaptcha();
        };

        const loadNewCaptcha = async () => {
            try {
                const response = await fetch(`${mergedConfig.captchaEndpoint}?agentId=${mergedConfig.agentId}`);
                const data = await response.json();
                
                if (data.token && data.image) {
                    captchaImage.src = data.image;
                    currentToken = data.token;
                    inputField.value = '';
                    errorDiv.textContent = '';
                }
            } catch (error) {
                console.error('Error reloading CAPTCHA:', error);
            }
        };

        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                verifyButton.click();
            }
        });

        appendChildren(buttonContainer, [verifyButton, reloadButton]);
        appendChildren(captchaContainer, [title, imageContainer, inputField, errorDiv, buttonContainer]);
        chatMessages.appendChild(captchaContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Focus input and scroll to show buttons
        setTimeout(() => {
            inputField.focus();
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    };

    const removeCaptchaUI = () => {
        if (captchaContainer && captchaContainer.parentNode) {
            captchaContainer.parentNode.removeChild(captchaContainer);
            captchaContainer = null;
            isShowingCaptcha = false;
        }
    };

    // ========== AGREEMENT CONSENT FUNCTIONS ==========

    /**
     * Sanitize agreement HTML to prevent XSS attacks
     * @param {string} html - HTML string to sanitize
     * @returns {string} - Sanitized HTML
     */
    const sanitizeAgreementHtml = (html) => {
        if (!html) return '';
        
        // Create a temporary container to parse HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Find all links and validate them
        const links = temp.querySelectorAll('a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            
            // Validate href attribute
            if (href) {
                const lower = href.toLowerCase().trim();
                // Reject dangerous protocols
                if (
                    lower.startsWith('javascript:') ||
                    lower.startsWith('data:') ||
                    lower.startsWith('vbscript:') ||
                    lower.startsWith('file:')
                ) {
                    link.setAttribute('href', '#');
                    link.setAttribute('data-blocked', 'true');
                }
                // Add security attributes for external links
                else if (lower.startsWith('http://') || lower.startsWith('https://')) {
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                }
            }
            
            // Remove event handlers
            const attributes = Array.from(link.attributes);
            attributes.forEach(attr => {
                if (attr.name.startsWith('on')) {
                    link.removeAttribute(attr.name);
                }
            });
        });
        
        // Remove all script tags
        const scripts = temp.querySelectorAll('script');
        scripts.forEach(script => script.remove());
        
        // Remove all style tags
        const styles = temp.querySelectorAll('style');
        styles.forEach(style => style.remove());
        
        return temp.innerHTML;
    };

    /**
     * Show document modal with iframe
     * @param {string} url - URL to display in modal
     * @param {string} title - Modal title
     */
    const showDocumentModal = (url, title) => {
        // Create backdrop
        const backdrop = createElement('div', {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: '999999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            boxSizing: 'border-box'
        });

        // Create modal container - responsive sizing
        const isMobileView = window.innerWidth <= 768;
        const modal = createElement('div', {
            backgroundColor: '#ffffff',
            borderRadius: isMobileView ? '12px' : '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            width: '100%',
            maxWidth: isMobileView ? '100%' : '900px',
            height: isMobileView ? '90vh' : '80vh',
            maxHeight: isMobileView ? '90vh' : '800px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxSizing: 'border-box'
        });

        // Create header
        const header = createElement('div', {
            padding: '20px 24px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fafafa'
        });

        const titleEl = createElement('h3', {
            margin: '0',
            fontSize: '18px',
            fontWeight: '600',
            color: 'rgba(0, 0, 0, 0.87)',
            fontFamily: 'var(--bc-font-sans, ui-sans-serif, system-ui, -apple-system)'
        }, { textContent: title || mergedConfig.agreementsModalClose });

        const closeButton = createElement('button', {
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: 'rgba(0, 0, 0, 0.54)',
            padding: '4px',
            lineHeight: '1',
            transition: 'color 0.2s'
        }, { innerHTML: '✕' });

        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.color = 'rgba(0, 0, 0, 0.87)';
        });
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.color = 'rgba(0, 0, 0, 0.54)';
        });

        appendChildren(header, [titleEl, closeButton]);

        // Create iframe container
        const iframeContainer = createElement('div', {
            flex: '1',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column'
        });

        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.flex = '1';
        iframe.style.border = 'none';
        iframe.style.display = 'block';
        iframe.style.backgroundColor = '#ffffff';
        
        // Set iframe attributes for security and functionality
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('scrolling', 'yes');
        // Allow same-origin for CSS, scripts for interactivity, and forms if needed
        iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms');

        iframeContainer.appendChild(iframe);
        appendChildren(modal, [header, iframeContainer]);
        backdrop.appendChild(modal);

        // Close handlers
        const closeModal = () => {
            if (backdrop.parentNode) {
                backdrop.parentNode.removeChild(backdrop);
            }
        };

        closeButton.onclick = closeModal;
        backdrop.onclick = (e) => {
            if (e.target === backdrop) {
                closeModal();
            }
        };

        document.body.appendChild(backdrop);
        
        // Set src AFTER appending to DOM for proper rendering
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            iframe.src = url;
        }, 10);
    };

    /**
     * Get stored consents from localStorage (domain-scoped)
     * @returns {Object} - Object mapping agreement ID to timestamp
     */
    const getStoredConsents = () => {
        try {
            const key = `ragChatConsents_${window.location.hostname}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error reading stored consents:', error);
        }
        return {};
    };

    /**
     * Save consents to localStorage (domain-scoped)
     * @param {Array} consentsArray - Array of { id, timestamp }
     */
    const saveConsents = (consentsArray) => {
        try {
            const key = `ragChatConsents_${window.location.hostname}`;
            const consentsMap = {};
            consentsArray.forEach(consent => {
                consentsMap[consent.id] = { timestamp: consent.timestamp };
            });
            localStorage.setItem(key, JSON.stringify(consentsMap));
        } catch (error) {
            console.error('Error saving consents:', error);
        }
    };

    /**
     * Check if all required consents exist in localStorage
     * @param {Array} requiredIds - Array of required agreement IDs
     * @returns {boolean} - True if all required consents exist
     */
    const checkConsentsValid = (requiredIds) => {
        const stored = getStoredConsents();
        return requiredIds.every(id => stored[id] && stored[id].timestamp);
    };

    /**
     * Render agreements UI with checkboxes
     */
    const renderAgreementsUI = () => {
        if (!mergedConfig.agreements || mergedConfig.agreements.length === 0) {
            return;
        }

        if (agreementsContainer) {
            removeAgreementsUI();
        }

        // Check if consents already exist in localStorage
        const requiredIds = mergedConfig.agreements.map(a => a.id);
        if (checkConsentsValid(requiredIds)) {
            agreementsAccepted = true;
            checkAndEnableChat();
            // Send pending message to LLM if exists
            sendPendingMessageIfReady();
            return;
        }

        // Add agent message introducing agreements
        const agreementIntroText = mergedConfig.locale === 'ru'
            ? 'Также мне нужно получить от вас следующие согласия:'
            : 'I also need to get the following consents from you:';
        addMessage('Agent', agreementIntroText);

        // Initialize agreement states
        agreementStates = {};
        mergedConfig.agreements.forEach(agreement => {
            agreementStates[agreement.id] = false;
        });

        // Create container styled like message bubble
        agreementsContainer = createElement('div', {
            padding: '20px',
            margin: '12px 12px 12px 48px',
            backgroundColor: 'rgba(240, 240, 255, 0.4)',
            borderRadius: '16px 16px 16px 4px',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.08)'
        });

        // Create title (more narrative)
        const title = createElement('div', {
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '12px',
            color: 'rgba(0, 0, 0, 0.7)',
            fontFamily: 'var(--bc-font-sans, ui-sans-serif, system-ui, -apple-system)'
        }, {
            textContent: mergedConfig.locale === 'ru' 
                ? 'Пожалуйста, отметьте следующие пункты:'
                : 'Please check the following items:'
        });

        agreementsContainer.appendChild(title);

        // Create checkbox for each agreement
        mergedConfig.agreements.forEach(agreement => {
            const checkboxContainer = createElement('div', {
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: '12px',
                gap: '8px'
            });

            const checkbox = createElement('input', {
                marginTop: '2px',
                cursor: 'pointer',
                flexShrink: '0'
            }, {
                type: 'checkbox',
                id: `agreement_${agreement.id}`
            });

            checkbox.addEventListener('change', () => {
                agreementStates[agreement.id] = checkbox.checked;
                updateContinueButton();
            });

            const labelEl = createElement('label', {
                fontSize: '14px',
                lineHeight: '1.5',
                color: 'rgba(0, 0, 0, 0.74)',
                cursor: 'pointer',
                fontFamily: 'var(--bc-font-sans, ui-sans-serif, system-ui, -apple-system)'
            }, {
                htmlFor: `agreement_${agreement.id}`
            });

            // Sanitize and set HTML
            const sanitizedHtml = sanitizeAgreementHtml(agreement.labelHtml);
            labelEl.innerHTML = sanitizedHtml;

            // Handle modal links
            if (agreement.modalUrl) {
                const links = labelEl.querySelectorAll('a');
                links.forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        showDocumentModal(agreement.modalUrl, agreement.modalTitle);
                    });
                });
            }

            appendChildren(checkboxContainer, [checkbox, labelEl]);
            agreementsContainer.appendChild(checkboxContainer);
        });

        // Create error message (hidden by default)
        const errorMsg = createElement('div', {
            fontSize: '13px',
            color: '#d32f2f',
            marginTop: '8px',
            display: 'none',
            fontFamily: 'var(--bc-font-sans, ui-sans-serif, system-ui, -apple-system)'
        }, {
            textContent: mergedConfig.agreementsAllRequired
        });

        agreementsContainer.appendChild(errorMsg);

        // Create continue button
        const continueButton = createElement('button', {
            marginTop: '16px',
            padding: '12px 24px',
            backgroundColor: mergedConfig.sendButtonColor || '#635bff',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            fontFamily: 'var(--bc-font-sans, ui-sans-serif, system-ui, -apple-system)',
            transition: 'all 0.22s cubic-bezier(0.22, 0.61, 0.36, 1)',
            opacity: '0.5',
            width: '100%'
        }, {
            textContent: mergedConfig.agreementsContinueButton,
            disabled: true
        });

        const updateContinueButton = () => {
            const allChecked = Object.values(agreementStates).every(checked => checked);
            continueButton.disabled = !allChecked;
            continueButton.style.opacity = allChecked ? '1' : '0.5';
            continueButton.style.cursor = allChecked ? 'pointer' : 'not-allowed';
            errorMsg.style.display = 'none';
        };

        continueButton.addEventListener('mouseenter', () => {
            if (!continueButton.disabled) {
                continueButton.style.transform = 'translateY(-1px)';
                continueButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.18)';
            }
        });

        continueButton.addEventListener('mouseleave', () => {
            continueButton.style.transform = 'translateY(0)';
            continueButton.style.boxShadow = 'none';
        });

        continueButton.onclick = async () => {
            const allChecked = Object.values(agreementStates).every(checked => checked);
            
            if (!allChecked) {
                errorMsg.style.display = 'block';
                return;
            }

            continueButton.disabled = true;
            continueButton.style.opacity = '0.6';
            continueButton.textContent = mergedConfig.locale === 'ru' ? 'Сохранение...' : 'Saving...';

            // Build consents array
            const timestamp = Date.now();
            const consents = mergedConfig.agreements.map(agreement => ({
                id: agreement.id,
                accepted: true,
                timestamp: timestamp
            }));

            // Save to localStorage
            saveConsents(consents);
            agreementsAccepted = true;

            // Send to backend if endpoint configured
            if (mergedConfig.agreementsEndpoint) {
                try {
                    const sessionId = getSessionId();
                    await fetch(mergedConfig.agreementsEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            sessionId,
                            consents
                        })
                    });
                } catch (error) {
                    console.error('Error sending consents to backend:', error);
                    // Continue anyway - localStorage is primary
                }
            }

            // Remove UI and enable chat
            removeAgreementsUI();
            
            // Reset placeholder after successful agreements acceptance
            chatInput.placeholder = mergedConfig.inputPlaceholder;
            
            // If user answered welcome question, send it to LLM now
            if (welcomeAnswered && chatHistory.length > 0) {
                const welcomeAnswer = chatHistory[chatHistory.length - 1].content;
                // Show that we're processing the welcome answer
                isWaitingForResponse = true;
                chatInput.disabled = true;
                
                // Send welcome answer to LLM
                try {
                    await sendMessageToLLM(welcomeAnswer);
                } catch (error) {
                    console.error('Error sending welcome answer to LLM:', error);
                    addMessage('System', mergedConfig.locale === 'ru' 
                        ? 'Ошибка при отправке сообщения. Попробуйте еще раз.'
                        : 'Error sending message. Please try again.');
                } finally {
                    isWaitingForResponse = false;
                    chatInput.disabled = false;
                    chatInput.focus();
                }
            } else {
                checkAndEnableChat();
            }
        };

        agreementsContainer.appendChild(continueButton);
        chatMessages.appendChild(agreementsContainer);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    /**
     * Remove agreements UI
     */
    const removeAgreementsUI = () => {
        if (agreementsContainer && agreementsContainer.parentNode) {
            agreementsContainer.parentNode.removeChild(agreementsContainer);
            agreementsContainer = null;
        }
    };

    // ========== END AGREEMENT CONSENT FUNCTIONS ==========

    /**
     * Send pending message to LLM if all security checks passed
     */
    const sendPendingMessageIfReady = async () => {
        // Check if all requirements are met
        const welcomeOk = !mergedConfig.requireWelcomeAnswer || welcomeAnswered;
        const captchaOk = !mergedConfig.captchaEnabled || captchaVerified;
        const agreementsOk = !mergedConfig.agreements || agreementsAccepted;

        if (welcomeOk && captchaOk && agreementsOk && chatHistory.length > 0) {
            const lastMessage = chatHistory[chatHistory.length - 1];
            if (lastMessage && lastMessage.role === 'user') {
                // Show that we're processing
                isWaitingForResponse = true;
                chatInput.disabled = true;
                
                // Send to LLM
                try {
                    await sendMessageToLLM(lastMessage.content);
                } catch (error) {
                    console.error('Error sending pending message to LLM:', error);
                    addMessage('System', mergedConfig.locale === 'ru' 
                        ? 'Ошибка при отправке сообщения. Попробуйте ещё раз.'
                        : 'Error sending message. Please try again.');
                } finally {
                    isWaitingForResponse = false;
                    chatInput.disabled = false;
                    chatInput.focus();
                }
            }
        }
    };

    const renderWelcomeQuestion = () => {
        if (!mergedConfig.welcomeQuestion || welcomeAnswered) {
            return;
        }

        const welcomeMessage = addMessage('Agent', mergedConfig.welcomeQuestion);
        // IMPORTANT: Enable input for welcome question - it's a psychological engagement technique
        // User answers freely, answer is saved locally, no LLM access needed yet
        chatInput.disabled = false;
        chatInput.placeholder = mergedConfig.locale === 'ru' ? 'Введите ваш ответ...' : 'Type your answer...';
        chatInput.focus();
    };

    const checkAndEnableChat = () => {
        // Check if all requirements are met
        const welcomeOk = !mergedConfig.requireWelcomeAnswer || welcomeAnswered;
        const captchaOk = !mergedConfig.captchaEnabled || captchaVerified;
        const agreementsOk = !mergedConfig.agreements || agreementsAccepted;

        if (welcomeOk && captchaOk && agreementsOk) {
            chatInput.disabled = false;
            chatInput.placeholder = mergedConfig.inputPlaceholder;
            chatInput.focus();
        } else {
            chatInput.disabled = true;
            if (!welcomeOk) {
                chatInput.placeholder = mergedConfig.locale === 'ru' 
                    ? 'Сначала ответьте на приветственный вопрос...' 
                    : 'Please answer the welcome question first...';
            } else if (!captchaOk) {
                chatInput.placeholder = mergedConfig.locale === 'ru' 
                    ? 'Пожалуйста, пройдите проверку CAPTCHA...' 
                    : 'Please complete CAPTCHA verification...';
            } else if (!agreementsOk) {
                chatInput.placeholder = mergedConfig.locale === 'ru' 
                    ? 'Пожалуйста, примите соглашения...' 
                    : 'Please accept the agreements...';
            }
        }
    };

    // Initialize welcome question and CAPTCHA
    // This must be defined AFTER all the functions it depends on
    const initializeSecurityFeatures = () => {
        // Show welcome question if required
        if (mergedConfig.requireWelcomeAnswer && mergedConfig.welcomeQuestion) {
            // Welcome question is a psychological engagement technique
            // User can answer freely, no LLM access yet
            renderWelcomeQuestion();
            // Don't call checkAndEnableChat here - input is already enabled by renderWelcomeQuestion
        } else if (mergedConfig.captchaEnabled) {
            // Show CAPTCHA directly if no welcome question
            loadCaptcha();
            chatInput.disabled = true;
            chatInput.placeholder = mergedConfig.locale === 'ru' 
                ? 'Пожалуйста, пройдите проверку CAPTCHA...' 
                : 'Please complete CAPTCHA verification...';
        } else if (mergedConfig.agreements) {
            // Show agreements directly if no welcome question or CAPTCHA
            renderAgreementsUI();
            chatInput.disabled = true;
            chatInput.placeholder = mergedConfig.locale === 'ru' 
                ? 'Пожалуйста, примите соглашения...' 
                : 'Please accept the agreements...';
        } else {
            // No security features enabled, enable chat
            checkAndEnableChat();
        }
    };

    // Update clear button handler to reset and re-initialize security features
    clearButton.addEventListener('click', () => {
        clearChatHistory(chatMessages, chatHistory);
        // Reset security state when clearing history
        welcomeAnswered = false;
        captchaVerified = false;
        captchaToken = null;
        agreementsAccepted = false;
        agreementStates = {};
        // Clear localStorage consents as well (fresh start)
        try {
            const key = `ragChatConsents_${window.location.hostname}`;
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error clearing consents from localStorage:', error);
        }
        // Remove any existing cover first to avoid duplicates
        removeCover();
        // Show cover again after clearing history (if configured)
        if (mergedConfig.showCover && mergedConfig.cover) {
            renderCover();
        }
        // Re-initialize security features after clearing
        if (mergedConfig.requireWelcomeAnswer || mergedConfig.captchaEnabled || mergedConfig.agreements) {
            initializeSecurityFeatures();
        }
    });

    // Initialize security features on load if needed
    if (mergedConfig.requireWelcomeAnswer || mergedConfig.captchaEnabled || mergedConfig.agreements) {
        // If no chat history, initialize security features immediately
        if (chatHistory.length === 0) {
            // For autoOpen mode (embedded widgets), initialize immediately
            if (mergedConfig.autoOpen || isSidebarMode) {
                initializeSecurityFeatures();
            } else {
                // For button-triggered mode, will initialize when button is clicked
            }
        }
    }

    // Generate or retrieve session ID
    const getSessionId = () => {
        let sessionId = localStorage.getItem('ragChatSessionId');
        if (!sessionId) {
            sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('ragChatSessionId', sessionId);
        }
        return sessionId;
    };

    // Send message to LLM - extracted for reusability
    const sendMessageToLLM = async (message) => {
        // Show bouncing dots while waiting for response
        const agentMessageElement = addMessage('Agent', '', true);

        try {
            // Get session ID
            const sessionId = getSessionId();
            
            // Prepare headers
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mergedConfig.token}`
            };
            
            // Add CAPTCHA token if enabled
            if (mergedConfig.captchaEnabled && captchaToken) {
                headers['X-Captcha-Token'] = captchaToken;
            }
            
            const response = await fetch(mergedConfig.url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    messages: [...chatHistory, { role: "user", content: message }],
                    sessionId: sessionId,  // Add session ID
                    maxSimilarNumber: 20,
                    stream: true,
                    lastMessagesContextNumber: 20
                })
            });

            if (!response.ok) {
                // Handle CAPTCHA re-verification
                if (response.status === 403) {
                    const errorData = await response.json();
                    if (errorData.error === 'captcha_reverify' || errorData.error === 'captcha_required') {
                        agentMessageElement.innerHTML = 'Please complete CAPTCHA verification to continue.';
                        isWaitingForResponse = false;
                        chatInput.disabled = true;
                        captchaVerified = false;
                        await loadCaptcha();
                        return;
                    }
                }
                
                // Handle quota exceeded or rate limit (429)
                if (response.status === 429) {
                    try {
                        const errorData = await response.json();
                        const message = errorData.message || 
                            (locale === 'ru' 
                                ? '❌ Превышен лимит запросов или месячная квота кредитов. Пожалуйста, подождите или обновите тарифный план.'
                                : '❌ Request limit or monthly credit quota exceeded. Please wait or upgrade your plan.');
                        agentMessageElement.innerHTML = message;
                    } catch {
                        agentMessageElement.innerHTML = locale === 'ru'
                            ? '❌ Превышен лимит запросов или квота кредитов'
                            : '❌ Request limit or credit quota exceeded';
                    }
                    isWaitingForResponse = false;
                    return;
                }
                
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Trigger onStartResponse event when server starts responding
            if (mergedConfig.onStartResponse && typeof mergedConfig.onStartResponse === 'function') {
                try {
                    mergedConfig.onStartResponse({
                        timestamp: new Date(),
                        userMessage: message,
                        response: response
                    });
                } catch (error) {
                    console.error('Error in onStartResponse handler:', error);
                }
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
            console.error('Error sending message to LLM:', error);
            agentMessageElement.innerHTML = `Error: ${error.message}`;
            throw error; // Re-throw to be handled by caller
        }
    };

    const handleMessage = async (message) => {
        // Handle welcome question answer (psychological engagement technique)
        // Answer is saved locally, no LLM access needed yet
        if (mergedConfig.requireWelcomeAnswer && !welcomeAnswered) {
            addMessage('User', message);
            welcomeAnswered = true;
            
            // Save answer locally - will be sent to LLM later when access is unlocked
            chatHistory.push({ role: 'user', content: message });
            localStorage.setItem('ragChatHistory', JSON.stringify(chatHistory));
            
            // Show CAPTCHA if enabled (next step in engagement flow)
            if (mergedConfig.captchaEnabled && !captchaVerified) {
                await loadCaptcha();
                chatInput.disabled = true;
                chatInput.placeholder = mergedConfig.locale === 'ru' 
                    ? 'Пожалуйста, пройдите проверку CAPTCHA...' 
                    : 'Please complete CAPTCHA verification...';
                return;
            }
            
            // Show agreements if enabled and not CAPTCHA (agreements after CAPTCHA are handled in CAPTCHA callback)
            if (!mergedConfig.captchaEnabled && mergedConfig.agreements && !agreementsAccepted) {
                renderAgreementsUI();
                chatInput.disabled = true;
                chatInput.placeholder = mergedConfig.locale === 'ru' 
                    ? 'Пожалуйста, примите соглашения...' 
                    : 'Please accept the agreements...';
                return;
            }
            
            // If no CAPTCHA or agreements required, send to LLM immediately
            if (!mergedConfig.captchaEnabled && !mergedConfig.agreements) {
                isWaitingForResponse = true;
                chatInput.disabled = true;
                try {
                    await sendMessageToLLM(message);
                } catch (error) {
                    // Error already logged in sendMessageToLLM
                } finally {
                    isWaitingForResponse = false;
                    chatInput.disabled = false;
                    chatInput.focus();
                }
            }
            return;
        }

        // Regular message handling
        addMessage('User', message);
        chatInput.value = '';
        isWaitingForResponse = true;

        try {
            await sendMessageToLLM(message);
        } catch (error) {
            // Error already logged and displayed
        } finally {
            isWaitingForResponse = false;
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
        // Skip resize handling for sidebar and showcase modes
        if (isSidebarMode || isShowcaseMode) return;
        
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
            
            if (isChatOpen && chatButton && mobileCloseButton) {
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
            
            if (chatButton && mobileCloseButton) {
                chatButton.style.display = 'block';
                clearButton.style.marginRight = '0';
                Object.assign(mobileCloseButton.style, {
                    display: 'none',
                    visibility: 'hidden',
                    opacity: '0'
                });
            }
        }
    });

    // Add resize handles to container (only for floating mode)
    if (!isSidebarMode && !isShowcaseMode) {
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
    }

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

    // Add event listeners for all handles (only for floating mode)
    if (!isSidebarMode && !isShowcaseMode) {
        resizeHandleTopLeft.addEventListener('mousedown', (e) => initResize(e, 'topLeft'));
        resizeHandleTopLeft.addEventListener('touchstart', (e) => initResize(e, 'topLeft'));
        
        resizeHandleTop.addEventListener('mousedown', (e) => initResize(e, 'top'));
        resizeHandleTop.addEventListener('touchstart', (e) => initResize(e, 'top'));
        
        resizeHandleLeft.addEventListener('mousedown', (e) => initResize(e, 'left'));
        resizeHandleLeft.addEventListener('touchstart', (e) => initResize(e, 'left'));
    }

    // Trigger initial resize to set correct state (only for floating mode)
    if (!isSidebarMode && !isShowcaseMode) {
        window.dispatchEvent(new Event('resize'));
    }
}

export default function RagChat(config) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initRagChat(config));
    } else {
        initRagChat(config);
    }
}
