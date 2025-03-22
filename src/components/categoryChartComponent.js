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
                color: category.color || '#3498db'
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
        const backgroundColors = topCategories.map(category => category.color);
        
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
                    borderWidth: 1
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
                                    
                                    return {
                                        text: categoryName,
                                        fillStyle: category.color, // Използваме цвета от категорията
                                        strokeStyle: style.borderColor,
                                        lineWidth: style.borderWidth,
                                        hidden: false,
                                        index: i
                                    };
                                });
                            }
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
        
        // Ако графиката вече съществува, я унищожаваме
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        // Инициализираме нова графика с новите данни
        this.initChart(categoriesData);
    }
}

// Експортиране на класа към глобалния обект
window.CategoryChartComponent = CategoryChartComponent;
