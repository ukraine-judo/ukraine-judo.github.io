/**
 * NewsPagination - Современная система пагинации
 * Отвечает за отображение и управление пагинацией новостей
 */
class NewsPagination {
    constructor(containerId = '.pagination') {
        this.container = document.querySelector(containerId);
        this.options = {
            currentPage: 1,
            totalItems: 0,
            itemsPerPage: 6,
            visiblePages: 4,
            onPageChange: null,
            showInfo: false,
            showPerPage: true
        };
        this.handleClick = null;
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
        const { currentPage, totalItems, itemsPerPage } = this.options;
        const isMobile = window.innerWidth <= 480;
        
        let html = '<div class="pagination-wrapper">';
        
        // Основная пагинация
        html += '<div class="pagination-controls">';
        
        // Кнопка "Первая страница" (скрыта на мобильных)
        if (currentPage > 1 && !isMobile) {
            html += `
                <a href="#" class="pagination-btn pagination-first" data-page="1" title="Перша сторінка">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="11,17 6,12 11,7"/>
                        <polyline points="17,17 12,12 17,7"/>
                    </svg>
                </a>
            `;
        }
        
        // Кнопка "Назад"
        if (currentPage > 1) {
            html += `
                <a href="#" class="pagination-btn pagination-prev" data-page="${currentPage - 1}" title="Попередня сторінка">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15,18 9,12 15,6"/>
                    </svg>
                </a>
            `;
        }

        // Номера страниц
        const pages = this.getVisiblePages(currentPage, totalPages, isMobile);
        
        pages.forEach(page => {
            if (page === '...') {
                html += '<span class="pagination-ellipsis">•••</span>';
            } else {
                const isActive = page === currentPage;
                if (isActive) {
                    html += `<span class="pagination-current" aria-current="page">${page}</span>`;
                } else {
                    html += `<a href="#" class="pagination-number" data-page="${page}" title="Сторінка ${page}">${page}</a>`;
                }
            }
        });

        // Кнопка "Далее"
        if (currentPage < totalPages) {
            html += `
                <a href="#" class="pagination-btn pagination-next" data-page="${currentPage + 1}" title="Наступна сторінка">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9,18 15,12 9,6"/>
                    </svg>
                </a>
            `;
        }
        
        // Кнопка "Последняя страница" (скрыта на мобильных)
        if (currentPage < totalPages && !isMobile) {
            html += `
                <a href="#" class="pagination-btn pagination-last" data-page="${totalPages}" title="Остання сторінка">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="13,17 18,12 13,7"/>
                        <polyline points="7,17 12,12 7,7"/>
                    </svg>
                </a>
            `;
        }
        
        html += '</div>';
        
        // Селектор количества на странице
        if (this.options.showPerPage) {
            html += `
                <div class="pagination-per-page">
                    <label for="per-page-select">На сторінці:</label>
                    <select id="per-page-select" class="per-page-select">
                        <option value="6" ${itemsPerPage === 6 ? 'selected' : ''}>6</option>
                        <option value="12" ${itemsPerPage === 12 ? 'selected' : ''}>12</option>
                        <option value="18" ${itemsPerPage === 18 ? 'selected' : ''}>18</option>
                        <option value="24" ${itemsPerPage === 24 ? 'selected' : ''}>24</option>
                    </select>
                </div>
            `;
        }
        
        html += '</div>';
        
        return html;
    }

