# 🥋 Система профилей спортсменов

Эта система позволяет создавать динамические страницы для каждого спортсмена с данными, хранящимися в JSON файлах.

## 📁 Структура файлов

```
scripts/team/
├── athletes.json           # Основной список всех спортсменов
├── articles/              # Детальные данные спортсменов (разделено по полу)
│   ├── men/               # Профили мужчин
│   │   ├── artem-lesiuk.json
│   │   ├── dilshot-khalmatov.json
│   │   ├── kyrylo-samotug.json
│   │   └── ...
│   └── women/             # Профили женщин
│       ├── anna-kravchenko.json
│       ├── maria-petrenko.json
│       └── ...
└── README.md              # Эта документация
```

## 🔧 Как это работает

### 1. Главная страница команды (`team.html`)
- Загружает список спортсменов из `athletes.json`
- Для каждого спортсмена подгружает детальные данные из `articles/{id}.json`
- Создает карточки спортсменов динамически
- Делает карточки кликабельными для перехода на страницу профиля

### 2. Страница профиля спортсмена (`athlete.html`)
- Получает ID спортсмена из URL параметра `?id=athlete-id`
- Загружает детальные данные из `scripts/team/articles/{id}.json`
- Отображает полную информацию: биографию, достижения, статистику, цитаты

## 📋 Формат данных спортсмена

### athletes.json
```json
{
  "athletes": [
    {
      "id": "oleksandr-khomenko",
      "name": "Олександр Хоменко",
      "category": "men",
      "weight": "-73кг",
      "rank": 1,
      "image": "url-to-image"
    }
  ]
}
```

### articles/men/{id}.json или articles/women/{id}.json
```json
{
  "id": "oleksandr-khomenko",
  "name": "Олександр Хоменко",
  "nameEn": "Oleksandr Khomenko",
  "rank": 1,
  "category": "men",
  "weight": "-73кг",
  "age": 26,
  "city": "Київ",
  "country": "Україна",
  "dan": "6-й дан",
  "image": "url-to-image",
  "achievements": [
    {
      "type": "gold|silver|bronze",
      "title": "ЧС-2023",
      "description": "Описание достижения",
      "year": 2023,
      "location": "Место проведения"
    }
  ],
  "biography": {
    "birthDate": "1997-03-15",
    "startYear": 2005,
    "coach": "Имя тренера",
    "club": "Спортивный клуб",
    "height": "175 см",
    "education": "Образование"
  },
  "stats": {
    "competitions": 85,
    "wins": 68,
    "goldMedals": 15,
    "silverMedals": 12,
    "bronzeMedals": 8,
    "worldRanking": 3
  },
  "techniques": ["Техника1", "Техника2"],
  "careerHighlights": ["Достижение1", "Достижение2"],
  "socialMedia": {
    "instagram": "@username",
    "facebook": "Username"
  },
  "quotes": ["Цитата1", "Цитата2"]
}
```

## ➕ Добавление нового спортсмена

### Шаг 1: Добавить в athletes.json
```json
{
  "id": "new-athlete-id",
  "name": "Имя Спортсмена",
  "category": "men|women|men veterans|women veterans",
  "weight": "-ХХкг",
  "rank": 1,
  "image": "url-to-image"
}
```

### Шаг 2: Создать articles/men/new-athlete-id.json или articles/women/new-athlete-id.json
Поместить файл в папку `men/` или `women/` в зависимости от пола спортсмена. Скопировать структуру из существующего файла и заполнить данными.

### Шаг 3: Обновить статистику
В `team.html` обновить статистику в hero-секции если нужно.

## 🎨 Кастомизация

### CSS стили
- `css/pages/team.css` - стили для страницы команды
- `css/pages/athlete.css` - стили для страницы профиля спортсмена

### JavaScript функциональность
- `scripts/team.js` - логика страницы команды
- `scripts/athlete.js` - логика страницы профиля

## 🔗 URL структура

- Страница команды: `/team.html`
- Профиль спортсмена: `/athlete.html?id=athlete-id`

Например:
- `/athlete.html?id=oleksandr-khomenko`
- `/athlete.html?id=maria-petrenko`

## 🚀 Особенности

- ✅ **Динамическая загрузка** данных из JSON
- ✅ **Фильтрация** по категориям (мужчины/женщины/ветераны)
- ✅ **Поиск** по имени спортсмена
- ✅ **Анимации** загрузки и появления элементов
- ✅ **Адаптивный дизайн** для всех устройств
- ✅ **SEO оптимизация** с динамическими meta-тегами
- ✅ **Обработка ошибок** при загрузке данных

## 🐛 Устранение неполадок

### Спортсмен не отображается
1. Проверьте, что ID в `athletes.json` совпадает с именем файла
2. Убедитесь, что JSON файл валидный
3. Проверьте консоль браузера на ошибки

### Ошибка 404 при загрузке профиля
1. Проверьте, что файл `articles/{id}.json` существует
2. Убедитесь, что ID в URL правильный
3. Проверьте права доступа к файлам 