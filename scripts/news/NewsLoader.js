/**
 * NewsLoader - Система ленивой загрузки новостей
 * Загружает статьи напрямую из JSON файлов без PHP
 */
class NewsLoader {
    constructor() {
        this.cache = new Map();
        this.articlesCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 минут
        this.baseUrl = 'database/articles/';
        this.loadedFiles = new Set();
        this.totalArticles = null;
    }

    /**
     * Сканирует директорию articles и находит все JSON файлы
     */
    async scanArticles() {
        const cacheKey = 'articles-scan';
        
        // Проверяем кеш
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        const articles = [];
        let fileIndex = 1;
        const maxFiles = 100; // Максимум файлов для сканирования

        // Сканируем файлы по порядку
        while (fileIndex <= maxFiles) {
            try {
                const response = await fetch(`${this.baseUrl}${fileIndex}.json`);
                if (response.ok) {
                    const article = await response.json();
                    if (this.validateArticle(article)) {
                        // Генерируем буквенный ID
                        article.slugId = this.generateSlugId(article.title);
                        articles.push({
                            id: article.id,
                            slugId: article.slugId,
                            title: article.title,
                            excerpt: article.excerpt,
                            category: article.category,
                            publishedAt: article.publishedAt,
                            featured: article.featured || false,
                            image: article.image,
                            author: article.author,
                            tags: article.tags || []
                        });
                        this.loadedFiles.add(fileIndex);
                    }
                } else if (response.status === 404) {
                    // Файл не найден, продолжаем поиск
                    fileIndex++;
                    continue;
                } else {
                    break;
                }
            } catch (error) {
                // Ошибка загрузки, пропускаем файл
                fileIndex++;
                if (fileIndex > maxFiles) break;
                continue;
            }
            fileIndex++;
        }

        // Сортируем по дате публикации
        articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        // Кешируем результат
        this.cache.set(cacheKey, {
            data: articles,
            timestamp: Date.now()
        });

        this.totalArticles = articles.length;
        return articles;
    }

    /**
     * Загружает полную статью по ID или slugId
     */
    async loadArticle(identifier) {
        const cacheKey = `article-${identifier}`;
        
        // Проверяем кеш
        if (this.articlesCache.has(cacheKey)) {
            const cached = this.articlesCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        try {
            let article = null;

            // Если это числовой ID
            if (typeof identifier === 'number' || !isNaN(identifier)) {
                const response = await fetch(`${this.baseUrl}${identifier}.json`);
                if (response.ok) {
                    article = await response.json();
                }
            } else {
                // Если это slugId, ищем по всем файлам
                const allArticles = await this.scanArticles();
                const found = allArticles.find(a => a.slugId === identifier);
                if (found) {
                    const response = await fetch(`${this.baseUrl}${found.id}.json`);
                    if (response.ok) {
                        article = await response.json();
                    }
                }
            }

            if (article && this.validateArticle(article)) {
                article.slugId = this.generateSlugId(article.title);
                
                // Кешируем
                this.articlesCache.set(cacheKey, {
                    data: article,
                    timestamp: Date.now()
                });
                
                return article;
            }
        } catch (error) {
            console.warn('Error loading article:', error);
        }

        return null;
    }

    /**
     * Загружает статьи с ленивой подгрузкой (для пагинации)
     */
    async loadArticlesBatch(offset = 0, limit = 5) {
        const allArticles = await this.scanArticles();
        return allArticles.slice(offset, offset + limit);
    }

    /**
     * Поиск статей по тексту
     */
    async searchArticles(query, categories = []) {
        const allArticles = await this.scanArticles();
        const searchQuery = query.toLowerCase();

        return allArticles.filter(article => {
            const matchesQuery = !query || 
                article.title.toLowerCase().includes(searchQuery) ||
                article.excerpt.toLowerCase().includes(searchQuery) ||
                (article.tags && article.tags.some(tag => 
                    tag.toLowerCase().includes(searchQuery)
                ));

            const matchesCategory = categories.length === 0 || 
                categories.includes(article.category);

            return matchesQuery && matchesCategory;
        });
    }

    /**
     * Получает связанные статьи
     */
    async getRelatedArticles(currentArticle, limit = 3) {
        const allArticles = await this.scanArticles();
        
        return allArticles
            .filter(article => 
                article.id !== currentArticle.id &&
                (article.category === currentArticle.category ||
                 (currentArticle.tags && article.tags && 
                  currentArticle.tags.some(tag => article.tags.includes(tag))))
            )
            .slice(0, limit);
    }

    /**
     * Генерирует slug ID из заголовка
     */
    generateSlugId(title) {
        return title
            .toLowerCase()
            .replace(/[іїєґ]/g, (match) => {
                const map = { 'і': 'i', 'ї': 'i', 'є': 'e', 'ґ': 'g' };
                return map[match];
            })
            .replace(/[^a-z0-9а-я]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    /**
     * Валидация статьи
     */
    validateArticle(article) {
        const required = ['id', 'title', 'excerpt', 'content', 'category', 'publishedAt'];
        return required.every(field => article[field] != null);
    }

    /**
     * Получает статистику
     */
    async getStats() {
        const articles = await this.scanArticles();
        const now = new Date();
        const thisMonth = articles.filter(article => {
            const date = new Date(article.publishedAt);
            return date.getMonth() === now.getMonth() && 
                   date.getFullYear() === now.getFullYear();
        });

        const categories = {};
        articles.forEach(article => {
            categories[article.category] = (categories[article.category] || 0) + 1;
        });

        return {
            total: articles.length,
            thisMonth: thisMonth.length,
            featured: articles.filter(a => a.featured).length,
            categories
        };
    }

    /**
     * Очистка кеша
     */
    clearCache() {
        this.cache.clear();
        this.articlesCache.clear();
        this.loadedFiles.clear();
    }
}

// Экспорт для использования в других модулях
if (typeof window !== 'undefined') {
    window.NewsLoader = NewsLoader;
} else if (typeof module !== 'undefined') {
    module.exports = NewsLoader;
} 