/**
 * CategoriesComponent - Компонент за управление на категории
 * Отговаря за показването и управлението на категории
 */
class CategoriesComponent {
    /**
     * Инициализира компонента за категории
     * @param {Object} supabaseService - Инстанция на SupabaseService за достъп до данни
     */
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
        this.categoriesContainer = document.getElementById('categories-container');
        this.initComponent();
    }

    /**
     * Инициализира компонента
     */
    async initComponent() {
        // Създаваме основната структура на компонента
        this.createComponentStructure();
        
        // Зареждаме категориите
        await this.loadCategories();
        
        // Добавяме слушатели за събития
        this.addEventListeners();
    }

    /**
     * Създава основната структура на компонента
     */
    createComponentStructure() {
        // Проверяваме дали контейнерът съществува
        if (!this.categoriesContainer) {
            console.error('Не е намерен контейнер за категории');
            return;
        }
        
        // Създаваме HTML структурата
        this.categoriesContainer.innerHTML = `
            <div class="categories-header">
                <h2>Управление на категории</h2>
                <button id="add-category-btn" class="btn btn-primary">Добави категория</button>
            </div>
            <div class="categories-list" id="categories-list">
                <div class="loading-spinner">Зареждане на категории...</div>
            </div>
            
            <!-- Модален прозорец за добавяне/редактиране на категория -->
            <div class="modal" id="category-modal">
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h3 id="modal-title">Добавяне на категория</h3>
                    <form id="category-form">
                        <div class="form-group">
                            <label for="category-name">Име на категорията</label>
                            <input type="text" id="category-name" required>
                        </div>
                        <div class="form-group">
                            <label for="category-description">Описание</label>
                            <textarea id="category-description"></textarea>
                        </div>
                        <div class="form-group">
                            <label for="category-color">Цвят</label>
                            <input type="color" id="category-color" value="#3498db">
                        </div>
                        <input type="hidden" id="category-id">
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Запази</button>
                            <button type="button" class="btn btn-secondary" id="cancel-category">Отказ</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Запазваме референции към елементите
        this.categoriesList = document.getElementById('categories-list');
        this.addCategoryBtn = document.getElementById('add-category-btn');
        this.categoryModal = document.getElementById('category-modal');
        this.categoryForm = document.getElementById('category-form');
        this.closeModalBtn = document.querySelector('.close-modal');
        this.cancelCategoryBtn = document.getElementById('cancel-category');
        this.modalTitle = document.getElementById('modal-title');
        
        // Полета във формата
        this.categoryNameInput = document.getElementById('category-name');
        this.categoryDescriptionInput = document.getElementById('category-description');
        this.categoryColorInput = document.getElementById('category-color');
        this.categoryIdInput = document.getElementById('category-id');
    }

    /**
     * Добавя слушатели за събития
     */
    addEventListeners() {
        // Бутон за добавяне на категория
        this.addCategoryBtn.addEventListener('click', () => this.openAddCategoryModal());
        
        // Затваряне на модалния прозорец
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelCategoryBtn.addEventListener('click', () => this.closeModal());
        
        // Кликване извън модалния прозорец за затваряне
        window.addEventListener('click', (event) => {
            if (event.target === this.categoryModal) {
                this.closeModal();
            }
        });
        
        // Форма за добавяне/редактиране на категория
        this.categoryForm.addEventListener('submit', (event) => {
            event.preventDefault();
            this.saveCategory();
        });
    }

    /**
     * Зарежда категориите от базата данни
     */
    async loadCategories() {
        try {
            // Проверяваме дали съществува списъка с категории
            if (!this.categoriesList) {
                console.error('Не е намерен списък за категории');
                return;
            }
            
            // Показваме индикатор за зареждане
            this.categoriesList.innerHTML = '<div class="loading-spinner">Зареждане на категории...</div>';
            
            // Зареждаме категориите от базата данни
            const categories = await this.supabaseService.getAllCategories();
            
            // Проверяваме дали има категории
            if (!categories || categories.length === 0) {
                this.categoriesList.innerHTML = '<div class="no-data">Няма добавени категории</div>';
                return;
            }
            
            // Показваме категориите
            this.renderCategories(categories);
        } catch (error) {
            console.error('Грешка при зареждане на категориите:', error);
            this.categoriesList.innerHTML = '<div class="error">Грешка при зареждане на категориите</div>';
        }
    }

    /**
     * Показва категориите в списъка
     * @param {Array} categories - Списък с категории
     */
    renderCategories(categories) {
        // Изчистваме списъка
        this.categoriesList.innerHTML = '';
        
        // Създаваме HTML за всяка категория
        categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category-item';
            categoryElement.innerHTML = `
                <div class="category-color" style="background-color: ${category.color || '#3498db'}"></div>
                <div class="category-info">
                    <h3>${category.name}</h3>
                    <p>${category.description || 'Няма описание'}</p>
                </div>
                <div class="category-actions">
                    <button class="btn btn-edit" data-id="${category.id}">Редактирай</button>
                    <button class="btn btn-delete" data-id="${category.id}">Изтрий</button>
                </div>
            `;
            
            // Добавяме слушатели за бутоните
            const editBtn = categoryElement.querySelector('.btn-edit');
            const deleteBtn = categoryElement.querySelector('.btn-delete');
            
            editBtn.addEventListener('click', () => this.openEditCategoryModal(category));
            deleteBtn.addEventListener('click', () => this.deleteCategory(category.id));
            
            // Добавяме категорията в списъка
            this.categoriesList.appendChild(categoryElement);
        });
    }

    /**
     * Отваря модалния прозорец за добавяне на категория
     */
    openAddCategoryModal() {
        // Задаваме заглавие на модалния прозорец
        this.modalTitle.textContent = 'Добавяне на категория';
        
        // Изчистваме формата
        this.categoryForm.reset();
        this.categoryIdInput.value = '';
        this.categoryColorInput.value = '#3498db';
        
        // Показваме модалния прозорец
        this.categoryModal.style.display = 'block';
    }

    /**
     * Отваря модалния прозорец за редактиране на категория
     * @param {Object} category - Категорията, която ще се редактира
     */
    openEditCategoryModal(category) {
        // Задаваме заглавие на модалния прозорец
        this.modalTitle.textContent = 'Редактиране на категория';
        
        // Попълваме формата с данните на категорията
        this.categoryNameInput.value = category.name;
        this.categoryDescriptionInput.value = category.description || '';
        this.categoryColorInput.value = category.color || '#3498db';
        this.categoryIdInput.value = category.id;
        
        // Показваме модалния прозорец
        this.categoryModal.style.display = 'block';
    }

    /**
     * Затваря модалния прозорец
     */
    closeModal() {
        this.categoryModal.style.display = 'none';
    }

    /**
     * Запазва категорията (добавя нова или редактира съществуваща)
     */
    async saveCategory() {
        try {
            // Вземаме данните от формата
            const categoryData = {
                name: this.categoryNameInput.value.trim(),
                description: this.categoryDescriptionInput.value.trim(),
                color: this.categoryColorInput.value
            };
            
            // Проверяваме дали името е попълнено
            if (!categoryData.name) {
                alert('Моля, въведете име на категорията');
                return;
            }
            
            // Проверяваме дали редактираме или добавяме нова категория
            const categoryId = this.categoryIdInput.value;
            
            if (categoryId) {
                // Редактираме съществуваща категория
                await this.supabaseService.updateCategory(categoryId, categoryData);
            } else {
                // Добавяме нова категория
                await this.supabaseService.addCategory(categoryData);
            }
            
            // Затваряме модалния прозорец
            this.closeModal();
            
            // Презареждаме категориите
            await this.loadCategories();
        } catch (error) {
            console.error('Грешка при запазване на категорията:', error);
            alert('Възникна грешка при запазване на категорията');
        }
    }

    /**
     * Изтрива категория
     * @param {string} categoryId - ID на категорията, която ще се изтрие
     */
    async deleteCategory(categoryId) {
        // Питаме потребителя за потвърждение
        if (!confirm('Сигурни ли сте, че искате да изтриете тази категория?')) {
            return;
        }
        
        try {
            // Изтриваме категорията
            await this.supabaseService.deleteCategory(categoryId);
            
            // Презареждаме категориите
            await this.loadCategories();
        } catch (error) {
            console.error('Грешка при изтриване на категорията:', error);
            alert('Възникна грешка при изтриване на категорията');
        }
    }
}

// Правим класа достъпен глобално
window.CategoriesComponent = CategoriesComponent;
