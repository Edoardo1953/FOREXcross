// DOM Elements
const uploadOverlay = document.getElementById('uploadOverlay');
const excelFileInput = document.getElementById('excelFileInput');
const dashboardData = document.getElementById('dashboardData');
const baseCurrencyToggles = document.querySelectorAll('.toggle-btn');
const currentPairText = document.getElementById('currentPairText');
const pageTitle = document.getElementById('pageTitle');
const cardTitle = document.getElementById('cardTitle');
const chartTitle = document.getElementById('chartTitle');

// Application State
let appData = null; // Will hold parsed excel data
let currentBaseCurrency = 'EUR'; 
let currentTargetCurrency = 'USD';

// NEW: Global Sync Controller to avoid multiple overlapping syncs
let syncAbortController = null;

// --- SEARCH STATE ---
let allAvailableCurrencies = {};
let currentSearchTarget = 'base'; // 'base' or 'target'
const searchOverlay = document.getElementById('searchOverlay');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const closeSearch = document.getElementById('closeSearch');

// Auto-detect pair from URL
if (window.location.pathname.includes('eur_usd')) {
    currentBaseCurrency = 'EUR';
    currentTargetCurrency = 'USD';
    // Update UI state immediately before initialization
    document.addEventListener('DOMContentLoaded', () => {
         baseCurrencyToggles.forEach(btn => {
            const b = btn.getAttribute('data-base');
            const t = btn.getAttribute('data-target');
            if (b === currentBaseCurrency && t === currentTargetCurrency) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
         });
    });
}

// --- Event Listeners Definition ---

// Handle base currency toggle
// Custom Cross Form Logic
const customBaseInput = document.getElementById('customBase');
const customTargetInput = document.getElementById('customTarget');
const customBaseFlag = document.getElementById('customBaseFlag');
const customTargetFlag = document.getElementById('customTargetFlag');
const btnFetchCustom = document.getElementById('btnFetchCustom');
const btnSwap = document.getElementById('btnSwap');

function updateGroupTitles(activeGroup) {
    const titles = document.querySelectorAll('.selector-group-title');
    titles.forEach(t => {
        t.classList.add('active');
    });
}

function updateCustomFlags() {
    if (customBaseFlag && customBaseInput) {
        customBaseFlag.className = APP_UTILS.getFlagClass(customBaseInput.value);
    }
    if (customTargetFlag && customTargetInput) {
        customTargetFlag.className = APP_UTILS.getFlagClass(customTargetInput.value);
    }
}

function activateCustomArea() {
    updateCustomFlags();
    baseCurrencyToggles.forEach(b => b.classList.remove('active'));
    updateGroupTitles('custom');
}

function triggerCustomFetch() {
    const base = customBaseInput ? customBaseInput.value.trim().toUpperCase() : '';
    const target = customTargetInput ? customTargetInput.value.trim().toUpperCase() : '';

    if (base && target && base.length === 3 && target.length === 3) {
        activateCustomArea();
        
        currentBaseCurrency = base;
        currentTargetCurrency = target;
        
        updateLabels();

        const globalLoader = document.getElementById('globalLoader');
        if (globalLoader) globalLoader.classList.remove('hidden');
        
        initializeData();
    }
}

if (btnSwap) {
    btnSwap.addEventListener('click', () => {
        if (!customBaseInput || !customTargetInput) return;
        const temp = customBaseInput.value;
        customBaseInput.value = customTargetInput.value;
        customTargetInput.value = temp;
        triggerCustomFetch();
    });
}

const handleEnter = (e) => {
    if (e.key === 'Enter') triggerCustomFetch();
};

// Input listeners removed since we use search overlay now


const titleCustom = document.getElementById('titleCustom');
const customBaseContainer = document.getElementById('customBaseContainer');
const customTargetContainer = document.getElementById('customTargetContainer');

// // Title Clicks
if (titleCustom) titleCustom.addEventListener('click', () => triggerCustomFetch());

// Custom Container Clicks
if (customBaseContainer) {
    customBaseContainer.addEventListener('click', (e) => {
        openSearchOverlay('base');
    });
}
if (customTargetContainer) {
    customTargetContainer.addEventListener('click', (e) => {
        openSearchOverlay('target');
    });
}

// --- SEARCH OVERLAY LOGIC ---
async function fetchAllAvailableCurrencies() {
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
        }
    } catch (e) {
        console.warn("Could not fetch full currency list", e);
    }
}

function openSearchOverlay(target) {
    currentSearchTarget = target;
    if (searchOverlay) {
        searchOverlay.classList.remove('hidden');
        renderSearchResults('');
        searchResults.scrollTop = 0;
        setTimeout(() => searchInput.focus(), 100);
    }
}

