/**
 * Основен изглед на финансовото табло
 */
class DashboardView {
    constructor() {
        // Инициализиране на компонентите
        this.summaryComponent = new SummaryComponent();
        this.merchantsTableComponent = new MerchantsTableComponent();
        this.chartComponent = new ChartComponent();
        this.transactionsTableComponent = new TransactionsTableComponent();
        
        // Инициализиране на филтрите
        this.initFilters();
        
        // Добавяне на слушатели за събития
        this.addEventListeners();
    }

    /**
     * Инициализиране на филтрите
     */
    initFilters() {
        this.startDateInput = document.getElementById('start-date');
        this.endDateInput = document.getElementById('end-date');
        this.currencySelect = document.getElementById('currency');
        this.transactionTypeSelect = document.getElementById('transaction-type');
        this.applyFiltersButton = document.getElementById('apply-filters');
        
        // Задаване на начални стойности за датите
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        
        this.startDateInput.value = this.formatDateForInput(oneMonthAgo);
        this.endDateInput.value = this.formatDateForInput(today);
        
        // Добавяме текущите дати в data атрибут
        this.startDateInput.dataset.date = this.formatDateForDateInput(oneMonthAgo);
        this.endDateInput.dataset.date = this.formatDateForDateInput(today);
    }

    /**
     * Добавяне на слушатели за събития
     */
    addEventListeners() {
        // Слушател за бутона за прилагане на филтри
        this.applyFiltersButton.addEventListener('click', () => {
            this.applyFilters();
        });
        
        // Слушател за избор на търговец
        this.merchantsTableComponent.setOnMerchantSelectListener((merchant) => {
            this.onMerchantSelect(merchant);
        });
        
        // Слушатели за датите
        this.setupDateInputListeners();
    }

    /**
     * Зареждане на данни и инициализиране на изгледа
     */
    async loadData() {
        try {
            // Показваме съобщение за зареждане
            this.showLoadingMessage();
            
            // Извличаме всички транзакции
            const transactions = await supabaseService.getAllTransactions();
            
            // Дебъг информация
            console.log('Всички транзакции:', transactions);
            if (transactions && transactions.length > 0) {
                console.log('Първа транзакция:', transactions[0]);
                console.log('Имена на полетата:', Object.keys(transactions[0]));
            }
            
            // Ако няма транзакции, показваме съобщение
            if (!transactions || transactions.length === 0) {
                this.showNoDataMessage();
                return;
            }
            
            // Запазваме всички транзакции
            this.allTransactions = transactions;
            
            // Попълваме селектите за валута и тип транзакция
            this.populateFilters();
            
            // Прилагаме филтрите
            this.applyFilters();
            
        } catch (error) {
            console.error('Грешка при зареждане на данни:', error);
            this.showErrorMessage('Възникна грешка при зареждане на данните.');
        }
    }

    /**
     * Прилагане на филтри
     */
    async applyFilters() {
        try {
            // Показваме съобщение за зареждане
            this.showLoadingMessage();
            
            // Вземаме стойностите на филтрите и конвертираме датите в правилен формат
            const filters = {
                startDate: this.startDateInput.value ? this.parseBulgarianDate(this.startDateInput.value) : null,
                endDate: this.endDateInput.value ? this.parseBulgarianDate(this.endDateInput.value) : null,
                currency: this.currencySelect.value,
                type: this.transactionTypeSelect.value
            };
            
            // Ако имаме крайна дата, нагласяме я да включва целия ден
            if (filters.endDate) {
                filters.endDate.setHours(23, 59, 59, 999);
            }
            
            console.log('Приложени филтри:', {
                startDate: filters.startDate ? filters.startDate.toISOString() : null,
                startDateTimestamp: filters.startDate ? filters.startDate.getTime() : null,
                endDate: filters.endDate ? filters.endDate.toISOString() : null,
                endDateTimestamp: filters.endDate ? filters.endDate.getTime() : null,
                currency: filters.currency,
                type: filters.type
            });
            
            // Проверяваме наличието на транзакции
            console.log('Общ брой транзакции в паметта:', this.allTransactions ? this.allTransactions.length : 0);
            
            // Извличаме филтрираните транзакции
            let filteredTransactions;
            
            // Ако имаме всички транзакции в паметта, филтрираме локално
            if (this.allTransactions) {
                filteredTransactions = this.filterTransactionsLocally(this.allTransactions, filters);
            } else {
                // Иначе извличаме от базата данни
                filteredTransactions = await supabaseService.getTransactionsWithFilters(filters);
            }
            
            // Ако няма транзакции, показваме съобщение
            if (!filteredTransactions || filteredTransactions.length === 0) {
                this.showNoDataMessage();
                return;
            }
            
            // Групираме транзакциите по търговци
            const merchantsData = DataUtils.groupTransactionsByMerchant(filteredTransactions);
            
            // Изчисляваме статистики
            const stats = DataUtils.calculateTransactionStats(filteredTransactions);
            
            // Обновяваме компонентите
            this.summaryComponent.updateSummary(stats);
            this.merchantsTableComponent.updateTable(merchantsData);
            this.chartComponent.updateChart(merchantsData);
            this.transactionsTableComponent.updateTable(filteredTransactions);
            
        } catch (error) {
            console.error('Грешка при прилагане на филтри:', error);
            this.showErrorMessage('Възникна грешка при филтриране на данните.');
        }
    }

