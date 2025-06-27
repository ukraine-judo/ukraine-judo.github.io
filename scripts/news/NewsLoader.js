/**
 * NewsLoader - Оптимизированная система ленивой загрузки новостей
 * Загружает статьи напрямую из JSON файлов без PHP с улучшенной производительностью
 */
class NewsLoader {
    constructor() {
        this.cache = new Map();
        this.articlesCache = new Map();
        this.cacheExpiry = 0; // Отключаем кеширование (0 = всегда свежие данные)
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
        // Отключаем кеширование - всегда создаем новый манифест
        this.manifestCache = null;

        // Если нет кеша, создаем быстрый манифест
        const manifest = {
            articles: [],
            lastUpdate: Date.now()
        };

        // Автоматически сканируем все JSON файлы в папке
        const articles = await this.scanAllArticleFiles();
        manifest.articles = articles;

        // Сортируем по дате
        manifest.articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        this.manifestCache = manifest;
        return manifest;
    }

    /**
     * Сканирует все JSON файлы статей в папке
     */
    async scanAllArticleFiles() {
        const articles = [];
        
        // Получаем список всех файлов через API или файловую систему
        const fileList = await this.getArticleFileList();
        
        if (fileList && fileList.length > 0) {
            // Загружаем метаданные всех файлов параллельно
            const loadPromises = fileList.map(fileInfo => {
                // fileInfo теперь объект с id, path, title
                return this.loadArticleMetadata(fileInfo.id, fileInfo.path);
            });

            const results = await this.batchLoad(loadPromises, 5);
            
            results.forEach(article => {
                if (article) articles.push(article);
            });
        }

        return articles;
    }

    /**
     * Получает список всех JSON файлов статей
     */
    async getArticleFileList() {
        try {
            // Пробуем получить список файлов через специальный endpoint
            const response = await this.queuedFetch('database/articles/index.json');
            if (response && response.ok) {
                const index = await response.json();
                if (index.files && Array.isArray(index.files)) {
                    // Возвращаем массив объектов с id, path и title
                    return index.files;
                }
            }
        } catch (error) {
            console.warn('Failed to load articles index, using fallback method');
        }

        // Fallback: пробуем загрузить известные файлы
        return this.getKnownArticleFiles();
    }

