function initRagChat(config) {
    const { token, host, port, buttonPosition, buttonColor, buttonCaption, listId } = config;
    
    let chatHistory = [];
    let isWaitingForResponse = false;

    // Создание кнопки чата
    const chatButton = document.createElement('button');
    chatButton.innerHTML = buttonCaption;
    chatButton.style.position = 'fixed';
    chatButton.style.zIndex = '1000';
    chatButton.style.padding = '15px';
    chatButton.style.border = 'none';
    chatButton.style.borderRadius = '50%';
    chatButton.style.backgroundColor = buttonColor;
    chatButton.style.color = 'white';
    chatButton.style.cursor = 'pointer';
    chatButton.style.fontSize = '24px';

    // Установка позиции кнопки
    if (buttonPosition === 'bottom-right') {
        chatButton.style.bottom = '20px';
        chatButton.style.right = '20px';
    } else if (buttonPosition === 'bottom-left') {
        chatButton.style.bottom = '20px';
        chatButton.style.left = '20px';
    }

    document.body.appendChild(chatButton);

    // Создание контейнера чата
    const chatContainer = document.createElement('div');
    chatContainer.style.position = 'fixed';
    chatContainer.style.bottom = '80px';
    chatContainer.style.right = '20px';
    chatContainer.style.width = '300px';
    chatContainer.style.height = '400px';
    chatContainer.style.backgroundColor = 'white';
    chatContainer.style.border = '1px solid #ccc';
    chatContainer.style.borderRadius = '5px';
    chatContainer.style.display = 'none';
    chatContainer.style.flexDirection = 'column';
    chatContainer.style.zIndex = '1001';

    const chatMessages = document.createElement('div');
    chatMessages.style.flex = '1';
    chatMessages.style.overflowY = 'auto';
    chatMessages.style.padding = '10px';

    const chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.placeholder = 'Type your message...';
    chatInput.style.width = '100%';
    chatInput.style.padding = '10px';
    chatInput.style.border = 'none';
    chatInput.style.borderTop = '1px solid #ccc';

    chatContainer.appendChild(chatMessages);
    chatContainer.appendChild(chatInput);
    document.body.appendChild(chatContainer);

    // Переключение видимости чата
    chatButton.addEventListener('click', () => {
        chatContainer.style.display = chatContainer.style.display === 'none' ? 'flex' : 'none';
    });

    // Обработчик отправки сообщения
    chatInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && !isWaitingForResponse) {
            const message = chatInput.value.trim();
            if (message) {
                chatInput.value = '';
                await sendMessage(message);
            }
        }
    });

    async function sendMessage(message) {
        if (isWaitingForResponse) {
            addMessage('System', 'Пожалуйста, подождите ответа на предыдущий вопрос.');
            return;
        }
    
        isWaitingForResponse = true;
        addMessage('User', message);
    
        try {
            const response = await fetch(`http://${host}:${port}/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    messages: [
                        ...chatHistory,
                        { role: "user", content: message }
                    ],
                    maxSimilarNumber: 20,
                    stream: false,  // Изменено на false для простоты обработки
                    lastMessagesContextNumber: 20
                })
            });
    
            if (!response.ok) {
                throw new Error('Ошибка сервера: ' + response.status);
            }
    
            const answer = await response.text();  // Получаем ответ как текст
            
            addMessage('Agent', answer);
    
            // Обновляем историю чата
            chatHistory.push({ role: 'user', content: message });
            chatHistory.push({ role: 'assistant', content: answer });
    
            // Ограничиваем историю чата последними 20 парами сообщений
            if (chatHistory.length > 40) {
                chatHistory = chatHistory.slice(-40);
            }
    
            // Сохраняем обновленную историю в localStorage
            localStorage.setItem('ragChatHistory', JSON.stringify(chatHistory));
    
        } catch (error) {
            addMessage('System', 'Ошибка: ' + error.message);
        } finally {
            isWaitingForResponse = false;
        }
    }
    function addMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.innerHTML = `<strong>${sender}:</strong> ${text}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Загрузка истории чата при инициализации
    const savedHistory = localStorage.getItem('ragChatHistory');
    if (savedHistory) {
        chatHistory = JSON.parse(savedHistory);
        chatHistory.forEach(msg => addMessage(msg.role === 'user' ? 'User' : 'Agent', msg.content));
    }
}