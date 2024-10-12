import { createStyles } from './styles';
import { handleMessage, loadChatHistory } from './message-handler';
import { createElement, appendChildren } from './utils';

function initRagChat(config = {}) {
    const defaultConfig = {
        token: '',
        host: 'localhost',
        port: 3000,
        buttonPosition: 'bottom-right',
        buttonColor: 'radial-gradient(462.56% 102.45% at 109.47% 102.45%,#a75bff 0,#635bff 57%,#635bff 100%)',
        buttonCaption: '💬',
        chatBackgroundColor: 'rgba(255, 255, 255, 0.9)',
        chatBorderColor: '#ccc',
        inputBackgroundColor: '#f0f0f0',
        sendButtonColor: '#635bff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        userBubbleColor: '#e6e6e6',
        botBubbleColor: '#d1c4e9'
    };

    const mergedConfig = { ...defaultConfig, ...config };
    const styles = createStyles(mergedConfig);

    let chatHistory = [];
    let isWaitingForResponse = false;

    const chatButton = createElement('button', styles.chatButton, { innerHTML: mergedConfig.buttonCaption });
    const chatContainer = createElement('div', styles.chatContainer);
    const chatMessages = createElement('div', styles.chatMessages);
    const inputContainer = createElement('div', styles.inputContainer);
    const chatInput = createElement('input', styles.chatInput, { type: 'text', placeholder: 'Type your message...' });
    const sendButton = createElement('button', styles.sendButton, { innerHTML: '&#10148;' });

    appendChildren(inputContainer, [chatInput, sendButton]);
    appendChildren(chatContainer, [chatMessages, inputContainer]);
    appendChildren(document.body, [chatButton, chatContainer]);

    chatButton.addEventListener('click', () => {
        chatContainer.style.display = chatContainer.style.display === 'none' ? 'flex' : 'none';
    });

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

    loadChatHistory(chatMessages, chatHistory, mergedConfig);
}

export default initRagChat;
