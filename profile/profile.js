// Profile module for Amore Italiano
const ProfileModule = {
    currentUser: null,
    selectedCity: '', // Для setup.html
    selectedInterests: [], // Для setup.html и edit.html
    currentStep: 1,
    availableInterests: [
        'Viaggi', 'Cucina', 'Sport', 'Musica', 'Cinema', 'Arte',
        'Lettura', 'Fotografia', 'Danza', 'Yoga', 'Fitness', 'Natura'
    ],

    // Initialize profile module
    init: function() {
        console.log('Initializing Profile Module...');

        // Check if user is logged in
        this.currentUser = AmoreApp.getCurrentUser();
        if (!this.currentUser) {
            window.location.href = '../auth/auth.html';
            return;
        }

        // Load profile data (for profile.html)
        this.loadProfileData();
        this.setupEventListeners();
        this.updateBadges();

        // Initialize setup page if we're on it
        if (window.location.pathname.includes('setup.html')) {
            this.initSetupPage();
        }
    },

    // Initialize setup page
    initSetupPage: function() {
        this.loadCitiesSetup(); // Загрузка городов для setup.html
        this.loadInterestsSetup();
        this.updateProgress();
        // Set up photo input listener for setup page
        const photoInputSetup = document.getElementById('photo-input-setup');
        if (photoInputSetup) {
            photoInputSetup.addEventListener('change', this.handlePhotoChangeSetup.bind(this));
        }
        // Load existing photo if available on setup page
        this.loadPhotoPreviewSetup();
    },

    // Load cities for setup.html
    loadCitiesSetup: function() {
        const cityInput = document.getElementById('city-input');
        const cityDropdown = document.getElementById('city-dropdown');

        if (!cityInput || !cityDropdown) return;

        const cities = ['Milano', 'Roma', 'Napoli', 'Torino', 'Firenze', 'Bologna', 'Venezia', 'Palermo', 'Genova', 'Bari'];

        // Initially populate selectedCity if already set in currentUser
        if (this.currentUser.city) {
            cityInput.value = this.currentUser.city;
            this.selectedCity = this.currentUser.city;
        }

        // Handle input event for filtering cities
        cityInput.addEventListener('input', (e) => {
            const value = e.target.value.toLowerCase();
            const filtered = cities.filter(city => city.toLowerCase().startsWith(value)); // Фильтрация по первой букве

            cityDropdown.innerHTML = '';
            if (value && filtered.length > 0) {
                cityDropdown.classList.add('active'); // Add active class to show dropdown
                filtered.forEach(city => {
                    const option = document.createElement('div');
                    option.className = 'city-option';
                    option.textContent = city;
                    option.onclick = () => {
                        cityInput.value = city;
                        this.selectedCity = city;
                        cityDropdown.classList.remove('active'); // Hide dropdown after selection
                    };
                    cityDropdown.appendChild(option);
                });
            } else {
                cityDropdown.classList.remove('active'); // Hide dropdown if no input or no matches
            }
        });

        // Handle click on input to show all cities if empty
        cityInput.addEventListener('click', () => {
            // If the input is empty, show all cities. If not, the 'input' event listener handles filtering.
            if (cityInput.value.trim() === '') {
                cityDropdown.innerHTML = '';
                cities.forEach(city => {
                    const option = document.createElement('div');
                    option.className = 'city-option';
                    option.textContent = city;
                    option.onclick = () => {
                        cityInput.value = city;
                        this.selectedCity = city;
                        cityDropdown.classList.remove('active');
                    };
                    cityDropdown.appendChild(option);
                });
                cityDropdown.classList.add('active');
            }
        });


        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!cityInput.contains(e.target) && !cityDropdown.contains(e.target)) {
                cityDropdown.classList.remove('active');
            }
        });
    },

    // Load interests for setup.html
    loadInterestsSetup: function() {
        const container = document.getElementById('interests-container');
        if (!container) return;

        container.innerHTML = '';
        this.selectedInterests = this.currentUser.interests ? [...this.currentUser.interests] : []; // Инициализируем из текущего пользователя

        this.availableInterests.forEach(interest => {
            const tag = document.createElement('div');
            tag.className = 'interest-tag';
            tag.textContent = interest;
            // Check if interest is already selected by the current user
            if (this.selectedInterests.includes(interest)) {
                tag.classList.add('selected');
            }
            tag.onclick = () => this.toggleInterest(interest, tag);
            container.appendChild(tag);
        });
    },

    // Toggle interest selection (used by setup.html and edit modal)
    toggleInterest: function(interest, element) {
        const index = this.selectedInterests.indexOf(interest);
        if (index > -1) {
            this.selectedInterests.splice(index, 1);
            element.classList.remove('selected');
        } else {
            this.selectedInterests.push(interest);
            element.classList.add('selected');
        }
        console.log("Selected interests:", this.selectedInterests);
    },

    // Update progress bar
    updateProgress: function() {
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            const progress = (this.currentStep / 2) * 100;
            progressFill.style.width = progress + '%';
        }
    },

    // Load profile data for profile.html
    loadProfileData: function() {
        // Update profile display with null checks
        const nameEl = document.getElementById('profile-name');
        const emailEl = document.getElementById('profile-email');
        const cityEl = document.getElementById('profile-city');
        const bioEl = document.getElementById('profile-bio');
        const ageEl = document.getElementById('profile-age');

        if (nameEl && this.currentUser) nameEl.textContent = this.currentUser.name || 'Nome non disponibile';
        if (emailEl && this.currentUser) emailEl.textContent = this.currentUser.email || 'Email non disponibile';
        if (cityEl && this.currentUser) cityEl.textContent = this.currentUser.city || 'Città non specificata';
        if (bioEl && this.currentUser) bioEl.textContent = this.currentUser.bio || 'Descrizione non disponibile';

        // Calculate age using Utils.Date.formatAge
        if (this.currentUser && this.currentUser.birthDate && ageEl) {
            const age = Utils.Date.formatAge(this.currentUser.birthDate); // Corrected function call
            ageEl.textContent = age > 0 ? `${age} anni` : 'Età non disponibile';
        }

        // Load interests
        this.loadInterests();

        // Load stats
        this.loadStats();

        // Load profile photo
        this.loadProfilePhoto();
    },

    // Load interests for profile.html
    loadInterests: function() {
        const interestsContainer = document.querySelector('.interests-list');
        if (!interestsContainer) return;

        interestsContainer.innerHTML = '';

        if (this.currentUser.interests && this.currentUser.interests.length > 0) {
            this.currentUser.interests.forEach(interest => {
                const tag = document.createElement('span');
                tag.className = 'interest-tag';
                tag.textContent = interest;
                interestsContainer.appendChild(tag);
            });
        } else {
            interestsContainer.innerHTML = '<span class="no-interests" data-translate="no_interests">Nessun interesse selezionato</span>';
        }
        Translations.updatePageTexts(); // Corrected function call
    },

    // Load stats for profile.html
    loadStats: function() {
        const likesEl = document.getElementById('likes-count');
        const matchesEl = document.getElementById('matches-count');
        const swipesEl = document.getElementById('swipes-count');

        if (likesEl) likesEl.textContent = this.currentUser.likesReceived || 0;
        if (matchesEl) matchesEl.textContent = this.currentUser.matchCount || 0;
        if (swipesEl) swipesEl.textContent = this.currentUser.swipeCount || 0;
    },

    // Load profile photo for profile.html
    loadProfilePhoto: function() {
        const photoElement = document.getElementById('profile-photo');
        if (photoElement) {
            if (this.currentUser.profilePhoto) {
                photoElement.src = this.currentUser.profilePhoto;
            } else {
                photoElement.src = '../shared/images/default-avatar.jpg';
            }
        }
    },

    // Load photo preview for setup.html
    loadPhotoPreviewSetup: function() {
        const photoPreview = document.getElementById('photo-preview');
        const photoPlaceholder = photoPreview ? photoPreview.querySelector('.photo-placeholder') : null;
        if (photoPreview && photoPlaceholder) {
            if (this.currentUser.profilePhoto) {
                photoPreview.innerHTML = `<img src="${this.currentUser.profilePhoto}" alt="Profile Photo">`;
            } else {
                photoPreview.innerHTML = `
                    <div class="photo-placeholder">
                        <i class="fas fa-camera"></i>
                        <span data-translate="profile_photo">Foto Profilo</span>
                    </div>
                `;
            }
            Translations.updatePageTexts(); // Corrected function call
        }
    },

    // Setup event listeners
    setupEventListeners: function() {
        // Update badges periodically
        setInterval(() => {
            this.updateBadges();
        }, 5000);
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
    }
};

