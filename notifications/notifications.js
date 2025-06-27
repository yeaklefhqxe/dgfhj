// Notifications module for Amore Italiano
const NotificationsModule = {
    notifications: [],
    
    // Initialize notifications module
    init: function() {
        console.log('Initializing Notifications Module...');
        
        // Check if user is logged in and unlocked
        const currentUser = AmoreApp.getCurrentUser();
        if (!currentUser) {
            window.location.href = '../auth/auth.html';
            return;
        }
        
        if (!currentUser.unlocked) {
            window.location.href = '../swipes/swipes.html';
            return;
        }
        
        // Load notifications and initialize
        this.loadNotifications();
        this.setupEventListeners();
        this.updateBadges();

        // Добавляем слушатель для события 'storage', чтобы обновлять список уведомлений
        // при изменениях в localStorage из других вкладок или из фоновых процессов app.js
        window.addEventListener('storage', (event) => {
            if (event.key && event.key.startsWith('userNotifications_') && event.newValue !== event.oldValue) {
                console.log('Detected notification storage update. Refreshing notification list.');
                this.loadNotifications();
            }
        });
    },
    
    // Load notifications from storage
    loadNotifications: function() {
        // ИСПРАВЛЕНИЕ: Используем ключ, привязанный к ID пользователя, для загрузки уведомлений
        const currentUser = AmoreApp.getCurrentUser();
        if (currentUser) {
            const notificationsKey = `userNotifications_${currentUser.id}`;
            this.notifications = Utils.Storage.get(notificationsKey, []);
        } else {
            this.notifications = []; // Если пользователя нет, уведомлений тоже нет
        }
        this.renderNotifications();
    },
    
    // Render notifications list
    renderNotifications: function() {
        const notificationsList = document.getElementById('notifications-list');
        const noNotifications = document.getElementById('no-notifications');
        
        if (!notificationsList) return;
        
        if (this.notifications.length === 0) {
            notificationsList.style.display = 'none';
            noNotifications.style.display = 'flex';
            return;
        }
        
        notificationsList.style.display = 'block';
        noNotifications.style.display = 'none';
        notificationsList.innerHTML = '';
        
        // Сортируем уведомления по убыванию timestamp (новые сверху)
        const sortedNotifications = [...this.notifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        sortedNotifications.forEach(notification => {
            const notificationItem = this.createNotificationItem(notification);
            notificationsList.appendChild(notificationItem);
        });
    },
    
    // Create notification item element
    createNotificationItem: function(notification) {
        const item = document.createElement('div');
        item.className = `notification-item ${!notification.read ? 'unread' : ''}`;
        item.dataset.notificationId = notification.id;
        
        const iconClass = this.getNotificationIconClass(notification.type);
        const title = this.getNotificationTitle(notification.type);
        
        item.innerHTML = `
            <div class="notification-icon ${notification.type}">
                <i class="${iconClass}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${Utils.Date.formatRelative(notification.timestamp)}</div>
            </div>
            <div class="notification-meta">
                ${!notification.read ? '<div class="notification-unread-dot"></div>' : ''}
            </div>
        `;
        
        item.addEventListener('click', () => this.handleNotificationClick(notification));
        
        return item;
    },
    
    // Get notification icon class
    getNotificationIconClass: function(type) {
        switch (type) {
            case 'new_message':
                return 'fas fa-comment';
            case 'new_like':
                return 'fas fa-heart';
            case 'new_match':
                return 'fas fa-star';
            case 'system': // Добавляем системные уведомления, если они есть
                return 'fas fa-info-circle';
            default:
                return 'fas fa-bell';
        }
    },
    
    // Get notification title
    getNotificationTitle: function(type) {
        switch (type) {
            case 'new_message':
                return Translations.t('new_message');
            case 'new_like':
                return Translations.t('new_like');
            case 'new_match':
                return Translations.t('new_match');
            case 'system': // Добавляем перевод для системных уведомлений
                return Translations.t('system_notification_title') || 'Системное уведомление';
            default:
                return 'Notifica';
        }
    },
    
    // Handle notification click
    handleNotificationClick: function(notification) {
        // Mark as read
        this.markAsRead(notification.id);
        
        // Navigate based on notification type
        switch (notification.type) {
            case 'new_message':
                window.location.href = `../chats/chats.html?chatId=${notification.from}`; // Перенаправляем в чат с конкретным пользователем, если ID доступен
                break;
            case 'new_like':
            case 'new_match':
                window.location.href = '../chats/chats.html'; // Можно перенаправлять в чаты или на страницу профиля, где виден список лайков/матчей
                break;
            default:
                // Для системных уведомлений или других типов, остаемся на странице уведомлений
                break;
        }
    },
    
    // Mark notification as read
    markAsRead: function(notificationId) {
        AmoreApp.markNotificationRead(notificationId);
        // Вместо полной перезагрузки, просто обновляем текущее состояние модуля
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.renderNotifications(); // Перерисовываем, чтобы обновить статус "непрочитано"
        }
        this.updateBadges();
    },
    
    // Mark all notifications as read
    markAllAsRead: function() {
        // ИСПРАВЛЕНИЕ: Получаем актуальные уведомления, отмечаем прочитанными и сохраняем
        const currentUser = AmoreApp.getCurrentUser();
        if (!currentUser) return;
        const notificationsKey = `userNotifications_${currentUser.id}`;
        let currentNotifications = Utils.Storage.get(notificationsKey, []);

        currentNotifications.forEach(notification => {
            notification.read = true;
        });
        
        Utils.Storage.set(notificationsKey, currentNotifications);
        this.notifications = currentNotifications; // Обновляем локальный массив модуля
        this.renderNotifications();
        this.updateBadges();
        
        Utils.Toast.success(Translations.t('mark_all_read_success') || 'Все уведомления помечены как прочитанные!');
    },
    
    // Refresh notifications
    refreshNotifications: function() {
        this.loadNotifications();
        this.updateBadges();
        Utils.Toast.success(Translations.t('notifications_updated') || 'Уведомления обновлены!');
    },
    
    // Update notification badges
    updateBadges: function() {
        const chatBadge = document.getElementById('chat-badge');
        const notificationBadge = document.getElementById('notification-badge');
        
        const unreadChats = AmoreApp.getUnreadChatCount();
        const unreadNotifications = AmoreApp.getUnreadNotificationCount();
        
        if (chatBadge) {
            if (unreadChats > 0) {
                chatBadge.textContent = unreadChats;
                chatBadge.style.display = 'flex';
            } else {
                chatBadge.style.display = 'none';
            }
        }
        
        if (notificationBadge) {
            if (unreadNotifications > 0) {
                notificationBadge.textContent = unreadNotifications;
                notificationBadge.style.display = 'flex';
            } else {
                notificationBadge.style.display = 'none';
            }
        }
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Update badges periodically
        setInterval(() => {
            this.updateBadges();
        }, 5000);
        
        // Refresh notifications periodically
        // Увеличиваем интервал, так как теперь есть слушатель 'storage'
        setInterval(() => {
            this.loadNotifications();
        }, 60000); // Например, раз в минуту, чтобы ловить внешние изменения
    }
};

// Global functions (доступные из HTML)
function markAllAsRead() {
    NotificationsModule.markAllAsRead();
}

function refreshNotifications() {
    NotificationsModule.refreshNotifications();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    NotificationsModule.init();
});
