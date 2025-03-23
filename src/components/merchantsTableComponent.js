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
        
        // Мениджър за избор на търговци
        this.merchantSelectionManager = null;
        
        // Флаг, който показва дали се натиска клавиш Ctrl/Cmd
        this.isCtrlPressed = false;
        
        // Добавяме слушател за клавиши
        this.initKeyListeners();
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
     * Инициализиране на слушатели за клавиши (Ctrl/Cmd за множествен избор)
     */
    initKeyListeners() {
        // Слушаме за натискане на клавиш Ctrl/Cmd
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                this.isCtrlPressed = true;
            }
        });
        
        // Слушаме за освобождаване на клавиш Ctrl/Cmd
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Control' || e.key === 'Meta') {
                this.isCtrlPressed = false;
            }
        });
        
        // Когато прозорецът загуби фокус, нулираме флага
        window.addEventListener('blur', () => {
            this.isCtrlPressed = false;
        });
    }

    /**
     * Обновяване на таблицата с данни
     * @param {Array} merchantsData - Данни за търговците
     */
    updateTable(merchantsData) {
        console.log('%c[MerchantsTableComponent] Извикване на updateTable:', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;', {
            'Получени данни': merchantsData,
            'Брой елементи': merchantsData ? merchantsData.length : 0
        });
        
        if (!merchantsData || !Array.isArray(merchantsData)) {
            console.warn('%c[MerchantsTableComponent] Невалидни данни:', 'background: #e67e22; color: white; padding: 2px 5px; border-radius: 3px;', merchantsData);
            return;
        }
        
        // Запазваме текущите данни
        this.currentData = merchantsData;
        
        // Изчистваме таблицата
        this.tableBodyElement.innerHTML = '';
        
        // Добавяме редове за всеки търговец
        merchantsData.forEach((merchant, index) => {
            const row = document.createElement('tr');
            
            // Проверяваме дали търговецът е избран и добавяме подходящ клас
            if (this.merchantSelectionManager && this.merchantSelectionManager.isMerchantSelected(merchant)) {
                row.classList.add('selected-merchant');
            }
            
            // Създаваме клетките за реда
            row.innerHTML = `
                <td><span class="transaction-description">${merchant.name}</span></td>
                <td>${merchant.count}</td>
                <td><span class="${merchant.totalAmount < 0 ? 'amount-negative' : 'amount-positive'}">${DataUtils.formatAmount(merchant.totalAmount)}</span></td>
                <td><span class="${merchant.averageAmount < 0 ? 'amount-negative' : 'amount-positive'}">${DataUtils.formatAmount(merchant.averageAmount)}</span></td>
            `;
            
            // Добавяме слушател за клик върху реда
            row.addEventListener('click', (e) => {
                // Проверяваме дали се използва множествен избор (с натиснат Ctrl/Cmd)
                if (this.merchantSelectionManager) {
                    // Ако се натиска Ctrl/Cmd, превключваме избора на търговеца
                    if (this.isCtrlPressed) {
                        this.merchantSelectionManager.toggleMerchantSelection(merchant);
                    } else {
                        // Ако не се натиска Ctrl/Cmd, изчистваме избора и избираме само текущия
                        this.merchantSelectionManager.clearSelectedMerchants();
                        this.merchantSelectionManager.selectMerchant(merchant);
                    }
                } else if (this.onMerchantSelect) {
                    // Ако не се използва MerchantSelectionManager, използваме стандартния подход
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
    
    /**
     * Свързване на MerchantSelectionManager с таблицата
     * @param {Object} merchantSelectionManager - Инстанция на MerchantSelectionManager
     */
    setMerchantSelectionManager(merchantSelectionManager) {
        if (!merchantSelectionManager) return;
        
        this.merchantSelectionManager = merchantSelectionManager;
        
        // Добавяме информативно съобщение в горната част на таблицата
        const merchantsTable = document.getElementById('merchants-table');
        
        if (merchantsTable) {
            // Проверяваме дали вече не съществува съобщение
            let infoMessage = document.querySelector('.merchants-table-info');
            
            if (!infoMessage) {
                infoMessage = document.createElement('div');
                infoMessage.className = 'merchants-table-info';
                infoMessage.innerHTML = '<i class="fa fa-info-circle"></i> Можете да изберете няколко търговеца с <kbd>Ctrl</kbd> + клик или <kbd>⌘ Cmd</kbd> + клик';
                infoMessage.style.padding = '8px';
                infoMessage.style.marginBottom = '10px';
                infoMessage.style.fontSize = '14px';
                infoMessage.style.backgroundColor = '#f8f9fa';
                infoMessage.style.borderRadius = '4px';
                infoMessage.style.border = '1px solid #ddd';
                
                // Стилизиране на клавишите
                const keys = infoMessage.querySelectorAll('kbd');
                keys.forEach(key => {
                    key.style.backgroundColor = '#eee';
                    key.style.borderRadius = '3px';
                    key.style.border = '1px solid #b4b4b4';
                    key.style.padding = '1px 4px';
                    key.style.fontFamily = 'monospace';
                });
                
                // Вмъкваме съобщението преди таблицата
                merchantsTable.parentNode.insertBefore(infoMessage, merchantsTable);
            }
        }
    }
}
