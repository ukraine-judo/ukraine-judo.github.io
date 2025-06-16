# 🥋 Система профилей тренерского штаба

Динамическая система управления профилями тренеров по аналогии с системой спортсменов.

## 📁 Структура файлов

```
scripts/team/
├── coaches.json               # Основной список всех тренеров
├── articles/coaches/          # Детальные данные тренеров  
│   ├── gennadiy-tymoshenko.json
│   ├── iryna-melnyk.json
│   ├── viktor-kovalenko.json
│   └── ...
└── coaches-README.md          # Эта документация
```

## 🔧 Как это работает

### 1. Главная страница команды (`team.html`)
- Загружает список тренеров из `coaches.json`
- Для каждого тренера подгружает детальные данные из `articles/coaches/{id}.json`
- Создает карточки тренеров динамически
- Реализует фильтрацию по категориям
- Делает карточки кликабельными для перехода на профили

### 2. Система фильтрации
- **Всі** - показывает всех тренеров
- **Керівництво** - главные тренеры и руководство
- **Чоловіча збірна** - тренеры мужской сборной
- **Жіноча збірна** - тренеры женской сборной  
- **Технічний штаб** - технические специалисты
- **Медичний персонал** - врачи и психологи

## 📋 Формат данных тренера

### coaches.json
```json
{
  "coaches": [
    {
      "id": "gennadiy-tymoshenko",
      "name": "Геннадій Тимошенко",
      "nameEn": "Gennadiy Tymoshenko",
      "position": "Головний тренер",
      "positionEn": "Head Coach",
      "category": "head",
      "experience": "20+",
      "image": "assets/team/coaches/tymoshenko.jpg",
      "specialization": "Загальна підготовка, стратегія"
    }
  ]
}
```

### articles/coaches/{id}.json
```json
{
  "id": "gennadiy-tymoshenko",
  "name": "Геннадій Тимошенко",
  "nameEn": "Gennadiy Tymoshenko",
  "position": "Головний тренер збірної України з дзюдо",
  "category": "head",
  "birthDate": "15 березня 1968",
  "city": "Київ",
  "experience": "25 років тренерського досвіду",
  "education": "Національний університет фізичного виховання і спорту України",
  "image": "assets/team/coaches/tymoshenko.jpg",
  "gallery": ["image1.jpg", "image2.jpg"],
  "specialization": ["Загальна підготовка", "Стратегія"],
  "achievements": [
    {
      "type": "coaching|personal",
      "title": "Олімпійські ігри Токіо-2020",
      "year": 2021,
      "description": "Опис досягнення"
    }
  ],
  "coachingCareer": {
    "startYear": 1998,
    "totalAthletes": 150,
    "olympicMedalists": 8,
    "worldChampions": 12
  },
  "athleticCareer": {
    "startYear": 1980,
    "endYear": 1996,
    "weightCategory": "-78кг",
    "medals": {
      "olympic": 1,
      "world": 3,
      "european": 5
    }
  },
  "philosophy": {
    "approach": "Підхід до тренування",
    "methods": ["Метод1", "Метод2"]
  },
  "currentAthletes": ["athlete-id1", "athlete-id2"],
  "awards": [
    {
      "title": "Заслужений тренер України",
      "year": 2019
    }
  ],
  "quotes": ["Цитата1", "Цитата2"],
  "socialMedia": {
    "instagram": "@coach_username",
    "facebook": "Coach Name"
  },
  "contact": {
    "email": "coach@fju.ua",
    "phone": "+380 67 123 4567"
  }
}
```

## 🏷️ Категории тренеров

| Категория | Описание |
|-----------|----------|
| `head` | Головные тренеры, руководство |
| `men` | Тренеры мужской сборной |
| `women` | Тренеры женской сборной |
| `youth` | Тренеры молодежной сборной |
| `technical` | Технические специалисты |
| `medical` | Медицинский персонал |
| `physical` | Специалисты по физподготовке |

## ➕ Добавление нового тренера

### Шаг 1: Добавить в coaches.json
```json
{
  "id": "new-coach-id",
  "name": "Имя Тренера",
  "nameEn": "Coach Name",
  "position": "Должность",
  "category": "head|men|women|youth|technical|medical|physical",
  "experience": "X+",
  "image": "assets/team/coaches/coach.jpg",
  "specialization": "Специализация"
}
```

### Шаг 2: Создать articles/coaches/new-coach-id.json
Скопировать структуру из существующего файла и заполнить данными.

### Шаг 3: Добавить изображения
Поместить фотографии в `assets/team/coaches/`

## 🎨 Кастомизация

### CSS стили
- `.coach-card` - основная карточка тренера
- `.coach-category-badge` - значок категории
- `.coach-filter-controls` - контролы фильтрации
- `.coach-image-container` - контейнер изображения

### JavaScript функциональность
- `loadCoachesData()` - загрузка данных
- `createCoachCard()` - создание карточки
- `initCoachFiltering()` - инициализация фильтров
- `filterCoaches()` - фильтрация тренеров

## 🔗 URL структура

- Страница команды: `/team.html#coaches`
- Профиль тренера: `/coach.html?id=coach-id` (планируется)

## 🚀 Особенности

- ✅ **Динамическая загрузка** данных из JSON
- ✅ **Фильтрация по категориям** с визуальной обратной связью
- ✅ **Анимации** загрузки и hover эффекты
- ✅ **Адаптивный дизайн** для всех устройств
- ✅ **Placeholder аватары** с инициалами
- ✅ **Обработка ошибок** при загрузке данных
- ✅ **Цветовая кодировка** категорий

## 🎯 Планы развития

- [ ] Страница индивидуального профиля тренера (`coach.html`)
- [ ] Поиск по имени тренера
- [ ] Сортировка по опыту/достижениям
- [ ] Интеграция с календарем тренировок
- [ ] Система рейтингов и отзывов

## 🐛 Устранение неполадок

### Тренер не отображается
1. Проверьте, что ID в `coaches.json` совпадает с именем файла
2. Убедитесь, что JSON файл валидный
3. Проверьте консоль браузера на ошибки

### Неправильная категория
1. Убедитесь, что значение `category` соответствует одному из допустимых
2. Проверьте CSS стили для `.coach-category-badge.{category}`

### Изображение не загружается
1. Проверьте путь к изображению
2. Система автоматически покажет аватар с инициалами как fallback 