// Global functions for profile.html
function editProfile() {
    // Populate edit form
    document.getElementById('edit-name').value = ProfileModule.currentUser.name || '';
    document.getElementById('edit-bio').value = ProfileModule.currentUser.bio || '';

    // Load cities for edit modal
    loadCitiesEdit();
    // Set current city in the input field after loading cities options
    const editCityInput = document.getElementById('edit-city');
    if (editCityInput && ProfileModule.currentUser.city) {
        editCityInput.value = ProfileModule.currentUser.city;
    }

    // Load interests tags for edit modal
    loadEditInterests();

    // Show modal
    document.getElementById('edit-modal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.remove('active');
}

// Load cities for edit modal (similar to setup but for a different ID)
function loadCitiesEdit() {
    const cityInput = document.getElementById('edit-city');
    const cityDropdown = document.getElementById('edit-city-dropdown');

    if (!cityInput || !cityDropdown) return;

    const cities = ['Milano', 'Roma', 'Napoli', 'Torino', 'Firenze', 'Bologna', 'Venezia', 'Palermo', 'Genova', 'Bari'];

    // Handle input event for filtering cities
    cityInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase();
        const filtered = cities.filter(city => city.toLowerCase().startsWith(value)); // Фильтрация по первой букве

        cityDropdown.innerHTML = '';
        if (value && filtered.length > 0) {
            cityDropdown.classList.add('active'); // Add active class to show dropdown
            filtered.forEach(city => {
                const option = document.createElement('div');
                option.className = 'city-option';
                option.textContent = city;
                option.onclick = () => {
                    cityInput.value = city;
                    cityDropdown.classList.remove('active'); // Hide dropdown after selection
                };
                cityDropdown.appendChild(option);
            });
        } else {
            cityDropdown.classList.remove('active'); // Hide dropdown if no input or no matches
        }
    });

    // Handle click on input to show all cities if empty
    cityInput.addEventListener('click', () => {
        if (cityInput.value.trim() === '') {
            cityDropdown.innerHTML = '';
            cities.forEach(city => {
                const option = document.createElement('div');
                option.className = 'city-option';
                option.textContent = city;
                option.onclick = () => {
                    cityInput.value = city;
                    cityDropdown.classList.remove('active');
                };
                cityDropdown.appendChild(option);
            });
            cityDropdown.classList.add('active');
        }
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!cityInput.contains(e.target) && !cityDropdown.contains(e.target)) {
            cityDropdown.classList.remove('active');
        }
    });
}

