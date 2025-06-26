/**
 * NewsArticle - Отображение отдельной статьи новости
 * Отвечает за загрузку и рендеринг полной статьи
 */
class NewsArticle {
    constructor() {
        this.loader = new NewsLoader();
        this.article = null;
        this.currentId = null;
        
        // Элементы страницы
        this.container = document.querySelector('.article-page');
        this.loadingElement = document.querySelector('#loading-overlay');
        this.errorElement = document.querySelector('#error-message');
        this.relatedContainer = document.querySelector('#related-articles');
    }

    /**
     * Инициализация страницы статьи
     */
    async init() {
        console.log('NewsArticle.init() started'); // Отладка
        this.currentId = this.getIdFromUrl();
        
        if (!this.currentId) {
            console.log('No article ID found in URL'); // Отладка
            this.showError('ID статьи не указан');
            return;
        }

        console.log('Article ID from URL:', this.currentId); // Отладка

        try {
            this.showLoading();
            
            // Загружаем статью
            console.log('Loading article...'); // Отладка
            this.article = await this.loader.loadArticle(this.currentId);
            
            if (!this.article) {
                console.log('Article not found'); // Отладка
                this.showError('Статья не найдена');
                return;
            }

            console.log('Article loaded successfully:', this.article.title); // Отладка

            // Рендерим статью
            await this.render();
            await this.renderRelated();
            await this.renderSidebar();
            await this.renderNavigation();
            
            console.log('Setting up events...'); // Отладка
            this.setupEvents();
            
            this.updatePageMeta();
            this.hideLoading();
            
            console.log('NewsArticle initialization completed'); // Отладка
            
        } catch (error) {
            console.error('Failed to load article:', error);
            this.showError('Ошибка загрузки статьи');
        }
    }

