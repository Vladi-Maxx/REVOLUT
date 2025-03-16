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
        if (!stats) return;

        // Обновяваме елементите с данните
        this.totalTransactionsElement.textContent = stats.totalTransactions;
        this.totalAmountElement.textContent = DataUtils.formatAmount(stats.totalAmount);
        this.averageAmountElement.textContent = DataUtils.formatAmount(stats.averageAmount);
    }
}
