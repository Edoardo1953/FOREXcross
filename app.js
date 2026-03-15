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
let currentTargetCurrency = 'BRL';

// NEW: Global Sync Controller to avoid multiple overlapping syncs
let syncAbortController = null;

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
// Handle cross selector toggle
baseCurrencyToggles.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        baseCurrencyToggles.forEach(b => b.classList.remove('active'));
        // Add active to the button itself
        btn.classList.add('active');

        // Update state from the button attributes
        currentBaseCurrency = btn.getAttribute('data-base');
        currentTargetCurrency = btn.getAttribute('data-target');
        
        // Update UI labels
        updateLabels();

        // Fetch new data
        const globalLoader = document.getElementById('globalLoader');
        if (globalLoader) globalLoader.classList.remove('hidden');
        
        initializeData();
    });
});

function updateLabels() {
    const pairLabel = `${currentBaseCurrency}/${currentTargetCurrency}`;
    const baseFlag = getFlagClass(currentBaseCurrency);
    const targetFlag = getFlagClass(currentTargetCurrency);
    const flagsHtml = `<span class="${baseFlag}" style="border-radius:2px; margin-left:8px;"></span><span class="${targetFlag}" style="border-radius:2px; margin-left:2px;"></span>`;

    if (currentPairText) currentPairText.innerHTML = `${pairLabel} ${flagsHtml}`;
    if (pageTitle) pageTitle.innerHTML = `${getTranslation('page_title_historical')} ${pairLabel} ${flagsHtml}`;
    if (cardTitle) cardTitle.innerHTML = `${getTranslation('last_change')} ${pairLabel} ${flagsHtml}`;
    if (chartTitle) chartTitle.innerHTML = `${getTranslation('chart_trend')} ${pairLabel} ${flagsHtml}`;
}

function getFlagClass(currency) {
    switch (currency) {
        case 'EUR': return 'fi fi-eu';
        case 'USD': return 'fi fi-us';
        case 'BRL': return 'fi fi-br';
        case 'GBP': return 'fi fi-gb';
        case 'JPY': return 'fi fi-jp';
        case 'HKD': return 'fi fi-hk';
        default: return '';
    }
}

// Navigation View Logic
const navOverview = document.getElementById('navOverview');
const navDatabase = document.getElementById('navDatabase');
const viewOverview = document.getElementById('viewOverview');
const viewDatabase = document.getElementById('viewDatabase');

navOverview.addEventListener('click', (e) => {
    e.preventDefault();
    navOverview.classList.add('active');
    navDatabase.classList.remove('active');
    viewOverview.classList.remove('hidden');
    viewDatabase.classList.add('hidden');
});

navDatabase.addEventListener('click', (e) => {
    e.preventDefault();
    navDatabase.classList.add('active');
    navOverview.classList.remove('active');
    viewDatabase.classList.remove('hidden');
    viewOverview.classList.add('hidden');

    // Force scroll to bottom when the view is opened
    setTimeout(() => {
        const tbody = document.querySelector('#fullDatabaseTable tbody');
        if (tbody) {
            const tableContainer = tbody.closest('.table-responsive');
            if (tableContainer) {
                tableContainer.scrollTop = tableContainer.scrollHeight;
            }
        }
    }, 100); // 100ms delay to ensure browser has rendered the unhidden div
});

// Export Excel functionality
document.getElementById('exportExcelBtn').addEventListener('click', exportDatabaseToExcel);

