/**
 * Settings and Theme Management
 */

// Initial Theme & BG Check - Use documentElement because body might not be ready in head
(function() {
    const savedTheme = localStorage.getItem('app_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const savedBg = localStorage.getItem('app_bg') || 'default';
    if (savedBg !== 'default') {
        document.documentElement.setAttribute('data-bg', savedBg);
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    initSettings();
});

function initSettings() {
    const savedTheme = localStorage.getItem('app_theme') || 'dark';
    setTheme(savedTheme, false); // Initialize without saving again
    
    const savedBg = localStorage.getItem('app_bg') || 'default';
    setBackground(savedBg, false);
    
    // Add event listener for clicks outside settings container to close it
    const overlay = document.getElementById('settingsOverlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                toggleSettings(false);
            }
        });
    }

    // NEW: Listen for changes from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'app_theme') {
            setTheme(e.newValue, false);
        }
        if (e.key === 'app_bg') {
            setBackground(e.newValue, false);
        }
    });
}

function toggleSettings(show) {
    const overlay = document.getElementById('settingsOverlay');
    if (!overlay) return;
    
    if (show === undefined) {
        overlay.classList.toggle('hidden');
    } else {
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

function setTheme(theme, save = true) {
    document.body.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    if (save) {
        localStorage.setItem('app_theme', theme);
    }
    
    // Update switch buttons UI
    const btns = document.querySelectorAll('.theme-switch-btn');
    btns.forEach(btn => {
        if (btn.getAttribute('data-theme') === theme) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Dispatch event if other scripts need to know
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
}

function setBackground(bg, save = true) {
    if (bg === 'default') {
        document.body.removeAttribute('data-bg');
        document.documentElement.removeAttribute('data-bg');
    } else {
        document.body.setAttribute('data-bg', bg);
        document.documentElement.setAttribute('data-bg', bg);
    }
    
    if (save) {
        localStorage.setItem('app_bg', bg);
    }
    
    // Update switch buttons UI
    const btns = document.querySelectorAll('.bg-switch-btn');
    btns.forEach(btn => {
        if (btn.getAttribute('data-bg') === bg) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}
