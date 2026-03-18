
const translations = {
    it: {
        homepage_title: "FOREX Dashboard",
        homepage_subtitle: "Tassi di Cambio",
        nav_eur_usd: "EUR/USD",
        nav_historical_cross: "Cambi<br>Storici",
        loading_rates: "Caricamento tassi di cambio...",
        search_placeholder: "Cerca divisa (es. CAD, Dollaro...)",
        search_add: "Cerca e aggiungi divisa...",
        offline_mode: "Modalità Offline (Tassi indicativi)",
        update_wait: "Aggiornamento...",
        remove_currency: "Rimuovi divisa",
        title_nav_eur_usd: "Vai al Cambio EUR/USD",
        title_nav_historical: "Vai ai Cambi Storici",
        
        // Dashboard
        nav_calculator: "Calcolatore Cambi",
        nav_database: "Database<br>Storico",
        group_main: "Main Crosses",
        group_custom: "Ricerca Cross",
        nav_home: "Calcolatore<br>Cross",
        label_base: "Divisa Base",
        label_target: "Divisa Target",
        btn_fetch: "Cerca Cross",
        page_title_historical: "Tassi Storici",
        subtitle_historical: "Analisi storica",
        sync_init: "Inizializzazione...",
        sync_progress: "Sincronizzazione in corso...",
        sync_complete: "Storico Completo Disponibile",
        clean_cache: "Clear Cache",
        loader_sync_title: "Sincronizzazione Dati Storici",
        loader_sync_text: "Scaricamento delle serie storiche dei tassi di cambio (dal 2010 ad oggi) dalla Banca Centrale Europea...",
        loader_sync_footer: "Questa operazione richiederà pochi secondi la prima volta.",
        last_change: "Ultimo Cambio",
        from_yesterday: "da ieri",
        from_prev: "da prec.",
        chart_trend: "Andamento",
        range_all: "Storico",
        range_5y: "5Y",
        range_1y: "1Y",
        range_6m: "6M",
        range_3m: "3M",
        range_1m: "1M",
        monthly_table_title: "Chiusure Mensili Storiche",
        col_month_year: "Mese/Anno",
        col_last_day: "Ultimo Giorno",
        col_closing_rate: "Tasso Chiusura",
        col_monthly_avg: "Media Mensile",
        db_title: "Historical Database",
        subtitle_database: "Historical Database",
        export_excel: "Esporta in Excel",
        period_label: "Periodo (Mese/Anno)",
        all_periods: "Tutti i periodi",
        closing_only_label: "Solo Chiusure Mensili",
        show_all: "Mostra tutto",
        yellow_rows_only: "Solo Fine Mese (Righe Gialle)",
        col_date: "Data",
        col_day_closing: "Valore Chiusura Giorno (Tasso)",
        col_month_closing: "Chiusura Mese",
        col_source: "Fonte Dati",
        yes: "MONTH END",
        no: "No",
        api_live: "API Live",
        historical: "Storico",
        reset_confirm: "Vuoi davvero cancellare la memoria locale di {pair} e riscaricare tutto dall'API?",
        no_data_export: "Nessun dato da esportare.",
        syncing_year: "Sincronizzazione anno {year}...",
        period_avg: "Media Periodo",
        period_from: "Dal",
        period_to: "Al",
        error_connection_title: "Errore di Connessione",
        error_connection_text: "Impossibile recuperare i dati dalla Banca Centrale Europea al momento. Controlla la tua connessione o riprova più tardi.",
        mese_prefix: "Mese: ",
        sidebar_logo_dash: "Dash",
        settings_title: "Strumenti",
        theme_label: "Colore App",
        theme_light: "Chiaro",
        theme_dark: "Scuro",
        background_label: "Colore Sfondo",
        bg_option_default: "Predefinito",
        bg_option_black: "Nero",
        select_currency_notice: "Seleziona le divise desiderate",
        
        // Share Access
        share_access_title: "Condividi Accesso",
        share_access_desc: "Crea un link con password per fornire accesso temporaneo a terzi.",
        access_password_label: "Password di Accesso",
        access_expiry_label: "Durata Accesso",
        access_1month: "1 Mese",
        access_3months: "3 Mesi",
        access_6months: "6 Mesi",
        access_1year: "1 Anno",
        btn_generate_link: "Genera Link",
        copy_link: "Copia Link",
        link_generated: "Link copiato negli appunti!",
        prompt_password_title: "Accesso Protetto",
        prompt_password_desc: "Inserisci la password fornita per accedere alla dashboard.",
        invalid_password: "Password non valida.",
        access_expired: "L'accesso è scaduto.",
        btn_login: "Entra",
        privacy_title: "Privacy",
        manuals_title: "Manuali",
        manuals_desc: "Guide procedurali e documentazione tecnica.",
        manual_privacy_title: "Guida alla Privacy e Accesso",
        manual_user_title: "Manuale d'Uso FOREXcross",
        dev_preview_label: "Developer Access",
        btn_mobile_preview: "Anteprima Cellulare",
        custom_cross_hint: "Inserisci qui le divise che stai cercando",
        btn_manual_download: "Download PDF",
        btn_manual_close: "Chiudi",
        delete_manual_confirm: "Sei sicuro di voler rimuovere questo manuale dalla vista?",
        restore_manuals: "Visualizza manuali rimossi"
    },
    en: {
        homepage_title: "FOREX Dashboard",
        homepage_subtitle: "Exchange Rates",
        nav_eur_usd: "EUR/USD",
        nav_historical_cross: "Historical<br>Rates",
        loading_rates: "Loading exchange rates...",
        search_placeholder: "Search currency (e.g. CAD, Dollar...)",
        search_add: "Search and add currency...",
        offline_mode: "Offline Mode (Indicative rates)",
        update_wait: "Updating...",
        remove_currency: "Remove currency",
        title_nav_eur_usd: "Go to EUR/USD Rate",
        title_nav_historical: "Go to Historical Rates",
        
        // Dashboard
        nav_calculator: "Cross Calculator",
        nav_database: "Historical<br>Database",
        group_main: "Main Crosses",
        group_custom: "Custom Cross",
        nav_home: "Cross<br>Calculator",
        label_base: "Base Currency",
        label_target: "Target Currency",
        btn_fetch: "Cross Currencies Search",
        page_title_historical: "Historical Rates",
        subtitle_historical: "Historical analysis",
        sync_init: "Initializing...",
        sync_progress: "Synchronization in progress...",
        sync_complete: "Full History Available",
        clean_cache: "Clear Cache",
        loader_sync_title: "Historical Data Synchronization",
        loader_sync_text: "Downloading historical exchange rate series (from 2010 to today) from the European Central Bank...",
        loader_sync_footer: "This operation will take a few seconds the first time.",
        last_change: "Last Rate",
        from_yesterday: "from yesterday",
        from_prev: "from prev.",
        chart_trend: "Trend",
        range_all: "History",
        range_5y: "5Y",
        range_1y: "1Y",
        range_6m: "6M",
        range_3m: "3M",
        range_1m: "1M",
        monthly_table_title: "Historical Monthly Closures",
        col_month_year: "Month/Year",
        col_last_day: "Last Day",
        col_closing_rate: "Closing Rate",
        col_monthly_avg: "Monthly Average",
        db_title: "Historical Database",
        subtitle_database: "Historical Database",
        export_excel: "Export to Excel",
        period_label: "Period (Month/Year)",
        all_periods: "All periods",
        closing_only_label: "Monthly Closures Only",
        show_all: "Show all",
        yellow_rows_only: "Month End",
        col_date: "Date",
        col_day_closing: "Day Closing Value (Rate)",
        col_month_closing: "Month Closing",
        col_source: "Data Source",
        yes: "MONTH END",
        no: "No",
        api_live: "Live API",
        historical: "Historical",
        reset_confirm: "Do you really want to clear the local memory for {pair} and redownload everything from the API?",
        no_data_export: "No data to export.",
        syncing_year: "Syncing year {year}...",
        period_avg: "Period Average",
        period_from: "From",
        period_to: "To",
        error_connection_title: "Connection Error",
        error_connection_text: "Unable to retrieve data from the European Central Bank at the moment. Please check your connection or try again later.",
        mese_prefix: "Month: ",
        sidebar_logo_dash: "Dash",
        settings_title: "Tools",
        theme_label: "App Theme",
        theme_light: "Light",
        theme_dark: "Dark",
        background_label: "Background Color",
        bg_option_default: "Default",
        bg_option_black: "Black",
        select_currency_notice: "Please select the currency you require",

        // Share Access
        share_access_title: "Share Access",
        share_access_desc: "Create a password-protected link to provide temporary access to others.",
        access_password_label: "Access Password",
        access_expiry_label: "Access Duration",
        access_1month: "1 Month",
        access_3months: "3 Months",
        access_6months: "6 Months",
        access_1year: "1 Year",
        btn_generate_link: "Generate Link",
        copy_link: "Copy Link",
        link_generated: "Link copied to clipboard!",
        prompt_password_title: "Protected Access",
        prompt_password_desc: "Enter the provided password to access the dashboard.",
        invalid_password: "Invalid password.",
        access_expired: "Access has expired.",
        btn_login: "Login",
        privacy_title: "Privacy",
        manuals_title: "Manuals",
        manuals_desc: "Procedural guides and technical documentation.",
        manual_privacy_title: "Privacy and Access Guide",
        manual_user_title: "FOREXcross User Manual",
        dev_preview_label: "Developer Access",
        btn_mobile_preview: "Mobile Preview",
        custom_cross_hint: "Enter the currencies you are looking for here",
        btn_manual_download: "Download PDF",
        btn_manual_close: "Close",
        delete_manual_confirm: "Are you sure you want to remove this manual from the view?",
        restore_manuals: "Show removed manuals"
    },
    fr: {
        homepage_title: "FOREX Dashboard",
        homepage_subtitle: "Taux de Change",
        nav_eur_usd: "EUR/USD",
        nav_historical_cross: "Taux<br>Historiques",
        loading_rates: "Chargement des taux de change...",
        search_placeholder: "Rechercher une devise (ex. CAD, Dollar...)",
        search_add: "Rechercher et ajouter une devise...",
        offline_mode: "Mode Hors-ligne (Taux indicatifs)",
        update_wait: "Mise à jour...",
        remove_currency: "Supprimer la devise",
        title_nav_eur_usd: "Aller au Taux EUR/USD",
        title_nav_historical: "Aller aux Taux Historiques",
        
        // Dashboard
        nav_calculator: "Calculatrice de Taux",
        nav_database: "Database<br>Historique",
        group_main: "Taux Principaux",
        group_custom: "Recherche Cross",
        nav_home: "Calculatrice<br>Cross",
        label_base: "Devise de Base",
        label_target: "Devise Target",
        btn_fetch: "Cross Currencies Search",
        page_title_historical: "Historical Rates",
        subtitle_historical: "Historical analysis",
        sync_init: "Initialisation...",
        sync_progress: "Synchronisation en cours...",
        sync_complete: "Historique Complet Disponible",
        clean_cache: "Clear Cache",
        loader_sync_title: "Synchronisation des Données Historiques",
        loader_sync_text: "Téléchargement des séries historiques des taux de change (de 2010 à aujourd'hui) depuis la Banque Centrale Européenne...",
        loader_sync_footer: "Cette opération prendra quelques secondes la première fois.",
        last_change: "Dernier Taux",
        from_yesterday: "depuis hier",
        from_prev: "depuis préc.",
        chart_trend: "Tendance",
        range_all: "Historique",
        range_5y: "5Y",
        range_1y: "1Y",
        range_6m: "6M",
        range_3m: "3M",
        range_1m: "1M",
        monthly_table_title: "Clôtures Mensuelles Historiques",
        col_month_year: "Mois/Année",
        col_last_day: "Dernier Jour",
        col_closing_rate: "Taux de Clôture",
        col_monthly_avg: "Moyenne Mensuelle",
        db_title: "Historical Database",
        subtitle_database: "Historical Database",
        export_excel: "Exporter vers Excel",
        period_label: "Période (Mois/Année)",
        all_periods: "Toutes les périodes",
        closing_only_label: "Clôtures Mensuelles Uniquement",
        show_all: "Afficher tout",
        yellow_rows_only: "Fin de Mois",
        col_date: "Date",
        col_day_closing: "Valeur de Clôture du Jour (Taux)",
        col_month_closing: "Clôture du Mois",
        col_source: "Source des Données",
        yes: "FIN DE MOIS",
        no: "Non",
        api_live: "API Live",
        historical: "Historique",
        reset_confirm: "Voulez-vous vraiment effacer la mémoire locale pour {pair} et tout retélécharger depuis l'API?",
        no_data_export: "Aucune donnée à exporter.",
        syncing_year: "Sync. année {year}...",
        period_avg: "Moyenne Période",
        error_connection_title: "Erreur de Connexion",
        error_connection_text: "Impossible de récupérer les données de la Banque Centrale Européenne pour le moment. Veuillez vérifier votre connexion ou réessayer plus tard.",
        mese_prefix: "Mois: ",
        sidebar_logo_dash: "Dash",
        settings_title: "Outils",
        theme_label: "Couleur de l'application",
        theme_light: "Clair",
        theme_dark: "Sombre",
        background_label: "Couleur de Fond",
        bg_option_default: "Par défaut",
        bg_option_black: "Noir",
        select_currency_notice: "Veuillez sélectionner la devise requise",
        btn_login: "Entrer",
        privacy_title: "Confidentialité",
        manuals_title: "Manuels",
        manuals_desc: "Guides de procédure et documentation technique.",
        manual_privacy_title: "Guide de Confidentialité et d'Accès",
        manual_user_title: "Manuel d'Utilisation FOREXcross",
        dev_preview_label: "Aperçu Développeur",
        btn_mobile_preview: "Aperçu Mobile",
        custom_cross_hint: "Entrez ici les devises que vous recherchez",
        btn_manual_download: "Télécharger PDF",
        btn_manual_close: "Fermer",
        delete_manual_confirm: "Êtes-vous sûr de vouloir supprimer ce manuel de la vue ?",
        restore_manuals: "Afficher les manuels supprimés"
    }
};

let currentLanguage = localStorage.getItem('app_language') || 'en';

function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('app_language', lang);
    applyTranslations();
    
    // Dispatch event for other scripts to respond
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
}

function applyTranslations() {
    const texts = translations[currentLanguage];
    if (!texts) return;

    // Find all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) {
            if (el.tagName === 'INPUT' && el.type === 'text') {
                el.placeholder = texts[key];
            } else {
                el.innerHTML = texts[key];
            }
        }
    });

    // Find all elements with data-i18n-title attribute
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (texts[key]) {
            el.title = texts[key];
        }
    });

    // Update Language Buttons highlighting
    const langBtns = document.querySelectorAll('.lang-btn');
    langBtns.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`'${currentLanguage}'`)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update HTML lang attribute
    document.documentElement.lang = currentLanguage;
}

// Helper to get a translation from elsewhere
function getTranslation(key, params = {}) {
    let text = translations[currentLanguage][key] || key;
    for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v);
    }
    return text;
}

document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
});

// NEW: Listen for language changes from other tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'app_language' && e.newValue) {
        currentLanguage = e.newValue;
        applyTranslations();
    }
});
