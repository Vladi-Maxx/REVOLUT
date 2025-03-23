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
        this.elements.startDateInput.value = DateUtils.formatDateForDateInput(oneMonthAgo);
        this.elements.endDateInput.value = DateUtils.formatDateForDateInput(today);
        
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
     * @param {Array} selectedMerchantNames - Имена на избрани търговци за филтриране (опционален)
     * @param {boolean} preserveMerchantsTable - Флаг, указващ дали да запази пълната таблица с търговци (опционален)
     * @returns {Promise<Object>} Резултат от филтрирането
     */
    async applyFilters(allTransactions = null, selectedMerchantNames = null, preserveMerchantsTable = false) {
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
            
            // Проверяваме дали има избрана категория
            const categoryChartComponent = window.categoryChartComponent || null;
            let selectedCategory = null;
            
            if (categoryChartComponent && typeof categoryChartComponent.getCategoryFilter === 'function') {
                selectedCategory = categoryChartComponent.getCategoryFilter();
                console.log('%c[FilterManager] Намерена избрана категория:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', selectedCategory);
            } else {
                console.log('%c[FilterManager] Няма намерена избрана категория', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
            }
            
            // Извличаме филтрираните транзакции
            let filteredTransactions;
            
            // Ако имаме всички транзакции в паметта, филтрираме локално
            if (this.allTransactions) {
                filteredTransactions = this.filterTransactionsLocally(this.allTransactions, filters);
                console.log('%c[FilterManager] Брой транзакции след базово филтриране:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', filteredTransactions.length);
            } else {
                // Иначе извличаме от базата данни
                filteredTransactions = await this.supabaseService.getTransactionsWithFilters(filters);
            }
            
            // Запазваме копие на филтрираните транзакции преди филтриране по категория или търговци
            const filteredBeforeCategory = [...filteredTransactions];
            
            // Флаг, който следи дали е приложен някакъв специален филтър (категория или търговци)
            let specialFilterApplied = false;
            
            // Ако има избрана категория, приложи и филтъра по категория
            if (selectedCategory) {
                specialFilterApplied = true;
                // Актуализирани за работа с обекта от getCategoryFilter
                const categoryId = selectedCategory.id;
                
                console.log('%c[FilterManager] Филтриране по категория:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', categoryId);
                
                // Специална обработка за некатегоризираните транзакции
                if (selectedCategory.name === 'Некатегоризирани') {
                    console.log('%c[FilterManager] Избрана е категория "Некатегоризирани"', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
                    
                    // Вземаме всички търговци без категория
                    const unassignedMerchants = await this.supabaseService.getUnassignedMerchants();
                    const unassignedMerchantNames = unassignedMerchants.map(m => m.name);
                    
                    console.log('%c[FilterManager] Некатегоризирани търговци:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', unassignedMerchantNames);
                    
                    // Филтрираме транзакциите, запазвайки само тези с некатегоризирани търговци
                    filteredTransactions = filteredTransactions.filter(transaction => {
                        return unassignedMerchantNames.includes(transaction.Description);
                    });
                } else {
                    // Стандартна категория
                    // Вземаме всички търговци в категорията
                    const merchantNames = await this.supabaseService.getMerchantsByCategory(categoryId);
                    
                    console.log('%c[FilterManager] Търговци в категорията:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', merchantNames);
                    
                    // Филтрираме транзакциите, запазвайки само тези с търговци от избраната категория
                    filteredTransactions = filteredTransactions.filter(transaction => {
                        return merchantNames.includes(transaction.Description);
                    });
                }
                
                console.log('%c[FilterManager] Брой транзакции след филтриране по категория:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', filteredTransactions.length);
                
                // Показваме индикатор за филтриране по категория
                const filterIndicator = document.getElementById('category-filter-indicator');
                if (filterIndicator) {
                    filterIndicator.style.display = 'flex';
                    
                    // Обновяваме текста и цвета на индикатора
                    const categoryNameElement = filterIndicator.querySelector('.category-name');
                    if (categoryNameElement && selectedCategory.name) {
                        categoryNameElement.textContent = selectedCategory.name;
                        
                        // Ако има цвят, променяме го
                        if (selectedCategory.color) {
                            categoryNameElement.style.backgroundColor = selectedCategory.color;
                            // Определяме контрастен цвят за текста
                            categoryNameElement.style.color = this.getContrastColor(selectedCategory.color);
                        }
                    }
                }
            } 
            // Ако има избрани търговци, приложи филтъра по търговци
            else if (selectedMerchantNames && selectedMerchantNames.length > 0) {
                specialFilterApplied = true;
                console.log('%c[FilterManager] Филтриране по избрани търговци:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', selectedMerchantNames);
                
                // Филтрираме транзакциите, запазвайки само тези с избраните търговци
                filteredTransactions = filteredTransactions.filter(transaction => {
                    return selectedMerchantNames.includes(transaction.Description);
                });
                
                console.log('%c[FilterManager] Брой транзакции след филтриране по търговци:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', filteredTransactions.length);
            }
            
            // Подготвяме два набора от данни за търговци - един филтриран и един пълен
            let preparedChartData;
            let merchantsData;
            
            if (specialFilterApplied) {
                // Ако preserveMerchantsTable е true, използваме всички филтрирани транзакции преди филтъра по търговци/категория 
                // за таблицата с търговци
                if (preserveMerchantsTable) {
                    // Подготвяме пълните данни за таблицата с търговци
                    console.log('%c[FilterManager] Запазване на пълната таблица с търговци', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
                    
                    // Използваме базовите филтрирани транзакции за таблицата с търговци
                    merchantsData = this.dataUtils.groupTransactionsByMerchant(filteredBeforeCategory);
                    
                    // Но използваме филтрираните транзакции по търговци за графиката
                    preparedChartData = this.dataUtils.prepareChartData(
                        this.dataUtils.groupTransactionsByMerchant(filteredTransactions)
                    );
                } else {
                    // Стандартно поведение ако не запазваме таблицата с търговци
                    merchantsData = this.dataUtils.groupTransactionsByMerchant(filteredTransactions);
                    preparedChartData = this.dataUtils.prepareChartData(merchantsData);
                }
            } else {
                // Ако няма специален филтър, използваме стандартните филтрирани транзакции за всички компоненти
                merchantsData = this.dataUtils.groupTransactionsByMerchant(filteredTransactions);
                preparedChartData = this.dataUtils.prepareChartData(merchantsData);
            }
            
            // Запазваме обработените данни за графики
            this.preparedChartData = preparedChartData;
            
            // Подготвяме данни със статистики за текущите транзакции
            const transactionStats = this.dataUtils.calculateTransactionStats(filteredTransactions);
            
            // Връщаме резултат с филтрираните транзакции, статистиките и данните за търговци
            const result = {
                transactions: filteredTransactions,
                stats: transactionStats,
                merchantsData: merchantsData,
                preserveMerchantsTable: preserveMerchantsTable
            };
            
            // Известяваме за успешното филтриране
            this.showNotification(`Данните са филтрирани успешно. Показани са ${filteredTransactions.length} транзакции.`);
            
            // Добавяме диагностичен лог за резултата
            console.log('%c[FilterManager] Резултат от филтрирането:', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;', {
                'Брой филтрирани транзакции': filteredTransactions.length,
                'Брой търговци': merchantsData ? merchantsData.length : 0,
                'Статистики': transactionStats,
                'Запазена таблица с търговци': preserveMerchantsTable,
                'Пример за транзакция': filteredTransactions.length > 0 ? filteredTransactions[0] : null
            });
            
            // Извикваме callback функцията с резултата
            if (this.onFilterSuccess) {
                this.onFilterSuccess(result);
            }
            
            return result;
        } catch (error) {
            console.error('%c[FilterManager] Грешка при прилагане на филтри:', 'background: #c0392b; color: white; padding: 2px 5px; border-radius: 3px;', error);
            this.showNotification(`Грешка при филтриране: ${error.message}`, 'error');
            throw error;
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
                
                let typeMatched = false;
                
                // Проверяваме за съвпадение или частично съвпадение
                if (normalizedTransactionType === normalizedFilterType || 
                    normalizedTransactionType.includes(normalizedFilterType) || 
                    normalizedFilterType.includes(normalizedTransactionType)) {
                    typeMatched = true;
                }
                
                // Ако няма директно съвпадение, проверяваме за други полета
                if (!typeMatched) {
                    const possibleTypeFields = ['type', 'TYPE', 'TransactionType', 'transactionType', 'Transaction Type', 'transaction_type'];
                    
                    // Проверяваме в алтернативните полета
                    for (const field of possibleTypeFields) {
                        if (transaction[field]) {
                            const transactionType = String(transaction[field]).trim().toUpperCase();
                            
                            if (transactionType === normalizedFilterType || 
                                transactionType.includes(normalizedFilterType) || 
                                normalizedFilterType.includes(transactionType)) {
                                typeMatched = true;
                                break;
                            }
                        }
                    }
                }
                
                // Ако няма съвпадение, филтрираме транзакцията
                if (!typeMatched) {
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
     * @param {Array} transactions - Масив с транзакции (опционален)
     */
    populateFilters(transactions = null) {
        // Ако са предоставени транзакции като параметър, използваме тях
        // В противен случай използваме локално съхранените транзакции
        const transactionsToUse = transactions || this.allTransactions;
        
        // Проверка дали имаме транзакции
        if (!transactionsToUse || transactionsToUse.length === 0) {
            console.warn('%c[FilterManager] Няма транзакции за попълване на филтрите!', 'background: #e67e22; color: white; padding: 2px 5px; border-radius: 3px;');
            return;
        }
        
        console.log('%c[FilterManager] Попълване на филтри с', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', transactionsToUse.length, 'транзакции');
        
        // Извличаме уникални валути
        const currencies = this.dataUtils.getUniqueCurrencies(transactionsToUse);
        
        // Попълваме селекта за валути
        this.populateSelect(this.elements.currencySelect, currencies, 'all', 'Всички');
        
        // Извличаме уникални типове транзакции
        const types = this.dataUtils.getUniqueTransactionTypes(transactionsToUse);
        
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
    
    // Методът formatDateForDateInput е преместен в DateUtils класа
    
    /**
     * Задаване на филтър за диапазон от дати
     * @param {Date} startDate - Начална дата
     * @param {Date} endDate - Крайна дата
     */
    setDateRange(startDate, endDate) {
        // Задаваме стойности на date полетата
        const formattedStartDate = DateUtils.formatDateForDateInput(startDate);
        const formattedEndDate = DateUtils.formatDateForDateInput(endDate);
        
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
        // Пряко манипулиране на таблицата с транзакции преди да зададем датите
        const transactionsTableBody = document.getElementById('transactions-table-body');
        if (transactionsTableBody) {
            // Изчистваме таблицата
            transactionsTableBody.innerHTML = '';
        }
        
        // Използваме DateUtils за получаване на диапазона от дати
        const { startDate, endDate } = DateUtils.getLastWeekRange();
        
        // Задаваме датите
        this.setDateRange(startDate, endDate);
    }
    
    // Методите groupTransactionsByMerchant и calculateTransactionStats са преместени в DataUtils класа
    
    /**
     * Подготвяне на данните за графиката вместо директно обновяване
     * @param {Object} merchantsData - Групирани данни по търговци
     */
    updateChart(merchantsData) {
        try {
            // Използваме DataUtils.prepareChartData за преобразуване на данните в подходящ формат за ChartComponent
            this.preparedChartData = DataUtils.prepareChartData(merchantsData);
            
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
        // Използваме DateUtils за получаване на диапазона от дати
        const { startDate, endDate } = DateUtils.getLastMonthRange();
        
        this.setDateRange(startDate, endDate);
    }
    
    /**
     * Настройване на датите за текущия месец
     */
    setDateRangeCurrentMonth() {
        // Използваме DateUtils за получаване на диапазона от дати
        const { startDate, endDate } = DateUtils.getCurrentMonthRange();
        
        this.setDateRange(startDate, endDate);
    }
    
    /**
     * Настройване на датите за текущата година
     */
    setDateRangeCurrentYear() {
        // Използваме DateUtils за получаване на диапазона от дати
        const { startDate, endDate } = DateUtils.getCurrentYearRange();
        
        this.setDateRange(startDate, endDate);
    }
    
    /**
     * Определя контрастен цвят спрямо фоновия цвят
     * @param {string} bgColor - Фонов цвят в HEX формат
     * @returns {string} Контрастен цвят за текст ("white" или "black")
     */
    getContrastColor(bgColor) {
        // Премахваме # ако съществува
        const color = bgColor.replace('#', '');
        
        // Конвертираме HEX в RGB
        const r = parseInt(color.substr(0, 2), 16);
        const g = parseInt(color.substr(2, 2), 16);
        const b = parseInt(color.substr(4, 2), 16);
        
        // Изчисляваме яркостта (по формулата на W3C)
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        // Връщаме подходящ контрастен цвят
        return brightness > 128 ? 'black' : 'white';
    }
}
