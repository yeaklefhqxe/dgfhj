// Utility functions for Amore Italiano
const Utils = {
    // Local Storage utilities
    Storage: {
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage set error:', e);
                return false;
            }
        },
        
        get: function(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Storage get error:', e);
                return defaultValue;
            }
        },
        
        remove: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Storage remove error:', e);
                return false;
            }
        },
        
        clear: function() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('Storage clear error:', e);
                return false;
            }
        }
    },
    
    // Toast notifications
    Toast: {
        show: function(message, type = 'info', duration = 3000) {
            const container = document.getElementById('toast-container') || this.createContainer();
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            
            container.appendChild(toast);
            
            // Trigger animation
            setTimeout(() => toast.classList.add('show'), 100);
            
            // Remove toast
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, duration);
        },
        
        createContainer: function() {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 1rem;
                right: 1rem;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            `;
            document.body.appendChild(container);
            return container;
        },
        
        success: function(message, duration) {
            this.show(message, 'success', duration);
        },
        
        error: function(message, duration) {
            this.show(message, 'error', duration);
        },
        
        info: function(message, duration) {
            this.show(message, 'info', duration);
        }
    },
    
    // Form validation
    Validation: {
        email: function(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },
        
        password: function(password) {
            return password && password.length >= 6;
        },
        
        name: function(name) {
            return name && name.trim().length >= 2;
        },
        
        age: function(birthdate) {
            if (!birthdate) return false;
            const today = new Date();
            const birth = new Date(birthdate);
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            
            return age >= 18 && age <= 100;
        }
    },
    
    // Date utilities
    Date: {
        formatAge: function(birthdate) {
            if (!birthdate) return '';
            const today = new Date();
            const birth = new Date(birthdate);
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            
            return age;
        },
        
        formatRelative: function(date) {
            const now = new Date();
            const diff = now - new Date(date);
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);
            
            if (minutes < 1) return 'Ora';
            if (minutes < 60) return `${minutes}m fa`;
            if (hours < 24) return `${hours}h fa`;
            if (days < 7) return `${days}g fa`;
            
            return new Date(date).toLocaleDateString('it-IT');
        }
    },
    
    // Random utilities
    Random: {
        int: function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        
        choice: function(array) {
            return array[Math.floor(Math.random() * array.length)];
        },
        
        shuffle: function(array) {
            const shuffled = [...array];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
        }
    },
    
    // Animation utilities
    Animation: {
        fadeIn: function(element, duration = 300) {
            element.style.opacity = '0';
            element.style.display = 'block';
            
            let start = null;
            function animate(timestamp) {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                const opacity = Math.min(progress / duration, 1);
                
                element.style.opacity = opacity;
                
                if (progress < duration) {
                    requestAnimationFrame(animate);
                }
            }
            
            requestAnimationFrame(animate);
        },
        
        fadeOut: function(element, duration = 300) {
            let start = null;
            const initialOpacity = parseFloat(getComputedStyle(element).opacity);
            
            function animate(timestamp) {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                const opacity = initialOpacity * (1 - Math.min(progress / duration, 1));
                
                element.style.opacity = opacity;
                
                if (progress < duration) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                    element.style.height = '';
                    element.style.overflow = '';
                }
            }
            
            requestAnimationFrame(animate);
        },
        
        slideUp: function(element, duration = 300) {
            const height = element.offsetHeight;
            element.style.overflow = 'hidden';
            element.style.height = height + 'px';
            
            let start = null;
            function animate(timestamp) {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                const newHeight = height * (1 - Math.min(progress / duration, 1));
                
                element.style.height = newHeight + 'px';
                
                if (progress < duration) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                    element.style.height = '';
                    element.style.overflow = '';
                }
            }
            
            requestAnimationFrame(animate);
        }
    },
    
    // Touch utilities for mobile
    Touch: {
        getDistance: function(touch1, touch2) {
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        },
        
        getAngle: function(touch1, touch2) {
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            return Math.atan2(dy, dx) * 180 / Math.PI;
        },
        
        isSwipeGesture: function(startTouch, endTouch, minDistance = 50) {
            const distance = this.getDistance(startTouch, endTouch);
            return distance >= minDistance;
        },
        
        getSwipeDirection: function(startTouch, endTouch) {
            const dx = endTouch.clientX - startTouch.clientX;
            const dy = endTouch.clientY - startTouch.clientY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                return dx > 0 ? 'right' : 'left';
            } else {
                return dy > 0 ? 'down' : 'up';
            }
        }
    },
    
    // Device detection
    Device: {
        isMobile: function() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },
        
        isTablet: function() {
            return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
        },
        
        isDesktop: function() {
            return !this.isMobile() && !this.isTablet();
        },
        
        getViewportSize: function() {
            return {
                width: window.innerWidth,
                height: window.innerHeight
            };
        }
    },
    
    // URL utilities
    URL: {
        getParams: function() {
            const params = new URLSearchParams(window.location.search);
            const result = {};
            for (const [key, value] of params) {
                result[key] = value;
            }
            return result;
        },
        
        setParam: function(key, value) {
            const url = new URL(window.location);
            url.searchParams.set(key, value);
            window.history.pushState({}, '', url);
        },
        
        removeParam: function(key) {
            const url = new URL(window.location);
            url.searchParams.delete(key);
            window.history.pushState({}, '', url);
        }
    },
    
    // Debounce utility
    debounce: function(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },
    
    // Throttle utility
    throttle: function(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    // Utils.Toast.error('Si è verificato un errore. Riprova.'); // Деактивировано, чтобы избежать спама уведомлениями
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
