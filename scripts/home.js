// Home Events Widget - integrates with calendar system
class HomeEventsWidget {
    constructor() {
        this.eventsContainer = document.getElementById('upcomingEventsGrid');
        this.loadingElement = document.getElementById('upcomingEventsLoading');
        this.noEventsElement = document.getElementById('noUpcomingEvents');
        
        // Current events slider elements
        this.currentEventsSlider = document.getElementById('currentEventsSlider');
        this.currentEventsTrack = document.getElementById('currentEventsTrack');
        this.currentEventsPrev = document.getElementById('currentEventsPrev');
        this.currentEventsNext = document.getElementById('currentEventsNext');
        this.currentEventsDots = document.getElementById('currentEventsDots');
        
        this.calendarAPI = null;
        this.isLoaded = false;
        
        // Current events slider state
        this.currentSlide = 0;
        this.currentEvents = [];
        
        if (this.eventsContainer) {
            this.init();
        }
    }

    async init() {
        try {
            console.log('Initializing HomeEventsWidget...');
            
            // Show loading
            this.showLoading();
            
            // Create calendar API instance
            this.calendarAPI = new CalendarAPI();
            await this.calendarAPI.loadData();
            
            // Get current and upcoming events
            const upcomingEvents = this.calendarAPI.getUpcomingEvents(3); // Get 3 upcoming events
            const allEvents = this.calendarAPI.getEvents();
            const currentEvents = allEvents.filter(event => this.calendarAPI.getActualEventStatus(event) === 'ongoing');
            
            // Wait minimum time for loading animation
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Render current events slider if there are ongoing events
            if (currentEvents.length > 0) {
                this.currentEvents = currentEvents;
                this.renderCurrentEventsSlider();
                this.setupCurrentEventsListeners();
            }
            
            if (upcomingEvents.length > 0) {
                this.renderEvents(upcomingEvents);
                this.isLoaded = true;
                console.log(`Loaded ${upcomingEvents.length} upcoming events and ${currentEvents.length} current events`);
            } else {
                this.showNoEvents();
            }
        } catch (error) {
            console.error('Error loading events for home widget:', error);
            this.showError('Помилка завантаження подій');
        }
    }