function loadEditInterests() {
    const container = document.getElementById('edit-interests');
    if (!container) return; // Ensure container exists

    container.innerHTML = '';
    // Инициализируем ProfileModule.selectedInterests для модального окна из currentUser
    ProfileModule.selectedInterests = ProfileModule.currentUser.interests ? [...ProfileModule.currentUser.interests] : [];

    ProfileModule.availableInterests.forEach(interest => {
        const tag = document.createElement('div'); // Используем div, как на setup.html
        tag.className = 'interest-tag-edit'; // Используем новый класс для стилей
        tag.textContent = interest;
        
        // Проверяем, выбран ли интерес
        if (ProfileModule.selectedInterests.includes(interest)) {
            tag.classList.add('selected');
        }

        tag.onclick = () => {
            // Используем ту же логику toggleInterest
            const index = ProfileModule.selectedInterests.indexOf(interest);
            if (index > -1) {
                ProfileModule.selectedInterests.splice(index, 1);
                tag.classList.remove('selected');
            } else {
                ProfileModule.selectedInterests.push(interest);
                tag.classList.add('selected');
            }
            console.log("Selected interests (edit modal):", ProfileModule.selectedInterests);
        };
        container.appendChild(tag);
    });
    Translations.updatePageTexts(); // Corrected function call
}


