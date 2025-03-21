/**
 * Главен файл на приложението
 */

// Изчакваме зареждането на DOM
document.addEventListener('DOMContentLoaded', async () => {
    // Създаваме глобална инстанция на SupabaseService
    window.supabaseService = new SupabaseService();
    
    // Инициализираме управлението на табове
    const tabsManager = new TabsManager();
    
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
