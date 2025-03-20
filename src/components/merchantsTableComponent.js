/**
 * Компонент за таблицата с търговци
 */
class MerchantsTableComponent {
    constructor() {
        this.tableBodyElement = document.getElementById('merchants-table-body');
        this.tableHeaderElements = document.querySelectorAll('#merchants-table th');
        
        // Добавяме слушатели за сортиране при кликване върху заглавията на колоните
        this.initSortListeners();
        
        // Текущи данни
        this.currentData = [];
        
        // Функция за обработка при избор на търговец
        this.onMerchantSelect = null;
    }

    /**
     * Инициализиране на слушатели за сортиране
     */
    initSortListeners() {
        this.tableHeaderElements.forEach((header, index) => {
            header.addEventListener('click', () => {
                this.sortTable(index);
            });
        });
    }

    /**
     * Обновяване на таблицата с данни
     * @param {Array} merchantsData - Данни за търговците
     */
    updateTable(merchantsData) {
        if (!merchantsData || !Array.isArray(merchantsData)) {
            console.warn('MerchantsTableComponent: невалидни данни');
            return;
        }
        
        // Запазваме текущите данни
        this.currentData = merchantsData;
        
        // Изчистваме таблицата
        this.tableBodyElement.innerHTML = '';
        
        // Добавяме редове за всеки търговец
        merchantsData.forEach((merchant, index) => {
            const row = document.createElement('tr');
            
            // Създаваме клетките за реда
            row.innerHTML = `
                <td><span class="transaction-description">${merchant.name}</span></td>
                <td>${merchant.count}</td>
                <td><span class="${merchant.totalAmount < 0 ? 'amount-negative' : 'amount-positive'}">${DataUtils.formatAmount(merchant.totalAmount)}</span></td>
                <td><span class="${merchant.averageAmount < 0 ? 'amount-negative' : 'amount-positive'}">${DataUtils.formatAmount(merchant.averageAmount)}</span></td>
            `;
            
            // Добавяме слушател за клик върху реда
            row.addEventListener('click', () => {
                if (this.onMerchantSelect) {
                    this.onMerchantSelect(merchant);
                }
            });
            
            // Добавяме реда към таблицата
            this.tableBodyElement.appendChild(row);
            

        });
        

    }

    /**
     * Сортиране на таблицата по колона
     * @param {number} columnIndex - Индекс на колоната
     */
    sortTable(columnIndex) {
        if (!this.currentData || !this.currentData.length) return;
        
        // Определяме поле за сортиране според индекса на колоната
        const sortField = this.getSortFieldByColumnIndex(columnIndex);
        if (!sortField) return;
        
        // Сортираме данните
        const sortedData = [...this.currentData].sort((a, b) => {
            if (typeof a[sortField] === 'string') {
                return a[sortField].localeCompare(b[sortField]);
            } else {
                return a[sortField] - b[sortField];
            }
        });
        
        // Обновяваме таблицата със сортираните данни
        this.updateTable(sortedData);
    }

    /**
     * Получаване на полето за сортиране според индекса на колоната
     * @param {number} columnIndex - Индекс на колоната
     * @returns {string} Име на полето
     */
    getSortFieldByColumnIndex(columnIndex) {
        switch (columnIndex) {
            case 0: return 'name';
            case 1: return 'count';
            case 2: return 'totalAmount';
            case 3: return 'averageAmount';
            default: return null;
        }
    }

    /**
     * Задаване на функция за обработка при избор на търговец
     * @param {Function} callback - Функция за обработка
     */
    setOnMerchantSelectListener(callback) {
        this.onMerchantSelect = callback;
    }
}
