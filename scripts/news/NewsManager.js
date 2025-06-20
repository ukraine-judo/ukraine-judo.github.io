/**
 * NewsManager - Управление отображением списка новостей
 * Отвечает за рендеринг, фильтрацию и пагинацию новостей
 */
class NewsManager {
    constructor(containerId = '.main-articles') {
        this.container = document.querySelector(containerId);
        this.loader = new NewsLoader();
        this.pagination = new NewsPagination();
        
        // Состояние
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.currentCategory = 'all';
        this.searchQuery = '';
        this.allArticles = [];
        this.filteredArticles = [];
        this.currentArchiveFilter = null; // Текущий фильтр по архиву
        
        // Элементы управления
        this.loadingElement = document.querySelector('.loading-overlay');
        this.errorElement = document.querySelector('.error-message');
        this.categoryTabs = document.querySelectorAll('.news-filter-tab');
        this.searchInput = document.querySelector('.news-search');
        this.searchClearBtn = document.querySelector('.search-clear-btn');
        this.paginationContainer = null; // Будет создан динамически
        this.sidebarContainer = document.querySelector('.news-sidebar');
        this.statsElements = {
            total: document.getElementById('total-articles'),
            thisMonth: document.getElementById('this-month')
        };
    }

    /**
     * Инициализация системы новостей
     */
    async init() {
        try {
            this.showLoading();
            
            // Загружаем все статьи для кеширования
            this.allArticles = await this.loader.scanArticles();
            this.filteredArticles = [...this.allArticles];
            
            // Обновляем статистику
            await this.updateStats();
            
            // Рендерим первую страницу
            await this.render();
            
            // Настраиваем события
            this.setupEvents();
            
            this.hideLoading();
            
        } catch (error) {
            console.error('NewsManager initialization failed:', error);
            this.showError('Помилка завантаження новин');
        }
    }

    /**
     * Рендерит текущую страницу новостей
     */
    async render() {
        if (!this.container) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const articles = this.filteredArticles.slice(startIndex, startIndex + this.itemsPerPage);

        // Обновляем заголовок страницы
        this.updatePageTitle();

        if (articles.length === 0) {
            this.renderEmpty();
            return;
        }

        // Рендерим все статьи одинаково
        let html = '';
        articles.forEach((article) => {
            html += this.renderArticleCard(article, false);
        });
        
        // Добавляем контейнер для пагинации в конце
        html += '<div class="pagination" style="display: none;"></div>';
        
        this.container.innerHTML = html;
        
        // Обновляем ссылку на контейнер пагинации после перерендера
        this.paginationContainer = this.container.querySelector('.pagination');
        
        // Рендерим пагинацию
        if (this.paginationContainer) {
            this.pagination.render({
                currentPage: this.currentPage,
                totalItems: this.filteredArticles.length,
                itemsPerPage: this.itemsPerPage,
                containerId: '.main-articles .pagination',
                onPageChange: (page) => this.goToPage(page)
            });
        }

        // Загружаем сайдбар
        await this.renderSidebar();

        // Добавляем анимации
        this.animateArticles();
    }

