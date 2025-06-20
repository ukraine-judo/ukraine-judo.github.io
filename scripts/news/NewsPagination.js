/**
 * NewsPagination - Улучшенная система пагинации
 * Отвечает за отображение и управление пагинацией новостей
 */
class NewsPagination {
    constructor(containerId = '.pagination') {
        this.container = document.querySelector(containerId);
        this.options = {
            currentPage: 1,
            totalItems: 0,
            itemsPerPage: 6,
            visiblePages: 5,
            onPageChange: null
        };
    }

    /**
     * Рендерит пагинацию
     */
    render(options = {}) {
        this.options = { ...this.options, ...options };
        
        // Обновляем контейнер если передан новый
        if (options.containerId) {
            this.container = document.querySelector(options.containerId);
        }
        
        if (!this.container) {
            console.warn('Pagination container not found');
            return;
        }
        
        const totalPages = Math.ceil(this.options.totalItems / this.options.itemsPerPage);
        
        // Если страница одна или меньше - скрываем пагинацию
        if (totalPages <= 1) {
            this.hide();
            return;
        }

        this.container.innerHTML = this.generatePaginationHTML(totalPages);
        this.setupEvents();
        this.show();
    }

    /**
     * Генерирует HTML для пагинации
     */
    generatePaginationHTML(totalPages) {
        const { currentPage } = this.options;
        let html = '';

        // Кнопка "Назад"
        if (currentPage > 1) {
            html += `<a href="#" class="pagination-btn" data-page="${currentPage - 1}">‹</a>`;
        }

        // Номера страниц
        const pages = this.getVisiblePages(currentPage, totalPages);
        
        pages.forEach(page => {
            if (page === '...') {
                html += '<span class="pagination-ellipsis">...</span>';
            } else {
                const isActive = page === currentPage;
                if (isActive) {
                    html += `<span class="pagination-current">${page}</span>`;
                } else {
                    html += `<a href="#" class="pagination-number" data-page="${page}">${page}</a>`;
                }
            }
        });

        // Кнопка "Далее"
        if (currentPage < totalPages) {
            html += `<a href="#" class="pagination-btn" data-page="${currentPage + 1}">›</a>`;
        }

        return html;
    }

    /**
     * Получить видимые страницы (упрощенная логика)
     */
    getVisiblePages(currentPage, totalPages) {
        const pages = [];
        const { visiblePages } = this.options;
        
        // Если страниц мало, показываем все
        if (totalPages <= visiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
            return pages;
        }

        // Всегда показываем первую
        pages.push(1);

        // Определяем начало и конец диапазона
        let start = Math.max(2, currentPage - 1);
        let end = Math.min(totalPages - 1, currentPage + 1);

        // Расширяем диапазон если нужно
        if (currentPage <= 3) {
            end = Math.min(totalPages - 1, 4);
        }
        if (currentPage >= totalPages - 2) {
            start = Math.max(2, totalPages - 3);
        }

        // Добавляем многоточие в начале если нужно
        if (start > 2) {
            pages.push('...');
        }

        // Добавляем страницы в диапазоне
        for (let i = start; i <= end; i++) {
            if (i !== 1 && i !== totalPages) {
                pages.push(i);
            }
        }

        // Добавляем многоточие в конце если нужно
        if (end < totalPages - 1) {
            pages.push('...');
        }

        // Всегда показываем последнюю (если она не первая)
        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    }

    /**
     * Настройка событий пагинации
     */
    setupEvents() {
        if (!this.container) return;

        // Удаляем старые обработчики
        this.container.removeEventListener('click', this.handleClick);
        
        // Привязываем новый обработчик
        this.handleClick = (e) => {
            if (e.target.tagName === 'A' && e.target.dataset.page) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page && page !== this.options.currentPage) {
                    console.log('Pagination: changing to page', page);
                    this.options.currentPage = page;
                    if (this.options.onPageChange) {
                        this.options.onPageChange(page);
                    }
                }
            }
        };

        this.container.addEventListener('click', this.handleClick);
    }

    /**
     * Показать пагинацию
     */
    show() {
        if (this.container) {
            this.container.style.display = 'flex';
        }
    }

    /**
     * Скрыть пагинацию
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * Получить текущую страницу
     */
    getCurrentPage() {
        return this.options.currentPage;
    }

    /**
     * Получить общее количество страниц
     */
    getTotalPages() {
        return Math.ceil(this.options.totalItems / this.options.itemsPerPage);
    }

    /**
     * Установить новые опции
     */
    setOptions(options) {
        this.options = { ...this.options, ...options };
    }

    /**
     * Обновить количество элементов
     */
    updateTotalItems(totalItems) {
        this.options.totalItems = totalItems;
        this.render(this.options);
    }

    /**
     * Перейти на страницу
     */
    goToPage(page) {
        const totalPages = this.getTotalPages();
        if (page >= 1 && page <= totalPages && page !== this.options.currentPage) {
            this.options.currentPage = page;
            if (this.options.onPageChange) {
                this.options.onPageChange(page);
            }
            this.render(this.options);
        }
    }
}

// Экспорт
if (typeof window !== 'undefined') {
    window.NewsPagination = NewsPagination;
} 