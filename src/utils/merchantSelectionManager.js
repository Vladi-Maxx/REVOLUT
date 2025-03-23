/**
 * Клас за управление на избора на търговци
 * Отговаря за избирането на множество търговци и прилагането им като филтри
 */
class MerchantSelectionManager {
    /**
     * Създава нова инстанция на MerchantSelectionManager
     * @param {Object} options - Опции за конфигурация
     * @param {Object} options.supabaseService - Услуга за достъп до базата данни
     * @param {Object} options.filterManager - Инстанция на FilterManager
     * @param {Function} options.onFilterApplied - Функция, която се извиква след прилагане на филтър
     */
    constructor({
        supabaseService,
        filterManager,
        onFilterApplied
    }) {
        // Запазваме зависимостите
        this.supabaseService = supabaseService;
        this.filterManager = filterManager;
        this.onFilterApplied = onFilterApplied;
        
        // Избрани търговци
        this.selectedMerchants = new Set();
        
        // Създаваме контейнер за визуалния индикатор
        this.createMerchantFilterIndicator();
    }
    
    /**
     * Създава контейнер за визуалния индикатор на избраните търговци
     */
    createMerchantFilterIndicator() {
        // Проверяваме дали вече съществува
        let indicatorContainer = document.getElementById('merchant-filters-container');
        
        if (!indicatorContainer) {
            // Създаваме нов контейнер за индикаторите
            indicatorContainer = document.createElement('div');
            indicatorContainer.id = 'merchant-filters-container';
            indicatorContainer.className = 'filter-indicators';
            
            // Добавяме го след контейнера за категории
            const categoryIndicator = document.getElementById('category-filter-indicator');
            if (categoryIndicator) {
                categoryIndicator.parentNode.insertBefore(indicatorContainer, categoryIndicator.nextSibling);
            } else {
                // Ако няма индикатор за категории, добавяме го към контейнера на филтрите
                const filtersContainer = document.querySelector('.filters-container');
                if (filtersContainer) {
                    filtersContainer.appendChild(indicatorContainer);
                }
            }
        }
        
        return indicatorContainer;
    }
    
    /**
     * Добавя търговец към избраните
     * @param {Object} merchant - Обект с данни за търговеца
     */
    selectMerchant(merchant) {
        if (!merchant || !merchant.name) return;
        
        // Добавяме към избраните
        this.selectedMerchants.add(merchant.name);
        
        // Визуално маркираме реда на търговеца
        this.highlightMerchantRow(merchant.name, true);
        
        // Обновяваме визуалните индикатори
        this.updateMerchantFilterIndicators();
        
        // Прилагаме филтрите
        this.applyMerchantFilters();
    }
    
    /**
     * Премахва търговец от избраните
     * @param {Object|string} merchant - Обект с данни за търговеца или име на търговец
     */
    deselectMerchant(merchant) {
        const merchantName = typeof merchant === 'string' ? merchant : merchant?.name;
        
        if (!merchantName) return;
        
        // Премахваме от избраните
        this.selectedMerchants.delete(merchantName);
        
        // Премахваме визуалното маркиране
        this.highlightMerchantRow(merchantName, false);
        
        // Обновяваме визуалните индикатори
        this.updateMerchantFilterIndicators();
        
        // Прилагаме филтрите
        this.applyMerchantFilters();
    }
    
    /**
     * Превключва състоянието на избор на търговец
     * @param {Object} merchant - Обект с данни за търговеца
     */
    toggleMerchantSelection(merchant) {
        if (!merchant || !merchant.name) return;
        
        if (this.selectedMerchants.has(merchant.name)) {
            this.deselectMerchant(merchant);
        } else {
            this.selectMerchant(merchant);
        }
    }
    
    /**
     * Проверява дали търговец е избран
     * @param {Object|string} merchant - Обект с данни за търговеца или име на търговец
     * @returns {boolean} true ако търговецът е избран
     */
    isMerchantSelected(merchant) {
        const merchantName = typeof merchant === 'string' ? merchant : merchant?.name;
        return this.selectedMerchants.has(merchantName);
    }
    
    /**
     * Изчиства всички избрани търговци
     */
    clearSelectedMerchants() {
        // Премахваме визуалното маркиране за всички търговци
        this.selectedMerchants.forEach(merchantName => {
            this.highlightMerchantRow(merchantName, false);
        });
        
        // Изчистваме списъка
        this.selectedMerchants.clear();
        
        // Премахваме визуалните индикатори
        this.updateMerchantFilterIndicators();
        
        // Прилагаме филтрите (връщаме към всички данни)
        this.applyMerchantFilters();
    }
    