    renderEvents(events) {
        if (!this.eventsContainer) return;

        this.hideLoading();
        
        let html = '';
        
        events.forEach((event, index) => {
            const dateInfo = this.calendarAPI.formatDate(event.date);
            const endDateInfo = event.endDate ? this.calendarAPI.formatDate(event.endDate) : null;
            const actualStatus = this.calendarAPI.getActualEventStatus(event);
            const statusInfo = this.calendarAPI.getStatusInfo(actualStatus);
            const ageGroupInfo = this.calendarAPI.getAgeGroupInfo(event.ageGroup);
            const categoryName = this.getEventTypeLabel(event.type);
            
            html += `
                <div class="event-card" style="animation-delay: ${index * 0.1}s;">
                    <div class="event-date">
                        <div class="event-date-info">
                            <div class="event-date-day">
                                <span class="day">${endDateInfo ? `${dateInfo.day}-${endDateInfo.day}` : dateInfo.day}</span>
                                <span class="month">${dateInfo.month}</span>
                            </div>
                            ${endDateInfo ? `<div class="event-date-range">${dateInfo.year}</div>` : `<div class="event-date-range">${dateInfo.weekday}, ${dateInfo.year}</div>`}
                        </div>
                        <div class="event-status-badge ${actualStatus}">
                            ${statusInfo ? statusInfo.name : actualStatus}
                        </div>
                    </div>
                    
                    <div class="event-content">
                        <h3 class="event-title">${event.title}</h3>
                        
                        <div class="event-meta">
                            <div class="event-meta-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                </svg>
                                <span class="event-location">${event.location}</span>
                            </div>
                            
                            <div class="event-meta-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                                <span>${ageGroupInfo ? ageGroupInfo.name : event.ageGroup}</span>
                            </div>
                        </div>
                        
                        <span class="event-category">${categoryName}</span>
                        
                        <div class="event-actions">
                            <a href="calendar.html" class="event-btn event-btn-primary">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                Детальніше
                            </a>
                            <button class="event-btn event-btn-outline" onclick="homeEventsWidget.shareEvent(${event.id})">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                                    <polyline points="16,6 12,2 8,6"/>
                                    <line x1="12" y1="2" x2="12" y2="15"/>
                                </svg>
                                Поділитися
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        this.eventsContainer.innerHTML = html;
        this.eventsContainer.style.display = 'grid';
    }

    showLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'flex';
        }
        if (this.eventsContainer) {
            this.eventsContainer.style.display = 'none';
        }
        if (this.noEventsElement) {
            this.noEventsElement.style.display = 'none';
        }
    }

    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
    }

    showNoEvents() {
        this.hideLoading();
        if (this.noEventsElement) {
            this.noEventsElement.style.display = 'flex';
        }
        if (this.eventsContainer) {
            this.eventsContainer.style.display = 'none';
        }
    }

    showError(message) {
        this.hideLoading();
        if (this.eventsContainer) {
            this.eventsContainer.innerHTML = `
                <div class="event-error" style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #dc3545;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <h3>${message}</h3>
                    <p>Спробуйте оновити сторінку або зверніться до адміністратора</p>
                </div>
            `;
            this.eventsContainer.style.display = 'grid';
        }
    }

    getEventTypeLabel(type) {
        const labels = {
            'championship': 'Чемпіонат',
            'cup': 'Кубок',
            'tournament': 'Турнір',
            'international': 'Міжнародний',
            'seminar': 'Семінар',
            'training': 'Тренування',
            'education': 'Освіта',
            'veterans': 'Ветерани'
        };
        return labels[type] || 'Подія';
    }

    shareEvent(eventId) {
        const event = this.calendarAPI.getEventById(eventId);
        if (!event) return;

        const dateInfo = this.calendarAPI.formatDate(event.date);
        const shareText = `${event.title} - ${event.location}, ${dateInfo.day} ${dateInfo.month} ${dateInfo.year}`;
        
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

    renderCurrentEventsSlider() {
        if (!this.currentEventsTrack || this.currentEvents.length === 0) return;

        // Show the slider
        if (this.currentEventsSlider) {
            this.currentEventsSlider.style.display = 'block';
        }

        // Render events
        let html = '';
        this.currentEvents.forEach((event, index) => {
            const dateInfo = this.calendarAPI.formatDate(event.date);
            const endDateInfo = event.endDate ? this.calendarAPI.formatDate(event.endDate) : null;
            const ageGroupInfo = this.calendarAPI.getAgeGroupInfo(event.ageGroup);
            const categoryName = this.getEventTypeLabel(event.type);
            const isActive = index === this.currentSlide ? 'active' : '';

            html += `
                <div class="current-event-slide ${isActive}" data-index="${index}">
                    <div class="current-event-content">
                        <div class="current-event-date-large">
                            <span class="day">${endDateInfo ? `${dateInfo.day}-${endDateInfo.day}` : dateInfo.day}</span>
                            <span class="month">${dateInfo.month}</span>
                            <span class="year">${dateInfo.year}</span>
                        </div>
                        
                        <div class="current-event-main">
                            <div class="current-event-live-large">LIVE</div>
                            
                            <h2 class="current-event-title-large">${event.title}</h2>
                            
                            <p class="current-event-description">${event.description || 'Подія відбувається зараз. Слідкуйте за розвитком подій та результатами змагань.'}</p>
                            
                            <div class="current-event-meta-large">
                                <div class="current-event-meta-item-large">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    <span>${event.location}</span>
                                </div>
                                
                                <div class="current-event-meta-item-large">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                    <span>${ageGroupInfo ? ageGroupInfo.name : event.ageGroup}</span>
                                </div>
                                
                                <div class="current-event-meta-item-large">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                    <span>${categoryName}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="current-event-actions">
                            <a href="calendar.html" class="current-event-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="16" y1="2" x2="16" y2="6"/>
                                    <line x1="8" y1="2" x2="8" y2="6"/>
                                    <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                Детальніше
                            </a>
                        </div>
                    </div>
                </div>
            `;
        });

        this.currentEventsTrack.innerHTML = html;
        
        // Render dots
        this.renderCurrentEventsDots();
        
        // Update slider position
        this.updateCurrentEventsSlider();
    }

    renderCurrentEventsDots() {
        if (!this.currentEventsDots) return;

        let html = '';
        this.currentEvents.forEach((_, index) => {
            const isActive = index === this.currentSlide ? 'active' : '';
            html += `<div class="current-events-dot ${isActive}" data-slide="${index}"></div>`;
        });

        this.currentEventsDots.innerHTML = html;
    }

    setupCurrentEventsListeners() {
        // Previous button
        if (this.currentEventsPrev) {
            this.currentEventsPrev.addEventListener('click', () => this.prevCurrentEvent());
        }

        // Next button
        if (this.currentEventsNext) {
            this.currentEventsNext.addEventListener('click', () => this.nextCurrentEvent());
        }

        // Dots
        if (this.currentEventsDots) {
            this.currentEventsDots.addEventListener('click', (e) => {
                if (e.target.classList.contains('current-events-dot')) {
                    const slideIndex = parseInt(e.target.getAttribute('data-slide'));
                    this.goToCurrentEvent(slideIndex);
                }
            });
        }

        // Auto-advance every 5 seconds
        setInterval(() => {
            if (this.currentEvents.length > 1) {
                this.nextCurrentEvent();
            }
        }, 5000);

        // Touch/swipe support
        this.setupCurrentEventsSwipe();
    }

    setupCurrentEventsSwipe() {
        if (!this.currentEventsTrack) return;

        let touchStartX = 0;
        let touchEndX = 0;

        this.currentEventsTrack.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        this.currentEventsTrack.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleCurrentEventsSwipe();
        });

        const handleCurrentEventsSwipe = () => {
            const deltaX = touchEndX - touchStartX;
            const minSwipeDistance = 50;

            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    this.prevCurrentEvent();
                } else {
                    this.nextCurrentEvent();
                }
            }
        };

        this.handleCurrentEventsSwipe = handleCurrentEventsSwipe;
    }

    nextCurrentEvent() {
        if (this.currentEvents.length === 0) return;
        
        this.currentSlide = (this.currentSlide + 1) % this.currentEvents.length;
        this.updateCurrentEventsSlider();
    }

    prevCurrentEvent() {
        if (this.currentEvents.length === 0) return;
        
        this.currentSlide = this.currentSlide === 0 ? this.currentEvents.length - 1 : this.currentSlide - 1;
        this.updateCurrentEventsSlider();
    }

    goToCurrentEvent(index) {
        if (index >= 0 && index < this.currentEvents.length) {
            this.currentSlide = index;
            this.updateCurrentEventsSlider();
        }
    }

    updateCurrentEventsSlider() {
        if (!this.currentEventsTrack) return;

        // Each slide takes 100% width
        const translateX = -this.currentSlide * 100;
        this.currentEventsTrack.style.transform = `translateX(${translateX}%)`;

        // Update active slide class
        document.querySelectorAll('.current-event-slide').forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentSlide);
        });

        // Update dots
        document.querySelectorAll('.current-events-dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });

        // Update button states (allow cycling)
        if (this.currentEventsPrev) {
            this.currentEventsPrev.disabled = false;
        }
        if (this.currentEventsNext) {
            this.currentEventsNext.disabled = false;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

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
            ${type === 'success' ? 'background-color: #10b981;' : 'background-color: #3b82f6;'}
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Home News Widget - integrates with news system
class HomeNewsWidget {
    constructor() {
        this.newsContainer = document.querySelector('.news-slider-container');
        this.dotsContainer = document.querySelector('.news-slider-dots');
        this.isLoaded = false;
        
        if (this.newsContainer) {
            this.init();
        }
    }

    async init() {
        try {
            console.log('Initializing HomeNewsWidget...');
            
            // Show loading animation
            this.showLoading();
            
            // Wait for newsLoader to be available
            if (!window.newsLoader) {
                console.warn('newsLoader not available, using static content');
                this.showError('Система новин недоступна');
                return;
            }

            // Add minimum loading time for better UX
            const [allNews] = await Promise.all([
                window.newsLoader.loadArticlesList(),
                new Promise(resolve => setTimeout(resolve, 1000)) // Minimum 1 second loading
            ]);
            
            const latestNews = allNews.slice(0, 5); // Get 5 latest news

            if (latestNews.length > 0) {
                // Show skeleton first, then real content
                this.showSkeleton();
                await new Promise(resolve => setTimeout(resolve, 500)); // Show skeleton for 0.5s
                
                this.renderNews(latestNews);
                this.updateDots(latestNews.length);
                this.isLoaded = true;
                
                // Trigger slider reinitialization
                this.triggerSliderInit();
                
                console.log(`Loaded ${latestNews.length} news articles`);
            } else {
                this.showError('Новини не знайдено');
            }
        } catch (error) {
            console.error('Error loading news for home widget:', error);
            this.showError('Помилка завантаження новин');
        }
    }

    renderNews(newsArray) {
        if (!this.newsContainer) return;

        let html = '';
        
        newsArray.forEach((news, index) => {
            const categoryName = this.getCategoryName(news.category);
            const formattedDate = this.formatDateShort(news.publishedAt);
            const isActive = index === 0 ? 'active' : '';
            
            html += `
                <div class="news-card ${isActive}">
                    <div class="news-card-image">
                        <img src="${news.image?.url || news.image}" alt="${news.title}" loading="lazy">
                        <div class="news-card-date">${formattedDate}</div>
                    </div>
                    <div class="news-card-content">
                        <span class="news-card-category">${categoryName}</span>
                        <h3 class="news-card-title">${news.title}</h3>
                        <p class="news-card-excerpt">${news.excerpt}</p>
                        <a href="news-article.html?id=${news.id}" class="news-card-link">Читати далі</a>
                    </div>
                </div>
            `;
        });

        this.newsContainer.innerHTML = html;
        
        // Add fade-in animation
        this.newsContainer.style.opacity = '0';
        this.newsContainer.style.transform = 'translateY(20px)';
        
        // Trigger animation
        requestAnimationFrame(() => {
            this.newsContainer.style.transition = 'all 0.5s ease-out';
            this.newsContainer.style.opacity = '1';
            this.newsContainer.style.transform = 'translateY(0)';
        });
    }

    updateDots(count) {
        if (!this.dotsContainer) return;

        let html = '';
        for (let i = 0; i < count; i++) {
            const isActive = i === 0 ? 'active' : '';
            html += `<span class="dot ${isActive}" data-slide="${i}"></span>`;
        }

        this.dotsContainer.innerHTML = html;
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

    formatDateShort(dateString) {
        const date = new Date(dateString);
        const months = ['Січня', 'Лютого', 'Березня', 'Квітня', 'Травня', 'Червня', 'Липня', 'Серпня', 'Вересня', 'Жовтня', 'Листопада', 'Грудня'];
        return `${date.getDate()} ${months[date.getMonth()]}`;
    }

    showLoading() {
        if (!this.newsContainer) return;

        this.newsContainer.innerHTML = `
            <div class="news-loading">
                <div class="news-loader"></div>
                <div class="news-loader-text">Завантаження новин...</div>
                <div class="news-loader-subtext">Отримуємо останні новини Федерації Дзюдо України</div>
            </div>
        `;

        // Hide dots during loading
        if (this.dotsContainer) {
            this.dotsContainer.innerHTML = '';
        }
    }

    showSkeleton() {
        if (!this.newsContainer) return;

        this.newsContainer.innerHTML = `
            <div class="news-skeleton">
                <div class="news-skeleton-image"></div>
                <div class="news-skeleton-content">
                    <div class="news-skeleton-category"></div>
                    <div class="news-skeleton-title"></div>
                    <div class="news-skeleton-title"></div>
                    <div class="news-skeleton-excerpt"></div>
                    <div class="news-skeleton-excerpt"></div>
                    <div class="news-skeleton-excerpt"></div>
                    <div class="news-skeleton-link"></div>
                </div>
            </div>
        `;
    }

    showError(message) {
        if (!this.newsContainer) return;

        this.newsContainer.innerHTML = `
            <div class="news-loading">
                <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(220, 53, 69, 0.1); display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                </div>
                <div class="news-loader-text" style="color: #dc3545;">${message}</div>
                <div class="news-loader-subtext">Спробуйте оновити сторінку або зверніться до адміністратора</div>
            </div>
        `;

        // Hide dots during error
        if (this.dotsContainer) {
            this.dotsContainer.innerHTML = '';
        }
    }

    triggerSliderInit() {
        // Dispatch custom event to notify slider to reinitialize
        const event = new CustomEvent('newsLoaded', {
            detail: { widget: this }
        });
        document.dispatchEvent(event);
    }
}

// News Slider Functionality
document.addEventListener('DOMContentLoaded', function() {
    const newsSlider = document.querySelector('.news-slider');
    if (!newsSlider) return;

    let newsCards = document.querySelectorAll('.news-card');
    let prevBtn = document.querySelector('.news-slider-btn.prev');
    let nextBtn = document.querySelector('.news-slider-btn.next');
    let dots = document.querySelectorAll('.dot');
    
    let currentSlide = 0;
    let isAutoPlay = true;
    let autoPlayInterval;
    let isTransitioning = false;
    let transitionTimeout;

    // Initialize news widget first, then slider
    async function initNewsSystem() {
        // Initialize news widget
        const newsWidget = new HomeNewsWidget();
        
        // Wait for news widget to complete loading
        await new Promise(resolve => {
            const checkLoaded = () => {
                if (newsWidget.isLoaded || document.querySelectorAll('.news-card').length > 0) {
                    resolve();
                } else {
                    setTimeout(checkLoaded, 100);
                }
            };
            checkLoaded();
        });
        
        // Re-query elements after news widget updates DOM
        newsCards = document.querySelectorAll('.news-card');
        dots = document.querySelectorAll('.dot');
        
        // Initialize slider
        initSlider();
    }

    // Initialize slider
    function initSlider() {
        if (newsCards.length === 0) {
            console.warn('No news cards found for slider');
            return;
        }
        
        showSlide(currentSlide);
        startAutoPlay();
        addEventListeners();
        addAccessibility();
    }

    // Show specific slide
    function showSlide(index, direction = 'next') {
        // Prevent transition if already transitioning
        if (isTransitioning) return;
        
        // Set transitioning state
        isTransitioning = true;
        
        // Clear any existing transition timeout
        if (transitionTimeout) {
            clearTimeout(transitionTimeout);
        }
        
        // Re-query elements to ensure we have current references
        newsCards = document.querySelectorAll('.news-card');
        dots = document.querySelectorAll('.dot');
        
        // Remove all classes from cards
        newsCards.forEach((card, cardIndex) => {
            card.classList.remove('active', 'prev', 'next');
            
            if (cardIndex === index) {
                // Current slide
                card.classList.add('active');
            } else if (cardIndex < index) {
                // Previous slides
                card.classList.add('prev');
            } else {
                // Next slides
                card.classList.add('next');
            }
        });
        
        // Update dots
        dots.forEach(dot => dot.classList.remove('active'));
        if (dots[index]) {
            dots[index].classList.add('active');
        }
        
        // Update button states
        updateButtonStates();
        
        // Add haptic feedback on mobile
        if ('vibrate' in navigator && window.innerWidth <= 768) {
            navigator.vibrate(30);
        }
        
        // Reset transitioning state after animation completes
        transitionTimeout = setTimeout(() => {
            isTransitioning = false;
        }, 600); // Match CSS animation duration
    }

    // Go to next slide
    function nextSlide() {
        if (isTransitioning) return;
        
        const currentNewsCards = document.querySelectorAll('.news-card');
        currentSlide = (currentSlide + 1) % currentNewsCards.length;
        showSlide(currentSlide, 'next');
    }

    // Go to previous slide
    function prevSlide() {
        if (isTransitioning) return;
        
        const currentNewsCards = document.querySelectorAll('.news-card');
        currentSlide = (currentSlide - 1 + currentNewsCards.length) % currentNewsCards.length;
        showSlide(currentSlide, 'prev');
    }

    // Go to specific slide
    function goToSlide(index) {
        if (isTransitioning) return;
        
        const direction = index > currentSlide ? 'next' : 'prev';
        currentSlide = index;
        showSlide(currentSlide, direction);
        restartAutoPlay();
    }

    // Update button states
    function updateButtonStates() {
        const currentNewsCards = document.querySelectorAll('.news-card');
        if (prevBtn) {
            prevBtn.disabled = currentSlide === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = currentSlide === currentNewsCards.length - 1;
        }
    }

    // Start auto play
    function startAutoPlay() {
        if (!isAutoPlay) return;
        
        autoPlayInterval = setInterval(() => {
            // Don't auto-advance if transitioning
            if (isTransitioning) return;
            
            const currentNewsCards = document.querySelectorAll('.news-card');
            if (currentSlide === currentNewsCards.length - 1) {
                currentSlide = 0;
            } else {
                currentSlide++;
            }
            showSlide(currentSlide);
        }, 25000); // 25 seconds
    }

    // Stop auto play
    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
        }
        // Also clear transition timeout if stopping
        if (transitionTimeout) {
            clearTimeout(transitionTimeout);
            isTransitioning = false;
        }
    }

    // Restart auto play
    function restartAutoPlay() {
        stopAutoPlay();
        setTimeout(() => {
            startAutoPlay();
        }, 1000); // Restart after 1 second
    }

    // Add event listeners
    function addEventListeners() {
        // Re-query elements to get fresh references
        prevBtn = document.querySelector('.news-slider-btn.prev');
        nextBtn = document.querySelector('.news-slider-btn.next');
        dots = document.querySelectorAll('.dot');

        // Navigation buttons
        let lastClickTime = 0;
        const clickDebounceTime = 250; // Minimum time between clicks
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const now = Date.now();
                if (now - lastClickTime >= clickDebounceTime && !isTransitioning) {
                    lastClickTime = now;
                    nextSlide();
                    restartAutoPlay();
                }
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const now = Date.now();
                if (now - lastClickTime >= clickDebounceTime && !isTransitioning) {
                    lastClickTime = now;
                    prevSlide();
                    restartAutoPlay();
                }
            });
        }

        // Dots navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                const now = Date.now();
                if (now - lastClickTime >= clickDebounceTime && !isTransitioning) {
                    lastClickTime = now;
                    goToSlide(index);
                }
            });
        });

        // Keyboard navigation
        let lastKeyTime = 0;
        const keyDebounceTime = 200; // Minimum time between key presses
        
        document.addEventListener('keydown', (e) => {
            if (!newsSlider.closest('.news-section')) return;
            
            const now = Date.now();
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    if (now - lastKeyTime >= keyDebounceTime && !isTransitioning) {
                        lastKeyTime = now;
                        prevSlide();
                        restartAutoPlay();
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (now - lastKeyTime >= keyDebounceTime && !isTransitioning) {
                        lastKeyTime = now;
                        nextSlide();
                        restartAutoPlay();
                    }
                    break;
                case ' ':
                case 'Enter':
                    if (e.target.classList.contains('dot')) {
                        e.preventDefault();
                        if (now - lastKeyTime >= keyDebounceTime && !isTransitioning) {
                            lastKeyTime = now;
                            const currentDots = document.querySelectorAll('.dot');
                            const index = Array.from(currentDots).indexOf(e.target);
                            goToSlide(index);
                        }
                    }
                    break;
            }
        });

        // Touch/Swipe support
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchEndY = 0;
        let lastSwipeTime = 0;
        const swipeDebounceTime = 300; // Minimum time between swipes

        newsSlider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            touchStartY = e.changedTouches[0].screenY;
            stopAutoPlay(); // Stop auto play during touch
        });

        newsSlider.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
            restartAutoPlay(); // Restart auto play after touch
        });

        function handleSwipe() {
            const now = Date.now();
            
            // Debounce swipes to prevent too rapid swiping
            if (now - lastSwipeTime < swipeDebounceTime) {
                return;
            }
            
            // Don't handle swipe if transitioning
            if (isTransitioning) {
                return;
            }
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const minSwipeDistance = 50;
            
            // Ensure horizontal swipe is more significant than vertical
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                lastSwipeTime = now;
                
                if (deltaX > 0) {
                    // Swipe right - go to previous slide
                    prevSlide();
                } else {
                    // Swipe left - go to next slide
                    nextSlide();
                }
            }
        }

        // Pause auto play on hover (desktop)
        newsSlider.addEventListener('mouseenter', () => {
            if (window.innerWidth > 768) {
                stopAutoPlay();
            }
        });

        newsSlider.addEventListener('mouseleave', () => {
            if (window.innerWidth > 768) {
                startAutoPlay();
            }
        });

        // Pause auto play when tab is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopAutoPlay();
            } else {
                startAutoPlay();
            }
        });

        // Handle window resize
        window.addEventListener('resize', debounce(() => {
            showSlide(currentSlide); // Refresh current slide
        }, 250));
    }

    // Debounce function
    function debounce(func, wait) {
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

    // Initialize the news system and slider
    initNewsSystem();

    // Add accessibility attributes
    function addAccessibility() {
        // Add ARIA labels
        if (newsSlider) {
            newsSlider.setAttribute('role', 'region');
            newsSlider.setAttribute('aria-label', 'Слайдер новостей');
        }

        // Re-query elements in case they were updated
        const currentNewsCards = document.querySelectorAll('.news-card');
        const currentDots = document.querySelectorAll('.dot');

        // Add ARIA attributes to cards
        currentNewsCards.forEach((card, index) => {
            card.setAttribute('role', 'tabpanel');
            card.setAttribute('aria-label', `Новина ${index + 1} з ${currentNewsCards.length}`);
            card.setAttribute('tabindex', index === currentSlide ? '0' : '-1');
        });

        // Add ARIA attributes to dots
        currentDots.forEach((dot, index) => {
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', `Перейти до новини ${index + 1}`);
            dot.setAttribute('tabindex', '0');
        });

        // Add ARIA attributes to buttons
        if (prevBtn) {
            prevBtn.setAttribute('aria-label', 'Попередня новина');
        }
        if (nextBtn) {
            nextBtn.setAttribute('aria-label', 'Наступна новина');
        }
    }
});

// Initialize Home Events Widget
let homeEventsWidget;
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the events widget
    homeEventsWidget = new HomeEventsWidget();
    
    // Make it globally accessible for share functionality
    window.homeEventsWidget = homeEventsWidget;
});

// Hero Statistics Animation (if stats are present)
document.addEventListener('DOMContentLoaded', function() {
    const statNumbers = document.querySelectorAll('.hero-stat-number');
    let hasAnimated = false;

    function animateNumbers() {
        if (hasAnimated) return;
        hasAnimated = true;

        statNumbers.forEach(stat => {
            const finalNumber = stat.textContent;
            const isPlus = finalNumber.includes('+');
            const numValue = parseInt(finalNumber.replace(/\D/g, ''));
            const duration = 2000; // 2 seconds
            const stepTime = Math.abs(Math.floor(duration / numValue));
            const increment = numValue / (duration / 16); // 60fps

            let current = 0;
            stat.textContent = '0';

            const timer = setInterval(() => {
                current += increment;
                if (current >= numValue) {
                    current = numValue;
                    clearInterval(timer);
                }
                stat.textContent = Math.floor(current) + (isPlus ? '+' : '');
            }, 16);
        });
    }

    // Intersection Observer for animation trigger
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumbers();
            }
        });
    }, observerOptions);

    // Observe stats section
    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) {
        observer.observe(statsSection);
    }
});
