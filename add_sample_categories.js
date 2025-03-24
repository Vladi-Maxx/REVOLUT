/**
 * Скрипт за добавяне на примерни категории в базата данни
 * 
 * ВНИМАНИЕ: За да използвате този скрипт, първо трябва да създадете файл src/config.js
 * с правилните ключове за Supabase. Този файл не трябва да се качва в Git хранилището.
 * 
 * ЗАБЕЛЕЖКА:
 * Този скрипт е предназначен за изпълнение в Node.js среда.
 * Преди да го използвате, уверете се, че сте инсталирали зависимостите:
 * npm install @supabase/supabase-js
 */

// Импортираме необходимите модули
const { createClient } = require('@supabase/supabase-js');

// Тъй като в Node.js не можем директно да използваме ES модули без допълнителна конфигурация,
// копираме ключовете тук директно за този скрипт
// ВАЖНО: Това е временно решение - в реална среда използвайте .env файл или друг безопасен начин за съхраняване на ключове
const supabaseUrl = 'https://reuuohlmseejmakhxide.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJldXVvaGxtc2Vlam1ha2h4aWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMDU0MTIsImV4cCI6MjA1NzY4MTQxMn0.L0hipLSxu3mtlMcJ8Tk7OsDmvJzjvfGbYsfNVncPOvo';
const supabase = createClient(supabaseUrl, supabaseKey);

// Примерни категории
const sampleCategories = [
    {
        name: 'Храна',
        description: 'Разходи за храна и хранителни стоки',
        color: '#4CAF50'
    },
    {
        name: 'Транспорт',
        description: 'Разходи за транспорт, гориво, билети',
        color: '#2196F3'
    },
    {
        name: 'Развлечения',
        description: 'Разходи за забавления, кино, театър',
        color: '#9C27B0'
    },
    {
        name: 'Битови разходи',
        description: 'Разходи за ток, вода, интернет и други комунални услуги',
        color: '#FF9800'
    },
    {
        name: 'Здраве',
        description: 'Разходи за лекарства, прегледи, здравни услуги',
        color: '#E91E63'
    }
];

// Функция за добавяне на категориите
async function addSampleCategories() {
    console.log('Започва добавяне на примерни категории...');
    
    try {
        // Първо проверяваме дали вече има категории
        const { data: existingCategories, error: checkError } = await supabase
            .from('categories')
            .select('*');
        
        if (checkError) {
            console.error('Грешка при проверка за съществуващи категории:', checkError);
            return;
        }
        
        if (existingCategories && existingCategories.length > 0) {
            console.log(`Вече има ${existingCategories.length} категории в базата данни. Няма да добавяме нови.`);
            return;
        }
        
        // Добавяме категориите
        const { data, error } = await supabase
            .from('categories')
            .insert(sampleCategories)
            .select();
        
        if (error) {
            console.error('Грешка при добавяне на категории:', error);
            return;
        }
        
        console.log(`Успешно добавени ${data.length} категории:`, data);
    } catch (error) {
        console.error('Неочаквана грешка:', error);
    }
}

// Изпълняваме функцията
addSampleCategories();
