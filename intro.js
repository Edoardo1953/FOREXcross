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
    loadPersistentCurrencies();
    updateBaseCurrencyDisplay();
    
    // Rendi subito visibili le righe locali (previeni lo schermo vuoto)
    renderCurrencyList(); 
    
    // Recupera la lista completa nomi divise in sottofondo (non blocca la UI)
    fetchAllAvailableCurrencies();
    
    // Recupera i tassi (con timeout e fallback rapido)
    await fetchAndRenderRates();
    
    setupNumpad();
    setupSearchListeners();

    // Listen for language changes to update UI strings
    window.addEventListener('languageChanged', () => {
        updateBaseCurrencyDisplay();
        renderCurrencyList();
    });
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
    try {
        const response = await fetch('https://api.frankfurter.app/currencies');
        if (response.ok) {
            allAvailableCurrencies = await response.json();
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
    
    baseCodeEl.textContent = curr.code;
    baseNameEl.textContent = curr.name;
    baseFlagEl.innerHTML = curr.flag ? `<span class="fi fi-${curr.flag}"></span>` : '';
    
    let displayStr = baseAmountStr === '' ? '0' : baseAmountStr;
    let parts = displayStr.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    baseAmountDisplayEl.textContent = parts.join(',');
}

const FALLBACK_RATES = {
    'EUR': { 'USD': 1.08, 'BRL': 6.12, 'HKD': 8.45, 'GBP': 0.86, 'CAD': 1.48 },
    'USD': { 'EUR': 0.92, 'BRL': 5.65, 'HKD': 7.82, 'GBP': 0.79, 'CAD': 1.36 },
    'BRL': { 'EUR': 0.16, 'USD': 0.18, 'HKD': 1.38, 'GBP': 0.14, 'CAD': 0.24 },
    'GBP': { 'EUR': 1.16, 'USD': 1.25, 'BRL': 7.15, 'HKD': 9.80, 'CAD': 1.71 }
};

async function fetchAndRenderRates() {
    const codesToFetch = displayedCurrencies.map(c => c.code).filter(c => c !== baseCurrency);
    const targetStr = codesToFetch.join(',');

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`https://api.frankfurter.app/latest?from=${baseCurrency}&to=${targetStr}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if(response.ok) {
            const data = await response.json();
            ratesCache[baseCurrency] = data.rates;
            renderCurrencyList();
        } else {
            throw new Error(`API Status ${response.status}`);
        }
    } catch (e) {
        ratesCache[baseCurrency] = FALLBACK_RATES[baseCurrency] || {};
        renderCurrencyList();
        
        const errorMsg = document.createElement('li');
        errorMsg.style.cssText = "font-size:10px; color: #999; text-align:center; padding: 10px; list-style:none;";
        errorMsg.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${getTranslation('offline_mode')}`;
        currencyListEl.appendChild(errorMsg);
    }
}

function renderCurrencyList() {
    currencyListEl.innerHTML = '';
    const currentRates = ratesCache[baseCurrency] || {};
    let baseAmountNum = parseFloat(baseAmountStr.replace(',', '.'));
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
                        <span class="fi fi-${curr.flag}"></span>
                    </div>
                </div>
                <div class="curr-middle">
                    <span class="curr-code">${curr.code}</span>
                    <span class="curr-name">${displayName}</span>
                </div>
                <div class="curr-right">
                    <span class="curr-amount">${formatCalculatedAmount(calculatedAmount)}</span>
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

    const addBtn = document.createElement('li');
    addBtn.className = 'add-currency-btn';
    addBtn.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> ${getTranslation('search_add')}`;
    addBtn.addEventListener('click', () => {
        searchOverlay.classList.remove('hidden');
        searchInput.focus();
    });
    currencyListEl.appendChild(addBtn);
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
    const filtered = Object.entries(allAvailableCurrencies).filter(([code, name]) => {
        return code.includes(query) || name.toUpperCase().includes(query);
    });

    filtered.forEach(([code, name]) => {
        // Skip if already in list
        if (displayedCurrencies.find(c => c.code === code)) return;

        const li = document.createElement('li');
        li.className = 'search-result-item';
        li.innerHTML = `
            <div class="result-info">
                <span class="result-code">${code}</span>
                <span class="result-name">${name}</span>
            </div>
            <i class="fa-solid fa-plus" style="color: var(--accent-primary)"></i>
        `;
        li.addEventListener('click', () => addCurrency(code, name));
        searchResults.appendChild(li);
    });
}

function addCurrency(code, name) {
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

function formatCalculatedAmount(val) {
    if(val === 0) return '0,0000';
    const num = Number(val);
    const parts = num.toFixed(4).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return parts.join(',');
}

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
    else if (key === ',') {
        isInitialState = false;
        if(!baseAmountStr.includes(',')) baseAmountStr += ',';
    }
    else {
        if(isInitialState) {
            baseAmountStr = key;
            isInitialState = false;
        } else {
            if(baseAmountStr === '0') baseAmountStr = key;
            else if(baseAmountStr.length < 12) baseAmountStr += key;
        }
    }
    updateBaseCurrencyDisplay();
    renderCurrencyList();
}
