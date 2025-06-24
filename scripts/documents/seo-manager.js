/**
 * Documents SEO Manager
 * Автоматически генерирует и обновляет LD+JSON схемы для страницы документов
 * на основе реальных данных из базы документов и протоколов
 */

class DocumentsSEOManager {
    constructor() {
        this.dataManager = null;
        this.documentsData = [];
        this.protocolsData = [];
        this.metadata = {};
        this.siteUrl = 'https://motoshfq.github.io/';
        
        // Mapping категорий документов к Schema.org типам
        this.categoryToSchemaType = {
            'protocols': 'DigitalDocument',
            'statutory': 'LegislativeDocument', 
            'competitions': 'DigitalDocument',
            'athletes': 'DigitalDocument',
            'medical': 'DigitalDocument',
            'financial': 'DigitalDocument',
            'education': 'EducationalOccupationalCredential'
        };
        
        // Mapping типов файлов к MIME типам
        this.fileExtensionToMimeType = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
    }

    /**
     * Инициализация SEO менеджера
     * @param {DocumentsDataManager} dataManager - Менеджер данных документов
     */
    async init(dataManager) {
        this.dataManager = dataManager;
        
        try {
            // Загружаем данные документов
            await this.loadDocumentsData();
            
            // Загружаем данные протоколов
            await this.loadProtocolsData();
            
            // Генерируем и обновляем LD+JSON схемы
            this.updateStructuredData();
            
            // Обновляем мета-теги
            this.updateMetaTags();
            
            console.log('Documents SEO Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Documents SEO Manager:', error);
        }
    }

    /**
     * Загрузка данных документов
     */
    async loadDocumentsData() {
        if (this.dataManager && this.dataManager.isDataLoaded()) {
            const data = this.dataManager.getData();
            this.documentsData = data.documents || [];
            this.metadata = data.metadata || {};
        }
    }

    /**
     * Загрузка данных протоколов
     */
    async loadProtocolsData() {
        try {
            // Загружаем метаданные протоколов
            const metadataResponse = await fetch('database/docs/index/metadata.json');
            const metadata = await metadataResponse.json();
            
            // Загружаем данные для каждой категории протоколов
            const categories = ['u23', 'u21', 'u18', 'u17', 'u16', 'u15'];
            const protocolPromises = categories.map(async (category) => {
                try {
                    const response = await fetch(`database/docs/index/${category}.json`);
                    const data = await response.json();
                    return {
                        category,
                        ...data,
                        metadata: metadata.categories[category]
                    };
                } catch (error) {
                    console.warn(`Failed to load protocols for ${category}:`, error);
                    return null;
                }
            });
            
            const protocolsResults = await Promise.all(protocolPromises);
            this.protocolsData = protocolsResults.filter(data => data !== null);
            
        } catch (error) {
            console.error('Failed to load protocols data:', error);
        }
    }

    /**
     * Обновление всех LD+JSON схем
     */
    updateStructuredData() {
        this.updateCollectionPageSchema();
        this.updateBreadcrumbSchema();
    }

    /**
     * Генерация и обновление схемы CollectionPage
     */
    updateCollectionPageSchema() {
        const schema = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Офіційні документи Федерації Дзюдо України",
            "description": "Колекція офіційних документів ФДУ: протоколи чемпіонатів, статути, положення про змагання, регламенти та інші офіційні матеріали федерації",
            "url": `${this.siteUrl}documents.html`,
            "inLanguage": "uk-UA",
            "isPartOf": {
                "@type": "WebSite",
                "name": "Федерація Дзюдо України",
                "url": this.siteUrl
            },
            "about": {
                "@type": "SportsOrganization",
                "name": "Федерація Дзюдо України",
                "url": this.siteUrl
            },
            "mainEntity": this.generateItemListSchema()
        };

