// DOM Elements
const uploadOverlay = document.getElementById('uploadOverlay');
const excelFileInput = document.getElementById('excelFileInput');
const dashboardData = document.getElementById('dashboardData');
const baseCurrencyToggles = document.querySelectorAll('.toggle-btn');
const currentBaseCurrencyText = document.getElementById('currentBaseCurrencyText');

// Application State
let appData = null; // Will hold parsed excel data
let currentBaseCurrency = 'EUR'; // Default

// --- Event Listeners Definition ---

// Handle base currency toggle
baseCurrencyToggles.forEach(btn => {
      btn.addEventListener('click', (e) => {
                // Remove active class from all
                                   baseCurrencyToggles.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                                   e.target.classList.add('active');

                                   // Update state
                                   currentBaseCurrency = e.target.getAttribute('data-currency');
                currentBaseCurrencyText.textContent = currentBaseCurrency;

                                   // Fetch new base currency data
                                   const globalLoader = document.getElementById('globalLoader');
                if (globalLoader) globalLoader.classList.remove('hidden');

                                   initializeData();
      });
});

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
});

async function initializeData() {
      console.log("Initializing Dashboard Data Integration...");
      const globalLoader = document.getElementById('globalLoader');
      const dashboardDataContainer = document.getElementById('dashboardData');

    try {
              await fetchLiveData();

          // Hide loader, show dashboard content
          if(globalLoader) globalLoader.classList.add('hidden');
              if(dashboardDataContainer) dashboardDataContainer.classList.remove('hidden');

          // Final UI updates
          updateDashboardUI();
    } catch (e) {
              console.error("Initialization Failed", e);
              if(globalLoader) {
                            globalLoader.innerHTML = `
                                            <div class="upload-card">
                                                                <div class="upload-icon-container" style="color: var(--danger);">
                                                                                        <i class="fa-solid fa-triangle-exclamation"></i>
                                                                                                            </div>
                                                                                                                                <h2>Errore di Connessione</h2>
                                                                                                                                                    <p>Impossibile recuperare i dati dalla Banca Centrale Europea al momento. Controlla la tua connessione o riprova piu tardi.</p>
                                                                                                                                                                    </div>
                                                                                                                                                                                `;
              }
    }
}

let historicalBrlRateList = [];

// Re-render all dashboard elements
function updateDashboardUI() {
      console.log(`Updating dashboard with base currency: ${currentBaseCurrency}`);

    // Update the UI texts
    const latestBrlRateElement = document.getElementById('latestBrlRate');
      if (historicalBrlRateList.length > 0) {
                // Assume last item is the most recent
          const lastRecord = historicalBrlRateList[historicalBrlRateList.length - 1];
                const prevRecord = historicalBrlRateList.length > 1 ? historicalBrlRateList[historicalBrlRateList.length - 2] : null;

          latestBrlRateElement.innerHTML = `${formatCurrency(lastRecord.rate, currentBaseCurrency)}`;

          const trendEl = document.getElementById('brlTrend');
                const trendParent = trendEl.parentElement;

          if (prevRecord && prevRecord.rate) {
                        const diff = lastRecord.rate - prevRecord.rate;
                        const percentChange = (diff / prevRecord.rate) * 100;

                    if (percentChange >= 0) {
                                      // For BRL rates (e.g. 6.12 EUR/BRL), if rate goes up, BRL loses value.
                            trendParent.className = 'trend positive'; // Can keep as positive stylistically or change semantic meaning later.
                            trendParent.innerHTML = `<i class="fa-solid fa-arrow-up"></i> <span id="brlTrend">${Math.abs(percentChange).toFixed(2)}%</span> (da prec.)`;
                    } else {
                                      trendParent.className = 'trend negative';
                                      trendParent.innerHTML = `<i class="fa-solid fa-arrow-down"></i> <span id="brlTrend">${Math.abs(percentChange).toFixed(2)}%</span> (da prec.)`;
                    }
          }
      }

    // Render the chart
    renderChart();

    // Render the tables
    renderTable();
      renderFullDatabaseTable();
}

