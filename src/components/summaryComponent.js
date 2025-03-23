/**
 * Компонент за показване на обобщена информация за транзакциите
 */
class SummaryComponent {
    constructor() {
        this.totalTransactionsElement = document.getElementById('total-transactions');
        this.totalAmountElement = document.getElementById('total-amount');
        this.averageAmountElement = document.getElementById('average-amount');
    }

    /**
     * Обновяване на обобщената информация
     * @param {Object} stats - Обект със статистики
     */
    updateSummary(stats) {
        console.log('%c[SummaryComponent] Извикване на updateSummary:', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;', stats);
        
        if (!stats) {
            console.warn('%c[SummaryComponent] Невалидни статистики:', 'background: #e67e22; color: white; padding: 2px 5px; border-radius: 3px;', stats);
            return;
        }

        // Обновяваме елементите с данните
        this.totalTransactionsElement.textContent = stats.totalTransactions;
        this.totalAmountElement.textContent = DataUtils.formatAmount(stats.totalAmount);
        this.averageAmountElement.textContent = DataUtils.formatAmount(stats.averageAmount);
    }
}