// --- Initialization Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Start data fetch process on load
    initializeData();

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
        updateDashboardUI();
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
    if (historicalRateList.length > 0) {
        // Assume last item is the most recent
        const lastRecord = historicalRateList[historicalRateList.length - 1];
        const prevRecord = historicalRateList.length > 1 ? historicalRateList[historicalRateList.length - 2] : null;

        latestRateElement.innerHTML = `${formatCurrency(lastRecord.rate, currentTargetCurrency)}`;

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
    renderFullDatabaseTable();
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
            const limit = new Date(); limit.setFullYear(today.getFullYear() - 10);
            JSON.parse(saved).forEach(item => {
                const dObj = new Date(item.dateObj);
                if (dObj >= limit) {
                    if (!item.isLive) return;
                    uniqueMap.set(item.dateStr, { ...item, dateObj: dObj });
                }
            });
        }
    } catch (e) {}

    // 3. RENDER IMMEDIATO (L'utente vede subito la dashboard con dati statici/cache)
    if (signal && signal.aborted) return;
    saveAndRenderAll(uniqueMap, storageKey, true); // initial render

    // 4. AVVIO SYNC API IN BACKGROUND (NON BLOCCANTE)
    if (statusEl) statusEl.innerHTML = `<i class="fa-solid fa-sync fa-spin"></i> ${getTranslation('sync_progress')}`;
    
    (async () => {
        try {
            if (signal && signal.aborted) return;
            const today = new Date();
            const startDay = new Date(); startDay.setDate(today.getDate() - 90);
            
            // Scarica ultimi 3 mesi
            await fetchAndMergeRange(startDay, today, uniqueMap, signal);
            if (signal && signal.aborted) return;
            saveAndRenderAll(uniqueMap, storageKey, true);
            
            // Scarica tutto lo storico mancante
            await backgroundDeepSync(uniqueMap, storageKey, signal);
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn("Background sync error", err);
            if (statusEl) statusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${getTranslation('offline_mode')}`;
        }
    })();

    return true; 
}

async function fetchAndMergeRange(start, end, map, signal) {
    const sStr = start.toISOString().split('T')[0];
    const eStr = end.toISOString().split('T')[0];
    try {
        let url = `https://api.frankfurter.app/${sStr}..${eStr}?to=${currentTargetCurrency}`;
        if (currentBaseCurrency !== 'EUR') url += `&from=${currentBaseCurrency}`;
        
        const response = await fetch(url, { signal: signal });

        if (response.ok) {
            const data = await response.json();
            if (data && data.rates) {
                for (const [dStr, rates] of Object.entries(data.rates)) {
                    if (rates[currentTargetCurrency]) {
                        const p = dStr.split('-');
                        const dObj = new Date(p[0], p[1]-1, p[2]);
                        const label = `${String(dObj.getDate()).padStart(2,'0')}/${String(dObj.getMonth()+1).padStart(2,'0')}/${dObj.getFullYear()}`;
                        map.set(label, { dateStr: label, rate: rates[currentTargetCurrency], dateObj: dObj, isLive: true });
                    }
                }
            }
        }
    } catch (err) {}
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
            historicalRateList = Array.from(map.values()).sort((a,b) => a.dateObj - b.dateObj);
            saveToCache(key, historicalRateList);
            
            // Ogni 2 anni scaricati, rinfreschiamo la UI per mostrare progresso senza pesare troppo
            batchCount++;
            if (batchCount % 2 === 0) {
                renderFullDatabaseTable();
                renderChart();
            }
            
            await new Promise(r => setTimeout(r, 300)); // Rispetto per l'API
        }
    }
    
    if (signal && signal.aborted) return;
    
    // Fine sincronizzazione: rinfreschiamo tutto
    saveAndRenderAll(map, key, true);
    
    if (statusEl) statusEl.innerHTML = `<i class="fa-solid fa-check-circle" style="color:var(--success)"></i> ${getTranslation('sync_complete')}`;
}

function saveAndRenderAll(map, key, fullRender = false) {
    historicalRateList = Array.from(map.values()).sort((a,b) => a.dateObj - b.dateObj);
    saveToCache(key, historicalRateList);
    
    if (fullRender) {
        renderChart();
        renderTable();
        // Update database table too when a full render is requested (at start and end of sync)
        renderFullDatabaseTable(); 
    }
}

function syncGlobalList(mapReference) {
    historicalRateList = Array.from(mapReference.values())
        .filter(d => !isNaN(d.dateObj.getTime()))
        .sort((a,b) => a.dateObj - b.dateObj);
}

