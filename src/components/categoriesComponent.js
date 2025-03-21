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
                <div class="modal-content category-modal-content">
                    <span class="close-modal">&times;</span>
                    <h3 id="modal-title">Добавяне на категория</h3>
                    
                    <form id="category-form">
                        <div class="category-form-header">
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Запази</button>
                                <button type="button" class="btn btn-secondary" id="cancel-category">Отказ</button>
                            </div>
                        </div>
                        
                        <div class="category-form-content">
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
                            
                            <!-- Секция за търговци в категорията -->
                            <div class="form-group merchants-section">
                                <div class="merchants-header">
                                    <h4>Търговци в категорията</h4>
                                    <button type="button" class="btn btn-add-merchants" id="add-merchants-btn">Добави търговци</button>
                                </div>
                                <div class="merchants-container">
                                    <div id="category-merchants-list" class="category-merchants-list">
                                        <!-- Тук ще се показват асоциираните търговци -->
                                        <div class="no-merchants-message">Няма добавени търговци в тази категория</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Модален прозорец за избор на търговци -->
            <div class="modal" id="merchants-modal">
                <div class="modal-content merchant-modal-content">
                    <span class="close-modal" id="close-merchants-modal">&times;</span>
                    <h3>Избор на търговци за категория</h3>
                    
                    <div class="merchants-header">
                        <div class="merchants-search-container">
                            <input type="text" id="merchants-search" placeholder="Търсене на търговци..." class="search-input">
                        </div>
                        
                        <div class="merchants-selection-actions">
                            <button type="button" class="btn btn-select-all" id="select-all-merchants">Избери всички</button>
                            <button type="button" class="btn btn-select-none" id="select-none-merchants">Избери никой</button>
                        </div>
                    </div>
                    
                    <div class="merchants-modal-actions top-actions">
                        <button type="button" class="btn btn-primary" id="add-selected-merchants">Добави избраните</button>
                        <button type="button" class="btn btn-secondary" id="cancel-merchants-selection">Отказ</button>
                    </div>
                    
                    <div class="merchants-list-container">
                        <div id="merchants-list" class="merchants-list">
                            <!-- Тук ще се показват търговците за избор -->
                            <div class="loading-merchants">Зареждане на търговци...</div>
                        </div>
                    </div>
                    
                    <div class="merchants-modal-actions bottom-actions">
                        <button type="button" class="btn btn-primary" id="add-selected-merchants-bottom">Добави избраните</button>
                        <button type="button" class="btn btn-secondary" id="cancel-merchants-selection-bottom">Отказ</button>
                    </div>
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
        
        // Елементи за търговци в категорията
        this.categoryMerchantsList = document.getElementById('category-merchants-list');
        this.addMerchantsBtn = document.getElementById('add-merchants-btn');
        this.cancelCategoryBtn = document.getElementById('cancel-category');
        
        // Модален прозорец за избор на търговци
        this.merchantsModal = document.getElementById('merchants-modal');
        this.closeMerchantsModalBtn = document.getElementById('close-merchants-modal');
        this.merchantsList = document.getElementById('merchants-list');
        this.merchantsSearch = document.getElementById('merchants-search');
        this.selectAllMerchantsBtn = document.getElementById('select-all-merchants');
        this.selectNoneMerchantsBtn = document.getElementById('select-none-merchants');
        this.addSelectedMerchantsBtn = document.getElementById('add-selected-merchants');
        this.cancelMerchantsSelectionBtn = document.getElementById('cancel-merchants-selection');
        this.addSelectedMerchantsBtnBottom = document.getElementById('add-selected-merchants-bottom');
        this.cancelMerchantsSelectionBtnBottom = document.getElementById('cancel-merchants-selection-bottom');
        
        // Масив за съхранение на текущите търговци в категорията
        this.currentCategoryMerchants = [];
        
        // Масив за съхранение на всички търговци без категория
        this.unassignedMerchants = [];
    }

    /**
     * Добавя слушатели за събития
     */
    addEventListeners() {
        // Бутон за добавяне на категория
        this.addCategoryBtn.addEventListener('click', () => this.openAddCategoryModal());
        
        // Затваряне на модалния прозорец за категории
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelCategoryBtn.addEventListener('click', () => this.closeModal());
        
        // Кликване извън модалния прозорец за затваряне
        window.addEventListener('click', (event) => {
            if (event.target === this.categoryModal) {
                this.closeModal();
            } else if (event.target === this.merchantsModal) {
                this.closeMerchantsModal();
            }
        });
        
        // Форма за добавяне/редактиране на категория
        this.categoryForm.addEventListener('submit', (event) => {
            event.preventDefault();
            this.saveCategory();
        });
        
        // Бутон за добавяне на търговци
        this.addMerchantsBtn.addEventListener('click', () => this.openMerchantsModal());
        
        // Затваряне на модалния прозорец за търговци
        this.closeMerchantsModalBtn.addEventListener('click', () => this.closeMerchantsModal());
        this.cancelMerchantsSelectionBtn.addEventListener('click', () => this.closeMerchantsModal());
        this.cancelMerchantsSelectionBtnBottom.addEventListener('click', () => this.closeMerchantsModal());
        
        // Търсене на търговци
        this.merchantsSearch.addEventListener('input', () => this.filterMerchants());
        
        // Избор на всички/никой търговци
        this.selectAllMerchantsBtn.addEventListener('click', () => this.selectAllMerchants());
        this.selectNoneMerchantsBtn.addEventListener('click', () => this.selectNoMerchants());
        
        // Добавяне на избраните търговци
        this.addSelectedMerchantsBtn.addEventListener('click', () => this.addSelectedMerchants());
        this.addSelectedMerchantsBtnBottom.addEventListener('click', () => this.addSelectedMerchants());
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
        
        // Изчистваме текущите търговци
        this.currentCategoryMerchants = [];
        this.renderCategoryMerchants();
        
        // Показваме модалния прозорец
        this.categoryModal.style.display = 'block';
    }

    /**
     * Отваря модалния прозорец за редактиране на категория
     * @param {Object} category - Категорията, която ще се редактира
     */
    async openEditCategoryModal(category) {
        // Задаваме заглавие на модалния прозорец
        this.modalTitle.textContent = 'Редактиране на категория';
        
        // Попълваме формата с данните на категорията
        this.categoryNameInput.value = category.name;
        this.categoryDescriptionInput.value = category.description || '';
        this.categoryColorInput.value = category.color || '#3498db';
        this.categoryIdInput.value = category.id;
        
        // Изчистваме текущите търговци
        this.currentCategoryMerchants = [];
        
        // Зареждаме търговците, асоциирани с тази категория
        await this.loadCategoryMerchants(category.id);
        
        // Показваме модалния прозорец
        this.categoryModal.style.display = 'block';
    }

    /**
     * Затваря модалния прозорец за категории
     */
    closeModal() {
        this.categoryModal.style.display = 'none';
    }
    
    /**
     * Отваря модалния прозорец за избор на търговци
     */
    async openMerchantsModal() {
        // Показваме модалния прозорец
        this.merchantsModal.style.display = 'block';
        
        // Изчистваме полето за търсене
        this.merchantsSearch.value = '';
        
        // Зареждаме търговците без категория
        await this.loadUnassignedMerchants();
    }
    
    /**
     * Затваря модалния прозорец за избор на търговци
     */
    closeMerchantsModal() {
        this.merchantsModal.style.display = 'none';
    }
    
    /**
     * Зарежда търговците без категория
     */
    async loadUnassignedMerchants() {
        try {
            // Показваме индикатор за зареждане
            this.merchantsList.innerHTML = '<div class="loading-merchants">Зареждане на търговци...</div>';
            
            // Зареждаме търговците без категория
            this.unassignedMerchants = await this.supabaseService.getUnassignedMerchants();
            
            // Проверяваме дали има търговци
            if (!this.unassignedMerchants || this.unassignedMerchants.length === 0) {
                this.merchantsList.innerHTML = '<div class="no-merchants">Няма търговци без категория</div>';
                return;
            }
            
            // Показваме търговците
            this.renderMerchants(this.unassignedMerchants);
        } catch (error) {
            console.error('Грешка при зареждане на търговци:', error);
            this.merchantsList.innerHTML = `<div class="error-message">Грешка при зареждане на търговци: ${error.message}</div>`;
        }
    }
    
    /**
     * Зарежда търговците, асоциирани с дадена категория
     * @param {string} categoryId - ID на категорията
     */
    async loadCategoryMerchants(categoryId) {
        try {
            if (!categoryId) {
                this.currentCategoryMerchants = [];
                this.renderCategoryMerchants();
                return;
            }
            
            // Зареждаме търговците със статистики за тази категория
            const merchants = await this.supabaseService.getMerchantsWithStatsByCategory(categoryId);
            
            // Запазваме ги в текущия масив
            this.currentCategoryMerchants = merchants;
            
            // Показваме ги
            this.renderCategoryMerchants();
        } catch (error) {
            console.error('Грешка при зареждане на търговци за категория:', error);
            this.categoryMerchantsList.innerHTML = `<div class="error-message">Грешка при зареждане на търговци: ${error.message}</div>`;
        }
    }
    
    /**
     * Показва търговците в списъка за избор
     * @param {Array} merchants - Масив с търговци
     */
    renderMerchants(merchants) {
        // Изчистваме списъка
        this.merchantsList.innerHTML = '';
        
        // Създаваме HTML за всеки търговец
        merchants.forEach(merchant => {
            const merchantElement = document.createElement('div');
            merchantElement.className = 'merchant-item';
            
            // Форматираме сумата и броя транзакции
            const formattedAmount = DataUtils.formatAmount(Math.abs(merchant.totalAmount));
            const transactionsCount = merchant.count;
            
            merchantElement.innerHTML = `
                <div class="merchant-checkbox-container">
                    <input type="checkbox" class="merchant-checkbox" data-merchant="${merchant.name}">
                </div>
                <div class="merchant-info">
                    <div class="merchant-name">${merchant.name}</div>
                    <div class="merchant-stats">${formattedAmount} (${transactionsCount})</div>
                </div>
            `;
            
            // Добавяме търговеца в списъка
            this.merchantsList.appendChild(merchantElement);
        });
    }
    
    /**
     * Филтрира търговците по търсене
     */
    filterMerchants() {
        const searchText = this.merchantsSearch.value.toLowerCase().trim();
        
        // Ако няма търговци, няма какво да филтрираме
        if (!this.unassignedMerchants || this.unassignedMerchants.length === 0) {
            return;
        }
        
        // Ако няма търсене, показваме всички търговци
        if (!searchText) {
            this.renderMerchants(this.unassignedMerchants);
            return;
        }
        
        // Филтрираме търговците по име
        const filteredMerchants = this.unassignedMerchants.filter(merchant => 
            merchant.name.toLowerCase().includes(searchText));
        
        // Показваме филтрираните търговци
        if (filteredMerchants.length === 0) {
            this.merchantsList.innerHTML = `<div class="no-merchants">Няма намерени търговци за "${searchText}"</div>`;
        } else {
            this.renderMerchants(filteredMerchants);
        }
    }
    
    /**
     * Избира всички търговци
     */
    selectAllMerchants() {
        const checkboxes = this.merchantsList.querySelectorAll('.merchant-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }
    
    /**
     * Изчиства избора на търговци
     */
    selectNoMerchants() {
        const checkboxes = this.merchantsList.querySelectorAll('.merchant-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    /**
     * Добавя избраните търговци към текущата категория
     */
    addSelectedMerchants() {
        // Вземаме всички избрани търговци
        const selectedCheckboxes = this.merchantsList.querySelectorAll('.merchant-checkbox:checked');
        
        // Проверяваме дали има избрани търговци
        if (selectedCheckboxes.length === 0) {
            alert('Моля, изберете поне един търговец');
            return;
        }
        
        // Добавяме избраните търговци към текущите
        selectedCheckboxes.forEach(checkbox => {
            const merchantName = checkbox.getAttribute('data-merchant');
            const merchant = this.unassignedMerchants.find(m => m.name === merchantName);
            
            if (merchant && !this.currentCategoryMerchants.some(m => m.name === merchantName)) {
                this.currentCategoryMerchants.push(merchant);
            }
        });
        
        // Показваме търговците в категорията
        this.renderCategoryMerchants();
        
        // Затваряме модалния прозорец
        this.closeMerchantsModal();
    }
    
    /**
     * Показва търговците в текущата категория
     */
    renderCategoryMerchants() {
        // Проверяваме дали има търговци
        if (!this.currentCategoryMerchants || this.currentCategoryMerchants.length === 0) {
            this.categoryMerchantsList.innerHTML = '<div class="no-merchants-message">Няма добавени търговци в тази категория</div>';
            return;
        }
        
        // Сортираме търговците по абсолютна стойност на сумата
        const sortedMerchants = [...this.currentCategoryMerchants].sort((a, b) => 
            Math.abs(b.totalAmount) - Math.abs(a.totalAmount));
        
        // Изчистваме списъка
        this.categoryMerchantsList.innerHTML = '';
        
        // Създаваме HTML за всеки търговец
        sortedMerchants.forEach(merchant => {
            const merchantElement = document.createElement('div');
            merchantElement.className = 'category-merchant-item';
            
            // Форматираме сумата и броя транзакции
            const formattedAmount = DataUtils.formatAmount(Math.abs(merchant.totalAmount));
            const transactionsCount = merchant.count;
            
            merchantElement.innerHTML = `
                <div class="category-merchant-info">
                    <div class="category-merchant-name">${merchant.name}</div>
                    <div class="category-merchant-stats">${formattedAmount} (${transactionsCount})</div>
                </div>
                <button type="button" class="btn btn-remove-merchant" data-merchant="${merchant.name}">Премахни</button>
            `;
            
            // Добавяме търговеца в списъка
            this.categoryMerchantsList.appendChild(merchantElement);
            
            // Добавяме слушател за премахване на търговец
            const removeButton = merchantElement.querySelector('.btn-remove-merchant');
            removeButton.addEventListener('click', () => this.removeMerchantFromCategory(merchant.name));
        });
    }
    
    /**
     * Премахва търговец от текущата категория
     * @param {string} merchantName - Име на търговеца
     */
    removeMerchantFromCategory(merchantName) {
        // Премахваме търговеца от масива
        this.currentCategoryMerchants = this.currentCategoryMerchants.filter(m => m.name !== merchantName);
        
        // Обновяваме списъка
        this.renderCategoryMerchants();
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
            let newCategoryId = categoryId;
            
            if (categoryId) {
                // Редактираме съществуваща категория
                await this.supabaseService.updateCategory(categoryId, categoryData);
            } else {
                // Добавяме нова категория
                const result = await this.supabaseService.addCategory(categoryData);
                newCategoryId = result.id;
            }
            
            // Ако има търговци за асоцииране с категорията
            if (this.currentCategoryMerchants && this.currentCategoryMerchants.length > 0 && newCategoryId) {
                // Извличаме имената на търговците
                const merchantNames = this.currentCategoryMerchants.map(merchant => merchant.name);
                
                // Задаваме категория за всички избрани търговци
                const result = await this.supabaseService.setMerchantCategoryBatch(merchantNames, newCategoryId);
                
                // Показваме резултата
                if (!result.success) {
                    console.warn('Възникнаха проблеми при асоцииране на някои търговци:', result.errors);
                    if (result.successCount > 0) {
                        alert(`Категорията е запазена успешно, но възникнаха проблеми при асоцииране на ${result.errorCount} от ${result.successCount + result.errorCount} търговци.`);
                    }
                }
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
