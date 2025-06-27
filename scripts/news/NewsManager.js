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
        this.currentArchiveYear = null; // Текущий год в архиве
        
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
     * Инициализация
     */
    async init() {
        console.log('NewsManager.init() started'); // Отладка
        
        try {
            this.showLoading();
            
            // Загружаем все статьи
            this.allArticles = await this.loader.scanArticles();
            this.filteredArticles = [...this.allArticles];
            
            // Инициализируем пагинацию
            this.pagination = new NewsPagination();
            
            // Рендерим страницу
            await this.render();
            
            // Настраиваем события
            this.setupEvents();
            
            // Обновляем статистику
            await this.updateStats();
            
            this.hideLoading();
            
            console.log('NewsManager initialization completed'); // Отладка
            
        } catch (error) {
            console.error('Failed to initialize NewsManager:', error);
            this.showError('Ошибка загрузки новостей');
        }
    }

    /**
     * Рендерит страницу
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
                onPageChange: (page, newItemsPerPage) => this.handlePageChange(page, newItemsPerPage)
            });
        }

        // Загружаем сайдбар
        await this.renderSidebar();

        // Добавляем анимации
        this.animateArticles();
    }

    /**
     * Обработчик изменения страницы и количества элементов
     */
    async handlePageChange(page, newItemsPerPage = null) {
        if (newItemsPerPage && newItemsPerPage !== this.itemsPerPage) {
            // Изменение количества элементов на странице
            this.itemsPerPage = newItemsPerPage;
            this.currentPage = 1; // Сбрасываем на первую страницу
        } else {
            // Обычная смена страницы
            this.currentPage = page;
        }
        
        await this.render();
        
        // Прокручиваем к началу контента
        const newsContent = document.querySelector('.news-content');
        if (newsContent) {
            newsContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    /**
     * Переход на страницу (для обратной совместимости)
     */
    async goToPage(page) {
        await this.handlePageChange(page);
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
     * Фильтрация по категории
     */
    async filterByCategory(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        // Убираем сброс архивного фильтра - фильтры должны работать вместе
        
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
        // Не сбрасываем другие фильтры при поиске
        
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
        
        // Добавляем обработчики событий для категорий
        this.setupCategoryEvents();
    }

    /**
     * Настройка событий для категорий
     */
    setupCategoryEvents() {
        // Настраиваем события для категорий
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

        // Новый архив использует onclick атрибуты, поэтому дополнительная настройка не нужна
        console.log('Category events setup completed');
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
     * Рендерит улучшенный архив
     */
    renderAdvancedArchive() {
        const archiveData = this.getArchiveData();
        const currentYear = this.currentArchiveYear || new Date().getFullYear();
        const availableYears = archiveData.years;
        const monthsData = archiveData.monthsByYear[currentYear] || [];

        return `
            <div class="sidebar-widget">
                <div class="archive-navigation" data-year="${currentYear}">
                    <div class="archive-header">
                        <h3 class="archive-title">Архів новин</h3>
                        <button class="archive-toggle" onclick="newsManager.toggleArchive()">
                            <span>Згорнути</span>
                            <svg class="archive-toggle-icon" width="12" height="8" viewBox="0 0 12 8">
                                <path d="M1 7L6 2L11 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="year-navigation">
                        <button class="year-nav-btn" onclick="newsManager.changeArchiveYear(${currentYear - 1})" 
                                ${!availableYears.includes(currentYear - 1) ? 'disabled' : ''}>
                            ‹
                        </button>
                        <div class="current-year">${currentYear}</div>
                        <button class="year-nav-btn" onclick="newsManager.changeArchiveYear(${currentYear + 1})" 
                                ${!availableYears.includes(currentYear + 1) ? 'disabled' : ''}>
                            ›
                        </button>
                    </div>
                    
                    <div class="months-grid">
                        ${this.renderMonthsGrid(monthsData, currentYear)}
                    </div>
                    
                    <div class="archive-summary">
                        <div class="summary-stats">
                            <div class="summary-item">
                                <span class="summary-number">${archiveData.totalArticles}</span>
                                <span class="summary-label">Всього</span>
                            </div>
                            <div class="summary-divider"></div>
                            <div class="summary-item">
                                <span class="summary-number">${monthsData.reduce((sum, m) => sum + m.count, 0)}</span>
                                <span class="summary-label">${currentYear}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${this.currentArchiveFilter ? `
                        <button class="clear-archive-filter" onclick="newsManager.clearArchiveFilter()">
                            Показати всі новини
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Рендерит сетку месяцев
     */
    renderMonthsGrid(monthsData, year) {
        const monthNames = [
            'Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер',
            'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'
        ];

        return monthNames.map((name, index) => {
            const month = index + 1;
            const monthData = monthsData.find(m => m.month === month);
            const count = monthData ? monthData.count : 0;
            const dateKey = `${year}-${month}`;
            const isActive = this.currentArchiveFilter === dateKey;
            const isDisabled = count === 0;

            return `
                <div class="month-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}" 
                     onclick="${!isDisabled ? `newsManager.filterByDate('${dateKey}')` : ''}">
                    <span class="month-name">${name}</span>
                    <span class="month-count">${count}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Получает данные архива
     */
    getArchiveData() {
        const monthsByYear = {};
        const years = new Set();
        const monthNames = [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
        ];

        this.allArticles.forEach(article => {
            const date = new Date(article.publishedAt);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;

            years.add(year);

            if (!monthsByYear[year]) {
                monthsByYear[year] = [];
            }

            let monthData = monthsByYear[year].find(m => m.month === month);
            if (!monthData) {
                monthData = {
                    year,
                    month,
                    name: monthNames[month - 1],
                    count: 0
                };
                monthsByYear[year].push(monthData);
            }
            monthData.count++;
        });

        // Сортируем месяцы в каждом году
        Object.keys(monthsByYear).forEach(year => {
            monthsByYear[year].sort((a, b) => a.month - b.month);
        });

        return {
            years: Array.from(years).sort((a, b) => b - a),
            monthsByYear,
            totalArticles: this.allArticles.length
        };
    }

    /**
     * Переключение отображения архива
     */
    toggleArchive() {
        const archiveNav = this.sidebarContainer.querySelector('.archive-navigation');
        if (archiveNav) {
            archiveNav.classList.toggle('collapsed');
            const toggleBtn = archiveNav.querySelector('.archive-toggle span');
            const isCollapsed = archiveNav.classList.contains('collapsed');
            toggleBtn.textContent = isCollapsed ? 'Розгорнути' : 'Згорнути';
        }
    }

    /**
     * Изменение года в архиве
     */
    async changeArchiveYear(year) {
        this.currentArchiveYear = year;
        await this.renderSidebar();
    }

    /**
     * Фильтрация по дате (архив)
     */
    async filterByDate(dateKey) {
        this.currentArchiveFilter = dateKey;
        this.currentPage = 1;
        // Не сбрасываем категорию и поиск при применении архивного фильтра
        
        // Применяем все активные фильтры
        this.applyAllFilters();
        await this.render();
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
            'announcements': 'Анонси/Оголошення',
            'greetings': 'Привітання',
            'results': 'Результати',
            'decisions': 'Рішення',
            'events': 'Події',
            'partnerships': 'Партнерство',
            'federationNews': 'Новини федерації',
            'competitions': 'Змагання',
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

        // Определяем комбинированный заголовок
        let title = 'Новини українського дзюдо';
        let description = 'Стежте за останніми подіями, досягненнями та анонсами Федерації Дзюдо України';
        
        const filters = [];
        
        // Добавляем фильтр по архиву
        if (this.currentArchiveFilter) {
            const [year, month] = this.currentArchiveFilter.split('-').map(Number);
            const monthNames = [
                'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
                'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
            ];
            const monthName = monthNames[month - 1];
            filters.push(`${monthName} ${year}`);
        }
        
        // Добавляем фильтр по категории
        if (this.currentCategory !== 'all') {
            const categoryName = this.getCategoryName(this.currentCategory);
            filters.push(categoryName);
        }
        
        // Добавляем поисковый запрос
        if (this.searchQuery) {
            filters.push(`"${this.searchQuery}"`);
        }
        
        // Формируем заголовок на основе активных фильтров
        if (filters.length > 0) {
            if (filters.length === 1) {
                title = `${filters[0]} - Новини`;
                if (this.searchQuery) {
                    description = `Результати пошуку за запитом "${this.searchQuery}"`;
                } else if (this.currentArchiveFilter) {
                    const [year, month] = this.currentArchiveFilter.split('-').map(Number);
                    const monthNames = [
                        'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
                        'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
                    ];
                    const monthName = monthNames[month - 1];
                    description = `Новини українського дзюдо за ${monthName} ${year} року`;
                } else if (this.currentCategory !== 'all') {
                    const categoryName = this.getCategoryName(this.currentCategory);
                    description = `Останні новини у категорії "${categoryName}"`;
                }
            } else {
                title = `Фільтровані новини: ${filters.join(' • ')}`;
                description = `Новини українського дзюдо з застосованими фільтрами`;
            }
        }
        
        heroTitle.textContent = title;
        heroDescription.textContent = description;
        
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
                label: `${monthName} ${year}`,
                icon: 'calendar',
                action: 'clearArchiveFilter'
            });
        }
        
        if (this.searchQuery) {
            activeFilters.push({
                type: 'search',
                label: `"${this.searchQuery}"`,
                icon: 'search',
                action: 'clearSearch'
            });
        }
        
        if (this.currentCategory !== 'all') {
            const categoryName = this.getCategoryName(this.currentCategory);
            activeFilters.push({
                type: 'category',
                label: categoryName,
                icon: 'folder',
                action: () => this.filterByCategory('all')
            });
        }
        
        // Рендерим фильтр-бар
        if (activeFilters.length > 0) {
            filterBar.innerHTML = `
                <div class="active-filters-header">
                    <h3 class="active-filters-title">Активні фільтри</h3>
                    <p class="active-filters-subtitle">Застосовані фільтри для поточного пошуку</p>
                </div>
                <div class="filter-bar-content">
                    <div class="filter-tags">
                        ${activeFilters.map(filter => `
                            <div class="filter-tag" data-type="${filter.type}">
                                <div class="filter-tag-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        ${this.getFilterIcon(filter.icon)}
                                    </svg>
                                </div>
                                <span class="filter-tag-label">${filter.label}</span>
                                <button class="filter-tag-remove" onclick="newsManager.${typeof filter.action === 'string' ? filter.action + '()' : 'filterByCategory(\'all\')'}" title="Видалити фільтр">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M18 6L6 18M6 6l12 12"/>
                                    </svg>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    <div class="filter-actions">
                        <button class="clear-all-filters" onclick="newsManager.clearAllFilters()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
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
     * Возвращает SVG иконку для типа фильтра
     */
    getFilterIcon(type) {
        const icons = {
            'calendar': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
            'search': '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>',
            'folder': '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'
        };
        return icons[type] || icons['folder'];
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