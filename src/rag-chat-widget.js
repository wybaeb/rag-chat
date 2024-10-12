import { createStyles } from './styles';
import { handleMessage, loadChatHistory, clearChatHistory } from './message-handler';
import { createElement, appendChildren } from './utils';

function initRagChat(config = {}) {
    const defaultConfig = {
        token: '',
        host: 'localhost',
        port: 3000,
        buttonPosition: 'bottom-right',
        buttonColor: '#635bff',
        buttonCaption: '💬',
        chatBackgroundColor: 'rgba(255, 255, 255, 0.9)',
        chatBorderColor: '#ccc',
        inputBackgroundColor: '#f0f0f0',
        sendButtonColor: '#635bff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
    };

    const mergedConfig = { ...defaultConfig, ...config };
    const styles = createStyles(mergedConfig);

    let chatHistory = [];
    let isWaitingForResponse = false;

    const chatButton = createElement('button', styles.chatButton, { innerHTML: mergedConfig.buttonCaption });
    const chatContainer = createElement('div', styles.chatContainer);
    const chatHeader = createElement('div', styles.chatHeader);
    const clearButton = createElement('button', styles.clearButton, { innerHTML: '🗑️' });
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

    appendChildren(preloaderContainer, [preloader]);
    appendChildren(chatHeader, [clearButton]);
    appendChildren(inputContainer, [chatInput, sendButton]);
    appendChildren(chatContainer, [chatHeader, chatMessages, preloaderContainer, inputContainer]);
    appendChildren(document.body, [chatButton, chatContainer]);

    chatButton.addEventListener('click', () => {
        chatContainer.style.display = chatContainer.style.display === 'none' ? 'flex' : 'none';
    });

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

    // Добавляем обработку длинных сообщений
    const addMessage = (sender, text) => {
        const messageElement = createElement('div', {
            marginBottom: '10px',
            padding: '10px',
            borderRadius: '10px',
            maxWidth: '80%',
            overflowX: 'auto', // Добавляем горизонтальную прокрутку для длинных сообщений
            backgroundColor: sender === 'User' ? '#e6e6e6' : '#d1c4e9',
            alignSelf: sender === 'User' ? 'flex-end' : 'flex-start',
            wordBreak: 'break-word', // Разрывает длинные слова
            whiteSpace: 'pre-wrap', // Сохраняет переносы строк и пробелы
        });

        messageElement.innerHTML = `<strong>${sender}:</strong> ${text}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };
}

export default initRagChat;
