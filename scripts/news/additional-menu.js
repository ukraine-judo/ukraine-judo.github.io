/**
 * Additional Menu Manager
 * Управление дополнительным меню фильтров и архива
 */
class AdditionalMenuManager {
    constructor() {
        this.isOpen = false;
        this.currentFilters = {
            period: 'all',
            sort: 'date-desc',
            perPage: 6,
            category: 'all'
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadArchiveData();
        this.updateStats();
    }
    
    bindEvents() {
        // Кнопка открытия меню
        const menuBtn = document.getElementById('additionalMenuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => this.openMenu());
        }
        
        // Кнопка закрытия меню
        const closeBtn = document.getElementById('additionalMenuClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeMenu());
        }
        
        // Закрытие по клику на оверлей
        const overlay = document.getElementById('additionalMenuOverlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeMenu();
                }
            });
        }
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeMenu();
            }
        });
        
        // Фильтры по периоду
        document.querySelectorAll('.date-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handlePeriodFilter(e.target);
            });
        });
        
        // Фильтры сортировки
        document.querySelectorAll('.sort-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleSortFilter(e.target);
            });
        });
        
        // Фильтры количества на странице
        document.querySelectorAll('.per-page-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handlePerPageFilter(e.target);
            });
        });
        
        // Фильтры категорий
        document.querySelectorAll('.category-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleCategoryFilter(e.target);
            });
        });
    }
    
    openMenu() {
        const overlay = document.getElementById('additionalMenuOverlay');
        if (overlay) {
            overlay.classList.add('active');
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            
            // Обновляем данные при открытии
            this.updateStats();
            this.loadArchiveData();
        }
    }
    
    closeMenu() {
        const overlay = document.getElementById('additionalMenuOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            this.isOpen = false;
            document.body.style.overflow = '';
        }
    }
    
    handlePeriodFilter(button) {
        // Убираем активный класс с других кнопок
        document.querySelectorAll('.date-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Добавляем активный класс к выбранной кнопке
        button.classList.add('active');
        
        // Сохраняем выбранный период
        this.currentFilters.period = button.dataset.period;
        
        // Применяем фильтр
        this.applyFilters();
    }
    
    handleSortFilter(button) {
        // Убираем активный класс с других кнопок
        document.querySelectorAll('.sort-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Добавляем активный класс к выбранной кнопке
        button.classList.add('active');
        
        // Сохраняем выбранную сортировку
        this.currentFilters.sort = button.dataset.sort;
        
        // Применяем фильтр
        this.applyFilters();
    }
    
    handlePerPageFilter(button) {
        // Убираем активный класс с других кнопок
        document.querySelectorAll('.per-page-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Добавляем активный класс к выбранной кнопке
        button.classList.add('active');
        
        // Сохраняем выбранное количество на странице
        this.currentFilters.perPage = parseInt(button.dataset.perPage);
        
        // Применяем фильтр
        this.applyFilters();
    }
    
    handleCategoryFilter(button) {
        // Убираем активный класс с других кнопок
        document.querySelectorAll('.category-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Добавляем активный класс к выбранной кнопке
        button.classList.add('active');
        
        // Сохраняем выбранную категорию
        this.currentFilters.category = button.dataset.category;
        
        // Применяем фильтр
        this.applyFilters();
    }
    
    applyFilters() {
        // Если есть глобальный менеджер новостей, применяем фильтры
        if (window.newsManager) {
            // Применяем фильтры к менеджеру новостей
            this.applyFiltersToNewsManager();
        }
        
        // Сохраняем фильтры в localStorage
        this.saveFilters();
    }
    
    applyFiltersToNewsManager() {
        const newsManager = window.newsManager;
        
        // Сбрасываем фильтры к исходным данным
        newsManager.filteredArticles = [...newsManager.allArticles];
        
        // Применяем фильтр по категории
        if (this.currentFilters.category !== 'all') {
            newsManager.filteredArticles = newsManager.filteredArticles.filter(article => 
                article.category === this.currentFilters.category
            );
        }
        
        // Применяем фильтр по периоду
        if (this.currentFilters.period !== 'all') {
            this.applyPeriodFilter(newsManager);
        }
        
        // Применяем сортировку
        this.applySorting(newsManager);
        
        // Применяем количество на странице
        if (newsManager.itemsPerPage !== this.currentFilters.perPage) {
            newsManager.itemsPerPage = this.currentFilters.perPage;
            newsManager.currentPage = 1; // Сбрасываем на первую страницу
        }
        
        // Перерендериваем
        newsManager.render();
    }
    
    applyPeriodFilter(newsManager) {
        const now = new Date();
        const period = this.currentFilters.period;
        
        let startDate = null;
        
        switch (period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
        }
        
        if (startDate) {
            newsManager.filteredArticles = newsManager.allArticles.filter(article => {
                const articleDate = new Date(article.publishedAt);
                return articleDate >= startDate;
            });
        }
    }
    
    applySorting(newsManager) {
        const sortType = this.currentFilters.sort;
        
        switch (sortType) {
            case 'date-desc':
                newsManager.filteredArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
                break;
            case 'date-asc':
                newsManager.filteredArticles.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
                break;
            case 'title-asc':
                newsManager.filteredArticles.sort((a, b) => a.title.localeCompare(b.title, 'uk'));
                break;
            case 'title-desc':
                newsManager.filteredArticles.sort((a, b) => b.title.localeCompare(a.title, 'uk'));
                break;
        }
    }
    
    async loadArchiveData() {
        try {
            // Если есть менеджер новостей, используем его данные
            if (window.newsManager && window.newsManager.allArticles) {
                this.renderArchiveFromData(window.newsManager.allArticles);
            } else {
                // Иначе загружаем данные самостоятельно
                const loader = new NewsLoader();
                const articles = await loader.scanArticles();
                this.renderArchiveFromData(articles);
            }
        } catch (error) {
            console.warn('Failed to load archive data:', error);
        }
    }
    
    renderArchiveFromData(articles) {
        const archiveContainer = document.getElementById('archiveNavigation');
        if (!archiveContainer) return;
        
        // Группируем статьи по годам и месяцам
        const archiveData = this.groupArticlesByDate(articles);
        
        let archiveHTML = '';
        
        Object.keys(archiveData).sort((a, b) => b - a).forEach(year => {
            archiveHTML += `<div class="archive-year-group">`;
            archiveHTML += `<h5 class="archive-year">${year}</h5>`;
            archiveHTML += `<div class="archive-months">`;
            
            Object.keys(archiveData[year]).sort((a, b) => b - a).forEach(month => {
                const monthName = this.getMonthName(month);
                const count = archiveData[year][month].length;
                const dateKey = `${year}-${month}`;
                
                archiveHTML += `
                    <div class="archive-month-item">
                        <a href="#" class="archive-month-link" data-date="${dateKey}">
                            <span class="archive-month-name">${monthName}</span>
                            <span class="archive-month-count">${count}</span>
                        </a>
                    </div>
                `;
            });
            
            archiveHTML += `</div>`;
            archiveHTML += `</div>`;
        });
        
        archiveContainer.innerHTML = archiveHTML;
        
        // Добавляем обработчики для ссылок архива
        this.bindArchiveEvents();
    }
    
    groupArticlesByDate(articles) {
        const archive = {};
        
        articles.forEach(article => {
            const date = new Date(article.publishedAt);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            
            if (!archive[year]) {
                archive[year] = {};
            }
            
            if (!archive[year][month]) {
                archive[year][month] = [];
            }
            
            archive[year][month].push(article);
        });
        
        return archive;
    }
    
    getMonthName(month) {
        const months = [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
        ];
        return months[month - 1];
    }
    
    bindArchiveEvents() {
        document.querySelectorAll('.archive-month-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const dateKey = e.target.closest('.archive-month-link').dataset.date;
                this.handleArchiveClick(dateKey);
            });
        });
    }
    
    handleArchiveClick(dateKey) {
        if (window.newsManager) {
            // Применяем архивный фильтр через менеджер новостей
            window.newsManager.filterByDate(dateKey);
        }
        
        // Закрываем меню
        this.closeMenu();
    }
    
    async updateStats() {
        try {
            let totalArticles = 0;
            let thisMonthArticles = 0;
            
            if (window.newsManager && window.newsManager.allArticles) {
                totalArticles = window.newsManager.allArticles.length;
                
                // Подсчитываем статьи за текущий месяц
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth() + 1;
                
                thisMonthArticles = window.newsManager.allArticles.filter(article => {
                    const date = new Date(article.publishedAt);
                    return date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth;
                }).length;
            } else {
                // Загружаем данные самостоятельно
                const loader = new NewsLoader();
                const articles = await loader.scanArticles();
                totalArticles = articles.length;
                
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = now.getMonth() + 1;
                
                thisMonthArticles = articles.filter(article => {
                    const date = new Date(article.publishedAt);
                    return date.getFullYear() === currentYear && date.getMonth() + 1 === currentMonth;
                }).length;
            }
            
            // Обновляем статистику в меню
            const totalElement = document.getElementById('menuTotalArticles');
            const monthElement = document.getElementById('menuThisMonth');
            
            if (totalElement) totalElement.textContent = totalArticles;
            if (monthElement) monthElement.textContent = thisMonthArticles;
            
        } catch (error) {
            console.warn('Failed to update stats:', error);
        }
    }
    
    saveFilters() {
        localStorage.setItem('newsFilters', JSON.stringify(this.currentFilters));
    }
    
    loadFilters() {
        const saved = localStorage.getItem('newsFilters');
        if (saved) {
            this.currentFilters = { ...this.currentFilters, ...JSON.parse(saved) };
            this.applySavedFilters();
        }
    }
    
    applySavedFilters() {
        // Применяем сохраненные фильтры к UI
        const periodBtn = document.querySelector(`[data-period="${this.currentFilters.period}"]`);
        const sortBtn = document.querySelector(`[data-sort="${this.currentFilters.sort}"]`);
        const perPageBtn = document.querySelector(`[data-per-page="${this.currentFilters.perPage}"]`);
        const categoryBtn = document.querySelector(`[data-category="${this.currentFilters.category}"]`);
        
        if (periodBtn) periodBtn.classList.add('active');
        if (sortBtn) sortBtn.classList.add('active');
        if (perPageBtn) perPageBtn.classList.add('active');
        if (categoryBtn) categoryBtn.classList.add('active');
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.additionalMenuManager = new AdditionalMenuManager();
}); 