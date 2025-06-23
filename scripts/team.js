// Team Page JavaScript - Optimized Version
document.addEventListener('DOMContentLoaded', function() {
    
    // Core variables
    let allAthletes = [];
    let filteredAthletes = [];
    let athleteDetailsCache = new Map();
    let currentPage = 1;
    const athletesPerPage = 6; // Увеличено для лучшей производительности
    let currentFilters = {
        gender: 'all',
        age: 'all',
        weight: 'all',
        status: 'all', // all, main, reserve
        search: ''
    };
    
    // Performance tracking
    let isLoading = false;
    let detailsLoadQueue = [];
    
    // Initialize optimized functionality
    initOptimizedSystem();
    
    /**
     * Optimized system initialization
     */
    async function initOptimizedSystem() {
        try {
            // Start with basic animations and controls
    initScrollAnimations();
    initStatCounters();
            initTeamFiltering();
            
            // Load athlete data from folders
            await loadBasicAthletesData();
            
            // Load coaches separately
    loadCoachesData();
            
        } catch (error) {
            showError('Помилка ініціалізації системи');
        }
    }

    /**
     * Fast initial load - only basic data
     */
    async function loadBasicAthletesData() {
        if (isLoading) return;
        isLoading = true;
        
        try {
            const athletesGrid = document.getElementById('athletes-grid');
            if (!athletesGrid) return;
            
            // Remove loading indicator
            const loadingElement = athletesGrid.querySelector('.loading-athletes');
            loadingElement?.remove();
            
            // Load athletes from both men and women folders
            const [menAthletes, womenAthletes] = await Promise.all([
                loadAthletesFromFolder('men'),
                loadAthletesFromFolder('women')
            ]);
            
            // Combine and sort athletes by rank
            allAthletes = [...menAthletes, ...womenAthletes]
                .sort((a, b) => (a.data.rank || 999) - (b.data.rank || 999));
            
            filteredAthletes = [...allAthletes];
            updateResultsCount();
            renderCurrentPage();
            initPagination();
            
        } catch (error) {
            showError('Помилка завантаження спортсменів');
        } finally {
            isLoading = false;
        }
    }
    
    /**
     * Load athletes from specific folder
     */
    async function loadAthletesFromFolder(folderName) {
        const athletes = [];
        const athleteFiles = getAthleteFilesList(folderName);
        
        // Load athletes in batches for better performance
        const batchSize = 5;
        for (let i = 0; i < athleteFiles.length; i += batchSize) {
            const batch = athleteFiles.slice(i, i + batchSize);
            const batchPromises = batch.map(async (fileName) => {
                try {
                    const response = await fetch(`scripts/team/${folderName}/${fileName}`);
                    if (response.ok) {
                        const athleteData = await response.json();
                        return {
                            data: {
                                id: athleteData.id,
                                name: athleteData.name,
                                rank: athleteData.rank || 999,
                                category: athleteData.category,
                                weight: athleteData.weight,
                                city: athleteData.city,
                                club: athleteData.club,
                                dan: athleteData.dan,
                                image: athleteData.image,
                                status: athleteData.status || 'main' // main or reserve
                            },
                            detailedData: athleteData, // Store full data immediately
                            element: null
                        };
                    }
            } catch (error) {
                    return null;
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            athletes.push(...batchResults.filter(athlete => athlete !== null));
        }
        
        return athletes;
    }

    /**
     * Get list of athlete files from folder
     */
    function getAthleteFilesList(folderName) {
        const knownFiles = {
            'men': [
                'nikita-yudanov.json', 'nazar-viskov.json', 'anton-savytskiy.json', 
                'artem-lesiuk.json', 'mykhailo-solyanik.json', 'mykhailo-svidrak.json',
                'mykola-hrybyk.json', 'mykyta-holoborodko.json', 'nazar-kulieshov.json',
                'nikita-batii.json', 'oleksandr-koshlyak.json', 'oleksiy-yershov.json',
                'said-magoomed-khalidov.json', 'sergiy-kim.json', 'sergiy-nebotov.json',
                'stanislav-gunchenko.json', 'stanislav-semkov.json', 'taras-nelzev.json',
                'vladyslav-kolobov.json', 'zaur-duniamaliev.json', 'yevgeniy-balievskiy.json',
                'yaroslav-omelchenko.json', 'yakiv-khammo.json', 'tymur-valeyev.json',
                'bogdan-yadov.json', 'danylo-kravchenko.json', 'denys-tupytskiy.json',
                'dilshot-khalmatov.json', 'dmytro-lebid.json', 'gagik-martirosyan.json',
                'glib-dubina.json', 'gevorg-manukian.json', 'ivan-kutenkov.json',
                'karo-marandyan.json', 'khazar-heydarov.json', 'kyrylo-samotug.json',
                'marat-kryzhanskiy.json', 'andriy-kolesnik.json', 'aleksey-moiseiev.json',
                'vladyslav-kazimirov.json'
            ],
            'women': [
                'inna-shynkarenko.json', 'alina-shylova.json', 'anastasia-chyzhevska.json',
                'olga-tsimko.json', 'anastasia-sykish.json', 'tetiana-limzaeva.json',
                'anastasiia-severin.json', 'diana-semchenko.json', 'maria-rytska.json',
                'kristina-opanasenko.json', 'snizhana-plish.json', 'anna-oliinyk-korniiko.json',
                'marharyta-miroshnichenko.json', 'yelyzaveta-lytvynenko.json', 'anastasiia-levchenko.json',
                'halyna-kovalska.json', 'yulia-kurchenko.json', 'anna-kazakova.json',
                'yulia-grebenozhko.json', 'khrystyna-homan.json', 'alisa-videneeva.json',
                'sofia-bordinskih.json', 'daria-bilodid.json', 'daria-boychenko.json',
                'anastasia-antipina.json'
            ]
        };
        
        return knownFiles[folderName] || [];
    }

    /**
     * Since we now load full data immediately, these lazy loading functions are simplified
     */
    async function startLazyDetailsLoading() {
        // No longer needed as we load full data immediately
        return;
    }

    async function processDetailsQueue() {
        // No longer needed as we load full data immediately
        return;
    }

    async function loadAthleteDetails(athleteId) {
        // No longer needed as we load full data immediately
        return;
    }

    /**
     * Get currently visible athletes
     */
    function getVisibleAthletes() {
        const startIndex = (currentPage - 1) * athletesPerPage;
        const endIndex = startIndex + athletesPerPage;
        return filteredAthletes.slice(startIndex, endIndex);
    }

    /**
     * Update athlete card with detailed data (simplified since data is always available)
     */
    function updateAthleteCard(athlete) {
        // No longer needed since we create cards with full data immediately
        return;
    }
    
    /**
     * Create optimized athlete card element with new design
     */
    function createAthleteCard(athleteData, detailedData = null) {
        const card = document.createElement('div');
        card.className = 'athlete-card';
        card.setAttribute('data-category', athleteData.category);
        card.setAttribute('data-status', athleteData.status || 'main');
        card.setAttribute('data-id', athleteData.id);
        
        // Get basic info with fallbacks
        const age = detailedData ? calculateAge(detailedData.birthDate) : '—';
        const dan = detailedData?.dan || athleteData.dan || '—';
        const city = detailedData?.city || athleteData.city || '—';
        const rankDisplay = typeof athleteData.rank === 'number' ? `#${athleteData.rank}` : athleteData.rank;
        const status = athleteData.status || 'main';
        const statusText = status === 'main' ? 'Основний Склад' : 'Резерв';
        
        // Create image element with optimized loading
        const imageContent = createAthleteImageContent(athleteData);
        
        // Base card structure with new design
        card.innerHTML = `
            <div class="athlete-image-container" onclick="toggleTagsFromImage(this)">
                ${imageContent}
                <div class="athlete-overlay">
                    <div class="athlete-status-display ${status}">
                        ${status === 'main' ? 
                            '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>' :
                            '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
                        }
                        <span class="status-text">${statusText}</span>
                    </div>
                    <div class="athlete-weight">${athleteData.weight}</div>
                </div>
                <button class="tags-toggle-btn" onclick="event.stopPropagation(); toggleTags(this)">
                    Нажміть щоб сховати теги
                </button>
            </div>
            
            <div class="athlete-content">
                <div class="athlete-header">
                    <h3 class="athlete-name">${athleteData.name}</h3>
                    <div class="athlete-dan-badge ${getTitleInfo(dan).class}" 
                         title="${getTitleInfo(dan).fullName}"
                         data-tooltip="${getTitleInfo(dan).description}">${dan}</div>
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
                
                <div class="athlete-achievements">
                    ${detailedData && detailedData.achievements ? createAchievementsHTML(detailedData.achievements) : ''}
                </div>
                
                <div class="athlete-actions">
                    <button class="athlete-btn athlete-btn-primary" onclick="window.location.href='athlete.html?id=${athleteData.id}'">
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
     * Create achievements HTML with improved design
     */
    function createAchievementsHTML(achievements) {
        if (!achievements || achievements.length === 0) return '';
        
        // Count medals by type
        const medalCount = {
            gold: achievements.filter(a => a.type === 'gold').length,
            silver: achievements.filter(a => a.type === 'silver').length,
            bronze: achievements.filter(a => a.type === 'bronze').length
        };
        
        const totalMedals = medalCount.gold + medalCount.silver + medalCount.bronze;
        
        // Show latest achievement
        const latestAchievement = achievements.sort((a, b) => (b.year || 0) - (a.year || 0))[0];
        const achievementTitle = latestAchievement.title.length > 30 
            ? latestAchievement.title.substring(0, 30) + '...' 
            : latestAchievement.title;
        
        // Get medal emoji and color for latest achievement
        const getMedalInfo = (type) => {
            switch(type) {
                case 'gold': return { emoji: '🥇', class: 'gold', text: 'Золото' };
                case 'silver': return { emoji: '🥈', class: 'silver', text: 'Срібло' };
                case 'bronze': return { emoji: '🥉', class: 'bronze', text: 'Бронза' };
                default: return { emoji: '🏆', class: 'other', text: 'Нагорода' };
            }
        };
        
        const medalInfo = getMedalInfo(latestAchievement.type);
        
        // Create compact medals display
        let medalsHTML = '';
        if (totalMedals > 0) {
            medalsHTML = `
                <div class="medals-summary">
                    <div class="medals-total">
                        <svg class="medal-icon-main" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="8" r="6"/>
                            <polyline points="8,14 12,18 16,14"/>
                            <line x1="12" y1="18" x2="12" y2="22"/>
                        </svg>
                        <span class="medals-count">${totalMedals}</span>
                    </div>
                    <div class="medals-breakdown">
                        ${medalCount.gold > 0 ? `<span class="medal-mini gold" title="Золото: ${medalCount.gold}">🥇${medalCount.gold}</span>` : ''}
                        ${medalCount.silver > 0 ? `<span class="medal-mini silver" title="Срібло: ${medalCount.silver}">🥈${medalCount.silver}</span>` : ''}
                        ${medalCount.bronze > 0 ? `<span class="medal-mini bronze" title="Бронза: ${medalCount.bronze}">🥉${medalCount.bronze}</span>` : ''}
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="athlete-achievements-new">
                    ${medalsHTML}
                <div class="latest-achievement-new">
                    <div class="achievement-header">
                        <svg class="achievement-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                        </svg>
                        <span class="achievement-label">Останнє досягнення</span>
                        <span class="achievement-medal ${medalInfo.class}">${medalInfo.emoji}</span>
                </div>
                    <div class="achievement-content">
                        <div class="achievement-title">${achievementTitle}</div>
                        <div class="achievement-year">${latestAchievement.year}</div>
                    </div>
                </div>
            </div>
        `;
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
        const titles = {
            'МСУМК': 'title-msmk',
            'ЗМСУ': 'title-zmsu', 
            'МС': 'title-ms',
            'МСУ': 'title-ms', // МСУ и МС имеют одинаковые стили
            'КМС': 'title-kms',
            'КМСУ': 'title-kms' // КМСУ и КМС имеют одинаковые стили
        };
        
        return titles[dan] || 'title-default';
    }

    /**
     * Get title information for sport ranks
     */
    function getTitleInfo(dan) {
        const titles = {
            'МСУМК': {
                class: 'title-msmk',
                fullName: 'Майстер спорту України міжнародного класу',
                description: 'Найвище спортивне звання в Україні'
            },
            'ЗМСУ': {
                class: 'title-zmsu',
                fullName: 'Заслужений майстер спорту України',
                description: 'Почесне звання за видатні спортивні досягнення'
            },
            'МС': {
                class: 'title-ms',
                fullName: 'Майстер спорту',
                description: 'Високе спортивне звання'
            },
            'МСУ': {
                class: 'title-ms',
                fullName: 'Майстер спорту України',
                description: 'Високе спортивне звання України'
            },
            'КМС': {
                class: 'title-kms',
                fullName: 'Кандидат у майстри спорту',
                description: 'Підготовчий рівень до майстра спорту'
            },
            'КМСУ': {
                class: 'title-kms',
                fullName: 'Кандидат у майстри спорту України',
                description: 'Підготовчий рівень до майстра спорту України'
            }
        };

        return titles[dan] || {
            class: 'title-default',
            fullName: dan,
            description: 'Спортивне звання'
        };
    }
    
    /**
     * Render current page of athletes
     */
    /**
     * Optimized page rendering with lazy loading
     */
    function renderCurrentPage() {
        const athletesGrid = document.getElementById('athletes-grid');
        if (!athletesGrid) return;
        
        // Clear current content
        athletesGrid.innerHTML = '';
        
        if (filteredAthletes.length === 0) {
            renderNoResults(athletesGrid);
            updatePaginationControls();
            return;
        }
        
        const startIndex = (currentPage - 1) * athletesPerPage;
        const endIndex = startIndex + athletesPerPage;
        const currentAthletes = filteredAthletes.slice(startIndex, endIndex);
        
        // Create fragment for better performance
        const fragment = document.createDocumentFragment();
        
        // Render athlete cards
        currentAthletes.forEach((athlete, index) => {
            if (!athlete.element) {
                athlete.element = createAthleteCard(athlete.data, athlete.detailedData);
            }
            fragment.appendChild(athlete.element);
            
            // Add staggered animation
            requestAnimationFrame(() => {
            setTimeout(() => {
                athlete.element.classList.add('animate-in');
                }, index * 50); // Reduced delay for faster feel
            });
        });
        
        athletesGrid.appendChild(fragment);
        updatePaginationControls();
    }

    /**
     * Show error message
     */
    function showError(message) {
        const athletesGrid = document.getElementById('athletes-grid');
        if (athletesGrid) {
            athletesGrid.innerHTML = `
                <div class="loading-athletes">
                    <p style="color: #e74c3c;">❌ ${message}</p>
                    <button onclick="location.reload()" style="margin-top: 10px; padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Спробувати знову
                    </button>
                </div>
            `;
        }
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
                <div class="pagination-controls">
                    <button id="prev-page" class="pagination-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 18L9 12L15 6"/>
                        </svg>
                    </button>
                    <div id="page-numbers" class="page-numbers"></div>
                    <button id="next-page" class="pagination-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 18L15 12L9 6"/>
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
        
        // Update prev/next buttons with smooth transitions
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        
        if (prevBtn) {
            const isDisabled = currentPage === 1;
            prevBtn.disabled = isDisabled;
            prevBtn.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            if (isDisabled) {
                prevBtn.style.opacity = '0.4';
                prevBtn.style.transform = 'scale(0.95)';
                prevBtn.style.cursor = 'not-allowed';
            } else {
                prevBtn.style.opacity = '1';
                prevBtn.style.transform = 'scale(1)';
                prevBtn.style.cursor = 'pointer';
            }
        }
        
        if (nextBtn) {
            const isDisabled = currentPage === totalPages;
            nextBtn.disabled = isDisabled;
            nextBtn.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            if (isDisabled) {
                nextBtn.style.opacity = '0.4';
                nextBtn.style.transform = 'scale(0.95)';
                nextBtn.style.cursor = 'not-allowed';
            } else {
                nextBtn.style.opacity = '1';
                nextBtn.style.transform = 'scale(1)';
                nextBtn.style.cursor = 'pointer';
            }
        }
        
        // Update page numbers
        updatePageNumbers(totalPages);
    }
    
    /**
     * Smart page numbers with ellipsis
     */
    function updatePageNumbers(totalPages) {
        const pageNumbersContainer = document.getElementById('page-numbers');
        if (!pageNumbersContainer) return;
        
        // Add fade-out animation
        pageNumbersContainer.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        pageNumbersContainer.style.opacity = '0';
        pageNumbersContainer.style.transform = 'translateY(5px)';
        
        setTimeout(() => {
            pageNumbersContainer.innerHTML = '';
            
            // Simple pagination for small number of pages
            if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) {
                    createPageButton(i, pageNumbersContainer);
                }
            } else {
                // Advanced pagination with ellipsis
                const showPages = [];
                
                // Always show first page
                showPages.push(1);
                
                // Calculate range around current page
                const startRange = Math.max(2, currentPage - 1);
                const endRange = Math.min(totalPages - 1, currentPage + 1);
                
                // Add ellipsis after first page if needed
                if (startRange > 2) {
                    showPages.push('...');
                }
                
                // Add pages around current page
                for (let i = startRange; i <= endRange; i++) {
                    if (i !== 1 && i !== totalPages) {
                        showPages.push(i);
                    }
                }
                
                // Add ellipsis before last page if needed
                if (endRange < totalPages - 1) {
                    showPages.push('...');
                }
                
                // Always show last page
                if (totalPages > 1) {
                    showPages.push(totalPages);
                }
                
                // Create buttons
                showPages.forEach(page => {
                    if (page === '...') {
                        const ellipsis = document.createElement('span');
                        ellipsis.className = 'page-ellipsis';
                        ellipsis.textContent = '...';
                        pageNumbersContainer.appendChild(ellipsis);
                    } else {
                        createPageButton(page, pageNumbersContainer);
                    }
                });
            }
            
            // Add fade-in animation
            pageNumbersContainer.style.opacity = '1';
            pageNumbersContainer.style.transform = 'translateY(0)';
        }, 200);
    }

    /**
     * Create page button
     */
    function createPageButton(pageNumber, container) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${pageNumber === currentPage ? 'active' : ''}`;
        pageBtn.textContent = pageNumber;
        pageBtn.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        pageBtn.style.opacity = '0';
        pageBtn.style.transform = 'translateY(10px) scale(0.9)';
        
        pageBtn.addEventListener('click', () => {
            if (pageNumber !== currentPage) {
                // Add click animation
                pageBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    pageBtn.style.transform = 'scale(1)';
                }, 150);
                
                currentPage = pageNumber;
                renderCurrentPage();
                
                // Scroll to top of results
                const athletesGrid = document.getElementById('athletes-grid');
                if (athletesGrid) {
                    athletesGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
        
        // Add hover effects
        pageBtn.addEventListener('mouseenter', () => {
            if (pageNumber !== currentPage) {
                pageBtn.style.transform = 'translateY(-2px) scale(1.05)';
            }
        });
        
        pageBtn.addEventListener('mouseleave', () => {
            if (pageNumber !== currentPage) {
                pageBtn.style.transform = 'translateY(0) scale(1)';
            }
        });
        
        container.appendChild(pageBtn);
        
        // Animate in with stagger
        const index = Array.from(container.children).indexOf(pageBtn);
        setTimeout(() => {
            pageBtn.style.opacity = '1';
            pageBtn.style.transform = 'translateY(0) scale(1)';
        }, index * 50);
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

        // Custom dropdown for weight filter
        initCustomDropdown();

        // Status filter buttons
        const statusButtons = document.querySelectorAll('.team-status-btn');
        statusButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all status buttons
                statusButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Update filter
                currentFilters.status = button.dataset.status;
                applyAllFilters();
            });
        });

        // Search functionality
        initSearch();
    }

    /**
     * Initialize custom dropdown functionality
     */
    function initCustomDropdown() {
        const dropdown = document.getElementById('weight-dropdown');
        if (!dropdown) return;

        const trigger = dropdown.querySelector('.dropdown-trigger');
        const menu = dropdown.querySelector('.dropdown-menu');
        const value = dropdown.querySelector('.dropdown-value');
        const items = dropdown.querySelectorAll('.dropdown-item');

        if (!trigger || !menu || !value || !items.length) return;

        // Toggle dropdown on trigger click
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isOpen = menu.classList.contains('show');
            
            // Close all other dropdowns first
            document.querySelectorAll('.dropdown-menu.show').forEach(openMenu => {
                if (openMenu !== menu) {
                    openMenu.classList.remove('show');
                    openMenu.parentElement.querySelector('.dropdown-trigger').classList.remove('active');
                }
            });
            
            // Toggle current dropdown
            if (isOpen) {
                menu.classList.remove('show');
                trigger.classList.remove('active');
            } else {
                menu.classList.add('show');
                trigger.classList.add('active');
            }
        });

        // Handle item selection
        items.forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Remove active class from all items
                items.forEach(i => i.classList.remove('active'));
                
                // Add active class to selected item
                this.classList.add('active');
                
                // Update displayed value
                value.textContent = this.textContent;
                
                // Update filter
                currentFilters.weight = this.getAttribute('data-value');
                applyAllFilters();
                
                // Close dropdown
                menu.classList.remove('show');
                trigger.classList.remove('active');
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) {
                menu.classList.remove('show');
                trigger.classList.remove('active');
            }
        });

        // Close dropdown on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                menu.classList.remove('show');
                trigger.classList.remove('active');
            }
        });

        // Keyboard navigation
        trigger.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                trigger.click();
            }
        });

        // Focus management for accessibility
        menu.addEventListener('keydown', function(e) {
            const currentItem = menu.querySelector('.dropdown-item:focus');
            let nextItem;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    nextItem = currentItem ? currentItem.nextElementSibling : items[0];
                    if (nextItem) nextItem.focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    nextItem = currentItem ? currentItem.previousElementSibling : items[items.length - 1];
                    if (nextItem) nextItem.focus();
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (currentItem) currentItem.click();
                    break;
                case 'Escape':
                    e.preventDefault();
                    menu.classList.remove('show');
                    trigger.classList.remove('active');
                    trigger.focus();
                    break;
            }
        });

        // Make dropdown items focusable
        items.forEach(item => {
            item.setAttribute('tabindex', '0');
        });
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
     * Optimized filter application with performance improvements
     */
    function applyAllFilters() {
        const searchInput = document.querySelector('.enhanced-search-input');
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        // Reset to first page when filtering
        currentPage = 1;
        
        // Use single filter pass for better performance
        filteredAthletes = allAthletes.filter(athlete => {
            // Gender filter
            if (currentFilters.gender !== 'all' && athlete.data.category !== currentFilters.gender) {
                return false;
            }
            
            // Status filter (main/reserve)
            if (currentFilters.status !== 'all' && (athlete.data.status || 'main') !== currentFilters.status) {
                return false;
            }
            
            // Weight filter (fast check first)
            if (currentFilters.weight !== 'all' && athlete.data.weight !== currentFilters.weight) {
                return false;
            }
            
            // Search filter (optimize string operations)
            if (searchTerm) {
                const name = athlete.data.name.toLowerCase();
                if (name.includes(searchTerm)) {
                    return true; // Early return for name match
                }
                
                // Check other fields only if name doesn't match
                const weight = athlete.data.weight.toLowerCase();
                if (weight.includes(searchTerm)) {
                    return true;
                }
                
                // Check detailed data from cache if available
                const cachedData = athleteDetailsCache.get(athlete.data.id);
                if (cachedData) {
                    const city = cachedData.city?.toLowerCase() || '';
                    const club = cachedData.club?.toLowerCase() || '';
                    if (city.includes(searchTerm) || club.includes(searchTerm)) {
                        return true;
                    }
                }
                
                return false; // No search match found
            }
            
            // Age filter (most expensive, do last)
            if (currentFilters.age !== 'all') {
                const cachedData = athleteDetailsCache.get(athlete.data.id);
                const birthDate = athlete.detailedData?.birthDate || cachedData?.birthDate;
                
                if (!birthDate) {
                    return false; // Skip athletes without birth date
                }
                
                const athleteAgeCategory = getAgeCategory(birthDate);
                return athleteAgeCategory === currentFilters.age;
            }
            
            return true;
        });
        
        updateResultsCount();
        renderCurrentPage();
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
                const coachId = this.getAttribute('data-coach-id');
                if (coachId) {
                    window.location.href = `coach.html?id=${coachId}`;
                }
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
     * Load coaches data from folder structure
     */
    async function loadCoachesData() {
        try {
            const coachesGrid = document.getElementById('coaches-grid');
            if (!coachesGrid) return;
            
            // Remove loading indicator
            const loadingElement = coachesGrid.querySelector('.loading-coaches');
            loadingElement?.remove();
            
            // Load coaches from coaches folder
            const coaches = await loadCoachesFromFolder();
            
            // Create coaches array
            const allCoaches = [];
            const fragment = document.createDocumentFragment();
            
            for (const coach of coaches) {
                const coachCard = await createCoachCard(coach.data, coach.detailedData);
                allCoaches.push({
                    element: coachCard,
                    data: coach.data,
                    detailedData: coach.detailedData
                });
                
                fragment.appendChild(coachCard);
            }
            
            coachesGrid.appendChild(fragment);
            initCoachFiltering(allCoaches);
            
        } catch (error) {
            showCoachError();
        }
    }

    /**
     * Load coaches from individual coach files
     */
    async function loadCoachesFromFolder() {
        const coaches = [];
        const coachFiles = getCoachFilesList();
        
        // Load coaches in batches for better performance
        const batchSize = 3;
        for (let i = 0; i < coachFiles.length; i += batchSize) {
            const batch = coachFiles.slice(i, i + batchSize);
            const batchPromises = batch.map(async (fileName) => {
                try {
                    const response = await fetch(`scripts/team/coaches/${fileName}`);
                    if (response.ok) {
                        const coachData = await response.json();
                        return {
                            data: {
                                id: coachData.id,
                                name: coachData.name,
                                position: coachData.position,
                                category: coachData.category,
                                experience: coachData.experience,
                                image: coachData.image,
                                rank: coachData.rank || 999,
                                status: coachData.status || 'main'
                            },
                            detailedData: coachData
                        };
                    }
                } catch (error) {
                    console.warn(`Failed to load coach file: ${fileName}`, error);
                    return null;
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            coaches.push(...batchResults.filter(coach => coach !== null));
        }
        
        // Sort by rank
        coaches.sort((a, b) => (a.data.rank || 999) - (b.data.rank || 999));
        
        return coaches;
    }

    /**
     * Get list of coach files
     */
    function getCoachFilesList() {
        return [
            'vitaliy-dubrova.json',
            'oleksandr-kosinov.json', 
            'hanna-kashtanova.json',
            'mykhailo-rudenko.json',
            'serhiy-drebot.json',
            'niabali-kedjau.json',
            'dmytro-bondarchuk.json',
            'ivanna-makukha.json',
            'andriy-burdun.json',
            'andriy-bloshenko.json'
        ];
    }



    /**
     * These functions are no longer needed since we load full data immediately
     */
    async function loadCoachDetails(coachId, coachCard) {
        return; // No longer needed
    }

    function updateCoachCard(coachCard, detailedData) {
        return; // No longer needed
    }

    /**
     * Show coach loading error
     */
    function showCoachError() {
            const coachesGrid = document.getElementById('coaches-grid');
        if (coachesGrid) {
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
        card.className = 'coach-card clickable-card';
        card.setAttribute('data-category', coach.category);
        card.setAttribute('data-id', coach.id);
        
        // Add click handler to entire card
        card.addEventListener('click', function(e) {
            // Only navigate if click wasn't on a button or interactive element
            if (!e.target.closest('button')) {
                window.location.href = `coach.html?id=${coach.id}`;
            }
        });
        
        // Create image element with placeholder fallback
        const imageContent = createCoachImageContent(coach);
        
        // Get additional info from detailed data
        const achievements = detailedData?.awards?.length || 0;
        const experience = coach.experience || detailedData?.experience || '—';
        const specialization = coach.specialization || detailedData?.position || '';
        
        card.innerHTML = `
            <div class="coach-category-badge ${coach.category}">${getCategoryName(coach.category)}</div>
            
            <div class="coach-image-container">
                ${imageContent}
            </div>
            
            <div class="coach-content">
                <div class="coach-header">
                    <h3 class="coach-name">${coach.name}</h3>
                </div>
                
                <div class="coach-position">${coach.position}</div>
                
                <div class="coach-info-grid">
                    <div class="coach-info-item">
                        <svg class="coach-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        <span class="coach-info-text">${experience} років досвіду</span>
                    </div>
                </div>
                
                ${specialization ? `<div class="coach-specialization">${specialization}</div>` : ''}
                
                ${achievements > 0 ? `
                <div class="coach-achievements-preview">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                    </svg>
                    <span class="coach-achievement-count">${achievements} досягнень</span>
                </div>
                ` : ''}
                
                <div class="coach-actions">
                    <div class="coach-click-hint">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Натисніть для перегляду профілю
                    </div>
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
                    <div class="coach-placeholder-initials">${initials}</div>
                </div>
            `;
        } else {
            return `
                <div class="coach-placeholder">
                    <div class="coach-placeholder-initials">${initials}</div>
                </div>
            `;
        }
    }

    /**
     * Get category display name
     */
    function getCategoryName(category) {
        const categories = {
            'men': 'Чоловіча',
            'women': 'Жіноча',
            'cadet_boys': 'Кадети (Хлопці)',
            'cadet_girls': 'Кадети (Дівчата)',
            'youth': 'до 15 років',
            'staff': 'Штат',
            'reserve': 'Резервної',
            'junior_women': 'Юніорська (Жінки)',
            'junior_men': 'Юніорська (Чоловіки)'
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

    // Export functions to global scope for inline event handlers
    window.toggleTags = function(button) {
        const container = button.closest('.athlete-image-container');
        const isHidden = container.classList.contains('tags-hidden');
        
        if (isHidden) {
            // Show tags
            container.classList.remove('tags-hidden');
            button.textContent = 'Нажміть щоб сховати теги';
        } else {
            // Hide tags
            container.classList.add('tags-hidden');
            button.textContent = 'Нажміть щоб показати теги';
        }
    };

    window.toggleTagsFromImage = function(container) {
        const button = container.querySelector('.tags-toggle-btn');
        const isHidden = container.classList.contains('tags-hidden');
        
        if (isHidden) {
            // Show tags
            container.classList.remove('tags-hidden');
            if (button) button.textContent = 'Нажміть щоб сховати теги';
        } else {
            // Hide tags
            container.classList.add('tags-hidden');
            if (button) button.textContent = 'Нажміть щоб показати теги';
        }
    };

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