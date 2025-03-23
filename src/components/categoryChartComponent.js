/**
 * Компонент за визуализация на данни по категории чрез графика
 */
class CategoryChartComponent {
    constructor() {
        console.log('%c[CategoryChartComponent] Инициализиране', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;');
        
        // Изчакваме малко, за да се уверим, че DOM е напълно зареден
        setTimeout(() => {
            this.chartCanvas = document.getElementById('categories-chart');
            console.log('%c[CategoryChartComponent] Канвас елемент (след изчакване):', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;', this.chartCanvas);
            
            // Ако все още нямаме канвас, опитваме да го създадем
            if (!this.chartCanvas) {
                console.warn('%c[CategoryChartComponent] Канвасът не е намерен, опитваме да го създадем', 'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;');
                
                // Проверяваме дали секцията съществува
                const section = document.querySelector('.categories-chart-section');
                if (!section) {
                    console.error('%c[CategoryChartComponent] Секцията за графиката на категории не съществува', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
                }
            }
        }, 500);
        
        this.chart = null;
        this.currentCategories = []; // Съхраняваме референция към текущите категории
        this.selectedCategoryIndex = -1; // Индекс на избраната категория (-1 означава, че няма избрана)
        this.selectedCategory = null; // Обект с данни за избраната категория
    }

    /**
     * Инициализиране на графиката
     * @param {Array} categoriesData - Данни за категориите
     */
    initChart(categoriesData) {
        console.log('%c[CategoryChartComponent] Инициализиране на графика', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', categoriesData);
        if (!categoriesData || !Array.isArray(categoriesData)) {
            console.error('%c[CategoryChartComponent] Няма валидни данни за графиката', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
            return;
        }
        
        // Проверяваме дали имаме канвас елемент
        if (!this.chartCanvas) {
            console.error('%c[CategoryChartComponent] Не може да се намери елемента на канваса', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
            // Опитваме да намерим канваса отново
            this.chartCanvas = document.getElementById('categories-chart');
            console.log('%c[CategoryChartComponent] Опит за повторно намиране на канваса:', 'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;', this.chartCanvas);
            if (!this.chartCanvas) {
                console.error('%c[CategoryChartComponent] Канвасът все още не е намерен', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
                return;
            }
        }
        
        // Разрушаваме старата графика ако има такава
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        // Проверяваме дали имаме категории
        if (categoriesData.length === 0) {
            console.warn('CategoryChartComponent: Няма данни за категории, не се създава графика');
            return;
        }

        // Вземаме категориите от филтрирания резултат (до макс. 10 за прегледност)
        // Добавяме проверка за типовете данни
        const formattedCategories = categoriesData.map(category => {
            if (!category || typeof category !== 'object') {
                return {
                    name: 'Неизвестна',
                    totalAmount: 0,
                    count: 0,
                    color: '#CCCCCC'
                };
            }
            // Гарантираме, че имаме коректни данни за всяка категория
            return {
                name: category.name ? String(category.name) : 'Неизвестна',
                totalAmount: Math.abs(category.totalAmount || 0),
                count: category.count || 0,
                color: category.color || '#3498db',
                // Запазваме оригиналните данни за категорията
                originalData: category
            };
        });
        
        // Сортираме по сума и взимаме топ 10
        const topCategories = formattedCategories
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 10);
        
        // Запазваме референция към коригираните категории
        this.currentCategories = topCategories;
        
        // Подготвяме данните за графиката
        const labels = topCategories.map(category => String(category.name));
        const data = topCategories.map(category => Math.abs(category.totalAmount || 0));
        
        // Използваме цветовете от категориите
        const backgroundColors = topCategories.map((category, index) => {
            // Ако категорията е избрана, правим цвета по-ярък
            if (index === this.selectedCategoryIndex) {
                // Добавяме прозрачност 0.7 за избраната категория
                return category.color + 'DD';
            }
            return category.color;
        });
        
        // Запазваме локална референция за използване в Chart.js функциите
        const self = this;

        // Създаваме графиката
        this.chart = new Chart(this.chartCanvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Разходи по категории',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 1,
                    // Добавяме по-голям border за избраната категория
                    borderColor: topCategories.map((_, index) => 
                        index === this.selectedCategoryIndex ? '#000000' : '#ffffff'
                    ),
                    // Увеличаваме border за избраната категория
                    borderWidth: topCategories.map((_, index) => 
                        index === this.selectedCategoryIndex ? 3 : 1
                    ),
                    // Леко изместване на избраната категория
                    offset: topCategories.map((_, index) => 
                        index === this.selectedCategoryIndex ? 10 : 0
                    )
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 12
                            },
                            boxWidth: 15,
                            // Използваме оригиналните имена на категориите
                            generateLabels: function(chart) {
                                // Използваме съхранената референция към текущите категории
                                const categories = self.currentCategories;
                                const meta = chart.getDatasetMeta(0);
                                
                                // Директно използваме имената на категориите
                                return categories.map(function(category, i) {
                                    const style = meta.controller.getStyle(i);
                                    const categoryName = String(category.name);
                                    
                                    // Добавяме индикатор за избрана категория
                                    const isSelected = i === self.selectedCategoryIndex;
                                    
                                    return {
                                        text: isSelected ? `➤ ${categoryName}` : categoryName,
                                        fillStyle: category.color, // Използваме цвета от категорията
                                        strokeStyle: isSelected ? '#000000' : style.borderColor,
                                        lineWidth: isSelected ? 2 : style.borderWidth,
                                        hidden: false,
                                        index: i,
                                        // Добавяме по-дебел шрифт за избраната категория
                                        fontStyle: isSelected ? 'bold' : 'normal'
                                    };
                                });
                            }
                        },
                        onClick: function(e, legendItem, legend) {
                            // Извикваме нашия метод за избор на категория при клик върху легендата
                            const index = legendItem.index;
                            self.toggleCategorySelection(index);
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                
                                // Използваме името на категорията от съхранения масив
                                const categoryName = self.currentCategories[context.dataIndex].name;
                                
                                // Форматираме изхода
                                return `${categoryName}: ${DataUtils.formatAmount(value)} (${percentage}%)`;
                            }
                        }
                    }
                },
                onClick: function(event, elements) {
                    // Проверяваме дали е кликнато върху сегмент от графиката
                    if (elements && elements.length > 0) {
                        const index = elements[0].index;
                        self.toggleCategorySelection(index);
                    } else {
                        // Ако е кликнато извън сегментите, изчистваме избора
                        self.clearCategorySelection();
                    }
                }
            }
        });
    }

    /**
     * Обновяване на графиката с нови данни
     * @param {Array} categoriesData - Данни за категориите
     */
    updateChart(categoriesData) {
        console.log('%c[CategoryChartComponent] Обновяване на графика', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;', categoriesData);
        if (!categoriesData || !Array.isArray(categoriesData)) {
            console.error('%c[CategoryChartComponent] Няма валидни данни за обновяване на графиката', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
            return;
        }
        
        // Проверяваме дали имаме канвас елемент
        if (!this.chartCanvas) {
            console.warn('%c[CategoryChartComponent] Канвасът не е намерен при обновяване, опитваме да го намерим отново', 'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;');
            this.chartCanvas = document.getElementById('categories-chart');
            
            if (!this.chartCanvas) {
                console.error('%c[CategoryChartComponent] Не може да се намери канваса за графиката на категории', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
                return;
            }
        }
        
        // Запазваме избраната категория преди да унищожим графиката
        const selectedCategoryName = this.selectedCategory ? this.selectedCategory.name : null;
        
        // Ако графиката вече съществува, я унищожаваме
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        // Изчистваме избраната категория
        this.selectedCategoryIndex = -1;
        this.selectedCategory = null;
        
        // Инициализираме нова графика с новите данни
        this.initChart(categoriesData);
        
        // Ако имаме предишна избрана категория, опитваме се да я намерим в новите данни
        if (selectedCategoryName) {
            const newIndex = this.currentCategories.findIndex(cat => cat.name === selectedCategoryName);
            if (newIndex !== -1) {
                this.toggleCategorySelection(newIndex);
            }
        }
    }
    
    /**
     * Превключване на избора на категория
     * @param {number} index - Индекс на категорията
     */
    toggleCategorySelection(index) {
        console.log('%c[CategoryChartComponent] Превключване на избора на категория', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', index);
        
        // Ако категорията вече е избрана, изчистваме избора
        if (this.selectedCategoryIndex === index) {
            this.clearCategorySelection();
            return;
        }
        
        // Задаваме новата избрана категория
        this.selectedCategoryIndex = index;
        this.selectedCategory = this.currentCategories[index];
        
        // Обновяваме графиката, за да отрази визуално избора
        this.updateChartAppearance();
        
        // Известяваме за промяната, ако има регистрирани слушатели
        if (typeof this.onCategorySelectCallback === 'function') {
            this.onCategorySelectCallback(this.selectedCategory.originalData);
        }
    }
    
    /**
     * Изчистване на избора на категория
     */
    clearCategorySelection() {
        console.log('%c[CategoryChartComponent] Изчистване на избора на категория', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
        this.selectedCategoryIndex = -1;
        this.selectedCategory = null;
        
        // Обновяваме графиката, за да отрази визуално изчистването на избора
        this.updateChartAppearance();
        
        // Известяваме за промяната, ако има регистрирани слушатели
        if (typeof this.onCategorySelectCallback === 'function') {
            this.onCategorySelectCallback(null);
        }
    }
    
    /**
     * Обновяване на визуалния изглед на графиката
     */
    updateChartAppearance() {
        console.log('%c[CategoryChartComponent] Обновяване на визуалния изглед на графиката', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
        if (!this.chart) {
            console.warn('%c[CategoryChartComponent] Няма графика за обновяване', 'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;');
            return;
        }
        
        // Обновяваме цветовете на графиката
        const backgroundColors = this.currentCategories.map((category, index) => {
            // Ако категорията е избрана, правим цвета по-ярък
            if (index === this.selectedCategoryIndex) {
                // Добавяме прозрачност 0.7 за избраната категория
                return category.color + 'DD';
            }
            return category.color;
        });
        
        // Обновяваме цветовете на границите
        const borderColors = this.currentCategories.map((_, index) => 
            index === this.selectedCategoryIndex ? '#000000' : '#ffffff'
        );
        
        // Обновяваме дебелината на границите
        const borderWidths = this.currentCategories.map((_, index) => 
            index === this.selectedCategoryIndex ? 3 : 1
        );
        
        // Обновяваме изместването
        const offsets = this.currentCategories.map((_, index) => 
            index === this.selectedCategoryIndex ? 10 : 0
        );
        
        // Прилагаме промените към графиката
        this.chart.data.datasets[0].backgroundColor = backgroundColors;
        this.chart.data.datasets[0].borderColor = borderColors;
        this.chart.data.datasets[0].borderWidth = borderWidths;
        this.chart.data.datasets[0].offset = offsets;
        
        // Обновяваме графиката
        this.chart.update();
    }
    
    /**
     * Задаване на callback функция, която ще се извика при избор на категория
     * @param {Function} callback - Функция, която ще се извика при избор на категория
     */
    setOnCategorySelectCallback(callback) {
        console.log('%c[CategoryChartComponent] Задаване на callback за избор на категория', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
        if (typeof callback !== 'function') {
            console.error('%c[CategoryChartComponent] Подаденият callback не е функция', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
            return;
        }
        this.onCategorySelectCallback = callback;
    }
    
    /**
     * Връща обект с информация за текущо избраната категория за филтриране
     * @returns {Object|null} Обект с информация за избраната категория или null, ако няма избрана
     */
    getCategoryFilter() {
        console.log('%c[CategoryChartComponent] Вземане на филтър за категория', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
        if (!this.selectedCategory) {
            console.log('%c[CategoryChartComponent] Няма избрана категория', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
            return null;
        }
        
        // Подготвяме обстоен обект с информация за категорията
        const categoryInfo = {
            id: this.selectedCategory.id || (this.selectedCategory.originalData && this.selectedCategory.originalData.id),
            name: this.selectedCategory.name,
            color: this.selectedCategory.color,
            originalData: this.selectedCategory.originalData || this.selectedCategory
        };
        
        console.log('%c[CategoryChartComponent] Връщане на информация за категория:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', categoryInfo);
        
        // Връщаме подробна информация за категорията
        return categoryInfo;
    }
}

// Експортиране на класа към глобалния обект
window.CategoryChartComponent = CategoryChartComponent;
