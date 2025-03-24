/**
 * Скрипт за добавяне на примерни категории в базата данни Supabase
 * 
 * ВНИМАНИЕ: За да използвате този скрипт, първо трябва да създадете файл src/config.js
 * с правилните ключове за Supabase. Този файл не трябва да се качва в Git хранилището.
 * За да се използва този скрипт като модул, добавете атрибут type="module" към тага script, 
 * например: <script src="add_categories.js" type="module"></script>
 */

// Импортираме конфигурационните настройки
import config from './src/config.js';

// Инициализираме Supabase клиент с ключове от конфигурационния файл
const supabaseUrl = config.supabaseUrl;
const supabaseKey = config.supabaseKey;

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
    
    // Използваме глобалния supabase обект, зареден от CDN
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    
    // Добавяме категориите
    supabaseClient
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
