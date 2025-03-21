/**
 * CategoriesView - Изглед за управление на категории
 * Отговаря за инициализирането на компонентите, свързани с категориите
 */
class CategoriesView {
    /**
     * Инициализира изгледа за категории
     * @param {Object} supabaseService - Инстанция на SupabaseService за достъп до данни
     */
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
        this.initComponents();
    }

    /**
     * Инициализира компонентите в изгледа
     */
    initComponents() {
        // Създаваме компонента за категории
        this.categoriesComponent = new CategoriesComponent(this.supabaseService);
    }
}

// Правим класа достъпен глобално
window.CategoriesView = CategoriesView;