    /**
     * Филтриране на транзакции локално
     * @param {Array} transactions - Масив с транзакции
     * @param {Object} filters - Обект с филтри
     * @returns {Array} Филтрирани транзакции
     */
    filterTransactionsLocally(transactions, filters) {
        // Дебъг информация за филтрите
        console.log('Филтриране на транзакции с филтри:', {
            startDate: filters.startDate ? filters.startDate.toISOString() : null,
            startDateTimestamp: filters.startDate ? filters.startDate.getTime() : null,
            endDate: filters.endDate ? filters.endDate.toISOString() : null,
            endDateTimestamp: filters.endDate ? filters.endDate.getTime() : null,
            currency: filters.currency,
            type: filters.type
        });
        
        // Проверяваме формата на датите в транзакциите
        if (transactions.length > 0) {
            const firstTransaction = transactions[0];
            console.log('Първа транзакция - Start Date:', firstTransaction['Start Date']);
            console.log('Първа транзакция - Completed Date:', firstTransaction['Completed Date']);
            
            if (firstTransaction['Start Date']) {
                const date = new Date(firstTransaction['Start Date']);
                console.log('Парсната дата:', date.toISOString());
                console.log('Таймстамп на датата:', date.getTime());
            }
        }
        
        return transactions.filter(transaction => {
            // Дебъг информация за първата транзакция
            if (transactions.indexOf(transaction) === 0) {
                console.log('Проверяваме полетата на транзакция:', Object.keys(transaction));
                console.log('Стойности на първата транзакция:', transaction);
            }
            
            // Филтриране по начална дата
            if (filters.startDate && transaction['Started Date']) {
                try {
                    const transactionDate = new Date(transaction['Started Date']);
                    const transactionTime = transactionDate.getTime();
                    const filterTime = filters.startDate.getTime();
                    
                    // Дебъг информация за 10-тата транзакция
                    if (transactions.indexOf(transaction) === 10) {
                        console.log('Сравнение на дати (декември):', {
                            'Transaction Started Date': transaction['Started Date'],
                            'Transaction Date Object': transactionDate.toISOString(),
                            'Transaction Timestamp': transactionTime,
                            'Filter Start Date': filters.startDate.toISOString(),
                            'Filter Timestamp': filterTime,
                            'Is Before Filter': transactionDate < filters.startDate,
                            'Timestamps Comparison': transactionTime < filterTime
                        });
                    }
                    
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
                    
                    // Дебъг информация за 20-тата транзакция
                    if (transactions.indexOf(transaction) === 20) {
                        console.log('Сравнение на крайни дати:', {
                            'Transaction Started Date': transaction['Started Date'],
                            'Transaction Date Object': transactionDate.toISOString(),
                            'Transaction Timestamp': transactionTime,
                            'Filter End Date': filters.endDate.toISOString(),
                            'Filter Timestamp': filterTime,
                            'Is After Filter': transactionDate > filters.endDate,
                            'Timestamps Comparison': transactionTime > filterTime
                        });
                    }
                    
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
        const currencies = DataUtils.getUniqueCurrencies(this.allTransactions);
        
        // Попълваме селекта за валути
        this.populateSelect(this.currencySelect, currencies, 'all', 'Всички');
        
        // Извличаме уникални типове транзакции
        const types = DataUtils.getUniqueTransactionTypes(this.allTransactions);
        
        // Попълваме селекта за типове транзакции
        this.populateSelect(this.transactionTypeSelect, types, 'all', 'Всички');
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
     * Обработка при избор на търговец
     * @param {Object} merchant - Обект с данни за търговеца
     */
    onMerchantSelect(merchant) {
        if (!merchant) return;
        
        // Показваме транзакциите на избрания търговец
        this.transactionsTableComponent.showMerchantTransactions(merchant);
    }

    /**
     * Показване на съобщение за зареждане
     */
    showLoadingMessage() {
        // Тук може да добавите логика за показване на индикатор за зареждане
        console.log('Зареждане на данни...');
    }

    /**
     * Показване на съобщение за липса на данни
     */
    showNoDataMessage() {
        // Тук може да добавите логика за показване на съобщение за липса на данни
        console.log('Няма данни за показване.');
    }

    /**
     * Показване на съобщение за грешка
     * @param {string} message - Съобщение за грешка
     */
    showErrorMessage(message) {
        // Тук може да добавите логика за показване на съобщение за грешка
        console.error(message);
    }

    /**
     * Форматиране на дата за input поле в български формат (дд.мм.гггг)
     * @param {Date} date - Дата
     * @returns {string} Форматирана дата
     */
    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}.${month}.${year}`;
    }
    
    /**
     * Форматиране на дата за HTML5 date input поле (yyyy-mm-dd)
     * @param {Date} date - Дата
     * @returns {string} Форматирана дата за HTML5 date input
     */
    formatDateForDateInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Парсване на дата в български формат (дд.мм.гггг)
     * @param {string} dateString - Дата като стринг във формат дд.мм.гггг
     * @returns {Date} Обект Дата
     */
    parseBulgarianDate(dateString) {
        if (!dateString) return null;
        
        // Регулярен израз за формат дд.мм.гггг
        const bgRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
        
        if (bgRegex.test(dateString)) {
            const parts = dateString.split('.');
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // месеците в JavaScript са от 0-11
            const year = parseInt(parts[2], 10);
            
            const date = new Date(year, month, day);
            
            // Проверка дали датата е валидна
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
        
        // Ако не е във формат дд.мм.гггг, опитваме стандартния конструктор
        return new Date(dateString);
    }
    
    /**
     * Настройване на слушатели за полетата за дати
     */
    setupDateInputListeners() {
        // Слушател за фокусиране на полето за начална дата
        this.startDateInput.addEventListener('focus', (event) => {
            // Запазваме текущата дата в data атрибут
            if (event.target.value) {
                const date = this.parseBulgarianDate(event.target.value);
                if (date) {
                    event.target.dataset.date = this.formatDateForDateInput(date);
                }
            }
        });
        
        // Слушател за фокусиране на полето за крайна дата
        this.endDateInput.addEventListener('focus', (event) => {
            // Запазваме текущата дата в data атрибут
            if (event.target.value) {
                const date = this.parseBulgarianDate(event.target.value);
                if (date) {
                    event.target.dataset.date = this.formatDateForDateInput(date);
                }
            }
        });
        
        // Слушател за промяна на полето за начална дата
        this.startDateInput.addEventListener('change', (event) => {
            if (event.target.type === 'date' && event.target.value) {
                // Конвертираме от ISO формат към български
                const date = new Date(event.target.value);
                // Запазваме оригиналния формат в data атрибут
                event.target.dataset.date = event.target.value;
                // Веднага преобразуваме стойността в български формат
                setTimeout(() => {
                    event.target.value = this.formatDateForInput(date);
                    // Връщаме полето към text тип, за да показва български формат
                    event.target.type = 'text';
                }, 0);
            }
        });
        
        // Слушател за промяна на полето за крайна дата
        this.endDateInput.addEventListener('change', (event) => {
            if (event.target.type === 'date' && event.target.value) {
                // Конвертираме от ISO формат към български
                const date = new Date(event.target.value);
                // Запазваме оригиналния формат в data атрибут
                event.target.dataset.date = event.target.value;
                // Веднага преобразуваме стойността в български формат
                setTimeout(() => {
                    event.target.value = this.formatDateForInput(date);
                    // Връщаме полето към text тип, за да показва български формат
                    event.target.type = 'text';
                }, 0);
            }
        });
        
        // Слушатели за загуба на фокус
        this.startDateInput.addEventListener('blur', (event) => {
            if (event.target.type === 'date' && event.target.value) {
                // Преформатираме стойността в български формат
                const date = new Date(event.target.value);
                event.target.value = this.formatDateForInput(date);
                event.target.type = 'text'; // Връщаме към текстово поле
            }
        });
        
        this.endDateInput.addEventListener('blur', (event) => {
            if (event.target.type === 'date' && event.target.value) {
                // Преформатираме стойността в български формат
                const date = new Date(event.target.value);
                event.target.value = this.formatDateForInput(date);
                event.target.type = 'text'; // Връщаме към текстово поле
            }
        });
    }
}