function setupSearchListeners() {
    if (closeSearch) closeSearch.addEventListener('click', () => searchOverlay.classList.add('hidden'));
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toUpperCase();
            renderSearchResults(query);
        });
    }
}

function renderSearchResults(query = '') {
    if (!searchResults) return;
    searchResults.innerHTML = '';
    
    const filtered = Object.entries(allAvailableCurrencies).filter(([code, name]) => {
        return code.includes(query) || name.toUpperCase().includes(query);
    });

    if (Object.keys(allAvailableCurrencies).length === 0) {
        searchResults.innerHTML = `<li style="text-align:center; padding: 20px; color: var(--text-secondary); opacity: 0.7; font-size: 13px;">${getTranslation('loading_rates') || 'Caricamento divise...'}</li>`;
        return;
    }

    filtered.forEach(([code, name]) => {
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
        li.addEventListener('click', () => selectCurrency(code));
        searchResults.appendChild(li);
    });
}

function selectCurrency(code) {
    if (currentSearchTarget === 'base') {
        customBaseInput.value = code;
    } else {
        customTargetInput.value = code;
    }
    
    if (searchOverlay) searchOverlay.classList.add('hidden');
    if (searchInput) searchInput.value = '';
    
    updateCustomFlags();
    triggerCustomFetch();
}

// Removed updateMainFlags function
// Removed triggerMainFetch function

// Custom Container Clicks (duplicate, keeping the first one)
// if (customBaseContainer) {
//     customBaseContainer.addEventListener('click', (e) => {
//         if (e.target !== customBaseInput) customBaseInput.focus();
//         if (customBaseInput.value.length === 3 && customTargetInput.value.length === 3) triggerCustomFetch();
//     });
// }
// if (customTargetContainer) {
//     customTargetContainer.addEventListener('click', (e) => {
//         if (e.target !== customTargetInput) {
//             if (btnSwap) btnSwap.click();
//         }
//     });
// }

function updateLabels() {
    const pairLabel = `${currentBaseCurrency}/${currentTargetCurrency}`;
    const baseFlag = APP_UTILS.getFlagClass(currentBaseCurrency);
    const targetFlag = APP_UTILS.getFlagClass(currentTargetCurrency);
    const flagsHtml = `<span class="${baseFlag}" style="border-radius:2px; margin-left:8px;"></span><span class="${targetFlag}" style="border-radius:2px; margin-left:2px;"></span>`;

    const subtitleEl = document.querySelector('.subtitle');
    const pageTitleEl = document.getElementById('pageTitle');
    const viewOverviewEl = document.getElementById('viewOverview');

    if (viewOverviewEl && viewOverviewEl.classList.contains('hidden')) {
        // DATABASE VIEW ACTIVE
        if (pageTitleEl) pageTitleEl.innerHTML = getTranslation('db_title');
        if (subtitleEl) subtitleEl.innerHTML = `${getTranslation('subtitle_database')} ${pairLabel} ${flagsHtml}`;
    } else {
        // OVERVIEW VIEW ACTIVE
        if (pageTitleEl) pageTitleEl.innerHTML = getTranslation('page_title_historical');
        if (subtitleEl) subtitleEl.innerHTML = getTranslation('subtitle_historical');
    }
    
    if (cardTitle) cardTitle.innerHTML = `${getTranslation('last_change')} ${pairLabel} ${flagsHtml}`;
    if (chartTitle) chartTitle.innerHTML = `${getTranslation('chart_trend')} ${pairLabel} ${flagsHtml}`;
}

// getFlagClass moved to APP_UTILS

// Navigation View Logic
const navOverviewTriggers = document.querySelectorAll('#navOverview, #headerNavOverview');
const navDatabaseTriggers = document.querySelectorAll('#navDatabase, #headerNavDatabase');
const viewOverview = document.getElementById('viewOverview');
const viewDatabase = document.getElementById('viewDatabase');

const switchView = (targetView) => {
    if (targetView === 'overview') {
        navOverviewTriggers.forEach(btn => btn.classList.add('active'));
        navDatabaseTriggers.forEach(btn => btn.classList.remove('active'));
        viewOverview.classList.remove('hidden');
        viewDatabase.classList.add('hidden');
        document.body.classList.remove('database-view-active');
    } else {
        navDatabaseTriggers.forEach(btn => btn.classList.add('active'));
        navOverviewTriggers.forEach(btn => btn.classList.remove('active'));
        viewDatabase.classList.remove('hidden');
        viewOverview.classList.add('hidden');
        document.body.classList.add('database-view-active');
        renderFullDatabaseTable();
        // Removed scroll-to-bottom logic as we now show most recent first
    }
    updateLabels();
};

navOverviewTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('overview');
    });
});

navDatabaseTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        switchView('database');
    });
});

