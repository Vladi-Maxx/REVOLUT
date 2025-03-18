/**
 * Компонент за таблицата с детайлни транзакции
 */
class TransactionsTableComponent {
    constructor() {
        this.tableBodyElement = document.getElementById('transactions-table-body');
        this.deleteCallback = null;
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
                <td>
                    <button class="btn btn-delete" data-id="${transaction.id}">
                        <i class="fa fa-trash"></i> Изтрий
                    </button>
                </td>
            `;
            
            // Добавяме реда към таблицата
            this.tableBodyElement.appendChild(row);
            
            // Добавяме слушател за бутона за изтриване
            const deleteButton = row.querySelector('.btn-delete');
            if (deleteButton) {
                deleteButton.addEventListener('click', (event) => {
                    // Спираме разпространението на събитието, за да не се разпространява нагоре по DOM дървото
                    event.stopPropagation();
                    
                    // Извикваме callback функцията, ако е дефинирана
                    if (this.deleteCallback && typeof this.deleteCallback === 'function') {
                        // Взимаме ID на транзакцията от атрибута data-id
                        const transactionId = deleteButton.getAttribute('data-id');
                        
                        // Извикваме функцията за изтриване с ID на транзакцията
                        this.deleteCallback(transactionId, transaction);
                    }
                });
            }
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
    
    /**
     * Задаване на callback функция, която ще се изпълни при натискане на бутона за изтриване
     * @param {Function} callback - Функция, която ще се изпълни при натискане на бутона за изтриване
     */
    setDeleteTransactionCallback(callback) {
        if (callback && typeof callback === 'function') {
            this.deleteCallback = callback;
        }
    }
}