    /**
     * Получает ID статьи из URL
     */
    getIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    /**
     * Рендерит основное содержимое статьи
     */
    async render() {
        if (!this.article) return;

        const categoryName = this.getCategoryName(this.article.category);
        const formattedDate = this.formatDate(this.article.publishedAt);
        const imageUrl = this.article.image?.url || this.article.image;

        // Обновляем заголовок страницы
        document.title = `${this.article.title} - Федерація Дзюдо України`;

        // Обновляем breadcrumb с категорией
        this.updateBreadcrumbs();

        // Скрываем старый header, так как информация теперь в overlay
        const articleHeader = document.querySelector('.article-header');
        if (articleHeader) {
            articleHeader.style.display = 'none';
        }

        // Обновляем изображение и создаем overlay-дизайн
        const imageElement = document.getElementById('article-image');
        const imageContainer = document.querySelector('.article-image-container');
        console.log('Article image URL:', imageUrl); // Отладка
        
        if (imageElement && imageUrl && imageContainer) {
            imageElement.src = imageUrl;
            imageElement.alt = this.article.title;
            imageElement.style.display = 'block';
            imageContainer.style.display = 'block';
            imageContainer.classList.add('loaded');
            
            // Создаем overlay с информацией
            const overlayHTML = `
                <div class="article-image-overlay">
                    <div class="article-overlay-content">
                        <span class="article-category-overlay">${categoryName}</span>
                        <h1 class="article-title-overlay">${this.article.title}</h1>
                        <div class="article-meta-overlay">
                            <div class="meta-item">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12,6 12,12 16,14"/>
                                </svg>
                                <span>${formattedDate}</span>
                            </div>
                            <div class="meta-item">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                                <span>${this.article.author?.name || 'ФДУ'}</span>
                            </div>
                            <div class="meta-item">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                                </svg>
                                <span>${Math.ceil(this.article.content.split(' ').length / 200)} хв читання</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            imageContainer.innerHTML = `
                <img id="article-image" src="${imageUrl}" alt="${this.article.title}" class="article-image">
                ${overlayHTML}
            `;
            
        } else {
            console.log('No image URL found for article:', this.article.title);
            if (imageContainer) {
                imageContainer.style.display = 'none';
            }
        }

        // Обновляем контент
        const contentElement = document.getElementById('article-content');
        if (contentElement) {
            contentElement.innerHTML = this.article.content;
        }

        // Обновляем теги
        const tagsContainer = document.getElementById('article-tags');
        if (tagsContainer && this.article.tags && this.article.tags.length > 0) {
            tagsContainer.innerHTML = this.article.tags.map(tag => `
                <span class="tag">${tag}</span>
            `).join('');
        }
    }

    /**
     * Рендерит похожие статьи
     */
    async renderRelated() {
        const relatedContainer = document.getElementById('related-articles');
        if (!relatedContainer || !this.article) return;

        try {
            const relatedArticles = await this.loader.getRelatedArticles(this.article, 4);
            
            if (relatedArticles.length === 0) {
                const widget = relatedContainer.closest('.sidebar-widget');
                if (widget) widget.style.display = 'none';
                return;
            }

            const relatedHTML = relatedArticles.map(article => {
                const imageUrl = article.image?.url || article.image || '';
                return `
                    <div class="related-article">
                        <a href="news-article.html?id=${article.slugId}" class="related-article-link">
                            <div class="related-article-image">
                                ${imageUrl ? `<img src="${imageUrl}" alt="${article.title}" loading="lazy">` : '<div class="image-placeholder"></div>'}
                            </div>
                            <div class="related-article-content">
                                <h4 class="related-article-title">${article.title}</h4>
                                <span class="related-article-date">${this.formatDate(article.publishedAt)}</span>
                            </div>
                        </a>
                    </div>
                `;
            }).join('');

            relatedContainer.innerHTML = relatedHTML;
            
        } catch (error) {
            console.warn('Failed to load related articles:', error);
        }
    }

    /**
     * Рендерит сайдбар
     */
    async renderSidebar() {
        // Обновляем только "Останні новини" секцію
        const recentArticlesContainer = document.getElementById('sidebar-recent-articles');
        if (!recentArticlesContainer) return;

        try {
            // Получаем все статьи
            const allArticles = await this.loader.scanArticles();
            
            // Получаем последние статьи
            const latestArticles = allArticles
                .filter(article => article.id !== this.article.id)
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
                .slice(0, 5);

            const recentHTML = latestArticles.map(article => {
                const imageUrl = article.image?.url || article.image || '';
                console.log('Sidebar article image data:', article.title, imageUrl); // Отладка
                return `
                    <div class="sidebar-recent-article">
                        <a href="news-article.html?id=${article.slugId}" class="recent-article-link">
                            <div class="sidebar-recent-article-image">
                                ${imageUrl ? `<img src="${imageUrl}" alt="${article.title}" loading="lazy">` : '<div class="image-placeholder"></div>'}
                            </div>
                            <div class="sidebar-recent-article-content">
                                <h4 class="sidebar-recent-article-title">${article.title}</h4>
                                <span class="sidebar-recent-article-date">${this.formatDate(article.publishedAt)}</span>
                            </div>
                        </a>
                    </div>
                `;
            }).join('');

            recentArticlesContainer.innerHTML = recentHTML;
            
        } catch (error) {
            console.warn('Failed to render sidebar:', error);
        }
    }

    /**
     * Получает категории с количеством
     */
    getCategories(articles) {
        const categories = {};
        
        articles.forEach(article => {
            if (!categories[article.category]) {
                categories[article.category] = {
                    id: article.category,
                    name: this.getCategoryName(article.category),
                    count: 0
                };
            }
            categories[article.category].count++;
        });

        return Object.values(categories);
    }

    /**
     * Рендерит навигацию между статьями
     */
    async renderNavigation() {
        try {
            // Получаем все статьи
            const allArticles = await this.loader.scanArticles();
            
            // Сортируем по дате публикации
            const sortedArticles = allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            
            // Находим текущую статью
            const currentIndex = sortedArticles.findIndex(article => article.slugId === this.article.slugId);
            
            const prevArticle = currentIndex < sortedArticles.length - 1 ? sortedArticles[currentIndex + 1] : null;
            const nextArticle = currentIndex > 0 ? sortedArticles[currentIndex - 1] : null;
            
            // Ищем контейнер для навигации (после тегов или действий)
            let navigationContainer = document.querySelector('.article-navigation');
            
            if (!navigationContainer) {
                // Создаем контейнер навигации
                const actionsContainer = document.querySelector('.article-actions');
                if (actionsContainer) {
                    navigationContainer = document.createElement('div');
                    navigationContainer.className = 'article-navigation';
                    actionsContainer.parentNode.insertBefore(navigationContainer, actionsContainer.nextSibling);
                } else {
                    // Если нет actions, добавляем в конец основного контента
                    const mainContent = document.querySelector('.article-main');
                    if (mainContent) {
                        navigationContainer = document.createElement('div');
                        navigationContainer.className = 'article-navigation';
                        mainContent.appendChild(navigationContainer);
                    }
                }
            }
            
            if (navigationContainer) {
                navigationContainer.innerHTML = `
                    <div class="article-nav">
                        <div class="nav-grid">
                            ${prevArticle ? `
                                <a href="news-article.html?id=${prevArticle.slugId}" class="nav-block prev-block">
                                    <div class="nav-direction">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <path d="M15 18L9 12L15 6"/>
                                    </svg>
                                        <span>Попередня</span>
                                    </div>
                                    <h3 class="nav-article-title">${prevArticle.title}</h3>
                                </a>
                            ` : '<div class="nav-block-empty"></div>'}
                            
                            <div class="nav-home">
                                <a href="news.html" class="home-button">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                    </svg>
                                <span>Всі новини</span>
                            </a>
                        </div>
                        
                            ${nextArticle ? `
                                <a href="news-article.html?id=${nextArticle.slugId}" class="nav-block next-block">
                                    <div class="nav-direction">
                                        <span>Наступна</span>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <path d="M9 18L15 12L9 6"/>
                                    </svg>
                                    </div>
                                    <h3 class="nav-article-title">${nextArticle.title}</h3>
                                </a>
                            ` : '<div class="nav-block-empty"></div>'}
                        </div>
                    </div>
                `;
            }
            
        } catch (error) {
            console.warn('Failed to render navigation:', error);
        }
    }

    /**
     * Обновляет breadcrumbs с категорией
     */
    updateBreadcrumbs() {
        if (!this.article) return;

        const breadcrumbNav = document.querySelector('.breadcrumb-nav');
        if (!breadcrumbNav) return;

        const categoryName = this.getCategoryName(this.article.category);
        const articleTitle = this.article.title;
        
        // Обрезаем длинные заголовки для мобильных
        const shortTitle = articleTitle.length > 50 ? 
            articleTitle.substring(0, 47) + '...' : articleTitle;

        breadcrumbNav.innerHTML = `
            <a href="index.html">Головна</a>
            <span class="breadcrumb-separator">›</span>
            <a href="news.html">Новини</a>
            <span class="breadcrumb-separator">›</span>
            <a href="news.html?category=${this.article.category}">${categoryName}</a>
            <span class="breadcrumb-separator">›</span>
            <span id="breadcrumb-title">${shortTitle}</span>
        `;
    }

    /**
     * Обновляет мета-теги страницы
     */
    updatePageMeta() {
        if (!this.article) return;

        document.title = `${this.article.title} - Федерація Дзюдо України`;

        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.content = this.article.excerpt;
        }
    }

    /**
     * Тестовая функция для проверки копирования
     */


    /**
     * Настройка событий
     */
    setupEvents() {
        console.log('Setting up events...'); // Отладка
        
        // Обработка всех кнопок "Поделиться" (включая копирование)
        const shareButtons = document.querySelectorAll('.share-btn');
        console.log('Found share buttons:', shareButtons.length); // Отладка
        
        shareButtons.forEach((button, index) => {
            const platform = button.getAttribute('data-platform');
            const buttonText = button.textContent || button.innerText;
            console.log(`Button ${index}: platform = ${platform}, text = "${buttonText}"`); // Отладка
            
            button.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Share button clicked:', platform, 'text:', buttonText); // Отладка
                if (platform) {
                    this.share(platform);
                } else {
                    console.error('No platform attribute found for button:', buttonText); // Отладка
                }
            });
        });
        
        // Специальная проверка кнопки копирования
        const copyButton = document.getElementById('copy-link-btn');
        if (copyButton) {
            console.log('Copy button found:', copyButton); // Отладка
            console.log('Copy button classes:', copyButton.className); // Отладка
            console.log('Copy button data-platform:', copyButton.getAttribute('data-platform')); // Отладка
            
            // Добавляем дополнительный обработчик для кнопки копирования
            copyButton.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Copy button clicked directly!'); // Отладка
                this.share('copy');
            });
        } else {
            console.error('Copy button not found!'); // Отладка
        }
        
        
        console.log('Events setup completed'); // Отладка
    }

    /**
     * Поделиться
     */
    share(platform) {
        console.log('Share method called with platform:', platform); // Отладка
        
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(this.article.title);
        const text = encodeURIComponent(this.article.excerpt || this.article.title);

        console.log('Share data:', { url, title, text }); // Отладка

        const shareUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
            telegram: `https://t.me/share/url?url=${url}&text=${title}`,
            copy: () => {
                console.log('=== COPY FUNCTION STARTED ==='); // Отладка
                console.log('Copying URL to clipboard:', window.location.href); // Отладка
                
                // Проверяем поддержку Clipboard API
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    console.log('Using modern Clipboard API'); // Отладка
                    navigator.clipboard.writeText(window.location.href).then(() => {
                        console.log('URL copied successfully via Clipboard API'); // Отладка
                        this.showNotification('Посилання скопійовано в буфер обміну!');
                    }).catch((error) => {
                        console.error('Clipboard API failed:', error); // Отладка
                        console.log('Trying fallback method...'); // Отладка
                        this.copyWithFallback();
                    });
                } else {
                    console.log('Clipboard API not supported, using fallback'); // Отладка
                    this.copyWithFallback();
                }
            }
        };

