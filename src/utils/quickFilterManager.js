/**
 * Клас за управление на бързите филтри
 */
class QuickFilterManager {
    /**
     * Конструктор на QuickFilterManager
     * @param {Object} config - Конфигурационен обект
     * @param {Object} config.elements - DOM елементи
     * @param {HTMLElement} config.elements.lastWeekButton - Бутон за последната седмица
     * @param {HTMLElement} config.elements.currentMonthButton - Бутон за текущия месец
     * @param {HTMLElement} config.elements.lastMonthButton - Бутон за предишния месец
     * @param {HTMLElement} config.elements.currentYearButton - Бутон за текущата година
     * @param {Object} config.filterManager - FilterManager инстанция
     * @param {Function} config.applyFiltersCallback - Callback функция за прилагане на филтрите
     */
    constructor(config) {
        // Запазваме DOM елементите
        this.lastWeekButton = config.elements.lastWeekButton;
        this.currentMonthButton = config.elements.currentMonthButton;
        this.lastMonthButton = config.elements.lastMonthButton;
        this.currentYearButton = config.elements.currentYearButton;
        
        // Запазваме FilterManager инстанцията
        this.filterManager = config.filterManager;
        
        // Запазваме callback функцията за прилагане на филтрите
        this.applyFiltersCallback = config.applyFiltersCallback;
        
        // Инициализираме слушателите за бутоните
        this.setupQuickFilterListeners();
    }
    
    /**
     * Настройване на слушатели за бутоните за бързи филтри
     */
    setupQuickFilterListeners() {
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
        console.log('QuickFilterManager: Извикване на setDateRangeLastWeek');
        this.resetQuickFilterButtons();
        this.lastWeekButton.classList.add('active');
        
        // Използваме FilterManager за задаване на датов диапазон
        this.filterManager.setDateRangeLastWeek();
        
        // Директно проверяваме дали датите са актуализирани правилно
        console.log('QuickFilterManager: Дати след setDateRangeLastWeek', {
            startDate: this.filterManager.elements.startDateInput.value,
            endDate: this.filterManager.elements.endDateInput.value
        });
        
        // Прилагаме филтрите чрез callback
        this.applyFiltersCallback();
    }
    
    /**
     * Настройване на датите за текущия месец
     */
    setDateRangeCurrentMonth() {
        this.resetQuickFilterButtons();
        this.currentMonthButton.classList.add('active');
        
        // Използваме FilterManager за задаване на датов диапазон
        this.filterManager.setDateRangeCurrentMonth();
        
        // Прилагаме филтрите чрез callback
        this.applyFiltersCallback();
    }
    
    /**
     * Настройване на датите за предишния месец
     */
    setDateRangeLastMonth() {
        this.resetQuickFilterButtons();
        this.lastMonthButton.classList.add('active');
        
        // Използваме FilterManager за задаване на датов диапазон
        this.filterManager.setDateRangeLastMonth();
        
        // Прилагаме филтрите чрез callback
        this.applyFiltersCallback();
    }
    
    /**
     * Настройване на датите за текущата година
     */
    setDateRangeCurrentYear() {
        this.resetQuickFilterButtons();
        this.currentYearButton.classList.add('active');
        
        // Използваме FilterManager за задаване на датов диапазон
        this.filterManager.setDateRangeCurrentYear();
        
        // Прилагаме филтрите чрез callback
        this.applyFiltersCallback();
    }
}
