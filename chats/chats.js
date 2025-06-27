const ChatsModule = {
    chats: {},
    profiles: {},
    currentChatId: null,
    
    init: function() {
        console.log('Initializing Chats Module (UI only)...');
        const currentUser = AmoreApp.getCurrentUser();
        if (!currentUser) {
            window.location.href = '../auth/auth.html';
            return;
        }

        // Данные теперь загружаются глобально в AmoreApp
        this.profiles = AmoreApp.profiles;
        this.likedProfilesKey = 'likedProfiles';

        this.loadChatsFromStorage();
        this.setupEventListeners();
        this.updateBadges();

        // НОВЫЙ КОД: Слушаем событие storage для обновления в реальном времени между вкладками
        window.addEventListener('storage', (event) => {
            // Обновляемся, если изменились чаты или пришел флаг об обновлении
            if (event.key === this.likedProfilesKey || event.key === 'chat_storage_updated') {
                 console.log('Detected chat storage update. Refreshing chat list.');
                 this.loadChatsFromStorage();
            }
        });
        
        // Добавляем запасной интервал для обновления UI на случай, если событие не сработает (например, в той же вкладке)
        setInterval(() => this.loadChatsFromStorage(), 7000);
    },

    // УДАЛЕНЫ: loadPrerequisites, processPendingChatEvents, checkScheduledMessages, sendSystemMessage
    // Вся эта логика теперь находится в app.js

    loadChatsFromStorage: function() {
        const allLikedProfiles = Utils.Storage.get(this.likedProfilesKey, []);
        const newChats = {}; 
        
        // Загружаем только те чаты, где есть сообщения
        allLikedProfiles.forEach(profile => {
            if (profile.chatMessages && profile.chatMessages.length > 0) {
                newChats[profile.id] = {
                    profileId: profile.id,
                    messages: profile.chatMessages,
                    lastMessage: profile.chatMessages[profile.chatMessages.length - 1]
                };
            }
        });

        // Перерисовываем список только если есть реальные изменения, чтобы избежать мерцания
        if (JSON.stringify(this.chats) !== JSON.stringify(newChats)) {
            console.log('Chat data has changed, re-rendering list.');
            this.chats = newChats;
            this.renderChatList();
            this.updateBadges();
        }
    },
    
    setupEventListeners: function() {
        document.querySelector("[data-action='refresh-chats']")?.addEventListener('click', () => {
            console.log('Refreshing chats manually...');
            this.loadChatsFromStorage();
            Utils.Toast.info("Chat aggiornate!");
        });
        
        document.querySelector('.send-btn')?.addEventListener('click', () => this.sendMessage());
        
        document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        document.querySelector('.back-btn')?.addEventListener('click', () => this.closeChat());
    },

    renderChatList: function() {
        const chatList = document.getElementById('chat-list');
        const noChats = document.getElementById('no-chats');
        if (!chatList || !noChats) return;

        const chatIds = Object.keys(this.chats);

        if (chatIds.length === 0) {
            noChats.style.display = 'flex';
            chatList.style.display = 'none';
        } else {
            noChats.style.display = 'none';
            chatList.style.display = 'block';

            chatList.innerHTML = '';
            // Сортируем чаты по времени последнего сообщения
            const sortedChats = Object.values(this.chats).sort((a, b) => {
                const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp).getTime() : 0;
                const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp).getTime() : 0;
                return timeB - timeA;
            });

            sortedChats.forEach(chat => {
                const profile = this.profiles[chat.profileId];
                if (profile) {
                    chatList.appendChild(this.createChatItem(chat, profile));
                } else {
                    console.warn(`Profile data for chat ID ${chat.profileId} not found.`);
                }
            });
        }
    },
    
    createChatItem: function(chat, profile) {
        const item = document.createElement('div');
        item.className = 'chat-item';
        item.dataset.chatId = profile.id;
        
        const lastMessage = chat.lastMessage;
        const lastMessageText = lastMessage ? (lastMessage.sender === 'user' ? 'Tu: ' + lastMessage.text : lastMessage.text) : 'Nessun messaggio';
        const unreadCount = chat.messages.filter(msg => !msg.read && msg.sender === 'other').length;
        const formattedTime = lastMessage ? Utils.Date.formatRelative(lastMessage.timestamp) : '';

        item.innerHTML = `
            <img class="chat-avatar" src="../shared/images/profiles/${profile.id}.jpg" alt="${profile.name}" onerror="this.src='https://placehold.co/65x65/FF7E5F/FFFFFF?text=${profile.name.charAt(0)}'">
            <div class="chat-info">
                <div class="chat-name">${profile.name}</div>
                <div class="chat-last-message">${lastMessageText}</div>
            </div>
            <div class="chat-meta">
                ${lastMessage ? `<div class="chat-time">${formattedTime}</div>` : ''}
                ${unreadCount > 0 ? `<div class="chat-unread">${unreadCount}</div>` : ''}
            </div>
        `;
        
        item.addEventListener('click', () => this.openChat(profile.id));
        return item;
    },
    
    openChat: function(profileId) {
        this.currentChatId = profileId;
        const profile = this.profiles[profileId];
        let chat = this.chats[profileId];

        if (!profile || !chat) {
            console.error("Cannot open chat: profile or chat data is missing.");
            return;
        }
        
        document.getElementById('chat-modal').style.display = 'flex';
        document.getElementById('chat-user-name').textContent = profile.name;
        document.getElementById('chat-avatar').src = `../shared/images/profiles/${profile.id}.jpg`;
        document.getElementById('chat-avatar').onerror = function() { this.src=`https://placehold.co/50x50/FF7E5F/FFFFFF?text=${profile.name.charAt(0)}`};
        
        let madeChanges = false;
        // Отмечаем сообщения как прочитанные
        chat.messages.forEach(msg => {
            if (msg.sender === 'other' && !msg.read) {
                msg.read = true;
                madeChanges = true;
            }
        });
        
        this.renderChatMessages(chat.messages);
        
        // Если были непрочитанные, обновляем хранилище и UI
        if(madeChanges) {
            this.updateLikedProfilesStorage(); 
            this.renderChatList(); 
            this.updateBadges(); 
        }
    },

    renderChatMessages: function(messages) {
        const container = document.getElementById('chat-messages');
        container.innerHTML = '';
        let lastDate = null;
        messages.forEach(message => {
            // Вставляем разделитель даты
            const messageDate = new Date(message.timestamp).toDateString();
            if(messageDate !== lastDate) {
                const dateSeparator = document.createElement('div');
                dateSeparator.className = 'chat-date-separator';
                dateSeparator.textContent = new Date(message.timestamp).toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' });
                container.appendChild(dateSeparator);
                lastDate = messageDate;
            }
            this.appendMessageToChat(message);
        });
        container.scrollTop = container.scrollHeight;
    },

    appendMessageToChat: function(message) {
        const container = document.getElementById('chat-messages');
        const messageEl = document.createElement('div');
        messageEl.className = `message ${message.sender === 'user' ? 'user' : 'other'}`;
        const formattedTime = new Date(message.timestamp).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        messageEl.innerHTML = `
            ${message.sender === 'other' ? `<img class="message-avatar" src="../shared/images/profiles/${this.currentChatId}.jpg" alt="Avatar" onerror="this.style.display='none'">` : ''}
            <div class="message-content">
                <div class="message-text">${message.text}</div>
                <div class="message-time">${formattedTime}</div>
            </div>
        `;
        container.appendChild(messageEl);
        container.scrollTop = container.scrollHeight;
    },
    
    sendMessage: function() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();

        if (!text || !this.currentChatId) return;

        const message = {
            text: text,
            sender: 'user',
            timestamp: new Date().toISOString(),
            read: true, 
        };

        const chat = this.chats[this.currentChatId];
        if (!chat.messages) chat.messages = [];
        chat.messages.push(message);
        chat.lastMessage = message;

        this.appendMessageToChat(message);
        input.value = ''; 

        this.updateLikedProfilesStorage();
        this.renderChatList();
    },

    // Эта функция обновляет хранилище после действий пользователя (отправка сообщения, прочтение)
    updateLikedProfilesStorage: function() {
        if (!this.currentChatId) return;
        
        const allLikedProfiles = Utils.Storage.get(this.likedProfilesKey, []);
        const profileIndex = allLikedProfiles.findIndex(p => p.id == this.currentChatId);

        if (profileIndex !== -1) {
            allLikedProfiles[profileIndex].chatMessages = this.chats[this.currentChatId].messages;
            Utils.Storage.set(this.likedProfilesKey, allLikedProfiles);
            // Уведомляем другие вкладки
            Utils.Storage.set('chat_storage_updated', Date.now());
        }
    },
    
    closeChat: function() {
        document.getElementById('chat-modal').style.display = 'none';
        this.currentChatId = null;
        // После закрытия чата полезно обновить список, т.к. могли быть прочитаны сообщения
        this.loadChatsFromStorage();
    },
    
    updateBadges: function() {
        AmoreApp.updateNavigationBadges();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Ждем, пока AmoreApp полностью инициализируется, особенно `profiles`
    if (AmoreApp.currentUser) {
        // Если AmoreApp уже загрузил пользователя, и мы на странице чатов,
        // дадим ему время загрузить данные перед инициализацией модуля чатов.
        setTimeout(() => ChatsModule.init(), 100);
    } else {
        // Если пользователь еще не загружен, слушаем событие или просто ждем
         // Этот случай маловероятен, если скрипты грузятся в правильном порядке
    }
});
