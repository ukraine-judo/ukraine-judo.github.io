// iPhone Detection and Optimization
function isiPhoneXR() {
    return window.innerWidth === 414 && window.innerHeight === 896 || 
           window.innerWidth === 375 && window.innerHeight === 812;
}

function isiPhoneWithNotch() {
    return CSS.supports('padding-top: constant(safe-area-inset-top)') ||
           CSS.supports('padding-top: env(safe-area-inset-top)');
}

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    // Add iPhone-specific class
    if (isiPhoneXR() || isiPhoneWithNotch()) {
        document.body.classList.add('iphone-with-notch');
    }
    
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navMenuOverlay = document.querySelector('.nav-menu-overlay');
    const navLinks = document.querySelectorAll('.nav-menu a');

    // Performance optimization: Detect low-end devices
    const isLowEndDevice = navigator.hardwareConcurrency <= 2 || 
                          (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
                          /Android.*4\.|iPhone.*OS.*[6-9]_/.test(navigator.userAgent);
    
    // Apply performance optimizations for low-end devices
    if (isLowEndDevice) {
        // Reduce animation complexity
        if (navMenu) navMenu.style.transition = 'transform 0.2s ease';
        if (navMenuOverlay) navMenuOverlay.style.transition = 'opacity 0.2s ease';
        
        // Remove will-change after animations
        const removeWillChange = () => {
            if (navMenu) navMenu.style.willChange = 'auto';
            if (navMenuOverlay) navMenuOverlay.style.willChange = 'auto';
        };
        
        navMenu?.addEventListener('transitionend', removeWillChange, { once: true });
    }
    
    // Enhanced mobile branding optimization
    function optimizeMobileBranding() {
        const logo = document.querySelector('.logo');
        const brandShort = document.querySelector('.brand-short');
        const brandSubtitle = document.querySelector('.brand-subtitle-short');
        
        if (!logo || !brandShort) return;
        
        // Optimize for very small screens
        if (window.innerWidth <= 320) {
            logo.style.width = '28px';
            logo.style.height = '28px';
            brandShort.style.fontSize = '1rem';
            if (brandSubtitle) brandSubtitle.style.fontSize = '0.6rem';
        } else if (window.innerWidth <= 360) {
            logo.style.width = '32px';
            logo.style.height = '32px';
            brandShort.style.fontSize = '1.125rem';
            if (brandSubtitle) brandSubtitle.style.fontSize = '0.65rem';
        } else {
            // Reset to CSS defaults for larger screens
            logo.style.width = '';
            logo.style.height = '';
            brandShort.style.fontSize = '';
            if (brandSubtitle) brandSubtitle.style.fontSize = '';
        }
    }
    
    // Run on load and resize
    optimizeMobileBranding();
    window.addEventListener('resize', debounce(optimizeMobileBranding, 150));

    // Toggle mobile menu
    navToggle.addEventListener('click', function() {
        const isActive = navMenu.classList.contains('active');
        
        if (isActive) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    });

    function openMobileMenu() {
        // Use requestAnimationFrame for smoother animation
        requestAnimationFrame(() => {
        navMenu.classList.add('active');
        navMenuOverlay.classList.add('active');
        navToggle.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        // Lightweight haptic feedback
        if ('vibrate' in navigator && navigator.vibrate) {
            navigator.vibrate(30);
        }
    }

    function closeMobileMenu() {
        // Use requestAnimationFrame for smoother animation
        requestAnimationFrame(() => {
        navMenu.classList.remove('active');
        navMenuOverlay.classList.remove('active');
        navToggle.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Optimized event handlers with passive listeners where possible
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (!link.classList.contains('nav-link-with-submenu')) {
                closeMobileMenu();
            }
        }, { passive: true });
    });

    // Close mobile menu when clicking overlay
    if (navMenuOverlay) {
        navMenuOverlay.addEventListener('click', closeMobileMenu, { passive: true });
    }

    // Throttled outside click handler for better performance
    let outsideClickTimeout;
    document.addEventListener('click', function(e) {
        if (outsideClickTimeout) return;
        
        outsideClickTimeout = setTimeout(() => {
        const isInNav = navMenu.contains(e.target) || navToggle.contains(e.target);
        const isInSubmenu = e.target.closest('.submenu') || e.target.closest('.nav-link-with-submenu');
        
            if (!isInNav && !isInSubmenu && navMenu.classList.contains('active')) {
            closeMobileMenu();
        }
            outsideClickTimeout = null;
        }, 10);
    }, { passive: true });

    // Optimized escape key handler
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            e.preventDefault();
            closeMobileMenu();
        }
    });

    // ===== ADAPTIVE PRIORITY NAVIGATION =====
    class AdaptiveNavigation {
        constructor() {
            this.nav = document.getElementById('navMenu');
            this.moreItem = document.getElementById('navMoreItem');
            this.moreToggle = document.getElementById('navMoreToggle');
            this.fullscreenOverlay = document.getElementById('navFullscreenOverlay');
            this.fullscreenMenu = document.getElementById('navFullscreenMenu');
            this.fullscreenClose = document.getElementById('navFullscreenClose');
            this.hiddenItems = document.getElementById('navHiddenItems');
            
            this.originalItems = [];
            this.hiddenItemsArray = [];
            this.resizeTimeout = null;
            
            if (!this.nav || !this.moreItem) return;
            
            this.init();
        }
        
        init() {
            // Store original menu items (excluding the more button)
            this.originalItems = Array.from(this.nav.children).filter(item => 
                !item.classList.contains('nav-item-more')
            );
            
            // Initial check
            this.checkOverflow();
            
            // Handle window resize
            window.addEventListener('resize', () => {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    this.checkOverflow();
                    // Update navigation state when switching between desktop/mobile
                    initializeHomePageNavigation();
                }, 150);
            });
            
            // Setup fullscreen menu events
            this.setupFullscreenMenu();
        }
        
        checkOverflow() {
            // Reset to original state
            this.restoreAllItems();
            this.hideMoreButton();
            
            // On mobile, don't use priority navigation
            if (window.innerWidth <= 768) {
                return;
            }
            
            // Define max visible items based on screen resolution
            let maxVisibleItems = this.getMaxVisibleItems();
            
            // If we can show all items, don't show more button
            if (this.originalItems.length <= maxVisibleItems) {
                return;
            }
            
            // Hide items that exceed the limit
            for (let i = maxVisibleItems; i < this.originalItems.length; i++) {
                this.hideItem(this.originalItems[i]);
            }
            
            // Show more button if we have hidden items
            if (this.hiddenItemsArray.length > 0) {
                this.showMoreButton();
            }
        }
        
        getMaxVisibleItems() {
            const width = window.innerWidth;
            
            // QHD and higher (2560px+) - show all items
            if (width >= 2560) {
                return this.originalItems.length;
            }
            // FHD (1920px-2559px) - show 6 items
            else if (width >= 1920) {
                return 6;
            }
            // HD (1366px-1919px) - show 5 items  
            else if (width >= 1366) {
                return 5;
            }
            // Smaller screens - show 4 items
            else {
                return 4;
            }
        }
        
        hideItem(item) {
            if (!this.hiddenItemsArray.includes(item)) {
                item.style.display = 'none';
                this.hiddenItemsArray.push(item);
            }
        }
        
        restoreAllItems() {
            this.hiddenItemsArray.forEach(item => {
                item.style.display = '';
            });
            this.hiddenItemsArray = [];
        }
        
        hideMoreButton() {
            this.moreItem.style.display = 'none';
        }
        
        showMoreButton() {
            this.moreItem.style.display = '';
        }
        
        setupFullscreenMenu() {
            if (!this.moreToggle || !this.fullscreenOverlay || !this.fullscreenClose) return;
            
            // Toggle fullscreen menu
            this.moreToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.openFullscreenMenu();
            });
            
            // Close fullscreen menu
            this.fullscreenClose.addEventListener('click', () => {
                this.closeFullscreenMenu();
            });
            
            // Close on outside click
            this.fullscreenOverlay.addEventListener('click', (e) => {
                if (e.target === this.fullscreenOverlay) {
                    this.closeFullscreenMenu();
                }
            });
            
            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.fullscreenOverlay.classList.contains('active')) {
                    this.closeFullscreenMenu();
                }
            });
        }
        
        openFullscreenMenu() {
            // Populate fullscreen menu with hidden items
            this.populateFullscreenMenu();
            
            // Show overlay
            this.fullscreenOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Update more button state
            this.moreToggle.setAttribute('aria-expanded', 'true');
        }
        
        closeFullscreenMenu() {
            this.fullscreenOverlay.classList.remove('active');
            document.body.style.overflow = '';
            this.moreToggle.setAttribute('aria-expanded', 'false');
        }
        
        populateFullscreenMenu() {
            if (!this.fullscreenMenu) return;
            
            // Clear existing content
            this.fullscreenMenu.innerHTML = '';
            
            // Get current page for active state
            const currentPageHref = getCurrentPageHref();
            
            // Define menu items with SVG icons and descriptions
            const menuItems = [
                {
                    text: 'Головна',
                    href: 'index.html',
                    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>',
                    description: 'Головна сторінка сайту'
                },
                {
                    text: 'Про нас',
                    href: 'about.html',
                    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>',
                    description: 'Історія та місія федерації'
                },
                {
                    text: 'Збірна',
                    href: 'team.html',
                    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
                    description: 'Національна збірна України'
                },
                {
                    text: 'Новини',
                    href: 'news.html',
                    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h12"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>',
                    description: 'Останні новини та події'
                },
                {
                    text: 'Календар',
                    href: 'calendar.html',
                    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
                    description: 'Розклад змагань та подій'
                },
                {
                    text: 'Документи',
                    href: 'documents.html',
                    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14,2 14,8 20,8"/></svg>',
                    description: 'Офіційні документи та правила'
                },
                {
                    text: 'Регіони',
                    href: 'regions.html',
                    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
                    description: 'Регіональні федерації'
                },
                {
                    text: 'Галерея',
                    href: 'gallery.html',
                    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
                    description: 'Фото та відео матеріали'
                },
                {
                    text: 'Контакти',
                    href: 'contacts.html',
                    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
                    description: 'Зв\'язок з федерацією'
                }
            ];
            
            // Add all menu items to fullscreen menu
            menuItems.forEach((menuItem, index) => {
                const fullscreenItem = document.createElement('div');
                fullscreenItem.className = 'nav-fullscreen-item';
                fullscreenItem.style.cursor = 'pointer';
                
                // Add active class if this is the current page
                if (menuItem.href === currentPageHref || 
                    (currentPageHref === 'index.html' && menuItem.href === 'index.html') ||
                    (currentPageHref === '' && menuItem.href === 'index.html')) {
                    fullscreenItem.classList.add('current-page');
                }
                
                // Create icon element
                const iconDiv = document.createElement('div');
                iconDiv.className = 'nav-fullscreen-item-icon';
                iconDiv.innerHTML = menuItem.icon;
                
                // Create link element (now without href, just for styling)
                const fullscreenLink = document.createElement('div');
                fullscreenLink.className = 'nav-fullscreen-link';
                fullscreenLink.textContent = menuItem.text;
                
                // Create description element
                const descDiv = document.createElement('div');
                descDiv.className = 'nav-fullscreen-item-desc';
                descDiv.textContent = menuItem.description;
                
                // Make entire item clickable
                fullscreenItem.addEventListener('click', () => {
                    this.closeFullscreenMenu();
                    // Small delay to allow menu close animation
                    setTimeout(() => {
                        window.location.href = menuItem.href;
                    }, 100);
                });
                
                // Add hover effect for better UX
                fullscreenItem.addEventListener('mouseenter', () => {
                    fullscreenItem.style.transform = 'translateY(-8px) scale(1.03)';
                });
                
                fullscreenItem.addEventListener('mouseleave', () => {
                    fullscreenItem.style.transform = '';
                });
                
                // Assemble the item
                fullscreenItem.appendChild(iconDiv);
                fullscreenItem.appendChild(fullscreenLink);
                fullscreenItem.appendChild(descDiv);
                
                this.fullscreenMenu.appendChild(fullscreenItem);
                
                // Animate items in sequence
                setTimeout(() => {
                    fullscreenItem.classList.add('active');
                }, (index + 1) * 100);
            });
        }
    }

    // Initialize adaptive navigation
    new AdaptiveNavigation();
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.offsetTop;
            const offsetPosition = elementPosition - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Header Scroll Effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Contact Form Handling
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    // Simple validation
    if (!name || !email || !message) {
        alert('Будь ласка, заповніть всі поля форми');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Будь ласка, введіть правильну email адресу');
        return;
    }

    // Simulate form submission
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = 'Надсилання...';
    submitBtn.disabled = true;

    setTimeout(() => {
        alert('Дякуємо за ваше повідомлення! Ми зв\'яжемося з вами найближчим часом.');
        this.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 1500);
});
}

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.stat-card, .competition-card, .athlete-card, .news-card');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Исправляем активные состояния навигации на всех страницах кроме главной
    fixNavigationActiveStates();
    
    // Инициализируем активное состояние для главной страницы
    initializeHomePageNavigation();
});

