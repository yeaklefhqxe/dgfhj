// Authentication module for Amore Italiano
const AuthModule = {
    // Initialize authentication module
    init: function() {
        console.log('Initializing Auth Module...');
        
        // Set up form event listeners
        this.setupFormListeners();
        
        // Check if user is already logged in
        const currentUser = AmoreApp.getCurrentUser();
        if (currentUser) {
            if (currentUser.profileComplete) {
                AmoreApp.redirectToDashboard();
            } else {
                AmoreApp.redirectToProfileSetup();
            }
        }
    },
    
    // Set up form event listeners
    setupFormListeners: function() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    },
    
    // Handle login form submission
    handleLogin: function() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        // Validate inputs
        if (!this.validateLoginInputs(email, password)) {
            return;
        }
        
        // Show loading
        this.showLoading();
        
        // Simulate login process
        setTimeout(() => {
            this.processLogin(email, password);
        }, 1000);
    },
    
    // Handle register form submission
    handleRegister: function() {
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const birthdate = document.getElementById('register-birthdate').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const termsAccepted = document.getElementById('terms-checkbox').checked;
        
        // Validate inputs
        if (!this.validateRegisterInputs(name, email, birthdate, password, confirmPassword, termsAccepted)) {
            return;
        }
        
        // Show loading
        this.showLoading();
        
        // Simulate registration process
        setTimeout(() => {
            this.processRegister(name, email, birthdate, password);
        }, 1000);
    },
    
    // Validate login inputs
    validateLoginInputs: function(email, password) {
        if (!Utils.Validation.email(email)) {
            Utils.Toast.error(Translations.t('invalid_email'));
            return false;
        }
        
        if (!Utils.Validation.password(password)) {
            Utils.Toast.error(Translations.t('password_too_short'));
            return false;
        }
        
        return true;
    },
    
    // Validate register inputs
    validateRegisterInputs: function(name, email, birthdate, password, confirmPassword, termsAccepted) {
        if (!Utils.Validation.name(name)) {
            Utils.Toast.error(Translations.t('name_too_short'));
            return false;
        }
        
        if (!Utils.Validation.email(email)) {
            Utils.Toast.error(Translations.t('invalid_email'));
            return false;
        }
        
        if (!Utils.Validation.age(birthdate)) {
            Utils.Toast.error(Translations.t('age_requirement'));
            return false;
        }
        
        if (!Utils.Validation.password(password)) {
            Utils.Toast.error(Translations.t('password_too_short'));
            return false;
        }
        
        if (password !== confirmPassword) {
            Utils.Toast.error(Translations.t('passwords_not_match'));
            return false;
        }
        
        if (!termsAccepted) {
            Utils.Toast.error(Translations.t('terms_required'));
            return false;
        }
        
        return true;
    },
    
    // Process login
    processLogin: function(email, password) {
        this.hideLoading();
        
        // Use AmoreApp authentication
        if (AmoreApp.authenticateUser(email, password)) {
            Utils.Toast.success(Translations.t('login_success'));
        } else {
            Utils.Toast.error(Translations.t('invalid_credentials'));
        }
    },
    
    // Process registration
    processRegister: function(name, email, birthdate, password) {
        this.hideLoading();
        
        // Use AmoreApp registration
        const result = AmoreApp.registerUser({
            name: name,
            email: email,
            birthDate: birthdate,
            password: password
        });
        
        if (result.success) {
            Utils.Toast.success(Translations.t('register_success'));
            
            // Login user and redirect to profile setup
            setTimeout(() => {
                AmoreApp.loginUser(result.user);
            }, 1500);
        } else {
            Utils.Toast.error(result.message);
        }
    },
    
    // Show loading overlay
    showLoading: function() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    },
    
    // Hide loading overlay
    hideLoading: function() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
};

// Tab switching functions
function showLogin() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Update tabs
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    
    // Update forms
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
}

function showRegister() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Update tabs
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
    
    // Update forms
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    AuthModule.init();
});