// Export Excel functionality
document.getElementById('exportExcelBtn').addEventListener('click', exportDatabaseToExcel);

// --- Initialization Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // ALWAYS Default to EUR / USD on load as requested
    currentBaseCurrency = 'EUR';
    currentTargetCurrency = 'USD';

    updateGroupTitles();

    // Start data fetch process on load
    initializeData();

    // Set initial values for inputs
    if (customBaseInput) {
        customBaseInput.value = currentBaseCurrency;
    }
    if (customTargetInput) {
        customTargetInput.value = currentTargetCurrency;
    }
    updateCustomFlags();
    
    // Init search overlay
    fetchAllAvailableCurrencies();
    setupSearchListeners();

    // Listen for language changes to update UI components
    window.addEventListener('languageChanged', () => {
        updateDashboardUI();
    });

    // Listen for theme changes to update chart colors
    window.addEventListener('themeChanged', () => {
        updateDashboardUI();
    });
});

async function initializeData() {
    console.log("Initializing Dashboard Data Integration...");
    
    // Abort any existing sync process
    if (syncAbortController) {
        syncAbortController.abort();
    }
    syncAbortController = new AbortController();
    const currentSignal = syncAbortController.signal;

    const globalLoader = document.getElementById('globalLoader');
    const dashboardDataContainer = document.getElementById('dashboardData');

    try {
        // Pass the signal to the fetch process
        await fetchLiveData(currentSignal);
        
        // If aborted, stop here
        if (currentSignal.aborted) return;

        // Hide loader, show dashboard content
        if(globalLoader) globalLoader.classList.add('hidden');
        if(dashboardDataContainer) dashboardDataContainer.classList.remove('hidden');
        
        // Final UI updates
        // REMOVED redundant updateDashboardUI() here as fetchLiveData already handles initial and background renders efficiently
    } catch (e) {
        if (e.name === 'AbortError') return;
        console.error("Initialization Failed", e);
        if(globalLoader) {
            globalLoader.innerHTML = `
                <div class="upload-card">
                    <div class="upload-icon-container" style="color: var(--danger);">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <h2>${getTranslation('error_connection_title')}</h2>
                    <p>${getTranslation('error_connection_text')}</p>
                </div>
            `;
        }
    }
}

// historicalBrlRateList removed and replaced by historicalRateList below

// Re-render all dashboard elements
function updateDashboardUI() {
    console.log(`Updating dashboard with base currency: ${currentBaseCurrency}`);

    // Update the UI texts
    const latestRateElement = document.getElementById('latestRate');
    if (latestRateElement && historicalRateList.length > 0) {
        // Assume last item is the most recent
        const lastRecord = historicalRateList[historicalRateList.length - 1];
        const prevRecord = historicalRateList.length > 1 ? historicalRateList[historicalRateList.length - 2] : null;

        latestRateElement.innerHTML = APP_UTILS.formatCurrency(lastRecord.rate, currentTargetCurrency);

        const trendEl = document.getElementById('brlTrend');
        const trendParent = trendEl.parentElement;

        if (prevRecord && prevRecord.rate) {
            const diff = lastRecord.rate - prevRecord.rate;
            const percentChange = (diff / prevRecord.rate) * 100;

            if (percentChange >= 0) {
                trendParent.className = 'trend positive'; 
                trendParent.innerHTML = `<i class="fa-solid fa-arrow-up"></i> <span id="brlTrend">${Math.abs(percentChange).toFixed(2)}%</span> ${getTranslation('from_prev')}`;
            } else {
                trendParent.className = 'trend negative';
                trendParent.innerHTML = `<i class="fa-solid fa-arrow-down"></i> <span id="brlTrend">${Math.abs(percentChange).toFixed(2)}%</span> ${getTranslation('from_prev')}`;
            }
        }
    }

    updateLabels();

    // Render the chart
    renderChart();

    // Render the tables
    renderTable();
    
    // Only render full database if actually visible to save massive CPU cycles
    const viewDatabase = document.getElementById('viewDatabase');
    if (viewDatabase && !viewDatabase.classList.contains('hidden')) {
        renderFullDatabaseTable();
    }
}

const SAFE_HISTORY_DATA = {
    'EUR_BRL': [
        { d: "01/01/2016", r: 4.30 }, { d: "01/01/2020", r: 4.60 }, 
        { d: "01/01/2025", r: 6.18 }
    ],
    'USD_BRL': [
        { d: "01/01/2016", r: 3.90 }, { d: "01/01/2020", r: 4.05 }, 
        { d: "01/01/2025", r: 5.85 }
    ],
    'EUR_USD': [
        { d: "01/01/2016", r: 1.09 }, { d: "01/01/2020", r: 1.12 }, 
        { d: "01/01/2025", r: 1.05 }
    ],
    'USD_EUR': [
        { d: "01/01/2016", r: 0.92 }, { d: "01/01/2020", r: 0.89 }, 
        { d: "01/01/2025", r: 0.95 }
    ]
};

