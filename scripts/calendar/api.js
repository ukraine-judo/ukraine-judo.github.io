// Calendar API for data management
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
            console.log('Loading data from:', this.dbPath);
            const response = await fetch(this.dbPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            console.log('Data loaded successfully:', this.data);
            return this.data;
        } catch (error) {
            console.error('Error loading calendar data:', error);
            // Fallback data if JSON fails to load
            this.data = { months: {}, categories: [], statuses: [], ageGroups: [] };
            console.log('Using fallback data');
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
        if (!this.data || !this.data.statuses) return null;
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
        if (!this.data || !this.data.ageGroups) return null;
        return this.data.ageGroups.find(group => group.id === ageGroupId);
    }
} 