async function fetchLiveData() {
      try {
                console.log("Fetching live historical data from API...");

          // 1. CARICAMENTO DAL LOCAL STORAGE
          // Carichiamo i dati API storicizzati precedentemente
          const storageKey = `forex_api_data_${currentBaseCurrency}`;
                let localApiData = [];
                try {
                              const saved = localStorage.getItem(storageKey);
                              if (saved) {
                                                localApiData = JSON.parse(saved);
                                                console.log(`Loaded ${localApiData.length} records from LocalStorage for ${currentBaseCurrency}`);
                              }
                } catch (err) {
                              console.warn("Could not read from LocalStorage", err);
                }

          // 2. DETERMINARE LA DATA DI PARTENZA PER L'API
          // Di default partiamo dal 1 Gennaio 2010 per avere uno storico profondo
          let startDateObj = new Date('2010-01-01');

          // Se abbiamo dati salvati, cerchiamo la data piu recente per non riscaricare tutto
          if (localApiData.length > 0) {
                        // Ordina i dati locali in modo cronologico puro
                    localApiData.sort((a, b) => new Date(a.dateObj) - new Date(b.dateObj));

                    // Prendi la data dell'ultimo record salvato e aggiungi un giorno
                    const lastSavedDate = new Date(localApiData[localApiData.length - 1].dateObj);
                        startDateObj = new Date(lastSavedDate);
                        startDateObj.setDate(startDateObj.getDate() + 1); // Parti dal giorno successivo
          }

          // Costruiamo le date sotto forma di stringhe "YYYY-MM-DD" per l'API
          const today = new Date();
                const yyyyToday = today.getFullYear();
                const mmToday = String(today.getMonth() + 1).padStart(2, '0');
                const ddToday = String(today.getDate()).padStart(2, '0');
                const todayStr = `${yyyyToday}-${mmToday}-${ddToday}`;

          const yyyyStart = startDateObj.getFullYear();
                const mmStart = String(startDateObj.getMonth() + 1).padStart(2, '0');
                const ddStart = String(startDateObj.getDate()).padStart(2, '0');
                const startStr = `${yyyyStart}-${mmStart}-${ddStart}`;

          // Controlliamo se la data di inizio e nel futuro o uguale a oggi (e se abbiamo gia scaricato oggi)
          // Se startDateObj super today, non facciamo fetch
          let isFetchNeeded = true;
                if (startDateObj > today) {
                              isFetchNeeded = false;
                              console.log("No new data to fetch. LocalStorage is already up to date.");
                }

          // 3. RECUPERO NUOVI DATI DALL'API (se necessario)
          if (isFetchNeeded) {
                        console.log(`Fetching from API: da ${startStr} a ${todayStr}`);
                        let url = '';
                        if (currentBaseCurrency === 'EUR') {
                                          url = `https://api.frankfurter.app/${startStr}..${todayStr}?to=BRL`;
                        } else {
                                          url = `https://api.frankfurter.app/${startStr}..${todayStr}?from=USD&to=BRL`;
                        }

                    const response = await fetch(url);

                    if (response.ok) {
                                      const data = await response.json();

                            // data.rates is an object with dates as keys: { "2026-01-02": {"BRL": 6.1}, ... }
                            if (data && data.rates) {
                                                  let newRecordsCount = 0;

                                          // Strict Map deduplication to ensure dates are never duplicated
                                          const uniqueMap = new Map();
                                                  localApiData.forEach(item => {
                                                                            uniqueMap.set(item.dateStr, item);
                                                  });

                                          for (const [dateStr, rates] of Object.entries(data.rates)) {
                                                                    if (rates.BRL) {
                                                                                                  const liveRate = rates.BRL;
                                                                                                  const parts = dateStr.split('-');
                                                                                                  const liveDateObj = new Date(parts[0], parts[1] - 1, parts[2]); // local midnight

                                                                        // Re-format date to DD/MM/YYYY for consistency with our app
                                                                        const d = String(liveDateObj.getDate()).padStart(2, '0');
                                                                                                  const m = String(liveDateObj.getMonth() + 1).padStart(2, '0');
                                                                                                  const y = liveDateObj.getFullYear();
                                                                                                  const formattedDate = `${d}/${m}/${y}`;

                                                                        if (!uniqueMap.has(formattedDate)) {
                                                                                                          newRecordsCount++;
                                                                          }

                                                                        // Overwrite or append cleanly
                                                                        uniqueMap.set(formattedDate, {
                                                                                                          dateStr: formattedDate,
                                                                                                          rate: liveRate,
                                                                                                          dateObj: liveDateObj, // We keep the stringified object for JSON
                                                                                                          isLive: true // Everything is API Live now
                                                                          });
                                                                    }
                                          }

                                          // Recover our cleaned array
                                          localApiData = Array.from(uniqueMap.values());

                                          console.log(`Fetched and added ${newRecordsCount} new records from API (after dedup).`);

                                          // 4. SALVATAGGIO NEL LOCAL STORAGE
                                          try {
                                                                    localStorage.setItem(storageKey, JSON.stringify(localApiData));
                                          } catch (err) {
                                                                    console.warn("Could not save to LocalStorage", err);
                                          }
                            }
                    } else {
                                      console.warn(`API non ha restituito dati per il range ${startStr}..${todayStr}. Risposta HTTP: ${response.status}`);
                    }
          }

          // 5. ASSEGNAZIONE ALLA LISTA PUBBLICA E DEDUPLICAZIONE SICURA
          // Eliminiamo eventuali duplicati presenti nel LocalStorage dell'utente usando una Map
          const finalUniqueMap = new Map();
                localApiData.forEach(apiRow => {
                              const realDateObj = new Date(apiRow.dateObj);
                              finalUniqueMap.set(apiRow.dateStr, {
                                                dateStr: apiRow.dateStr,
                                                rate: apiRow.rate,
                                                dateObj: realDateObj,
                                                isLive: true
                              });
                });

          historicalBrlRateList = Array.from(finalUniqueMap.values());

          // 6. RIORDINAMENTO COMPLESSIVO
          historicalBrlRateList.sort((a, b) => a.dateObj - b.dateObj);

          // 7. PULIZIA DELLA CACHE CORROTTA
          // Sovrascriviamo il localStorage con i dati puliti per far sparire per sempre i duplicati vecchi
          try {
                        // Need to convert dateObj back to string format compatible with what we parse
                    const cleanStorageData = historicalBrlRateList.map(item => ({
                                      dateStr: item.dateStr,
                                      rate: item.rate,
                                      dateObj: item.dateObj.toISOString(), // Standardizing the date serialization
                                      isLive: item.isLive
                    }));
                        localStorage.setItem(storageKey, JSON.stringify(cleanStorageData));
          } catch (err) {
                        console.warn("Could not clean LocalStorage", err);
          }

      } catch (e) {
                throw new Error("Errore generico in fetchLiveData. Probabile problema di rete.");
      }
}
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
      return `R$ ${formatNumberWithSeparators(val)}`;
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

    let chartData = [...historicalBrlRateList];

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
                                                label: `Media Periodo`,
                                                data: avgDataPoints,
                                                borderColor: '#ef4444',
                                                borderWidth: 1.5,
                                                pointRadius: 0,
                                                pointHoverRadius: 0,
                                                fill: false,
                                                tension: 0
                              },
                              {
                                                label: `BRL vs ${currentBaseCurrency}`,
                                                data: dataPoints,
                                                borderColor: '#3b82f6',
                                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                borderWidth: 2,
                                                pointRadius: 3,
                                                pointBackgroundColor: '#0f172a',
                                                pointBorderColor: '#3b82f6',
                                                fill: true,
                                                tension: 0.3
                              }]
              },
              options: {
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
                                                                                                                            return `${label}: R$ ${formatNumberWithSeparators(context.parsed.y)}`;
                                                                                                }
                                                                    }
                                              }
                            },
                            scales: {
                                              x: {
                                                                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                                                    ticks: { color: '#94a3b8', maxTicksLimit: 12 }
                                              },
                                              y: {
                                                                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                                                    ticks: { color: '#94a3b8' }
                                              }
                            }
              }
    });
}

