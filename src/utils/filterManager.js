/**
 * Клас за управление на филтрите
 * Отговаря за инициализацията и прилагането на филтри към данните
 */
class FilterManager {
    /**
     * Създава нова инстанция на FilterManager
     * @param {Object} options - Опции за конфигурация
     * @param {Object} options.elements - Елементи на интерфейса за филтриране
     * @param {HTMLElement} options.elements.startDateInput - Поле за начална дата
     * @param {HTMLElement} options.elements.endDateInput - Поле за крайна дата
     * @param {HTMLElement} options.elements.startDateDisplay - Визуализация на начална дата
     * @param {HTMLElement} options.elements.endDateDisplay - Визуализация на крайна дата
     * @param {HTMLElement} options.elements.currencySelect - Селект за валута
     * @param {HTMLElement} options.elements.transactionTypeSelect - Селект за тип транзакция
     * @param {HTMLElement} options.elements.applyFiltersButton - Бутон за прилагане на филтри
     * @param {Object} options.supabaseService - Услуга за достъп до базата данни
     * @param {Object} options.dataUtils - Помощни функции за обработка на данни
     * @param {Function} options.notificationCallback - Функция за показване на известия
     * @param {Function} options.onFilterSuccess - Функция, която се извиква след успешно филтриране
     * @param {Function} options.formatDateFn - Функция за форматиране на дата за инпут поле
     */
    constructor({
        elements,
        supabaseService,
        dataUtils,
        notificationCallback,
        onFilterSuccess,
        formatDateFn
    }) {
        // Запазваме референции към елементите на интерфейса
        this.elements = elements;
        
        // Запазваме зависимостите
        this.supabaseService = supabaseService;
        this.dataUtils = dataUtils;
        this.showNotification = notificationCallback;
        this.onFilterSuccess = onFilterSuccess;
        this.formatDateForDateInput = formatDateFn;
        
        // Локален кеш на всички транзакции 
        this.allTransactions = null;
    }
    
    /**
     * Инициализиране на филтрите с начални стойности
     */
    initFilters() {
        // Задаване на начални стойности за датите
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        
        // Задаваме стойности на скритите date полета
        this.elements.startDateInput.value = this.formatDateForDateInput(oneMonthAgo);
        this.elements.endDateInput.value = this.formatDateForDateInput(today);
        
        // Задаваме стойности на видимите текстови полета
        this.syncDateFields();
    }
    
