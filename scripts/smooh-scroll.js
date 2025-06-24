// Smooth Scroll Implementation
(function() {
    'use strict';

    // Detect mobile devices
    function isMobileDevice() {
        // Check for touch support
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Check screen size
        const isSmallScreen = window.innerWidth <= 768;
        
        // Check user agent for mobile devices
        const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Check for mobile-specific features
        const isMobileBrowser = window.orientation !== undefined || navigator.userAgentData?.mobile;
        
        return hasTouch && (isSmallScreen || mobileUserAgent || isMobileBrowser);
    }

    // Detect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        console.log('Reduced motion detected, smooth scroll disabled');
        return;
    }

    // Disable smooth scroll on mobile devices
    if (isMobileDevice()) {
        console.log('Mobile device detected, using native scroll');
        // Enable native smooth scroll behavior for anchor links
        document.documentElement.style.scrollBehavior = 'smooth';
        return;
    }

    console.log('Desktop detected, initializing custom smooth scroll');

    // Configuration
    const smoothCoef = 0.05;
    let smoothScroll;
    let smoothScrollBar;
    let isInitialized = false;
    let animationFrame;

    // Variables for smooth scrolling
    let prevY = 0;
    let curY = 0;
    let y = 0;
    let dy = 0;

    console.log('Smooth scroll script loaded');

    // Initialize smooth scroll
    function initSmoothScroll() {
        console.log('Initializing smooth scroll...');
        
        try {
            // Double-check we're not on mobile (in case of device rotation)
            if (isMobileDevice()) {
                console.log('Mobile detected during init, aborting smooth scroll');
                return;
            }

            // Check if elements already exist
            smoothScroll = document.querySelector('.smooth-scroll');
            smoothScrollBar = document.querySelector('.smooth-scrollbar');

            if (!smoothScroll || !smoothScrollBar) {
                createSmoothScrollElements();
            }

            if (!isInitialized) {
                setupSmoothScroll();
                isInitialized = true;
                console.log('Smooth scroll initialized successfully');
            }
        } catch (error) {
            console.error('Error initializing smooth scroll:', error);
            // Fallback to native scroll on error
            document.documentElement.style.scrollBehavior = 'smooth';
        }
    }

    // Create smooth scroll elements
    function createSmoothScrollElements() {
        console.log('Creating smooth scroll elements...');
        
        // Create smooth-scrollbar element first
        smoothScrollBar = document.createElement('div');
        smoothScrollBar.className = 'smooth-scrollbar';
        
        // Create smooth-scroll wrapper
        smoothScroll = document.createElement('div');
        smoothScroll.className = 'smooth-scroll';
        
        // Get all current body children before modifying
        const bodyChildren = Array.from(document.body.children);
        
        // Move all existing content to smooth-scroll container
        bodyChildren.forEach(child => {
            smoothScroll.appendChild(child);
        });
        
        // Add both elements to body
        document.body.appendChild(smoothScrollBar);
        document.body.appendChild(smoothScroll);
        
        // Add class to body
        document.body.classList.add('smooth-scroll-active');
        
        console.log('Smooth scroll elements created');
    }

    // Setup smooth scroll functionality
    function setupSmoothScroll() {
        console.log('Setting up smooth scroll functionality...');
        
        // Set initial values
        prevY = window.scrollY;
        curY = window.scrollY;
        y = window.scrollY;

        // Handle resize and orientation change
        function onResize() {
            if (smoothScroll && smoothScrollBar) {
                const height = smoothScroll.offsetHeight;
                smoothScrollBar.style.height = height + "px";
                console.log('Scrollbar height updated:', height);
            }
            
            // Check if device became mobile after resize/rotation
            if (isMobileDevice()) {
                console.log('Device became mobile, disabling smooth scroll');
                disableSmoothScroll();
                document.documentElement.style.scrollBehavior = 'smooth';
            }
        }

        // Animation loop with performance optimization
        function loop() {
            curY = window.scrollY;
            dy = curY - prevY;
            
            // Only update if there's a significant change
            if (Math.abs(dy) > 0.1) {
                y = Math.abs(dy) < 1 ? curY : y + dy * smoothCoef;
                prevY = y;
                
                if (smoothScroll) {
                    smoothScroll.style.transform = `translate3d(0,${-y}px,0)`;
                }
            }

            animationFrame = requestAnimationFrame(loop);
        }

        // Event listeners
        window.addEventListener("resize", onResize);
        window.addEventListener("orientationchange", onResize);
        onResize(); // Call once to set initial height
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            onResize();
            // Start animation loop
            animationFrame = requestAnimationFrame(loop);
            console.log('Animation loop started');
        }, 100);
    }

    // Function to disable smooth scroll
    function disableSmoothScroll() {
        console.log('Disabling smooth scroll...');
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
        if (smoothScroll) {
            smoothScroll.style.transform = '';
            smoothScroll.style.position = '';
            smoothScroll.style.top = '';
            smoothScroll.style.left = '';
            smoothScroll.style.width = '';
        }
        if (smoothScrollBar) {
            smoothScrollBar.remove();
        }
        document.body.classList.remove('smooth-scroll-active');
        isInitialized = false;
    }

    // Initialize when DOM is loaded
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initSmoothScroll);
        } else {
            // Small delay to ensure all scripts are loaded
            setTimeout(initSmoothScroll, 50);
        }
    }

    // Global functions for debugging and control
    window.disableSmoothScroll = function() {
        disableSmoothScroll();
    };

    window.enableSmoothScroll = function() {
        console.log('Enabling smooth scroll...');
        if (!isMobileDevice() && !isInitialized) {
            initSmoothScroll();
        } else if (isMobileDevice()) {
            console.log('Cannot enable smooth scroll on mobile device');
        }
    };

    // Debug function
    window.debugSmoothScroll = function() {
        console.log('Smooth scroll debug info:', {
            isMobile: isMobileDevice(),
            isInitialized,
            smoothScroll: !!smoothScroll,
            smoothScrollBar: !!smoothScrollBar,
            scrollY: window.scrollY,
            y: y,
            transform: smoothScroll ? smoothScroll.style.transform : 'none'
        });
    };

    // Start initialization
    init();

})(); 