// News Manager - Main functionality for news system
class NewsManager {
    constructor() {
        this.allNews = [];
        this.filteredNews = [];
        this.currentPage = 1;
        this.itemsPerPage = 5; // Показываем 5 статей на странице
        this.currentCategory = 'all';
        this.searchQuery = '';
        
        this.init();
    }

    async init() {
        try {
            // Завантажуємо новини з JSON файлів
            this.allNews = await window.newsLoader.loadArticlesList();
            
            // Сортируем по дате публикации в убывающем порядке (самые новые сначала)
            this.allNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
            this.filteredNews = [...this.allNews];
            
            this.renderNews();
            this.renderRecentNews();
            this.renderArchive();
            this.setupEventListeners();
            this.updateStats();
        } catch (error) {
            console.error('Помилка ініціалізації NewsManager:', error);
            this.showError('Помилка завантаження новин');
        }
    }

    // Filter news by category
    filterByCategory(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        
        if (category === 'all') {
            this.filteredNews = [...this.allNews];
        } else {
            this.filteredNews = this.allNews.filter(news => news.category === category);
        }
        
        // Сохраняем сортировку по дате в убывающем порядке
        this.filteredNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        
        this.applySearch();
        this.renderNews();
        this.showSearchResults();
        this.updateActiveFilter();
        this.removeArchiveButton();
    }

    // Search functionality
    search(query) {
        this.searchQuery = query.toLowerCase();
        this.currentPage = 1;
        
        // Reset to all news first, then apply category filter
        if (this.currentCategory === 'all') {
            this.filteredNews = [...this.allNews];
        } else {
            this.filteredNews = this.allNews.filter(news => news.category === this.currentCategory);
        }
        
        // Сохраняем сортировку по дате в убывающем порядке
        this.filteredNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        
        this.applySearch();
        this.renderNews();
        this.showSearchResults();
        this.removeArchiveButton();
    }

    applySearch() {
        if (this.searchQuery && this.searchQuery.length > 0) {
            this.filteredNews = this.filteredNews.filter(news => 
                news.title.toLowerCase().includes(this.searchQuery) ||
                news.excerpt.toLowerCase().includes(this.searchQuery) ||
                news.content.toLowerCase().includes(this.searchQuery) ||
                (news.tags && news.tags.some(tag => tag.toLowerCase().includes(this.searchQuery))) ||
                (news.author && news.author.name && news.author.name.toLowerCase().includes(this.searchQuery))
            );
        }
    }

    // Show search results info
    showSearchResults() {
        const filterContainer = document.querySelector('.news-filter');
        const existingInfo = document.querySelector('.search-results-info');
        
        // Remove existing search info
        if (existingInfo) {
            existingInfo.remove();
        }
        
        // Show search results info if there's a search query
        if (this.searchQuery && this.searchQuery.length > 0) {
            const resultsCount = this.filteredNews.length;
            const searchInfo = document.createElement('div');
            searchInfo.className = 'search-results-info';
            
            if (resultsCount > 0) {
                searchInfo.innerHTML = `
                    Знайдено <strong>${resultsCount}</strong> ${this.getNewsWord(resultsCount)} за запитом 
                    "<span class="search-term">${this.searchQuery}</span>"
                `;
            } else {
                searchInfo.innerHTML = `
                    За запитом "<span class="search-term">${this.searchQuery}</span>" нічого не знайдено.
                    Спробуйте інші ключові слова.
                `;
            }
            
            filterContainer.appendChild(searchInfo);
        }
    }

    // Get correct word form for news count
    getNewsWord(count) {
        if (count === 1) return 'новину';
        if (count >= 2 && count <= 4) return 'новини';
        return 'новин';
    }

    // Pagination
    goToPage(page) {
        this.currentPage = page;
        this.renderNews();
        this.scrollToTop();
    }

    getTotalPages() {
        return Math.ceil(this.filteredNews.length / this.itemsPerPage);
    }

