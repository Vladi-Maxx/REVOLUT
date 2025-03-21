/**
 * Глобална инстанция на Supabase клиента
 */
let supabaseInstance = null;

/**
 * Функция за инициализиране на Supabase клиента
 * @returns {Object} Инстанция на Supabase клиента
 */
function initSupabase() {
    if (supabaseInstance) {
        return supabaseInstance;
    }
    
    const supabaseUrl = 'https://reuuohlmseejmakhxide.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJldXVvaGxtc2Vlam1ha2h4aWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMDU0MTIsImV4cCI6MjA1NzY4MTQxMn0.L0hipLSxu3mtlMcJ8Tk7OsDmvJzjvfGbYsfNVncPOvo';
    supabaseInstance = supabase.createClient(supabaseUrl, supabaseKey);
    
    return supabaseInstance;
}

/**
 * Услуга за връзка със Supabase и извличане на данни за транзакции
 */
class SupabaseService {
    constructor() {
        // Използваме глобалната инстанция на Supabase клиента
        this.supabase = initSupabase();
        
        // Имена на таблиците
        this.tableName = 'transactions';
        this.categoriesTable = 'categories';
        this.merchantCategoriesTable = 'merchant_categories';
    }

    /**
     * Извличане на всички транзакции (c автоматична пагинация)
     * @returns {Promise<Array>} Масив с всички транзакции
     */
    async getAllTransactions() {
        try {

            
            // Първо извличаме броя на всички записи
            const { count } = await this.supabase
                .from(this.tableName)
                .select('*', { count: 'exact', head: true });
            

            
            // Ако няма записи, връщаме празен масив
            if (!count) {
                return [];
            }
            
            // Определяме размера на страницата и изчисляваме броя на страниците
            const pageSize = 1000;
            const pages = Math.ceil(count / pageSize);
            

            
            // Масив за съхранение на всички транзакции
            let allTransactions = [];
            
            // Извличаме всяка страница последователно
            for (let page = 0; page < pages; page++) {
                const offset = page * pageSize;

                
                const { data, error } = await this.supabase
                    .from(this.tableName)
                    .select('*')
                    .range(offset, offset + pageSize - 1);
                
                if (error) {
                    console.error(`Грешка при извличане на страница ${page + 1}:`, error);
                    throw error;
                }
                

                
                // Добавяме записите от текущата страница към общия масив
                if (data && data.length > 0) {
                    allTransactions = [...allTransactions, ...data];
                }
            }
            

            
            // Дебъг информация за първата транзакция

            
            return allTransactions;
        } catch (error) {
            console.error('Грешка при извличане на транзакции:', error);
            throw error;
        }
    }

    /**
     * Извличане на транзакции по период с пагинация
     * @param {string} startDate - Начална дата във формат YYYY-MM-DD
     * @param {string} endDate - Крайна дата във формат YYYY-MM-DD
     * @param {number} pageSize - Размер на страница (по подразбиране 1000)
     * @param {number} page - Номер на страница (по подразбиране 0)
     * @returns {Promise<Array>} Масив с филтрирани транзакции
     */
    async getTransactionsByPeriod(startDate, endDate, pageSize = 1000, page = 0) {
        try {

            
            // Изчисляваме офсета на базата на номера на страницата
            const offset = page * pageSize;
            
            // Извличаме транзакциите с пагинация
            const { data, error, count } = await this.supabase
                .from(this.tableName)
                .select('*', { count: 'exact' })
                .gte('Started Date', startDate)
                .lte('Started Date', endDate)
                .range(offset, offset + pageSize - 1)
                .order('Started Date', { ascending: false });

            if (error) {
                console.error('Грешка при извличане на транзакции по период:', error);
                throw error;
            }


            return data || [];
        } catch (error) {
            console.error('Грешка при извличане на транзакции по период:', error);
            throw error;
        }
    }