function initializeHomePageNavigation() {
    const isHomePage = window.location.pathname === '/' || 
                      window.location.pathname.endsWith('/index.html') || 
                      window.location.pathname.endsWith('/');
    
    if (isHomePage) {
        // Убеждаемся, что первая вкладка "Головна" активна
        const homeLink = document.querySelector('.nav-menu a[href="#home"]');
        if (homeLink) {
            // Убираем active класс со всех ссылок
            document.querySelectorAll('.nav-menu a').forEach(link => {
                link.classList.remove('active');
            });
            // Добавляем active класс к "Головна"
            homeLink.classList.add('active');
        }
    } else {
        // На не-главных страницах активируем соответствующую вкладку
            activateCurrentPageTab();
    }
}

// Функция для активации вкладки текущей страницы
function activateCurrentPageTab() {
    const currentPageHref = getCurrentPageHref();
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    // Убираем active класс со всех ссылок
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Ищем и активируем соответствующую вкладку
    for (let link of navLinks) {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPageHref || 
            (linkHref && currentPageHref && linkHref.includes(currentPageHref.split('/').pop())) ||
            (currentPageHref.includes(linkHref) && linkHref !== '#home')) {
            link.classList.add('active');
            break;
        }
    }
}

function fixNavigationActiveStates() {
    const isHomePage = window.location.pathname === '/' || 
                      window.location.pathname.endsWith('/index.html') || 
                      window.location.pathname.endsWith('/');
    
    if (isHomePage) return; // На главной странице не трогаем логику
    
    // Убираем любые активные состояния от меню "больше"
    const moreMenuItem = document.querySelector('.nav-item-more');
    if (moreMenuItem) {
        moreMenuItem.classList.remove('active', 'mobile-more-open');
    }
    
    // Убираем active класс со всех навигационных ссылок кроме той, что должна быть активной
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        // Проверяем, должна ли эта ссылка быть активной на текущей странице
        const href = link.getAttribute('href');
        const currentPage = window.location.pathname.split('/').pop();
        
        if (href === currentPage || (href && window.location.pathname.includes(href.replace('.html', '')))) {
            // Эта ссылка должна быть активной
            return;
        }
        
        // Убираем класс active если он не должен быть здесь
        if (!link.textContent.trim().includes(getCurrentPageName())) {
            link.classList.remove('active');
        }
    });
}

