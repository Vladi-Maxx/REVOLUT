-- Създаване на таблица 'categories'
CREATE TABLE IF NOT EXISTS categories (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
) WITH (OIDS=FALSE);

-- Добавяне на уникален индекс за името на категорията
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_unique ON categories(name);

-- Създаване на таблица 'merchant_categories' за връзка между търговци и категории
CREATE TABLE IF NOT EXISTS merchant_categories (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    merchant_name TEXT NOT NULL,
    category_id bigint NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
) WITH (OIDS=FALSE);

-- Добавяне на индекс за по-бързо търсене по име на търговец
CREATE INDEX IF NOT EXISTS idx_merchant_categories_merchant_name ON merchant_categories(merchant_name);

-- Добавяне на индекс за по-бързо търсене по категория
CREATE INDEX IF NOT EXISTS idx_merchant_categories_category_id ON merchant_categories(category_id);

-- Добавяне на уникален индекс, за да предотвратим дублиране на връзки
CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_categories_unique ON merchant_categories(merchant_name);

-- Добавяне на няколко примерни категории
INSERT INTO categories (name, description, color) VALUES
('Хранителни', 'Разходи за храна и хранителни стоки', '#4CAF50'),
('Транспорт', 'Разходи за транспорт, гориво и пътувания', '#2196F3'),
('Забавление', 'Разходи за забавление, ресторанти и кафета', '#9C27B0'),
('Комунални', 'Разходи за комунални услуги, ток, вода, интернет', '#FF9800'),
('Здраве', 'Разходи за здравеопазване и лекарства', '#E91E63'),
('Дрехи', 'Разходи за облекло и аксесоари', '#795548'),
('Образование', 'Разходи за образование и курсове', '#607D8B'),
('Жилище', 'Разходи за наем, ипотека и поддръжка на жилище', '#FF5722'),
('Други', 'Други разходи', '#9E9E9E')
ON CONFLICT DO NOTHING;
