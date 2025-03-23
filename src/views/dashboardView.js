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
        
        // Инициализиране на елементите за филтриране
        this.startDateInput = document.getElementById('start-date');
        this.endDateInput = document.getElementById('end-date');
        this.currencySelect = document.getElementById('currency');
        this.transactionTypeSelect = document.getElementById('transaction-type');
        this.applyFiltersButton = document.getElementById('apply-filters');
        
        // Инициализиране на елементите за бързи филтри
        this.lastWeekButton = document.getElementById('last-week');
        this.currentMonthButton = document.getElementById('current-month');
        this.lastMonthButton = document.getElementById('last-month');
        this.currentYearButton = document.getElementById('current-year');
        
        // Инициализираме компонентите в правилния ред
        this.initComponents();
        
        // Инициализираме филтъра
        this.initFilters();
        
        // Добавяме индикатор за филтъра по категория
        this.createCategoryFilterIndicator();
        
        // Инициализиране на CSV импортера
        this.csvImporter = new CsvImporter({
            supabaseService: this.supabaseService,
            csvUtils: CsvUtils,
            notificationCallback: this.showNotification.bind(this),
            onImportSuccess: this.loadData.bind(this)
        });
        
        // Слушатели за събития
        this.addEventListeners();
        
        // Зареждане на данни
        this.loadData();
    }

    /**
     * Инициализиране на компонентите
     */
    initComponents() {
        // Инициализираме компонента за таблицата с търговци
        this.merchantsTableComponent = new MerchantsTableComponent();
        
        // Инициализираме компонента за таблицата с транзакции
        this.transactionsTableComponent = new TransactionsTableComponent();
        
        // Инициализираме компонента за графиката за топ търговци
        this.chartComponent = new ChartComponent();
        
        // Инициализираме компонента за графиката за категории
        this.categoryChartComponent = new CategoryChartComponent();
        window.categoryChartComponent = this.categoryChartComponent; // за достъп от FilterManager
        
        // Инициализираме компонента за сумарни стойности
        this.summaryComponent = new SummaryComponent();
        
        // Не инициализираме MerchantSelectionManager тук, 
        // това ще стане след инициализацията на filterManager в initFilters
    }
    
    /**
     * Инициализира мениджъра за избор на търговци
     */
    initMerchantSelectionManager() {
        console.log('%c[DashboardView] Инициализиране на MerchantSelectionManager', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;');
        
        // Проверяваме дали имаме инициализиран FilterManager
        if (!this.filterManager) {
            console.error('%c[DashboardView] Грешка при инициализиране на MerchantSelectionManager: FilterManager не е инициализиран', 'background: #c0392b; color: white; padding: 2px 5px; border-radius: 3px;');
            return;
        }
        
        // Създаваме нова инстанция на MerchantSelectionManager
        this.merchantSelectionManager = new MerchantSelectionManager({
            supabaseService: this.supabaseService,
            filterManager: this.filterManager,
            onFilterApplied: (result) => this.handleFilterResult(result)
        });
        
        // Свързваме го с компонента за таблицата с търговци
        if (this.merchantsTableComponent) {
            console.log('%c[DashboardView] Свързване на MerchantSelectionManager с таблицата за търговци', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;');
            this.merchantsTableComponent.setMerchantSelectionManager(this.merchantSelectionManager);
        } else {
            console.error('%c[DashboardView] Грешка при свързване на MerchantSelectionManager: MerchantsTableComponent не е инициализиран', 'background: #c0392b; color: white; padding: 2px 5px; border-radius: 3px;');
        }
    }
    
    /**
     * Създава индикатор за филтъра по категория
     */
    createCategoryFilterIndicator() {
        // Проверяваме дали вече съществува
        let categoryIndicator = document.getElementById('category-filter-indicator');
        
        if (!categoryIndicator) {
            // Създаваме контейнер за филтри, ако не съществува
            let filtersContainer = document.querySelector('.filters-container');
            if (!filtersContainer) {
                filtersContainer = document.createElement('div');
                filtersContainer.className = 'filters-container';
                
                // Намираме елемента, след който да добавим контейнера за филтри
                const filtersSection = document.querySelector('.filters-section');
                if (filtersSection) {
                    filtersSection.appendChild(filtersContainer);
                }
            }
            
            // Създаваме индикатора като div
            categoryIndicator = document.createElement('div');
            categoryIndicator.id = 'category-filter-indicator';
            categoryIndicator.className = 'filter-indicators';
            categoryIndicator.style.display = 'none';
            
            // Добавяме етикет
            const label = document.createElement('span');
            label.className = 'filter-indicator-label';
            label.textContent = 'Филтър по категория:';
            
            // Добавяме елемент за името на категорията
            const categoryName = document.createElement('div');
            categoryName.className = 'filter-indicator category-name';
            
            // Добавяме бутон за затваряне
            const closeButton = document.createElement('button');
            closeButton.className = 'close-indicator';
            closeButton.innerHTML = '&times;';
            closeButton.title = 'Премахни филтър';
            
            // Добавяме слушател за бутона за затваряне
            closeButton.addEventListener('click', () => {
                // Извикваме функцията за избор на категория с null
                if (this.categoryChartComponent) {
                    this.categoryChartComponent.unselectCategory();
                    this.onCategorySelect(null);
                }
            });
            
            // Добавяме елементите към индикатора
            categoryIndicator.appendChild(label);
            categoryIndicator.appendChild(categoryName);
            categoryIndicator.appendChild(closeButton);
            
            // Добавяме индикатора към контейнера за филтри
            filtersContainer.appendChild(categoryIndicator);
        }
        
        return categoryIndicator;
    }

    /**
     * Инициализация на филтрите
     */
    initFilters() {
        console.log('%c[DashboardView] Инициализиране на филтри', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;');
        
        // Намираме елементите на интерфейса за филтриране
        const elements = {
            startDateInput: document.getElementById('start-date'),
            endDateInput: document.getElementById('end-date'),
            currencySelect: document.getElementById('currency'),
            transactionTypeSelect: document.getElementById('transaction-type'),
            applyFiltersButton: document.getElementById('apply-filters')
        };
        
        // Инициализираме FilterManager
        this.filterManager = new FilterManager({
            elements: elements,
            supabaseService: this.supabaseService,
            dataUtils: DataUtils,
            notificationCallback: (message, type) => this.showNotification(message, type),
            onFilterSuccess: (result) => this.handleFilterResult(result)
        });
        
        // Инициализираме филтрите
        this.filterManager.initFilters();
        
        // Задаваме callback за избор на категория
        if (this.categoryChartComponent) {
            console.log('%c[DashboardView] Задаване на callback за избор на категория', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;');
            this.categoryChartComponent.setOnCategorySelectCallback((category) => {
                this.onCategorySelect(category);
            });
        }
        
        // Инициализираме MerchantSelectionManager
        this.initMerchantSelectionManager();
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
            const transactions = await this.supabaseService.getAllTransactions();
            
            // Дебъг информация за заредените транзакции
            console.log('%c[DashboardView] Заредени транзакции:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', {
                'Брой транзакции': transactions ? transactions.length : 0,
                'Пример за транзакция': transactions && transactions.length > 0 ? transactions[0] : null
            });
            
            // Ако няма транзакции, показваме съобщение
            if (!transactions || transactions.length === 0) {
                console.log('%c[DashboardView] Няма заредени транзакции!', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
                this.showNoDataMessage();
                return;
            }
            
            // Запазваме всички транзакции
            this.allTransactions = transactions;
            
            // Попълваме селектите за валута и тип транзакция
            if (this.filterManager) {
                console.log('%c[DashboardView] Попълване на селекти за филтри', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
                this.filterManager.populateFilters(this.allTransactions);
            } else {
                console.error('%c[DashboardView] FilterManager не е инициализиран!', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
            }
            
            // Прилагаме филтрите
            console.log('%c[DashboardView] Първоначално прилагане на филтри', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
            this.applyFilters();
            
        } catch (error) {
            console.error('%c[DashboardView] Грешка при зареждане на данни:', 'background: #c0392b; color: white; padding: 2px 5px; border-radius: 3px;', error);
            this.showErrorMessage('Възникна грешка при зареждане на данните.');
        }
    }

    /**
     * Прилагане на филтри
     */
    async applyFilters() {
        try {
            console.log('%c[DashboardView] Прилагане на филтри', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
            
            // Проверяваме дали имаме инициализиран FilterManager
            if (!this.filterManager) {
                console.error('%c[DashboardView] Няма инициализиран FilterManager', 'background: #c0392b; color: white; padding: 2px 5px; border-radius: 3px;');
                return;
            }
            
            // Проверяваме дали имаме инициализиран MerchantSelectionManager и избрани търговци
            let selectedMerchantNames = null;
            if (this.merchantSelectionManager && this.merchantSelectionManager.getSelectedMerchantNames().length > 0) {
                selectedMerchantNames = this.merchantSelectionManager.getSelectedMerchantNames();
                console.log('%c[DashboardView] Избрани търговци за филтриране:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', selectedMerchantNames);
            }
            
            // Извикваме метода за прилагане на филтри на FilterManager
            // с всички транзакции в кеш (ако има) и избраните търговци (ако има)
            await this.filterManager.applyFilters(this.allTransactions || null, selectedMerchantNames);
            
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
            // Ако категорията е null, това означава отмяна на филтъра по категория
            // В този случай трябва да приложим отново всички останали филтри
            console.log('%c[DashboardView] Премахване на филтър по категория и връщане към стандартните филтри', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;');
            
            // Скриваме индикатора за филтър по категория
            const filterIndicator = document.getElementById('category-filter-indicator');
            if (filterIndicator) {
                filterIndicator.style.display = 'none';
            }
            
            // Прилагаме отново стандартните филтри без категорията
            this.applyFilters();
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
            
            // Получаваме текущите филтри от интерфейса
            const currencyFilter = document.getElementById('currency').value;
            const typeFilter = document.getElementById('transaction-type').value;
            const startDateValue = document.getElementById('start-date').value;
            const endDateValue = document.getElementById('end-date').value;
            
            console.log('%c[DashboardView] Текущи филтри преди филтриране по категория:', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;', {
                startDate: startDateValue,
                endDate: endDateValue,
                currency: currencyFilter,
                type: typeFilter
            });

            // Създаваме обект с филтри
            const filters = {
                startDate: startDateValue ? new Date(startDateValue) : null,
                endDate: endDateValue ? new Date(endDateValue) : null,
                currency: currencyFilter,
                type: typeFilter
            };
            
            // Първо филтрираме транзакциите съгласно стандартните филтри
            let filteredByStandardFilters = this.allTransactions;
            
            if (this.filterManager) {
                // Използваме filterManager за прилагане на стандартните филтри
                filteredByStandardFilters = this.filterManager.filterTransactionsLocally(this.allTransactions, filters);
            }
            
            console.log('%c[DashboardView] Брой транзакции след прилагане на стандартни филтри:', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;', filteredByStandardFilters.length);

            // След това филтрираме транзакциите по имената на търговците от избраната категория
            const categoryTransactions = filteredByStandardFilters.filter(transaction => {
                // Проверяваме дали името на търговеца (Description) е в списъка с търговци от категорията
                return merchantNames.includes(transaction.Description);
            });
            
            console.log('%c[DashboardView] Брой транзакции след филтриране по категория:', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;', categoryTransactions.length);
            
            // Обновяваме таблицата с транзакции, показвайки тези от избраната категория
            this.transactionsTableComponent.updateTable(categoryTransactions);
            
            // Групираме транзакциите по търговци и обновяваме таблицата с търговци
            const merchantsData = DataUtils.groupTransactionsByMerchant(categoryTransactions);
            this.merchantsTableComponent.updateTable(merchantsData);
            
            // Обновяваме графиката за търговци с филтрираните данни
            const chartData = DataUtils.prepareChartData(merchantsData);
            this.chartComponent.updateChart(chartData);
            
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
     * Обработка на резултата от филтрирането
     * @param {Object} result - Резултат от филтрирането
     */
    handleFilterResult(result) {
        if (!result || !result.transactions) {
            console.error('%c[DashboardView] Невалиден резултат от филтрирането', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
            return;
        }
        
        try {
            const filteredTransactions = result.transactions;
            
            console.log('%c[DashboardView] Обработка на резултат от филтриране:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', {
                'Брой транзакции': filteredTransactions.length,
                'Статистики': result.stats,
                'Запазена таблица с търговци': result.preserveMerchantsTable,
                'Пример за транзакция': filteredTransactions.length > 0 ? filteredTransactions[0] : null
            });
            
            // Проверяваме дали има транзакции
            if (!filteredTransactions.length) {
                console.log('%c[DashboardView] Няма транзакции след филтриране!', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
                this.showNoDataMessage();
                return;
            }
            
            // Определяме какви данни за търговци да използваме:
            // 1. Ако preserveMerchantsTable е true, използваме предварително групираните данни от result.merchantsData
            // 2. В противен случай, генерираме нови данни от филтрираните транзакции
            let merchantsData;
            if (result.preserveMerchantsTable && result.merchantsData) {
                console.log('%c[DashboardView] Използване на запазената таблица с търговци', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;');
                merchantsData = result.merchantsData;
            } else {
                // Групираме транзакциите по търговци
                merchantsData = DataUtils.groupTransactionsByMerchant(filteredTransactions);
            }
            
            console.log('%c[DashboardView] Групирани данни по търговци:', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;', {
                'Брой групи': merchantsData ? merchantsData.length : 0,
                'Пример за група': merchantsData && merchantsData.length > 0 ? merchantsData[0] : null
            });
            
            // Обновяваме компонентите с филтрираните данни
            console.log('%c[DashboardView] Обновяване на компоненти с филтрирани данни', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
            
            if (this.summaryComponent) {
                console.log('%c[DashboardView] Обновяване на summaryComponent', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
                this.summaryComponent.updateSummary(result.stats);
            } else {
                console.error('%c[DashboardView] summaryComponent не е инициализиран!', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
            }
            
            if (this.merchantsTableComponent) {
                console.log('%c[DashboardView] Обновяване на merchantsTableComponent', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
                this.merchantsTableComponent.updateTable(merchantsData);
            } else {
                console.error('%c[DashboardView] merchantsTableComponent не е инициализиран!', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
            }
            
            if (this.transactionsTableComponent) {
                console.log('%c[DashboardView] Обновяване на transactionsTableComponent', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
                this.transactionsTableComponent.updateTable(filteredTransactions);
            } else {
                console.error('%c[DashboardView] transactionsTableComponent не е инициализиран!', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
            }
            
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
                console.warn('%c[DashboardView] Няма валидни данни за графиката на търговци', 'background: #e67e22; color: white; padding: 2px 5px; border-radius: 3px;');
            }
            
            // Подготовка на данни за графиката за категории
            this.updateCategoryChart(filteredTransactions);
            
        } catch (error) {
            console.error('%c[DashboardView] Грешка при обработка на резултата от филтрирането:', 'background: #c0392b; color: white; padding: 2px 5px; border-radius: 3px;', error);
            this.showErrorMessage('Възникна грешка при обработка на филтрираните данни.');
        }
    }

    /**
     * Обновява графиката за категории с филтрираните транзакции
     * @param {Array} filteredTransactions - Филтрирани транзакции
     */
    async updateCategoryChart(filteredTransactions) {
        try {
            // Вземаме всички категории
            console.log('%c[DashboardView] Извличане на категории', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;');
            const categories = await this.supabaseService.getAllCategories();
            
            // Вземаме мапинга между търговци и категории
            console.log('%c[DashboardView] Извличане на мапинг между търговци и категории', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;');
            const merchantCategoryMapping = await this.supabaseService.getMerchantCategoryMapping();
            
            // Добавяме category_id към всяка транзакция
            filteredTransactions.forEach(transaction => {
                const merchantName = transaction.Description;
                transaction.category_id = merchantCategoryMapping[merchantName] || null;
            });
            
            // Групиране на транзакции по категории
            console.log('%c[DashboardView] Групиране на транзакции по категории', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;', {
                'Брой филтрирани транзакции': filteredTransactions.length,
                'Брой категории': categories.length
            });
            const categoryData = DataUtils.groupTransactionsByCategory(filteredTransactions, categories);
            
            // Обновяваме графиката за категории
            if (categoryData && categoryData.length > 0) {
                console.log('%c[DashboardView] Обновяване на графиката за категории', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;');
                this.categoryChartComponent.updateChart(categoryData);
            } else {
                console.warn('%c[DashboardView] Няма валидни данни за графиката на категории', 'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;');
            }
        } catch (error) {
            console.error('%c[DashboardView] Грешка при обновяване на графиката за категории:', 'background: #c0392b; color: white; padding: 2px 5px; border-radius: 3px;', error);
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
