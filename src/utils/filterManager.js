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
        
        // Задаваме стойности на date полетата
        this.elements.startDateInput.value = this.formatDateForDateInput(oneMonthAgo);
        this.elements.endDateInput.value = this.formatDateForDateInput(today);
        
        // Добавяме слушатели за полетата за дати
        this.elements.startDateInput.addEventListener('change', () => {
            this.applyFilters();
        });
        
        this.elements.endDateInput.addEventListener('change', () => {
            this.applyFilters();
        });
        
        // Добавяме слушател за бутона за прилагане на филтри
        this.elements.applyFiltersButton.addEventListener('click', () => {
            this.applyFilters();
        });
        
        // Добавяме слушател за промяна на валутата
        this.elements.currencySelect.addEventListener('change', () => {
            // Автоматично прилагаме филтрите при промяна на валутата
            this.applyFilters();
        });
        
        // Добавяме слушател за промяна на типа транзакция
        this.elements.transactionTypeSelect.addEventListener('change', () => {
            // Автоматично прилагаме филтрите при промяна на типа транзакция
            this.applyFilters();
        });
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
            
            // Запазваме текущия избран тип транзакция
            const selectedType = this.elements.transactionTypeSelect.value;
            
            // Вземаме стойностите на филтрите и конвертираме датите в правилен формат
            const startDateValue = this.elements.startDateInput.value;
            const endDateValue = this.elements.endDateInput.value;
            
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
            
            // Създаваме обект с филтри
            const filters = {
                startDate,
                endDate,
                currency: this.elements.currencySelect.value,
                type: selectedType // Използваме запазената стойност
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
            
            // Възстановяваме избрания тип транзакция след попълването на филтрите
            if (selectedType && selectedType !== 'all') {
                this.elements.transactionTypeSelect.value = selectedType;
            }
            
            // Групираме транзакциите по търговци за останалите компоненти
            const merchantsData = this.groupTransactionsByMerchant(filteredTransactions);
            
            // Изчисляваме статистики
            const stats = this.calculateTransactionStats(filteredTransactions);
            
            // ВАЖНО: Добавяме броя транзакции в двата формата (count за консистентност)
            stats.count = filteredTransactions.length;

            // Данните са филтрирани успешно
            
            // Не обновяваме таблицата с транзакции тук, тъй като това се прави в DashboardView
            // Това предотвратява дублиране на обновяването и загуба на слушателите за събития
            
            // Не обновяваме таблицата с търговци тук, тъй като това се прави в DashboardView
            // Това предотвратява дублиране на обновяването и загуба на слушателите за събития
            
            // Премахваме прякото обновяване на DOM тук,
            // защото вече използваме SummaryComponent в DashboardView
            
            // 4. Обновяваме графиката с топ търговци
            this.updateChart(merchantsData);
            
            // Всички UI компоненти са обновени
            
            // Създаваме обект с резултатите
            const result = {
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
            
            // Извикваме callback функцията onFilterSuccess, ако е зададена
            if (this.onFilterSuccess && typeof this.onFilterSuccess === 'function') {
                this.onFilterSuccess(result);
            }
            
            // Връщаме резултатите
            return result;
            
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
                // Проверка за съвпадение на типа
                const normalizedTransactionType = transaction.Type ? String(transaction.Type).trim().toUpperCase() : '';
                const normalizedFilterType = String(filters.type).trim().toUpperCase();
                
                // Проверяваме за съвпадение или частично съвпадение
                if (normalizedTransactionType === normalizedFilterType || 
                    normalizedTransactionType.includes(normalizedFilterType) || 
                    normalizedFilterType.includes(normalizedTransactionType)) {
                    return true;
                }
                
                // Ако няма директно съвпадение, проверяваме за други полета
                const possibleTypeFields = ['type', 'TYPE', 'TransactionType', 'transactionType', 'Transaction Type', 'transaction_type'];
                
                // Проверяваме в алтернативните полета
                for (const field of possibleTypeFields) {
                    if (transaction[field]) {
                        const transactionType = String(transaction[field]).trim().toUpperCase();
                        
                        if (transactionType === normalizedFilterType) {
                            return true;
                        }
                    }
                }
                
                // Ако стигнем дотук, няма съвпадение и транзакцията трябва да бъде филтрирана
                keepTransaction = false;
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
        
        // Филтрираме нулеви и празни стойности
        const validOptions = options.filter(option => option !== null && option !== undefined && option !== '');
        
        // Добавяме останалите опции
        validOptions.forEach(option => {
            const optionElement = document.createElement('option');
            // Преобразуваме в стринг и премахваме излишните интервали
            const optionValue = String(option).trim();
            optionElement.value = optionValue;
            optionElement.textContent = optionValue;
            selectElement.appendChild(optionElement);
        });
    }
    

    

    

    

    
    /**
     * Празен метод за съвместимост със стария код
     * @deprecated Този метод е оставен само за съвместимост и ще бъде премахнат в бъдещи версии
     */
    syncDateFields() {
        // Празен метод за съвместимост
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
        // Задаваме стойности на date полетата
        const formattedStartDate = this.formatDateForDateInput(startDate);
        const formattedEndDate = this.formatDateForDateInput(endDate);
        
        this.elements.startDateInput.value = formattedStartDate;
        this.elements.endDateInput.value = formattedEndDate;
        
        // Извикваме събитие change за датовите полета, за да се задействат слушателите
        const changeEvent = new Event('change', { bubbles: true });
        this.elements.startDateInput.dispatchEvent(changeEvent);
        this.elements.endDateInput.dispatchEvent(changeEvent);
        
        // Директно прилагаме филтрите веднага
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
        
        // Пряко манипулиране на таблицата с транзакции преди да зададем датите
        const transactionsTableBody = document.getElementById('transactions-table-body');
        if (transactionsTableBody) {
            // Изчистваме таблицата
            transactionsTableBody.innerHTML = '';
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