    /**
     * Извличане на транзакции с филтри
     * @param {Object} filters - Обект с филтри
     * @returns {Promise<Array>} Масив с филтрирани транзакции
     */
    async getTransactionsWithFilters(filters = {}) {
        try {
            let query = this.supabase.from(this.tableName).select('*');

            // Прилагане на филтри, ако са зададени
            if (filters.startDate) {
                query = query.gte('Started Date', filters.startDate);
            }
            
            if (filters.endDate) {
                query = query.lte('Started Date', filters.endDate);
            }
            
            if (filters.currency && filters.currency !== 'all') {
                query = query.eq('Currency', filters.currency);
            }
            
            if (filters.type && filters.type !== 'all') {
                query = query.eq('Type', filters.type);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Грешка при извличане на филтрирани транзакции:', error);
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Грешка при извличане на филтрирани транзакции:', error);
            throw error;
        }
    }

    /**
     * Импортиране на транзакции от CSV
     * @param {Array} transactions - Масив с транзакции за импортиране
     * @returns {Promise<Object>} Резултат от операцията
     */
    async importTransactions(transactions) {
        try {
            if (!transactions || transactions.length === 0) {
                return { success: false, error: 'Няма транзакции за импортиране', count: 0 };
            }
            

            
            // Използваме upsert за да добавим всички транзакции наведнъж
            const { data, error } = await this.supabase
                .from(this.tableName)
                .insert(transactions)
                .select();
                
            if (error) {
                console.error('Грешка при импортиране на транзакции:', error);
                return { success: false, error: error.message, count: 0 };
            }
            

            return { success: true, count: data ? data.length : transactions.length };
            
        } catch (error) {
            console.error('Грешка при импортиране на транзакции:', error);
            return { success: false, error: error.message, count: 0 };
        }
    }

    /**
     * Изтриване на транзакция по ID
     * @param {string} id - ID на транзакцията за изтриване
     * @returns {Promise<Object>} Резултат от операцията
     */
    async deleteTransaction(id) {
        try {

            
            // Проверка дали ID е предоставен
            if (!id) {
                throw new Error('Не е предоставен ID на транзакцията');
            }
            
            // Изтриване на транзакцията
            const { data, error } = await this.supabase
                .from(this.tableName)
                .delete()
                .eq('id', id);
                
            if (error) {
                console.error('Грешка при изтриване на транзакция:', error);
                throw error;
            }
            

            return { success: true, data };
        } catch (error) {
            console.error('Грешка при изтриване на транзакция:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== МЕТОДИ ЗА РАБОТА С КАТЕГОРИИ ====================

    /**
     * Извличане на всички категории
     * @returns {Promise<Array>} Масив с всички категории
     */
    async getAllCategories() {
        try {
            const { data, error } = await this.supabase
                .from(this.categoriesTable)
                .select('*')
                .order('name');
                
            if (error) {
                console.error('Грешка при извличане на категории:', error);
                throw error;
            }
            
            return data || [];
        } catch (error) {
            console.error('Грешка при извличане на категории:', error);
            throw error;
        }
    }

    /**
     * Извличане на категория по ID
     * @param {string} id - ID на категорията
     * @returns {Promise<Object>} Категория
     */
    async getCategoryById(id) {
        try {
            if (!id) {
                throw new Error('Не е предоставен ID на категорията');
            }
            
            const { data, error } = await this.supabase
                .from(this.categoriesTable)
                .select('*')
                .eq('id', id)
                .single();
                
            if (error) {
                console.error('Грешка при извличане на категория:', error);
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error('Грешка при извличане на категория:', error);
            throw error;
        }
    }

    /**
     * Добавяне на нова категория
     * @param {Object} category - Обект с данни за категорията
     * @param {string} category.name - Име на категорията
     * @param {string} [category.description] - Описание на категорията
     * @param {string} [category.color] - Цвят на категорията
     * @returns {Promise<Object>} Резултат от операцията
     */
    async addCategory(category) {
        try {
            if (!category || !category.name) {
                return { success: false, error: 'Не е предоставено име на категорията' };
            }
            
            const { data, error } = await this.supabase
                .from(this.categoriesTable)
                .insert(category)
                .select();
                
            if (error) {
                console.error('Грешка при добавяне на категория:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Грешка при добавяне на категория:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Актуализиране на категория
     * @param {string} id - ID на категорията
     * @param {Object} updates - Обект с данни за актуализиране
     * @returns {Promise<Object>} Резултат от операцията
     */
    async updateCategory(id, updates) {
        try {
            if (!id) {
                return { success: false, error: 'Не е предоставен ID на категорията' };
            }
            
            if (!updates || Object.keys(updates).length === 0) {
                return { success: false, error: 'Не са предоставени данни за актуализиране' };
            }
            
            const { data, error } = await this.supabase
                .from(this.categoriesTable)
                .update(updates)
                .eq('id', id)
                .select();
                
            if (error) {
                console.error('Грешка при актуализиране на категория:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Грешка при актуализиране на категория:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Изтриване на категория по ID
     * @param {string} id - ID на категорията за изтриване
     * @returns {Promise<Object>} Резултат от операцията
     */
    async deleteCategory(id) {
        try {
            if (!id) {
                return { success: false, error: 'Не е предоставен ID на категорията' };
            }
            
            // Първо изтриваме всички връзки с търговци
            const { error: merchantCategoriesError } = await this.supabase
                .from(this.merchantCategoriesTable)
                .delete()
                .eq('category_id', id);
                
            if (merchantCategoriesError) {
                console.error('Грешка при изтриване на връзки с търговци:', merchantCategoriesError);
                return { success: false, error: merchantCategoriesError.message };
            }
            
            // След това изтриваме категорията
            const { data, error } = await this.supabase
                .from(this.categoriesTable)
                .delete()
                .eq('id', id)
                .select();
                
            if (error) {
                console.error('Грешка при изтриване на категория:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Грешка при изтриване на категория:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== МЕТОДИ ЗА РАБОТА С ВРЪЗКИ МЕЖДУ ТЪРГОВЦИ И КАТЕГОРИИ ====================

    /**
     * Извличане на категория за търговец
     * @param {string} merchantName - Име на търговеца
     * @returns {Promise<Object>} Категория на търговеца
     */
    async getMerchantCategory(merchantName) {
        try {
            if (!merchantName) {
                throw new Error('Не е предоставено име на търговеца');
            }
            
            const { data, error } = await this.supabase
                .from(this.merchantCategoriesTable)
                .select('*, category:category_id(id, name, description, color)')
                .eq('merchant_name', merchantName)
                .single();
                
            if (error && error.code !== 'PGRST116') { // PGRST116 е код за 'не е намерен запис'
                console.error('Грешка при извличане на категория за търговец:', error);
                throw error;
            }
            
            return data ? data.category : null;
        } catch (error) {
            console.error('Грешка при извличане на категория за търговец:', error);
            throw error;
        }
    }

    /**
     * Извличане на всички търговци за дадена категория
     * @param {string} categoryId - ID на категорията
     * @returns {Promise<Array>} Масив с имена на търговци
     */
    async getMerchantsByCategory(categoryId) {
        try {
            if (!categoryId) {
                throw new Error('Не е предоставен ID на категорията');
            }
            
            const { data, error } = await this.supabase
                .from(this.merchantCategoriesTable)
                .select('merchant_name')
                .eq('category_id', categoryId);
                
            if (error) {
                console.error('Грешка при извличане на търговци по категория:', error);
                throw error;
            }
            
            return data ? data.map(item => item.merchant_name) : [];
        } catch (error) {
            console.error('Грешка при извличане на търговци по категория:', error);
            throw error;
        }
    }

    /**
     * Задаване на категория за търговец
     * @param {string} merchantName - Име на търговеца
     * @param {string} categoryId - ID на категорията
     * @returns {Promise<Object>} Резултат от операцията
     */
    async setMerchantCategory(merchantName, categoryId) {
        try {
            if (!merchantName) {
                return { success: false, error: 'Не е предоставено име на търговеца' };
            }
            
            if (!categoryId) {
                return { success: false, error: 'Не е предоставен ID на категорията' };
            }
            
            // Проверяваме дали вече има запис за този търговец
            const { data: existingData } = await this.supabase
                .from(this.merchantCategoriesTable)
                .select('id')
                .eq('merchant_name', merchantName);
                
            // Ако има запис, го актуализираме
            if (existingData && existingData.length > 0) {
                const { data, error } = await this.supabase
                    .from(this.merchantCategoriesTable)
                    .update({ category_id: categoryId })
                    .eq('merchant_name', merchantName)
                    .select();
                    
                if (error) {
                    console.error('Грешка при актуализиране на категория за търговец:', error);
                    return { success: false, error: error.message };
                }
                
                return { success: true, data: data[0] };
            } else {
                // Ако няма запис, създаваме нов
                const { data, error } = await this.supabase
                    .from(this.merchantCategoriesTable)
                    .insert({
                        merchant_name: merchantName,
                        category_id: categoryId
                    })
                    .select();
                    
                if (error) {
                    console.error('Грешка при добавяне на категория за търговец:', error);
                    return { success: false, error: error.message };
                }
                
                return { success: true, data: data[0] };
            }
        } catch (error) {
            console.error('Грешка при задаване на категория за търговец:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Премахване на категория от търговец
     * @param {string} merchantName - Име на търговеца
     * @returns {Promise<Object>} Резултат от операцията
     */
    async removeMerchantCategory(merchantName) {
        try {
            if (!merchantName) {
                return { success: false, error: 'Не е предоставено име на търговеца' };
            }
            
            const { data, error } = await this.supabase
                .from(this.merchantCategoriesTable)
                .delete()
                .eq('merchant_name', merchantName)
                .select();
                
            if (error) {
                console.error('Грешка при премахване на категория от търговец:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true, data: data[0] };
        } catch (error) {
            console.error('Грешка при премахване на категория от търговец:', error);
            return { success: false, error: error.message };
        }
    }
}

// Създаване на инстанция на услугата
const supabaseService = new SupabaseService();
