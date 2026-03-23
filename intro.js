// Supported Currencies and metadata
const currencies = [
    { code: 'EUR', name: 'Euro', symbol: '€', flag: 'eu' },
    { code: 'USD', name: 'Dollaro americano', symbol: '$', flag: 'us' },
    { code: 'HKD', name: 'Dollaro di Hong Kong', symbol: 'HK$', flag: 'hk' },
    { code: 'BRL', name: 'Real brasiliano', symbol: 'R$', flag: 'br' },
    { code: 'GBP', name: 'Lira sterlina', symbol: '£', flag: 'gb' }
];

// Support dynamic list of currencies
let displayedCurrencies = [...currencies];
let allAvailableCurrencies = {}; // Full list from /currencies

// App State
let baseCurrency = 'EUR';
let baseAmountStr = '1';
let isInitialState = true;
let ratesCache = {}; 
let appAbortController = null;

// DOM Elements
const currencyListEl = document.getElementById('currencyList');
const baseCodeEl = document.getElementById('baseCode');
const baseNameEl = document.getElementById('baseName');
const baseAmountDisplayEl = document.getElementById('baseAmountDisplay');
const baseFlagEl = document.querySelector('.base-row .flag-container');

// --- SEARCH STATE ---
const searchOverlay = document.getElementById('searchOverlay');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const closeSearch = document.getElementById('closeSearch');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    console.log("Initializing Intro App...");
    loadPersistentCurrencies();
    updateBaseCurrencyDisplay();
    
    // Rendi subito visibili le righe locali (previeni lo schermo vuoto)
    renderCurrencyList(); 
    
    // Recupera la lista completa nomi divise in sottofondo
    await fetchAllAvailableCurrencies();
    
    // Recupera i tassi (con timeout e fallback rapido)
    await fetchAndRenderRates();
    
    setupNumpad();
    setupSearchListeners();
    setupNumpadToggle();

    // Listen for language changes to update UI strings
    window.addEventListener('languageChanged', () => {
        updateBaseCurrencyDisplay();
        renderCurrencyList();
    });
}

function setupNumpadToggle() {
    const toggleBtn = document.getElementById('toggleNumpadBtn');
    const container = document.getElementById('mobileNumpadContainer');
    
    if (toggleBtn && container) {
        toggleBtn.addEventListener('click', () => {
            container.classList.add('numpad-mobile-active');
            toggleBtn.classList.add('btn-active');
        });
    }
    
    const closeBtn = document.getElementById('closeNumpadBtn');
    if (closeBtn && container && toggleBtn) {
        closeBtn.addEventListener('click', () => {
            container.classList.remove('numpad-mobile-active');
            toggleBtn.classList.remove('btn-active');
        });
    }
}

function loadPersistentCurrencies() {
    const saved = localStorage.getItem('added_currencies');
    if (saved) {
        try {
            const added = JSON.parse(saved);
            added.forEach(code => {
                if (!displayedCurrencies.find(c => c.code === code)) {
                    displayedCurrencies.push({ code, name: code, symbol: '', flag: code.toLowerCase().substring(0,2) });
                }
            });
        } catch (e) {}
    }
}

async function fetchAllAvailableCurrencies() {
    // Try to load from cache first
    const saved = localStorage.getItem('frankfurter_currencies');
    if (saved) {
        try {
            allAvailableCurrencies = JSON.parse(saved);
        } catch (e) {}
    }

    try {
        const response = await fetch('https://api.frankfurter.app/currencies');
        if (response.ok) {
            allAvailableCurrencies = await response.json();
            localStorage.setItem('frankfurter_currencies', JSON.stringify(allAvailableCurrencies));
            
            displayedCurrencies.forEach(curr => {
                if (allAvailableCurrencies[curr.code]) {
                    curr.name = allAvailableCurrencies[curr.code];
                }
            });
            renderCurrencyList(); // Ri-renderizza quando i nomi sono pronti
        }
    } catch (e) {
        console.warn("Could not fetch full currency list", e);
    }
}

