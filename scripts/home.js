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
