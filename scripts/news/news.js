/**
 * Оптимизированная система новостей для главной страницы
 * Быстрая загрузка с кешированием и предзагрузкой
 */

// Инициализация системы новостей на главной странице
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем что мы на главной странице
    if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
        initOptimizedNewsSlider();
    }
});

/**
 * Оптимизированная инициализация слайдера новостей
 */
async function initOptimizedNewsSlider() {
    try {
        const newsSlider = document.querySelector('.news-slider-container');
        if (!newsSlider) return;

        // Показываем скелетон загрузки
        showNewsLoadingSkeleton();

        // Создаем оптимизированный загрузчик
        const loader = new OptimizedNewsLoader();
        
        // Загружаем последние 5 новостей для слайдера
        const latestNews = await loader.getLatestNews(5);
        
        if (latestNews && latestNews.length > 0) {
            renderNewsSlider(latestNews);
            setupNewsSliderEvents();
            
            // Предзагружаем полные статьи в фоне
            loader.preloadArticlesInBackground(latestNews.slice(0, 3));
        } else {
            showNewsError();
        }

    } catch (error) {
        console.error('Failed to initialize news slider:', error);
        showNewsError();
    }
}

/**
 * Оптимизированный загрузчик новостей
 */
class OptimizedNewsLoader {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 15 * 60 * 1000; // 15 минут
        this.baseUrl = 'database/articles/';
        this.isOnline = navigator.onLine;
        