function updateBaseCurrencyDisplay() {
    const curr = displayedCurrencies.find(c => c.code === baseCurrency) || { code: baseCurrency, name: 'Valuta', symbol: '', flag: '' };
    
    if (baseCodeEl) baseCodeEl.textContent = curr.code;
    if (baseNameEl) baseNameEl.textContent = curr.name;
    if (baseFlagEl) baseFlagEl.innerHTML = curr.flag ? `<span class="${APP_UTILS.getFlagClass(curr.code)}"></span>` : '';
    
    if (baseAmountDisplayEl) {
        let displayStr = baseAmountStr === '' ? '0' : baseAmountStr;
        
        // Se contiene operatori, non applichiamo la formattazione dei punti per non confondere l'utente
        const hasOperators = /[+\-\*\/]/.test(displayStr);
        
        if (hasOperators) {
            baseAmountDisplayEl.textContent = displayStr;
        } else {
            // Formatting for the input display remains slightly specific due to the "live" comma handling
            let parts = displayStr.split(',');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            baseAmountDisplayEl.textContent = parts.join(',');
        }
    }
}

// FALLBACK_RATES moved to SHARED_FALLBACK_RATES in utils.js

async function fetchAndRenderRates() {
    const codesToFetch = displayedCurrencies.map(c => c.code).filter(c => c !== baseCurrency);
    if (codesToFetch.length === 0) return;
    const targetStr = codesToFetch.join(',');

    if (appAbortController) appAbortController.abort();
    appAbortController = new AbortController();
    const currentController = appAbortController; 
    const signal = currentController.signal;

    try {
        const timeoutId = setTimeout(() => currentController.abort(), 8000);
        
        // --- PROVA TWELVE DATA (REAL-TIME) ---
        // Funziona per EUR/USD con chiave 'demo' o per tutto se l'utente ha una sua chiave
        const userKey = localStorage.getItem('twelvedata_apikey');
        const apiKey = userKey || 'demo';
        
        // Determina se questa coppia è supportata dalla demo o se abbiamo una chiave utente
        const isDemoPair = (baseCurrency === 'EUR' && codesToFetch.includes('USD')) || (baseCurrency === 'USD' && codesToFetch.includes('EUR'));
        
        if (userKey || isDemoPair) {
            console.log(`Attempting Twelve Data Real-Time Fetch (Pair: ${baseCurrency}/X)...`);
            // Nota: La versione FREE/DEMO supporta meglio richieste singole per coppia
            // ma proviamo a recuperare almeno la coppia principale EUR/USD
            try {
                const tdSymbol = `${baseCurrency}/${codesToFetch[0]}`; // Usiamo la prima coppia come priorità
                const tdUrl = `https://api.twelvedata.com/exchange_rate?symbol=${tdSymbol}&apikey=${apiKey}`;
                const tdResp = await fetch(tdUrl, { signal });
                if (tdResp.ok) {
                    const tdData = await tdResp.json();
                    if (tdData.rate) {
                        console.log(`Twelve Data Success for ${tdSymbol}: ${tdData.rate}`);
                        ratesCache[baseCurrency] = ratesCache[baseCurrency] || {};
                        ratesCache[baseCurrency][codesToFetch[0]] = parseFloat(tdData.rate);
                        
                        // Aggiorna data nel sottotitolo e mostra badge Real-Time
                        const subtitleEl = document.querySelector('.header-subtitle');
                        const rtBadge = document.getElementById('realTimeBadge');
                        
                        if (subtitleEl) {
                            subtitleEl.innerHTML = getTranslation('homepage_subtitle');
                        }
                        
                        if (rtBadge) {
                            const d = tdData.timestamp ? new Date(tdData.timestamp * 1000) : new Date();
                            const timeStr = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                            rtBadge.innerHTML = `REAL-TIME (${timeStr})`;
                            rtBadge.style.display = 'block';
                        }
                    }
                }
            } catch (tdErr) {
                console.warn("Twelve Data failed, moving to secondary provider", tdErr);
            }
        }

        // --- PROVA SECONDARY PROVIDER (OPEN.ER-API) ---
        const url = `https://open.er-api.com/v6/latest/${baseCurrency}`;
        const response = await fetch(url, { signal: signal });
        clearTimeout(timeoutId);

        if(response.ok) {
            const data = await response.json();
            if (signal.aborted) return; 
            
            // Uniamo i dati di oggi con quelli real-time (se arrivati)
            const combinedRates = { ...data.rates, ...(ratesCache[baseCurrency] || {}) };
            ratesCache[baseCurrency] = combinedRates;
            
            // Se non abbiamo ancora aggiornato il sottotitolo (perché Twelve Data ha fallito o non era EUR/USD)
            const subtitleEl = document.querySelector('.header-subtitle');
            const rtBadge = document.getElementById('realTimeBadge');

            if (subtitleEl && !subtitleEl.classList.contains('subtitle-fixed')) {
                subtitleEl.innerHTML = getTranslation('homepage_subtitle');
                subtitleEl.classList.add('subtitle-fixed');
            }

            if (rtBadge && (!ratesCache[baseCurrency] || !ratesCache[baseCurrency][codesToFetch[0]] || !userKey && !isDemoPair)) {
                rtBadge.style.display = 'none';
            }

            renderCurrencyList();
        } else {
            throw new Error(`API Status ${response.status}`);
        }
    } catch (e) {
        if (e.name === 'AbortError') return;
        console.warn("Fetch failed, using fallback", e);
        ratesCache[baseCurrency] = SHARED_FALLBACK_RATES[baseCurrency] || {};
        renderCurrencyList();
        
        if (!signal.aborted) {
            const errorMsg = document.createElement('li');
            errorMsg.style.cssText = "font-size:10px; color: var(--text-muted); text-align:center; padding: 10px; list-style:none;";
            errorMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${getTranslation('offline_mode')}`;
            if (currencyListEl) currencyListEl.appendChild(errorMsg);
        }
    }
}

function renderCurrencyList() {
    const currentRates = ratesCache[baseCurrency] || {};
    let baseAmountNum = evaluateBaseAmount(baseAmountStr);
    if(isNaN(baseAmountNum)) baseAmountNum = 0;

    // Se la lista è già popolata e il numero di elementi non è cambiato, aggiorna solo i valori
    const existingRows = currencyListEl.querySelectorAll('.currency-row');
    const codesToDisplay = displayedCurrencies.filter(c => c.code !== baseCurrency);
    


    currencyListEl.innerHTML = '';
    // Use already declared variables
    if(isNaN(baseAmountNum)) baseAmountNum = 0;

    // Define core protected codes
    const protectedCodes = ['EUR', 'USD'];

    displayedCurrencies.forEach(curr => {
        if(curr.code === baseCurrency) return;

        const rate = currentRates[curr.code] || 0;
        const calculatedAmount = baseAmountNum * rate;

        const li = document.createElement('li');
        li.className = 'currency-row';
        
        const displayName = allAvailableCurrencies[curr.code] || curr.name;

        li.innerHTML = `
            <div class="curr-main-link">
                <div class="curr-left">
                    <div class="flag-container">
                        <span class="${APP_UTILS.getFlagClass(curr.code)}"></span>
                    </div>
                </div>
                <div class="curr-middle">
                    <span class="curr-code">${curr.code}</span>
                    <span class="curr-name">${displayName}</span>
                </div>
                <div class="curr-right">
                    <span class="curr-amount">${APP_UTILS.formatNumber(calculatedAmount)}</span>
                </div>
            </div>
            ${!protectedCodes.includes(curr.code) ? `
                <button class="remove-curr-btn" title="${getTranslation('remove_currency')}">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            ` : ''}
        `;

        li.querySelector('.curr-main-link').addEventListener('click', () => setAsBaseCurrency(curr.code));
        
        const removeBtn = li.querySelector('.remove-curr-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeCurrency(curr.code);
            });
        }

        currencyListEl.appendChild(li);
    });
    // --- NEW: Stable Add Currency Area Handling (outside the dynamic list) ---
    const addPlaceholder = document.getElementById('addBtnPlaceholder');
    if (addPlaceholder) {
        addPlaceholder.innerHTML = '';
        const addBtn = document.createElement('div');
        addBtn.className = 'add-currency-btn';
        addBtn.innerHTML = `<i class="fa-solid fa-plus-circle"></i> ${getTranslation('search_add')}`;
        addBtn.addEventListener('click', () => {
            searchOverlay.classList.remove('hidden');
            renderSearchResults(''); 
            searchResults.scrollTop = 0;
            setTimeout(() => searchInput.focus(), 100);
        });
        addPlaceholder.appendChild(addBtn);
    }
}



function removeCurrency(code) {
    const protectedCodes = ['EUR', 'USD'];
    if (protectedCodes.includes(code)) return;

    displayedCurrencies = displayedCurrencies.filter(c => c.code !== code);
    
    // Update local storage persistence
    const originalCodes = currencies.map(c => c.code);
    const extraCodes = displayedCurrencies.filter(c => !originalCodes.includes(c.code)).map(c => c.code);
    localStorage.setItem('added_currencies', JSON.stringify(extraCodes));

    renderCurrencyList();
}
function setupSearchListeners() {
    closeSearch.addEventListener('click', () => searchOverlay.classList.add('hidden'));
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toUpperCase();
        renderSearchResults(query);
    });
}

function renderSearchResults(query = '') {
    searchResults.innerHTML = '';
    searchResults.scrollTop = 0; // Alway reset scroll to top on new query
    const filtered = Object.entries(allAvailableCurrencies).filter(([code, name]) => {
        return code.includes(query) || name.toUpperCase().includes(query);
    });

    if (Object.keys(allAvailableCurrencies).length === 0) {
        searchResults.innerHTML = `<li style="text-align:center; padding: 20px; color: var(--text-secondary); opacity: 0.7; font-size: 13px;">${getTranslation('loading_rates') || 'Caricamento divise...'}</li>`;
        return;
    }

    filtered.forEach(([code, name]) => {
        // Skip if already in list OR base currency
        const isAlreadyDisplayed = displayedCurrencies.some(c => c?.code?.trim()?.toUpperCase() === code?.trim()?.toUpperCase());
        const isBase = baseCurrency?.trim()?.toUpperCase() === code?.trim()?.toUpperCase();
        
        if (isAlreadyDisplayed || isBase) return;

        const li = document.createElement('li');
        li.className = 'search-result-item';
        li.innerHTML = `
            <div class="result-info">
                <div class="result-top-line">
                    <span class="${APP_UTILS.getFlagClass(code)}"></span>
                    <span class="result-code">${code}</span>
                </div>
                <span class="result-name">${name}</span>
            </div>
            <i class="fa-solid fa-plus" style="color: var(--accent-primary)"></i>
        `;
        li.addEventListener('click', () => addCurrency(code, name));
        searchResults.appendChild(li);
    });
}

function addCurrency(code, name) {
    const ucCode = code?.trim()?.toUpperCase();
    if (!ucCode || displayedCurrencies.some(c => c?.code?.trim()?.toUpperCase() === ucCode)) {
        console.warn(`Duplicate currency blocked: ${ucCode}`);
        searchOverlay.classList.add('hidden');
        return;
    }

    const newCurr = {
        code: code,
        name: allAvailableCurrencies[code] || name,
        symbol: '', 
        flag: code.toLowerCase().substring(0, 2)
    };
    
    displayedCurrencies.push(newCurr);
    
    // Persist
    const originalCodes = currencies.map(c => c.code);
    const extraCodes = displayedCurrencies.filter(c => !originalCodes.includes(c.code)).map(c => c.code);
    localStorage.setItem('added_currencies', JSON.stringify(extraCodes));

    searchOverlay.classList.add('hidden');
    searchInput.value = '';
    
    fetchAndRenderRates();
}

// formatCalculatedAmount replaced by APP_UTILS.formatNumber

function setAsBaseCurrency(newCode) {
    if(newCode === baseCurrency) return;
    baseCurrency = newCode;
    baseAmountStr = '1';
    isInitialState = true;
    updateBaseCurrencyDisplay();
    currencyListEl.innerHTML = `<li class="loading-state">${getTranslation('update_wait')} <i class="fa-solid fa-spinner fa-spin"></i></li>`;
    fetchAndRenderRates();
}

function setupNumpad() {
    const keys = document.querySelectorAll('.numpad-grid button[data-key]');
    keys.forEach(btn => btn.addEventListener('click', () => handleNumpadInput(btn.dataset.key)));
}

function handleNumpadInput(key) {
    if(key === 'AC') {
        baseAmountStr = '1';
        isInitialState = true;
    } 
    else if (key === 'DEL') {
        if(baseAmountStr.length > 1) {
            baseAmountStr = baseAmountStr.slice(0, -1);
            isInitialState = false;
        } else {
            baseAmountStr = '0';
            isInitialState = true;
        }
    }
    else if (key === '=') {
        const result = evaluateBaseAmount(baseAmountStr);
        baseAmountStr = result.toString().replace('.', ',');
        isInitialState = false;
    }
    else if (['+', '-', '*', '/'].includes(key)) {
        isInitialState = false;
        // Evita di aggiungere lo stesso operatore due volte
        const lastChar = baseAmountStr.slice(-1);
        if (['+', '-', '*', '/'].includes(lastChar)) {
            baseAmountStr = baseAmountStr.slice(0, -1) + key;
        } else {
            baseAmountStr += key;
        }
    }
    else if (key === ',') {
        isInitialState = false;
        // Consenti la virgola solo se non c'è già nel pezzo corrente (dopo l'ultimo operatore)
        const parts = baseAmountStr.split(/[+\-\*\/]/);
        const lastPart = parts[parts.length - 1];
        if(!lastPart.includes(',')) baseAmountStr += ',';
    }
    else {
        if(isInitialState) {
            baseAmountStr = key;
            isInitialState = false;
        } else {
            if(baseAmountStr === '0') baseAmountStr = key;
            else if(baseAmountStr.length < 24) baseAmountStr += key; // Aumentato limite per espressioni
        }
    }
    updateBaseCurrencyDisplay();
    renderCurrencyList();
}

/**
 * Valuta l'espressione inserita nel baseAmountStr in modo sicuro
 */
function evaluateBaseAmount(str) {
    if (!str) return 0;
    // Sostituisci virgola con punto per eval
    let expr = str.replace(/,/g, '.');
    // Rimuovi caratteri non ammessi (sicurezza)
    expr = expr.replace(/[^0-9+\-\*\/.]/g, '');
    
    // Rimuovi operatore finale se presente (es. "5+" -> "5")
    if (/[+\-\*\/]$/.test(expr)) {
        expr = expr.slice(0, -1);
    }

    if (!expr) return 0;
    
    try {
        // Utilizziamo Function invece di eval per maggiore sicurezza
        const result = new Function('return ' + expr)();
        return isFinite(result) ? result : 0;
    } catch (e) {
        // Fallback al semplice parseFloat se l'espressione è incompleta o errata
        return parseFloat(expr) || 0;
    }
}
