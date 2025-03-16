/**
 * Компонент за визуализация на данни чрез графика
 */
class ChartComponent {
    constructor() {
        this.chartCanvas = document.getElementById('merchants-chart');
        this.chart = null;
    }

    /**
     * Инициализиране на графиката
     * @param {Array} merchantsData - Данни за търговците
     */
    initChart(merchantsData) {
        if (!merchantsData || !Array.isArray(merchantsData)) return;

        // Вземаме само топ 10 търговци за по-добра визуализация
        const topMerchants = merchantsData.slice(0, 10);
        
        // Подготвяме данните за графиката
        const labels = topMerchants.map(merchant => merchant.name);
        const data = topMerchants.map(merchant => Math.abs(merchant.totalAmount));
        
        // Генерираме случайни цветове за сегментите
        const backgroundColors = this.generateColors(topMerchants.length);
        
        // Създаваме графиката
        this.chart = new Chart(this.chartCanvas, {
            type: 'pie',
            data: {
                labels: labels,
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
                            boxWidth: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${DataUtils.formatAmount(value)} (${percentage}%)`;
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
        if (!merchantsData || !Array.isArray(merchantsData)) return;
        
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