        // Слушаем изменения сетевого статуса
        window.addEventListener('online', () => this.isOnline = true);
        window.addEventListener('offline', () => this.isOnline = false);
    }

    /**
     * Получает последние новости с агрессивным кешированием
     */
    async getLatestNews(limit = 5) {
        const cacheKey = `latest-news-${limit}`;
        
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

        // Если офлайн и есть кеш - используем его даже если устарел
        if (!this.isOnline && cachedData) {
            return cachedData.data;
        }

        try {
            // Быстрая загрузка только необходимых данных
            const news = await this.loadNewsMetadata(limit);
            
            // Кешируем результат
            const cacheData = {
                data: news,
                timestamp: Date.now()
            };
            
            this.cache.set(cacheKey, cacheData);
            this.saveToLocalStorage(cacheKey, cacheData);
            
            return news;
        } catch (error) {
            console.warn('Failed to load latest news:', error);
            
            // Возвращаем устаревший кеш если есть
            if (cachedData) {
                return cachedData.data;
            }
            
            // Возвращаем заглушку
            return this.getFallbackNews();
        }
    }

    /**
     * Загружает метаданные новостей (только для отображения в слайдере)
     */
    async loadNewsMetadata(limit) {
        const news = [];
        const maxAttempts = Math.min(limit * 2, 15); // Ограничиваем количество попыток
        
        // Загружаем параллельно несколько файлов
        const loadPromises = [];
        for (let i = 1; i <= maxAttempts && news.length < limit; i++) {
            loadPromises.push(this.loadSingleNewsMetadata(i));
        }

        // Выполняем запросы пакетами по 3
        const batchSize = 3;
        for (let i = 0; i < loadPromises.length && news.length < limit; i += batchSize) {
            const batch = loadPromises.slice(i, i + batchSize);
            const results = await Promise.allSettled(batch);
            
            results.forEach(result => {
                if (result.status === 'fulfilled' && result.value && news.length < limit) {
                    news.push(result.value);
                }
            });
        }

        // Сортируем по дате
        news.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        
        return news.slice(0, limit);
    }

    /**
     * Загружает метаданные одной новости
     */
    async loadSingleNewsMetadata(id) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд timeout

            const response = await fetch(`${this.baseUrl}${id}.json`, {
                signal: controller.signal,
                cache: 'force-cache' // Используем браузерный кеш
            });

            clearTimeout(timeoutId);

            if (!response.ok) return null;

            const article = await response.json();
            
            if (!this.validateArticle(article)) return null;

            // Возвращаем только необходимые для слайдера данные
            return {
                id: article.id,
                title: article.title,
                excerpt: this.truncateText(article.excerpt, 120),
                category: article.category,
                publishedAt: article.publishedAt,
                image: this.optimizeImageUrl(article.image),
                readingTime: this.calculateReadingTime(article.content || article.excerpt),
                slug: this.generateSlug(article.title)
            };

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.warn(`Failed to load news ${id}:`, error);
            }
            return null;
        }
    }

    /**
     * Предзагружает полные статьи в фоне
     */
    preloadArticlesInBackground(articles) {
        if (!articles || !this.isOnline) return;

        // Откладываем предзагрузку на 500мс чтобы не блокировать UI
        setTimeout(async () => {
            for (const article of articles.slice(0, 2)) { // Предзагружаем только первые 2
                try {
                    await this.loadFullArticle(article.id);
                } catch (error) {
                    // Игнорируем ошибки предзагрузки
                }
            }
        }, 500);
    }

    /**
     * Загружает полную статью (с кешированием)
     */
    async loadFullArticle(id) {
        const cacheKey = `full-article-${id}`;
        
        // Проверяем кеш
        const cached = this.getFromLocalStorage(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }

        try {
            const response = await fetch(`${this.baseUrl}${id}.json`);
            if (!response.ok) return null;

            const article = await response.json();
            
            // Кешируем полную статью
            this.saveToLocalStorage(cacheKey, {
                data: article,
                timestamp: Date.now()
            });

            return article;
        } catch (error) {
            console.warn(`Failed to preload article ${id}:`, error);
            return null;
        }
    }

    /**
     * Заглушки при ошибке загрузки
     */
    getFallbackNews() {
        return [
            {
                id: 'fallback-1',
                title: 'Чемпіонат України з дзюдо 2024',
                excerpt: 'Останні результати та найяскравіші моменти національного чемпіонату з дзюдо.',
                category: 'competitions',
                publishedAt: new Date().toISOString(),
                image: 'https://images.unsplash.com/photo-1544623280-6ba3e50d2f24?w=400&h=250&fit=crop',
                readingTime: 3
            },
            {
                id: 'fallback-2',
                title: 'Нові перемоги української збірної',
                excerpt: 'Наші спортсмени продовжують здобувати медалі на міжнародних турнірах.',
                category: 'achievements',
                publishedAt: new Date(Date.now() - 86400000).toISOString(),
                image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=250&fit=crop',
                readingTime: 2
            }
        ];
    }

    // Утилиты
    validateArticle(article) {
        return article && article.id && article.title && article.publishedAt;
    }

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substr(0, maxLength).trim() + '...';
    }

    calculateReadingTime(content) {
        if (!content) return 1;
        const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
        return Math.max(1, Math.ceil(words / 200));
    }

    generateSlug(title) {
        return title.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
    }

    optimizeImageUrl(image) {
        if (!image) return '';
        
        // Если это объект с url
        if (typeof image === 'object' && image.url) {
            return image.url;
        }
        
        // Если это строка
        if (typeof image === 'string') {
            return image;
        }
        
        return '';
    }

    getCategoryInfo(category) {
        const categories = {
            'achievements': { name: 'Досягнення', color: '#28a745' },
            'competitions': { name: 'Змагання', color: '#007bff' },
            'events': { name: 'Події', color: '#6f42c1' },
            'announcements': { name: 'Анонси', color: '#fd7e14' }
        };
        return categories[category] || { name: 'Новини', color: '#6c757d' };
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const months = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
        return `${date.getDate()} ${months[date.getMonth()]}`;
    }

    // localStorage utilities
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(`fju_home_${key}`, JSON.stringify(data));
        } catch (error) {
            console.warn('localStorage save failed:', error);
        }
    }

    getFromLocalStorage(key) {
        try {
            const item = localStorage.getItem(`fju_home_${key}`);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.warn('localStorage read failed:', error);
            return null;
        }
    }
}

/**
 * Показывает скелетон загрузки
 */
