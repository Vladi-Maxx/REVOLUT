/**
 * Помощни функции за обработка на данни от транзакции
 */
class DataUtils {
    /**
     * Групиране на транзакции по търговци
     * @param {Array} transactions - Масив с транзакции
     * @returns {Array} Масив с групирани данни по търговци
     */
    static groupTransactionsByMerchant(transactions) {
        // Създаваме обект за съхранение на групираните данни
        const merchantsMap = {};

        // Обхождаме всички транзакции
        transactions.forEach(transaction => {
            // Използваме Description като име на търговеца
            const merchantName = transaction.Description || 'Неизвестен';
            const amount = parseFloat(transaction.Amount) || 0;

            // Ако търговецът не съществува в обекта, го създаваме
            if (!merchantsMap[merchantName]) {
                merchantsMap[merchantName] = {
                    name: merchantName,
                    count: 0,
                    totalAmount: 0,
                    averageAmount: 0,
                    transactions: []
                };
            }

            // Увеличаваме броя транзакции и общата сума
            merchantsMap[merchantName].count += 1;
            merchantsMap[merchantName].totalAmount += amount;
            merchantsMap[merchantName].transactions.push(transaction);
        });

        // Преобразуваме обекта в масив и изчисляваме средната сума
        const merchantsArray = Object.values(merchantsMap).map(merchant => {
            merchant.averageAmount = merchant.totalAmount / merchant.count;
            return merchant;
        });

        // Сортираме по обща сума в низходящ ред
        return merchantsArray.sort((a, b) => b.totalAmount - a.totalAmount);
    }

    /**
     * Изчисляване на обобщени статистики за транзакциите
     * @param {Array} transactions - Масив с транзакции
     * @returns {Object} Обект със статистики
     */
    static calculateTransactionStats(transactions) {
        const stats = {
            totalTransactions: transactions.length,
            totalAmount: 0,
            averageAmount: 0
        };

        // Изчисляваме общата сума
        stats.totalAmount = transactions.reduce((sum, transaction) => {
            return sum + (parseFloat(transaction.Amount) || 0);
        }, 0);

        // Изчисляваме средната сума
        stats.averageAmount = stats.totalTransactions > 0 
            ? stats.totalAmount / stats.totalTransactions 
            : 0;

        return stats;
    }

    /**
     * Форматиране на сума с валута
     * @param {number} amount - Сума
     * @param {string} currency - Валута
     * @returns {string} Форматирана сума
     */
    static formatAmount(amount, currency = 'BGN') {
        return new Intl.NumberFormat('bg-BG', { 
            style: 'currency', 
            currency: currency 
        }).format(amount);
    }

    /**
     * Форматиране на дата
     * @param {string} dateString - Дата като стринг
     * @returns {string} Форматирана дата
     */
    static formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            
            // Проверка дали датата е валидна
            if (isNaN(date.getTime())) {
                console.warn('Невалидна дата:', dateString);
                return dateString;
            }
            
            // Датата е валидна, показваме я във формат дд.мм.гггг
            return new Intl.DateTimeFormat('bg-BG').format(date);
        } catch (error) {
            console.error('Грешка при форматиране на дата:', error);
            return dateString || '-';
        }
    }

    /**
     * Извличане на уникални валути от транзакциите
     * @param {Array} transactions - Масив с транзакции
     * @returns {Array} Масив с уникални валути
     */
    static getUniqueCurrencies(transactions) {
        const currencies = new Set();
        
        transactions.forEach(transaction => {
            if (transaction.Currency) {
                currencies.add(transaction.Currency);
            }
        });

        return Array.from(currencies);
    }

    /**
     * Извличане на уникални типове транзакции
     * @param {Array} transactions - Масив с транзакции
     * @returns {Array} Масив с уникални типове
     */
    static getUniqueTransactionTypes(transactions) {
        const types = new Set();
        
        transactions.forEach(transaction => {
            if (transaction.Type) {
                types.add(transaction.Type);
            }
        });

        return Array.from(types);
    }
}
