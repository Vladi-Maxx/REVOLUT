/**
 * Услуга за връзка със Supabase и извличане на данни за транзакции
 */
class SupabaseService {
    constructor() {
        // Инициализиране на Supabase клиент с данните от .env файла
        this.supabaseUrl = 'https://reuuohlmseejmakhxide.supabase.co';
        this.supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJldXVvaGxtc2Vlam1ha2h4aWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMDU0MTIsImV4cCI6MjA1NzY4MTQxMn0.L0hipLSxu3mtlMcJ8Tk7OsDmvJzjvfGbYsfNVncPOvo';
        this.supabase = supabase.createClient(this.supabaseUrl, this.supabaseKey);
        
        // Име на таблицата с транзакции
        this.tableName = 'transactions';
    }

    /**
     * Извличане на всички транзакции (c автоматична пагинация)
     * @returns {Promise<Array>} Масив с всички транзакции
     */
    async getAllTransactions() {
        try {
            console.log('Извличане на всички транзакции с автоматична пагинация');
            
            // Първо извличаме броя на всички записи
            const { count } = await this.supabase
                .from(this.tableName)
                .select('*', { count: 'exact', head: true });
            
            console.log(`Общ брой транзакции: ${count}`);
            
            // Ако няма записи, връщаме празен масив
            if (!count) {
                return [];
            }
            
            // Определяме размера на страницата и изчисляваме броя на страниците
            const pageSize = 1000;
            const pages = Math.ceil(count / pageSize);
            
            console.log(`Извличане на ${pages} страници с по ${pageSize} записа на страница`);
            
            // Масив за съхранение на всички транзакции
            let allTransactions = [];
            
            // Извличаме всяка страница последователно
            for (let page = 0; page < pages; page++) {
                const offset = page * pageSize;
                console.log(`Извличане на страница ${page + 1}/${pages}, офсет: ${offset}`);
                
                const { data, error } = await this.supabase
                    .from(this.tableName)
                    .select('*')
                    .range(offset, offset + pageSize - 1);
                
                if (error) {
                    console.error(`Грешка при извличане на страница ${page + 1}:`, error);
                    throw error;
                }
                
                console.log(`Извлечени ${data.length} записа от страница ${page + 1}`);
                
                // Добавяме записите от текущата страница към общия масив
                if (data && data.length > 0) {
                    allTransactions = [...allTransactions, ...data];
                }
            }
            
            console.log(`Общо извлечени ${allTransactions.length} транзакции от общо ${count}`);
            
            // Дебъг информация за първата транзакция
            if (allTransactions.length > 0) {
                console.log('Първа транзакция имена на полета:', Object.keys(allTransactions[0]));
                console.log('Първа транзакция данни:', allTransactions[0]);
            }
            
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
            console.log(`Извличане на транзакции по период: ${startDate} - ${endDate}`);
            
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

            console.log(`Извлечени ${data?.length || 0} транзакции от общо ${count} за периода`);
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
            
            console.log(`Стартиране на импорт на ${transactions.length} транзакции`);
            
            // Използваме upsert за да добавим всички транзакции наведнъж
            const { data, error } = await this.supabase
                .from(this.tableName)
                .insert(transactions)
                .select();
                
            if (error) {
                console.error('Грешка при импортиране на транзакции:', error);
                return { success: false, error: error.message, count: 0 };
            }
            
            console.log(`Успешно импортирани ${data ? data.length : transactions.length} транзакции`);
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
            console.log(`Изтриване на транзакция с ID: ${id}`);
            
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
            
            console.log('Транзакцията е изтрита успешно');
            return { success: true, data };
        } catch (error) {
            console.error('Грешка при изтриване на транзакция:', error);
            return { success: false, error: error.message };
        }
    }
}

// Създаване на инстанция на услугата
const supabaseService = new SupabaseService();
