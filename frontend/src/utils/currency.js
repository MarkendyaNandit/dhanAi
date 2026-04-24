const EXCHANGE_RATES = {
    USD: 1,
    INR: 83.2,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 151.4,
    AUD: 1.52,
    CAD: 1.35
};

export const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (!amount || fromCurrency === toCurrency) return amount;
    
    // Normalize to USD first
    const inUSD = amount / (EXCHANGE_RATES[fromCurrency] || 1);
    
    // Convert to target
    const result = inUSD * (EXCHANGE_RATES[toCurrency] || 1);
    
    return parseFloat(result.toFixed(2));
};

export const formatCurrency = (amount, currencyCode, locale = 'en-US') => {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
            maximumFractionDigits: 0
        }).format(amount);
    } catch (e) {
        const symbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
        return `${symbols[currencyCode] || currencyCode}${amount.toLocaleString()}`;
    }
};