let historicalRateList = [];

async function fetchLiveData(signal) {
    const today = new Date();
    console.log(`Starting Progressive Sync (Mode: ${currentBaseCurrency}/${currentTargetCurrency})...`);
    const statusEl = document.getElementById('syncStatus');
    const storageKey = `forex_api_data_${currentBaseCurrency}_${currentTargetCurrency}`;
    const uniqueMap = new Map();

    // 2. RECUPERO CACHE (Istante)
    try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                const limit = new Date(); limit.setFullYear(today.getFullYear() - 10);
                parsed.forEach(item => {
                    if (!item.dateObj || !item.dateStr || item.rate === undefined) return;
                    const dObj = new Date(item.dateObj);
                    if (dObj >= limit) {
                        if (!item.isLive) return;
                        uniqueMap.set(item.dateStr, { ...item, dateObj: dObj });
                    }
                });
            }
        }
    } catch (e) {
        console.warn("Could not load cache for", storageKey, e);
    }

    // 3. RENDER IMMEDIATO
    if (signal && signal.aborted) return;
    
    // Se la cache è vuota, aggiungiamo un dato statico di emergenza per non mostrare il grafico vuoto mentre carica
    if (uniqueMap.size === 0) {
        const pairKey = `${currentBaseCurrency}_${currentTargetCurrency}`;
        if (SAFE_HISTORY_DATA[pairKey]) {
            SAFE_HISTORY_DATA[pairKey].forEach(item => {
                const dObj = APP_UTILS.parseDate(item.d);
                uniqueMap.set(item.d, { dateStr: item.d, rate: item.r, dateObj: dObj, isLive: false });
            });
        }
    }
    
    saveAndRenderAll(uniqueMap, storageKey, true); // initial render

    // 4. AVVIO SYNC API IN BACKGROUND (CON DEBOUNCE)
    if (statusEl) statusEl.innerHTML = `<i class="fa-solid fa-sync fa-spin"></i> ${getTranslation('sync_progress')}`;
    
    // Timeout per evitare che il sync parta troppo velocemente durante lo switch di valute
    setTimeout(async () => {
        try {
            if (signal && signal.aborted) return;
            const today = new Date();
            const startDay = new Date(); startDay.setDate(today.getDate() - 90);
            
            // Scarica ultimi 3 mesi
            await fetchAndMergeRange(startDay, today, uniqueMap, signal);
            if (signal && signal.aborted) return;
            
            // Salva ma non renderizzare tutto il Database ancora (pesante)
            syncGlobalList(uniqueMap);
            saveToCache(storageKey, historicalRateList);
            renderChart(); 
            renderTable();

            // Scarica tutto lo storico mancante
            await backgroundDeepSync(uniqueMap, storageKey, signal);
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn("Background sync error", err);
            if (statusEl) statusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${getTranslation('offline_mode')}`;
        }
    }, 500);

    return true; 
}

async function fetchAndMergeRange(start, end, map, signal) {
    const sStr = start.toISOString().split('T')[0];
    const eStr = end.toISOString().split('T')[0];
    try {
        let url = `https://api.frankfurter.app/${sStr}..${eStr}?to=${currentTargetCurrency}`;
        if (currentBaseCurrency !== 'EUR') url += `&from=${currentBaseCurrency}`;
        
        console.log(`Fetching: ${url}`);
        const response = await fetch(url, { signal: signal });

        if (response.ok) {
            const data = await response.json();
            if (data && data.rates) {
                let added = 0;
                for (const [dStr, rates] of Object.entries(data.rates)) {
                    if (rates[currentTargetCurrency]) {
                        const p = dStr.split('-');
                        const dObj = new Date(p[0], p[1]-1, p[2]);
                        const label = `${String(dObj.getDate()).padStart(2,'0')}/${String(dObj.getMonth()+1).padStart(2,'0')}/${dObj.getFullYear()}`;
                        map.set(label, { dateStr: label, rate: rates[currentTargetCurrency], dateObj: dObj, isLive: true });
                        added++;
                    }
                }
                console.log(`Merged ${added} records for ${currentBaseCurrency}/${currentTargetCurrency}`);
            }
        } else {
            console.warn(`API responded with status: ${response.status} for ${url}`);
        }
    } catch (err) {
        if (err.name !== 'AbortError') console.error(`Fetch error for ${currentBaseCurrency}/${currentTargetCurrency}:`, err);
    }
}

async function backgroundDeepSync(map, key, signal) {
    const statusEl = document.getElementById('syncStatus');
    const today = new Date();
    
    const years = [];
    const limitYear = today.getFullYear() - 10;
    for (let y = today.getFullYear(); y >= limitYear; y--) {
        years.push(y);
    }
    
    let batchCount = 0;
    for (let year of years) {
        if (signal && signal.aborted) return;
        
        const count = Array.from(map.values()).filter(d => d.dateObj.getFullYear() === year).length;

        // Se mancano dati per quell'anno, scaricali
        if (count < 100) {
            if (statusEl) statusEl.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> ${getTranslation('syncing_year', {year})}`;
            
            const startY = new Date(year, 0, 1);
            const endY = new Date(year, 11, 31);
            const fetchEnd = endY > today ? today : endY;

            await fetchAndMergeRange(startY, fetchEnd, map, signal);
            if (signal && signal.aborted) return;
            
            // Aggiorniamo la lista globale e la cache
            syncGlobalList(map);
            saveToCache(key, historicalRateList);
            
            // Ogni 2 anni scaricati, rinfreschiamo la UI per mostrare progresso
            batchCount++;
            if (batchCount % 2 === 0) {
                // Background sync only refreshes chart and simple table automatically
                // Full database table is left to the user to avoid freezing
                renderChart();
                renderTable();
            }
            
            await new Promise(r => setTimeout(r, 100)); // Non blocchiamo troppo a lungo
        }
    }
    
    if (signal && signal.aborted) return;
    
    // Fine sincronizzazione: rinfreschiamo la UI finale
    syncGlobalList(map);
    saveToCache(key, historicalRateList);
    updateDashboardUI();
    
    if (statusEl) statusEl.innerHTML = `<i class="fa-solid fa-check-circle" style="color:var(--success)"></i> ${getTranslation('sync_complete')}`;
}

/**
 * Robustly updates historicalRateList from the map, ensuring no duplicates or invalid dates
 */
function syncGlobalList(mapReference) {
    if (!mapReference) return;
    historicalRateList = Array.from(mapReference.values())
        .filter(d => d.dateObj && !isNaN(d.dateObj.getTime()))
        .sort((a,b) => a.dateObj - b.dateObj);
}

function saveAndRenderAll(map, key, fullRender = false) {
    syncGlobalList(map);
    saveToCache(key, historicalRateList);
    
    if (fullRender) {
        updateDashboardUI();
    }
}



function saveToCache(key, list) {
    if (!list || list.length === 0) return;
    try {
        const cleanData = list.map(item => ({
            dateStr: item.dateStr,
            rate: item.rate,
            dateObj: item.dateObj instanceof Date ? item.dateObj.toISOString() : new Date(item.dateObj).toISOString(),
            isLive: item.isLive
        }));
        localStorage.setItem(key, JSON.stringify(cleanData));
    } catch (err) { 
        console.warn("Storage error", err);
    }
}

// Tasto Reset Cache - No timeout needed if script is at end of body
document.addEventListener('DOMContentLoaded', () => {
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm(getTranslation('reset_confirm', {pair: `${currentBaseCurrency}/${currentTargetCurrency}`}))) {
                const storageKey = `forex_api_data_${currentBaseCurrency}_${currentTargetCurrency}`;
                localStorage.removeItem(storageKey);
                location.reload();
            }
        });
    }
});



// formatCurrency and parseDate moved to APP_UTILS

// formatNumberWithSeparators replaced by APP_UTILS.formatNumber

let historicalChartInstance = null;
let activeChartFrame = '1m'; // Default to 1 Month

// Setup Chart Filter Listeners
const chartFilterBtns = document.querySelectorAll('.chart-filter-btn');
if (chartFilterBtns.length > 0 && !chartFilterBtns[0].dataset.listenerAdded) {
    chartFilterBtns.forEach(btn => {
        btn.dataset.listenerAdded = 'true';
        btn.addEventListener('click', (e) => {
            chartFilterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeChartFrame = e.target.getAttribute('data-range');
            renderChart();
        });
    });
}

function renderChart() {
    const chartCanvas = document.getElementById('historicalChart');
    if (!chartCanvas) return;
    
    const ctx = chartCanvas.getContext('2d');

    if (historicalChartInstance) {
        historicalChartInstance.destroy();
    }

    let chartData = [...historicalRateList];
    if (chartData.length === 0) return;

    // Applica filtro temporale grafico
    if (activeChartFrame === '5y') {
        const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - 5);
        chartData = chartData.filter(d => d.dateObj >= cutoff);
    } else if (activeChartFrame === '1y') {
        const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - 1);
        chartData = chartData.filter(d => d.dateObj >= cutoff);
    } else if (activeChartFrame === '6m') {
        const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 6);
        chartData = chartData.filter(d => d.dateObj >= cutoff);
    } else if (activeChartFrame === '3m') {
        const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 3);
        chartData = chartData.filter(d => d.dateObj >= cutoff);
    } else if (activeChartFrame === '1m') {
        const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 1);
        chartData = chartData.filter(d => d.dateObj >= cutoff);
    }
    
    // Fallback: Se il filtro ha svuotato i dati (es. valute con dati vecchi come RUB) 
    // ma abbiamo dati nello storico, mostriamo gli ultimi 30 record disponibili.
    if (chartData.length === 0 && historicalRateList.length > 0) {
        chartData = [...historicalRateList].slice(-30);
    }

    const labels = chartData.map(d => d.dateStr); // Use daily date string rather than Month Label
    const dataPoints = chartData.map(d => d.rate);

    // Calculate average for the selected period
    const sum = dataPoints.reduce((acc, val) => acc + val, 0);
    const avg = dataPoints.length > 0 ? sum / dataPoints.length : 0;
    const avgDataPoints = Array(dataPoints.length).fill(avg);

    historicalChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
            {
                label: getTranslation('period_avg'),
                data: avgDataPoints,
                borderColor: '#ef4444',
                borderWidth: 1.5,
                pointRadius: 0,
                pointHoverRadius: 0,
                fill: false,
                tension: 0
            },
            {
                label: `${currentTargetCurrency} vs ${currentBaseCurrency}`,
                data: dataPoints,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                pointRadius: (activeChartFrame === '1y' || activeChartFrame === '5y' || activeChartFrame === 'all') ? 0 : 3,
                pointHoverRadius: 6,
                pointBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-sidebar').trim() || '#0f172a',
                pointBorderColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-primary').trim() || '#3b82f6',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            layout: {
                padding: {
                    bottom: 25,
                    left: 10,
                    right: 10,
                    top: 10
                }
            },
            animation: false, 
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.dataset.label || '';
                            const formattedVal = APP_UTILS.formatCurrency(context.parsed.y, currentTargetCurrency);
                            return `${label}: ${formattedVal}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || 'rgba(255, 255, 255, 0.05)' },
                    ticks: { 
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#94a3b8', 
                        maxTicksLimit: window.innerWidth < 768 ? 6 : 12 // Reduced ticks for mobile
                    }
                },
                y: {
                    grid: { color: getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#94a3b8' }
                }
            }
        }
    });
}

