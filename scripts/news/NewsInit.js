/**
 * NewsInit - Инициализация системы новостей
 * Определяет тип страницы и запускает нужный компонент
 */
class NewsInit {
    constructor() {
        this.components = {
            manager: null,
            article: null
        };
    }

    /**
     * Автоматическая инициализация при загрузке DOM
     */
    init() {
        // Определяем тип страницы
        const pageType = this.detectPageType();
        
        switch (pageType) {
            case 'news-list':
                this.initNewsManager();
                break;
            case 'news-article':
                this.initNewsArticle();
                break;
            case 'home':
                this.initHomeNews();
                break;
            default:
                console.log('News system not needed on this page');
        }
    }

    /**
     * Определяет тип страницы
     */
    detectPageType() {
        // Проверяем наличие элементов для определения типа страницы
        if (document.querySelector('.main-articles') && !document.querySelector('.article-page')) {
            return 'news-list';
        }
        
        if (document.querySelector('.article-page')) {
            return 'news-article';
        }
        
        if (document.querySelector('.news-section') && window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            return 'home';
        }
        
        return 'unknown';
    }

    /**
     * Инициализация страницы списка новостей
     */
    async initNewsManager() {
        try {
            this.components.manager = new NewsManager();
            window.newsManager = this.components.manager; // Экспортируем для onclick обработчиков
            await this.components.manager.init();
            console.log('News Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize News Manager:', error);
        }
    }

    /**
     * Инициализация страницы отдельной статьи
     */
    async initNewsArticle() {
        try {
            this.components.article = new NewsArticle();
            await this.components.article.init();
            console.log('News Article initialized successfully');
        } catch (error) {
            console.error('Failed to initialize News Article:', error);
        }
    }

    /**
     * Инициализация новостей на главной странице
     */
    async initHomeNews() {
        try {
            // Простая загрузка новостей для главной страницы
            const loader = new NewsLoader();
            const latestNews = await loader.loadArticlesBatch(0, 3);
            
            if (latestNews.length > 0) {
                this.renderHomeNews(latestNews);
            }
            
            console.log('Home News initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Home News:', error);
        }
    }

    /**
     * Рендер новостей на главной странице
     */
    renderHomeNews(news) {
        const container = document.querySelector('.news-slider-container');
        if (!container) return;

        container.innerHTML = news.map(article => `
            <div class="news-card">
                <div class="news-card-image">
                    <img src="${article.image?.url || article.image}" alt="${article.title}">
                    <div class="news-card-date">${this.formatShortDate(article.publishedAt)}</div>
                </div>
                <div class="news-card-content">
                    <span class="news-card-category">${this.getCategoryName(article.category)}</span>
                    <h3 class="news-card-title">${article.title}</h3>
                    <p class="news-card-excerpt">${article.excerpt}</p>
                    <a href="news-article.html?id=${article.slugId}" class="news-card-link">Читати далі</a>
                </div>
            </div>
        `).join('');
    }

    /**
     * Форматирование короткой даты
     */
    formatShortDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'short'
        });
    }

    /**
     * Название категории
     */
    getCategoryName(category) {
        const categories = {
            'achievements': 'Досягнення',
            'competitions': 'Змагання',
            'events': 'Події',
            'announcements': 'Анонси'
        };
        return categories[category] || category;
    }

    /**
     * Получить компонент
     */
    getComponent(type) {
        return this.components[type];
    }

    /**
     * Очистка ресурсов
     */
    destroy() {
        if (this.components.manager) {
            this.components.manager.loader.clearCache();
            this.components.manager = null;
            window.newsManager = null; // Очищаем глобальную ссылку
        }
        
        if (this.components.article) {
            this.components.article.loader.clearCache();
            this.components.article = null;
        }
    }
}

// Автоматическая инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.newsSystem = new NewsInit();
    window.newsSystem.init();
});

// Экспорт для глобального использования
if (typeof window !== 'undefined') {
    window.NewsInit = NewsInit;
} 