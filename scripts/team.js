// Team Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // Pagination variables
    let allAthletes = [];
    let filteredAthletes = [];
    let currentPage = 1;
    const athletesPerPage = 6;
    let currentFilters = {
        gender: 'all',
        age: 'all',
        weight: 'all',
        search: ''
    };
    
    // Initialize team page functionality
    initTeamFiltering();
    initScrollAnimations();
    initStatCounters();
    loadAthletesData();
    loadCoachesData();
    
    /**
     * Load athletes data from JSON files
     */
    async function loadAthletesData() {
        try {
            const response = await fetch('scripts/team/athletes.json');
            const data = await response.json();
            
            const athletesGrid = document.getElementById('athletes-grid');
            
            // Remove loading indicator
            const loadingElement = athletesGrid.querySelector('.loading-athletes');
            if (loadingElement) {
                loadingElement.remove();
            }
            
            // Load detailed data for all athletes
            allAthletes = [];
            for (const athlete of data.athletes) {
                // Load detailed athlete data for filtering
                let detailedData = null;
                try {
                    const folder = (athlete.category === 'women' || athlete.category === 'women veterans') ? 'women' : 'men';
                    const response = await fetch(`scripts/team/articles/${folder}/${athlete.id}.json`);
                    detailedData = await response.json();
                } catch (error) {
                    console.warn(`Could not load detailed data for ${athlete.id}`);
                }

                const athleteCard = await createAthleteCard(athlete, detailedData);
                allAthletes.push({
                    element: athleteCard,
                    data: athlete,
                    detailedData: detailedData // Add detailed data for filtering
                });
            }
            
            // Initialize filtering and pagination
            filteredAthletes = [...allAthletes];
            renderCurrentPage();
            initPagination();
            initTeamFiltering();
            updateResultsCount();
            
        } catch (error) {
            console.error('Error loading athletes data:', error);
            
            // Show error message
            const athletesGrid = document.getElementById('athletes-grid');
            athletesGrid.innerHTML = `
                <div class="loading-athletes">
                    <p style="color: #e74c3c;">❌ Помилка завантаження спортсменів</p>
                    <button onclick="location.reload()" style="margin-top: 10px; padding: 10px 20px; background: var(--color-primary); color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Спробувати знову
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Create athlete card element
     */
    async function createAthleteCard(athlete, detailedData = null) {
        // If detailed data not provided, try to load it
        if (!detailedData) {
            try {
                // Determine the correct folder based on athlete category
                const folder = (athlete.category === 'women' || athlete.category === 'women veterans') ? 'women' : 'men';
                const response = await fetch(`scripts/team/articles/${folder}/${athlete.id}.json`);
                detailedData = await response.json();
            } catch (error) {
                console.warn(`Could not load detailed data for ${athlete.id}`);
            }
        }
        
        const card = document.createElement('div');
        card.className = 'athlete-card';
        card.setAttribute('data-category', athlete.category);
        
        // Create achievements medals
        let medalsHTML = '';
        if (detailedData && detailedData.achievements) {
            detailedData.achievements.slice(0, 3).forEach(achievement => {
                const emoji = {
                    'gold': '🥇',
                    'silver': '🥈',
                    'bronze': '🥉'
                };
                medalsHTML += `<span class="athlete-medal ${achievement.type}">${emoji[achievement.type]} ${achievement.title}</span>`;
            });
        }
        
        // Get basic info
        const age = detailedData ? calculateAge(detailedData.birthDate) : '—';
        const dan = detailedData ? detailedData.dan : '—';
        const city = detailedData ? detailedData.city : '—';
        const rankDisplay = typeof athlete.rank === 'number' ? `#${athlete.rank}` : athlete.rank;
        
        // Create image element with placeholder fallback
        const imageContent = createAthleteImageContent(athlete);
        
        card.innerHTML = `
            <div class="athlete-image-container">
                ${imageContent}
                <div class="athlete-overlay">
                    <div class="athlete-rank">${rankDisplay}</div>
                    <div class="athlete-weight">${athlete.weight}</div>
                </div>
            </div>
            <div class="athlete-content">
                <div class="athlete-header">
                    <h3 class="athlete-name">${athlete.name}</h3>
                    <div class="athlete-dan-badge ${getDanClass(dan)}">${dan}</div>
                </div>
                
                <div class="athlete-info-grid">
                    <div class="athlete-info-item">
                        <svg class="athlete-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span class="athlete-info-text">${city}</span>
                    </div>
                    <div class="athlete-info-item">
                        <svg class="athlete-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span class="athlete-info-text">${age} років</span>
                    </div>
                </div>
                
                ${medalsHTML ? `
                <div class="athlete-achievements">
                    <div class="athlete-medals-preview">
                        ${medalsHTML}
                    </div>
                </div>
                ` : ''}
                
                <div class="athlete-actions">
                    <button class="athlete-btn athlete-btn-primary" onclick="window.location.href='athlete.html?id=${athlete.id}'">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Переглянути профіль
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }
    
    /**
     * Create athlete image content with placeholder fallback
     */
    function createAthleteImageContent(athlete) {
        // Get initials from name
        const getInitials = (name) => {
            return name.split(' ')
                .map(word => word.charAt(0))
                .join('')
                .substring(0, 2)
                .toUpperCase();
        };
        
        const initials = getInitials(athlete.name);
        
        // Check if image exists and is not a placeholder path
        const hasImage = athlete.image && 
                         athlete.image.trim() !== '' &&
                         !athlete.image.includes('placeholder') && 
                         athlete.image !== 'assets/images/placeholder.jpg';
        
        if (hasImage) {
            return `<img src="${athlete.image}" alt="${athlete.name}" class="athlete-image" 
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="athlete-placeholder" style="display: none;">
                        <div class="athlete-placeholder-initials">${initials}</div>
                    </div>`;
        } else {
            return `<div class="athlete-placeholder">
                        <div class="athlete-placeholder-initials">${initials}</div>
                    </div>`;
        }
    }
    
    /**
     * Calculate age from birth date
     */
    function calculateAge(birthDateString) {
        if (!birthDateString) return '—';
        
        // Parse Ukrainian date format (e.g., "30 квітня 2002")
        const monthNames = {
            'січня': 0, 'лютого': 1, 'березня': 2, 'квітня': 3,
            'травня': 4, 'червня': 5, 'липня': 6, 'серпня': 7,
            'вересня': 8, 'жовтня': 9, 'листопада': 10, 'грудня': 11
        };
        
        const parts = birthDateString.split(' ');
        if (parts.length >= 3) {
            const day = parseInt(parts[0]);
            const month = monthNames[parts[1]];
            const year = parseInt(parts[2]);
            
            if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                const birthDate = new Date(year, month, day);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                
                return age;
            }
        }
        
        // Fallback: try to extract year and calculate approximate age
        const yearMatch = birthDateString.match(/(\d{4})/);
        if (yearMatch) {
            const year = parseInt(yearMatch[1]);
            return new Date().getFullYear() - year;
        }
        
        return '—';
    }

    /**
     * Get CSS class for sport title
     */
    function getDanClass(dan) {
        switch(dan) {
            case 'МСУМК': return 'title-msmk';
            case 'МС': return 'title-ms';
            case 'КМС': return 'title-kms';
            default: return '';
        }
    }
    
    /**
     * Render current page of athletes
     */
    function renderCurrentPage() {
        const athletesGrid = document.getElementById('athletes-grid');
        athletesGrid.innerHTML = '';
        
        // Check if no results
        if (filteredAthletes.length === 0) {
            renderNoResults(athletesGrid);
            updatePaginationControls();
            return;
        }
        
        const startIndex = (currentPage - 1) * athletesPerPage;
        const endIndex = startIndex + athletesPerPage;
        const athletesToShow = filteredAthletes.slice(startIndex, endIndex);
        
        athletesToShow.forEach((athlete, index) => {
            athletesGrid.appendChild(athlete.element);
            
            // Add animation
            setTimeout(() => {
                athlete.element.classList.add('animate-in');
            }, index * 100);
        });
        
        updatePaginationControls();
    }
    
    /**
     * Render no results state
     */
    function renderNoResults(container) {
        const searchInput = document.querySelector('.team-search');
        const searchTerm = searchInput ? searchInput.value : '';
        const activeCategory = document.querySelector('.team-category-btn.active');
        const categoryName = activeCategory ? activeCategory.textContent.trim() : 'Всі спортсмени';
        
        const noResultsHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔍</div>
                <h3 class="no-results-title">Нічого не знайдено</h3>
                <p class="no-results-message">
                    ${searchTerm 
                        ? `Не знайдено спортсменів за запитом "${searchTerm}" в категорії "${categoryName}"`
                        : `Немає спортсменів в категорії "${categoryName}"`
                    }
                </p>
                <div class="no-results-suggestions">
                    <p>Спробуйте:</p>
                    <ul style="list-style: none; padding: 0; margin: 0.5rem 0;">
                        <li>• Перевірити правопис</li>
                        <li>• Використати інші ключові слова</li>
                        <li>• Вибрати іншу категорію</li>
                        <li>• Очистити фільтри</li>
                    </ul>
                </div>
            </div>
        `;
        
        container.innerHTML = noResultsHTML;
    }
    
    /**
     * Initialize pagination controls
     */
    function initPagination() {
        const paginationContainer = document.querySelector('.pagination-container');
        if (!paginationContainer) {
            createPaginationContainer();
        }
        updatePaginationControls();
    }
    
    /**
     * Create pagination container
     */
    function createPaginationContainer() {
        const athletesSection = document.querySelector('.team-section');
        const paginationHTML = `
            <div class="pagination-container">
                <div class="pagination-info">
                    <span id="pagination-info-text"></span>
                </div>
                <div class="pagination-controls">
                    <button id="prev-page" class="pagination-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="15,18 9,12 15,6"></polyline>
                        </svg>
                        Попередня
                    </button>
                    <div id="page-numbers" class="page-numbers"></div>
                    <button id="next-page" class="pagination-btn">
                        Наступна
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="9,18 15,12 9,6"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        athletesSection.insertAdjacentHTML('beforeend', paginationHTML);
        
        // Add event listeners
        document.getElementById('prev-page').addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderCurrentPage();
            }
        });
        
        document.getElementById('next-page').addEventListener('click', () => {
            const totalPages = Math.ceil(filteredAthletes.length / athletesPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderCurrentPage();
            }
        });
    }
    
    /**
     * Update pagination controls
     */
    function updatePaginationControls() {
        const paginationContainer = document.querySelector('.pagination-container');
        const totalPages = Math.ceil(filteredAthletes.length / athletesPerPage);
        
        // Hide pagination if no results or only one page
        if (!paginationContainer || filteredAthletes.length === 0 || totalPages <= 1) {
            if (paginationContainer) paginationContainer.style.display = 'none';
            return;
        }
        
        paginationContainer.style.display = 'flex';
        
        const startItem = (currentPage - 1) * athletesPerPage + 1;
        const endItem = Math.min(currentPage * athletesPerPage, filteredAthletes.length);
        
        // Update info text
        const infoText = document.getElementById('pagination-info-text');
        if (infoText) {
            infoText.textContent = `Показано ${startItem}-${endItem} з ${filteredAthletes.length} спортсменів`;
        }
        
        // Update prev/next buttons
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (nextBtn) nextBtn.disabled = currentPage === totalPages;
        
        // Update page numbers
        updatePageNumbers(totalPages);
    }
    
    /**
     * Update page numbers
     */
    function updatePageNumbers(totalPages) {
        const pageNumbersContainer = document.getElementById('page-numbers');
        if (!pageNumbersContainer) return;
        
        pageNumbersContainer.innerHTML = '';
        
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderCurrentPage();
            });
            pageNumbersContainer.appendChild(pageBtn);
        }
    }

    /**
     * Initialize team filtering functionality
     */
    function initTeamFiltering() {
        // Gender filter buttons
        const categoryButtons = document.querySelectorAll('.team-category-btn');
        categoryButtons.forEach(button => {
            button.addEventListener('click', function() {
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                currentFilters.gender = this.getAttribute('data-category');
                applyAllFilters();
            });
        });

        // Age filter buttons
        const ageButtons = document.querySelectorAll('.team-age-btn');
        ageButtons.forEach(button => {
            button.addEventListener('click', function() {
                ageButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                currentFilters.age = this.getAttribute('data-age');
                applyAllFilters();
            });
        });

        // Weight filter select
        const weightSelect = document.getElementById('weight-filter');
        if (weightSelect) {
            weightSelect.addEventListener('change', function() {
                currentFilters.weight = this.value;
                applyAllFilters();
            });
        }

        // Search functionality
        initSearch();
    }
    
    /**
     * Calculate age category based on birth date
     */
    function getAgeCategory(birthDateString) {
        if (!birthDateString) {
            return 'senior';
        }
        
        const age = calculateAge(birthDateString);
        
        // Handle case where calculateAge returns '—' for invalid dates
        if (age === '—' || typeof age !== 'number') {
            return 'senior';
        }
        
        if (age <= 17) return 'u17';
        if (age <= 18) return 'u18';
        if (age <= 21) return 'u21';
        if (age <= 23) return 'u23';
        return 'senior';
    }

    /**
     * Apply all active filters
     */
    function applyAllFilters() {
        const searchInput = document.querySelector('.enhanced-search-input');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        filteredAthletes = allAthletes.filter(athlete => {
            // Gender filter
            let genderMatch = true;
            if (currentFilters.gender !== 'all') {
                genderMatch = athlete.data.category === currentFilters.gender;
            }
            
            // Age filter
            let ageMatch = true;
            if (currentFilters.age !== 'all') {
                const birthDate = athlete.detailedData ? athlete.detailedData.birthDate : null;
                const athleteAgeCategory = getAgeCategory(birthDate);
                ageMatch = athleteAgeCategory === currentFilters.age;
            }
            
            // Weight filter
            let weightMatch = true;
            if (currentFilters.weight !== 'all') {
                weightMatch = athlete.data.weight === currentFilters.weight;
            }
            
            // Search filter
            let searchMatch = true;
            if (searchTerm) {
                const name = athlete.data.name.toLowerCase();
                const weight = athlete.data.weight.toLowerCase();
                const city = athlete.data.city ? athlete.data.city.toLowerCase() : '';
                const club = athlete.data.club ? athlete.data.club.toLowerCase() : '';
                
                searchMatch = name.includes(searchTerm) || 
                             weight.includes(searchTerm) ||
                             city.includes(searchTerm) ||
                             club.includes(searchTerm);
            }
            
            return genderMatch && ageMatch && weightMatch && searchMatch;
        });
        
        // Reset to first page when filtering
        currentPage = 1;
        renderCurrentPage();
        updateResultsCount();
    }

    /**
     * Legacy filter function for backward compatibility
     */
    function filterAthletes(category, searchTerm = '') {
        currentFilters.gender = category;
        currentFilters.search = searchTerm;
        applyAllFilters();
    }
    
    /**
     * Update results count display
     */
    function updateResultsCount() {
        const countElement = document.querySelector('.results-count strong');
        if (countElement) {
            countElement.textContent = filteredAthletes.length;
        }
        
        // Update pagination info if exists
        const paginationInfo = document.querySelector('.pagination-info');
        if (paginationInfo) {
            const totalPages = Math.ceil(filteredAthletes.length / athletesPerPage);
            const startIndex = (currentPage - 1) * athletesPerPage + 1;
            const endIndex = Math.min(currentPage * athletesPerPage, filteredAthletes.length);
            
            if (filteredAthletes.length === 0) {
                paginationInfo.textContent = 'Спортсменів не знайдено';
            } else {
                paginationInfo.textContent = `Показано ${startIndex}-${endIndex} з ${filteredAthletes.length} спортсменів`;
            }
        }
    }
    
    /**
     * Initialize scroll-based animations
     */
    function initScrollAnimations() {
        // Create intersection observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        // Observe elements for animation
        const animatedElements = document.querySelectorAll('.athlete-card, .coach-card, .achievement-card, .team-stat');
        animatedElements.forEach(el => {
            observer.observe(el);
        });
        
        // Add CSS for animations
        addAnimationStyles();
    }
    
    /**
     * Add animation styles dynamically
     */
    function addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .athlete-card, .coach-card, .achievement-card, .team-stat {

                transform: translateY(30px);
                transition: all 0.6s ease;
            }
            
            .athlete-card.animate-in, .coach-card.animate-in, 
            .achievement-card.animate-in, .team-stat.animate-in {
                opacity: 1;
                transform: translateY(0);
            }
            
            .athlete-card:nth-child(even).animate-in {
                transition-delay: 0.1s;
            }
            
            .athlete-card:nth-child(3n).animate-in {
                transition-delay: 0.2s;
            }
            
            .athlete-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Initialize animated counters for statistics
     */
    function initStatCounters() {
        const statNumbers = document.querySelectorAll('.team-stat-number');
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        statNumbers.forEach(stat => {
            observer.observe(stat);
        });
    }
    
    /**
     * Animate counter numbers
     */
    function animateCounter(element) {
        const target = parseInt(element.textContent);
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    }
    
    /**
     * Initialize coach card interactions
     */
    function initCoachCards() {
        const coachCards = document.querySelectorAll('.coach-card');
        
        coachCards.forEach(card => {
            card.addEventListener('click', function() {
                const coachName = this.querySelector('.coach-name').textContent;
                console.log(`Clicked on coach: ${coachName}`);
            });
        });
    }
    
    /**
     * Initialize enhanced search functionality
     */
    function initSearch() {
        const searchInput = document.querySelector('.enhanced-search-input');
        const searchClearBtn = document.querySelector('.search-clear-btn');
        
        if (!searchInput) return;
        
        let searchTimeout;
        
        // Handle input with debouncing
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = e.target.value.toLowerCase();
                applyAllFilters();
            }, 300);
        });
        
        // Handle clear button
        if (searchClearBtn) {
            searchClearBtn.addEventListener('click', () => {
                searchInput.value = '';
                currentFilters.search = '';
                applyAllFilters();
                searchInput.focus();
            });
        }
        
        // Handle Enter key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                currentFilters.search = e.target.value.toLowerCase();
                applyAllFilters();
            }
        });
        
        // Handle focus/blur effects
        searchInput.addEventListener('focus', () => {
            const wrapper = searchInput.closest('.search-input-wrapper');
            wrapper?.classList.add('focused');
        });
        
        searchInput.addEventListener('blur', () => {
            const wrapper = searchInput.closest('.search-input-wrapper');
            wrapper?.classList.remove('focused');
        });
    }
    
    // Initialize additional features
    initCoachCards();
    
    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close any open modals or reset filters
            const activeButton = document.querySelector('.team-category-btn[data-category="all"]');
            if (activeButton) {
                activeButton.click();
            }
        }
    });
    
    // Smooth scroll for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    /**
     * Load coaches data from JSON files
     */
    async function loadCoachesData() {
        try {
            const response = await fetch('scripts/team/coaches.json');
            const data = await response.json();
            
            const coachesGrid = document.getElementById('coaches-grid');
            
            // Remove loading indicator
            const loadingElement = coachesGrid.querySelector('.loading-coaches');
            if (loadingElement) {
                loadingElement.remove();
            }
            
            // Load detailed data for all coaches
            const allCoaches = [];
            for (const coach of data.coaches) {
                // Load detailed coach data for filtering
                let detailedData = null;
                try {
                    const response = await fetch(`scripts/team/articles/coaches/${coach.id}.json`);
                    detailedData = await response.json();
                } catch (error) {
                    console.warn(`Could not load detailed data for coach ${coach.id}`);
                }

                const coachCard = await createCoachCard(coach, detailedData);
                allCoaches.push({
                    element: coachCard,
                    data: coach,
                    detailedData: detailedData
                });
                
                coachesGrid.appendChild(coachCard);
            }
            
            // Initialize coach filtering
            initCoachFiltering(allCoaches);
            
        } catch (error) {
            console.error('Error loading coaches data:', error);
            
            // Show error message
            const coachesGrid = document.getElementById('coaches-grid');
            coachesGrid.innerHTML = `
                <div class="loading-coaches">
                    <p style="color: #e74c3c;">❌ Помилка завантаження тренерського штабу</p>
                    <button onclick="location.reload()" style="margin-top: 10px; padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Спробувати знову
                    </button>
                </div>
            `;
        }
    }

    /**
     * Create coach card element
     */
    async function createCoachCard(coach, detailedData = null) {
        const card = document.createElement('div');
        card.className = 'coach-card';
        card.setAttribute('data-category', coach.category);
        
        // Create image element with placeholder fallback
        const imageContent = createCoachImageContent(coach);
        
        // Get additional info from detailed data
        const achievements = detailedData?.achievements?.length || 0;
        const experience = coach.experience || '—';
        const specialization = coach.specialization || '';
        
        card.innerHTML = `
            <div class="coach-category-badge ${coach.category}">${getCategoryName(coach.category)}</div>
            
            <div class="coach-image-container">
                ${imageContent}
            </div>
            
            <div class="coach-content">
                <h3 class="coach-name">${coach.name}</h3>
                <div class="coach-position">${coach.position}</div>
                
                <div class="coach-experience-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    ${experience} років досвіду
                </div>
                
                ${specialization ? `<p class="coach-specialization">${specialization}</p>` : ''}
                
                ${achievements > 0 ? `
                <div class="coach-achievements-preview">
                    <span class="coach-achievement-count">${achievements} досягнень</span>
                </div>
                ` : ''}
                
                <div class="coach-actions">
                    <button class="coach-btn" onclick="window.location.href='coach.html?id=${coach.id}'">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Переглянути профіль
                    </button>
                </div>
            </div>
        `;
        
        return card;
    }

    /**
     * Create coach image content with placeholder fallback
     */
    function createCoachImageContent(coach) {
        // Get initials from name
        const getInitials = (name) => {
            return name.split(' ')
                .map(word => word.charAt(0))
                .join('')
                .substring(0, 2)
                .toUpperCase();
        };
        
        const initials = getInitials(coach.name);
        
        // Check if image exists and is not a placeholder path
        const hasImage = coach.image && 
                         coach.image.trim() !== '' &&
                         !coach.image.includes('placeholder') && 
                         coach.image !== 'assets/images/placeholder.jpg';
        
        if (hasImage) {
            return `
                <img src="${coach.image}" 
                     alt="${coach.name}" 
                     class="coach-image"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="coach-placeholder" style="display: none;">
                    <span class="coach-placeholder-initials">${initials}</span>
                </div>
            `;
        } else {
            return `
                <div class="coach-placeholder">
                    <span class="coach-placeholder-initials">${initials}</span>
                </div>
            `;
        }
    }

    /**
     * Get category display name
     */
    function getCategoryName(category) {
        const categories = {
            'head': 'Керівництво',
            'men': 'Чоловіча',
            'women': 'Жіноча', 
            'youth': 'Молодіжна',
            'technical': 'Технічний',
            'medical': 'Медичний',
            'physical': 'Фізична'
        };
        return categories[category] || category;
    }

    /**
     * Initialize coach filtering
     */
    function initCoachFiltering(coaches) {
        const categoryButtons = document.querySelectorAll('.coach-category-btn');
        
        categoryButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Update active button
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Filter coaches
                const category = this.getAttribute('data-category');
                filterCoaches(coaches, category);
            });
        });
    }

    /**
     * Filter coaches by category
     */
    function filterCoaches(coaches, category) {
        coaches.forEach(coach => {
            const shouldShow = category === 'all' || coach.data.category === category;
            
            if (shouldShow) {
                coach.element.classList.remove('hidden');
                coach.element.style.display = 'block';
            } else {
                coach.element.classList.add('hidden');
                coach.element.style.display = 'none';
            }
        });
        
        // Check if any coaches are visible
        const visibleCoaches = coaches.filter(coach => !coach.element.classList.contains('hidden'));
        const coachesGrid = document.getElementById('coaches-grid');
        
        // Remove any existing "no results" message
        const existingNoResults = coachesGrid.querySelector('.no-coaches-found');
        if (existingNoResults) {
            existingNoResults.remove();
        }
        
        if (visibleCoaches.length === 0) {
            const noResultsElement = document.createElement('div');
            noResultsElement.className = 'no-coaches-found';
            noResultsElement.innerHTML = `
                <h3>🔍 Тренерів не знайдено</h3>
                <p>Спробуйте обрати іншу категорію</p>
                <button class="reset-filters-btn" onclick="document.querySelector('.coach-category-btn[data-category=all]').click()">
                    Показати всіх тренерів
                </button>
            `;
            coachesGrid.appendChild(noResultsElement);
        }
    }

});

// Export functions for potential external use
window.TeamPage = {
    filterAthletes: function(category) {
        const button = document.querySelector(`[data-category="${category}"]`);
        if (button) button.click();
    },
    
    searchAthletes: function(term) {
        const searchInput = document.querySelector('.team-search');
        if (searchInput) {
            searchInput.value = term;
            searchInput.dispatchEvent(new Event('input'));
        }
    }
}; 