function saveToCache(key, list) {
    try {
        const cleanData = list.map(item => ({
            dateStr: item.dateStr,
            rate: item.rate,
            dateObj: item.dateObj.toISOString(),
            isLive: item.isLive
        }));
        localStorage.setItem(key, JSON.stringify(cleanData));
    } catch (err) { /* silent */ }
}

// Tasto Reset Cache
setTimeout(() => {
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
}, 1000);



function parseDate(dateStr) {
    if (!dateStr) return new Date();
    // Assuming DD/MM/YYYY format based on preview
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return new Date(dateStr); // fallback to standard parsing
}

function formatCurrency(val, currency) {
    if (currency === 'BRL') return `R$ ${formatNumberWithSeparators(val)}`;
    if (currency === 'USD') return `$ ${formatNumberWithSeparators(val)}`;
    if (currency === 'EUR') return `€ ${formatNumberWithSeparators(val)}`;
    return `${currency} ${formatNumberWithSeparators(val)}`;
}

// Custom number formatter to get 1.000,0000 format
function formatNumberWithSeparators(val, decimals = 4) {
    if (val === undefined || val === null || isNaN(val)) return '--';
    const num = Number(val);
    
    // Split into integer and decimal parts
    const parts = num.toFixed(decimals).split('.');
    
    // Add dots for thousands spacing
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    
    // Join with comma for decimals
    return parts.join(',');
}

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
    const ctx = document.getElementById('historicalChart').getContext('2d');

    if (historicalChartInstance) {
        historicalChartInstance.destroy();
    }

    let chartData = [...historicalRateList];

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
                pointRadius: 3,
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
                            const formattedVal = formatCurrency(context.parsed.y, currentTargetCurrency);
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
            <td style="color: var(--accent-primary); font-weight: 500;">${formatNumberWithSeparators(data.rate)}</td>
            <td style="color: var(--text-secondary); font-weight: 500;">${formatNumberWithSeparators(data.avgRate)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Listeners are added inline via HTML instead of dynamically, or we fetch them at runtime
function applyDatabaseFilters() {
    renderFullDatabaseTable();
}

function renderFullDatabaseTable() {
    const tbody = document.querySelector('#fullDatabaseTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (historicalRateList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 40px; color: var(--text-secondary);">
            <i class="fa-solid fa-sync fa-spin" style="margin-right: 10px;"></i> ${getTranslation('sync_progress')}...
        </td></tr>`;
        return;
    }

    // Identify end of month to highlight
    const monthlyClosingsSet = new Set(getMonthlyClosings().map(m => m.dateStr));

    // Get filter elements at execution time to ensure they exist
    const filterPeriodSelect = document.getElementById('filterPeriod');
    const filterClosingSelect = document.getElementById('filterClosing');

    // Add event listeners lazily if they dont exist
    if (filterPeriodSelect && !filterPeriodSelect.dataset.listenerAdded) {
        filterPeriodSelect.addEventListener('change', renderFullDatabaseTable);
        filterPeriodSelect.dataset.listenerAdded = 'true';
    }
    if (filterClosingSelect && !filterClosingSelect.dataset.listenerAdded) {
        filterClosingSelect.addEventListener('change', renderFullDatabaseTable);
        filterClosingSelect.dataset.listenerAdded = 'true';
    }

    // Always regenerate period dropdown options dynamically to prevent caching issues
    if (filterPeriodSelect) {
        // Save previous choice
        const prevChoice = filterPeriodSelect.value;

        // Reset to default
        filterPeriodSelect.innerHTML = `<option value="all">${getTranslation('all_periods')}</option>`;

        const uniquePeriods = new Set();
        historicalRateList.forEach(d => {
            const mm = String(d.dateObj.getMonth() + 1).padStart(2, '0');
            const yyyy = d.dateObj.getFullYear();
            uniquePeriods.add(`${mm}/${yyyy}`);
        });

        // Sort periods descending
        const sortedPeriods = Array.from(uniquePeriods).sort((a, b) => {
            const [mA, yA] = a.split('/');
            const [mB, yB] = b.split('/');
            // yB - yA => sort years descending. Convert to Number to be perfectly safe
            if (yA !== yB) return Number(yB) - Number(yA);
            return Number(mB) - Number(mA);
        });

        sortedPeriods.forEach(p => {
            const opt = new Option(`${getTranslation('mese_prefix')}${p}`, p);
            filterPeriodSelect.add(opt);
        });

        // Restore previous choice if that option still exists
        const optionExists = Array.from(filterPeriodSelect.options).some(o => o.value === prevChoice);
        if (optionExists) {
            filterPeriodSelect.value = prevChoice;
        }
    }

    // Get filter values from the elements (now they are fully rebuilt)
    const selectedPeriod = filterPeriodSelect ? filterPeriodSelect.value : 'all';
    const selectedClosing = filterClosingSelect ? filterClosingSelect.value : 'all';

    // Show newest first as requested in previous conversations, but table logic for Database view usually prefers chronological for scroll to bottom
    const sortedList = [...historicalRateList];

    sortedList.forEach(data => {
        const isClosing = monthlyClosingsSet.has(data.dateStr);

        // Apply Filters
        if (selectedClosing === 'closingOnly' && !isClosing) return;

        if (selectedPeriod !== 'all') {
            const dataPeriod = `${String(data.dateObj.getMonth() + 1).padStart(2, '0')}/${data.dateObj.getFullYear()}`;
            if (dataPeriod !== selectedPeriod) return;
        }

        const tr = document.createElement('tr');

        if (isClosing) {
            tr.classList.add('row-closing');
        }

        tr.innerHTML = `
            <td class="${isClosing ? 'cell-highlight' : ''}">${data.dateStr}</td>
            <td class="${isClosing ? 'cell-highlight' : ''}">${formatNumberWithSeparators(data.rate)}</td>
            <td>${isClosing ? `<i class="fa-solid fa-check cell-highlight"></i> ${getTranslation('yes')}` : '-'}</td>
            <td>${data.isLive ? `<span style="color:var(--accent-primary)">${getTranslation('api_live')}</span>` : `<span style="color:var(--text-secondary)">${getTranslation('historical')}</span>`}</td>
        `;

        tbody.appendChild(tr);
    });

    // Auto-scroll to bottom to show most recent data
    const tableContainer = tbody.closest('.table-responsive');
    if (tableContainer) {
        setTimeout(() => {
            tableContainer.scrollTop = tableContainer.scrollHeight;
        }, 50);
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
    const filterPeriodSelect = document.getElementById('filterPeriod');
    const filterClosingSelect = document.getElementById('filterClosing');
    const selectedPeriod = filterPeriodSelect ? filterPeriodSelect.value : 'all';
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

        if (selectedPeriod !== 'all') {
            const dataPeriod = `${String(data.dateObj.getMonth() + 1).padStart(2, '0')}/${data.dateObj.getFullYear()}`;
            if (dataPeriod !== selectedPeriod) return;
        }

        exportData.push([
            data.dateStr,
            data.rate,
            isClosing ? getTranslation('yes') : "",
            data.isLive ? getTranslation('api_live') : getTranslation('historical')
        ]);
    });

    // Crea un worbook vuoto
    const wb = XLSX.utils.book_new();

    // Converte l'array di array in un worksheet
    const ws = XLSX.utils.aoa_to_sheet(exportData);

    // Applica stili (Sfondo Giallo FFFF00 per le righe di chiusura mese)
    // iteriamo sulle righe e colonne per applicare i colori
    const range = XLSX.utils.decode_range(ws['!ref']);

    // Stile Intestazione
    const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "091B2F" } }, // Dark blue
        alignment: { horizontal: "center" }
    };

    // Stile Chiusura (Giallo)
    const closingStyle = {
        fill: { fgColor: { rgb: "FFFF00" } },
        font: { bold: true, color: { rgb: "000000" } } // Black text on yellow background
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
            if (checkCell && checkCell.v === "Sì") {
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
    const safeCurrency = currentBaseCurrency;
    XLSX.writeFile(wb, `FOREX_Database_Storico_${safeCurrency}.xlsx`);
}