        this.updateSchemaElement('documents-collection-schema', schema);
    }

    /**
     * Генерация схемы ItemList с реальными документами
     */
    generateItemListSchema() {
        const allItems = [];
        let position = 1;

        // Добавляем обычные документы
        this.documentsData.forEach(doc => {
            allItems.push({
                "@type": "ListItem",
                "position": position++,
                "item": this.generateDocumentSchema(doc)
            });
        });

        // Добавляем протоколы соревнований
        this.protocolsData.forEach(categoryData => {
            categoryData.competitions?.forEach(competition => {
                allItems.push({
                    "@type": "ListItem", 
                    "position": position++,
                    "item": this.generateProtocolSchema(competition, categoryData)
                });
            });
        });

        return {
            "@type": "ItemList",
            "name": "Документи та протоколи ФДУ",
            "description": "Повна колекція офіційних документів та протоколів змагань Федерації Дзюдо України",
            "numberOfItems": allItems.length,
            "itemListElement": allItems
        };
    }

    /**
     * Генерация схемы для обычного документа
     */
    generateDocumentSchema(doc) {
        const schemaType = this.categoryToSchemaType[doc.category] || 'DigitalDocument';
        const fileExtension = doc.extension || 'pdf';
        const mimeType = this.fileExtensionToMimeType[fileExtension] || 'application/pdf';

        return {
            "@type": schemaType,
            "name": doc.title,
            "description": doc.description,
            "about": this.getCategoryTheme(doc.category),
            "genre": this.getCategoryGenre(doc.category),
            "fileFormat": mimeType,
            "inLanguage": "uk-UA",
            "author": {
                "@type": "SportsOrganization",
                "name": "Федерація Дзюдо України",
                "url": this.siteUrl
            },
            "publisher": {
                "@type": "SportsOrganization", 
                "name": "Федерація Дзюдо України",
                "url": this.siteUrl
            },
            "datePublished": doc.date || "2024",
            "license": "https://creativecommons.org/licenses/by/4.0/",
            "keywords": (doc.tags || []).join(", "),
            "url": `${this.siteUrl}documents.html#${doc.id}`
        };
    }

    /**
     * Генерация схемы для протокола соревнований
     */
    generateProtocolSchema(competition, categoryData) {
        return {
            "@type": "DigitalDocument",
            "name": `Протокол: ${competition.title}`,
            "description": `Офіційний протокол змагань ${competition.title}, ${competition.location}, ${competition.date}`,
            "about": "Дзюдо",
            "genre": "Спортивний протокол",
            "fileFormat": "application/pdf",
            "inLanguage": "uk-UA",
            "author": {
                "@type": "SportsOrganization",
                "name": "Федерація Дзюдо України", 
                "url": this.siteUrl
            },
            "publisher": {
                "@type": "SportsOrganization",
                "name": "Федерація Дзюдо України",
                "url": this.siteUrl
            },
            "datePublished": `${competition.year}`,
            "license": "https://creativecommons.org/licenses/by/4.0/",
            "keywords": `${categoryData.metadata?.title}, протокол, ${competition.year}, ${competition.location}`,
            "url": `${this.siteUrl}documents.html#protocol-${competition.year}-${categoryData.category}`,
            "isBasedOn": {
                "@type": "SportsEvent",
                "name": competition.title,
                "location": {
                    "@type": "Place",
                    "name": competition.location,
                    "addressCountry": "UA"
                },
                "startDate": this.parseCompetitionDate(competition.date, competition.year),
                "sport": "Judo",
                "organizer": {
                    "@type": "SportsOrganization",
                    "name": "Федерація Дзюдо України",
                    "url": this.siteUrl
                }
            }
        };
    }

    /**
     * Получение темы для категории документа
     */
    getCategoryTheme(category) {
        const themes = {
            'protocols': 'Протоколи змагань',
            'statutory': 'Організаційна структура',
            'competitions': 'Правила змагань',
            'athletes': 'Спортсмени',
            'medical': 'Медичне забезпечення',
            'financial': 'Фінансова діяльність',
            'education': 'Освітня діяльність'
        };
        return themes[category] || 'Дзюдо';
    }

    /**
     * Получение жанра для категории документа
     */
    getCategoryGenre(category) {
        const genres = {
            'protocols': 'Спортивний протокол',
            'statutory': 'Статутний документ',
            'competitions': 'Регламентний документ',
            'athletes': 'Реєстраційний документ',
            'medical': 'Медичний документ',
            'financial': 'Фінансовий документ',
            'education': 'Навчальний документ'
        };
        return genres[category] || 'Офіційний документ';
    }

    /**
     * Парсинг даты соревнований
     */
    parseCompetitionDate(dateStr, year) {
        try {
            if (dateStr && dateStr.includes(' ')) {
                return `${year}-01-01`;
            }
            return `${year}-01-01`;
        } catch (error) {
            return `${year}-01-01`;
        }
    }

    /**
     * Генерация схемы Breadcrumb
     */
    generateBreadcrumbSchema() {
        return {
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Головна",
                    "item": this.siteUrl
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Документи",
                    "item": `${this.siteUrl}documents.html`
                }
            ]
        };
    }

    /**
     * Обновление Breadcrumb схемы
     */
    updateBreadcrumbSchema() {
        const schema = {
            "@context": "https://schema.org",
            ...this.generateBreadcrumbSchema()
        };

        this.updateSchemaElement('documents-breadcrumb-schema', schema);
    }

    /**
     * Обновление элемента схемы в DOM
     */
    updateSchemaElement(id, schema) {
        let schemaElement = document.getElementById(id);
        
        if (!schemaElement) {
            schemaElement = document.createElement('script');
            schemaElement.type = 'application/ld+json';
            schemaElement.id = id;
            document.head.appendChild(schemaElement);
        }
        
        schemaElement.textContent = JSON.stringify(schema, null, 2);
    }

    /**
     * Получение статистики для мета-описаний
     */
    getStatistics() {
        const totalDocuments = this.documentsData.length;
        const totalProtocols = this.protocolsData.reduce((sum, category) => {
            return sum + (category.competitions?.length || 0);
        }, 0);
        
        return {
            totalDocuments,
            totalProtocols,
            totalItems: totalDocuments + totalProtocols,
            categories: this.protocolsData.length,
            yearsRange: this.getYearsRange()
        };
    }

    /**
     * Получение диапазона лет соревнований
     */
    getYearsRange() {
        const years = [];
        this.protocolsData.forEach(category => {
            category.competitions?.forEach(comp => {
                if (comp.year) years.push(comp.year);
            });
        });
        
        if (years.length === 0) return '';
        
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        
        return minYear === maxYear ? `${minYear}` : `${minYear}-${maxYear}`;
    }

    /**
     * Обновление мета-тегов на основе статистики
     */
    updateMetaTags() {
        const stats = this.getStatistics();
        
        const description = `Документи ФДУ: протоколи чемпіонатів U15-U23, статути, положення про змагання. 📊 ${stats.totalItems}+ документів`;
        
        const descriptionMeta = document.querySelector('meta[name="description"]');
        if (descriptionMeta) {
            descriptionMeta.setAttribute('content', description);
        }
        
        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) {
            ogDescription.setAttribute('content', description);
        }
        
        const twitterDescription = document.querySelector('meta[name="twitter:description"]');
        if (twitterDescription) {
            twitterDescription.setAttribute('content', description);
        }
    }

    /**
     * Публичный метод для получения данных
     */
    getData() {
        return {
            documents: this.documentsData,
            protocols: this.protocolsData,
            statistics: this.getStatistics()
        };
    }
}

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentsSEOManager;
} 