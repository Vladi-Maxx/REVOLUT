/**
 * Клас за импортиране на CSV файлове с транзакции
 * Управлява процеса на импортиране и проверката за дубликати
 */
class CsvImporter {
    /**
     * Създава нова инстанция на CsvImporter
     * @param {Object} options - Опции за конфигурация
     * @param {Object} options.supabaseService - Услуга за достъп до базата данни
     * @param {Object} options.csvUtils - Утилити за работа с CSV файлове
     * @param {Function} options.notificationCallback - Функция за показване на известия
     * @param {Function} options.onImportSuccess - Функция, която се извиква след успешен импорт
     */
    constructor({ supabaseService, csvUtils, notificationCallback, onImportSuccess }) {
        this.supabaseService = supabaseService;
        this.csvUtils = csvUtils;
        this.showNotification = notificationCallback;
        this.onImportSuccess = onImportSuccess;
    }

    /**
     * Импорт на CSV файл с транзакции
     * @param {File} file - CSV файл за импортиране
     * @param {Array} existingTransactions - Опционален масив със съществуващи транзакции (за оптимизация)
     */
    async importCsvFile(file, existingTransactions = null) {
        try {
            // Показваме съобщение за зареждане
            this.showNotification('Зареждане на CSV файл...');
            
            // Използваме CsvUtils за четене на файла
            const transactions = await this.csvUtils.readCsvFile(file);
            
            if (!transactions || transactions.length === 0) {
                throw new Error('Няма валидни транзакции в CSV файла');
            }
            

            
            // Проверка на структурата на CSV транзакции
            
            // Вземаме съществуващите транзакции за проверка за дубликати
            let dbTransactions = existingTransactions;
            
            if (!dbTransactions) {
                // Зареждаме ги от базата данни, ако не са предоставени
                dbTransactions = await this.supabaseService.getAllTransactions();
            }
            
            // Проверка на съществуващите транзакции
            
            // Маркираме CSV транзакциите, за да ги различаваме по-лесно
            transactions.forEach(tx => tx.__source = 'csv');
            
            // Филтрираме новите транзакции (премахваме дубликати)
            const { newTransactions, duplicates } = this.findUniqueTransactions(transactions, dbTransactions);
            

            
            if (newTransactions.length === 0) {
                this.showNotification(`Няма нови транзакции за импортиране. Намерени са ${duplicates.length} дубликати.`, 'info');
                return;
            }
            

            
            // Потвърждение от потребителя
            const confirmImport = confirm(`Намерени са ${newTransactions.length} нови транзакции за импортиране и ${duplicates.length} дубликати. Желаете ли да продължите?`);
            
            if (!confirmImport) {

                this.showNotification('Импортирането е отменено', 'info');
                return;
            }
            
            // Показваме съобщение за зареждане
            this.showNotification('Импортиране на транзакции...');
            
            // Премахваме служебните полета, които не съществуват в базата данни
            const cleanTransactions = newTransactions.map(tx => {
                // Създаваме копие на обекта без __source полето
                const { __source, ...cleanTx } = tx;
                return cleanTx;
            });
            
            // Импортираме новите транзакции в базата данни
            const result = await this.supabaseService.importTransactions(cleanTransactions);
            
            if (result.success) {
                this.showNotification(`Успешно импортирани ${result.count} транзакции`, 'success');
                
                // Уведомяваме за успешното импортиране
                if (this.onImportSuccess) {
                    await this.onImportSuccess();
                }
                
                return { success: true, count: result.count };
            } else {
                throw new Error(result.error || 'Грешка при импортиране');
            }
            
        } catch (error) {
            console.error('Грешка при импортиране на CSV файл:', error);
            this.showNotification(`Грешка: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Проверка за дубликати и търсене на уникални транзакции
     * @param {Array} csvTransactions - Транзакции от CSV файла
     * @param {Array} dbTransactions - Съществуващи транзакции в базата данни
     * @returns {Object} Обект с масиви на нови и дублиращи се транзакции
     */
    findUniqueTransactions(csvTransactions, dbTransactions) {
        // Създаваме набор от уникални идентификатори за съществуващите транзакции
        const existingSet = new Set();
        const newTransactions = [];
        const duplicates = [];

        // Дебъг информация за транзакциите в базата

        
        // Важно: Използваме само датата, сумата и типа за сравнение
        // Създаваме идентификатори за всички съществуващи транзакции
        for (const tx of dbTransactions) {
            // Взимаме само необходимите полета
            let dateStr = this.normalizeDate(tx['Started Date']);
            let amount = tx['Amount'];
            let type = tx['Type'];
            
            if (dateStr && amount) {
                // Създаваме прост уникален ключ
                existingSet.add(`${dateStr}|${amount}|${type}`);
            }
        }
        

        
        // Проверяваме всяка CSV транзакция дали вече съществува
        for (const tx of csvTransactions) {
            let dateStr = this.normalizeDate(tx['Started Date']);
            let amount = tx['Amount'];
            let type = tx['Type'];
            
            // Създаваме същия тип уникален ключ
            const key = `${dateStr}|${amount}|${type}`;
            
            // Проверяваме дали съществува
            if (existingSet.has(key)) {
                // Това е дубликат
                duplicates.push(tx);
            } else {
                // Това е нова транзакция
                newTransactions.push(tx);
                // Добавяме я в сета, за да не допуснем дубликати в самия CSV файл
                existingSet.add(key);
            }
        }
        
        // Извеждаме примерни резултати

        
        return { newTransactions, duplicates };
    }
    
    /**
     * Създаване на уникален ключ за транзакция
     * @param {Object} transaction - Транзакция
     * @returns {string} Уникален ключ
     */
    createTransactionKey(transaction) {
        try {
            // Извличаме стойностите в зависимост от формата на данните
            const dateStr = transaction['Started Date'] || transaction.started_date || '';
            
            // Обработваме сумата в зависимост от формата
            let amount = transaction.Amount || transaction.amount || 0;
            if (typeof amount === 'number') {
                amount = amount.toFixed(2);
            }
            
            // Извличаме описанието и други полета
            const desc = (transaction.Description || transaction.description || '').trim();
            
            // Връщаме опростен ключ само с най-важните полета
            return `${dateStr}|${amount}|${desc}`.toLowerCase();
        } catch (error) {
            console.error('Грешка при създаване на ключ:', error, transaction);
            return `error-${Math.random()}`;
        }
    }
    
    /**
     * Нормализиране на дати за сравнение
     * @param {string} dateStr - Дата като стринг
     * @returns {string} Нормализирана дата
     */
    normalizeDate(dateStr) {
        if (!dateStr) return '';
        
        // Премахваме буквата 'T' и часовия пояс (ако съществуват)
        return dateStr.replace('T', ' ').split('+')[0].trim();
    }
}

// Класът се използва глобално
