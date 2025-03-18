/**
 * Утилити за работа с CSV файлове
 */
class CsvUtils {
    /**
     * Прочитане на CSV файл и преобразуване в масив от обекти
     * @param {File} file - CSV файл за четене
     * @returns {Promise<Array>} Масив от обекти с данни от CSV файла
     */
    static async readCsvFile(file) {
        return new Promise((resolve, reject) => {
            if (!file || (file.type !== 'text/csv' && !file.name.endsWith('.csv'))) {
                reject(new Error('Невалиден CSV файл'));
                return;
            }
            
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const csvData = event.target.result;
                    const transactions = this.parseCsvData(csvData);
                    
                    // Очистваме и валидираме данните след парсване
                    const cleanedTransactions = this.cleanAndValidateData(transactions);
                    resolve(cleanedTransactions);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = (error) => {
                reject(new Error('Грешка при четене на файла: ' + error));
            };
            
            reader.readAsText(file);
        });
    }
    
    /**
     * Очистване и валидация на данните от CSV
     * @param {Array} transactions - Масив от обекти с транзакции
     * @returns {Array} Очистен и валидиран масив от транзакции
     */
    static cleanAndValidateData(transactions) {
        return transactions.map(tx => {
            // Създаваме нов обект, за да не променяме оригиналния
            const cleanTx = {...tx};

            // Тук обработваме всички числови полета
            // Amount
            cleanTx.Amount = this.cleanNumberField(cleanTx.Amount);
            
            // Fee
            cleanTx.Fee = this.cleanNumberField(cleanTx.Fee);
            
            // Balance
            cleanTx.Balance = this.cleanNumberField(cleanTx.Balance);
            
            // Уверяваме се, че датите са валидни
            cleanTx['Started Date'] = cleanTx['Started Date'] || null;
            cleanTx['Completed Date'] = cleanTx['Completed Date'] || null;
            
            // Уверяваме се, че текстовите полета са дефинирани
            cleanTx.Type = cleanTx.Type || '';
            cleanTx.Product = cleanTx.Product || '';
            cleanTx.Description = cleanTx.Description || '';
            cleanTx.Currency = cleanTx.Currency || '';
            cleanTx.State = cleanTx.State || '';
            
            return cleanTx;
        }).filter(tx => {
            // Филтрираме непълни редове (например, ако някоя транзакция съдържа само няколко полета)
            return tx.Type && tx.Product && tx['Started Date'];
        });
    }
    
    /**
     * Очистване на числово поле
     * @param {string|number} value - Стойност за очистване
     * @returns {string} Очистена стойност като текст
     */
    static cleanNumberField(value) {
        // Ако е null, undefined или празен стринг, връщаме '0'
        if (value === null || value === undefined || value === '') {
            return '0';
        }
        
        // Премахваме всички кавички и интервали
        let cleaned = String(value).replace(/["']/g, '').trim();
        
        // Ако след премахване на кавичките е празно, връщаме '0'
        if (cleaned === '') {
            return '0';
        }
        
        // Опитваме да го преобразуваме в число, за да уверим, че е валидно
        try {
            const num = parseFloat(cleaned);
            if (isNaN(num)) {
                return '0';
            }
            // Връщаме числото като стринг с фиксирана точност, за да избегнем проблеми с плаващата запетая
            return num.toString();
        } catch (e) {
            return '0';
        }
    }
    
    /**
     * Парсиране на CSV данни в масив от обекти
     * @param {string} csvData - CSV данни като текст
     * @returns {Array} Масив от обекти, съответстващи на редовете в CSV
     */
    static parseCsvData(csvData) {
        // Разделяне на редовете
        const lines = csvData.split(/\r\n|\n/);
        if (lines.length < 2) {
            throw new Error('CSV файлът не съдържа данни');
        }
        
        // Получаване на заглавията от първия ред
        const headers = this.parseCsvLine(lines[0]);
        
        // Преобразуване на всеки ред в обект
        const transactions = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Пропускаме празни редове
            
            const values = this.parseCsvLine(line);
            if (values.length !== headers.length) {
                console.warn(`Ред ${i + 1} има различен брой колони от заглавния ред и е пропуснат`);
                continue;
            }
            
            const transaction = {};
            headers.forEach((header, index) => {
                transaction[header] = values[index];
            });
            
            transactions.push(transaction);
        }
        
        return transactions;
    }
    
    /**
     * Парсиране на ред от CSV файл, с поддръжка на кавички и запетаи в стойностите
     * @param {string} line - Ред от CSV файл
     * @returns {Array} Масив от стойности от реда
     */
    static parseCsvLine(line) {
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"' && !insideQuotes) {
                insideQuotes = true;
                continue;
            }
            
            if (char === '"' && insideQuotes) {
                // Ако следващият символ също е кавички, то имаме ескейпнати кавички
                if (nextChar === '"') {
                    currentValue += '"';
                    i++; // Пропускаме втората кавичка
                } else {
                    insideQuotes = false;
                }
                continue;
            }
            
            if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
                continue;
            }
            
            currentValue += char;
        }
        
        // Добавяме последната стойност
        values.push(currentValue.trim());
        
        return values;
    }
}
