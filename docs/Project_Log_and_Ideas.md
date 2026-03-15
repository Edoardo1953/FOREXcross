# FOREX Dashboard BRL vs EUR/USD - Diario di Progetto

Questo documento è stato generato automaticamente per conservare lo storico delle modifiche, le decisioni architetturali e la "memoria" del progetto.
È stato posizionato all'interno della cartella dell'applicazione in modo che possa essere facilmente letto sia dall'utente che da future intelligenze artificiali per riprendere il lavoro esattamente da dove è stato interrotto.

## Architettura Corrente (Marzo 2026)
L'applicazione è una SPA (Single Page Application) costruita interamente sul Front-End:
- **HTML/CSS/JS "Vanilla"**: Non utilizza framework complessi, ma puro Javascript per la massima leggerezza e compatibilità nel browser.
- **Integrazione Dati**: 
  - Lettura locale offline di un file Excel originario (`FOREX Calculator.xlsm`) tramite `SheetJS`.
  - Fetch automatico da API (Frankfurter API) per recuperare le differenze giornaliere dal 2026 ad oggi.
  - Memoria Cache: I dati API scaricati dal 2026 sono salvati localmente nel `localStorage` per ridurre il consumo di rete e i tempi di caricamento al riavvio delle sessioni.

## Funzioni Principali Attive
1. **Parser Storico Intelligente**: 
   - Estrae unicamente i dati utili e riconosce matematicamente l'ultimo giorno lavorativo del mese (le "Chiusure Mensili", storicamente evidenziate in Giallo) aggirando errori umani come la mancanza del 31 o date anomale (es. 30/12/2025).
2. **Dashboard Grafica Interattiva** (`Chart.js`):
   - Plot della curva ad altissima risoluzione (ogni singolo giorno plottato per il massimo dettaglio).
   - Snapshot Tools/Zoom: Pulsanti per filtrare rapidamente il grafico (Storico, 5Y, 1Y, 6M, 3M, 1M).
3. **Database Esportabile in Excel**:
   - Una vista a griglia (Tabella) dotata di filtri per isolare i dati per mese/anno o per nascondere i dati "inutili" lasciando in evidenza solo le Chiusure Gialle.
   - Generazione nativa sul PC di un file `.xlsx` fedele ai filtri impostati dall'utente a schermo, perfetto per i revisori.

## Roadmap & Prossimi Passi (I "Gioiellini" Futuri)
Durante la conversazione, sono state discusse e approvate delle migliorie in pipeline:

1. **Persistenza Offline del Database Excel (IndexedDB)**:
   - *Problema attuale*: Il file Excel originale deve essere iniettato o rilasciato nella pagina ad ogni riavvio/Refresh a causa delle norme di sicurezza del browser.
   - *Soluzione*: Integrare `IndexedDB` (il database SQL interno ai browser). Al primo avvio caricherà l'Excel originale, fonderà i dati con le API correnti, e si chiuderà ermeticamente. Ai riavvii futuri o usando l'app dal cellulare, la dashboard caricherà tutto e scaricherà da Internet solo il tasso di scambio del giorno stesso nel momento in cui viene premuto refresh. L'upload manuale del file sarà storia passata.
   
2. **Hosting e Mobile (Serverless)**:
   - Preparazione al deployment su Netlify, Vercel o GitHub Pages, per trasformare il codice residente sulla cartella `.gemini/scratch/FOREX` in un link vero e proprio (`app.miosito.com`) accessibile dal telefono con interfaccia mobile-responsive (la quale è già cablata nel codice grazie ai recenti aggiornamenti CSS).

---
*Note per l'IA*: Quando riprendi questo progetto in futuro, leggi questo file, `index.html` e `app.js` per sincronizzarti istantaneamente. Fai attenzione alla documentazione Inline nei file Javascript.
