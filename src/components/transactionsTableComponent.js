/**
 * Компонент за таблицата с детайлни транзакции
 */
class TransactionsTableComponent {
    constructor() {
        this.tableBodyElement = document.getElementById('transactions-table-body');
    }

    /**
     * Обновяване на таблицата с транзакции
     * @param {Array} transactions - Масив с транзакции
     */
    updateTable(transactions) {
        if (!transactions || !Array.isArray(transactions)) return;
        
        // Изчистваме таблицата
        this.tableBodyElement.innerHTML = '';
        
        // Добавяме редове за всяка транзакция
        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            
            // Форматираме датите
            const completedDate = transaction['Completed Date'] 
                ? DataUtils.formatDate(transaction['Completed Date']) 
                : '-';
                
            const startDate = transaction['Started Date'] 
                ? DataUtils.formatDate(transaction['Started Date']) 
                : '-';
            
            // Форматираме сумата
            const amount = DataUtils.formatAmount(
                parseFloat(transaction.Amount) || 0, 
                transaction.Currency || 'BGN'
            );
            
            // Създаваме клетките за реда
            row.innerHTML = `
                <td>${startDate}</td>
                <td>${completedDate}</td>
                <td>${transaction.Description || '-'}</td>
                <td>${amount}</td>
                <td>${transaction.Currency || '-'}</td>
                <td>${transaction.Type || '-'}</td>
            `;
            
            // Добавяме реда към таблицата
            this.tableBodyElement.appendChild(row);
        });
    }

    /**
     * Показване на транзакции за конкретен търговец
     * @param {Object} merchant - Обект с данни за търговеца
     */
    showMerchantTransactions(merchant) {
        if (!merchant || !merchant.transactions) return;
        
        // Обновяваме таблицата с транзакциите на търговеца
        this.updateTable(merchant.transactions);
    }
}