    /**
     * Маркира или размаркира реда на търговец в таблицата
     * @param {string} merchantName - Име на търговеца
     * @param {boolean} selected - true за маркиране, false за размаркиране
     */
    highlightMerchantRow(merchantName, selected) {
        // Намираме реда на търговеца
        const merchantRows = document.querySelectorAll('#merchants-table-body tr');
        
        merchantRows.forEach(row => {
            const nameCell = row.querySelector('td:first-child .transaction-description');
            if (nameCell && nameCell.textContent === merchantName) {
                if (selected) {
                    row.classList.add('selected-merchant');
                } else {
                    row.classList.remove('selected-merchant');
                }
            }
        });
    }
    
    /**
     * Обновява визуалните индикатори за избраните търговци
     */
    updateMerchantFilterIndicators() {
        const indicatorContainer = document.getElementById('merchant-filters-container');
        if (!indicatorContainer) return;
        
        // Изчистваме съществуващите индикатори
        indicatorContainer.innerHTML = '';
        
        // Ако няма избрани търговци, скриваме контейнера
        if (this.selectedMerchants.size === 0) {
            indicatorContainer.style.display = 'none';
            return;
        }
        
        // Показваме контейнера
        indicatorContainer.style.display = 'flex';
        
        // Добавяме етикет
        const label = document.createElement('span');
        label.className = 'filter-indicator-label';
        label.textContent = 'Избрани търговци:';
        indicatorContainer.appendChild(label);
        
        // Брояч на показаните индикатори
        let shownIndicators = 0;
        const maxVisibleIndicators = 3; // Максимален брой показани индикатори
        
        // Добавяме индикатор за всеки избран търговец
        this.selectedMerchants.forEach(merchantName => {
            if (shownIndicators < maxVisibleIndicators) {
                const indicator = document.createElement('div');
                indicator.className = 'filter-indicator merchant-filter';
                
                const nameSpan = document.createElement('span');
                nameSpan.textContent = merchantName;
                
                const closeButton = document.createElement('button');
                closeButton.className = 'close-indicator';
                closeButton.innerHTML = '&times;';
                closeButton.title = 'Премахни филтър';
                closeButton.onclick = () => this.deselectMerchant(merchantName);
                
                indicator.appendChild(nameSpan);
                indicator.appendChild(closeButton);
                indicatorContainer.appendChild(indicator);
                
                shownIndicators++;
            }
        });
        
        // Ако има повече избрани търговци от максималния брой показвани
        if (this.selectedMerchants.size > maxVisibleIndicators) {
            const moreIndicator = document.createElement('div');
            moreIndicator.className = 'filter-indicator more-indicator';
            moreIndicator.textContent = `+${this.selectedMerchants.size - maxVisibleIndicators} още`;
            
            // Добавяме бутон за изчистване на всички
            const clearButton = document.createElement('button');
            clearButton.className = 'clear-all-button';
            clearButton.textContent = 'Изчисти всички';
            clearButton.onclick = () => this.clearSelectedMerchants();
            
            indicatorContainer.appendChild(moreIndicator);
            indicatorContainer.appendChild(clearButton);
        } else if (this.selectedMerchants.size > 0) {
            // Добавяме бутон за изчистване само ако има избрани
            const clearButton = document.createElement('button');
            clearButton.className = 'clear-all-button';
            clearButton.textContent = 'Изчисти всички';
            clearButton.onclick = () => this.clearSelectedMerchants();
            
            indicatorContainer.appendChild(clearButton);
        }
    }
    
    /**
     * Прилага филтър по избраните търговци
     */
    applyMerchantFilters() {
        // Ако няма избрани търговци, просто прилагаме стандартните филтри
        if (this.selectedMerchants.size === 0) {
            if (this.filterManager) {
                this.filterManager.applyFilters();
            }
            return;
        }
        
        // Ако има избрани търговци, филтрираме само транзакциите,
        // но запазваме пълната таблица с търговци
        if (this.filterManager) {
            // Разширяваме applyFilters с информация за избраните търговци
            // и подаваме флаг preserveMerchantsTable: true
            this.filterManager.applyFilters(null, Array.from(this.selectedMerchants), true);
        }
    }
    
    /**
     * Връща списък с имената на избраните търговци
     * @returns {Array<string>} Масив с имената на избраните търговци
     */
    getSelectedMerchantNames() {
        return Array.from(this.selectedMerchants);
    }
}

// Експортиране на класа към глобалния обект
window.MerchantSelectionManager = MerchantSelectionManager; 