// Main Calendar Application - Entry Point
// This file initializes the calendar application after all modules are loaded

let calendar;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing calendar...');
    
    // Check if all required classes are available
    if (typeof CalendarAPI === 'undefined') {
        console.error('CalendarAPI not loaded - check api.js');
        return;
    }
    
    if (typeof CalendarUtils === 'undefined') {
        console.error('CalendarUtils not loaded - check utils.js');
        return;
    }
    
    if (typeof CalendarRenderer === 'undefined') {
        console.error('CalendarRenderer not loaded - check utils.js');
        return;
    }
    
    if (typeof CalendarController === 'undefined') {
        console.error('CalendarController not loaded - check controller.js');
        return;
    }
    
    console.log('All calendar modules loaded successfully');
    
    try {
        // Initialize calendar controller
        calendar = new CalendarController();
        
        // Make it globally available
        window.calendar = calendar;
        
        console.log('Calendar application ready!');
    } catch (error) {
        console.error('Error initializing calendar:', error);
        
        // Show error message to user
        const container = document.getElementById('eventsContainer');
        const loading = document.getElementById('eventsLoading');
        const noEvents = document.getElementById('noEvents');
        
        if (loading) loading.style.display = 'none';
        if (container) container.style.display = 'none';
        if (noEvents) {
            noEvents.style.display = 'flex';
            noEvents.innerHTML = `
                <div class="no-events-icon icon-calendar icon-2xl"></div>
                <h3>Помилка ініціалізації календаря</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Оновити сторінку</button>
            `;
        }
    }
});

// Export for external access
window.addEventListener('load', function() {
    if (calendar) {
        console.log('Calendar fully loaded and ready');
    }
}); 