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
        navMenu.classList.add('active');
        navMenuOverlay.classList.add('active');
        navToggle.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
        
        // Add haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    }

    function closeMobileMenu() {
        navMenu.classList.remove('active');
        navMenuOverlay.classList.remove('active');
        navToggle.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    }

    // Close mobile menu when clicking on a link (except submenu links)
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Don't close mobile menu if it's a submenu trigger
            if (!link.classList.contains('nav-link-with-submenu')) {
                closeMobileMenu();
            }
        });
    });

    // Close mobile menu when clicking overlay
    if (navMenuOverlay) {
    navMenuOverlay.addEventListener('click', function() {
        closeMobileMenu();
    });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        // Check if click is outside nav menu and not on submenu
        const isInNav = navMenu.contains(e.target) || navToggle.contains(e.target);
        const isInSubmenu = e.target.closest('.submenu') || e.target.closest('.nav-link-with-submenu');
        
        if (!isInNav && !isInSubmenu) {
            closeMobileMenu();
        }
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
        }
    });

    // Submenu functionality
    const submenuItems = document.querySelectorAll('.nav-item-with-submenu');
    
    submenuItems.forEach(item => {
        const submenuLink = item.querySelector('.nav-link-with-submenu');
        const submenu = item.querySelector('.submenu');
        let touchStartTime = 0;
        
        // Handle touch start
        submenuLink.addEventListener('touchstart', function() {
            touchStartTime = Date.now();
        });
        
        // Handle submenu clicks
        submenuLink.addEventListener('click', function(e) {
            e.preventDefault(); // Always prevent default to avoid navigation
            
            const touchEndTime = Date.now();
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isQuickTouch = touchEndTime - touchStartTime < 300;
            const isiPhone = /iPhone|iPad|iPod/.test(navigator.userAgent);
            const mainLink = submenuLink.getAttribute('data-main-link');
            
            // Mobile/touch behavior - toggle submenu
            if (window.innerWidth <= 768 || (isTouchDevice && isQuickTouch)) {
                // Add visual feedback
                submenuLink.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    submenuLink.style.transform = '';
                }, 150);
                
                item.classList.toggle('mobile-submenu-open');
                
                // Close other submenus
                submenuItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('mobile-submenu-open');
                    }
                });
                
                // Enhanced haptic feedback for iPhone
                if (isiPhone && 'vibrate' in navigator) {
                    navigator.vibrate([50, 30, 50]); // Pattern for better feel
                } else if ('vibrate' in navigator) {
                    navigator.vibrate(50);
                }
                
                // Add iOS-style bounce effect
                if (isiPhone) {
                    const submenu = item.querySelector('.submenu');
                    submenu.style.transform = 'scale(1.02)';
                    setTimeout(() => {
                        submenu.style.transform = '';
                    }, 200);
                }
            } else {
                // Desktop behavior - navigate to main link or toggle submenu
                const isSubmenuOpen = item.classList.contains('hovering') || 
                                     getComputedStyle(submenu).opacity === '1';
                
                if (isSubmenuOpen) {
                    // If submenu is open, navigate to main page
                    if (mainLink) {
                        window.location.href = mainLink;
                    }
                } else {
                    // If submenu is closed, open it
                    item.classList.add('hovering');
                    submenu.style.pointerEvents = 'auto';
                }
            }
        });
        
        // Handle hover for desktop - always attach, but check window size in handler
        let hoverTimeout;
        
        item.addEventListener('mouseenter', function() {
            if (window.innerWidth > 768) {
                clearTimeout(hoverTimeout);
                submenu.style.pointerEvents = 'auto';
                item.classList.add('hovering');
            }
        });
        
        item.addEventListener('mouseleave', function() {
            if (window.innerWidth > 768) {
                hoverTimeout = setTimeout(() => {
                    submenu.style.pointerEvents = 'none';
                    item.classList.remove('hovering');
                }, 100);
            }
        });
        
        // Ensure submenu stays open when hovering over it
        submenu.addEventListener('mouseenter', function() {
            if (window.innerWidth > 768) {
                clearTimeout(hoverTimeout);
                submenu.style.pointerEvents = 'auto';
            }
        });
        
        submenu.addEventListener('mouseleave', function() {
            if (window.innerWidth > 768) {
                hoverTimeout = setTimeout(() => {
                    submenu.style.pointerEvents = 'none';
                    item.classList.remove('hovering');
                }, 100);
            }
        });
        
        // Close submenu when clicking outside (only once per item)
        const closeSubmenuHandler = function(e) {
            if (!item.contains(e.target)) {
                item.classList.remove('mobile-submenu-open');
                item.classList.remove('hovering');
            }
        };
        
        // Remove previous handler if exists and add new one
        document.removeEventListener('click', closeSubmenuHandler);
        document.addEventListener('click', closeSubmenuHandler);
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        submenuItems.forEach(item => {
            if (window.innerWidth > 768) {
                item.classList.remove('mobile-submenu-open');
            }
        });
    });
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
});

function fixNavigationActiveStates() {
    const isHomePage = window.location.pathname === '/' || 
                      window.location.pathname.endsWith('/index.html') || 
                      window.location.pathname.endsWith('/');
    
    if (isHomePage) return; // На главной странице не трогаем логику
    
    // Убираем любые активные состояния от подменю и hover эффектов
    const submenuItems = document.querySelectorAll('.nav-item-with-submenu');
    submenuItems.forEach(item => {
        item.classList.remove('hovering', 'mobile-submenu-open');
        const submenuLink = item.querySelector('.nav-link-with-submenu');
        if (submenuLink) {
            submenuLink.classList.remove('active');
        }
    });
    
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
        case 'news.html': return 'Новини';
        case 'about.html': return 'Федерація';
        case 'calendar.html': return 'Календар';
        case 'gallery.html': return 'Галерея';
        case 'contacts.html': return 'Контакти';
        case 'news-article.html': return 'Новини';
        default: return 'Головна';
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
    
    let current = '';
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