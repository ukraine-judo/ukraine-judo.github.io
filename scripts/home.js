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

// News widget functionality moved to optimized news.js system

// News Slider Integration for existing slider functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the slider only if news content is loaded
    setTimeout(() => {
        if (typeof initSlider === 'function') {
        initSlider();
        }
    }, 1000);
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

// Главная страница - Hero News Widget
class HeroNewsWidget {
    constructor() {
        this.container = document.querySelector('.news-hero-container');
        this.controls = document.querySelector('.news-hero-controls');
        this.prevBtn = document.querySelector('.news-hero-btn.prev');
        this.nextBtn = document.querySelector('.news-hero-btn.next');
        this.dotsContainer = document.querySelector('.news-hero-dots');
        
        this.slides = [];
        this.currentSlide = 0;
        this.isLoading = false;
        this.autoSlideInterval = null;
        
        this.init();
    }
    
    async init() {
        this.showSkeleton();
        await this.loadNews();
        this.setupEventListeners();
        this.updateControls();
        this.startAutoSlide();
    }

    showSkeleton() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="news-hero-skeleton">
                <div class="news-hero-content">
                    <div class="skeleton-category"></div>
                    <div class="skeleton-title"></div>
                    <div class="skeleton-excerpt"></div>
                    <div class="skeleton-meta"></div>
                </div>
            </div>
        `;
    }

    async loadNews() {
        try {
            this.isLoading = true;
            
            // Используем систему NewsLoader
            if (window.NewsLoader) {
                const loader = new window.NewsLoader();
                
                // Загружаем последние статьи через систему
                const articles = await loader.scanArticles();
                if (articles && articles.length > 0) {
                    this.slides = articles.slice(0, 5); // Берем первые 5
                    this.renderSlides();
                    return;
                }
            }
            
            // Фоллбек - пытаемся загрузить через оптимизированную систему news.js
            if (window.OptimizedNewsLoader) {
                const optimizedLoader = new window.OptimizedNewsLoader();
                const news = await optimizedLoader.getLatestNews(5);
                if (news && news.length > 0) {
                    this.slides = news;
                    this.renderSlides();
                    return;
                }
            }
            
            // Последний фоллбек
            this.showFallbackNews();
        } catch (error) {
            console.error('Ошибка загрузки новостей:', error);
            this.showFallbackNews();
        } finally {
            this.isLoading = false;
        }
    }
    
    showFallbackNews() {
        this.slides = [
            {
                id: 'fallback-1',
                title: 'Федерація дзюдо України',
                excerpt: 'Офіційний сайт Федерації дзюдо України. Новини, турніри, результати змагань.',
                category: 'Новини',
                date: new Date().toISOString(),
                image: '/images/federation/hero-bg.jpg',
                link: '/news.html'
            }
        ];
        this.renderSlides();
    }
    
    renderSlides() {
        if (!this.container || this.slides.length === 0) return;
        
        const slidesHTML = this.slides.map((slide, index) => {
            // Обрабатываем разные форматы данных
            const imageUrl = this.getSlideImage(slide);
            const slideStyle = imageUrl ? `background-image: url('${imageUrl}')` : '';
            const slideClass = imageUrl ? '' : 'no-image';
            const categoryName = this.getCategoryName(slide.category);
            const authorName = this.getAuthorName(slide.author);
            const slideDate = slide.publishedAt || slide.date || new Date().toISOString();
            const slideLink = slide.slugId ? `/news-article.html?id=${slide.slugId}` : (slide.link || `/news.html?id=${slide.id}`);
            
            return `
                <div class="news-hero-slide ${slideClass}" style="${slideStyle}">
                    <div class="news-hero-content">
                        <div class="news-hero-category">${categoryName}</div>
                        <h2 class="news-hero-title">${slide.title}</h2>
                        <p class="news-hero-excerpt">${this.truncateText(slide.excerpt || slide.content, 150)}</p>
                        <div class="news-hero-meta">
                            <div class="news-hero-date">
                                <svg viewBox="0 0 24 24" fill="none">
                                    <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                                ${this.formatDate(slideDate)}
                            </div>
                            ${authorName ? `
                                <div class="news-hero-author">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                    ${authorName}
                                </div>
                            ` : ''}
                        </div>
                        <a href="${slideLink}" class="news-hero-read-more">
                            Читати далі
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </a>
                    </div>
                </div>
            `;
        }).join('');
        
        this.container.innerHTML = slidesHTML;
        this.createDots();
        this.updateSlidePosition();
    }
    
    createDots() {
        if (!this.dotsContainer) return;
        
        const dotsHTML = this.slides.map((_, index) => 
            `<div class="news-hero-dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></div>`
        ).join('');
        
        this.dotsContainer.innerHTML = dotsHTML;
        
        // Добавляем обработчики для точек
        this.dotsContainer.querySelectorAll('.news-hero-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                const slideIndex = parseInt(dot.dataset.slide);
                this.goToSlide(slideIndex);
            });
        });
    }
    
    setupEventListeners() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.prevSlide());
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.nextSlide());
        }
        
        // Пауза автослайда при наведении
        if (this.container) {
            this.container.addEventListener('mouseenter', () => this.pauseAutoSlide());
            this.container.addEventListener('mouseleave', () => this.startAutoSlide());
        }
        
        // Свайпы на мобильных
        this.setupTouchEvents();
    }
    
    setupTouchEvents() {
        if (!this.container) return;
        
        let startX = 0;
        let currentX = 0;
        let isDragging = false;
        
        this.container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
            this.pauseAutoSlide();
        });
        
        this.container.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
        });
        
        this.container.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            
            const diff = startX - currentX;
            const threshold = 50;
            
            if (Math.abs(diff) > threshold) {
                if (diff > 0) {
                    this.nextSlide();
            } else {
                    this.prevSlide();
                }
            }
            
            this.startAutoSlide();
        });
    }
    
    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        this.updateSlidePosition();
        this.updateControls();
    }
    
    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.updateSlidePosition();
        this.updateControls();
    }
    
    goToSlide(index) {
        this.currentSlide = index;
        this.updateSlidePosition();
        this.updateControls();
    }
    
    updateSlidePosition() {
        if (!this.container) return;
        
        const translateX = -this.currentSlide * 100;
        this.container.style.transform = `translateX(${translateX}%)`;
    }
    
    updateControls() {
        // Обновляем точки
        if (this.dotsContainer) {
            this.dotsContainer.querySelectorAll('.news-hero-dot').forEach((dot, index) => {
                dot.classList.toggle('active', index === this.currentSlide);
            });
        }
        
        // Обновляем кнопки
        if (this.prevBtn) {
            this.prevBtn.disabled = this.slides.length <= 1;
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = this.slides.length <= 1;
        }
    }
    
    startAutoSlide() {
        if (this.slides.length <= 1) return;
        
        this.pauseAutoSlide();
        this.autoSlideInterval = setInterval(() => {
            this.nextSlide();
        }, 6000); // 6 секунд
    }
    
    pauseAutoSlide() {
        if (this.autoSlideInterval) {
            clearInterval(this.autoSlideInterval);
            this.autoSlideInterval = null;
        }
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
    
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }
    
    getSlideImage(slide) {
        // Обрабатываем разные форматы изображений
        if (slide.image) {
            if (typeof slide.image === 'string') {
                return slide.image;
            }
            if (slide.image.url) {
                return slide.image.url;
            }
        }
        
        if (slide.images && slide.images.length > 0) {
            return slide.images[0];
        }
        
        // Фоллбек изображение
        return '/images/federation/hero-bg.jpg';
    }
    
    getCategoryName(category) {
        const categories = {
            'achievements': 'Досягнення',
            'competitions': 'Змагання',
            'events': 'Події',
            'announcements': 'Анонси',
            'interviews': 'Інтерв\'ю',
            'education': 'Освіта'
        };
        return categories[category] || category || 'Новини';
    }
    
    getAuthorName(author) {
        if (!author) return null;
        if (typeof author === 'string') return author;
        if (author.name) return author.name;
        return null;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new HeroNewsWidget();
});

// Добавляем стили для скелетона
const skeletonStyles = `
    .skeleton-category,
    .skeleton-title,
    .skeleton-excerpt,
    .skeleton-meta {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 2s infinite;
    }
    
    .skeleton-category {
        width: 120px;
        height: 24px;
        border-radius: 12px;
        margin-bottom: 16px;
    }
    
    .skeleton-title {
        width: 80%;
        height: 32px;
        border-radius: 4px;
        margin-bottom: 12px;
    }
    
    .skeleton-excerpt {
        width: 90%;
        height: 20px;
        border-radius: 4px;
        margin-bottom: 8px;
    }
    
    .skeleton-meta {
        width: 60%;
        height: 16px;
        border-radius: 4px;
    }
    
    @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
`;

// Добавляем стили скелетона в head
const styleSheet = document.createElement('style');
styleSheet.textContent = skeletonStyles;
document.head.appendChild(styleSheet);