        if (shareUrls[platform]) {
            console.log('Executing share for platform:', platform); // Отладка
            if (typeof shareUrls[platform] === 'function') {
                shareUrls[platform]();
            } else {
                window.open(shareUrls[platform], '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
            }
        } else {
            console.error('Unknown platform:', platform); // Отладка
        }
    }

    /**
     * Fallback метод копирования
     */
    copyWithFallback() {
        console.log('Using fallback copy method'); // Отладка
        try {
            const textArea = document.createElement('textarea');
            textArea.value = window.location.href;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            console.log('execCommand copy result:', successful); // Отладка
            
            document.body.removeChild(textArea);
            
            if (successful) {
                console.log('URL copied using fallback method'); // Отладка
                this.showNotification('Посилання скопійовано в буфер обміну!');
            } else {
                console.error('Fallback copy failed'); // Отладка
                this.showNotification('Помилка копіювання посилання');
            }
        } catch (error) {
            console.error('Fallback copy error:', error); // Отладка
            this.showNotification('Помилка копіювання: ' + error.message);
        }
    }

    /**
     * Показать уведомление
     */
    showNotification(message) {
        // Удаляем существующие уведомления
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            document.body.removeChild(notification);
        });

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon-wrapper">
                    <svg class="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20,6 9,17 4,12"/>
                    </svg>
                </div>
                <span class="notification-text">${message}</span>
                <div class="notification-progress"></div>
            </div>
        `;
        
        // Добавляем современные стили
        notification.style.cssText = `
            position: fixed;
            top: 25px;
            right: 25px;
            background: linear-gradient(135deg, #00c851 0%, #28a745 100%);
            color: white;
            padding: 0;
            border-radius: 16px;
            box-shadow: 0 10px 30px rgba(40, 167, 69, 0.3), 0 4px 15px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 15px;
            font-weight: 600;
            max-width: 350px;
            min-width: 280px;
            animation: fadeIn 0.4s ease-out;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            overflow: hidden;
        `;
        
        // Добавляем улучшенный CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                0% {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes slideOutSmooth {
                0% {
                    transform: translateX(0) scale(1);
                    opacity: 1;
                }
                100% {
                    transform: translateX(100%) scale(0.9);
                    opacity: 0;
                }
            }
            
            @keyframes progressBar {
                0% { width: 100%; }
                100% { width: 0%; }
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px 20px;
                position: relative;
                z-index: 2;
            }
            
            .notification-icon-wrapper {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                flex-shrink: 0;
                animation: iconPulse 0.6s ease-out;
            }
            
            .notification-icon {
                width: 16px;
                height: 16px;
                stroke: currentColor;
                stroke-width: 3;
            }
            
            .notification-text {
                flex: 1;
                line-height: 1.4;
                letter-spacing: 0.3px;
            }
            
            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.8);
                border-radius: 0 0 16px 16px;
                animation: progressBar 3s linear;
                z-index: 1;
            }
            
            @keyframes iconPulse {
                0% {
                    transform: scale(0);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.2);
                    opacity: 1;
                }
                100% {
                    transform: scale(1);
                    opacity: 1;
                }
            }
            
            /* Hover эффект для уведомления */
            .notification:hover {
                transform: translateY(-2px);
                box-shadow: 0 15px 40px rgba(40, 167, 69, 0.4), 0 8px 20px rgba(0, 0, 0, 0.15);
                transition: all 0.3s ease;
            }
            
            .notification:hover .notification-progress {
                animation-play-state: paused;
            }
            
            /* Адаптация для мобильных */
            @media (max-width: 480px) {
                .notification {
                    right: 15px !important;
                    top: 15px !important;
                    left: 15px !important;
                    max-width: none !important;
                    min-width: auto !important;
                }
                
                .notification-content {
                    padding: 14px 16px !important;
                    gap: 10px !important;
                }
                
                .notification-text {
                    font-size: 14px !important;
                }
                
                .notification-icon-wrapper {
                    width: 24px !important;
                    height: 24px !important;
                }
                
                .notification-icon {
                    width: 14px !important;
                    height: 14px !important;
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Автоматически удаляем через 3 секунды с плавной анимацией
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOutSmooth 0.4s cubic-bezier(0.4, 0, 1, 1) forwards';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 400);
            }
        }, 3000);
        
        // Позволяем закрывать уведомление по клику
        notification.addEventListener('click', () => {
            if (document.body.contains(notification)) {
                notification.style.animation = 'slideOutSmooth 0.3s cubic-bezier(0.4, 0, 1, 1) forwards';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
            document.body.removeChild(notification);
                    }
                }, 300);
            }
        });
    }

    getCategoryName(category) {
        const categories = {
            'achievements': 'Досягнення',
            'competitions': 'Змагання',
            'events': 'Події',
            'announcements': 'Анонси'
        };
        return categories[category] || category;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'flex';
        }
    }

    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
    }

    showError(message) {
        this.hideLoading();
        if (this.errorElement) {
            this.errorElement.style.display = 'block';
            const messageElement = this.errorElement.querySelector('h2');
            if (messageElement) {
                messageElement.textContent = 'Помилка завантаження';
            }
            const textElement = this.errorElement.querySelector('p');
            if (textElement) {
                textElement.textContent = message;
            }
        }
    }
}

// Экспорт
if (typeof window !== 'undefined') {
    window.NewsArticle = NewsArticle;
} 