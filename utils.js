/**
 * Shared Utilities for FOREX Dash
 * Centralizes number formatting, date parsing, and shared constants.
 */

const APP_UTILS = {
    /**
     * Formats a number with dot as thousand separator and comma for decimals.
     * Default: 1.000,0000
     */
    formatNumber: function(val, decimals = 4) {
        if (val === undefined || val === null || isNaN(val)) return '--';
        const num = Number(val);
        const parts = num.toFixed(decimals).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return parts.join(',');
    },

    /**
     * Parses date strings in various formats (primarily DD/MM/YYYY)
     */
    parseDate: function(dateStr) {
        if (!dateStr) return new Date();
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            // Month is 0-indexed
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }
        return new Date(dateStr);
    },

    /**
     * Returns the flag-icon class for a given currency code
     */
    getFlagClass: function(currency) {
        if (!currency) return '';
        const code = currency.toUpperCase();
        switch (code) {
            case 'EUR': return 'fi fi-eu';
            case 'USD': return 'fi fi-us';
            case 'BRL': return 'fi fi-br';
            case 'GBP': return 'fi fi-gb';
            case 'JPY': return 'fi fi-jp';
            case 'HKD': return 'fi fi-hk';
            case 'CAD': return 'fi fi-ca';
            case 'AUD': return 'fi fi-au';
            case 'CHF': return 'fi fi-ch';
            case 'CNY': return 'fi fi-cn';
            default: return `fi fi-${code.substring(0, 2).toLowerCase()}`;
        }
    },

    /**
     * Formats a value as a currency string (e.g., R$ 1,2345)
     */
    formatCurrency: function(val, code) {
        const formatted = this.formatNumber(val);
        switch (code.toUpperCase()) {
            case 'EUR': return `€ ${formatted}`;
            case 'USD': return `$ ${formatted}`;
            case 'BRL': return `R$ ${formatted}`;
            case 'GBP': return `£ ${formatted}`;
            default: return `${code} ${formatted}`;
        }
    }
};

// Shared Constants
const SHARED_FALLBACK_RATES = {
    'EUR': { 'USD': 1.08, 'BRL': 6.12, 'HKD': 8.45, 'GBP': 0.86, 'CAD': 1.48 },
    'USD': { 'EUR': 0.92, 'BRL': 5.65, 'HKD': 7.82, 'GBP': 0.79, 'CAD': 1.36 },
    'BRL': { 'EUR': 0.16, 'USD': 0.18, 'HKD': 1.38, 'GBP': 0.14, 'CAD': 0.24 },
    'GBP': { 'EUR': 1.16, 'USD': 1.25, 'BRL': 7.15, 'HKD': 9.80, 'CAD': 1.71 }
};