function saveProfile() {
    try {
        const nameEl = document.getElementById('edit-name');
        const bioEl = document.getElementById('edit-bio');
        const cityEl = document.getElementById('edit-city'); // Теперь это input

        if (!nameEl || !bioEl || !cityEl) {
            console.error('Required form elements not found');
            Utils.Toast.error('Errore nel form. Riprova.');
            return;
        }

        const name = nameEl.value.trim();
        const bio = bioEl.value.trim();
        const city = cityEl.value.trim(); // Получаем значение из input

        // Validate
        if (!Utils.Validation.name(name)) { // Using Utils.Validation
            Utils.Toast.error('Il nome deve essere di almeno 2 caratteri');
            return;
        }

        if (bio.length < 5) {
            Utils.Toast.error('La descrizione deve essere di almeno 5 caratteri');
            return;
        }

        if (!city) {
            Utils.Toast.error('Seleziona una città');
            return;
        }

        // Selected interests are already managed by ProfileModule.selectedInterests
        const selectedInterests = ProfileModule.selectedInterests;

        // Update user data
        if (ProfileModule.currentUser) {
            ProfileModule.currentUser.name = name;
            ProfileModule.currentUser.bio = bio;
            ProfileModule.currentUser.city = city;
            ProfileModule.currentUser.interests = selectedInterests; // Используем обновленный массив

            // Save to storage
            Utils.Storage.set('currentUser', ProfileModule.currentUser);

            // Update registeredUsers in AmoreApp
            const registeredUsers = AmoreApp.registeredUsers;
            const userIndex = registeredUsers.findIndex(u => u.id === ProfileModule.currentUser.id);
            if (userIndex !== -1) {
                registeredUsers[userIndex] = ProfileModule.currentUser;
                Utils.Storage.set('registeredUsers', registeredUsers); // Update global list
            }

            // Update display
            ProfileModule.loadProfileData();

            // Close modal
            closeEditModal();

            Utils.Toast.success('Profilo aggiornato con successo!');
        } else {
            throw new Error('Current user not found');
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        Utils.Toast.error('Si è verificato un errore. Riprova.');
    }
}

function changePhoto() {
    document.getElementById('photo-input').click();
}

function handlePhotoChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        Utils.Toast.error('Seleziona un file immagine valido');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        Utils.Toast.error('L\'immagine deve essere inferiore a 5MB');
        return;
    }

    // Create file reader
    const reader = new FileReader();
    reader.onload = function(e) {
        const photoUrl = e.target.result;

        // Update user data
        if (ProfileModule.currentUser) {
            ProfileModule.currentUser.profilePhoto = photoUrl;
            Utils.Storage.set('currentUser', ProfileModule.currentUser);

            // Update registeredUsers in AmoreApp
            const registeredUsers = AmoreApp.registeredUsers;
            const userIndex = registeredUsers.findIndex(u => u.id === ProfileModule.currentUser.id);
            if (userIndex !== -1) {
                registeredUsers[userIndex].profilePhoto = photoUrl;
                Utils.Storage.set('registeredUsers', registeredUsers); // Update global list
            }

            // Update display
            document.getElementById('profile-photo').src = photoUrl;
            // Убрано уведомление об успешной загрузке/обновлении фото
            // Utils.Toast.success('Foto profilo aggiornata!');
        }
    };

    reader.readAsDataURL(file);
}

