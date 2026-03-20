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

    updateManualLinks();
    
    // Add event listener for clicks outside settings container to close it
    const overlay = document.getElementById('settingsOverlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                toggleSettings(false);
            }
        });
    }

    const privacyOverlay = document.getElementById('privacyOverlay');
    if (privacyOverlay) {
        privacyOverlay.addEventListener('click', (e) => {
            if (e.target === privacyOverlay) {
                togglePrivacy(false);
            }
        });
    }

    // NEW: Listen for changes from other tabs or local changes
    window.addEventListener('storage', (e) => {
        if (e.key === 'app_theme') {
            setTheme(e.newValue, false);
        }
        if (e.key === 'app_bg') {
            setBackground(e.newValue, false);
        }
        if (e.key === 'app_language') {
            updateManualLinks();
        }
    });

    window.addEventListener('languageChanged', () => {
        updateManualLinks();
    });
}

function updateManualLinks() {
    const langNow = localStorage.getItem('app_language') || 'en';
    
    const privacyLink = document.getElementById('manualPrivacyLink');
    if (privacyLink) {
        privacyLink.onclick = (e) => {
            e.preventDefault();
            const url = `docs/manuals/Privacy_${langNow}.html`;
            toggleManual(true, url, 'manual_privacy_title');
        };
    }

    const userLink = document.getElementById('manualUserLink');
    if (userLink) {
        userLink.onclick = (e) => {
            e.preventDefault();
            const url = `docs/manuals/Manual_User_${langNow}.html`;
            toggleManual(true, url, 'manual_user_title');
        };
    }

    const advLink = document.getElementById('manualAdvancedLink');
    if (advLink) {
        advLink.onclick = (e) => {
            e.preventDefault();
            const url = `docs/manuals/Manual_Advanced_${langNow}.html`;
            toggleManual(true, url, 'manual_advanced_title');
        };
    }

    const installLink = document.getElementById('manualInstallLink');
    if (installLink) {
        installLink.onclick = (e) => {
            e.preventDefault();
            const url = `docs/manuals/Manual_Installation_${langNow}.html`;
            toggleManual(true, url, 'manual_install_title');
        };
    }

    applyManualVisibility();
}

function deleteManual(id) {
    if (confirm(getTranslation('delete_manual_confirm'))) {
        let hidden = JSON.parse(localStorage.getItem('hidden_manuals') || '[]');
        if (!hidden.includes(id)) {
            hidden.push(id);
            localStorage.setItem('hidden_manuals', JSON.stringify(hidden));
            applyManualVisibility();
        }
    }
}

function restoreManuals() {
    localStorage.removeItem('hidden_manuals');
    applyManualVisibility();
}

function applyManualVisibility() {
    const hidden = JSON.parse(localStorage.getItem('hidden_manuals') || '[]');
    const wrappers = document.querySelectorAll('.manual-item-wrapper');
    let visibleCount = 0;
    
    wrappers.forEach(wrapper => {
        const id = wrapper.getAttribute('data-manual-id');
        if (hidden.includes(id)) {
            wrapper.classList.add('hidden-manual');
        } else {
            wrapper.classList.remove('hidden-manual');
            visibleCount++;
        }
    });

    const restoreLink = document.querySelector('.restore-manuals-link');
    if (restoreLink) {
        restoreLink.style.display = (hidden.length > 0) ? 'block' : 'none';
    }
}

function toggleManual(show, url, titleKey) {
    const overlay = document.getElementById('manualOverlay');
    const iframe = document.getElementById('manualIframe');
    const downloadBtn = document.getElementById('btnDownloadManual');
    const titleEl = overlay ? overlay.querySelector('.manual-header-title') : null;
    
    if (!overlay || !iframe) return;

    if (show) {
        const cleanUrl = url.split('?')[0] + '?v=' + new Date().getTime();
        const pdfUrl = url.replace('.html', '.pdf');
        const filename = pdfUrl.split('/').pop();
        
        iframe.src = cleanUrl;

        // Update Download logic: Invoke browser print on the iframe
        if (downloadBtn) {
            downloadBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                try {
                    // Try to use the standard iframe print method
                    if (iframe.contentWindow) {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                    } else {
                        throw new Error("Iframe window not accessible");
                    }
                } catch (err) {
                    // Fallback: just open the manual URL in a new window for printing
                    // Check if URL already has query params
                    const separator = url.includes('?') ? '&' : '?';
                    window.open(url + separator + 'print=1', '_blank');
                }
                
                return false;
            };
        }

        if (titleEl && titleKey) {
            titleEl.setAttribute('data-i18n', titleKey);
            if (typeof applyTranslations === 'function') applyTranslations();
        }
        
        overlay.classList.remove('hidden');
        document.body.classList.add('no-scroll');

        if (!history.state || history.state.manual !== 'open') {
            history.pushState({ manual: 'open' }, "");
        }
    } else {
        overlay.classList.add('hidden');
        iframe.src = 'about:blank';
        document.body.classList.remove('no-scroll');
        
        if (history.state && history.state.manual === 'open') {
            history.back();
        }
    }
}

// Global listener for back button
window.addEventListener('popstate', (e) => {
    const overlay = document.getElementById('manualOverlay');
    if (overlay && !overlay.classList.contains('hidden')) {
        overlay.classList.add('hidden');
        const iframe = document.getElementById('manualIframe');
        if (iframe) iframe.src = 'about:blank';
        document.body.classList.remove('no-scroll');
    }
});

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

function togglePrivacy(show) {
    const overlay = document.getElementById('privacyOverlay');
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
        document.documentElement.removeAttribute('data-bg');
    } else {
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



/**
 * SHARED ACCESS LOGIC
 */
function generateShareLink() {
    const password = document.getElementById('sharePassword').value;
    const months = parseInt(document.getElementById('shareExpiry').value);
    
    if (!password) {
        alert("Inserisci una password per proteggere il link.");
        return;
    }

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);
    
    const payload = `${expiryDate.toISOString()}|FOREX_ACCESS`;
    const token = APP_UTILS.xorEncrypt(payload, password);
    
    const baseUrl = window.location.href.split('?')[0].split('#')[0];
    const shareUrl = `${baseUrl}?t=${token}`;
    
    const resultDiv = document.getElementById('shareLinkResult');
    const resultInput = document.getElementById('shareLinkInput');
    
    resultInput.value = shareUrl;
    resultDiv.classList.remove('hidden');
}

function copyShareLink() {
    const input = document.getElementById('shareLinkInput');
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value);
    
    alert(getTranslation('link_generated'));
}

// Global Access Check on Load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('t');
    
    if (token) {
        showAccessPrompt(token);
    }
});

function showAccessPrompt(token) {
    const overlay = document.getElementById('accessOverlay');
    if (!overlay) return;
    
    overlay.classList.remove('hidden');
    
    const loginBtn = document.getElementById('btnLogin');
    const pwdInput = document.getElementById('accessPasswordInput');
    const errorMsg = document.getElementById('accessError');
    
    loginBtn.onclick = () => {
        const password = pwdInput.value;
        const verification = APP_UTILS.verifyAccessToken(token, password);
        
        if (!verification) {
            errorMsg.textContent = getTranslation('invalid_password');
            errorMsg.classList.remove('hidden');
        } else if (verification.expired) {
            errorMsg.textContent = getTranslation('access_expired');
            errorMsg.classList.remove('hidden');
        } else {
            // Success! 
            overlay.classList.add('hidden');
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    };

    pwdInput.onkeypress = (e) => {
        if (e.key === 'Enter') loginBtn.click();
    };
}
