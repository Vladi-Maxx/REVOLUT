/**
 * Главен файл на приложението
 */

// Изчакваме зареждането на DOM
document.addEventListener('DOMContentLoaded', () => {
    // Инициализираме основния изглед
    const dashboardView = new DashboardView();
    
    // Зареждаме данните
    dashboardView.loadData();
    
    console.log('Приложението е заредено успешно!');
});