function getMonthlyClosings() {
      if (historicalBrlRateList.length === 0) return [];

    const monthlyMap = new Map();
      const monthlyStats = new Map();

    historicalBrlRateList.forEach(item => {
              let monthYear = `${item.dateObj.getMonth() + 1}-${item.dateObj.getFullYear()}`;

                                          if (!monthlyStats.has(monthYear)) {
                                                        monthlyStats.set(monthYear, { sum: 0, count: 0 });
                                          }
              let stats = monthlyStats.get(monthYear);
              stats.sum += item.rate;
              stats.count += 1;

                                          // Since it's sorted, overwriting means we keep the last date of the month (chiusura)
                                          monthlyMap.set(monthYear, {
                                                        monthLabel: `${item.dateObj.toLocaleString('it-IT', { month: 'short' })} ${item.dateObj.getFullYear()}`,
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
          filterPeriodSelect.innerHTML = '<option value="all">Tutti i periodi</option>';

          const uniquePeriods = new Set();
              historicalBrlRateList.forEach(d => {
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
                        const opt = new Option(`Mese: ${p}`, p);
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

    // Show oldest first as per user request
    const sortedList = [...historicalBrlRateList];

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
                                             tr.style.backgroundColor = 'rgba(253, 224, 71, 0.1)'; // subtle yellow background
                               }

                               tr.innerHTML = `
                                           <td style="${isClosing ? 'font-weight: bold; color: #fde047;' : ''}">${data.dateStr}</td>
                                                       <td style="${isClosing ? 'font-weight: bold; color: #fde047;' : ''}">${formatNumberWithSeparators(data.rate)}</td>
                                                                   <td>${isClosing ? '<i class="fa-solid fa-check" style="color:#fde047"></i> Si' : '-'}</td>
                                                                               <td>${data.isLive ? '<span style="color:var(--accent-primary)">API Live</span>' : '<span style="color:var(--text-secondary)">Excel</span>'}</td>
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
      if (historicalBrlRateList.length === 0) {
                alert("Nessun dato da esportare.");
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
    // Array di oggetti per comodita, SheetJS li trasformera in celle
    const exportData = [];

    // Intestazione personalizzata
    exportData.push(["Data", "Tasso Base Valuta", "Chiusura di Fine Mese", "Fonte Dati"]);

    // Usiamo lo stesso ordine della UI (dal piu vecchio al piu recente)
    const exportList = [...historicalBrlRateList];

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
                                             isClosing ? "Si" : "",
                                             data.isLive ? "API Live" : "Excel"
                                         ]);
    });

    if (exportData.length <= 1) {
              alert("Nessun dato corrispondente ai filtri selezionati.");
              return;
    }

    reversedList.forEach(data => {
              exportData.push([
                            data.dateStr,
                            data.rate,
                            monthlyClosingsSet.has(data.dateStr) ? "Si" : "",
                            data.isLive ? "API Live" : "Excel"
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
              // Controllo se e una riga di chiusura (colonna 2 -> indice C, se 'Si')
          let isClosing = false;
              if (R > 0) {
                            const checkCellAddress = XLSX.utils.encode_cell({ r: R, c: 2 });
                            const checkCell = ws[checkCellAddress];
                            if (checkCell && checkCell.v === "Si") {
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