// Global functions for setup.html
function nextStep() {
    const aboutMe = document.getElementById('about-me');
    const cityInput = document.getElementById('city-input');

    if (!aboutMe || !cityInput) {
        console.error('Required elements not found for nextStep');
        return;
    }

    if (!aboutMe.value.trim()) {
        Utils.Toast.error('Inserisci una descrizione');
        return;
    }

    // Проверяем, что город выбран из списка или введен
    if (!cityInput.value.trim() || ProfileModule.selectedCity === '') {
        Utils.Toast.error('Seleziona una città');
        return;
    }

    // Save data to current user
    if (ProfileModule.currentUser) {
        ProfileModule.currentUser.bio = aboutMe.value.trim();
        ProfileModule.currentUser.city = ProfileModule.selectedCity; // Используем selectedCity из модуля
        ProfileModule.currentUser.interests = ProfileModule.selectedInterests;
        Utils.Storage.set('currentUser', ProfileModule.currentUser);
    }

    // Move to next step
    ProfileModule.currentStep = 2;
    ProfileModule.updateProgress();

    // Hide step 1, show step 2
    document.getElementById('step-1').classList.remove('active');
    document.getElementById('step-2').classList.add('active');
    Translations.updatePageTexts(); // Corrected function call
}

// Function for setup.html previous step
function prevStep() {
    if (ProfileModule.currentStep > 1) {
        ProfileModule.currentStep--;
        ProfileModule.updateProgress();

        // Hide current step, show previous
        document.getElementById('step-2').classList.remove('active');
        document.getElementById('step-1').classList.add('active');
        Translations.updatePageTexts(); // Corrected function call
    }
}

// Function for setup.html complete profile
function completeProfile() {
    if (ProfileModule.currentUser) {
        // Ensure profilePhoto is set, if not, use default behavior
        if (!ProfileModule.currentUser.profilePhoto) {
            ProfileModule.currentUser.profilePhoto = '../shared/images/default-avatar.jpg';
        }

        ProfileModule.currentUser.profileComplete = true;
        ProfileModule.currentUser.unlocked = true; // Unlock all features
        Utils.Storage.set('currentUser', ProfileModule.currentUser);

        // Update registeredUsers in AmoreApp
        const registeredUsers = AmoreApp.registeredUsers;
        const userIndex = registeredUsers.findIndex(u => u.id === ProfileModule.currentUser.id);
        if (userIndex !== -1) {
            registeredUsers[userIndex] = ProfileModule.currentUser;
            Utils.Storage.set('registeredUsers', registeredUsers); // Update global list
        }

        Utils.Toast.success('Profilo completato e funzionalità sbloccate!');
        setTimeout(() => {
            window.location.href = '../swipes/swipes.html';
        }, 1500); // Give time for toast to show
    }
}

// Function for setup.html select photo
function selectPhoto() {
    const photoInput = document.getElementById('photo-input-setup'); // Use a specific ID for setup photo input
    if (photoInput) {
        photoInput.click();
    }
}

// Handle photo change for setup.html
ProfileModule.handlePhotoChangeSetup = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        Utils.Toast.error('Seleziona un file immagine valido');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        Utils.Toast.error('L\'immagine deve essere inferiore a 5MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const photoUrl = e.target.result;
        if (this.currentUser) {
            this.currentUser.profilePhoto = photoUrl;
            Utils.Storage.set('currentUser', this.currentUser);
            this.loadPhotoPreviewSetup(); // Update preview
            // Убрано уведомление об успешной загрузке фото
            // Utils.Toast.success('Foto profilo caricata!');
        }
    };
    reader.readAsDataURL(file);
};


// Function for setup.html skip photo
function skipPhoto() {
    completeProfile();
}

function showSettings() {
    window.location.href = '../settings/settings.html';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    ProfileModule.init();
});
