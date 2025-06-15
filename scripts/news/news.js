 /**
 * FJU News System - Unified Minimal Implementation
 * Единая минимальная реализация новостной системы
 */

// ===== NEWS LOADER =====
class NewsLoader {
    constructor() {
        this.cache = new Map();
        this.listCache = null;
        this.cacheExpiry = 5 * 60 * 1000; // 5 минут
        this.apiUrl = 'api/news.php';
        this.lastRequest = 0;
    }

    // Генерация токена
    generateToken() {
        const hour = new Date().toISOString().slice(0, 13).replace(/[-T:]/g, '');
        return this.hash('fju_news_' + hour);
    }

    hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    // Rate limiting
    async rateLimit() {
        const now = Date.now();
        const diff = now - this.lastRequest;
        if (diff < 100) {
            await new Promise(r => setTimeout(r, 100 - diff));
        }
        this.lastRequest = Date.now();
    }

    // Безопасный запрос
    async request(action, params = {}) {
        try {
            await this.rateLimit();
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    token: this.generateToken(),
                    ...params
                })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            
            return data.data;
        } catch (error) {
            // Логи ошибок только для локальной разработки
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            console.error(`API ${action} failed:`, error.message);
        }
            throw error;
        }
    }

    // Загрузка списка статей
    async loadArticles() {
        if (this.listCache && Date.now() - this.listCache.time < this.cacheExpiry) {
            return this.listCache.data;
        }

        try {
            const articles = await this.request('list');
            this.listCache = { data: articles, time: Date.now() };
            return articles;
        } catch (error) {
            // Тихий fallback - логи только для разработки
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                console.warn('Using fallback method...');
            }
            return this.fallbackLoadArticles();
        }
    }

    // Загрузка статьи
    async loadArticle(id) {
        const key = `article_${id}`;
        if (this.cache.has(key)) {
            const cached = this.cache.get(key);
            if (Date.now() - cached.time < this.cacheExpiry) {
                return cached.data;
            }
        }

        try {
            const article = await this.request('get', { id });
            this.cache.set(key, { data: article, time: Date.now() });
            return article;
        } catch (error) {
            return this.fallbackLoadArticle(id);
        }
    }

    // Связанные статьи
    async loadRelated(id, limit = 3) {
        try {
            return await this.request('related', { id, limit });
        } catch (error) {
            return this.fallbackLoadRelated(id, limit);
        }
    }

    // Fallback методы
    async fallbackLoadArticles() {
        try {
            const articles = [];
            // Читаем все возможные файлы статей
            for (let i = 1; i <= 50; i++) {
                const article = await this.fallbackLoadArticle(i);
                if (article) articles.push(article);
            }
            return articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        } catch (error) {
            return [];
        }
    }

    async fallbackLoadArticle(id) {
        try {
            const response = await fetch(`api/articles/${id}.json`);
            if (!response.ok) return null;
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    async fallbackLoadRelated(id, limit) {
        try {
            const all = await this.loadArticles();
            const current = all.find(a => a.id === id);
            if (!current) return [];
            
            return all
                .filter(a => a.id !== id && a.category === current.category)
                .slice(0, limit);
        } catch (error) {
            return [];
        }
    }
}

// ===== NEWS MANAGER =====
class NewsManager {
    constructor() {
        this.loader = new NewsLoader();
        this.allNews = [];
        this.filteredNews = [];
        this.currentPage = 1;
        this.itemsPerPage = 5;
        this.currentCategory = 'all';
        this.searchQuery = '';
    }

    async init() {
        try {
            this.allNews = await this.loader.loadArticles();
            this.filteredNews = [...this.allNews];
            this.updateHeroStats();
            this.render();
            this.setupEvents();
        } catch (error) {
            console.error('NewsManager init failed:', error);
            this.showError();
        }
    }

    updateHeroStats() {
        const totalElement = document.getElementById('total-articles');
        const thisMonthElement = document.getElementById('this-month');
        
        if (totalElement) {
            totalElement.textContent = this.allNews.length;
        }
        
        if (thisMonthElement) {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();
            
            const thisMonthCount = this.allNews.filter(article => {
                const articleDate = new Date(article.publishedAt);
                return articleDate.getMonth() === currentMonth && 
                       articleDate.getFullYear() === currentYear;
            }).length;
            
            thisMonthElement.textContent = thisMonthCount;
        }
    }

    filter(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        this.filteredNews = category === 'all' 
            ? [...this.allNews] 
            : this.allNews.filter(n => n.category === category);
        this.applySearch();
        this.render();
        this.updateTabs();
    }

    search(query) {
        this.searchQuery = query.toLowerCase();
        this.currentPage = 1;
        this.filteredNews = this.currentCategory === 'all' 
            ? [...this.allNews] 
            : this.allNews.filter(n => n.category === this.currentCategory);
        this.applySearch();
        this.render();
    }

    applySearch() {
        if (!this.searchQuery) return;
        this.filteredNews = this.filteredNews.filter(news => 
            news.title.toLowerCase().includes(this.searchQuery) ||
            news.excerpt.toLowerCase().includes(this.searchQuery) ||
            (news.tags && news.tags.some(tag => tag.toLowerCase().includes(this.searchQuery)))
        );
    }

    goToPage(page) {
        this.currentPage = page;
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    render() {
        this.renderArticles();
        this.renderPagination();
        this.renderRecent();
    }

    renderArticles() {
        const container = document.querySelector('.main-articles');
        if (!container) return;

        const start = (this.currentPage - 1) * this.itemsPerPage;
        const news = this.filteredNews.slice(start, start + this.itemsPerPage);

        if (news.length === 0) {
            container.innerHTML = '<div class="no-news"><h3>Новини не знайдено</h3></div>';
            return;
        }

        container.innerHTML = news.map(article => `
            <article class="regular-article" data-id="${article.id}">
                <div class="article-image" style="background-image: url('${article.image?.url || article.image}')"></div>
                <div class="article-content">
                    <span class="article-category">${this.getCategoryName(article.category)}</span>
                    <h3 class="article-title">${article.title}</h3>
                    <p class="article-excerpt">${article.excerpt}</p>
                    <div class="article-meta">
                        <span class="article-date">${this.formatDate(article.publishedAt)}</span>
                        <a href="news-article.html?id=${article.id}" class="read-more-btn">Читати далі</a>
                    </div>
                </div>
            </article>
        `).join('');
    }

    renderPagination() {
        const container = document.querySelector('.pagination');
        if (!container) return;

        const totalPages = Math.ceil(this.filteredNews.length / this.itemsPerPage);
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';
        if (this.currentPage > 1) {
            html += `<a href="#" data-page="${this.currentPage - 1}">«</a>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                html += `<span class="current">${i}</span>`;
            } else if (i === 1 || i === totalPages || Math.abs(i - this.currentPage) <= 2) {
                html += `<a href="#" data-page="${i}">${i}</a>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += '<span>...</span>';
            }
        }

        if (this.currentPage < totalPages) {
            html += `<a href="#" data-page="${this.currentPage + 1}">»</a>`;
        }

        container.innerHTML = html;
    }

    renderRecent() {
        const container = document.querySelector('.recent-articles');
        if (!container) return;

        const recent = this.allNews.slice(0, 4);
        container.innerHTML = recent.map(news => `
            <a href="news-article.html?id=${news.id}" class="recent-article">
                <div class="recent-article-image" style="background-image: url('${news.image?.url || news.image}')"></div>
                <div class="recent-article-content">
                    <h4 class="recent-article-title">${news.title}</h4>
                    <span class="recent-article-date">${this.formatDate(news.publishedAt)}</span>
                </div>
            </a>
        `).join('');
    }

    setupEvents() {
        // Фильтры
        document.querySelectorAll('.news-filter-tab').forEach(tab => {
            tab.addEventListener('click', e => {
                e.preventDefault();
                this.filter(tab.dataset.category);
            });
        });

        // Пагинация
        document.addEventListener('click', e => {
            if (e.target.matches('.pagination a[data-page]')) {
                e.preventDefault();
                this.goToPage(parseInt(e.target.dataset.page));
            }
        });

        // Поиск
        const searchInput = document.querySelector('.news-search');
        const clearBtn = document.querySelector('.search-clear-btn');
        
        if (searchInput) {
            let timeout;
            searchInput.addEventListener('input', e => {
                clearTimeout(timeout);
                const query = e.target.value.trim();
                
                if (clearBtn) {
                    clearBtn.style.display = query ? 'flex' : 'none';
                }
                
                timeout = setTimeout(() => this.search(query), 300);
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearBtn.style.display = 'none';
                this.search('');
            });
        }

        // Архив новин
        this.setupArchive();
    }

    setupArchive() {
        const archiveList = document.querySelector('.archive-list');
        if (!archiveList) return;

        // Генерируем архив на основе существующих статей
        const archive = this.generateArchive();
        
        archiveList.innerHTML = archive.map(item => `
            <li>
                <a href="#" data-year="${item.year}" data-month="${item.month}">
                    ${item.monthName} ${item.year}
                </a>
                <span class="archive-count">${item.count}</span>
            </li>
        `).join('');

        // Обработчики событий для архива
        archiveList.addEventListener('click', (e) => {
            if (e.target.matches('a[data-year]')) {
                e.preventDefault();
                const year = parseInt(e.target.dataset.year);
                const month = parseInt(e.target.dataset.month);
                this.filterByDate(year, month);
            }
        });
    }

    generateArchive() {
        const monthNames = [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
        ];

        const archiveMap = new Map();
        
        this.allNews.forEach(article => {
            const date = new Date(article.publishedAt);
            const year = date.getFullYear();
            const month = date.getMonth();
            const key = `${year}-${month}`;
            
            if (!archiveMap.has(key)) {
                archiveMap.set(key, {
                    year,
                    month,
                    monthName: monthNames[month],
                    count: 0
                });
            }
            
            archiveMap.get(key).count++;
        });

        return Array.from(archiveMap.values())
            .sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            })
            .slice(0, 12); // Показываем последние 12 месяцев
    }

    filterByDate(year, month) {
        this.currentPage = 1;
        this.currentCategory = 'all';
        this.searchQuery = '';
        
        this.filteredNews = this.allNews.filter(article => {
            const date = new Date(article.publishedAt);
            return date.getFullYear() === year && date.getMonth() === month;
        });
        
        this.render();
        this.updateTabs();
        
        // Обновляем заголовок
        const monthNames = [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
        ];
        
        const pageTitle = document.querySelector('.page-title h1');
        if (pageTitle) {
            pageTitle.textContent = `Архів новин: ${monthNames[month]} ${year}`;
        }
    }

    updateTabs() {
        document.querySelectorAll('.news-filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === this.currentCategory);
        });
    }

    getCategoryName(category) {
        const names = {
            'achievements': 'Досягнення',
            'competitions': 'Змагання', 
            'events': 'Події',
            'announcements': 'Анонси'
        };
        return names[category] || 'Новини';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const months = [
            'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
            'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
        ];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    showError() {
        const container = document.querySelector('.main-articles');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>Помилка завантаження</h3>
                    <button onclick="location.reload()">Спробувати знову</button>
                </div>
            `;
        }
    }
}

// ===== NEWS ARTICLE =====
class NewsArticle {
    constructor() {
        this.loader = new NewsLoader();
        this.articleId = this.getIdFromUrl();
        this.article = null;
    }

    getIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('id')) || null;
    }

    async init() {
        if (!this.articleId) {
            this.showError();
            return;
        }

        try {
            this.showLoading();
            this.article = await this.loader.loadArticle(this.articleId);
            
            if (!this.article) {
                this.showError();
                return;
            }

            await this.render();
            this.setupEvents();
            this.hideLoading();
        } catch (error) {
            console.error('Article load failed:', error);
            this.showError();
        }
    }

    async render() {
        document.title = `${this.article.title} - ФДУ`;
        document.getElementById('breadcrumb-title').textContent = this.truncate(this.article.title, 50);
        document.getElementById('article-category').textContent = this.getCategoryName(this.article.category);
        document.getElementById('article-main-title').textContent = this.article.title;
        document.getElementById('article-author').textContent = this.article.author?.name || this.article.author;
        document.getElementById('article-date').textContent = this.formatDate(this.article.publishedAt);
        document.getElementById('reading-time').textContent = `${this.calculateReadingTime(this.article.content)} хв читання`;
        
        const image = document.getElementById('article-image');
        image.src = this.article.image?.url || this.article.image;
        image.alt = this.article.image?.alt || this.article.title;
        
        document.getElementById('article-content').innerHTML = this.article.content;
        
        if (this.article.tags) {
            document.getElementById('article-tags').innerHTML = this.article.tags
                .map(tag => `<a href="news.html?search=${encodeURIComponent(tag)}" class="tag">#${tag}</a>`)
                .join('');
        }

        await this.renderRelated();
        await this.renderRecent();
        await this.renderNavigation();
    }

    async renderRelated() {
        try {
            const related = await this.loader.loadRelated(this.articleId, 3);
            const container = document.getElementById('related-articles');
            
            container.innerHTML = related.map(article => `
                <a href="news-article.html?id=${article.id}" class="related-article">
                    <div class="related-article-image" style="background-image: url('${article.image?.url || article.image}')"></div>
                    <div class="related-article-content">
                        <h4 class="related-article-title">${this.truncate(article.title, 60)}</h4>
                        <span class="related-article-date">${this.formatDate(article.publishedAt)}</span>
                    </div>
                </a>
            `).join('');
        } catch (error) {
            console.error('Related articles failed:', error);
        }
    }

    async renderRecent() {
        try {
            const all = await this.loader.loadArticles();
            const recent = all.filter(a => a.id !== this.articleId).slice(0, 4);
            const container = document.getElementById('sidebar-recent-articles');
            
            container.innerHTML = recent.map(article => `
                <a href="news-article.html?id=${article.id}" class="recent-article">
                    <div class="recent-article-image" style="background-image: url('${article.image?.url || article.image}')"></div>
                    <div class="recent-article-content">
                        <h4 class="recent-article-title">${this.truncate(article.title, 50)}</h4>
                        <span class="recent-article-date">${this.formatDate(article.publishedAt)}</span>
                    </div>
                </a>
            `).join('');
        } catch (error) {
            console.error('Recent articles failed:', error);
        }
    }

    async renderNavigation() {
        try {
            const all = await this.loader.loadArticles();
            const currentIndex = all.findIndex(a => a.id === this.articleId);
            
            if (currentIndex === -1) return;
            
            const prevArticle = currentIndex < all.length - 1 ? all[currentIndex + 1] : null;
            const nextArticle = currentIndex > 0 ? all[currentIndex - 1] : null;
            
            const prevContainer = document.getElementById('prev-article');
            const nextContainer = document.getElementById('next-article');
            
            if (prevArticle && prevContainer) {
                prevContainer.innerHTML = `
                    <div class="nav-article-content">
                        <span class="nav-direction">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="15,18 9,12 15,6"/>
                            </svg>
                            Попередня новина
                        </span>
                        <h4 class="nav-article-title">${this.truncate(prevArticle.title, 60)}</h4>
                        <span class="nav-article-date">${this.formatDate(prevArticle.publishedAt)}</span>
                    </div>
                    <div class="nav-article-image" style="background-image: url('${prevArticle.image?.url || prevArticle.image}')"></div>
                `;
                prevContainer.href = `news-article.html?id=${prevArticle.id}`;
                prevContainer.style.display = 'flex';
            }
            
            if (nextArticle && nextContainer) {
                nextContainer.innerHTML = `
                    <div class="nav-article-image" style="background-image: url('${nextArticle.image?.url || nextArticle.image}')"></div>
                    <div class="nav-article-content">
                        <span class="nav-direction">
                            Наступна новина
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="9,18 15,12 9,6"/>
                            </svg>
                        </span>
                        <h4 class="nav-article-title">${this.truncate(nextArticle.title, 60)}</h4>
                        <span class="nav-article-date">${this.formatDate(nextArticle.publishedAt)}</span>
                    </div>
                `;
                nextContainer.href = `news-article.html?id=${nextArticle.id}`;
                nextContainer.style.display = 'flex';
            }
        } catch (error) {
            console.error('Navigation render failed:', error);
        }
    }

    setupEvents() {
        // Поделиться
        document.querySelectorAll('.share-btn[data-platform]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.share(btn.dataset.platform);
            });
        });

        // Копировать ссылку
        const copyBtn = document.getElementById('copy-link-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyLink());
        }
    }

    share(platform) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(this.article.title);

        const urls = {
            facebook: `https://www.facebook.com/sharer.php?u=${url}`,
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
            telegram: `https://t.me/share/url?url=${url}&text=${title}`
        };

        if (urls[platform]) {
            window.open(urls[platform], '_blank', 'width=600,height=400');
        }
    }

    async copyLink() {
        try {
            await navigator.clipboard.writeText(window.location.href);
            const btn = document.getElementById('copy-link-btn');
            const span = btn.querySelector('span');
            const original = span.textContent;
            
            span.textContent = 'Скопійовано!';
            btn.style.background = '#28a745';
            
            setTimeout(() => {
                span.textContent = original;
                btn.style.background = '';
            }, 2000);
        } catch (error) {
            alert('Посилання скопійовано!');
        }
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showError() {
        this.hideLoading();
        document.getElementById('error-message').style.display = 'block';
        document.querySelector('.article-page').style.display = 'none';
    }

    // Утилиты
    truncate(text, length) {
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    getCategoryName(category) {
        const names = {
            'achievements': 'Досягнення',
            'competitions': 'Змагання',
            'events': 'Події', 
            'announcements': 'Анонси'
        };
        return names[category] || 'Новини';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const months = [
            'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
            'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
        ];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    calculateReadingTime(content) {
        const text = content.replace(/<[^>]*>/g, '');
        const words = text.split(/\s+/).length;
        return Math.ceil(words / 200);
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    // Определяем тип страницы
    const isNewsPage = document.querySelector('.main-articles') && !document.querySelector('.article-page');
    const isArticlePage = document.querySelector('.article-page');

    if (isNewsPage) {
        window.newsManager = new NewsManager();
        window.newsManager.init();
    } else if (isArticlePage) {
        window.newsArticle = new NewsArticle();
        window.newsArticle.init();
    }

    // Экспортируем для обратной совместимости
    window.newsLoader = new NewsLoader();
});