    /**
     * Рендерит карточку статьи
     */
    renderArticleCard(article, isFeatured = false) {
        const imageUrl = article.image?.url || article.image || '';
        const categoryName = this.getCategoryName(article.category);
        const formattedDate = this.formatDate(article.publishedAt);
        const articleUrl = `news-article.html?id=${article.slugId}`;

        if (isFeatured) {
            return `
                <article class="featured-article" data-category="${article.category}">
                    <div class="article-image">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${article.title}" loading="lazy">` : ''}
                    </div>
                    <div class="article-content">
                        <span class="article-category">${categoryName}</span>
                        <h2 class="article-title">${article.title}</h2>
                        <p class="article-excerpt">${article.excerpt}</p>
                        <div class="article-meta">
                            <span class="article-date">${formattedDate}</span>
                            <a href="${articleUrl}" class="read-more-btn">Читати далі</a>
                        </div>
                    </div>
                </article>
            `;
        } else {
            return `
                <article class="regular-article" data-category="${article.category}">
                    <div class="article-image">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${article.title}" loading="lazy">` : '<div class="article-image-placeholder"></div>'}
                    </div>
                    <div class="article-content">
                        <span class="article-category">${categoryName}</span>
                        <h3 class="article-title">${article.title}</h3>
                        <p class="article-excerpt">${article.excerpt}</p>
                        <div class="article-meta">
                            <span class="article-date">${formattedDate}</span>
                            <a href="${articleUrl}" class="read-more-btn">Читати далі</a>
                        </div>
                    </div>
                </article>
            `;
        }
    }

    /**
     * Рендерит состояние "нет новостей"
     */
    renderEmpty() {
        let message = '';
        let resetButton = '';
        
        if (this.currentArchiveFilter) {
            const [year, month] = this.currentArchiveFilter.split('-').map(Number);
            const monthNames = [
                'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
                'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
            ];
            const monthName = monthNames[month - 1];
            message = `В архіві за ${monthName} ${year} новини відсутні`;
            resetButton = '<button class="btn btn-outline" onclick="newsManager.clearArchiveFilter()">Показати всі новини</button>';
        } else if (this.searchQuery) {
            message = `За запитом "${this.searchQuery}" нічого не знайдено`;
            resetButton = '<button class="btn btn-outline" onclick="newsManager.clearSearch()">Скинути пошук</button>';
        } else {
            message = 'Новини в цій категорії поки відсутні';
        }

        this.container.innerHTML = `
            <div class="news-empty">
                <div class="news-empty-icon">📰</div>
                <h3>Новини не знайдено</h3>
                <p>${message}</p>
                ${resetButton}
            </div>
            <div class="pagination" style="display: none;"></div>
        `;

        // Обновляем ссылку на контейнер пагинации
        this.paginationContainer = this.container.querySelector('.pagination');

        // Скрываем пагинацию
        this.pagination.hide();
    }

    /**
     * Фильтрация по категориям
     */
    async filterByCategory(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        this.currentArchiveFilter = null; // Сбрасываем архивный фильтр
        
        // Применяем все активные фильтры
        this.applyAllFilters();
        this.updateActiveTab(category);
        await this.render();
    }

    /**
     * Поиск по тексту
     */
    async search(query) {
        this.searchQuery = query.toLowerCase().trim();
        this.currentPage = 1;
        
        // Применяем все активные фильтры
        this.applyAllFilters();
        await this.render();
    }

    /**
     * Применяет все активные фильтры (категория, архив, поиск)
     */
    applyAllFilters() {
        // Начинаем со всех статей
        this.filteredArticles = [...this.allArticles];
        
        // Применяем фильтр по категории
        if (this.currentCategory !== 'all') {
            this.filteredArticles = this.filteredArticles.filter(article => 
                article.category === this.currentCategory
            );
        }
        
        // Применяем фильтр по архиву
        if (this.currentArchiveFilter) {
            const [year, month] = this.currentArchiveFilter.split('-').map(Number);
            this.filteredArticles = this.filteredArticles.filter(article => {
                const date = new Date(article.publishedAt);
                return date.getFullYear() === year && (date.getMonth() + 1) === month;
            });
        }
        
        // Применяем поисковый фильтр
        this.applySearch();
    }

    /**
     * Применяет поисковый фильтр
     */
    applySearch() {
        if (!this.searchQuery) return;
        
        this.filteredArticles = this.filteredArticles.filter(article => 
            article.title.toLowerCase().includes(this.searchQuery) ||
            article.excerpt.toLowerCase().includes(this.searchQuery) ||
            (article.tags && article.tags.some(tag => 
                tag.toLowerCase().includes(this.searchQuery)
            ))
        );
    }

    /**
     * Рендерит сайдбар
     */
    async renderSidebar() {
        if (!this.sidebarContainer) return;

        const latestArticles = this.allArticles
            .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
            .slice(0, 5);
        
        const archiveByMonth = this.getArchiveByMonth();
        const categories = this.getCategories();

        const sidebarHTML = `
            <div class="sidebar-widget">
                <h3>Останні новини</h3>
                <div class="latest-news">
                    ${latestArticles.map(article => `
                        <div class="latest-news-item">
                            <a href="news-article.html?id=${article.slugId}">
                                <h4>${article.title}</h4>
                                <span class="date">${this.formatDate(article.publishedAt)}</span>
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="sidebar-widget">
                <h3>Категорії</h3>
                <div class="categories-list">
                    ${categories.map(cat => `
                        <div class="category-item">
                            <a href="#" data-category="${cat.id}">
                                ${cat.name} (${cat.count})
                            </a>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="sidebar-widget">
                <h3>Архів новин</h3>
                <div class="archive-list">
                    ${archiveByMonth.map(month => {
                        const dateKey = `${month.year}-${month.month}`;
                        const isActive = this.currentArchiveFilter === dateKey;
                        return `
                            <div class="archive-item ${isActive ? 'active' : ''}">
                                <a href="#" data-date="${dateKey}">
                                    ${month.name} ${month.year} (${month.count})
                                </a>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <div class="sidebar-widget">
                <h3>Наші партнери</h3>
                <div class="sponsors-grid">
                    <div class="sponsor-item">
                        <img src="assets/TAS_logo.png" alt="TAS" class="sponsor-logo">
                    </div>
                    <div class="sponsor-item">
                        <img src="assets/etg-logo.png" alt="ETG" class="sponsor-logo">
                    </div>
                    <div class="sponsor-item">
                        <img src="assets/frutex-logo.png" alt="Frutex" class="sponsor-logo">
                    </div>
                    <div class="sponsor-item">
                        <img src="assets/leon-logo.png" alt="Leon" class="sponsor-logo">
                    </div>
                    <div class="sponsor-item">
                        <img src="assets/mir-logo.png" alt="Mir" class="sponsor-logo">
                    </div>
                    <div class="sponsor-item">
                        <img src="assets/petrikiv-logo.png" alt="Petrikiv" class="sponsor-logo">
                    </div>
                </div>
            </div>
        `;

        this.sidebarContainer.innerHTML = sidebarHTML;
        
        // Добавляем обработчики событий для архива
        this.setupArchiveEvents();
    }

    /**
     * Настройка событий для архива
     */
    setupArchiveEvents() {
        const archiveLinks = this.sidebarContainer.querySelectorAll('.archive-item a');
        console.log('Setting up archive events for', archiveLinks.length, 'links');
        
        archiveLinks.forEach(link => {
            const dateKey = link.getAttribute('data-date');
            console.log('Setting up event for date:', dateKey);
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Archive link clicked for date:', dateKey);
                if (dateKey) {
                    this.filterByDate(dateKey);
                }
            });
        });

        // Также настраиваем события для категорий
        const categoryLinks = this.sidebarContainer.querySelectorAll('.category-item a');
        console.log('Setting up category events for', categoryLinks.length, 'links');
        
        categoryLinks.forEach(link => {
            const category = link.getAttribute('data-category');
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Category link clicked for:', category);
                if (category) {
                    this.filterByCategory(category);
                }
            });
        });
    }

    /**
     * Получает архив по месяцам
     */
    getArchiveByMonth() {
        const months = {};
        const monthNames = [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
        ];

        this.allArticles.forEach(article => {
            const date = new Date(article.publishedAt);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const key = `${year}-${month}`;

            if (!months[key]) {
                months[key] = {
                    year,
                    month,
                    name: monthNames[month - 1],
                    count: 0
                };
            }
            months[key].count++;
        });

        return Object.values(months).sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });
    }

    /**
     * Получает категории с количеством
     */
    getCategories() {
        const categories = {};
        
        this.allArticles.forEach(article => {
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
     * Фильтрация по дате
     */
    async filterByDate(dateKey) {
        console.log('filterByDate called with:', dateKey);
        
        // Устанавливаем текущий архивный фильтр
        this.currentArchiveFilter = dateKey;
        
        console.log('Filtering articles for date:', dateKey);
        
        // Сбрасываем категорию на "все" при фильтрации по архиву
        this.currentCategory = 'all';
        this.currentPage = 1;
        // НЕ сбрасываем поиск - пользователь может хотеть найти что-то в выбранном месяце
        
        // Применяем все активные фильтры
        this.applyAllFilters();

        console.log('Filtered articles count:', this.filteredArticles.length);

        // Обновляем UI
        this.updateActiveTab('all');
        
        await this.render();
        
        // Прокручиваем к началу
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Переход на страницу
     */
    async goToPage(page) {
        this.currentPage = page;
        await this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Очистка поиска
     */
    async clearSearch() {
        this.searchQuery = '';
        
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        
        // Применяем все активные фильтры (кроме поиска)
        this.applyAllFilters();
        
        await this.render();
    }

    /**
     * Очистка архивного фильтра
     */
    async clearArchiveFilter() {
        this.currentArchiveFilter = null;
        this.currentPage = 1;
        
        // Применяем все активные фильтры (кроме архива)
        this.applyAllFilters();
        
        await this.render();
    }

    /**
     * Обновление статистики
     */
    async updateStats() {
        try {
            const stats = await this.loader.getStats();
            
            if (this.statsElements.total) {
                this.statsElements.total.textContent = stats.total;
            }
            
            if (this.statsElements.thisMonth) {
                this.statsElements.thisMonth.textContent = stats.thisMonth;
            }
        } catch (error) {
            console.warn('Failed to update stats:', error);
        }
    }

    /**
     * Настройка событий
     */
    setupEvents() {
        // Фильтры категорий
        this.categoryTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.filterByCategory(tab.dataset.category);
            });
        });

        // Поиск
        if (this.searchInput) {
            let searchTimeout;
            this.searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.search(e.target.value);
                }, 300);
            });
        }
    }

    /**
     * Обновление активной вкладки
     */
    updateActiveTab(category) {
        this.categoryTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });
    }

    /**
     * Анимации для статей
     */
    animateArticles() {
        const articles = this.container.querySelectorAll('.news-card');
        articles.forEach((article, index) => {
            article.style.opacity = '0';
            article.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                article.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                article.style.opacity = '1';
                article.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    /**
     * Показать загрузку
     */
    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'flex';
        }
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * Скрыть загрузку
     */
    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
        if (this.container) {
            this.container.style.display = 'grid';
        }
    }

    /**
     * Показать ошибку
     */
    showError(message) {
        this.hideLoading();
        if (this.errorElement) {
            this.errorElement.textContent = message;
            this.errorElement.style.display = 'block';
        }
    }

    /**
     * Вспомогательные методы
     */
    getCategoryName(category) {
        const categories = {
            'achievements': 'Досягнення',
            'competitions': 'Змагання', 
            'events': 'Події',
            'announcements': 'Анонси',
            'interviews': 'Інтерв\'ю',
            'education': 'Освіта'
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

    /**
     * Обновляет заголовок страницы в зависимости от фильтров
     */
    updatePageTitle() {
        const heroTitle = document.querySelector('.hero-title');
        const heroDescription = document.querySelector('.hero-description');
        
        if (!heroTitle || !heroDescription) return;

        if (this.currentArchiveFilter) {
            const [year, month] = this.currentArchiveFilter.split('-').map(Number);
            const monthNames = [
                'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
                'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
            ];
            const monthName = monthNames[month - 1];
            heroTitle.textContent = `Архів новин - ${monthName} ${year}`;
            heroDescription.textContent = `Новини українського дзюдо за ${monthName} ${year} року`;
        } else if (this.searchQuery) {
            heroTitle.textContent = `Пошук: "${this.searchQuery}"`;
            heroDescription.textContent = `Результати пошуку за запитом "${this.searchQuery}"`;
        } else if (this.currentCategory !== 'all') {
            const categoryName = this.getCategoryName(this.currentCategory);
            heroTitle.textContent = `${categoryName} - Новини`;
            heroDescription.textContent = `Останні новини у категорії "${categoryName}"`;
        } else {
            heroTitle.textContent = 'Новини українського дзюдо';
            heroDescription.textContent = 'Стежте за останніми подіями, досягненнями та анонсами Федерації Дзюдо України';
        }
        
        // Добавляем или обновляем фильтр-бар
        this.updateFilterBar();
    }

    /**
     * Обновляет панель активных фильтров
     */
    updateFilterBar() {
        // Ищем или создаем контейнер для фильтр-бара
        let filterBar = document.querySelector('.active-filters-bar');
        const newsContent = document.querySelector('.news-content .container');
        
        if (!filterBar && newsContent) {
            filterBar = document.createElement('div');
            filterBar.className = 'active-filters-bar';
            
            // Вставляем после фильтров, но перед grid
            const newsGrid = document.querySelector('.news-grid');
            newsContent.insertBefore(filterBar, newsGrid);
        }
        
        if (!filterBar) return;
        
        // Собираем активные фильтры
        const activeFilters = [];
        
        if (this.currentArchiveFilter) {
            const [year, month] = this.currentArchiveFilter.split('-').map(Number);
            const monthNames = [
                'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
                'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
            ];
            const monthName = monthNames[month - 1];
            activeFilters.push({
                type: 'archive',
                label: `📅 ${monthName} ${year}`,
                action: 'clearArchiveFilter'
            });
        }
        
        if (this.searchQuery) {
            activeFilters.push({
                type: 'search',
                label: `🔍 "${this.searchQuery}"`,
                action: 'clearSearch'
            });
        }
        
        if (this.currentCategory !== 'all') {
            const categoryName = this.getCategoryName(this.currentCategory);
            activeFilters.push({
                type: 'category',
                label: `📂 ${categoryName}`,
                action: () => this.filterByCategory('all')
            });
        }
        
        // Рендерим фильтр-бар
        if (activeFilters.length > 0) {
            filterBar.innerHTML = `
                <div class="filter-bar-content">
                    <span class="filter-bar-label">Активні фільтри:</span>
                    <div class="filter-tags">
                        ${activeFilters.map(filter => `
                            <div class="filter-tag">
                                <span class="filter-tag-label">${filter.label}</span>
                                <button class="filter-tag-remove" onclick="newsManager.${typeof filter.action === 'string' ? filter.action + '()' : 'filterByCategory(\'all\')'}" title="Видалити фільтр">
                                    ✕
                                </button>
                            </div>
                        `).join('')}
                        <button class="clear-all-filters" onclick="newsManager.clearAllFilters()">
                            Скинути всі фільтри
                        </button>
                    </div>
                </div>
            `;
            filterBar.style.display = 'block';
        } else {
            filterBar.style.display = 'none';
        }
    }

    /**
     * Очищает все фильтры
     */
    async clearAllFilters() {
        this.currentCategory = 'all';
        this.currentArchiveFilter = null;
        this.searchQuery = '';
        this.currentPage = 1;
        
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        
        // Применяем "чистые" фильтры (все сброшены)
        this.applyAllFilters();
        this.updateActiveTab('all');
        await this.render();
    }
}

// Экспорт
if (typeof window !== 'undefined') {
    window.NewsManager = NewsManager;
} 