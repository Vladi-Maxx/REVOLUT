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
        
        // Инициализиране на CSV импортера
        this.csvImporter = new CsvImporter({
            supabaseService: supabaseService,
            csvUtils: CsvUtils,
            notificationCallback: this.showNotification.bind(this),
            onImportSuccess: this.loadData.bind(this)
        });
        
        // Инициализиране на филтрите
        this.initFilters();
        
        // Добавяне на слушатели за събития
        this.addEventListeners();
    }

    /**
     * Инициализиране на филтрите
     */
    initFilters() {
        // Инициализиране на елементите за избор на дати
        this.startDateInput = document.getElementById('start-date');
        this.endDateInput = document.getElementById('end-date');
        this.startDateDisplay = document.getElementById('start-date-display');
        this.endDateDisplay = document.getElementById('end-date-display');
        
        // Други елементи на филтъра
        this.currencySelect = document.getElementById('currency');
        this.transactionTypeSelect = document.getElementById('transaction-type');
        this.applyFiltersButton = document.getElementById('apply-filters');
        
        // Задаване на начални стойности за датите
        const today = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(today.getMonth() - 1);
        
        // Задаваме стойности на скритите date полета
        this.startDateInput.value = this.formatDateForDateInput(oneMonthAgo);
        this.endDateInput.value = this.formatDateForDateInput(today);
        
        // Задаваме стойности на видимите текстови полета
        this.startDateDisplay.value = this.formatDateForInput(oneMonthAgo);
        this.endDateDisplay.value = this.formatDateForInput(today);
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
        
        // Слушател за изтриване на транзакция
        this.transactionsTableComponent.setDeleteTransactionCallback((transactionId, transaction) => {
            this.deleteTransaction(transactionId, transaction);
        });
        
        // Слушатели за датите
        this.setupDateInputListeners();
        
        // Синхронизиране на видимите и скритите полета за дати
        this.syncDateFields();
        
        // Слушатели за бутоните за бързи филтри
        this.setupQuickFilterListeners();
        
        // Инициализиране на елементите за импорт на CSV
        this.importCsvButton = document.getElementById('import-csv');
        this.csvFileInput = document.getElementById('csv-file-input');
        
        // Слушател за бутона за импорт на CSV
        this.importCsvButton.addEventListener('click', () => {
            // Изчистваме инпут полето преди да го отворим, за да може да се задейства 'change' събитието за същия файл
            this.csvFileInput.value = '';
            this.csvFileInput.click(); // Отваряне на диалога за избор на файл
        });
        
        // Слушател за избор на файл
        this.csvFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                // Използваме новия CsvImporter за импортиране на файла
                this.csvImporter.importCsvFile(file, this.allTransactions);
            }
        });
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
                // Използваме стойностите от скритите date полета (стандартен формат yyyy-mm-dd)
                startDate: this.startDateInput.value ? new Date(this.startDateInput.value) : null,
                endDate: this.endDateInput.value ? new Date(this.endDateInput.value) : null,
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
        // Слушатели за скритите date полета
        this.startDateInput.addEventListener('change', (event) => {
            if (event.target.value) {
                const date = new Date(event.target.value);
                // Обновяваме видимото текстово поле с български формат
                this.startDateDisplay.value = this.formatDateForInput(date);
            }
        });
        
        this.endDateInput.addEventListener('change', (event) => {
            if (event.target.value) {
                const date = new Date(event.target.value);
                // Обновяваме видимото текстово поле с български формат
                this.endDateDisplay.value = this.formatDateForInput(date);
            }
        });
        
        // Слушатели за видимите текстови полета
        this.startDateDisplay.addEventListener('change', (event) => {
            if (event.target.value) {
                // Парсваме българския формат
                const date = this.parseBulgarianDate(event.target.value);
                if (date && !isNaN(date.getTime())) {
                    // Обновяваме скритото date поле
                    this.startDateInput.value = this.formatDateForDateInput(date);
                }
            }
        });
        
        this.endDateDisplay.addEventListener('change', (event) => {
            if (event.target.value) {
                // Парсваме българския формат
                const date = this.parseBulgarianDate(event.target.value);
                if (date && !isNaN(date.getTime())) {
                    // Обновяваме скритото date поле
                    this.endDateInput.value = this.formatDateForDateInput(date);
                }
            }
        });
        
        // Клик върху текстовите полета отваря календарите
        this.startDateDisplay.addEventListener('click', () => {
            this.startDateInput.showPicker();
        });
        
        this.endDateDisplay.addEventListener('click', () => {
            this.endDateInput.showPicker();
        });
    }
    
    /**
     * Синхронизиране на полетата за дати
     */
    syncDateFields() {
        // При начално зареждане или при промяна на себе си, синхронизираме с другото поле
        
        // Синхронизираме началната дата
        if (this.startDateInput.value) {
            const date = new Date(this.startDateInput.value);
            if (!isNaN(date.getTime())) {
                this.startDateDisplay.value = this.formatDateForInput(date);
            }
        } else if (this.startDateDisplay.value) {
            const date = this.parseBulgarianDate(this.startDateDisplay.value);
            if (date && !isNaN(date.getTime())) {
                this.startDateInput.value = this.formatDateForDateInput(date);
            }
        }
        
        // Синхронизираме крайната дата
        if (this.endDateInput.value) {
            const date = new Date(this.endDateInput.value);
            if (!isNaN(date.getTime())) {
                this.endDateDisplay.value = this.formatDateForInput(date);
            }
        } else if (this.endDateDisplay.value) {
            const date = this.parseBulgarianDate(this.endDateDisplay.value);
            if (date && !isNaN(date.getTime())) {
                this.endDateInput.value = this.formatDateForDateInput(date);
            }
        }
    }
    
    /**
     * Настройване на слушатели за бутоните за бързи филтри
     */
    setupQuickFilterListeners() {
        // Бутони за бързи филтри
        this.lastWeekButton = document.getElementById('last-week');
        this.currentMonthButton = document.getElementById('current-month');
        this.lastMonthButton = document.getElementById('last-month');
        this.currentYearButton = document.getElementById('current-year');
        
        // Добавяме слушатели за бутоните
        if (this.lastWeekButton) {
            this.lastWeekButton.addEventListener('click', () => {
                this.setDateRangeLastWeek();
            });
        }
        
        if (this.currentMonthButton) {
            this.currentMonthButton.addEventListener('click', () => {
                this.setDateRangeCurrentMonth();
            });
        }
        
        if (this.lastMonthButton) {
            this.lastMonthButton.addEventListener('click', () => {
                this.setDateRangeLastMonth();
            });
        }
        
        if (this.currentYearButton) {
            this.currentYearButton.addEventListener('click', () => {
                this.setDateRangeCurrentYear();
            });
        }
    }
    
    /**
     * Ресетване на активните класове на бутоните за бързи филтри
     */
    resetQuickFilterButtons() {
        // Премахваме активния клас от всички бутони
        const quickFilterButtons = document.querySelectorAll('.btn-quick-filter');
        quickFilterButtons.forEach(button => {
            button.classList.remove('active');
        });
    }
    
    /**
     * Настройване на датите за последната седмица
     */
    setDateRangeLastWeek() {
        this.resetQuickFilterButtons();
        this.lastWeekButton.classList.add('active');
        
        // Изчисляваме датите за последната седмица
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        
        // Задаваме стойности на скритите date полета
        this.startDateInput.value = this.formatDateForDateInput(oneWeekAgo);
        this.endDateInput.value = this.formatDateForDateInput(today);
        
        // Задаваме стойности на видимите текстови полета
        this.startDateDisplay.value = this.formatDateForInput(oneWeekAgo);
        this.endDateDisplay.value = this.formatDateForInput(today);
        
        // Прилагаме филтрите
        this.applyFilters();
    }
    
    /**
     * Настройване на датите за текущия месец
     */
    setDateRangeCurrentMonth() {
        this.resetQuickFilterButtons();
        this.currentMonthButton.classList.add('active');
        
        // Изчисляваме датите за текущия месец
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Задаваме стойности на скритите date полета
        this.startDateInput.value = this.formatDateForDateInput(firstDayOfMonth);
        this.endDateInput.value = this.formatDateForDateInput(today);
        
        // Задаваме стойности на видимите текстови полета
        this.startDateDisplay.value = this.formatDateForInput(firstDayOfMonth);
        this.endDateDisplay.value = this.formatDateForInput(today);
        
        // Прилагаме филтрите
        this.applyFilters();
    }
    
    /**
     * Настройване на датите за предишния месец
     */
    setDateRangeLastMonth() {
        this.resetQuickFilterButtons();
        this.lastMonthButton.classList.add('active');
        
        // Изчисляваме датите за предишния месец
        const today = new Date();
        const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        
        // Задаваме стойности на скритите date полета
        this.startDateInput.value = this.formatDateForDateInput(firstDayOfLastMonth);
        this.endDateInput.value = this.formatDateForDateInput(lastDayOfLastMonth);
        
        // Задаваме стойности на видимите текстови полета
        this.startDateDisplay.value = this.formatDateForInput(firstDayOfLastMonth);
        this.endDateDisplay.value = this.formatDateForInput(lastDayOfLastMonth);
        
        // Прилагаме филтрите
        this.applyFilters();
    }
    
    /**
     * Настройване на датите за текущата година
     */
    setDateRangeCurrentYear() {
        this.resetQuickFilterButtons();
        this.currentYearButton.classList.add('active');
        
        // Изчисляваме датите за текущата година
        const today = new Date();
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        
        // Задаваме стойности на скритите date полета
        this.startDateInput.value = this.formatDateForDateInput(firstDayOfYear);
        this.endDateInput.value = this.formatDateForDateInput(today);
        
        // Задаваме стойности на видимите текстови полета
        this.startDateDisplay.value = this.formatDateForInput(firstDayOfYear);
        this.endDateDisplay.value = this.formatDateForInput(today);
        
        // Прилагаме филтрите
        this.applyFilters();
    }
    
    /**
     * Изтриване на транзакция
     * @param {string} transactionId - ID на транзакцията за изтриване
     * @param {Object} transaction - Обект с данни за транзакцията
     */
    async deleteTransaction(transactionId, transaction) {
        try {
            if (!transactionId) {
                console.error('Не е предоставен ID на транзакцията за изтриване');
                return;
            }
            
            // Показваме съобщение за потвърждение
            const confirmMessage = `Сигурни ли сте, че искате да изтриете тази транзакция?\n\nОписание: ${transaction.Description || '-'}\nСума: ${DataUtils.formatAmount(parseFloat(transaction.Amount) || 0, transaction.Currency || 'BGN')}\nДата: ${DataUtils.formatDate(transaction['Started Date'] || '')}\n\nТази операция не може да бъде отменена!`;
            
            if (!confirm(confirmMessage)) {
                console.log('Изтриването е отказано от потребителя');
                return;
            }
            
            // Показваме индикатор за зареждане
            this.showLoadingMessage();
            
            // Изпращаме заявка за изтриване към сървиса
            const result = await supabaseService.deleteTransaction(transactionId);
            
            if (result.success) {
                // Показваме съобщение за успех
                alert('Транзакцията е изтрита успешно!');
                
                // Ако е необходимо, обновяваме данните в таблицата
                // Имаме два варианта:
                // 1. Да презаредим всички данни (по-бавно, но по-сигурно)
                // await this.loadData();
                
                // 2. Или да премахнем транзакцията от локалните данни (по-бързо)
                if (this.allTransactions) {
                    // Премахваме транзакцията от масива с всички транзакции
                    this.allTransactions = this.allTransactions.filter(t => t.id !== transactionId);
                    
                    // Прилагаме отново текущите филтри
                    this.applyFilters();
                } else {
                    // Ако нямаме кеширани транзакции, презареждаме всички данни
                    await this.loadData();
                }
            } else {
                // Показваме съобщение за грешка
                alert(`Грешка при изтриване на транзакцията: ${result.error}`);
            }
        } catch (error) {
            console.error('Грешка при изтриване на транзакция:', error);
            alert(`Възникна грешка при изтриване на транзакцията: ${error.message}`);
        }
    }


    

    

    
    /**
     * Показване на известие на потребителя
     * @param {string} message - Съобщение за показване
     * @param {string} type - Тип на известието ('info', 'success', 'error')
     */
    showNotification(message, type = 'info') {
        // Проверяваме дали съществува контейнер за известия
        let notificationContainer = document.getElementById('notification-container');
        
        // Ако не съществува, създаваме го
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.style.position = 'fixed';
            notificationContainer.style.top = '10px';
            notificationContainer.style.right = '10px';
            notificationContainer.style.zIndex = '1000';
            document.body.appendChild(notificationContainer);
        }
        
        // Създаваме елемент за известие
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.padding = '15px 20px';
        notification.style.margin = '0 0 10px 0';
        notification.style.borderRadius = '4px';
        notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        
        // Стилове според типа на известието
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#4CAF50';
                notification.style.color = 'white';
                break;
            case 'error':
                notification.style.backgroundColor = '#F44336';
                notification.style.color = 'white';
                break;
            default: // info
                notification.style.backgroundColor = '#2196F3';
                notification.style.color = 'white';
        }
        
        // Добавяме известието в контейнера
        notificationContainer.appendChild(notification);
        
        // Показваме известието с анимация
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // Скриваме известието след 3 секунди
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}
