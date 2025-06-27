const SettingsModule = {
    // Initialize settings module
    init: function() {
        console.log('Initializing Settings Module...');
        
        // Check if user is logged in
        const currentUser = AmoreApp.getCurrentUser();
        if (!currentUser) {
            window.location.href = '../auth/auth.html';
            return;
        }
        
        this.loadSettings();
        this.setupEventListeners();
    },
    
    // Load user settings
    loadSettings: function() {
        const settings = Utils.Storage.get('userSettings', {
            visibility: true,
            location: true,
            matchNotifications: true,
            messageNotifications: true,
            language: 'it',
            theme: 'dark'
        });
        
        // Apply settings to toggles
        document.getElementById('visibility-toggle').checked = settings.visibility;
        document.getElementById('location-toggle').checked = settings.location;
        document.getElementById('match-notifications').checked = settings.matchNotifications;
        document.getElementById('message-notifications').checked = settings.messageNotifications;
    },
    
    // Save settings
    saveSettings: function() {
        const settings = {
            visibility: document.getElementById('visibility-toggle').checked,
            location: document.getElementById('location-toggle').checked,
            matchNotifications: document.getElementById('match-notifications').checked,
            messageNotifications: document.getElementById('message-notifications').checked,
            language: 'it',
            theme: 'dark'
        };
        
        Utils.Storage.set('userSettings', settings);
        Utils.Toast.success('Impostazioni salvate!');
    },
    
    // Setup event listeners
    setupEventListeners: function() {
        // Toggle switches
        const toggles = document.querySelectorAll('input[type="checkbox"]');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', () => {
                this.saveSettings();
            });
        });
    }
};

// Global functions for button clicks
function goBack() {
    window.history.back();
}

function editProfile() {
    window.location.href = '../profile/profile.html';
}

function changePhoto() {
    Utils.Toast.info('Funzione in arrivo! Vai al profilo per cambiare la foto.');
}

function changeLanguage() {
    Utils.Toast.info('Funzione in arrivo! Al momento è supportato solo l\'italiano.');
}

function changeTheme() {
    Utils.Toast.info('Funzione in arrivo! Al momento è supportato solo il tema scuro.');
}

function openHelp() {
    Utils.Toast.info('Centro assistenza in arrivo! Per supporto contattaci via email.');
}

function contactUs() {
    const email = 'support@amore-italiano.it';
    const subject = 'Richiesta Supporto - Amore Italiano';
    const body = 'Ciao team di Amore Italiano,\\n\\nHo bisogno di assistenza con...\\n\\nGrazie!';
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    try {
        window.location.href = mailtoLink;
    } catch (error) {
        // Fallback: copy email to clipboard
        navigator.clipboard.writeText(email).then(() => {
            Utils.Toast.success('Email copiata negli appunti: ' + email);
        }).catch(() => {
            Utils.Toast.info('Contattaci via email: ' + email);
        });
    }
}

function logout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        // Clear user data
        Utils.Storage.remove('currentUser');
        Utils.Storage.remove('likedProfiles');
        Utils.Storage.remove('userNotifications');
        Utils.Storage.remove('userChats');
        Utils.Storage.remove('userSettings');
        
        Utils.Toast.success('Logout effettuato con successo!');
        
        // Redirect to auth page
        setTimeout(() => {
            window.location.href = '../auth/auth.html';
        }, 1000);
    }
}

function deleteAccount() {
    const confirmation = prompt('Per eliminare il tuo account, scrivi "ELIMINA" (tutto maiuscolo):');
    
    if (confirmation === 'ELIMINA') {
        if (confirm('Sei ASSOLUTAMENTE sicuro? Questa azione non può essere annullata!')) {
            // Clear all user data
            Utils.Storage.remove('currentUser');
            Utils.Storage.remove('likedProfiles');
            Utils.Storage.remove('userNotifications');
            Utils.Storage.remove('userChats');
            Utils.Storage.remove('userSettings');
            
            Utils.Toast.success('Account eliminato con successo!');
            
            // Redirect to auth page
            setTimeout(() => {
                window.location.href = '../auth/auth.html';
            }, 2000);
        }
    } else if (confirmation !== null) {
        Utils.Toast.error('Testo di conferma non corretto. Account non eliminato.');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    SettingsModule.init();
});

