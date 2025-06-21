// Calendar Frontend Controller
class CalendarController {
    constructor() {
        this.api = new CalendarAPI();
        this.renderer = new CalendarRenderer(this.api);
        const now = new Date();
        this.currentMonth = now.getMonth(); // Текущий месяц (0-11)
        this.currentYear = now.getFullYear(); // Текущий год
        this.currentFilter = 'all';
        this.eventsPerPage = 9; // Количество событий на странице
        this.currentPage = 1;
        this.monthNames = [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
        ];
        this.init();
    }

    async init() {
        try {
            console.log('Initializing calendar...');
            const data = await this.api.loadData();
            console.log('Data loaded:', data);
            
            this.setupEventListeners();
            this.updateMonthDisplay();
            this.renderCurrentMonth();
            
            console.log('Calendar initialized successfully');
        } catch (error) {
            console.error('Error initializing calendar:', error);
            this.showError('Помилка завантаження календаря: ' + error.message);
        }
    }

    setupEventListeners() {
        // Filter tabs
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.handleFilterChange(e.target.getAttribute('data-filter'));
            });
        });

        // Month navigation
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousMonth());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextMonth());
        }

        // Event clicks for modal - делегирование событий
        document.addEventListener('click', (e) => {
            // Клик по карточке события (но не по кнопкам)
            const eventItem = e.target.closest('.event-item');
            if (eventItem && !e.target.closest('.event-actions') && !e.target.closest('button') && !e.target.closest('a')) {
                const eventId = eventItem.getAttribute('data-event-id');
                if (eventId) {
                    this.showEventDetails(eventId);
                }
            }
        });
    }

    previousMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.currentPage = 1; // Reset to first page
        this.updateMonthDisplay();
        this.renderCurrentMonth();
    }

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.currentPage = 1; // Reset to first page
        this.updateMonthDisplay();
        this.renderCurrentMonth();
    }

    updateMonthDisplay() {
        const currentMonthElement = document.getElementById('currentMonth');
        if (currentMonthElement) {
            currentMonthElement.textContent = `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
        }

        // Update navigation buttons state
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        
        if (prevBtn) {
            // Disable prev if we're at January 2025
            prevBtn.disabled = this.currentYear === 2025 && this.currentMonth === 0;
        }
        
        if (nextBtn) {
            // Disable next if we're at December 2025
            nextBtn.disabled = this.currentYear === 2025 && this.currentMonth === 11;
        }
    }

    handleFilterChange(filter) {
        this.currentFilter = filter;
        this.currentPage = 1; // Reset to first page
        
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
        
        // Re-render current month
        this.renderCurrentMonth();
    }

    renderCurrentMonth() {
        console.log('Rendering current month:', this.currentYear, this.currentMonth);
        this.showLoading();
        
        try {
            // Get events for current month
            const monthEvents = this.api.getEventsByMonth(this.currentYear, this.currentMonth);
            console.log('Month events:', monthEvents);
            
            const filteredEvents = this.currentFilter === 'all' 
                ? monthEvents 
                : monthEvents.filter(event => event.category === this.currentFilter);
                
            console.log('Filtered events:', filteredEvents);

            setTimeout(() => {
                this.hideLoading();
                this.displayEvents(filteredEvents);
            }, 300);
        } catch (error) {
            console.error('Error rendering month:', error);
            this.hideLoading();
            this.showError('Помилка відображення подій');
        }
    }

    showLoading() {
        const loadingElement = document.getElementById('eventsLoading');
        const containerElement = document.getElementById('eventsContainer');
        const noEventsElement = document.getElementById('noEvents');
        const paginationElement = document.getElementById('eventsPagination');
        
        if (loadingElement) loadingElement.style.display = 'flex';
        if (containerElement) containerElement.style.display = 'none';
        if (noEventsElement) noEventsElement.style.display = 'none';
        if (paginationElement) paginationElement.style.display = 'none';
    }

    hideLoading() {
        const loadingElement = document.getElementById('eventsLoading');
        if (loadingElement) loadingElement.style.display = 'none';
    }

    showError(message) {
        const loadingElement = document.getElementById('eventsLoading');
        const containerElement = document.getElementById('eventsContainer');
        const noEventsElement = document.getElementById('noEvents');
        
        if (loadingElement) loadingElement.style.display = 'none';
        if (containerElement) containerElement.style.display = 'none';
        if (noEventsElement) {
            noEventsElement.style.display = 'flex';
            noEventsElement.innerHTML = `
                <div class="no-events-icon icon-calendar icon-2xl"></div>
                <h3>Помилка завантаження</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Оновити сторінку</button>
            `;
        }
    }

    displayEvents(events) {
        const containerElement = document.getElementById('eventsContainer');
        const noEventsElement = document.getElementById('noEvents');
        const paginationElement = document.getElementById('eventsPagination');

        if (!containerElement) return;

        if (events.length === 0) {
            containerElement.style.display = 'none';
            if (noEventsElement) {
                noEventsElement.style.display = 'flex';
                noEventsElement.innerHTML = `
                    <div class="no-events-icon icon-calendar icon-2xl"></div>
                    <h3>Немає подій на цей місяць</h3>
                    <p>Перевірте інші місяці або оновіть фільтри</p>
                `;
            }
            if (paginationElement) paginationElement.style.display = 'none';
            return;
        }

        // Calculate pagination
        const totalPages = Math.ceil(events.length / this.eventsPerPage);
        const startIndex = (this.currentPage - 1) * this.eventsPerPage;
        const endIndex = startIndex + this.eventsPerPage;
        const paginatedEvents = events.slice(startIndex, endIndex);

        containerElement.style.display = 'grid';
        if (noEventsElement) noEventsElement.style.display = 'none';

        containerElement.innerHTML = paginatedEvents.map(event => this.renderer.renderEventItem(event)).join('');

        // Show pagination if needed
        if (totalPages > 1) {
            this.renderer.renderPagination(totalPages, events.length, this.currentPage, this.eventsPerPage);
            if (paginationElement) paginationElement.style.display = 'flex';
        } else {
            if (paginationElement) paginationElement.style.display = 'none';
        }

        // Reapply animations
        CalendarUtils.setupAnimations();
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderCurrentMonth();
        
        // Scroll to top of events
        const eventsSection = document.getElementById('eventsContainer');
        if (eventsSection) {
            eventsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    showEventDetails(eventId) {
        const event = this.api.getEventById(eventId);
        if (!event) return;

        this.renderer.renderEventModal(event);
    }

    // Public methods for external access
    addToCalendar(eventId) {
        const event = this.api.getEventById(eventId);
        CalendarUtils.addToCalendar(event);
    }

    shareEvent(eventId) {
        const event = this.api.getEventById(eventId);
        CalendarUtils.shareEvent(event, this.api);
    }
} 