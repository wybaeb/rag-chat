import { createElement, formatText } from './utils';
import marked from 'marked';

export async function handleMessage(message, chatMessages, chatHistory, config) {
    addMessage('User', message, chatMessages, config);

    try {
        const response = await fetch(`http://${config.host}:${config.port}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.token}`
            },
            body: JSON.stringify({
                messages: [...chatHistory, { role: "user", content: message }],
                maxSimilarNumber: 20,
                stream: false,
                lastMessagesContextNumber: 20
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const answer = await response.text();
        addMessage('Agent', answer, chatMessages, config);

        chatHistory.push({ role: 'user', content: message });
        chatHistory.push({ role: 'assistant', content: answer });

        if (chatHistory.length > 40) {
            chatHistory = chatHistory.slice(-40);
        }

        localStorage.setItem('ragChatHistory', JSON.stringify(chatHistory));

    } catch (error) {
        console.error('Error in handleMessage:', error);
        addMessage('System', `Error: ${error.message}`, chatMessages, config);
    }
}

export function loadChatHistory(chatMessages, chatHistory, config) {
    const savedHistory = localStorage.getItem('ragChatHistory');
    if (savedHistory) {
        try {
            const parsedHistory = JSON.parse(savedHistory);
            chatHistory.push(...parsedHistory);
            parsedHistory.forEach(msg => {
                const sender = msg.role === 'user' ? 'User' : 'Agent';
                addMessage(sender, msg.content, chatMessages, config);
            });
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }
}


function addMessage(sender, text, chatMessages, config) {
    const defaultConfig = {
        userBubbleColor: 'rgba(230, 230, 230, 0.7)', // Сделано более прозрачным
        botBubbleColor: 'rgba(209, 196, 233, 0.7)' // Сделано более прозрачным
    };
    const mergedConfig = { ...defaultConfig, ...config };

    const messageElement = createElement('div', {
        marginBottom: '15px', // Увеличено для лучшего разделения сообщений
        padding: '15px', // Увеличено для лучшего визуального восприятия
        borderRadius: '20px',
        maxWidth: '80%',
        backgroundColor: sender === 'User' ? mergedConfig.userBubbleColor : mergedConfig.botBubbleColor,
        alignSelf: sender === 'User' ? 'flex-end' : 'flex-start',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // Добавлена легкая тень для объема
        fontSize: '16px' // Увеличено для лучшей читаемости
    });

    messageElement.innerHTML = `<strong>${sender}:</strong> ${formatText(text)}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

export function clearChatHistory(chatMessages, chatHistory) {
    chatMessages.innerHTML = '';
    chatHistory.length = 0;
    localStorage.removeItem('ragChatHistory');
}