    /**
     * Получить видимые страницы с улучшенной логикой
     */
    getVisiblePages(currentPage, totalPages, isMobile = false) {
        const pages = [];
        const { visiblePages } = this.options;
        
        // Если страниц мало, показываем все
        if (totalPages <= visiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
            return pages;
        }

        // Упрощенная логика для мобильных устройств
        if (isMobile) {
            if (currentPage <= 2) {
                // В начале: показываем 1, 2, 3
                for (let i = 1; i <= 3; i++) {
                    pages.push(i);
                }
                if (totalPages > 3) {
                    pages.push('...');
                    pages.push(totalPages);
                }
            } else if (currentPage >= totalPages - 1) {
                // В конце: показываем первую + 2 последние
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 2; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                // В середине: показываем первую + текущую и соседние + последнюю
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                if (currentPage + 1 < totalPages) {
                    pages.push('...');
                    pages.push(totalPages);
                }
            }
            return pages;
        }

        // Логика для десктопа (4 страницы)
        if (currentPage <= 2) {
            // В начале: показываем 1, 2, 3, 4 + последнюю
            for (let i = 1; i <= 4; i++) {
                pages.push(i);
            }
            if (totalPages > 4) {
                pages.push('...');
                pages.push(totalPages);
            }
        } else if (currentPage >= totalPages - 1) {
            // В конце: показываем первую + 3 последние
            pages.push(1);
            pages.push('...');
            for (let i = totalPages - 3; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // В середине: показываем первую + текущую и 2 соседние + последнюю
            pages.push(1);
            pages.push('...');
            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                pages.push(i);
            }
            if (currentPage + 1 < totalPages) {
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    }

    /**
     * Настройка событий пагинации
     */
    setupEvents() {
        if (!this.container) return;

        // Удаляем старые обработчики
        if (this.handleClick) {
            this.container.removeEventListener('click', this.handleClick);
        }
        
        // Привязываем новый обработчик
        this.handleClick = (e) => {
            e.preventDefault();
            
            // Обработка кнопок пагинации
            if (e.target.tagName === 'A' && e.target.dataset.page) {
                const page = parseInt(e.target.dataset.page);
                if (page && page !== this.options.currentPage) {
                    this.goToPage(page);
                }
            }
            
            // Обработка селектора количества на странице
            if (e.target.id === 'per-page-select') {
                const newPerPage = parseInt(e.target.value);
                if (newPerPage !== this.options.itemsPerPage) {
                    this.changeItemsPerPage(newPerPage);
                }
            }
        };

        this.container.addEventListener('click', this.handleClick);
        
        // Обработка селектора
        const perPageSelect = this.container.querySelector('#per-page-select');
        if (perPageSelect) {
            perPageSelect.addEventListener('change', (e) => {
                const newPerPage = parseInt(e.target.value);
                if (newPerPage !== this.options.itemsPerPage) {
                    this.changeItemsPerPage(newPerPage);
                }
            });
        }
        
        // Обработчик изменения размера окна для адаптивности
        this.handleResize = this.debounce(() => {
            this.render();
        }, 250);
        
        window.addEventListener('resize', this.handleResize);
    }
    
    /**
     * Debounce функция для оптимизации resize событий
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Переход на страницу
     */
    goToPage(page) {
        if (page && page !== this.options.currentPage) {
            console.log('Pagination: changing to page', page);
            this.options.currentPage = page;
            if (this.options.onPageChange) {
                this.options.onPageChange(page);
            }
        }
    }

    /**
     * Изменение количества элементов на странице
     */
    changeItemsPerPage(newPerPage) {
        console.log('Pagination: changing items per page to', newPerPage);
        this.options.itemsPerPage = newPerPage;
        this.options.currentPage = 1; // Сбрасываем на первую страницу
        
        // Вызываем callback для обновления данных
        if (this.options.onPageChange) {
            this.options.onPageChange(1, newPerPage);
        }
    }

    /**
     * Показать пагинацию
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
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
     * Получить количество элементов на странице
     */
    getItemsPerPage() {
        return this.options.itemsPerPage;
    }

    /**
     * Установить новые опции
     */
    setOptions(options) {
        this.options = { ...this.options, ...options };
    }

    /**
     * Обновить общее количество элементов
     */
    updateTotalItems(totalItems) {
        this.options.totalItems = totalItems;
        this.render();
    }

    /**
     * Обновить текущую страницу
     */
    updateCurrentPage(currentPage) {
        this.options.currentPage = currentPage;
        this.render();
    }

    /**
     * Уничтожить пагинацию и очистить обработчики
     */
    destroy() {
        if (this.handleClick) {
            this.container.removeEventListener('click', this.handleClick);
        }
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
        }
    }
}

// Экспорт
if (typeof window !== 'undefined') {
    window.NewsPagination = NewsPagination;
} 