    /**
     * Прилагане на филтри
     * @param {Array} allTransactions - Пълен набор от транзакции (опционален)
     * @returns {Promise<Object>} Резултат от филтрирането
     */
    async applyFilters(allTransactions = null) {
        try {
            // Показваме съобщение за зареждане
            this.showNotification('Филтриране на данни...');
            
            // Запазваме всички транзакции локално, ако са предоставени
            if (allTransactions) {
                this.allTransactions = allTransactions;
            }
            
            // Вземаме стойностите на филтрите и конвертираме датите в правилен формат
            const filters = {
                // Използваме стойностите от скритите date полета (стандартен формат yyyy-mm-dd)
                startDate: this.elements.startDateInput.value ? new Date(this.elements.startDateInput.value) : null,
                endDate: this.elements.endDateInput.value ? new Date(this.elements.endDateInput.value) : null,
                currency: this.elements.currencySelect.value,
                type: this.elements.transactionTypeSelect.value
            };
            
            // Ако имаме крайна дата, нагласяме я да включва целия ден
            if (filters.endDate) {
                filters.endDate.setHours(23, 59, 59, 999);
            }
            
            // Извличаме филтрираните транзакции
            let filteredTransactions;
            
            // Ако имаме всички транзакции в паметта, филтрираме локално
            if (this.allTransactions) {
                filteredTransactions = this.filterTransactionsLocally(this.allTransactions, filters);
            } else {
                // Иначе извличаме от базата данни
                filteredTransactions = await this.supabaseService.getTransactionsWithFilters(filters);
            }
            
            // Актуализираме филтрите с данни от транзакциите
            this.populateFilters();
            
            // Връщаме резултатите
            return {
                success: true,
                filteredTransactions,
                filters
            };
            
        } catch (error) {
            console.error('Грешка при прилагане на филтри:', error);
            this.showNotification('Възникна грешка при филтриране на данните.', 'error');
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Филтриране на транзакции локално
     * @param {Array} transactions - Масив с транзакции
     * @param {Object} filters - Обект с филтри
     * @returns {Array} Филтрирани транзакции
     */
    filterTransactionsLocally(transactions, filters) {
        // Проверяваме формата на датите в транзакциите
        if (transactions.length > 0) {
            const firstTransaction = transactions[0];
            
            if (firstTransaction['Start Date']) {
                const date = new Date(firstTransaction['Start Date']);
            }
        }
        
        return transactions.filter(transaction => {
            // Филтриране по начална дата
            if (filters.startDate && transaction['Started Date']) {
                try {
                    const transactionDate = new Date(transaction['Started Date']);
                    const transactionTime = transactionDate.getTime();
                    const filterTime = filters.startDate.getTime();
                    
                    if (!isNaN(transactionTime)) {
                        if (transactionTime < filterTime) {
                            return false;
                        }
                    } else {
                        console.warn('Невалидна дата при филтриране по начална дата:', transaction['Started Date']);
                    }
                } catch (error) {
                    console.error('Грешка при обработка на дата:', error);
                }
            }
            
            // Филтриране по крайна дата
            if (filters.endDate && transaction['Started Date']) {
                try {
                    const transactionDate = new Date(transaction['Started Date']);
                    const transactionTime = transactionDate.getTime();
                    const filterTime = filters.endDate.getTime();
                    
                    if (!isNaN(transactionTime)) {
                        if (transactionTime > filterTime) {
                            return false;
                        }
                    } else {
                        console.warn('Невалидна дата при филтриране по крайна дата:', transaction['Started Date']);
                    }
                } catch (error) {
                    console.error('Грешка при обработка на дата:', error);
                }
            }
            
            // Филтриране по валута
            if (filters.currency && filters.currency !== 'all') {
                if (transaction.Currency !== filters.currency) {
                    return false;
                }
            }
            
            // Филтриране по тип транзакция
            if (filters.type && filters.type !== 'all') {
                if (transaction.Type !== filters.type) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    /**
     * Попълване на селектите за филтри
     */
    populateFilters() {
        if (!this.allTransactions) return;
        
        // Извличаме уникални валути
        const currencies = this.dataUtils.getUniqueCurrencies(this.allTransactions);
        
        // Попълваме селекта за валути
        this.populateSelect(this.elements.currencySelect, currencies, 'all', 'Всички');
        
        // Извличаме уникални типове транзакции
        const types = this.dataUtils.getUniqueTransactionTypes(this.allTransactions);
        
        // Попълваме селекта за типове транзакции
        this.populateSelect(this.elements.transactionTypeSelect, types, 'all', 'Всички');
    }
    
    /**
     * Попълване на селект с опции
     * @param {HTMLElement} selectElement - Елемент на селекта
     * @param {Array} options - Масив с опции
     * @param {string} defaultValue - Стойност по подразбиране
     * @param {string} defaultLabel - Етикет по подразбиране
     */
    populateSelect(selectElement, options, defaultValue, defaultLabel) {
        // Запазваме опцията по подразбиране
        const defaultOption = document.createElement('option');
        defaultOption.value = defaultValue;
        defaultOption.textContent = defaultLabel;
        
        // Изчистваме селекта
        selectElement.innerHTML = '';
        
        // Добавяме опцията по подразбиране
        selectElement.appendChild(defaultOption);
        
        // Добавяме останалите опции
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
        });
    }
    
    /**
     * Синхронизиране на полетата за дати
     */
    syncDateFields() {
        // Вземаме датите от скритите полета и ги преобразуваме в обекти Date
        const startDate = this.elements.startDateInput.value ? new Date(this.elements.startDateInput.value) : null;
        const endDate = this.elements.endDateInput.value ? new Date(this.elements.endDateInput.value) : null;
        
        // Форматираме датите за визуализация (дд.мм.гггг)
        if (startDate) {
            const formattedStartDate = `${padZero(startDate.getDate())}.${padZero(startDate.getMonth() + 1)}.${startDate.getFullYear()}`;
            this.elements.startDateDisplay.textContent = formattedStartDate;
        }
        
        if (endDate) {
            const formattedEndDate = `${padZero(endDate.getDate())}.${padZero(endDate.getMonth() + 1)}.${endDate.getFullYear()}`;
            this.elements.endDateDisplay.textContent = formattedEndDate;
        }
        
        // Помощна функция за добавяне на водеща нула
        function padZero(num) {
            return num.toString().padStart(2, '0');
        }
    }
    
    /**
     * Задаване на филтър за диапазон от дати
     * @param {Date} startDate - Начална дата
     * @param {Date} endDate - Крайна дата
     */
    setDateRange(startDate, endDate) {
        // Задаваме стойности на скритите date полета
        this.elements.startDateInput.value = this.formatDateForDateInput(startDate);
        this.elements.endDateInput.value = this.formatDateForDateInput(endDate);
        
        // Синхронизираме визуалните полета
        this.syncDateFields();
    }
    
    /**
     * Настройване на датите за последната седмица
     */
    setDateRangeLastWeek() {
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        
        this.setDateRange(oneWeekAgo, today);
    }
    
    /**
     * Настройване на датите за предишния месец
     */
    setDateRangeLastMonth() {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);
        
        this.setDateRange(lastMonth, today);
    }
    
    /**
     * Настройване на датите за текущия месец
     */
    setDateRangeCurrentMonth() {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        this.setDateRange(firstDayOfMonth, today);
    }
    
    /**
     * Настройване на датите за текущата година
     */
    setDateRangeCurrentYear() {
        const today = new Date();
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        
        this.setDateRange(firstDayOfYear, today);
    }
}
