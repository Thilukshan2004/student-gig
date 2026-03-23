// chatbot.js
(function() {
    // Create the widget container
    const widget = document.createElement('div');
    widget.id = 'ai-chat-widget';
    widget.innerHTML = `
        <div id="chat-toggle" class="chat-toggle">
            <i class="fas fa-comment"></i>
        </div>
        <div id="chat-window" class="chat-window hidden">
            <div class="chat-header">
                <span>JobFactory AI Assistant</span>
                <button id="chat-close">&times;</button>
            </div>
            <div id="chat-messages" class="chat-messages">
                <div class="message bot">Hello! I'm JobFactory AI. How can I help you today?</div>
            </div>
            <div class="chat-input">
                <input type="text" id="chat-input" placeholder="Type your message...">
                <button id="chat-send">Send</button>
            </div>
        </div>
    `;
    document.body.appendChild(widget);

    // Add styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        #ai-chat-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .chat-toggle {
            width: 60px;
            height: 60px;
            background-color: #00a651;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: transform 0.3s;
        }
        .chat-toggle:hover {
            transform: scale(1.05);
        }
        .chat-toggle i {
            font-size: 24px;
            color: white;
        }
        .chat-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 350px;
            height: 450px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 25px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: all 0.3s;
        }
        .chat-window.hidden {
            display: none;
        }
        .chat-header {
            background: #00a651;
            color: white;
            padding: 12px 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .chat-header button {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
        }
        .chat-messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            background: #f9f9f9;
        }
        .message {
            margin-bottom: 12px;
            padding: 8px 12px;
            border-radius: 15px;
            max-width: 80%;
            word-wrap: break-word;
        }
        .message.user {
            background: #00a651;
            color: white;
            margin-left: auto;
            text-align: right;
        }
        .message.bot {
            background: #e9ecef;
            color: #333;
        }
        .chat-input {
            display: flex;
            border-top: 1px solid #ddd;
            padding: 10px;
            background: white;
        }
        .chat-input input {
            flex: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 20px;
            outline: none;
        }
        .chat-input button {
            margin-left: 10px;
            background: #00a651;
            color: white;
            border: none;
            border-radius: 20px;
            padding: 8px 15px;
            cursor: pointer;
        }
        @media (max-width: 480px) {
            .chat-window {
                width: 300px;
                height: 400px;
                bottom: 70px;
            }
        }
    `;
    document.head.appendChild(style);

    // Chat functionality
    const toggleBtn = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const closeBtn = document.getElementById('chat-close');
    const sendBtn = document.getElementById('chat-send');
    const input = document.getElementById('chat-input');
    const messagesContainer = document.getElementById('chat-messages');

    toggleBtn.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
    });

    closeBtn.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
    });

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.textContent = text;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function sendMessage() {
        const userMessage = input.value.trim();
        if (!userMessage) return;

        addMessage(userMessage, 'user');
        input.value = '';
        input.disabled = true;
        sendBtn.disabled = true;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMessage })
            });
            const data = await response.json();
            if (data.reply) {
                addMessage(data.reply, 'bot');
            } else {
                addMessage('Sorry, I encountered an error. Please try again.', 'bot');
            }
        } catch (error) {
            console.error('Chat error:', error);
            addMessage('Sorry, the service is unavailable right now.', 'bot');
        } finally {
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
})();