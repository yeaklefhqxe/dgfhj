// Main application logic for Amore Italiano
const AmoreApp = {
    currentUser: null,
    registeredUsers: [],
    // НОВЫЕ СВОЙСТВА ДЛЯ ГЛОБАЛЬНОГО СЕРВИСА ЧАТОВ
    profiles: {},
    customMessages: {},
    defaultMessages: ['Ciao! Come stai? 😊', 'Mi piace il tuo profilo!'],
    scheduledMessagesKey: null,
    pendingEventsKey: null,
    likedProfilesKey: 'likedProfiles', // Используем глобальный ключ для всех пользователей, как в оригинальной логике
    
    // Initialize application
    init: function() {
        console.log('Initializing Amore Italiano App...');
        
        this.loadRegisteredUsers();
        this.currentUser = Utils.Storage.get('currentUser', null);
        Translations.init();
        this.setupGlobalListeners();
        
        if (this.currentUser && this.currentUser.unlocked) {
            const bottomNav = document.getElementById('bottom-nav');
            if (bottomNav) {
                bottomNav.style.display = 'flex';
            }
        }

        // НОВЫЙ КОД: Инициализация глобального сервиса чатов, если пользователь авторизован
        if (this.currentUser) {
            this.initChatService();
        }
    },
    
    // НОВАЯ ФУНКЦИЯ: Инициализация сервиса
    initChatService: async function() {
        console.log('Initializing Global Chat Service...');
        
        // Загружаем данные, необходимые для работы сервиса
        await this.loadChatPrerequisites();

        // Устанавливаем ключи для localStorage на основе ID пользователя
        this.scheduledMessagesKey = `ai_scheduled_messages_${this.currentUser.id}`;
        this.pendingEventsKey = `pendingChatEvents_${this.currentUser.id}`;

        // Запускаем периодическую проверку и обработку
        setInterval(() => {
            this.processPendingChatEvents();
            this.checkScheduledMessages();
        }, 5000); // Проверяем каждые 5 секунд
    },

    // НОВАЯ ФУНКЦИЯ: Загрузка данных (профили, сообщения)
    loadChatPrerequisites: function() {
        // Пути указаны относительно HTML-файла, который загружает этот скрипт.
        // Они должны работать со всех страниц (например, /swipes/ и /chats/).
        const customMessagesPath = '../chats/custom_messages.json';
        const profilesPath = '../shared/data/profiles.json';

        return Promise.all([
            fetch(customMessagesPath).then(res => res.json()).catch(e => { console.error(`Failed to load ${customMessagesPath}`, e); return null; }),
            fetch(profilesPath).then(res => res.json()).catch(e => { console.error(`Failed to load ${profilesPath}`, e); return null; })
        ]).then(([customMessagesData, profilesData]) => {
            if (customMessagesData && customMessagesData.messages) {
                 this.customMessages = {};
                 customMessagesData.messages.forEach(item => this.customMessages[item.profileId] = item.messages);
                 this.defaultMessages = customMessagesData.defaultMessages || this.defaultMessages;
            }
            if (profilesData) {
                this.profiles = {};
                profilesData.forEach(profile => this.profiles[profile.id] = profile);
            }
        });
    },
    
    // НОВАЯ ФУНКЦИЯ: Обработка ожидающих свайпов из localStorage
    processPendingChatEvents: function() {
        if (!this.currentUser) return;

        let pendingEvents = Utils.Storage.get(this.pendingEventsKey, []);
        if (pendingEvents.length === 0) return;
        
        console.log(`[Global Service] Processing ${pendingEvents.length} pending swipes...`);

        const userSwipesKey = `userSwipes_${this.currentUser.id}`;
        const userSwipes = Utils.Storage.get(userSwipesKey, []);
        const initialRunKey = `initialMessagesScheduled_${this.currentUser.id}`;
        let scheduledMessages = Utils.Storage.get(this.scheduledMessagesKey, []);
        const profilesToSchedule = new Map();

        // Логика для первых 10 свайпов, выполняется один раз
        if (userSwipes.length >= 10 && !Utils.Storage.get(initialRunKey, false)) {
            console.log("[Global Service] Applying initial 10-swipe message logic.");
            const first10Swipes = userSwipes.slice(0, 10);
            const likes = first10Swipes.filter(s => s.action === 'like');
            const dislikes = first10Swipes.filter(s => s.action === 'dislike');
            
            let profilesToSelect = [];

            if (likes.length >= 8) { // Если 8 и более лайков
                profilesToSelect = Utils.Random.shuffle(likes).slice(0, 6);
            } else if (likes.length === 0) { // Если все дизлайки
                profilesToSelect = Utils.Random.shuffle(dislikes).slice(0, 4);
            } else { // Смешанные случаи (от 1 до 7 лайков)
                profilesToSelect = [
                    ...Utils.Random.shuffle(likes), // Все, кого лайкнули
                    ...Utils.Random.shuffle(dislikes).slice(0, Math.max(0, 4 - likes.length)) // Добираем до 4-х из дизлайков
                ];
            }
            
            profilesToSelect.forEach(swipeEvent => {
                 profilesToSchedule.set(swipeEvent.profileId, swipeEvent.profile);
            });

            Utils.Storage.set(initialRunKey, true);
        }

        // Логика для последующих свайпов
        pendingEvents.forEach(event => {
            if (userSwipes.length > 10) {
                 if (event.action === 'like' && Math.random() < 0.6) { // 60% шанс для лайка
                    profilesToSchedule.set(event.profileId, event.profile);
                }
                if (event.action === 'dislike' && Math.random() < 0.1) { // 10% шанс для дизлайка
                    profilesToSchedule.set(event.profileId, event.profile);
                }
            }
        });

        // Добавляем выбранные профили в очередь на отправку
        profilesToSchedule.forEach((profile, profileId) => {
            const alreadyScheduled = scheduledMessages.some(m => m.profileId === profileId);
            const allLikedProfiles = Utils.Storage.get(this.likedProfilesKey, []);
            const chatHistory = allLikedProfiles.find(p => p.id === profileId);
            const hasSentMessage = chatHistory && chatHistory.chatMessages && chatHistory.chatMessages.length > 0;

            if (!alreadyScheduled && !hasSentMessage) {
                 const delay = Utils.Random.int(10000, 120000); // от 10 секунд до 2 минут
                 const sendTimestamp = Date.now() + delay;
                 scheduledMessages.push({ profileId: profileId, timestamp: sendTimestamp });
                 console.log(`[Global Service] Scheduled message from ${profile.name} at ${new Date(sendTimestamp).toLocaleTimeString()}`);
            }
        });
        
        Utils.Storage.set(this.scheduledMessagesKey, scheduledMessages);
        Utils.Storage.set(this.pendingEventsKey, []); // Очищаем обработанные события
    },

    // НОВАЯ ФУНКЦИЯ: Проверка и "доставка" запланированных сообщений
    checkScheduledMessages: function() {
        if (!this.currentUser) return;
        let scheduledMessages = Utils.Storage.get(this.scheduledMessagesKey, []);
        const now = Date.now();
        const messagesToSend = scheduledMessages.filter(msg => now >= msg.timestamp);

        if (messagesToSend.length > 0) {
            console.log(`[Global Service] Found ${messagesToSend.length} messages to send.`);
            messagesToSend.forEach(msg => this.deliverSystemMessage(msg.profileId));
            const remainingMessages = scheduledMessages.filter(msg => !messagesToSend.some(sent => sent.profileId === msg.profileId));
            Utils.Storage.set(this.scheduledMessagesKey, remainingMessages);

            // Это событие может использоваться другими вкладками для обновления UI
            Utils.Storage.set('chat_storage_updated', Date.now());
        }
    },

    // НОВАЯ ФУНКЦИЯ: Логика создания и сохранения сообщения от девушки
    deliverSystemMessage: function(profileId) {
        const profile = this.profiles[profileId];
        if (!profile) {
            console.error(`[Global Service] Profile with ID ${profileId} not found.`);
            return;
        }

        let allLikedProfiles = Utils.Storage.get(this.likedProfilesKey, []);
        let targetProfile = allLikedProfiles.find(p => p.id == profileId);

        if (!targetProfile) {
            targetProfile = { ...profile, chatMessages: [] };
            allLikedProfiles.push(targetProfile);
        }

        if (targetProfile.chatMessages && targetProfile.chatMessages.some(m => m.sender === 'other')) {
            console.log(`[Global Service] Message from ${profile.name} already exists, delivery cancelled.`);
            return;
        }

        const profileMessages = this.customMessages[profile.id] || this.defaultMessages;
        const messageText = Utils.Random.choice(profileMessages);
        const replyMessage = {
            text: messageText,
            sender: 'other',
            timestamp: new Date().toISOString(),
            read: false
        };

        targetProfile.chatMessages = targetProfile.chatMessages || [];
        targetProfile.chatMessages.push(replyMessage);

        console.log(`[Global Service] Delivering message from ${profile.name}.`);
        Utils.Storage.set(this.likedProfilesKey, allLikedProfiles);

        this.updateNavigationBadges();
        this.addNotification(profile.id, `Nuovo messaggio da ${profile.name}`, 'new_message');
        Utils.Toast.success(`${profile.name} ti ha scritto!`);
    },
    
    // Остальной код AmoreApp без изменений...
    loadRegisteredUsers: function() {
        let users = Utils.Storage.get('registeredUsers', null);
        if (!users) {
            users = []; // Start with an empty array if none exist
            Utils.Storage.set('registeredUsers', users);
        }
        this.registeredUsers = users;
    },
    authenticateUser: function(email, password) {
        const user = this.registeredUsers.find(u => u.email === email && u.password === password);
        if (user) {
            const userCopy = { ...user };
            this.loginUser(userCopy);
            return true;
        }
        return false;
    },
    registerUser: function(userData) {
        if (this.registeredUsers.find(u => u.email === userData.email)) {
            return { success: false, message: 'Email già registrata' };
        }
        const newUser = {
            id: Date.now(),
            email: userData.email,
            password: userData.password,
            name: userData.name,
            role: "user",
            birthDate: userData.birthDate,
            city: userData.city || '',
            bio: userData.bio || '',
            interests: userData.interests || [],
            profileComplete: false,
            unlocked: false,
            swipeCount: 0,
            maxSwipes: 30,
            likesReceived: 0,
            matchCount: 0,
            createdAt: new Date().toISOString()
        };
        this.registeredUsers.push(newUser);
        Utils.Storage.set('registeredUsers', this.registeredUsers);
        return { success: true, user: newUser };
    },
    getCurrentUser: function() {
        return this.currentUser;
    },
    loginUser: function(user) {
        this.currentUser = user;
        Utils.Storage.set('currentUser', user);
        if (user.profileComplete) {
            if (user.unlocked) {
                const bottomNav = document.getElementById('bottom-nav');
                if (bottomNav) bottomNav.style.display = 'flex';
            }
            this.redirectToSwipes();
        } else {
            this.redirectToProfileSetup();
        }
    },
    completeProfile: function(profileData) {
        if (!this.currentUser) return;
        this.currentUser.aboutMe = profileData.aboutMe;
        this.currentUser.city = profileData.city;
        this.currentUser.interests = profileData.interests;
        this.currentUser.photo = profileData.photo;
        this.currentUser.profileComplete = true;
        Utils.Storage.set('currentUser', this.currentUser);
        const users = Utils.Storage.get('registeredUsers', []);
        const userIndex = users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = this.currentUser;
            Utils.Storage.set('registeredUsers', users);
        }
        Utils.Toast.success('Profilo completato con successo!');
        setTimeout(() => this.redirectToSwipes(), 1500);
    },
    addNotification: function(from, message, type) {
        const notificationsKey = `userNotifications_${this.currentUser.id}`;
        const notifications = Utils.Storage.get(notificationsKey, []);
        const notification = {
            id: Date.now(),
            from: from,
            message: message,
            type: type,
            timestamp: new Date().toISOString(),
            read: false
        };
        notifications.unshift(notification);
        if (notifications.length > 50) notifications.splice(50);
        Utils.Storage.set(notificationsKey, notifications);
        this.updateNavigationBadges();
    },
    markNotificationRead: function(notificationId) {
        const notificationsKey = `userNotifications_${this.currentUser.id}`;
        const notifications = Utils.Storage.get(notificationsKey, []);
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            Utils.Storage.set(notificationsKey, notifications);
            this.updateNavigationBadges();
        }
    },
    getUnreadChatCount: function() {
        if (!this.currentUser) return 0;
        const allLikedProfiles = Utils.Storage.get(this.likedProfilesKey, []);
        let unreadCount = 0;
        allLikedProfiles.forEach(profile => {
            if (profile.chatMessages && profile.chatMessages.length > 0) {
                unreadCount += profile.chatMessages.filter(msg => !msg.read && msg.sender === 'other').length;
            }
        });
        return unreadCount;
    },
    getUnreadNotificationCount: function() {
        if (!this.currentUser) return 0;
        const notificationsKey = `userNotifications_${this.currentUser.id}`;
        const notifications = Utils.Storage.get(notificationsKey, []);
        return notifications.filter(n => !n.read).length;
    },
    logout: function() {
        Utils.Storage.remove('currentUser');
        this.currentUser = null;
        window.location.href = '/index.html';
    },
    redirectToAuth: function() { window.location.href = '/auth/auth.html'; },
    redirectToProfileSetup: function() { window.location.href = '/profile/setup.html'; },
    redirectToSwipes: function() { window.location.href = '/swipes/swipes.html'; },
    redirectToDashboard: function() { window.location.href = '/dashboard/dashboard.html'; },
    setupGlobalListeners: function() {
        setInterval(() => this.updateNavigationBadges(), 5000);
    },
    updateNavigationBadges: function() {
        const chatBadges = document.querySelectorAll('#chat-badge, .nav-badge[id="chat-badge"]');
        const notificationBadges = document.querySelectorAll('#notification-badge, .nav-badge[id="notification-badge"]');
        const unreadChats = this.getUnreadChatCount();
        const unreadNotifications = this.getUnreadNotificationCount();
        chatBadges.forEach(badge => {
            if (unreadChats > 0) {
                badge.textContent = unreadChats;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
        notificationBadges.forEach(badge => {
            if (unreadNotifications > 0) {
                badge.textContent = unreadNotifications;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', function() {
    AmoreApp.init();
});
