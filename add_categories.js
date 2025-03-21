/**
 * Скрипт за добавяне на примерни категории в базата данни Supabase
 */

// Инициализираме Supabase клиент
const supabaseUrl = 'https://reuuohlmseejmakhxide.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJldXVvaGxtc2Vlam1ha2h4aWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMDU0MTIsImV4cCI6MjA1NzY4MTQxMn0.L0hipLSxu3mtlMcJ8Tk7OsDmvJzjvfGbYsfNVncPOvo';

// Примерни категории
const sampleCategories = [
    {
        name: 'Хранителни',
        description: 'Разходи за храна и хранителни стоки',
        color: '#4CAF50'
    },
    {
        name: 'Транспорт',
        description: 'Разходи за транспорт, гориво и пътувания',
        color: '#2196F3'
    },
    {
        name: 'Забавление',
        description: 'Разходи за забавление, ресторанти и кафета',
        color: '#9C27B0'
    },
    {
        name: 'Комунални',
        description: 'Разходи за комунални услуги, ток, вода, интернет',
        color: '#FF9800'
    },
    {
        name: 'Здраве',
        description: 'Разходи за здравеопазване и лекарства',
        color: '#E91E63'
    },
    {
        name: 'Дрехи',
        description: 'Разходи за облекло и аксесоари',
        color: '#795548'
    },
    {
        name: 'Образование',
        description: 'Разходи за образование и курсове',
        color: '#607D8B'
    },
    {
        name: 'Жилище',
        description: 'Разходи за наем, ипотека и поддръжка на жилище',
        color: '#FF5722'
    },
    {
        name: 'Други',
        description: 'Други разходи',
        color: '#9E9E9E'
    }
];

// Функция за добавяне на категориите в браузъра
function addCategories() {
    console.log('Започва добавяне на категории...');
    
    // Създаваме Supabase клиент
    const supabase = supabase.createClient(supabaseUrl, supabaseKey);
    
    // Добавяме категориите
    supabase
        .from('categories')
        .insert(sampleCategories)
        .then(response => {
            if (response.error) {
                console.error('Грешка при добавяне на категории:', response.error);
            } else {
                console.log('Успешно добавени категории:', response.data ? response.data.length : 0);
            }
        })
        .catch(error => {
            console.error('Неочаквана грешка:', error);
        });
}

// Изпълняваме функцията при зареждане на страницата
document.addEventListener('DOMContentLoaded', () => {
    // Добавяме бутон за добавяне на категории
    const addCategoriesButton = document.createElement('button');
    addCategoriesButton.textContent = 'Добави примерни категории';
    addCategoriesButton.style.position = 'fixed';
    addCategoriesButton.style.bottom = '60px';
    addCategoriesButton.style.right = '10px';
    addCategoriesButton.style.zIndex = '1000';
    addCategoriesButton.style.padding = '10px';
    addCategoriesButton.style.backgroundColor = '#4CAF50';
    addCategoriesButton.style.color = 'white';
    addCategoriesButton.style.border = 'none';
    addCategoriesButton.style.borderRadius = '4px';
    addCategoriesButton.style.cursor = 'pointer';
    
    addCategoriesButton.addEventListener('click', addCategories);
    
    document.body.appendChild(addCategoriesButton);
});