function showNewsLoadingSkeleton() {
    const container = document.querySelector('.news-slider-container');
    if (!container) return;

    container.innerHTML = `
        <div class="news-loading-skeleton">
            ${Array(3).fill(0).map(() => `
                <div class="news-card-skeleton">
                    <div class="skeleton-image"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-category"></div>
                        <div class="skeleton-title"></div>
                        <div class="skeleton-excerpt"></div>
                        <div class="skeleton-link"></div>
                    </div>
                </div>
            `).join('')}
        </div>
        <style>
            .news-loading-skeleton {
                display: flex;
                gap: 2rem;
                overflow: hidden;
            }
            .news-card-skeleton {
                min-width: 300px;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .skeleton-image {
                height: 200px;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: skeleton-loading 1.5s infinite;
            }
            .skeleton-content {
                padding: 1.5rem;
            }
            .skeleton-category, .skeleton-title, .skeleton-excerpt, .skeleton-link {
                height: 1rem;
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: skeleton-loading 1.5s infinite;
                border-radius: 4px;
                margin-bottom: 0.5rem;
            }
            .skeleton-category { width: 30%; height: 0.8rem; }
            .skeleton-title { width: 90%; height: 1.2rem; }
            .skeleton-excerpt { width: 100%; }
            .skeleton-link { width: 40%; }
            @keyframes skeleton-loading {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        </style>
    `;
}

/**
 * Рендерит слайдер новостей
 */
function renderNewsSlider(news) {
    const container = document.querySelector('.news-slider-container');
    if (!container) return;

    const loader = new OptimizedNewsLoader();
    
    let html = '';
    
    news.forEach((article, index) => {
        const categoryInfo = loader.getCategoryInfo(article.category);
        const isActive = index === 0 ? 'active' : '';
        
        html += `
            <div class="news-card ${isActive}">
                <div class="news-card-image">
                    <img src="${article.image}" alt="${article.title}" loading="${index === 0 ? 'eager' : 'lazy'}">
                    <div class="news-card-date">${loader.formatDate(article.publishedAt)}</div>
                </div>
                <div class="news-card-content">
                    <span class="news-card-category" style="color: ${categoryInfo.color};">
                        ${categoryInfo.name}
                    </span>
                    <h3 class="news-card-title">${article.title}</h3>
                    <p class="news-card-excerpt">${article.excerpt}</p>
                    <a href="news-article.html?id=${article.id}" class="news-card-link">Читати далі</a>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Обновляем dots если есть
    updateNewsDots(news.length);
}

/**
 * Обновляет индикаторы слайдера
 */
function updateNewsDots(count) {
    const dotsContainer = document.querySelector('.news-slider-dots');
    if (!dotsContainer) return;

    let dotsHtml = '';
    for (let i = 0; i < count; i++) {
        const activeClass = i === 0 ? 'active' : '';
        dotsHtml += `<span class="dot ${activeClass}" data-slide="${i}"></span>`;
    }
    
    dotsContainer.innerHTML = dotsHtml;
}

/**
 * Настраивает события слайдера
 */
function setupNewsSliderEvents() {
    // Инициализируем существующий слайдер если есть
    if (typeof initSlider === 'function') {
        setTimeout(initSlider, 100);
    }
}

/**
 * Показывает ошибку загрузки
 */
function showNewsError() {
    const container = document.querySelector('.news-slider-container');
    if (!container) return;

    container.innerHTML = `
        <div class="news-error" style="
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            text-align: center;
            color: #666;
            flex-direction: column;
            gap: 1rem;
        ">
            <div style="font-size: 3rem;">📰</div>
            <h3>Не вдалося завантажити новини</h3>
            <p>Перевірте підключення до інтернету та оновіть сторінку</p>
            <button onclick="location.reload()" style="
                padding: 0.5rem 1rem;
                background: var(--primary-color);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
            ">Оновити</button>
        </div>
    `;
}

// Экспортируем для глобального использования
window.OptimizedNewsLoader = OptimizedNewsLoader; 