function getCurrentPageName() {
    const currentPage = window.location.pathname.split('/').pop();
    switch(currentPage) {
        case 'about.html': return 'Про нас';
        case 'team.html': return 'Збірна';
        case 'news.html': return 'Новини';
        case 'calendar.html': return 'Календар';
        case 'gallery.html': return 'Галерея';
        case 'contacts.html': return 'Контакти';
        case 'documents.html': return 'Документи';
        case 'regions.html': return 'Регіони';
        case 'athlete.html': return 'Спортсмен';
        case 'coach.html': return 'Тренер';
        case 'news-article.html': return 'Стаття';
        case '': return 'Головна';
        case 'index.html': return 'Головна';
        default: return 'Поточна сторінка';
    }
}

// Dynamic Statistics Animation
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const target = parseInt(stat.textContent);
        const increment = target / 50;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                stat.textContent = target + (stat.textContent.includes('+') ? '+' : '');
                clearInterval(timer);
            } else {
                stat.textContent = Math.floor(current) + (stat.textContent.includes('+') ? '+' : '');
            }
        }, 50);
    });
}

// Trigger stats animation when section is visible
const statsSection = document.querySelector('#about');
if (statsSection) {
    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statsObserver.observe(statsSection);
}

// Active Navigation Link Highlighting (только для главной страницы с якорями)
window.addEventListener('scroll', function() {
    // Проверяем, что мы на главной странице или странице с секциями
    const isHomePage = window.location.pathname === '/' || 
                      window.location.pathname.endsWith('/index.html') || 
                      window.location.pathname.endsWith('/');
    
    if (!isHomePage) return; // Не применяем логику якорей на других страницах
    
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
    
    let current = 'home'; // По умолчанию активна секция home
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
    
    // Если ни одна секция не активна, активируем первую (Головна)
    const activeLink = document.querySelector('.nav-menu a.active');
    if (!activeLink) {
        const homeLink = document.querySelector('.nav-menu a[href="#home"]');
        if (homeLink) {
            homeLink.classList.add('active');
        }
    }
});

// Lazy Loading for Images (when added)
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Keyboard Navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const navMenu = document.querySelector('.nav-menu');
        const navToggle = document.querySelector('.nav-toggle');
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    }
});

// Performance: Debounce scroll events
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

// Apply debouncing to scroll events
const debouncedScrollHandler = debounce(function() {
    // Header scroll effect and active nav highlighting logic here
}, 10);

window.addEventListener('scroll', debouncedScrollHandler); 

function getCurrentPageHref() {
    const currentPage = window.location.pathname.split('/').pop();
    return currentPage || 'index.html';
}

// ===== WINDOW RESIZE HANDLER =====
let resizeTimeout;
window.addEventListener('resize', function() {
    // Используем debounce для оптимизации производительности
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Переинициализируем навигацию при изменении размера
        initializeHomePageNavigation();
        
        // Обновляем состояние адаптивной навигации если функция существует
        if (typeof updateAdaptiveNavigation === 'function') {
            updateAdaptiveNavigation();
        }
    }, 150);
}); 