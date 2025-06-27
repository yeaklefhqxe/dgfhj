// swipes.js - Исправленный код с добавлением likedProfiles и проверки maxSwipes
const SwipesModule = {
    profiles: [],
    currentProfileIndex: 0,
    isDragging: false,
    startX: 0,
    currentCardElement: null,

    init: function() {
        console.log('Initializing Swipes Module...');

        const currentUser = AmoreApp.getCurrentUser();
        if (!currentUser) {
            window.location.href = '../auth/auth.html';
            return;
        }

        if (!currentUser.profileComplete) {
            window.location.href = '../profile/setup.html';
            return;
        }

        this.loadProfiles();
        this.setupEventListeners();
    },

    loadProfiles: function() {
        this.showLoading();

        fetch('../shared/data/profiles.json')
            .then(response => response.json())
            .then(data => {
                const currentUser = AmoreApp.getCurrentUser();
                const swipedProfileIdsKey = `swipedProfileIds_${currentUser.id}`;
                const swipedProfileIds = Utils.Storage.get(swipedProfileIdsKey, []);

                const availableProfiles = data.filter(profile =>
                    !swipedProfileIds.includes(profile.id)
                );

                this.profiles = Utils.Random.shuffle(availableProfiles);
                this.hideLoading();

                const allProfilesExhaustedKey = `allProfilesExhausted_${currentUser.id}`;
                // Проверяем, были ли все профили исчерпаны ранее ИЛИ если сейчас нет доступных профилей
                if (Utils.Storage.get(allProfilesExhaustedKey, false) || this.profiles.length === 0) {
                    this.showNoProfiles(); // Показываем сообщение, что профилей больше нет
                    Utils.Storage.set(allProfilesExhaustedKey, true); // Устанавливаем флаг, что все профили исчерпаны
                } else {
                    // Если лимит свайпов достигнут, но профили еще есть, показываем сообщение о лимите
                    if (currentUser.swipeCount >= currentUser.maxSwipes) {
                        this.showSwipeLimit();
                    } else {
                        this.renderProfileCard(); // Иначе рендерим следующую карточку
                    }
                }
            })
            .catch(error => {
                console.error('Error loading profiles:', error);
                this.hideLoading();
                Utils.Toast.error('Ошибка при загрузке профилей');
            });
    },

    renderProfileCard: function() {
        const container = document.getElementById('card-stack');
        if (!container) return;

        container.innerHTML = '';
        this.currentCardElement = null;

        const currentProfile = this.profiles[this.currentProfileIndex];
        const currentUser = AmoreApp.getCurrentUser();
        const allProfilesExhaustedKey = `allProfilesExhausted_${currentUser.id}`;
        const allProfilesExhausted = Utils.Storage.get(allProfilesExhaustedKey, false);

        // Если все профили исчерпаны или текущего профиля нет, показываем сообщение "нет профилей"
        if (allProfilesExhausted || !currentProfile) {
            this.showNoProfiles();
            return;
        }

        // Если текущий пользователь достиг лимита свайпов, показываем сообщение о лимите
        if (currentUser.swipeCount >= currentUser.maxSwipes) {
            this.showSwipeLimit();
            return;
        }


        const card = document.createElement('div');
        card.className = 'profile-card';
        card.innerHTML = `
            <div class="profile-image">
                <img src="../shared/images/profiles/${currentProfile.id}.jpg" alt="${currentProfile.name}" onerror="this.src='https://placehold.co/380x420/FF7E5F/FFFFFF?text=No+Image'">
            </div>
            <div class="profile-info">
                <div class="profile-name">${currentProfile.name}</div>
                <div class="profile-age">${currentProfile.age} anni</div>
                <div class="profile-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${currentProfile.city || 'Sconosciuta'}</span>
                </div>
                <div class="profile-bio">${currentProfile.bio}</div>
            </div>
        `;

        container.appendChild(card);
        this.currentCardElement = card;

        card.addEventListener('mousedown', this.dragStart.bind(this));
        card.addEventListener('mousemove', this.dragMove.bind(this));
        card.addEventListener('mouseup', this.dragEnd.bind(this));
        card.addEventListener('mouseleave', this.dragEnd.bind(this));

        card.addEventListener('touchstart', this.dragStart.bind(this));
        card.addEventListener('touchmove', this.dragMove.bind(this));
        card.addEventListener('touchend', this.dragEnd.bind(this));

        const actionButtons = document.getElementById('action-buttons');
        if (actionButtons) {
            actionButtons.style.display = 'flex';
        }

        // Убедитесь, что индикаторы отображаются при рендеринге карточки
        document.querySelector('.swipe-indicator-left').style.display = 'flex';
        document.querySelector('.swipe-indicator-right').style.display = 'flex';
    },

    dragStart: function(e) {
        this.isDragging = true;
        this.startX = e.touches ? e.touches[0].clientX : e.clientX;
        if (this.currentCardElement) {
            this.currentCardElement.style.transition = 'none';
            this.currentCardElement.classList.add('dragging');
        }
        e.preventDefault();
    },

    dragMove: function(e) {
        if (!this.isDragging) return;

        const x = e.touches ? e.touches[0].clientX : e.clientX;
        const deltaX = x - this.startX;

        if (this.currentCardElement) {
            this.currentCardElement.style.transform = `translateX(${deltaX}px) rotate(${deltaX / 20}deg)`;
        }
    },

    dragEnd: function(e) {
        if (!this.isDragging) return;
        this.isDragging = false;

        if (!this.currentCardElement) return;

        this.currentCardElement.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
        this.currentCardElement.classList.remove('dragging');

        const deltaX = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX) - this.startX;
        const threshold = this.currentCardElement.offsetWidth / 4;

        if (deltaX > threshold) {
            this.handleSwipe('like');
        } else if (deltaX < -threshold) {
            this.handleSwipe('dislike');
        } else {
            this.currentCardElement.style.transform = '';
            this.currentCardElement.style.opacity = 1;
        }
    },

    handleSwipe: function(action) {
        const currentProfile = this.profiles[this.currentProfileIndex];
        if (!currentProfile) {
             // Если нет текущего профиля, значит все профили уже исчерпаны
            this.showNoProfiles();
            return;
        }

        const currentUser = AmoreApp.getCurrentUser();

        if (currentUser.swipeCount >= currentUser.maxSwipes) {
            Utils.Toast.error('Hai raggiunto il limite giornaliero di swipe!');
            this.showSwipeLimit();
            return;
        }

        const swipedProfileIdsKey = `swipedProfileIds_${currentUser.id}`;
        let swipedProfileIds = Utils.Storage.get(swipedProfileIdsKey, []);
        if (!swipedProfileIds.includes(currentProfile.id)) {
            swipedProfileIds.push(currentProfile.id);
            Utils.Storage.set(swipedProfileIdsKey, swipedProfileIds);
        }

        currentUser.swipeCount = (currentUser.swipeCount || 0) + 1;
        Utils.Storage.set("currentUser", currentUser);
        this.updateSwipeCounter();

        const userSwipesKey = `userSwipes_${currentUser.id}`;
        let userSwipes = Utils.Storage.get(userSwipesKey, []);
        userSwipes.push({
            profileId: currentProfile.id,
            action: action,
            profile: currentProfile,
            timestamp: new Date().toISOString()
        });
        Utils.Storage.set(userSwipesKey, userSwipes);

        // ИЗМЕНЕНО: Логика добавления в likedProfiles полностью удалена отсюда.
        // Теперь этим будет заниматься chats.js при получении первого сообщения.

        const pendingChatEventsKey = `pendingChatEvents_${currentUser.id}`;
        let pendingEvents = Utils.Storage.get(pendingChatEventsKey, []);
        pendingEvents.push({
            profileId: currentProfile.id,
            action: action,
            profile: currentProfile,
            timestamp: new Date().toISOString()
        });
        Utils.Storage.set(pendingChatEventsKey, pendingEvents);

        if (this.currentCardElement) {
            const directionClass = action === 'like' ? 'swipe-right' : 'swipe-left';
            this.currentCardElement.classList.add(directionClass);

            setTimeout(() => {
                if (action === 'like') {
                    Utils.Toast.success(`Ti è piaciuto ${currentProfile.name}!`);
                } else {
                    Utils.Toast.info('Profilo scartato');
                }

                this.currentProfileIndex++;
                if (this.currentProfileIndex >= this.profiles.length) {
                    this.showNoProfiles(); // Если профили закончились, показываем это сообщение
                    const allProfilesExhaustedKey = `allProfilesExhausted_${currentUser.id}`;
                    Utils.Storage.set(allProfilesExhaustedKey, true); // Устанавливаем флаг
                } else {
                    // Проверяем лимит свайпов перед рендерингом следующей карточки
                    if (currentUser.swipeCount >= currentUser.maxSwipes) {
                        this.showSwipeLimit();
                    } else {
                        this.renderProfileCard();
                    }
                }
            }, 400);
        }

        this.updateNavigationBarState();
    },

    setupEventListeners: function() {
        const likeBtn = document.querySelector("[data-action='like']");
        if (likeBtn) {
            likeBtn.addEventListener("click", () => this.handleSwipe("like"));
        }

        const dislikeBtn = document.querySelector("[data-action='dislike']");
        if (dislikeBtn) {
            dislikeBtn.addEventListener("click", () => this.handleSwipe("dislike"));
        }

        this.updateNavigationBarState();
    },

    updateNavigationBarState: function() {
        const currentUser = AmoreApp.getCurrentUser();
        const bottomNav = document.getElementById("bottom-nav");
        if (!bottomNav) return;

        const navItems = bottomNav.querySelectorAll('.nav-item');

        if (currentUser.swipeCount < 10) { // Здесь 10 — это примерное число свайпов, после которого разблокируется навигация.
                                          // В вашем коде это условие проверяет разблокировку навигации.
            bottomNav.classList.add("locked");
            navItems.forEach(item => {
                item.style.pointerEvents = "none";
                item.style.opacity = "0.5";
                item.setAttribute('tabindex', '-1');
            });
            const unlockModal = document.getElementById('unlock-modal');
            if (unlockModal) {
                unlockModal.style.display = 'none';
            }
        } else {
            bottomNav.classList.remove("locked");
            navItems.forEach(item => {
                item.style.pointerEvents = "auto";
                item.style.opacity = "1";
                item.removeAttribute('tabindex');
            });
            if (!currentUser.unlocked) {
                const unlockModal = document.getElementById('unlock-modal');
                if (unlockModal) {
                    unlockModal.style.display = 'flex';
                    AmoreApp.currentUser.unlocked = true;
                    Utils.Storage.set('currentUser', AmoreApp.currentUser);
                    AmoreApp.addNotification(0, Translations.t('unlock_full_features'), 'system');
                }
            }
        }
    },

    showNoProfiles: function() {
        const cardStack = document.getElementById("card-stack");
        const noProfilesMessage = document.getElementById("no-profiles");
        const actionButtons = document.getElementById("action-buttons"); // Этого элемента нет в swipes.html, но он мог быть раньше
        const swipeLimitMessage = document.getElementById("swipe-limit");

        // Новые элементы для скрытия
        const swipeIndicatorLeft = document.querySelector('.swipe-indicator-left');
        const swipeIndicatorRight = document.querySelector('.swipe-indicator-right');

        if (cardStack) cardStack.innerHTML = "";
        if (cardStack) cardStack.style.display = "none";
        if (actionButtons) actionButtons.style.display = "none"; // Если этот элемент существует
        if (swipeLimitMessage) swipeLimitMessage.style.display = "none";

        // Скрыть кнопки-индикаторы
        if (swipeIndicatorLeft) swipeIndicatorLeft.style.display = "none";
        if (swipeIndicatorRight) swipeIndicatorRight.style.display = "none";

        if (noProfilesMessage) noProfilesMessage.style.display = "flex";
    },

    showSwipeLimit: function() {
        const cardStack = document.getElementById("card-stack");
        const noProfilesMessage = document.getElementById("no-profiles");
        const actionButtons = document.getElementById("action-buttons"); // Этого элемента нет в swipes.html, но он мог быть раньше
        const swipeLimitMessage = document.getElementById("swipe-limit");

        // Новые элементы для скрытия
        const swipeIndicatorLeft = document.querySelector('.swipe-indicator-left');
        const swipeIndicatorRight = document.querySelector('.swipe-indicator-right');

        if (cardStack) cardStack.innerHTML = "";
        if (cardStack) cardStack.style.display = "none";
        if (actionButtons) actionButtons.style.display = "none"; // Если этот элемент существует
        if (noProfilesMessage) noProfilesMessage.style.display = "none";

        // Скрыть кнопки-индикаторы
        if (swipeIndicatorLeft) swipeIndicatorLeft.style.display = "none";
        if (swipeIndicatorRight) swipeIndicatorRight.style.display = "none";

        if (swipeLimitMessage) swipeLimitMessage.style.display = "flex";
    },

    showLoading: function() {
        const loadingOverlay = document.getElementById("loading-overlay");
        if (loadingOverlay) {
            loadingOverlay.style.display = "flex";
        }
    },

    hideLoading: function() {
        const loadingOverlay = document.getElementById("loading-overlay");
        if (loadingOverlay) {
            loadingOverlay.style.display = "none";
        }
    },

    updateSwipeCounter: function() {
        const currentUser = AmoreApp.getCurrentUser();
        const swipeCountElement = document.getElementById("swipe-count");
        const maxSwipesElement = document.getElementById("max-swipes");
        const swipeCounterDiv = document.querySelector(".swipe-counter");

        if (swipeCountElement && maxSwipesElement && swipeCounterDiv) {
            swipeCountElement.textContent = currentUser.swipeCount;
            maxSwipesElement.textContent = currentUser.maxSwipes;
            const allProfilesExhaustedKey = `allProfilesExhausted_${currentUser.id}`;
            const allProfilesExhausted = Utils.Storage.get(allProfilesExhaustedKey, false);
            if (!allProfilesExhausted && currentUser.swipeCount < currentUser.maxSwipes) {
                swipeCounterDiv.style.display = "flex";
            } else {
                swipeCounterDiv.style.display = "none";
            }
        }
    },
};

function goToDashboard() {
        window.location.href = '../chats/chats.html';
}

function closeUnlockModal() {
    const unlockModal = document.getElementById('unlock-modal');
    if (unlockModal) {
        unlockModal.style.display = 'none';
        window.location.href = '../chats/chats.html';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    SwipesModule.init();
});
