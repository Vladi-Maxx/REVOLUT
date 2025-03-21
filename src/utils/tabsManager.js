/**
 * TabsManager - Клас за управление на табове в приложението
 * Позволява лесно превключване между различни табове
 */
class TabsManager {
    /**
     * Инициализира TabsManager
     */
    constructor() {
        this.initTabs();
    }

    /**
     * Инициализира табовете и добавя event listeners
     */
    initTabs() {
        // Намираме всички бутони за табове
        const tabButtons = document.querySelectorAll('.tab-button');
        
        // Добавяме event listener за всеки бутон
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.switchTab(button.dataset.tab);
            });
        });
    }

    /**
     * Превключва към определен таб
     * @param {string} tabId - ID на таба, който да бъде показан
     */
    switchTab(tabId) {
        // Намираме всички бутони и табове
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        
        // Премахваме активния клас от всички бутони и табове
        tabButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        
        // Добавяме активен клас към избрания бутон и таб
        const selectedButton = document.querySelector(`.tab-button[data-tab="${tabId}"]`);
        const selectedTab = document.getElementById(`${tabId}-tab`);
        
        if (selectedButton) {
            selectedButton.classList.add('active');
        } else {
            console.error('Не е намерен бутон за таб:', tabId);
        }
        
        if (selectedTab) {
            selectedTab.classList.add('active');
            
            // Ако е табът за категории, инициализираме изгледа за категории
            if (tabId === 'categories') {
                // Проверяваме дали съществува инстанция на CategoriesView
                if (!window.categoriesView) {
                    window.categoriesView = new CategoriesView(window.supabaseService);
                }
                
                // Проверяваме дали съществува контейнер за категории
                const categoriesContainer = document.getElementById('categories-container');
                
                // Ако контейнерът е празен, добавяме структурата ръчно
                if (categoriesContainer && categoriesContainer.innerHTML.trim() === '') {
                    categoriesContainer.innerHTML = `
                        <div class="categories-header">
                            <h2>Управление на категории</h2>
                            <button id="add-category-btn" class="btn btn-primary">Добави категория</button>
                        </div>
                        <div class="categories-list" id="categories-list">
                            <div class="loading-spinner">Зареждане на категории...</div>
                        </div>
                    `;
                    
                    // Създаваме нов компонент за категории
                    const categoriesComponent = new CategoriesComponent(window.supabaseService);
                    
                    // Зареждаме категориите
                    categoriesComponent.loadCategories();
                }
            }
        } else {
            console.error('Не е намерен таб:', tabId);
        }
        
        // Запазваме последно избрания таб в localStorage
        localStorage.setItem('activeTab', tabId);
    }

    /**
     * Възстановява последно избрания таб при зареждане на страницата
     */
    restoreLastTab() {
        // Възстановяваме последно избрания таб от localStorage
        const activeTab = localStorage.getItem('activeTab') || 'dashboard';
        this.switchTab(activeTab);
    }
}

// Променяме начина на експортиране на класа
window.TabsManager = TabsManager;
