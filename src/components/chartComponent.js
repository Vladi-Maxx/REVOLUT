/**
 * Компонент за визуализация на данни чрез графика
 */
class ChartComponent {
    constructor() {
        this.chartCanvas = document.getElementById('merchants-chart');
        this.chart = null;
        this.currentMerchants = []; // Съхраняваме референция към текущите търговци
    }

    /**
     * Инициализиране на графиката
     * @param {Array} merchantsData - Данни за търговците
     */
    initChart(merchantsData) {
        if (!merchantsData || !Array.isArray(merchantsData)) {
            console.error('ChartComponent: Няма валидни данни за графиката');
            return;
        }
        
        // Разрушаваме старата графика ако има такава
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        // Проверяваме дали имаме търговци
        if (merchantsData.length === 0) {
            console.warn('ChartComponent: Няма данни за търговци, не се създава графика');
            return;
        }

        // Вземаме търговците от филтрирания резултат (до макс. 10 за прегледност)
        // Добавяме проверка за типовете данни
        const formattedMerchants = merchantsData.map(merchant => {
            if (!merchant || typeof merchant !== 'object') {
                return {
                    name: 'Неизвестен',
                    totalAmount: 0,
                    count: 0
                };
            }
            // Гарантираме, че имаме коректни данни за всеки търговец
            return {
                name: merchant.name ? String(merchant.name) : 'Неизвестен',
                totalAmount: Math.abs(merchant.totalAmount || 0),
                count: merchant.count || 0
            };
        });
        
        // Сортираме по сума и взимаме топ 10
        const topMerchants = formattedMerchants
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 10);
        
        // Проверка за числови имена на търговци и опит за поправянето им
        const fixedMerchants = topMerchants.map(merchant => {
            const name = merchant.name;
            // Проверява дали името е число или се състои само от цифри
            if (/^\d+$/.test(name)) {
                // Заместваме с по-описателно име
                return {
                    ...merchant,
                    name: `Търговец #${name}`
                };
            }
            return merchant;
        });
        
        // Запазваме референция към коригираните търговци
        this.currentMerchants = fixedMerchants;
        
        // Подготвяме данните за графиката
        // Гарантираме, че имената на търговците са текстови стрингове
        // Използваме директно имената на търговците
        const labels = [];
        
        // Гарантираме, че имаме стрингове за имената
        for (let i = 0; i < topMerchants.length; i++) {
            const merchant = topMerchants[i];
            labels.push(String(merchant.name)); // Експлицитно превръщане в стринг
        }
        
        const data = topMerchants.map(merchant => Math.abs(merchant.totalAmount || 0));
        
        // Генерираме случайни цветове за сегментите
        const backgroundColors = this.generateColors(topMerchants.length);
        
        // Запазваме локална референция за използване в Chart.js функциите
        const self = this;

        // Създаваме графиката
        this.chart = new Chart(this.chartCanvas, {
            type: 'pie',
            data: {
                // Задаваме чисто нови лейбъли за пие-графиката
                labels: topMerchants.map(m => String(m.name)),
                datasets: [{
                    label: 'Разходи по търговци',
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
                            // Използваме оригиналните имена на търговците
                            generateLabels: function(chart) {
                                // Използваме съхранената референция към текущите търговци
                                const merchants = self.currentMerchants;
                                const meta = chart.getDatasetMeta(0);
                                
                                // Директно използваме имената на търговците
                                return merchants.map(function(merchant, i) {
                                    const style = meta.controller.getStyle(i);
                                    const merchantName = String(merchant.name);
                                    
                                    return {
                                        text: merchantName,
                                        fillStyle: style.backgroundColor,
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
                                
                                // Използваме името на търговеца от съхранения масив
                                const merchantName = self.currentMerchants[context.dataIndex].name;
                                
                                // Форматираме изхода
                                return `${merchantName}: ${DataUtils.formatAmount(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Обновяване на графиката с нови данни
     * @param {Array} merchantsData - Данни за търговците
     */
    updateChart(merchantsData) {
        console.log('%c[ChartComponent] Извикване на updateChart:', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;', {
            'Получени данни': merchantsData,
            'Брой елементи': merchantsData ? merchantsData.length : 0
        });
        
        if (!merchantsData || !Array.isArray(merchantsData)) {
            console.error('%c[ChartComponent] Няма валидни данни за обновяване на графиката:', 'background: #e67e22; color: white; padding: 2px 5px; border-radius: 3px;', merchantsData);
            return;
        }
        
        // Ако графиката вече съществува, я унищожаваме
        if (this.chart) {
            this.chart.destroy();
        }
        
        // Инициализираме нова графика с новите данни
        this.initChart(merchantsData);
    }

    /**
     * Генериране на случайни цветове за графиката
     * @param {number} count - Брой цветове
     * @returns {Array} Масив с цветове
     */
    generateColors(count) {
        const colors = [];
        
        // Предефинирани цветове за по-добра визуализация
        const predefinedColors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#8AC249', '#EA5F89', '#00D8B6', '#9C8AFF'
        ];
        
        // Използваме предефинирани цветове, ако са достатъчни
        if (count <= predefinedColors.length) {
            return predefinedColors.slice(0, count);
        }
        
        // Иначе генерираме случайни цветове
        for (let i = 0; i < count; i++) {
            const color = `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`;
            colors.push(color);
        }
        
        return colors;
    }
}