function getMonthlyClosings() {
    if (historicalRateList.length === 0) return [];

    const monthlyMap = new Map();
    const monthlyStats = new Map();

    historicalRateList.forEach(item => {
        let monthYear = `${item.dateObj.getMonth() + 1}-${item.dateObj.getFullYear()}`;

        if (!monthlyStats.has(monthYear)) {
            monthlyStats.set(monthYear, { sum: 0, count: 0 });
        }
        let stats = monthlyStats.get(monthYear);
        stats.sum += item.rate;
        stats.count += 1;

        // Since it's sorted, overwriting means we keep the last date of the month (chiusura)
        monthlyMap.set(monthYear, {
            monthLabel: `${item.dateObj.toLocaleString(currentLanguage === 'it' ? 'it-IT' : currentLanguage, { month: 'short' }).toUpperCase()} ${item.dateObj.getFullYear()}`,
            dateObj: item.dateObj,
            rate: item.rate,
            dateStr: item.dateStr,
            isLive: item.isLive || false
        });
    });

    const result = Array.from(monthlyMap.values());
    result.forEach(monthItem => {
        let monthYear = `${monthItem.dateObj.getMonth() + 1}-${monthItem.dateObj.getFullYear()}`;
        let stats = monthlyStats.get(monthYear);
        monthItem.avgRate = stats.sum / stats.count;
    });

    return result;
}

