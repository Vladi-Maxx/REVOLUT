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
        
        console.log('TransactionsTableComponent: Обновяване на таблицата с транзакции', transactions.length);
        
        // Изчистваме таблицата
        this.tableBodyElement.innerHTML = '';
        
        // Добавяме редове за всяка транзакция
        transactions.forEach(transaction => {
            // Проверка дали транзакцията има валидно ID
            if (!transaction.id) {
                console.warn('TransactionsTableComponent: Транзакция без ID', transaction);
                return; // Пропускаме транзакции без ID
            }
            
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
            
            // Определяме класа за сумата (положителна или отрицателна)
            const amountClass = parseFloat(transaction.Amount) < 0 ? 'amount-negative' : 'amount-positive';
            
            // Създаваме клетките за реда
            // Създаваме структурата на реда
            const tdStartDate = document.createElement('td');
            tdStartDate.textContent = startDate;
            
            const tdCompletedDate = document.createElement('td');
            tdCompletedDate.textContent = completedDate;
            
            const tdDescription = document.createElement('td');
            const descSpan = document.createElement('span');
            descSpan.className = 'transaction-description';
            descSpan.textContent = transaction.Description || '-';
            tdDescription.appendChild(descSpan);
            
            const tdAmount = document.createElement('td');
            const amountSpan = document.createElement('span');
            amountSpan.className = amountClass;
            amountSpan.textContent = amount;
            tdAmount.appendChild(amountSpan);
            
            const tdCurrency = document.createElement('td');
            const currencySpan = document.createElement('span');
            currencySpan.className = 'currency';
            currencySpan.textContent = transaction.Currency || '-';
            tdCurrency.appendChild(currencySpan);
            
            const tdType = document.createElement('td');
            const typeSpan = document.createElement('span');
            typeSpan.className = 'transaction-type';
            typeSpan.textContent = transaction.Type || '-';
            tdType.appendChild(typeSpan);
            
            const tdActions = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn btn-delete';
            deleteButton.setAttribute('data-id', transaction.id);
            
            const trashIcon = document.createElement('i');
            trashIcon.className = 'fa fa-trash';
            deleteButton.appendChild(trashIcon);
            deleteButton.appendChild(document.createTextNode(' Изтрий'));
            
            tdActions.appendChild(deleteButton);
            
            // Добавяме всички клетки към реда
            row.appendChild(tdStartDate);
            row.appendChild(tdCompletedDate);
            row.appendChild(tdDescription);
            row.appendChild(tdAmount);
            row.appendChild(tdCurrency);
            row.appendChild(tdType);
            row.appendChild(tdActions);
            
            // Добавяме реда към таблицата
            this.tableBodyElement.appendChild(row);
            
            // Добавяме слушател за бутона за изтриване
            if (deleteButton && this.deleteCallback) {
                // Използваме затваряне за да запазим референция към транзакцията
                const currentTransaction = transaction;
                const currentId = transaction.id;
                
                deleteButton.onclick = (event) => {
                    // Спираме разпространението на събитието
                    event.preventDefault();
                    event.stopPropagation();
                    
                    console.log('Кликнат бутон за изтриване с ID:', currentId);
                    
                    // Извикваме callback функцията
                    this.deleteCallback(currentId, currentTransaction);
                };
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
