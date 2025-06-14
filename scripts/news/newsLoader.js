/**
 * News Loader Module
 * Завантажує статті з окремих JSON файлів
 */

class NewsLoader {
    constructor() {
        this.articlesCache = new Map();
        this.articlesListCache = null;
        this.cacheExpiry = 5 * 60 * 1000; // 5 хвилин
    }

    /**
     * Завантажує список всіх статей
     */
    async loadArticlesList() {
        try {
            // Перевіряємо кеш
            if (this.articlesListCache && 
                Date.now() - this.articlesListCache.timestamp < this.cacheExpiry) {
                return this.articlesListCache.data;
            }

            // Автоматично знаходимо всі JSON файли в папці articles
            const articles = [];
            const articleIds = await this.discoverArticleFiles();
            
            if (articleIds.length === 0) {
                console.warn('Не знайдено жодного файлу статей');
                return [];
            }

            // Завантажуємо всі знайдені статті
            const loadPromises = articleIds.map(id => this.loadArticle(id));
            const loadedArticles = await Promise.all(loadPromises);
            
            // Фільтруємо успішно завантажені статті
            loadedArticles.forEach(article => {
                if (article) {
                    articles.push(article);
                }
            });

            // Сортуємо за датою публікації (найновіші спочатку)
            articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

            // Кешуємо результат
            this.articlesListCache = {
                data: articles,
                timestamp: Date.now()
            };

            return articles;
        } catch (error) {
            console.error('Помилка завантаження списку статей:', error);
            return [];
        }
    }

    /**
     * Автоматично знаходить всі файли статей в папці
     */
    async discoverArticleFiles() {
        try {
            // Спробуємо завантажити файли з ID від 1 до 20 (або більше за потреби)
            const maxId = 50; // Максимальний ID для пошуку
            const foundIds = [];
            
            // Перевіряємо існування файлів паралельно
            const checkPromises = [];
            for (let id = 1; id <= maxId; id++) {
                checkPromises.push(this.checkArticleExists(id));
            }
            
            const results = await Promise.all(checkPromises);
            
            // Збираємо ID існуючих файлів
            results.forEach((exists, index) => {
                if (exists) {
                    foundIds.push(index + 1);
                }
            });
            
            console.log(`Знайдено ${foundIds.length} файлів статей:`, foundIds);
            return foundIds;
        } catch (error) {
            console.error('Помилка пошуку файлів статей:', error);
            // Fallback до старого методу
            return [1, 2, 3, 4, 5, 6, 7];
        }
    }

    /**
     * Перевіряє чи існує файл статті з вказаним ID
     */
    async checkArticleExists(id) {
        try {
            const response = await fetch(`scripts/news/articles/${id}.json`, {
                method: 'HEAD' // Використовуємо HEAD для швидкої перевірки
            });
            return response.ok;
        } catch (error) {
            // Якщо HEAD не підтримується, спробуємо GET
            try {
                const response = await fetch(`scripts/news/articles/${id}.json`);
                return response.ok;
            } catch (getError) {
                return false;
            }
        }
    }

    /**
     * Завантажує окрему статтю за ID
     */
    async loadArticle(id) {
        try {
            // Перевіряємо кеш
            const cacheKey = `article_${id}`;
            if (this.articlesCache.has(cacheKey)) {
                const cached = this.articlesCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheExpiry) {
                    return cached.data;
                }
            }

            // Завантажуємо з файлу
            const response = await fetch(`scripts/news/articles/${id}.json`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`Стаття з ID ${id} не знайдена`);
                    return null;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const article = await response.json();
            
            // Валідація структури статті
            if (!this.validateArticle(article)) {
                console.error(`Невірна структура статті ${id}`);
                return null;
            }

            // Кешуємо статтю
            this.articlesCache.set(cacheKey, {
                data: article,
                timestamp: Date.now()
            });

            return article;
        } catch (error) {
            console.error(`Помилка завантаження статті ${id}:`, error);
            return null;
        }
    }

    /**
     * Валідація структури статті
     */
    validateArticle(article) {
        const requiredFields = ['id', 'title', 'excerpt', 'content', 'category', 'publishedAt'];
        
        for (const field of requiredFields) {
            if (!article.hasOwnProperty(field) || article[field] === null || article[field] === undefined) {
                console.error(`Відсутнє обов'язкове поле: ${field}`);
                return false;
            }
        }

        // Перевіряємо валідність дати
        if (isNaN(Date.parse(article.publishedAt))) {
            console.error('Невірний формат дати publishedAt');
            return false;
        }

        return true;
    }

    /**
     * Фільтрує статті за категорією
     */
    async getArticlesByCategory(category) {
        const articles = await this.loadArticlesList();
        
        if (category === 'all') {
            return articles;
        }
        
        return articles.filter(article => article.category === category);
    }

    /**
     * Отримує рекомендовані статті для конкретної статті
     */
    async getRelatedArticles(articleId, limit = 3) {
        try {
            const currentArticle = await this.loadArticle(articleId);
            if (!currentArticle || !currentArticle.related) {
                return [];
            }

            const relatedPromises = currentArticle.related.map(id => this.loadArticle(id));
            const relatedArticles = await Promise.all(relatedPromises);
            
            return relatedArticles
                .filter(article => article !== null)
                .slice(0, limit);
        } catch (error) {
            console.error('Помилка завантаження пов\'язаних статей:', error);
            return [];
        }
    }

    /**
     * Отримує останні статті
     */
    async getRecentArticles(limit = 5) {
        const articles = await this.loadArticlesList();
        return articles.slice(0, limit);
    }

    /**
     * Отримує рекомендовані статті
     */
    async getFeaturedArticles() {
        const articles = await this.loadArticlesList();
        return articles.filter(article => article.featured === true);
    }

    /**
     * Пошук статей за ключовими словами
     */
    async searchArticles(query) {
        const articles = await this.loadArticlesList();
        const searchTerm = query.toLowerCase();
        
        return articles.filter(article => {
            return article.title.toLowerCase().includes(searchTerm) ||
                   article.excerpt.toLowerCase().includes(searchTerm) ||
                   article.content.toLowerCase().includes(searchTerm) ||
                   (article.tags && article.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
        });
    }

    /**
     * Оновлює статистику статті
     */
    async updateArticleStats(articleId, statType) {
        try {
            // В реальному додатку тут був би API запит
            // Поки що просто оновлюємо локально
            const article = await this.loadArticle(articleId);
            if (article && article.stats) {
                switch (statType) {
                    case 'view':
                        article.stats.views = (article.stats.views || 0) + 1;
                        break;
                    case 'like':
                        article.stats.likes = (article.stats.likes || 0) + 1;
                        break;
                    case 'share':
                        article.stats.shares = (article.stats.shares || 0) + 1;
                        break;
                }
                
                // Оновлюємо кеш
                const cacheKey = `article_${articleId}`;
                this.articlesCache.set(cacheKey, {
                    data: article,
                    timestamp: Date.now()
                });
            }
            
            return article;
        } catch (error) {
            console.error('Помилка оновлення статистики:', error);
            return null;
        }
    }

    /**
     * Очищає кеш
     */
    clearCache() {
        this.articlesCache.clear();
        this.articlesListCache = null;
    }
}

// Експортуємо екземпляр класу
window.newsLoader = new NewsLoader(); 