function renderTable() {
    const tbody = document.querySelector('#monthlyTable tbody');
    tbody.innerHTML = '';

    const monthlyData = getMonthlyClosings();
    monthlyData.reverse(); // user requested newest on top

    monthlyData.forEach((data, index) => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td><strong>${data.monthLabel}</strong></td>
            <td>${data.dateStr}</td>
            <td style="color: var(--accent-primary); font-weight: 500;">${APP_UTILS.formatNumber(data.rate)}</td>
            <td style="color: var(--text-secondary); font-weight: 500;">${APP_UTILS.formatNumber(data.avgRate)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Listeners are added inline via HTML instead of dynamically, or we fetch them at runtime
function applyDatabaseFilters() {
    renderFullDatabaseTable();
}

function renderFullDatabaseTable(limit = 100) {
    const tbody = document.querySelector('#fullDatabaseTable tbody');
    if (!tbody) return;

    if (historicalRateList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 40px; color: var(--text-secondary);">
            <i class="fa-solid fa-sync fa-spin" style="margin-right: 10px;"></i> ${getTranslation('sync_progress')}...
        </td></tr>`;
        return;
    }

    const filterPeriodFromSelect = document.getElementById('filterPeriodFrom');
    const filterPeriodToSelect = document.getElementById('filterPeriodTo');
    const filterClosingSelect = document.getElementById('filterClosing');

    // Add event listeners lazily if they dont exist
    if (filterPeriodFromSelect && !filterPeriodFromSelect.dataset.listenerAdded) {
        filterPeriodFromSelect.addEventListener('change', () => renderFullDatabaseTable());
        filterPeriodFromSelect.dataset.listenerAdded = 'true';
    }
    if (filterPeriodToSelect && !filterPeriodToSelect.dataset.listenerAdded) {
        filterPeriodToSelect.addEventListener('change', () => renderFullDatabaseTable());
        filterPeriodToSelect.dataset.listenerAdded = 'true';
    }
    if (filterClosingSelect && !filterClosingSelect.dataset.listenerAdded) {
        filterClosingSelect.addEventListener('change', () => renderFullDatabaseTable());
        filterClosingSelect.dataset.listenerAdded = 'true';
    }

    // Refresh Dropdown PERIODS (only if needed or count changed)
    const uniquePeriods = new Set();
    historicalRateList.forEach(d => {
        const mm = String(d.dateObj.getMonth() + 1).padStart(2, '0');
        const yyyy = d.dateObj.getFullYear();
        // Use YYYY-MM for value to allow easy string comparison for range
        uniquePeriods.add(`${yyyy}-${mm}`);
    });

    if (filterPeriodFromSelect && (filterPeriodFromSelect.options.length - 1 !== uniquePeriods.size)) {
        const prevFrom = filterPeriodFromSelect.value;
        const prevTo = filterPeriodToSelect ? filterPeriodToSelect.value : 'all';

        const sortedVal = Array.from(uniquePeriods).sort().reverse(); // Newest first

        [filterPeriodFromSelect, filterPeriodToSelect].forEach(sel => {
            if (!sel) return;
            sel.innerHTML = `<option value="all">${getTranslation('all_periods')}</option>`;
            sortedVal.forEach(val => {
                const [y, m] = val.split('-');
                sel.add(new Option(`${getTranslation('mese_prefix')}${m}/${y}`, val));
            });
        });

        filterPeriodFromSelect.value = prevFrom;
        if(filterPeriodToSelect) filterPeriodToSelect.value = prevTo;
    }

    const selectedFrom = filterPeriodFromSelect ? filterPeriodFromSelect.value : 'all';
    const selectedTo = filterPeriodToSelect ? filterPeriodToSelect.value : 'all';
    const selectedClosing = filterClosingSelect ? filterClosingSelect.value : 'all';

    const monthlyClosingsSet = new Set(getMonthlyClosings().map(m => m.dateStr));
    let matchCount = 0;
    const fragment = document.createDocumentFragment();

    // Reverse the list to show newest first in the database
    const sortedList = [...historicalRateList].reverse();

    for (let i = 0; i < sortedList.length; i++) {
        const data = sortedList[i];
        const isClosing = monthlyClosingsSet.has(data.dateStr);

        if (selectedClosing === 'closingOnly' && !isClosing) continue;
        
        const dataYYYYMM = `${data.dateObj.getFullYear()}-${String(data.dateObj.getMonth() + 1).padStart(2, '0')}`;
        if (selectedFrom !== 'all' && dataYYYYMM < selectedFrom) continue;
        if (selectedTo !== 'all' && dataYYYYMM > selectedTo) continue;

        matchCount++;
        const tr = document.createElement('tr');
        if (isClosing) tr.className = 'row-closing';
        
        tr.innerHTML = `
            <td class="${isClosing ? 'cell-highlight' : ''}">${data.dateStr}</td>
            <td class="${isClosing ? 'cell-highlight' : ''}">${APP_UTILS.formatNumber(data.rate)}</td>
            <td>${isClosing ? `<i class="fa-solid fa-check cell-highlight"></i> ${getTranslation('yes')}` : '-'}</td>
            <td>${data.isLive ? `<span style="color:var(--accent-primary)">${getTranslation('api_live')}</span>` : `<span style="color:var(--text-secondary)">${getTranslation('historical')}</span>`}</td>
        `;
        fragment.appendChild(tr);

        // Limit for initial render to avoid freeze, but allow "Show All"
        if (limit && matchCount >= limit && selectedFrom === 'all' && selectedTo === 'all' && selectedClosing === 'all') break;
    }

    tbody.innerHTML = '';
    tbody.appendChild(fragment);

    // Se ci sono più dati del limite, aggiungiamo il tasto "Mostra Tutto" in una riga separata (non nel fragment per performance)
    if (limit && matchCount >= limit && sortedList.length > limit && selectedFrom === 'all' && selectedTo === 'all' && selectedClosing === 'all') {
        const moreRow = document.createElement('tr');
        moreRow.innerHTML = `
            <td colspan="4" style="text-align:center; padding:20px;">
                <button class="btn-primary-small" style="margin:0 auto;" onclick="renderFullDatabaseTable(0)">
                    <i class="fa-solid fa-list"></i> Mostra tutto lo storico (${sortedList.length} righe)
                </button>
            </td>
        `;
        tbody.appendChild(moreRow);
    }
}

function exportDatabaseToExcel() {
    if (historicalRateList.length === 0) {
        alert(getTranslation('no_data_export'));
        return;
    }

    // Identifica le chiusure (fine mese) per l'evidenziazione
    const monthlyClosingsSet = new Set(getMonthlyClosings().map(m => m.dateStr));

    // Get filter values from UI for export consistency
    const filterPeriodFromSelect = document.getElementById('filterPeriodFrom');
    const filterPeriodToSelect = document.getElementById('filterPeriodTo');
    const filterClosingSelect = document.getElementById('filterClosing');
    const selectedFrom = filterPeriodFromSelect ? filterPeriodFromSelect.value : 'all';
    const selectedTo = filterPeriodToSelect ? filterPeriodToSelect.value : 'all';
    const selectedClosing = filterClosingSelect ? filterClosingSelect.value : 'all';

    // Prepara i dati per l'esportazione
    // Array di oggetti per comodità, SheetJS li trasformerà in celle
    const exportData = [];

    // Intestazione personalizzata
    exportData.push([
        getTranslation('col_date'),
        getTranslation('col_closing_rate'),
        getTranslation('col_month_closing'),
        getTranslation('col_source')
    ]);

    // Usiamo lo stesso ordine della UI (dal più vecchio al più recente)
    const exportList = [...historicalRateList];

    exportList.forEach(data => {
        const isClosing = monthlyClosingsSet.has(data.dateStr);

        // Apply Filters to exported data too
        if (selectedClosing === 'closingOnly' && !isClosing) return;

        const dataYYYYMM = `${data.dateObj.getFullYear()}-${String(data.dateObj.getMonth() + 1).padStart(2, '0')}`;
        if (selectedFrom !== 'all' && dataYYYYMM < selectedFrom) return;
        if (selectedTo !== 'all' && dataYYYYMM > selectedTo) return;

        exportData.push([
            data.dateStr,
            data.rate,
            isClosing ? getTranslation('yes') : "",
            data.isLive ? getTranslation('api_live') : getTranslation('historical')
        ]);
    });

    // Crea un workbook vuoto
    if (typeof XLSX === 'undefined') {
        alert("Libreria di esportazione non caricata. Controlla la connessione.");
        return;
    }
    const wb = XLSX.utils.book_new();

    // Converte l'array di array in un worksheet
    const ws = XLSX.utils.aoa_to_sheet(exportData);

    // Applica stili (Sfondo Azzurro per le righe di chiusura mese - Matching UI)
    const range = XLSX.utils.decode_range(ws['!ref']);

    // Stile Intestazione
    const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "3B82F6" } }, // Match accent-primary
        alignment: { horizontal: "center" }
    };

    // Stile Chiusura (Giallo morbido - Match UI)
    const closingStyle = {
        fill: { fgColor: { rgb: "FEF9C3" } }, // Soft yellow
        font: { bold: true, color: { rgb: "854D0E" } } // Dark yellow/brown text
    };

    const normalStyle = {
        font: { color: { rgb: "000000" } }
    };

    for (let R = range.s.r; R <= range.e.r; ++R) {
        // Controllo se è una riga di chiusura (colonna 2 -> indice C, se 'Sì')
        let isClosing = false;
        if (R > 0) {
            const checkCellAddress = XLSX.utils.encode_cell({ r: R, c: 2 });
            const checkCell = ws[checkCellAddress];
            if (checkCell && checkCell.v === getTranslation('yes')) {
                isClosing = true;
            }
        }

        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress]) continue;

            if (R === 0) {
                // Header style
                ws[cellAddress].s = headerStyle;
            } else if (isClosing) {
                ws[cellAddress].s = closingStyle;
            } else {
                ws[cellAddress].s = normalStyle;
            }
        }
    }

    // Aggiusta la larghezza delle colonne
    ws['!cols'] = [
        { wch: 15 }, // Data
        { wch: 20 }, // Tasso
        { wch: 25 }, // Chiusura
        { wch: 15 }  // Fonte
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Database Storico");

    // Salva il file
    const fileName = `FOREX_${currentBaseCurrency}_${currentTargetCurrency}_Historical_Data.xlsx`;
    XLSX.writeFile(wb, fileName);
}