    /**
     * Fallback метод для получения списка файлов
     */
    async getKnownArticleFiles() {
        const knownFiles = [];
        
        // Пробуем загрузить файлы с разными именами
        const testFiles = [
            // Числовые файлы (для обратной совместимости)
            ...Array.from({length: 20}, (_, i) => ({
                id: i + 1,
                path: `${i + 1}.json`,
                title: `Статья ${i + 1}`
            })),
            // Строковые файлы
            {
                id: 'cism-world-champship',
                path: 'cism-world-champship.json',
                title: 'CISM World Championship'
            },
            {
                id: 'gontyk-master-class-kolomya',
                path: 'gontyk-master-class-kolomya.json',
                title: 'Gontyk Master Class Kolomya'
            }
        ];

        // Проверяем существование каждого файла
        const checkPromises = testFiles.map(async (fileInfo) => {
            try {
                const response = await this.queuedFetch(`database/articles/${fileInfo.path}`);
                return response.ok ? fileInfo : null;
            } catch (error) {
                return null;
            }
        });

        const results = await Promise.allSettled(checkPromises);
        
        results.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                knownFiles.push(result.value);
            }
        });

        return knownFiles;
    }

    /**
     * Загружает только метаданные статьи (без контента)
     */
    async loadArticleMetadata(fileId, path) {
        try {
            const response = await this.queuedFetch(`${this.baseUrl}${path}`);
            if (response && response.ok) {
                const article = await response.json();
                if (this.validateArticle(article)) {
                    return {
                        id: article.id || fileId, // Используем ID из файла или имя файла
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
            console.warn(`Failed to load metadata for article ${fileId}:`, error);
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
        // Используем новый метод сканирования
        return this.scanAllArticleFiles();
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

            // Сначала пробуем найти статью в индексе
            const fileList = await this.getArticleFileList();
            const fileInfo = fileList.find(file => file.id == identifier || file.id === identifier);
            
            if (fileInfo) {
                // Загружаем по пути из индекса
                const response = await this.queuedFetch(`${this.baseUrl}${fileInfo.path}`);
                if (response && response.ok) {
                    article = await response.json();
                }
            } else {
                // Fallback для обратной совместимости
                if (typeof identifier === 'number' || !isNaN(identifier)) {
                    const response = await this.queuedFetch(`${this.baseUrl}${identifier}.json`);
                    if (response && response.ok) {
                        article = await response.json();
                    }
                } else {
                    // Если это строковый ID, пробуем загрузить напрямую
                    const response = await this.queuedFetch(`${this.baseUrl}${identifier}.json`);
                    if (response && response.ok) {
                        article = await response.json();
                    } else {
                        // Если не найден, ищем по slugId в манифесте
                        const manifest = await this.createArticlesManifest();
                        const found = manifest.articles.find(a => a.slugId === identifier);
                        if (found) {
                            const foundFileInfo = fileList.find(file => file.id == found.id || file.id === found.id);
                            if (foundFileInfo) {
                                const response = await this.queuedFetch(`${this.baseUrl}${foundFileInfo.path}`);
                                if (response && response.ok) {
                                    article = await response.json();
                                }
                            }
                        }
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
                         await Promise.allSettled(preloadPromises);
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
     * Получает связанные статьи с улучшенным алгоритмом
     */
    async getRelatedArticles(currentArticle, limit = 3) {
        const manifest = await this.createArticlesManifest();
        const allArticles = manifest.articles.filter(article => article.id !== currentArticle.id);
        
        // 1. Сначала проверяем предопределенные связанные статьи
        let relatedArticles = [];
        if (currentArticle.related && Array.isArray(currentArticle.related)) {
            const predefinedRelated = allArticles.filter(article => 
                currentArticle.related.includes(article.id)
            );
            relatedArticles.push(...predefinedRelated);
        }
        
        // 2. Если недостаточно предопределенных, добавляем по алгоритму схожести
        if (relatedArticles.length < limit) {
            const remainingSlots = limit - relatedArticles.length;
            const excludeIds = new Set(relatedArticles.map(a => a.id));
            
            // Вычисляем рейтинг схожести для каждой статьи
            const scoredArticles = allArticles
                .filter(article => !excludeIds.has(article.id))
                .map(article => ({
                    article,
                    score: this.calculateSimilarityScore(currentArticle, article)
                }))
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score);
            
            // Добавляем наиболее похожие статьи
            const algorithmicRelated = scoredArticles
                .slice(0, remainingSlots)
                .map(item => item.article);
            
            relatedArticles.push(...algorithmicRelated);
        }
        
        // 3. Если все еще недостаточно, добавляем последние из той же категории
        if (relatedArticles.length < limit) {
            const remainingSlots = limit - relatedArticles.length;
            const excludeIds = new Set(relatedArticles.map(a => a.id));
            
            const categoryArticles = allArticles
            .filter(article => 
                    !excludeIds.has(article.id) && 
                    article.category === currentArticle.category
                )
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
                .slice(0, remainingSlots);
            
            relatedArticles.push(...categoryArticles);
        }
        
        return relatedArticles.slice(0, limit);
    }

    /**
     * Вычисляет рейтинг схожести между двумя статьями
     */
    calculateSimilarityScore(article1, article2) {
        let score = 0;
        
        // Совпадение категории (высокий приоритет)
        if (article1.category === article2.category) {
            score += 50;
        }
        
        // Совпадение тегов (средний приоритет)
        if (article1.tags && article2.tags) {
            const commonTags = article1.tags.filter(tag => 
                article2.tags.some(tag2 => 
                    tag.toLowerCase() === tag2.toLowerCase()
                )
            );
            score += commonTags.length * 15;
        }
        
        // Совпадение автора (низкий приоритет)
        if (article1.author && article2.author && 
            article1.author.name === article2.author.name) {
            score += 10;
        }
        
        // Близость по времени публикации (бонус для недавних статей)
        const date1 = new Date(article1.publishedAt);
        const date2 = new Date(article2.publishedAt);
        const daysDiff = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
        
        if (daysDiff <= 7) {
            score += 10;
        } else if (daysDiff <= 30) {
            score += 5;
        }
        
        // Схожесть заголовков (проверяем общие ключевые слова)
        const title1Words = article1.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const title2Words = article2.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const commonWords = title1Words.filter(word => title2Words.includes(word));
        score += commonWords.length * 8;
        
        // Популярность статьи (бонус для статей с высоким рейтингом)
        if (article2.stats) {
            const popularity = (article2.stats.views || 0) + (article2.stats.likes || 0) * 2;
            if (popularity > 1000) {
                score += 5;
            }
        }
        
        return score;
    }

    /**
     * Предлагает связанные статьи для редактирования (для админ-панели)
     */
    async suggestRelatedArticles(currentArticle, limit = 10) {
        const manifest = await this.createArticlesManifest();
        const allArticles = manifest.articles.filter(article => article.id !== currentArticle.id);
        
        // Вычисляем рейтинг схожести для всех статей
        const scoredArticles = allArticles
            .map(article => ({
                article,
                score: this.calculateSimilarityScore(currentArticle, article),
                reasons: this.getSimilarityReasons(currentArticle, article)
            }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
        
        return scoredArticles;
    }

    /**
     * Получает причины схожести статей (для отладки и пояснений)
     */
    getSimilarityReasons(article1, article2) {
        const reasons = [];
        
        if (article1.category === article2.category) {
            reasons.push(`Одна категория: ${article1.category}`);
        }
        
        if (article1.tags && article2.tags) {
            const commonTags = article1.tags.filter(tag => 
                article2.tags.some(tag2 => tag.toLowerCase() === tag2.toLowerCase())
            );
            if (commonTags.length > 0) {
                reasons.push(`Общие теги: ${commonTags.join(', ')}`);
            }
        }
        
        if (article1.author && article2.author && 
            article1.author.name === article2.author.name) {
            reasons.push(`Тот же автор: ${article1.author.name}`);
        }
        
        const date1 = new Date(article1.publishedAt);
        const date2 = new Date(article2.publishedAt);
        const daysDiff = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
        
        if (daysDiff <= 7) {
            reasons.push('Опубликованы в течение недели');
        } else if (daysDiff <= 30) {
            reasons.push('Опубликованы в течение месяца');
        }
        
        const title1Words = article1.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const title2Words = article2.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const commonWords = title1Words.filter(word => title2Words.includes(word));
        if (commonWords.length > 0) {
            reasons.push(`Общие слова в заголовке: ${commonWords.join(', ')}`);
        }
        
        return reasons;
    }

    /**
     * Автоматически обновляет поле related для статьи
     */
    async autoUpdateRelatedArticles(articleId, limit = 5) {
        try {
            const article = await this.loadArticle(articleId);
            if (!article) {
                throw new Error(`Article ${articleId} not found`);
            }
            
            const suggestions = await this.suggestRelatedArticles(article, limit);
            const relatedIds = suggestions.map(item => item.article.id);
            
            return {
                currentRelated: article.related || [],
                suggestedRelated: relatedIds,
                suggestions: suggestions.map(item => ({
                    id: item.article.id,
                    title: item.article.title,
                    score: item.score,
                    reasons: item.reasons
                }))
            };
        } catch (error) {
            console.error('Failed to auto-update related articles:', error);
            throw error;
        }
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

    /**
     * Принудительно обновляет манифест статей
     */
    async refreshManifest() {
        this.manifestCache = null;
        const keys = Object.keys(localStorage);
        keys.filter(key => key.startsWith('fju_news_articles-manifest')).forEach(key => {
            localStorage.removeItem(key);
        });
        return await this.createArticlesManifest();
    }
}

// Экспорт для использования в других модулях
if (typeof window !== 'undefined') {
    window.NewsLoader = NewsLoader;
} else if (typeof module !== 'undefined') {
    module.exports = NewsLoader;
} 