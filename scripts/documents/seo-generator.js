/**
 * 🎯 SEO JSON-LD Generator для спортивных событий
 * Динамически генерирует schema.org разметку для Google Rich Results
 */

class SportsEventSEOGenerator {
    constructor() {
        this.baseURL = 'https://motoshfq.github.io';
        this.organizerData = {
            "@type": "SportsOrganization",
            "name": "Федерація Дзюдо України",
            "url": this.baseURL + "/"
        };
        this.categories = {};
        this.events = [];
    }

    /**
     * 📊 Загружаем метаданные категорий
     */
    async loadMetadata() {
        try {
            const response = await fetch('database/docs/index/metadata.json');
            const data = await response.json();
            this.categories = data.categories;
            return true;
        } catch (error) {
            console.error('❌ Ошибка загрузки metadata:', error);
            return false;
        }
    }

    /**
     * 🏆 Загружаем данные конкретной категории соревнований
     */
    async loadCategoryData(categoryKey) {
        try {
            const category = this.categories[categoryKey];
            if (!category) return null;

            const response = await fetch(`database/docs/index/${category.file}`);
            const data = await response.json();
            
            return {
                key: categoryKey,
                title: category.title,
                ageGroup: category.age_group,
                competitions: data.competitions || []
            };
        } catch (error) {
            console.error(`❌ Ошибка загрузки ${categoryKey}:`, error);
            return null;
        }
    }

    /**
     * 📅 Генерирует даты для будущих чемпионатов
     */
    generateEventDates(categoryKey, year = 2025) {
        const dateMap = {
            'u23': { month: 5, day: 29 }, // май
            'u21': { month: 6, day: 15 }, // июнь  
            'u18': { month: 7, day: 12 }, // июль
            'u17': { month: 8, day: 18 }, // август
            'u16': { month: 9, day: 14 }, // сентябрь
            'u15': { month: 10, day: 19 } // октябрь
        };

        const dates = dateMap[categoryKey] || { month: 5, day: 15 };
        const startDate = new Date(year, dates.month - 1, dates.day, 10, 0, 0);
        const endDate = new Date(year, dates.month - 1, dates.day + 1, 18, 0, 0);

        return {
            startDate: this.formatISODate(startDate),
            endDate: this.formatISODate(endDate)
        };
    }

    /**
     * 🌍 Генерирует локации для чемпионатов
     */
    generateEventLocation(categoryKey) {
        const locationMap = {
            'u23': { city: 'Львів', region: 'Львівська область', venue: 'Спортивний комплекс у Львові' },
            'u21': { city: 'Київ', region: 'Київська область', venue: 'Спортивний комплекс у Києві' },
            'u18': { city: 'Харків', region: 'Харківська область', venue: 'Спортивний комплекс у Харкові' },
            'u17': { city: 'Дніпро', region: 'Дніпропетровська область', venue: 'Спортивний комплекс у Дніпрі' },
            'u16': { city: 'Одеса', region: 'Одеська область', venue: 'Спортивний комплекс в Одесі' },
            'u15': { city: 'Запоріжжя', region: 'Запорізька область', venue: 'Спортивний комплекс у Запоріжжі' }
        };

        const location = locationMap[categoryKey] || locationMap['u23'];
        
        return {
            "@type": "Place",
            "name": location.venue,
            "address": {
                "@type": "PostalAddress",
                "addressLocality": location.city,
                "addressRegion": location.region,
                "addressCountry": "UA"
            }
        };
    }

