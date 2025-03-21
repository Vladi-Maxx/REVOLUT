/**
 * Клас с помощни функции за работа с дати
 * Предоставя методи за форматиране и манипулиране на дати
 */
class DateUtils {
    /**
     * Форматиране на дата за HTML5 date input поле (yyyy-mm-dd)
     * @param {Date} date - Дата
     * @returns {string} Форматирана дата за HTML5 date input
     */
    static formatDateForDateInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Нормализиране на дати за сравнение
     * @param {string} dateStr - Дата като стринг
     * @returns {string} Нормализирана дата
     */
    static normalizeDate(dateStr) {
        if (!dateStr) return '';
        
        // Премахваме буквата 'T' и часовия пояс (ако съществуват)
        return dateStr.replace('T', ' ').split('+')[0].trim();
    }

    /**
     * Връща обект с начална и крайна дата за последната седмица
     * @returns {Object} Обект с начална и крайна дата
     */
    static getLastWeekRange() {
        const today = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        
        // Установяваме началото на деня за началната дата
        oneWeekAgo.setHours(0, 0, 0, 0);
        
        // Установяваме края на деня за крайната дата
        today.setHours(23, 59, 59, 999);
        
        return {
            startDate: oneWeekAgo,
            endDate: today
        };
    }

    /**
     * Връща обект с начална и крайна дата за текущия месец
     * @returns {Object} Обект с начална и крайна дата
     */
    static getCurrentMonthRange() {
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Установяваме началото на деня за началната дата
        firstDayOfMonth.setHours(0, 0, 0, 0);
        
        // Установяваме края на деня за крайната дата
        today.setHours(23, 59, 59, 999);
        
        return {
            startDate: firstDayOfMonth,
            endDate: today
        };
    }

    /**
     * Връща обект с начална и крайна дата за предишния месец
     * @returns {Object} Обект с начална и крайна дата
     */
    static getLastMonthRange() {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);
        
        // Установяваме началото на месеца за началната дата
        const firstDayOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
        firstDayOfLastMonth.setHours(0, 0, 0, 0);
        
        // Установяваме последния ден на месеца за крайната дата
        const lastDayOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
        lastDayOfLastMonth.setHours(23, 59, 59, 999);
        
        return {
            startDate: firstDayOfLastMonth,
            endDate: lastDayOfLastMonth
        };
    }

    /**
     * Връща обект с начална и крайна дата за текущата година
     * @returns {Object} Обект с начална и крайна дата
     */
    static getCurrentYearRange() {
        const today = new Date();
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        
        // Установяваме началото на деня за началната дата
        firstDayOfYear.setHours(0, 0, 0, 0);
        
        // Установяваме края на деня за крайната дата
        today.setHours(23, 59, 59, 999);
        
        return {
            startDate: firstDayOfYear,
            endDate: today
        };
    }
}
