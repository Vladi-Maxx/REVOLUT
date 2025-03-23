/**
 * Основен изглед на финансовото табло
 */
class DashboardView {
    constructor() {
        // Инициализиране на SupabaseService
        this.supabaseService = supabaseService;
        
        // Инициализиране на компонентите
        console.log('%c[DashboardView] Инициализиране на компоненти', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
        
        // Проверка на HTML елементите за графиките
        const merchantsChartElement = document.getElementById('merchants-chart');
        const categoriesChartElement = document.getElementById('categories-chart');
        
        console.log('%c[DashboardView] HTML елементи за графики:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', {
            'merchants-chart': merchantsChartElement,
            'categories-chart': categoriesChartElement
        });
        
        this.summaryComponent = new SummaryComponent();
        this.merchantsTableComponent = new MerchantsTableComponent();
        this.chartComponent = new ChartComponent();
        this.categoryChartComponent = new CategoryChartComponent();
        this.transactionsTableComponent = new TransactionsTableComponent();
        
        // Инициализиране на елементите за филтриране
        this.startDateInput = document.getElementById('start-date');
        this.endDateInput = document.getElementById('end-date');
        this.currencySelect = document.getElementById('currency');
        this.transactionTypeSelect = document.getElementById('transaction-type');
        this.applyFiltersButton = document.getElementById('apply-filters');
        
        // Инициализиране на CSV импортера
        this.csvImporter = new CsvImporter({
            supabaseService: this.supabaseService,
            csvUtils: CsvUtils,
            notificationCallback: this.showNotification.bind(this),
            onImportSuccess: this.loadData.bind(this)
        });
        
        // Инициализиране на елементите за бързи филтри
        this.lastWeekButton = document.getElementById('last-week');
        this.currentMonthButton = document.getElementById('current-month');
        this.lastMonthButton = document.getElementById('last-month');
        this.currentYearButton = document.getElementById('current-year');
        
        // Инициализиране на Filter Manager-а
        this.filterManager = new FilterManager({
            elements: {
                startDateInput: this.startDateInput,
                endDateInput: this.endDateInput,
                currencySelect: this.currencySelect,
                transactionTypeSelect: this.transactionTypeSelect,
                applyFiltersButton: this.applyFiltersButton
            },
            supabaseService: this.supabaseService,
            dataUtils: DataUtils,
            notificationCallback: this.showNotification.bind(this),
            onFilterSuccess: async (result) => {
                // Обновяваме графиката и summary панелите, без да извикваме отново applyFilters
                if (result && result.success) {
                    // 1. Обновяваме summary панелите
                    if (result.stats) {
                        this.summaryComponent.updateSummary(result.stats);
                    }
                    
                    // 2. Обновяваме таблицата с търговци
                    if (result.filteredTransactions && result.filteredTransactions.length > 0) {
                        const merchantsData = DataUtils.groupTransactionsByMerchant(result.filteredTransactions);
                        this.merchantsTableComponent.updateTable(merchantsData);
                    }
                    
                    // 3. Подготовка на данни за графиката на търговци
                    let chartData = [];
                    
                    // Използваме подготвените данни от FilterManager
                    if (result.merchantsData && result.merchantsData.length > 0) {
                        chartData = result.merchantsData;
                    }
                    
                    // Обновяваме графиката за търговци
                    if (chartData && chartData.length > 0) {
                        this.chartComponent.updateChart(chartData);
                    }
                    
                    // 4. Обновяваме графиката за категории
                    if (result.filteredTransactions && result.filteredTransactions.length > 0) {
                        // Вземаме всички категории
                        const categories = await this.supabaseService.getAllCategories();
                        
                        // Вземаме мапинга между търговци и категории
                        const merchantCategoryMapping = await this.supabaseService.getMerchantCategoryMapping();
                        
                        // Добавяме category_id към всяка транзакция
                        result.filteredTransactions.forEach(transaction => {
                            const merchantName = transaction.Description;
                            transaction.category_id = merchantCategoryMapping[merchantName] || null;
                        });
                        
                        // Подготовка на данни за графиката на категории
                        const categoryData = DataUtils.groupTransactionsByCategory(result.filteredTransactions, categories);
                        
                        // Обновяваме графиката за категории
                        if (categoryData && categoryData.length > 0) {
                            this.categoryChartComponent.updateChart(categoryData);
                        }
                    }
                }
            }
        });
        
        // Инициализиране на QuickFilterManager-а
        this.quickFilterManager = new QuickFilterManager({
            elements: {
                lastWeekButton: this.lastWeekButton,
                currentMonthButton: this.currentMonthButton,
                lastMonthButton: this.lastMonthButton,
                currentYearButton: this.currentYearButton
            },
            filterManager: this.filterManager,
            // Свързваме callback функцията с правилния контекст (this)
            applyFiltersCallback: () => this.applyFilters()
        });
        
        // Инициализиране на филтрите
        this.filterManager.initFilters();
        
        // Добавяне на слушатели за събития
        this.addEventListeners();
        
        // Съхраняваме текущо филтрираните транзакции
        this.filteredTransactions = [];
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
        
        // Задаване на начални стойности за датите с използване на DateUtils
        const { startDate, endDate } = DateUtils.getLastMonthRange();
        
        // Задаваме стойности на скритите date полета
        this.startDateInput.value = DateUtils.formatDateForDateInput(startDate);
        this.endDateInput.value = DateUtils.formatDateForDateInput(endDate);
        
        // Задаваме стойности на видимите текстови полета
        this.startDateDisplay.value = DataUtils.formatDate(startDate);
        this.endDateDisplay.value = DataUtils.formatDate(endDate);
    }

    /**
     * Връща инстанцията на SupabaseService
     * @returns {Object} Инстанция на SupabaseService
     */
    getSupabaseService() {
        return this.supabaseService;
    }
    
    /**
     * Добавяне на слушатели за събития
     */
    addEventListeners() {
        // Слушател за избор на търговец
        this.merchantsTableComponent.setOnMerchantSelectListener((merchant) => {
            this.onMerchantSelect(merchant);
        });
        
        // Слушател за изтриване на транзакция
        this.transactionsTableComponent.setDeleteTransactionCallback((transactionId, transaction) => {
            this.deleteTransaction(transactionId, transaction);
        });
        
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
        
        // Добавяме директен слушател за бутона за прилагане на филтри
        const applyFiltersBtn = document.getElementById('apply-filters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.applyFilters();
            });
        }
        
