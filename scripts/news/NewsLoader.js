/**
 * NewsLoader - Оптимизированная система ленивой загрузки новостей
 * Загружает статьи напрямую из JSON файлов без PHP с улучшенной производительностью
 */
class NewsLoader {
    constructor() {
        this.cache = new Map();
        this.articlesCache = new Map();
        this.cacheExpiry = 10 * 60 * 1000; // 10 минут (увеличил время кеширования)
        this.baseUrl = 'database/articles/';
        this.loadedFiles = new Set();
        this.totalArticles = null;
        
        // Оптимизации для производительности
        this.isLoading = false;
        this.loadQueue = [];
        this.preloadedArticles = new Map();
        this.maxConcurrentRequests = 3; // Ограничиваем количество одновременных запросов
        this.requestQueue = [];
        this.activeRequests = 0;
        
        // Создаем индекс статей для быстрого поиска
        this.articlesIndex = null;
        this.manifestCache = null;
    }

    /**
     * Создает манифест статей для быстрого доступа
     */
    async createArticlesManifest() {
        if (this.manifestCache) {
            return this.manifestCache;
        }

        const cacheKey = 'articles-manifest';
        
        // Проверяем localStorage
        const cachedManifest = this.getFromLocalStorage(cacheKey);
        if (cachedManifest && Date.now() - cachedManifest.timestamp < this.cacheExpiry) {
            this.manifestCache = cachedManifest.data;
            return this.manifestCache;
        }

        // Если нет кеша, создаем быстрый манифест
        const manifest = {
            articles: [],
            lastUpdate: Date.now()
        };

        // Пробуем загрузить первые 20 статей с минимальными данными
        const maxFiles = 20;
        const loadPromises = [];

        for (let i = 1; i <= maxFiles; i++) {
            loadPromises.push(this.loadArticleMetadata(i));
        }

        // Загружаем параллельно, но с ограничением
        const results = await this.batchLoad(loadPromises, 5);
        
        results.forEach(article => {
            if (article) manifest.articles.push(article);
        });

        // Сортируем по дате
        manifest.articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        // Сохраняем в localStorage
        this.saveToLocalStorage(cacheKey, {
            data: manifest,
            timestamp: Date.now()
        });

        this.manifestCache = manifest;
        return manifest;
    }

    /**
     * Загружает только метаданные статьи (без контента)
     */
    async loadArticleMetadata(fileIndex) {
        try {
            const response = await this.queuedFetch(`${this.baseUrl}${fileIndex}.json`);
            if (response && response.ok) {
                const article = await response.json();
                if (this.validateArticle(article)) {
                    return {
                        id: article.id,
                        slugId: this.generateSlugId(article.title),
                        title: article.title,
                        excerpt: article.excerpt,
                        category: article.category,
                        publishedAt: article.publishedAt,
                        featured: article.featured || false,
                        image: article.image,
                        author: article.author,
                        tags: article.tags || [],
                        readingTime: this.calculateReadingTime(article.excerpt)
                    };
                }
            }
        } catch (error) {
            console.warn(`Failed to load metadata for article ${fileIndex}:`, error);
        }
        return null;
    }

    /**
     * Оптимизированное сканирование статей
     */
    async scanArticles() {
        const cacheKey = 'articles-scan-v2';
        
        // Проверяем кеш в памяти
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        // Проверяем localStorage
        const cachedData = this.getFromLocalStorage(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < this.cacheExpiry) {
            this.cache.set(cacheKey, cachedData);
            return cachedData.data;
        }

        // Используем манифест если доступен
        const manifest = await this.createArticlesManifest();
        if (manifest && manifest.articles.length > 0) {
            const cachedResult = {
                data: manifest.articles,
                timestamp: Date.now()
            };
            
            this.cache.set(cacheKey, cachedResult);
            this.saveToLocalStorage(cacheKey, cachedResult);
            return manifest.articles;
        }

        // Fallback к старому методу если манифест не работает
        return this.scanArticlesLegacy();
    }

