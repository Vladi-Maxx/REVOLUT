/**
 * Главен файл на приложението
 */

// Изчакваме зареждането на DOM
document.addEventListener('DOMContentLoaded', async () => {
    console.log('%c[App] DOM зареден', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;');
    
    // Проверка на HTML елементите за графиките
    const merchantsChartElement = document.getElementById('merchants-chart');
    const categoriesChartElement = document.getElementById('categories-chart');
    const categoriesChartSection = document.querySelector('.categories-chart-section');
    
    console.log('%c[App] Проверка на HTML елементи за графики:', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', {
        'merchants-chart': merchantsChartElement,
        'categories-chart': categoriesChartElement,
        'categories-chart-section': categoriesChartSection
    });
    
    // Проверка на стиловете на елементите
    if (categoriesChartSection) {
        const styles = window.getComputedStyle(categoriesChartSection);
        console.log('%c[App] Стилове на categories-chart-section:', 'background: #9b59b6; color: white; padding: 2px 5px; border-radius: 3px;', {
            'display': styles.display,
            'visibility': styles.visibility,
            'height': styles.height,
            'width': styles.width,
            'position': styles.position,
            'margin': styles.margin,
            'padding': styles.padding
        });
    }
    
    // Създаваме глобална инстанция на SupabaseService
    window.supabaseService = new SupabaseService();
    
    // Инициализираме управлението на табове
    const tabsManager = new TabsManager();
    
    // Проверяваме и коригираме HTML структурата за секцията с графиката за категории
    const checkAndFixCategoriesChartSection = () => {
        console.log('%c[App] Проверка и корекция на HTML структурата за графиката на категории', 'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;');
        
        // Проверяваме дали секцията за графиката на категории съществува
        let categoriesSection = document.querySelector('.categories-section');
        
        // Ако секцията не съществува, я създаваме
        if (!categoriesSection) {
            console.warn('%c[App] Секцията за графиката на категории не съществува, създаваме я', 'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;');
            
            // Намираме секцията с графиката за търговци, за да добавим секцията за категории след нея
            const merchantsSection = document.querySelector('.merchants-section');
            if (merchantsSection) {
                console.log('%c[App] Намерена е секцията за търговци, добавяме секцията за категории след нея', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;');
                
                // Създаваме секцията за графиката на категории
                categoriesSection = document.createElement('section');
                categoriesSection.className = 'categories-section';
                categoriesSection.innerHTML = `
                    <h2>Разпределение по категории</h2>
                    <div class="categories-chart-container">
                        <canvas id="categories-chart"></canvas>
                    </div>
                `;
                
                // Добавяме секцията за категории след секцията за търговци
                merchantsSection.insertAdjacentElement('afterend', categoriesSection);
                
                console.log('%c[App] Секцията за графиката на категории е създадена и добавена', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;');
            } else {
                console.error('%c[App] Не може да се намери секцията за търговци', 'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;');
            }
        } else {
            console.log('%c[App] Секцията за графиката на категории съществува', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;');
            
            // Проверяваме дали има контейнер за графиката
            const chartContainer = categoriesSection.querySelector('.categories-chart-container');
            if (!chartContainer) {
                console.warn('%c[App] Контейнерът за графиката на категории не съществува, създаваме го', 'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;');
                
                // Създаваме контейнер за графиката
                const newChartContainer = document.createElement('div');
                newChartContainer.className = 'categories-chart-container';
                newChartContainer.innerHTML = '<canvas id="categories-chart"></canvas>';
                
                // Добавяме контейнера в секцията
                categoriesSection.appendChild(newChartContainer);
                
                console.log('%c[App] Контейнерът за графиката на категории е създаден и добавен', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;');
            } else {
                console.log('%c[App] Контейнерът за графиката на категории съществува', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;');
                
                // Проверяваме дали има канвас за графиката
                const canvas = chartContainer.querySelector('#categories-chart');
                if (!canvas) {
                    console.warn('%c[App] Канвасът за графиката на категории не съществува, създаваме го', 'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;');
                    
                    // Създаваме канвас за графиката
                    const newCanvas = document.createElement('canvas');
                    newCanvas.id = 'categories-chart';
                    
                    // Добавяме канваса в контейнера
                    chartContainer.appendChild(newCanvas);
                    
                    console.log('%c[App] Канвасът за графиката на категории е създаден и добавен', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;');
                } else {
                    console.log('%c[App] Канвасът за графиката на категории съществува', 'background: #2ecc71; color: white; padding: 2px 5px; border-radius: 3px;');
                }
            }
        }
    };
    
    // Извикваме функцията за проверка и корекция на HTML структурата
    checkAndFixCategoriesChartSection();
    
    // Инициализираме изгледа за транзакции
    const dashboardView = new DashboardView();
    
    // Зареждаме данните за транзакции
    dashboardView.loadData();
    
    // Инициализираме изгледа за категории
    try {
        // Проверяваме дали съществува контейнер за категории
        const categoriesContainer = document.getElementById('categories-container');
        
        // Създаваме изглед за категории и го съхраняваме глобално
        window.categoriesView = new CategoriesView(window.supabaseService);
    } catch (error) {
        console.error('Грешка при зареждане на изгледа за категории:', error);
    }
    
    // Възстановяваме последно избрания таб
    tabsManager.restoreLastTab();
});