        // Добавяме слушател за избор на категория от графиката
        this.categoryChartComponent.setOnCategorySelectCallback((category) => {
            this.onCategorySelect(category);
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
            // Зареждане на транзакции
            if (transactions && transactions.length > 0) {

            }
            
            // Ако няма транзакции, показваме съобщение
            if (!transactions || transactions.length === 0) {
                this.showNoDataMessage();
                return;
            }
            
            // Запазваме всички транзакции
            this.allTransactions = transactions;
            
            // Попълваме селектите за валута и тип транзакция
            this.filterManager.populateFilters(this.allTransactions);
            
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
            
            // Използваме филтър мениджъра за прилагане на филтрите
            const result = await this.filterManager.applyFilters(this.allTransactions);
            
            // Ако има грешка, показваме съобщение и прекратяваме
            if (!result.success) {
                this.showErrorMessage('Възникна грешка при филтриране на данните: ' + result.error);
                return;
            }
            
            // Извличаме филтрираните транзакции от резултата
            const filteredTransactions = result.filteredTransactions;
            
            // Запазваме филтрираните транзакции за използване при филтриране по категория
            this.filteredTransactions = filteredTransactions;
            
            // Ако няма транзакции, показваме съобщение
            if (!filteredTransactions || filteredTransactions.length === 0) {
                this.showNoDataMessage();
                return;
            }
            
            // Групираме транзакциите по търговци
            const merchantsData = DataUtils.groupTransactionsByMerchant(filteredTransactions);
            
            // Проверяваме DOM елементите на таблиците
            const merchantsTableBody = document.getElementById('merchants-table-body');
            const transactionsTableBody = document.getElementById('transactions-table-body');
            
            // Проверка на DOM елементи
            
            // Пряко обновяване на таблицата с транзакции, ако елементът съществува
            if (transactionsTableBody) {
                // Изчистваме таблицата
                transactionsTableBody.innerHTML = '';
                

                
                // Вместо директно да добавяме редове, използваме компонента за транзакции
                // Това ще гарантира, че слушателите за събития се добавят правилно
                this.transactionsTableComponent.updateTable(filteredTransactions);
                
                // Не е нужно да добавяме редове ръчно, тъй като компонентът вече се грижи за това
                
                // Таблицата с транзакции е обновена успешно
            }
            
            // Обновяваме компонентите чрез стандартния механизъм
            // Подготовка на данните за сумари компонент
            
            // Обновяваме всички компоненти с филтрираните данни
            this.summaryComponent.updateSummary(result.stats);
            this.merchantsTableComponent.updateTable(merchantsData);
            this.transactionsTableComponent.updateTable(filteredTransactions);
            
            // Подготовка на данни за графиката на търговци
            let chartData = [];
            
            // Използваме подготвените данни от FilterManager, ако са налични
            if (this.filterManager && this.filterManager.preparedChartData && this.filterManager.preparedChartData.length > 0) {
                chartData = this.filterManager.preparedChartData;
            } else {
                // Ако нямаме данни от FilterManager, използваме DataUtils.prepareChartData
                chartData = DataUtils.prepareChartData(merchantsData);
            }
            
            // Обновяваме графиката за търговци
            if (chartData && chartData.length > 0) {
                this.chartComponent.updateChart(chartData);
            } else {
                console.warn('DashboardView: Няма валидни данни за графиката на търговци');
            }
            
            // Вземаме всички категории
            console.log('%c[DashboardView] Извличане на категории', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;');
            const categories = await this.supabaseService.getAllCategories();
            console.log('%c[DashboardView] Получени категории:', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;', categories);
            
            // Вземаме мапинга между търговци и категории
            console.log('%c[DashboardView] Извличане на мапинг между търговци и категории', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;');
            const merchantCategoryMapping = await this.supabaseService.getMerchantCategoryMapping();
            
            // Добавяме category_id към всяка транзакция
            filteredTransactions.forEach(transaction => {
                const merchantName = transaction.Description;
                transaction.category_id = merchantCategoryMapping[merchantName] || null;
            });
            
            // Подготовка на данни за графиката на категории
            console.log('%c[DashboardView] Групиране на транзакции по категории', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;', {
                'Брой филтрирани транзакции': filteredTransactions.length,
                'Брой категории': categories.length
            });
            const categoryData = DataUtils.groupTransactionsByCategory(filteredTransactions, categories);
            console.log('%c[DashboardView] Резултат от групирането по категории:', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;', categoryData);
            
            // Обновяваме графиката за категории
            if (categoryData && categoryData.length > 0) {
                console.log('%c[DashboardView] Обновяване на графиката за категории', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;');
                this.categoryChartComponent.updateChart(categoryData);
            } else {
                console.warn('%c[DashboardView] Няма валидни данни за графиката на категории', 'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;');
            }
            
        } catch (error) {
            console.error('%c[DashboardView] Грешка при прилагане на филтри:', 'background: #c0392b; color: white; padding: 2px 5px; border-radius: 3px;', error);
            this.showErrorMessage('Възникна грешка при филтриране на данните.');
        }
    }

    // filterTransactionsLocally() е преместен във FilterManager

    // populateFilters() е преместен във FilterManager

    // populateSelect() е преместен във FilterManager

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
     * Обработка при избор на категория
     * @param {Object} category - Обект с данни за категорията
     */
    async onCategorySelect(category) {
        console.log('%c[DashboardView] Избрана категория:', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;', category);
        
        if (!category) {
            // Ако категорията е null, показваме всички транзакции (изчистваме филтъра)
            this.transactionsTableComponent.updateTable(this.filteredTransactions);
            
            // Обновяваме и останалите компоненти с всички филтрирани транзакции
            const merchantsData = DataUtils.groupTransactionsByMerchant(this.filteredTransactions);
            this.merchantsTableComponent.updateTable(merchantsData);
            
            // Обновяваме статистиките
            const stats = DataUtils.calculateTransactionStats(this.filteredTransactions);
            this.summaryComponent.updateSummary(stats);
            
            // Скриваме индикатора за филтър по категория
            const filterIndicator = document.getElementById('category-filter-indicator');
            if (filterIndicator) {
                filterIndicator.style.display = 'none';
            }
            
            return;
        }
        
        // Проверяваме дали е избрана категорията "Некатегоризирани"
        const isUncategorized = category.name === 'Некатегоризирани' || 
                               (category.originalData && category.originalData.name === 'Некатегоризирани');
        
        try {
            let merchantNames = [];
            
            if (isUncategorized) {
                // Специална обработка за некатегоризирани търговци
                console.log('%c[DashboardView] Избрана е категория "Некатегоризирани"', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;');
                
                // Вземаме всички търговци без категория
                const unassignedMerchants = await this.supabaseService.getUnassignedMerchants();
                merchantNames = unassignedMerchants.map(merchant => merchant.name);
                
                console.log('%c[DashboardView] Некатегоризирани търговци:', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;', merchantNames);
            } else {
                // Стандартна обработка за нормални категории
                // Извличаме ID на категорията от обекта
                // Категорията може да дойде в различни формати в зависимост от източника
                const categoryId = category.id || (category.originalData && category.originalData.id);
                
                // Ако ID все още е undefined, опитваме да го извлечем от името на категорията
                if (!categoryId && category.name) {
                    // Извличаме категорията по име от всички категории
                    const allCategories = await this.supabaseService.getAllCategories();
                    const foundCategory = allCategories.find(c => c.name === category.name);
                    if (foundCategory) {
                        console.log('%c[DashboardView] Намерена категория по име:', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;', foundCategory);
                        return this.onCategorySelect(foundCategory); // Рекурсивно извикваме функцията с намерената категория
                    }
                }
                
                console.log('%c[DashboardView] ID на избраната категория:', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;', categoryId);
                
                // Извличаме всички търговци, принадлежащи към избраната категория
                if (categoryId) {
                    merchantNames = await this.supabaseService.getMerchantsByCategory(categoryId);
                }
                
                console.log('%c[DashboardView] Търговци в категорията:', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;', merchantNames);
            }
            
            // Филтрираме транзакциите по имената на търговците от избраната категория
            const categoryTransactions = this.filteredTransactions.filter(transaction => {
                // Проверяваме дали името на търговеца (Description) е в списъка с търговци от категорията
                return merchantNames.includes(transaction.Description);
            });
            
            console.log('%c[DashboardView] Брой транзакции в категорията:', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;', categoryTransactions.length);
            
            // Обновяваме таблицата с транзакции, показвайки само тези от избраната категория
            this.transactionsTableComponent.updateTable(categoryTransactions);
            
            // Групираме транзакциите по търговци и обновяваме таблицата с търговци
            const merchantsData = DataUtils.groupTransactionsByMerchant(categoryTransactions);
            this.merchantsTableComponent.updateTable(merchantsData);
            
            // Изчисляваме и обновяваме статистиките
            const stats = DataUtils.calculateTransactionStats(categoryTransactions);
            this.summaryComponent.updateSummary(stats);
            
            // Добавяме визуална индикация, че е приложен филтър по категория
            const filterIndicator = document.getElementById('category-filter-indicator');
            if (filterIndicator) {
                filterIndicator.textContent = `Филтър по категория: ${category.name}`;
                filterIndicator.style.display = 'block';
                filterIndicator.style.backgroundColor = isUncategorized ? '#CCCCCC' : (category.color || '#3498db');
            }
        } catch (error) {
            console.error('%c[DashboardView] Грешка при филтриране по категория:', 'background: #c0392b; color: white; padding: 2px 5px; border-radius: 3px;', error);
            this.showErrorMessage('Възникна грешка при филтриране по категория.');
        }
    }

    /**
     * Показване на съобщение за зареждане
     */
    showLoadingMessage() {
        // Тук може да добавите логика за показване на индикатор за зареждане

    }

    /**
     * Показване на съобщение за липса на данни
     */
    showNoDataMessage() {
        // Тук може да добавите логика за показване на съобщение за липса на данни
        // Няма данни за показване
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
                // Потребителят е отказал изтриването
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