    /**
     * Старый метод сканирования (fallback)
     */
    async scanArticlesLegacy() {
        const articles = [];
        let fileIndex = 1;
        const maxFiles = 50; // Уменьшил лимит для лучшей производительности

        // Загружаем статьи пакетами
        const batchSize = 5;
        
        while (fileIndex <= maxFiles) {
            const batch = [];
            
            for (let i = 0; i < batchSize && fileIndex <= maxFiles; i++, fileIndex++) {
                batch.push(this.loadArticleMetadata(fileIndex));
            }

            const batchResults = await this.batchLoad(batch, 3);
            batchResults.forEach(article => {
                if (article) articles.push(article);
            });

            // Прерываем если нашли несколько файлов подряд которых нет
            if (batchResults.every(result => result === null)) {
                break;
            }
        }

        // Сортируем по дате публикации
        articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        return articles;
    }

    /**
     * Загружает статьи пакетами с ограничением одновременных запросов  
     */
    async batchLoad(promises, concurrency = 3) {
        const results = [];
        
        for (let i = 0; i < promises.length; i += concurrency) {
            const batch = promises.slice(i, i + concurrency);
            const batchResults = await Promise.allSettled(batch);
            
            batchResults.forEach(result => {
                results.push(result.status === 'fulfilled' ? result.value : null);
            });
        }
        
        return results;
    }

    /**
     * Очередь для ограничения одновременных запросов
     */
    async queuedFetch(url, options = {}) {
        return new Promise((resolve, reject) => {
            const request = {
                url,
                options: {
                    ...options,
                    signal: AbortSignal.timeout(10000) // 10 секунд timeout
                },
                resolve,
                reject
            };

            this.requestQueue.push(request);
            this.processQueue();
        });
    }

    /**
     * Обработка очереди запросов
     */
    async processQueue() {
        if (this.activeRequests >= this.maxConcurrentRequests || this.requestQueue.length === 0) {
            return;
        }

        const request = this.requestQueue.shift();
        this.activeRequests++;

        try {
            const response = await fetch(request.url, request.options);
            request.resolve(response);
        } catch (error) {
            request.reject(error);
        } finally {
            this.activeRequests--;
            this.processQueue(); // Обрабатываем следующий запрос
        }
    }

