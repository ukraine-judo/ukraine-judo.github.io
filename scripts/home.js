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
            
            // Wait for newsLoader to be available
            if (!window.newsLoader) {
                console.warn('newsLoader not available, using static content');
                return;
            }

            // Load latest news
            const allNews = await window.newsLoader.loadArticlesList();
            const latestNews = allNews.slice(0, 5); // Get 5 latest news

            if (latestNews.length > 0) {
                this.renderNews(latestNews);
                this.updateDots(latestNews.length);
                this.isLoaded = true;
                console.log(`Loaded ${latestNews.length} news articles`);
            }
        } catch (error) {
            console.error('Error loading news for home widget:', error);
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

    // Initialize news widget first, then slider
    async function initNewsSystem() {
        // Initialize news widget
        const newsWidget = new HomeNewsWidget();
        
        // Wait a bit for DOM to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
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
    function showSlide(index) {
        // Re-query elements to ensure we have current references
        newsCards = document.querySelectorAll('.news-card');
        dots = document.querySelectorAll('.dot');
        
        // Remove active class from all cards and dots
        newsCards.forEach(card => card.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Add active class to current slide
        if (newsCards[index]) {
            newsCards[index].classList.add('active');
        }
        if (dots[index]) {
            dots[index].classList.add('active');
        }
        
        // Update button states
        updateButtonStates();
        
        // Add haptic feedback on mobile
        if ('vibrate' in navigator && window.innerWidth <= 768) {
            navigator.vibrate(30);
        }
    }

    // Go to next slide
    function nextSlide() {
        const currentNewsCards = document.querySelectorAll('.news-card');
        currentSlide = (currentSlide + 1) % currentNewsCards.length;
        showSlide(currentSlide);
    }

    // Go to previous slide
    function prevSlide() {
        const currentNewsCards = document.querySelectorAll('.news-card');
        currentSlide = (currentSlide - 1 + currentNewsCards.length) % currentNewsCards.length;
        showSlide(currentSlide);
    }

    // Go to specific slide
    function goToSlide(index) {
        currentSlide = index;
        showSlide(currentSlide);
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
            const currentNewsCards = document.querySelectorAll('.news-card');
            if (currentSlide === currentNewsCards.length - 1) {
                currentSlide = 0;
            } else {
                currentSlide++;
            }
            showSlide(currentSlide);
        }, 5000); // 5 seconds
    }

    // Stop auto play
    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
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
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                restartAutoPlay();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                prevSlide();
                restartAutoPlay();
            });
        }

        // Dots navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                goToSlide(index);
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!newsSlider.closest('.news-section')) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    prevSlide();
                    restartAutoPlay();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    nextSlide();
                    restartAutoPlay();
                    break;
                case ' ':
                case 'Enter':
                    if (e.target.classList.contains('dot')) {
                        e.preventDefault();
                        const currentDots = document.querySelectorAll('.dot');
                        const index = Array.from(currentDots).indexOf(e.target);
                        goToSlide(index);
                    }
                    break;
            }
        });

        // Touch/Swipe support
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchEndY = 0;

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
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            const minSwipeDistance = 50;
            
            // Ensure horizontal swipe is more significant than vertical
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
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