    /**
     * 🎨 Создает SportsEvent объект для JSON-LD
     */
    createSportsEvent(categoryData, position) {
        const { key, title, ageGroup } = categoryData;
        const dates = this.generateEventDates(key);
        const location = this.generateEventLocation(key);

        return {
            "@type": "ListItem",
            "position": position,
            "item": {
                "@type": "SportsEvent",
                "name": title,
                "sport": "Judo",
                "startDate": dates.startDate,
                "endDate": dates.endDate,
                "eventStatus": "https://schema.org/EventScheduled",
                "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                "location": location,
                "description": `Чемпіонат України з дзюдо ${ageGroup}. Офіційні змагання з виявлення кращих спортсменів України.`,
                "image": `${this.baseURL}/assets/judo-${key}-championship.jpg`,
                "organizer": this.organizerData,
                "performer": {
                    "@type": "SportsTeam",
                    "name": `Збірна команда України з дзюдо ${key.toUpperCase()}`
                },
                "offers": {
                    "@type": "Offer",
                    "url": `${this.baseURL}/documents.html#${key}`,
                    "price": "0",
                    "priceCurrency": "UAH",
                    "availability": "https://schema.org/InStock"
                }
            }
        };
    }

    /**
     * 🕐 Форматирует дату в ISO 8601 с украинской временной зоной
     */
    formatISODate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        const second = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hour}:${minute}:${second}+03:00`;
    }

    /**
     * 🔗 Генерирует полную JSON-LD структуру
     */
    async generateJSONLD() {
        console.log('🚀 Запуск генерации JSON-LD...');
        
        // Загружаем метаданные
        const metadataLoaded = await this.loadMetadata();
        if (!metadataLoaded) {
            console.error('❌ Не удалось загрузить метаданные');
            return null;
        }

        // Собираем данные всех категорий
        const categoryKeys = Object.keys(this.categories);
        const sportsEvents = [];
        let position = 1;

        for (const key of categoryKeys) {
            const categoryData = await this.loadCategoryData(key);
            if (categoryData) {
                const sportsEvent = this.createSportsEvent(categoryData, position);
                sportsEvents.push(sportsEvent);
                position++;
                console.log(`✅ Создано событие для ${key}: ${categoryData.title}`);
            }
        }

        // Основная JSON-LD структура
        const jsonLD = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Документи ФДУ - Протоколи чемпіонатів України з дзюдо",
            "description": "Офіційні протоколи та документи Федерації Дзюдо України. Результати чемпіонатів всіх вікових категорій.",
            "url": `${this.baseURL}/documents.html`,
            "inLanguage": "uk-UA",
            "about": {
                "@type": "SportsOrganization",
                "name": "Федерація Дзюдо України"
            },
            "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Головна",
                        "item": this.baseURL
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Документи",
                        "item": `${this.baseURL}/documents.html`
                    }
                ]
            },
            "mainEntity": {
                "@type": "ItemList",
                "name": "Протоколи чемпіонатів України з дзюдо",
                "numberOfItems": sportsEvents.length,
                "itemListElement": sportsEvents
            }
        };

        console.log(`🎯 Генерация завершена! Создано ${sportsEvents.length} спортивных событий`);
        return jsonLD;
    }

    /**
     * 📋 Внедряет JSON-LD в страницу
     */
    async injectJSONLD() {
        const jsonLD = await this.generateJSONLD();
        if (!jsonLD) return false;

        // Удаляем старый JSON-LD если есть
        const existingScript = document.getElementById('sports-events-jsonld');
        if (existingScript) {
            existingScript.remove();
        }

        // Создаем новый script тег
        const script = document.createElement('script');
        script.id = 'sports-events-jsonld';
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(jsonLD, null, 2);

        // Добавляем в head
        document.head.appendChild(script);
        
        console.log('🎉 JSON-LD успешно внедрен в страницу!');
        return true;
    }
}

// 🚀 Экспорт для использования
window.SportsEventSEOGenerator = SportsEventSEOGenerator;

// 🎯 Автоматический запуск при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    if (window.location.pathname.includes('documents.html')) {
        console.log('📄 Обнаружена страница документов, запуск SEO генератора...');
        const seoGenerator = new SportsEventSEOGenerator();
        await seoGenerator.injectJSONLD();
    }
}); 