    /**
     * Оптимизированная загрузка полной статьи
     */
    async loadArticle(identifier) {
        const cacheKey = `article-${identifier}`;
        
        // Проверяем кеш в памяти
        if (this.articlesCache.has(cacheKey)) {
            const cached = this.articlesCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        // Проверяем localStorage
        const cachedArticle = this.getFromLocalStorage(cacheKey);
        if (cachedArticle && Date.now() - cachedArticle.timestamp < this.cacheExpiry) {
            this.articlesCache.set(cacheKey, cachedArticle);
            return cachedArticle.data;
        }

        try {
            let article = null;

            // Если это числовой ID
            if (typeof identifier === 'number' || !isNaN(identifier)) {
                const response = await this.queuedFetch(`${this.baseUrl}${identifier}.json`);
                if (response && response.ok) {
                    article = await response.json();
                }
            } else {
                // Если это slugId, используем манифест для быстрого поиска
                const manifest = await this.createArticlesManifest();
                const found = manifest.articles.find(a => a.slugId === identifier);
                if (found) {
                    const response = await this.queuedFetch(`${this.baseUrl}${found.id}.json`);
                    if (response && response.ok) {
                        article = await response.json();
                    }
                }
            }

            if (article && this.validateArticle(article)) {
                article.slugId = this.generateSlugId(article.title);
                article.readingTime = this.calculateReadingTime(article.content);
                
                // Кешируем в память и localStorage
                const cacheData = {
                    data: article,
                    timestamp: Date.now()
                };
                
                this.articlesCache.set(cacheKey, cacheData);
                this.saveToLocalStorage(cacheKey, cacheData);
                
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
        const manifest = await this.createArticlesManifest();
        return manifest.articles.slice(offset, offset + limit);
    }

    /**
     * Предзагрузка статей для улучшения UX
     */
    async preloadArticles(articles, priority = 'low') {
        if (!articles || articles.length === 0) return;

        const preloadPromises = articles.slice(0, 3).map(async (article) => {
            if (!this.preloadedArticles.has(article.id)) {
                try {
                    this.preloadedArticles.set(article.id, 'loading');
                    const fullArticle = await this.loadArticle(article.id);
                    this.preloadedArticles.set(article.id, fullArticle);
                } catch (error) {
                    this.preloadedArticles.delete(article.id);
                }
            }
        });

        // Выполняем предзагрузку в фоне
        if (priority === 'low') {
            setTimeout(() => Promise.allSettled(preloadPromises), 100);
        } else {
            await Promise.allSetled(preloadPromises);
        }
    }

    /**
     * Оптимизированный поиск статей
     */
    async searchArticles(query, categories = []) {
        const manifest = await this.createArticlesManifest();
        const searchQuery = query.toLowerCase().trim();

        if (!searchQuery && categories.length === 0) {
            return manifest.articles;
        }

        return manifest.articles.filter(article => {
            const matchesQuery = !searchQuery || 
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
        const manifest = await this.createArticlesManifest();
        
        return manifest.articles
            .filter(article => 
                article.id !== currentArticle.id &&
                (article.category === currentArticle.category ||
                 (currentArticle.tags && article.tags && 
                  currentArticle.tags.some(tag => article.tags.includes(tag))))
            )
            .slice(0, limit);
    }

    calculateReadingTime(text) {
        if (!text) return 1;
        const wordsPerMinute = 200;
        const cleanText = text.replace(/<[^>]*>/g, ''); // Remove HTML tags
        const wordCount = cleanText.split(/\s+/).filter(word => word.length > 0).length;
        return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    }

    // localStorage utilities
    saveToLocalStorage(key, data) {
        try {
            // Проверяем размер localStorage и очищаем старые данные если нужно
            if (localStorage.length > 50) {
                this.cleanupOldCache();
            }
            localStorage.setItem(`fju_news_${key}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.warn('localStorage save failed:', error);
            // Пробуем очистить кеш и повторить
            this.cleanupOldCache();
            try {
                localStorage.setItem(`fju_news_${key}`, JSON.stringify(data));
                return true;
            } catch (secondError) {
                console.warn('localStorage save failed even after cleanup:', secondError);
                return false;
            }
        }
    }

    getFromLocalStorage(key) {
        try {
            const item = localStorage.getItem(`fju_news_${key}`);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.warn('localStorage read failed:', error);
            return null;
        }
    }

    cleanupOldCache() {
        try {
            const keys = Object.keys(localStorage);
            const fjuKeys = keys.filter(key => key.startsWith('fju_news_'));
            
            // Удаляем старые ключи (старше 24 часов)
            const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
            
            fjuKeys.forEach(key => {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data && data.timestamp && data.timestamp < dayAgo) {
                        localStorage.removeItem(key);
                    }
                } catch (error) {
                    // Удаляем поврежденные записи
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.warn('Cache cleanup failed:', error);
        }
    }

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

    validateArticle(article) {
        return article && 
               article.id && 
               article.title && 
               article.publishedAt &&
               article.category;
    }

    async getStats() {
        const manifest = await this.createArticlesManifest();
        const articles = manifest.articles;
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

    clearCache() {
        this.cache.clear();
        this.articlesCache.clear();
        this.loadedFiles.clear();
        this.preloadedArticles.clear();
        this.manifestCache = null;
        
        // Очищаем localStorage кеш
        try {
            const keys = Object.keys(localStorage);
            keys.filter(key => key.startsWith('fju_news_')).forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (error) {
            console.warn('Failed to clear localStorage cache:', error);
        }
    }
}

// Экспорт для использования в других модулях
if (typeof window !== 'undefined') {
    window.NewsLoader = NewsLoader;
} else if (typeof module !== 'undefined') {
    module.exports = NewsLoader;
} 