// News Article Page Manager
class NewsArticleManager {
    constructor() {
        this.currentArticle = null;
        this.allNews = [];
        this.articleId = this.getArticleIdFromUrl();
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing NewsArticleManager...');
            console.log('Article ID from URL:', this.articleId);
            
            // Завантажуємо всі новини для навігації та пов'язаних статей
            this.allNews = await window.newsLoader.loadArticlesList();
            console.log('Loaded articles:', this.allNews.length);
            
            if (this.articleId) {
                this.loadArticle(this.articleId);
            } else {
                console.error('No article ID found in URL');
                this.showError();
            }
        } catch (error) {
            console.error('Помилка ініціалізації:', error);
            this.showError();
        }
    }

    // Get article ID from URL parameters
    getArticleIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        return id ? parseInt(id) : null;
    }

    // Load and display article
    async loadArticle(articleId) {
        try {
            console.log('Loading article with ID:', articleId);
            this.showLoading();
            
            // Завантажуємо конкретну статтю
            const article = await window.newsLoader.loadArticle(articleId);
            console.log('Loaded article:', article);
            
            if (!article) {
                console.error('Article not found for ID:', articleId);
                this.showError();
                return;
            }

            this.currentArticle = article;
            await this.renderArticle(article);
            this.setupEventListeners();
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading article:', error);
            this.showError();
        }
    }

    // Render article content
    async renderArticle(article) {
        // Update page title
        document.title = `${article.title} - Федерація Дзюдо України`;
        document.getElementById('article-title').textContent = `${article.title} - Федерація Дзюдо України`;

        // Update breadcrumb
        document.getElementById('breadcrumb-title').textContent = this.truncateTitle(article.title, 50);

        // Update article header
        document.getElementById('article-category').textContent = this.getCategoryName(article.category);
        document.getElementById('article-main-title').textContent = article.title;
        document.getElementById('article-author').textContent = article.author?.name || article.author;
        document.getElementById('article-date').textContent = this.formatDate(article.publishedAt);

        
        // Calculate and display reading time
        const readingTime = this.calculateReadingTime(article.content);
        document.getElementById('reading-time').textContent = `${readingTime} хв читання`;

        // Update article image
        const imageElement = document.getElementById('article-image');
        imageElement.src = article.image?.url || article.image;
        imageElement.alt = article.image?.alt || article.title;

        // Update article content
        document.getElementById('article-content').innerHTML = article.content;

        // Update tags
        this.renderTags(article.tags);



        // Render related articles
        await this.renderRelatedArticles(article);

        // Render recent articles
        this.renderRecentArticles();

        // Setup navigation
        this.setupArticleNavigation(article.id);
    }

    // Render tags
    renderTags(tags) {
        const tagsContainer = document.getElementById('article-tags');
        const tagsHtml = tags.map(tag => 
            `<a href="news.html?search=${encodeURIComponent(tag)}" class="tag">#${tag}</a>`
        ).join('');
        tagsContainer.innerHTML = tagsHtml;
    }

    // Render related articles
    async renderRelatedArticles(currentArticle) {
        const relatedContainer = document.getElementById('related-articles');
        
        try {
            // Використовуємо метод newsLoader для отримання пов'язаних статей
            const relatedArticles = await window.newsLoader.getRelatedArticles(currentArticle.id, 3);

            if (relatedArticles.length === 0) {
                // Якщо немає пов'язаних, показуємо статті з тієї ж категорії
                const categoryArticles = this.allNews
                    .filter(article => 
                        article.category === currentArticle.category && 
                        article.id !== currentArticle.id
                    )
                    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
                    .slice(0, 3);
                
                if (categoryArticles.length === 0) {
                    relatedContainer.innerHTML = '<p class="no-related">Схожих новин не знайдено</p>';
                    return;
                }
                
                this.renderRelatedArticlesList(categoryArticles, relatedContainer);
            } else {
                this.renderRelatedArticlesList(relatedArticles, relatedContainer);
            }
        } catch (error) {
            console.error('Помилка завантаження пов\'язаних статей:', error);
            relatedContainer.innerHTML = '<p class="no-related">Помилка завантаження схожих новин</p>';
        }
    }

    renderRelatedArticlesList(articles, container) {
        const relatedHtml = articles.map(article => `
            <a href="news-article.html?id=${article.id}" class="related-article">
                <div class="related-article-image" style="background-image: url('${article.image?.url || article.image}')"></div>
                <div class="related-article-content">
                    <h4 class="related-article-title">${this.truncateTitle(article.title, 60)}</h4>
                    <span class="related-article-date">${this.formatDate(article.publishedAt)}</span>
                </div>
            </a>
        `).join('');

        container.innerHTML = relatedHtml;
    }

    // Render recent articles in sidebar
    renderRecentArticles() {
        const recentContainer = document.getElementById('sidebar-recent-articles');
        
        const recentArticles = this.allNews
            .filter(article => article.id !== this.currentArticle.id)
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
            .slice(0, 4);

        const recentHtml = recentArticles.map(article => `
            <a href="news-article.html?id=${article.id}" class="recent-article">
                <div class="recent-article-image" style="background-image: url('${article.image?.url || article.image}')"></div>
                <div class="recent-article-content">
                    <h4 class="recent-article-title">${this.truncateTitle(article.title, 50)}</h4>
                    <span class="recent-article-date">${this.formatDate(article.publishedAt)}</span>
                </div>
            </a>
        `).join('');

        recentContainer.innerHTML = recentHtml;
    }

    // Setup article navigation (prev/next)
    setupArticleNavigation(currentId) {
        const currentIndex = this.allNews.findIndex(article => article.id === currentId);
        
        const prevArticle = currentIndex > 0 ? this.allNews[currentIndex - 1] : null;
        const nextArticle = currentIndex < this.allNews.length - 1 ? this.allNews[currentIndex + 1] : null;

        // Previous article
        const prevElement = document.getElementById('prev-article');
        if (prevArticle) {
            prevElement.style.display = 'block';
            prevElement.innerHTML = this.createNavigationHTML(prevArticle, 'prev');
            prevElement.onclick = () => {
                window.location.href = `news-article.html?id=${prevArticle.id}`;
            };
        }

        // Next article
        const nextElement = document.getElementById('next-article');
        if (nextArticle) {
            nextElement.style.display = 'block';
            nextElement.innerHTML = this.createNavigationHTML(nextArticle, 'next');
            nextElement.onclick = () => {
                window.location.href = `news-article.html?id=${nextArticle.id}`;
            };
        }
    }

    createNavigationHTML(article, direction) {
        const categoryName = this.getCategoryName(article.category);
        const formattedDate = this.formatDate(article.publishedAt || article.date);
        const imageUrl = article.image?.url || article.image || '';
        
        const arrowIcon = direction === 'prev' 
            ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15,18 9,12 15,6"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,18 15,12 9,6"/></svg>';
        
        const labelText = direction === 'prev' ? 'Попередня новина' : 'Наступна новина';
        
        return `
            <div class="nav-article-image" style="background-image: url('${imageUrl}')"></div>
            <div class="nav-article-content">
                <div class="nav-label">
                    <span class="nav-label-icon">${arrowIcon}</span>
                    ${labelText}
                </div>
                <h4 class="nav-title">${this.truncateTitle(article.title, 80)}</h4>
                <p class="nav-excerpt">${this.truncateTitle(article.excerpt, 120)}</p>
                <div class="nav-meta">
                    <span class="nav-date">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        ${formattedDate}
                    </span>
                    <span class="nav-category">${categoryName}</span>
                </div>
            </div>
        `;
    }

    // Setup event listeners
    setupEventListeners() {
        // Share buttons
        document.querySelectorAll('.share-btn[data-platform]').forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.dataset.platform;
                this.shareArticle(platform);
            });
        });

        // Copy link button
        document.getElementById('copy-link-btn').addEventListener('click', () => {
            this.copyLink();
        });
    }



    // Share article
    shareArticle(platform) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(this.currentArticle.title);
        const text = encodeURIComponent(this.currentArticle.excerpt);

        const shareUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
            telegram: `https://t.me/share/url?url=${url}&text=${title}`
        };

        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    }

    // Copy link to clipboard
    async copyLink() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            
            // Show feedback
            const copyBtn = document.getElementById('copy-link-btn');
            const originalText = copyBtn.querySelector('span').textContent;
            copyBtn.querySelector('span').textContent = 'Скопійовано!';
            copyBtn.style.background = '#28a745';
            copyBtn.style.borderColor = '#28a745';
            copyBtn.style.color = 'white';
            
            setTimeout(() => {
                copyBtn.querySelector('span').textContent = originalText;
                copyBtn.style.background = '';
                copyBtn.style.borderColor = '';
                copyBtn.style.color = '';
            }, 2000);
            
        } catch (error) {
            console.error('Failed to copy link:', error);
            // Fallback for older browsers
            this.fallbackCopyLink();
        }
    }

    // Fallback copy method
    fallbackCopyLink() {
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        alert('Посилання скопійовано в буфер обміну!');
    }



    // Show loading overlay
    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    // Hide loading overlay
    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    // Show error message
    showError() {
        this.hideLoading();
        document.getElementById('error-message').style.display = 'block';
        document.querySelector('.article-page').style.display = 'none';
        document.querySelector('.article-navigation').style.display = 'none';
    }

    // Utility functions
    formatDate(dateString) {
        return NewsUtils.formatDate(dateString);
    }

    getCategoryName(category) {
        const categories = {
            'achievements': 'Досягнення',
            'competitions': 'Змагання',
            'events': 'Події',
            'announcements': 'Анонси'
        };
        return categories[category] || 'Новини';
    }

    truncateTitle(title, maxLength) {
        if (title.length <= maxLength) return title;
        return title.substr(0, maxLength).trim() + '...';
    }

    calculateReadingTime(content) {
        const wordsPerMinute = 200;
        const text = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
        const wordCount = text.split(/\s+/).length;
        return Math.ceil(wordCount / wordsPerMinute);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking newsLoader...');
    
    // Проверяем, что newsLoader загружен
    if (window.newsLoader) {
        console.log('newsLoader found, creating NewsArticleManager...');
        window.newsArticleManager = new NewsArticleManager();
    } else {
        console.error('newsLoader не загружен');
        // Показываем ошибку пользователю
        document.getElementById('loading-overlay').style.display = 'none';
        document.getElementById('error-message').style.display = 'block';
    }
}); 