    getCurrentPageNews() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.filteredNews.slice(startIndex, endIndex);
    }

    // Render news articles
    renderNews() {
        const newsContainer = document.querySelector('.main-articles');
        const currentNews = this.getCurrentPageNews();
        
        if (!newsContainer) return;

        if (currentNews.length === 0) {
            newsContainer.innerHTML = `
                <div class="no-news">
                    <h3>Новини не знайдено</h3>
                    <p>Спробуйте змінити фільтр або пошуковий запит</p>
                </div>
            `;
            this.renderPagination();
            return;
        }

        let html = '';
        
        currentNews.forEach((news, index) => {
            // Все статьи теперь одинакового размера
            const articleClass = 'regular-article';
            
            html += this.createArticleHTML(news, articleClass);
        });

        newsContainer.innerHTML = html;
        this.renderPagination();
        this.setupArticleEvents();
    }

    createArticleHTML(news, articleClass) {
        const formattedDate = this.formatDate(news.publishedAt);
        const categoryName = this.getCategoryName(news.category);
        
        // Все статьи теперь имеют одинаковую структуру с изображением
        return `
            <article class="${articleClass}" data-category="${news.category}" data-id="${news.id}">
                <div class="article-image" style="background-image: url('${news.image?.url || news.image}')"></div>
                <div class="article-content">
                    <span class="article-category">${categoryName}</span>
                    <h3 class="article-title">${news.title}</h3>
                    <p class="article-excerpt">${news.excerpt}</p>
                    <div class="article-meta">
                        <span class="article-date">${formattedDate}</span>
                        <a href="#" class="read-more-btn" data-id="${news.id}">Читати далі</a>
                    </div>
                </div>
            </article>
        `;
    }

    // Render pagination
    renderPagination() {
        const paginationContainer = document.querySelector('.pagination');
        if (!paginationContainer) return;

        const totalPages = this.getTotalPages();
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        let html = '';
        
        // Previous button
        if (this.currentPage > 1) {
            html += `<a href="#" class="pagination-btn" data-page="${this.currentPage - 1}">«</a>`;
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                html += `<span class="current">${i}</span>`;
            } else if (i === 1 || i === totalPages || Math.abs(i - this.currentPage) <= 2) {
                html += `<a href="#" class="pagination-btn" data-page="${i}">${i}</a>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += `<span>...</span>`;
            }
        }

        // Next button
        if (this.currentPage < totalPages) {
            html += `<a href="#" class="pagination-btn" data-page="${this.currentPage + 1}">»</a>`;
        }

        paginationContainer.innerHTML = html;
    }

    // Render recent news in sidebar
    renderRecentNews() {
        const recentContainer = document.querySelector('.recent-articles');
        if (!recentContainer) return;

        const recentNews = this.allNews
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
            .slice(0, 4);

        let html = '';
        recentNews.forEach(news => {
            html += `
                <a href="news-article.html?id=${news.id}" class="recent-article" data-id="${news.id}">
                    <div class="recent-article-image" style="background-image: url('${news.image?.url || news.image}')"></div>
                    <div class="recent-article-content">
                        <h4 class="recent-article-title">${news.title}</h4>
                        <span class="recent-article-date">${this.formatDate(news.publishedAt)}</span>
                    </div>
                </a>
            `;
        });

        recentContainer.innerHTML = html;
        
        // Добавляем обработчики событий для последних новостей
        this.setupRecentNewsEvents();
    }

    // Setup event listeners
    setupEventListeners() {
        // Filter tabs
        document.querySelectorAll('.news-filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const category = tab.dataset.category;
                this.filterByCategory(category);
            });
        });

        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-btn')) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                this.goToPage(page);
            }
        });

        // Search functionality
        this.setupSearchEvents();
    }

    // Setup search event listeners
    setupSearchEvents() {
        const searchInput = document.querySelector('.news-search');
        const clearBtn = document.querySelector('.search-clear-btn');
        
        if (searchInput) {
            // Search input with debounce
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                
                // Show/hide clear button
                if (query.length > 0) {
                    clearBtn.style.display = 'flex';
                } else {
                    clearBtn.style.display = 'none';
                }
                
                // Debounce search
                searchTimeout = setTimeout(() => {
                    this.search(query);
                }, 300);
            });

            // Enter key search
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(searchTimeout);
                    this.search(e.target.value.trim());
                }
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearBtn.style.display = 'none';
                this.search('');
                searchInput.focus();
            });
        }
    }

    setupArticleEvents() {
        // Read more buttons
        document.querySelectorAll('.read-more-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const newsId = parseInt(btn.dataset.id);
                this.openNewsPage(newsId);
            });
        });
    }

    // Open news page
    openNewsPage(newsId) {
        const news = this.allNews.find(n => n.id === newsId);
        if (!news) return;

        // Navigate to article page
        window.location.href = `news-article.html?id=${newsId}`;
    }

    // Update active filter
    updateActiveFilter() {
        document.querySelectorAll('.news-filter-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.category === this.currentCategory) {
                tab.classList.add('active');
            }
        });
    }

    // Render archive with real data
    renderArchive() {
        const archiveContainer = document.querySelector('.archive-list');
        if (!archiveContainer) return;

        // Группируем новости по месяцам
        const archiveData = this.groupNewsByMonth();
        
        let html = '';
        archiveData.forEach(monthData => {
            html += `
                <li>
                    <a href="#" class="archive-link" data-month="${monthData.key}">${monthData.name}</a>
                    <span class="archive-count">${monthData.count}</span>
                </li>
            `;
        });

        archiveContainer.innerHTML = html;
        
        // Добавляем обработчики событий для архива
        this.setupArchiveEvents();
    }

    // Группировка новостей по месяцам
    groupNewsByMonth() {
        const months = [
            'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
            'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
        ];

        const monthNames = [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
        ];

        const groupedNews = {};
        
        this.allNews.forEach(news => {
            const date = new Date(news.publishedAt);
            const year = date.getFullYear();
            const month = date.getMonth();
            const key = `${year}-${month}`;
            
            if (!groupedNews[key]) {
                groupedNews[key] = {
                    key: key,
                    name: `${monthNames[month]} ${year}`,
                    count: 0,
                    year: year,
                    month: month
                };
            }
            groupedNews[key].count++;
        });

        // Сортируем по дате (новые сначала) и берем последние 6 месяцев
        return Object.values(groupedNews)
            .sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            })
            .slice(0, 6);
    }

    // Обработчики событий для архива
    setupArchiveEvents() {
        document.querySelectorAll('.archive-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const monthKey = link.dataset.month;
                this.filterByMonth(monthKey);
            });
        });
    }

    // Фильтрация по месяцу
    filterByMonth(monthKey) {
        const [year, month] = monthKey.split('-').map(Number);
        
        this.filteredNews = this.allNews.filter(news => {
            const newsDate = new Date(news.publishedAt);
            return newsDate.getFullYear() === year && newsDate.getMonth() === month;
        });
        
        // Сортируем по дате в убывающем порядке
        this.filteredNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        
        this.currentPage = 1;
        this.currentCategory = 'all';
        this.renderNews();
        this.updateActiveFilter();
        this.scrollToTop();
        
        // Обновляем заголовок фильтра
        this.updateFilterTitle(monthKey);
    }

    // Обновление заголовка фильтра
    updateFilterTitle(monthKey) {
        const monthNames = [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
        ];
        
        const [year, month] = monthKey.split('-').map(Number);
        const monthName = `${monthNames[month]} ${year}`;
        
        // Добавляем кнопку "Показать все" если фильтруем по месяцу
        const filterTabs = document.querySelector('.news-filter-tabs');
        const showAllBtn = document.querySelector('.show-all-btn');
        
        if (!showAllBtn) {
            const showAllButton = document.createElement('button');
            showAllButton.className = 'news-filter-tab show-all-btn';
            showAllButton.textContent = `Архів: ${monthName} (Показати всі)`;
            showAllButton.addEventListener('click', () => {
                this.showAllNews();
                showAllButton.remove();
            });
            filterTabs.appendChild(showAllButton);
        } else {
            showAllBtn.textContent = `Архів: ${monthName} (Показати всі)`;
        }
    }

    // Показать все новости
    showAllNews() {
        this.filteredNews = [...this.allNews];
        // Сортируем по дате в убывающем порядке
        this.filteredNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        this.currentPage = 1;
        this.currentCategory = 'all';
        this.renderNews();
        this.updateActiveFilter();
        this.removeArchiveButton();
    }

    // Удаление кнопки архива
    removeArchiveButton() {
        const showAllBtn = document.querySelector('.show-all-btn');
        if (showAllBtn) {
            showAllBtn.remove();
        }
    }

    // Обработчики событий для последних новостей
    setupRecentNewsEvents() {
        document.querySelectorAll('.recent-article').forEach(article => {
            article.addEventListener('click', (e) => {
                e.preventDefault();
                const newsId = parseInt(article.dataset.id);
                this.openNewsPage(newsId);
            });
        });
    }

    // Update statistics
    updateStats() {
        // Статистика теперь обновляется через renderArchive()
    }

    // Utility functions
    formatDate(dateString) {
        const date = new Date(dateString);
        const months = [
            'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
            'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
        ];
        
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
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

    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    showError(message) {
        const newsContainer = document.querySelector('.main-articles');
        if (newsContainer) {
            newsContainer.innerHTML = `
                <div class="error-message">
                    <h3>Помилка</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="retry-btn">Спробувати знову</button>
                </div>
            `;
        }
    }

    // Public methods for external use
    getNewsById(id) {
        return this.allNews.find(news => news.id === id);
    }

    getNewsByCategory(category) {
        return this.allNews.filter(news => news.category === category);
    }

    getFeaturedNews() {
        return this.allNews.filter(news => news.featured);
    }

    getRecentNews(limit = 5) {
        return this.allNews
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
            .slice(0, limit);
    }
}

// Initialize news manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, что newsLoader загружен
    if (window.newsLoader) {
        window.newsManager = new NewsManager();
    } else {
        console.error('newsLoader не загружен');
    }
}); 