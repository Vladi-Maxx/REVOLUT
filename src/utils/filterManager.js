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
     */
    constructor({
        elements,
        supabaseService,
        dataUtils,
        notificationCallback,
        onFilterSuccess
    }) {
        // Запазваме референции към елементите на интерфейса
        this.elements = elements;
        
        // Запазваме зависимостите
        this.supabaseService = supabaseService;
        this.dataUtils = dataUtils;
        this.showNotification = notificationCallback;
        this.onFilterSuccess = onFilterSuccess;
        
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
        
        // Настройваме слушатели за полетата за дати
        this.setupDateInputListeners();
        
        // Добавяме слушател за бутона за прилагане на филтри
        this.elements.applyFiltersButton.addEventListener('click', () => this.applyFilters());
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
            const startDateValue = this.elements.startDateInput.value;
            const endDateValue = this.elements.endDateInput.value;
            
            // Парсваме датите
            
            // Парсваме датите и ги установяваме на началото на деня
            let startDate = null;
            if (startDateValue) {
                startDate = new Date(startDateValue);
                startDate.setHours(0, 0, 0, 0);
            }
            
            // Парсваме датите и ги установяваме на края на деня
            let endDate = null;
            if (endDateValue) {
                endDate = new Date(endDateValue);
                endDate.setHours(23, 59, 59, 999);
            }
            
            // Датите са конвертирани успешно
            
            // Създаваме обект с филтри
            const filters = {
                startDate,
                endDate,
                currency: this.elements.currencySelect.value,
                type: this.elements.transactionTypeSelect.value
            };
            
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
            
            // Групираме транзакциите по търговци за останалите компоненти
            const merchantsData = this.groupTransactionsByMerchant(filteredTransactions);
            
            // Изчисляваме статистики
            const stats = this.calculateTransactionStats(filteredTransactions);
            
            // ВАЖНО: Добавяме броя транзакции в двата формата (count за консистентност)
            stats.count = filteredTransactions.length;

            // Данните са филтрирани успешно
            
            // 1. Пряко обновяване на таблицата с транзакции
            const transactionsTableBody = document.getElementById('transactions-table-body');
            if (transactionsTableBody) {
                // Пряко обновяване на таблицата с транзакции
                
                // Изчистваме таблицата
                transactionsTableBody.innerHTML = '';
                
                // Добавяме редове за всяка транзакция
                filteredTransactions.forEach(transaction => {
                    const row = document.createElement('tr');
                    
                    // Форматираме датите
                    const completedDate = transaction['Completed Date'] 
                        ? this.dataUtils.formatDate(transaction['Completed Date']) 
                        : '-';
                        
                    const startDate = transaction['Started Date'] 
                        ? this.dataUtils.formatDate(transaction['Started Date']) 
                        : '-';
                    
                    // Форматираме сумата
                    const amount = this.dataUtils.formatAmount(
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
                    transactionsTableBody.appendChild(row);
                });
            }
            
            // 2. Пряко обновяване на таблицата с търговци
            const merchantsTableBody = document.getElementById('merchants-table-body');
            if (merchantsTableBody) {
                // Обновяваме таблицата с търговци
                
                // Изчистваме таблицата
                merchantsTableBody.innerHTML = '';
                
                // Сортираме търговците по обща сума в низходящ ред
                const sortedMerchants = Object.keys(merchantsData).sort((a, b) => {
                    return merchantsData[b].totalAmount - merchantsData[a].totalAmount;
                });
                
                // Добавяме редове за всеки търговец
                sortedMerchants.forEach(merchantName => {
                    const merchantData = merchantsData[merchantName];
                    const row = document.createElement('tr');
                    
                    // Форматираме сумата
                    const formattedAmount = this.dataUtils.formatAmount(
                        merchantData.totalAmount, 
                        'BGN'
                    );
                    
                    // Създаваме клетките за реда
                    row.innerHTML = `
                        <td>${merchantName}</td>
                        <td>${merchantData.count}</td>
                        <td>${formattedAmount}</td>
                    `;
                    
                    // Добавяме реда към таблицата
                    merchantsTableBody.appendChild(row);
                });
            }
            
            // Премахваме прякото обновяване на DOM тук,
            // защото вече използваме SummaryComponent в DashboardView
            
            // 4. Обновяваме графиката с топ търговци
            this.updateChart(merchantsData);
            
            // Всички UI компоненти са обновени
            
            // Връщаме резултатите с подготвените данни за графиката
            return {
                success: true,
                filteredTransactions,
                filters,
                merchantsData: this.preparedChartData || Object.entries(merchantsData)
                    .map(([name, data]) => ({
                        name: name.toString(), // Изрично превръщаме в текст
                        totalAmount: Math.abs(data.totalAmount),
                        count: data.count
                    }))
                    .sort((a, b) => b.totalAmount - a.totalAmount),
                stats: {
                    ...stats,
                    // Явно задаваме броя транзакции и в двата формата, за да гарантираме работата
                    totalTransactions: filteredTransactions.length,
                    count: filteredTransactions.length
                }
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
            console.log('FilterManager: Първа транзакция', firstTransaction);
            
            // Проверка на имената на полетата за дати
            const dateFields = Object.keys(firstTransaction).filter(key => 
                key.toLowerCase().includes('date') || key.toLowerCase().includes('дата'));
        }
        
        let filtered = transactions.filter(transaction => {
            let keepTransaction = true;
            
            // Филтриране по начална дата - проверяваме за няколко възможни имена на полета
            if (filters.startDate) {
                // Проверяваме различни варианти на имена на полета за дата
                let dateValue = null;
                let dateParsed = false;
                
                // Първо, опитваме да намерим полето с дата
                const dateFields = Object.keys(transaction).filter(key => 
                    key.toLowerCase().includes('date') || key.toLowerCase().includes('дата'));
                
                // Ако имаме поне едно поле с дата, опитваме да го използваме
                if (dateFields.length > 0) {
                    for (const field of dateFields) {
                        try {
                            if (transaction[field]) {
                                // Проверяваме различни формати
                                let transactionDate;
                                
                                // Опитваме да парснем датата директно
                                transactionDate = new Date(transaction[field]);
                                
                                if (!isNaN(transactionDate.getTime())) {
                                    dateValue = transactionDate;
                                    dateParsed = true;
                                    break;
                                }
                            }
                        } catch (e) {
                            // Продължаваме със следващото поле
                            console.log('Грешка при парсване на дата:', e);
                        }
                    }
                }
                
                // Проверяваме и известни имена на полета
                if (!dateParsed) {
                    const possibleDateFields = ['Started Date', 'Start Date', 'Date', 'CompletedDate', 'Completed Date'];
                    
                    for (const field of possibleDateFields) {
                        if (transaction[field]) {
                            try {
                                const transactionDate = new Date(transaction[field]);
                                if (!isNaN(transactionDate.getTime())) {
                                    dateValue = transactionDate;
                                    dateParsed = true;
                                    break;
                                }
                            } catch (e) {
                                // Продължаваме със следващото поле
                            }
                        }
                    }
                }
                
                if (dateParsed && dateValue) {
                    const transactionTime = dateValue.getTime();
                    const filterTime = filters.startDate.getTime();
                    
                    // Проверяваме дали датата на транзакцията е преди началната дата
                    if (transactionTime < filterTime) {
                        keepTransaction = false;
                    }
                }
            }
            
            // Филтриране по крайна дата - проверяваме за няколко възможни имена на полета
            if (filters.endDate && keepTransaction) {
                // Проверяваме различни варианти на имена на полета за дата
                let dateValue = null;
                let dateParsed = false;
                
                // Първо, опитваме да намерим полето с дата
                const dateFields = Object.keys(transaction).filter(key => 
                    key.toLowerCase().includes('date') || key.toLowerCase().includes('дата'));
                
                // Ако имаме поне едно поле с дата, опитваме да го използваме
                if (dateFields.length > 0) {
                    for (const field of dateFields) {
                        try {
                            if (transaction[field]) {
                                // Проверяваме различни формати
                                let transactionDate;
                                
                                // Опитваме да парснем датата директно
                                transactionDate = new Date(transaction[field]);
                                
                                if (!isNaN(transactionDate.getTime())) {
                                    dateValue = transactionDate;
                                    dateParsed = true;
                                    break;
                                }
                            }
                        } catch (e) {
                            // Продължаваме със следващото поле
                            console.log('Грешка при парсване на дата:', e);
                        }
                    }
                }
                
                // Проверяваме и известни имена на полета
                if (!dateParsed) {
                    const possibleDateFields = ['Started Date', 'Start Date', 'Date', 'CompletedDate', 'Completed Date'];
                    
                    for (const field of possibleDateFields) {
                        if (transaction[field]) {
                            try {
                                const transactionDate = new Date(transaction[field]);
                                if (!isNaN(transactionDate.getTime())) {
                                    dateValue = transactionDate;
                                    dateParsed = true;
                                    break;
                                }
                            } catch (e) {
                                // Продължаваме със следващото поле
                            }
                        }
                    }
                }
                
                if (dateParsed && dateValue) {
                    const transactionTime = dateValue.getTime();
                    const filterTime = filters.endDate.getTime();
                    
                    // Проверяваме дали датата на транзакцията е след крайната дата
                    if (transactionTime > filterTime) {
                        keepTransaction = false;
                    }
                }
            }
            
            // Филтриране по валута
            if (filters.currency && filters.currency !== 'all' && keepTransaction) {
                // Проверка за различни варианти на поле за валута
                const possibleCurrencyFields = ['Currency', 'currency', 'CURRENCY'];
                let hasCurrencyMatch = false;
                
                for (const field of possibleCurrencyFields) {
                    if (transaction[field] && 
                        transaction[field].toUpperCase() === filters.currency.toUpperCase()) {
                        hasCurrencyMatch = true;
                        break;
                    }
                }
                
                if (!hasCurrencyMatch && filters.currency !== 'all') {
                    keepTransaction = false;
                }
            }
            
            // Филтриране по тип транзакция
            if (filters.type && filters.type !== 'all' && keepTransaction) {
                // Проверка за различни варианти на поле за тип
                const possibleTypeFields = ['Type', 'type', 'TYPE', 'TransactionType', 'transactionType'];
                let hasTypeMatch = false;
                
                for (const field of possibleTypeFields) {
                    if (transaction[field] && 
                        transaction[field].toUpperCase() === filters.type.toUpperCase()) {
                        hasTypeMatch = true;
                        break;
                    }
                }
                
                if (!hasTypeMatch && filters.type !== 'all') {
                    keepTransaction = false;
                }
            }
            
            return keepTransaction;
        });
        
        // Филтрирането приключи
        
        return filtered;
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
            this.elements.startDateDisplay.value = formattedStartDate;
        }
        
        if (endDate) {
            const formattedEndDate = `${padZero(endDate.getDate())}.${padZero(endDate.getMonth() + 1)}.${endDate.getFullYear()}`;
            this.elements.endDateDisplay.value = formattedEndDate;
        }
        
        // Помощна функция за добавяне на водеща нула
        function padZero(num) {
            return num.toString().padStart(2, '0');
        }
    }
    
    /**
     * Настройване на слушатели за полетата за дати
     */
    setupDateInputListeners() {
        
        // Проверка дали елементите са налични
        if (!this.elements.startDateInput || !this.elements.endDateInput || 
            !this.elements.startDateDisplay || !this.elements.endDateDisplay) {
            console.error('FilterManager: Липсват някои от елементите за дати!');
            return;
        }
        // Слушатели за скритите date полета
        this.elements.startDateInput.addEventListener('change', (event) => {
            if (event.target.value) {
                const date = new Date(event.target.value);
                // Обновяваме видимото текстово поле с български формат
                this.elements.startDateDisplay.value = this.formatDateForDisplay(date);
            }
        });
        
        this.elements.endDateInput.addEventListener('change', (event) => {
            if (event.target.value) {
                const date = new Date(event.target.value);
                // Обновяваме видимото текстово поле с български формат
                this.elements.endDateDisplay.value = this.formatDateForDisplay(date);
            }
        });
        
        // Слушатели за видимите текстови полета
        this.elements.startDateDisplay.addEventListener('change', (event) => {
            if (event.target.value) {
                // Парсваме българския формат
                const date = this.parseBulgarianDate(event.target.value);
                if (date && !isNaN(date.getTime())) {
                    // Обновяваме скритото date поле
                    this.elements.startDateInput.value = this.formatDateForDateInput(date);
                }
            }
        });
        
        this.elements.endDateDisplay.addEventListener('change', (event) => {
            if (event.target.value) {
                // Парсваме българския формат
                const date = this.parseBulgarianDate(event.target.value);
                if (date && !isNaN(date.getTime())) {
                    // Обновяваме скритото date поле
                    this.elements.endDateInput.value = this.formatDateForDateInput(date);
                }
            }
        });
        
        // Клик върху текстовите полета отваря календарите
        this.elements.startDateDisplay.addEventListener('click', () => {
            console.log('FilterManager: Клик върху startDateDisplay', this.elements.startDateInput);
            // Директно кликаме върху скрития input[type="date"], вместо да разчитаме на showPicker()
            try {
                this.elements.startDateInput.click();
                // Алтернативен подход, ако кликът не работи
                if (typeof this.elements.startDateInput.showPicker === 'function') {
                    this.elements.startDateInput.showPicker();
                }
            } catch (error) {
                console.error('FilterManager: Грешка при опит за отваряне на календара:', error);
            }
        });
        
        this.elements.endDateDisplay.addEventListener('click', () => {
            console.log('FilterManager: Клик върху endDateDisplay', this.elements.endDateInput);
            // Директно кликаме върху скрития input[type="date"], вместо да разчитаме на showPicker()
            try {
                this.elements.endDateInput.click();
                // Алтернативен подход, ако кликът не работи
                if (typeof this.elements.endDateInput.showPicker === 'function') {
                    this.elements.endDateInput.showPicker();
                }
            } catch (error) {
                console.error('FilterManager: Грешка при опит за отваряне на календара:', error);
            }
        });
    }
    
    /**
     * Форматиране на дата за визуализация във формат дд.мм.гггг
     * @param {Date} date - Дата
     * @returns {string} Форматирана дата
     */
    formatDateForDisplay(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}.${month}.${year}`;
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
     * Задаване на филтър за диапазон от дати
     * @param {Date} startDate - Начална дата
     * @param {Date} endDate - Крайна дата
     */
    setDateRange(startDate, endDate) {
        console.log('FilterManager: setDateRange извикан', {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
        
        // Задаваме стойности на скритите date полета
        const formattedStartDate = this.formatDateForDateInput(startDate);
        const formattedEndDate = this.formatDateForDateInput(endDate);
        
        this.elements.startDateInput.value = formattedStartDate;
        this.elements.endDateInput.value = formattedEndDate;
        
        console.log('FilterManager: Дати след форматиране', {
            formattedStartDate,
            formattedEndDate
        });
        
        // Синхронизираме визуалните полета
        this.syncDateFields();
        
        // Извикваме събитие change за датовите полета, за да се задействат слушателите
        const changeEvent = new Event('change', { bubbles: true });
        this.elements.startDateInput.dispatchEvent(changeEvent);
        this.elements.endDateInput.dispatchEvent(changeEvent);
        
        // Директно прилагаме филтрите веднага
        console.log('FilterManager: Автоматично прилагане на филтри след промяна на датите');
        // Директно извикваме applyFilters след 50ms, за да се уверим, че събитията са обработени
        setTimeout(() => {
            this.applyFilters();
        }, 50);
    }
    
    /**
     * Настройване на датите за последната седмица
     */
    setDateRangeLastWeek() {
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        
        console.log('FilterManager: setDateRangeLastWeek извикан', {
            oneWeekAgo: oneWeekAgo.toISOString(),
            today: today.toISOString()
        });
        
        // Пряко манипулиране на таблицата с транзакции преди да зададем датите
        const transactionsTableBody = document.getElementById('transactions-table-body');
        if (transactionsTableBody) {
            // Изчистваме таблицата
            transactionsTableBody.innerHTML = '';
            console.log('FilterManager: Таблицата с транзакции е изчистена в setDateRangeLastWeek');
        }
        
        // Задаваме датите
        this.setDateRange(oneWeekAgo, today);
    }
    
    /**
     * Групиране на транзакции по търговци
     * @param {Array} transactions - Масив с транзакции
     * @returns {Object} Обект с групирани данни по търговци
     */
    groupTransactionsByMerchant(transactions) {
        // Създаваме обект за съхранение на групираните данни
        const merchantsMap = {};

        // Обхождаме всички транзакции
        transactions.forEach(transaction => {
            // Използваме Description като име на търговеца
            const merchantName = transaction.Description || 'Неизвестен';
            const amount = parseFloat(transaction.Amount) || 0;

            // Ако търговецът не съществува в обекта, го създаваме
            if (!merchantsMap[merchantName]) {
                merchantsMap[merchantName] = {
                    count: 0,
                    totalAmount: 0,
                    transactions: []
                };
            }

            // Увеличаваме броя транзакции и общата сума
            merchantsMap[merchantName].count += 1;
            merchantsMap[merchantName].totalAmount += amount;
            merchantsMap[merchantName].transactions.push(transaction);
        });

        return merchantsMap;
    }

    /**
     * Изчисляване на обобщени статистики за транзакциите
     * @param {Array} transactions - Масив с транзакции
     * @returns {Object} Обект със статистики
     */
    calculateTransactionStats(transactions) {
        // Изчисляваме общата сума
        const totalAmount = transactions.reduce((sum, transaction) => {
            return sum + (parseFloat(transaction.Amount) || 0);
        }, 0);
        
        // Изчисляваме средната стойност
        const averageAmount = transactions.length > 0 
            ? totalAmount / transactions.length 
            : 0;
            
        return {
            count: transactions.length,
            totalAmount: totalAmount,
            averageAmount: averageAmount
        };
    }
    
    /**
     * Подготвяне на данните за графиката вместо директно обновяване
     * @param {Object} merchantsData - Групирани данни по търговци
     */
    updateChart(merchantsData) {
        try {
            // Просто запазваме данните в глобален обект, който е достъпен за ChartComponent
            // Важно: Преобразуваме данните в подходящ формат за ChartComponent
            const formattedMerchants = Object.entries(merchantsData)
                .map(([name, data]) => {
                    // Експлицитно превръщаме името в стринг
                    const merchantName = String(name);
                    return {
                        name: merchantName,
                        totalAmount: Math.abs(data.totalAmount || 0),
                        count: data.count || 0
                    };
                })
                .sort((a, b) => b.totalAmount - a.totalAmount);
            
            // Запазваме подготвените данни и оставяме ChartComponent да ги използва
            this.preparedChartData = formattedMerchants;
            
            // Само логваме действието, но не правим директна актуализация на DOM
            // Данните за графиката са подготвени
            
            // ВАЖНО: Не обновяваме графиката директно, това ще се направи от DashboardView > ChartComponent
            
        } catch (error) {
            console.error('FilterManager: Грешка при подготовка на данните за графиката:', error);
        }
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
