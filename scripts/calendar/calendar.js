// Calendar API and Frontend Logic
class CalendarAPI {
    constructor() {
        this.dbPath = 'scripts/calendar/db.json';
        this.data = null;
        this.currentFilter = 'all';
        this.currentView = 'list';
    }

    // Load data from JSON database
    async loadData() {
        try {
            const response = await fetch(this.dbPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            return this.data;
        } catch (error) {
            console.error('Error loading calendar data:', error);
            // Fallback data if JSON fails to load
            this.data = { months: {}, categories: [], statuses: [], ageGroups: [] };
            return this.data;
        }
    }

    // Get all events
    getEvents(filter = 'all') {
        if (!this.data || !this.data.months) return [];
        
        const allEvents = [];
        Object.values(this.data.months).forEach(month => {
            allEvents.push(...month.events);
        });
        
        if (filter === 'all') {
            return allEvents;
        }
        
        return allEvents.filter(event => event.category === filter);
    }

    // Get event by ID
    getEventById(id) {
        if (!this.data || !this.data.months) return null;
        
        for (const month of Object.values(this.data.months)) {
            const event = month.events.find(event => event.id === parseInt(id));
            if (event) return event;
        }
        return null;
    }

    // Get events by month
    getEventsByMonth(year, month) {
        if (!this.data || !this.data.months) return [];
        
        const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        
        const monthKey = monthNames[month];
        const monthData = this.data.months[monthKey];
        
        if (!monthData || !monthData.events) return [];
        
        // Filter events by year
        return monthData.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getFullYear() === year;
        });
    }

    // Get upcoming events
    getUpcomingEvents(limit = 5) {
        const allEvents = this.getEvents();
        const now = new Date();
        
        return allEvents
            .filter(event => new Date(event.date) >= now)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, limit);
    }

    // Get categories
    getCategories() {
        return this.data ? this.data.categories : [];
    }

    // Get statuses
    getStatuses() {
        return this.data ? this.data.statuses : [];
    }

    // Get age groups
    getAgeGroups() {
        return this.data ? this.data.ageGroups : [];
    }

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        const months = [
            'Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер',
            'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'
        ];
        
        return {
            day: date.getDate(),
            month: months[date.getMonth()],
            year: date.getFullYear(),
            weekday: this.getWeekday(date)
        };
    }

    // Get weekday in Ukrainian
    getWeekday(date) {
        const weekdays = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        return weekdays[date.getDay()];
    }

    // Get status info
    getStatusInfo(statusId) {
        if (!this.data) return null;
        return this.data.statuses.find(status => status.id === statusId);
    }

    // Get actual event status based on date
    getActualEventStatus(event) {
        const now = new Date();
        const eventDate = new Date(event.date);
        const endDate = event.endDate ? new Date(event.endDate) : eventDate;
        
        // Set time to start of day for comparison
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const eventStart = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        const eventEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        // If event is cancelled, always keep cancelled status
        if (event.status === 'cancelled') {
            return 'cancelled';
        }
        
        // If event is happening today (between start and end dates)
        if (today >= eventStart && today <= eventEnd) {
            return 'ongoing';
        }
        
        // If event has ended, mark as completed
        if (eventEnd < today) {
            return 'completed';
        }
        
        // Otherwise return the original status (planned)
        return event.status;
    }

    // Get age group info
    getAgeGroupInfo(ageGroupId) {
        if (!this.data) return null;
        return this.data.ageGroups.find(group => group.id === ageGroupId);
    }
}

// Calendar Frontend Controller
class CalendarController {
    constructor() {
        this.api = new CalendarAPI();
        const now = new Date();
        this.currentMonth = now.getMonth(); // Текущий месяц (0-11)
        this.currentYear = now.getFullYear(); // Текущий год
        this.currentFilter = 'all';
        this.monthNames = [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
        ];
        this.init();
    }

    async init() {
        await this.api.loadData();
        this.setupEventListeners();
        this.updateMonthDisplay();
        this.renderCurrentMonth();
        this.setupAnimations();
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

        // Event clicks - модальное окно отключено
        // document.addEventListener('click', (e) => {
        //     if (e.target.closest('.event-item')) {
        //         const eventElement = e.target.closest('.event-item');
        //         if (!e.target.closest('.btn')) {
        //             this.showEventModal(eventElement);
        //         }
        //     }
        // });
    }

    previousMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.updateMonthDisplay();
        this.renderCurrentMonth();
    }

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
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
        
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        // Re-render current month
        this.renderCurrentMonth();
    }

    renderCurrentMonth() {
        this.showLoading();
        
        // Get events for current month
        const monthEvents = this.api.getEventsByMonth(this.currentYear, this.currentMonth);
        const filteredEvents = this.currentFilter === 'all' 
            ? monthEvents 
            : monthEvents.filter(event => event.category === this.currentFilter);

        setTimeout(() => {
            this.hideLoading();
            this.displayEvents(filteredEvents);
        }, 300);
    }

    showLoading() {
        const loadingElement = document.getElementById('eventsLoading');
        const containerElement = document.getElementById('eventsContainer');
        const noEventsElement = document.getElementById('noEvents');
        
        if (loadingElement) loadingElement.style.display = 'flex';
        if (containerElement) containerElement.style.display = 'none';
        if (noEventsElement) noEventsElement.style.display = 'none';
    }

    hideLoading() {
        const loadingElement = document.getElementById('eventsLoading');
        if (loadingElement) loadingElement.style.display = 'none';
    }

    displayEvents(events) {
        const containerElement = document.getElementById('eventsContainer');
        const noEventsElement = document.getElementById('noEvents');

        if (!containerElement) return;

        if (events.length === 0) {
            containerElement.style.display = 'none';
            if (noEventsElement) noEventsElement.style.display = 'flex';
            return;
        }

        containerElement.style.display = 'grid';
        if (noEventsElement) noEventsElement.style.display = 'none';

        containerElement.innerHTML = events.map(event => this.renderEventItem(event)).join('');
    }

    renderEventsTimeline() {
        const timeline = document.querySelector('.events-timeline');
        if (!timeline) return;

        const events = this.api.getEvents(this.api.currentFilter);
        const eventsByMonth = this.groupEventsByMonth(events);
        
        timeline.innerHTML = '';

        Object.keys(eventsByMonth).forEach(monthKey => {
            const [year, month] = monthKey.split('-');
            const monthEvents = eventsByMonth[monthKey];
            
            const monthElement = document.createElement('div');
            monthElement.className = 'timeline-month';
            
            monthElement.innerHTML = `
                <h3 class="month-title">${this.getMonthName(parseInt(month))} ${year}</h3>
                <div class="month-events">
                    ${monthEvents.map(event => this.renderEventItem(event)).join('')}
                </div>
            `;
            
            timeline.appendChild(monthElement);
        });

        // Re-apply animations
        this.setupAnimations();
    }

    renderEventItem(event) {
        const dateInfo = this.api.formatDate(event.date);
        const endDateInfo = event.endDate ? this.api.formatDate(event.endDate) : null;
        const actualStatus = this.api.getActualEventStatus(event);
        const statusInfo = this.api.getStatusInfo(actualStatus);
        const ageGroupInfo = this.api.getAgeGroupInfo(event.ageGroup);

        return `
            <div class="event-item" data-category="${event.category}" data-event-id="${event.id}">
                <div class="event-date-small">
                    <span class="date">${endDateInfo ? `${dateInfo.day}-${endDateInfo.day}` : dateInfo.day}</span>
                    <span class="weekday">${dateInfo.weekday}</span>
                </div>
                <div class="event-content">
                    <h4>${event.title}</h4>
                    <p>📍 ${event.location}</p>
                    <p>👥 ${ageGroupInfo ? ageGroupInfo.name : event.ageGroup}</p>
                    <span class="event-category">${this.getEventTypeLabel(event.type)}</span>
                </div>
                <div class="event-status">
                    <span class="status-badge ${actualStatus}">${statusInfo ? statusInfo.name : actualStatus}</span>
                </div>
            </div>
        `;
    }

    groupEventsByMonth(events) {
        const grouped = {};
        
        events.forEach(event => {
            const date = new Date(event.date);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(event);
        });

        // Sort events within each month
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => new Date(a.date) - new Date(b.date));
        });

        return grouped;
    }

    getMonthName(monthIndex) {
        const months = [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
        ];
        return months[monthIndex];
    }

    getEventTypeLabel(type) {
        const labels = {
            'championship': 'Чемпіонат',
            'cup': 'Кубок',
            'tournament': 'Турнір',
            'youth': 'Молодь',
            'international': 'Міжнародний',
            'seminar': 'Семінар',
            'education': 'Освіта',
            'veterans': 'Ветерани',
            'training': 'Тренування'
        };
        return labels[type] || type;
    }

    getAgeGroupLabel(ageGroup) {
        const ageGroupInfo = this.api.getAgeGroupInfo(ageGroup);
        return ageGroupInfo ? ageGroupInfo.name : ageGroup;
    }

    showEventModal(eventElement) {
        const eventId = eventElement.getAttribute('data-event-id');
        const event = this.api.getEventById(eventId);
        
        if (!event) return;

        this.showEventDetails(event.id);
    }

    showEventDetails(eventId) {
        const event = this.api.getEventById(eventId);
        if (!event) return;

        const dateInfo = this.api.formatDate(event.date);
        const endDateInfo = event.endDate ? this.api.formatDate(event.endDate) : null;
        const actualStatus = this.api.getActualEventStatus(event);
        const statusInfo = this.api.getStatusInfo(actualStatus);
        const ageGroupInfo = this.api.getAgeGroupInfo(event.ageGroup);

    const modal = document.createElement('div');
    modal.className = 'event-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                    <h3>${event.title}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                    <div class="event-modal-info">
                        <p><strong>📅 Дата:</strong> ${dateInfo.day} ${dateInfo.month} ${dateInfo.year}${endDateInfo ? ` - ${endDateInfo.day} ${endDateInfo.month} ${endDateInfo.year}` : ''}</p>
                        <p><strong>📍 Місце:</strong> ${event.location}</p>
                        <p><strong>🏆 Тип:</strong> ${this.getEventTypeLabel(event.type)}</p>
                        <p><strong>👥 Вікова група:</strong> ${ageGroupInfo ? ageGroupInfo.name : event.ageGroup}</p>
                        <p><strong>📊 Статус:</strong> <span class="status-text ${actualStatus}">${statusInfo ? statusInfo.name : actualStatus}</span></p>
                        <p><strong>📝 Опис:</strong> ${event.description}</p>
                    </div>
                <div class="modal-actions">
                        <button class="btn btn-primary" onclick="calendar.addToCalendar(${event.id})">Додати до календаря</button>
                        <button class="btn btn-outline" onclick="calendar.shareEvent(${event.id})">Поділитися</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    }



    addToCalendar(eventId) {
        const event = this.api.getEventById(eventId);
        if (!event) return;

        const startDate = new Date(event.date);
        const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 3600000);

        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&location=${encodeURIComponent(event.location)}&details=${encodeURIComponent(event.description)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;

        window.open(googleCalendarUrl, '_blank');
        this.showNotification('Подію додано до календаря!', 'success');
    }

    shareEvent(eventId) {
        const event = this.api.getEventById(eventId);
        if (!event) return;

        const shareText = `${event.title} - ${event.location}, ${this.api.formatDate(event.date).day} ${this.api.formatDate(event.date).month} ${this.api.formatDate(event.date).year}`;
        
        if (navigator.share) {
            navigator.share({
                title: event.title,
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback - copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Інформацію скопійовано в буфер обміну!', 'success');
            });
        }
    }

    setupAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animatedElements = document.querySelectorAll('.event-item, .event-card.featured');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

        // Add notification styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        if (type === 'success') {
            notification.style.backgroundColor = '#10b981';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#ef4444';
        } else {
            notification.style.backgroundColor = '#3b82f6';
        }
    
    document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
    
    // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
            }, 300);
    }, 3000);
}

    renderCalendarView() {
        // Calendar view implementation
        console.log('Calendar view not implemented yet');
    }
}

// Initialize calendar when DOM is loaded
let calendar;
document.addEventListener('DOMContentLoaded', function() {
    calendar = new CalendarController();
});

// Export for global access
window.calendar = calendar;