/**
 * Protocols Manager
 * Управление протоколами чемпионатов U15-U23
 * Полная копия функционала из DocumentsManager
 */

class ProtocolsManager {
    constructor() {
        this.currentCategory = 'u23';
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.allCompetitions = {};
        this.filteredCompetitions = [];
        this.currentYear = '';
        this.currentSearch = '';
        
        this.init();
    }

    async init() {
        try {
            await this.loadAllData();
            this.renderCategories();
            this.setupEventListeners();
            this.showCategory('u23'); // Show U23 by default
            this.hideLoading();
        } catch (error) {
            console.error('Error initializing protocols:', error);
            this.showError();
        }
    }

    async loadAllData() {
        try {
            // Load metadata first
            await this.loadMetadata();
            
            // Load all category data
            const categories = ['u15', 'u16', 'u17', 'u18', 'u21', 'u23'];
            const promises = categories.map(category => this.loadCategoryData(category));
            
            await Promise.all(promises);
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    async loadMetadata() {
        try {
            const response = await fetch('database/docs/index/metadata.json');
            if (!response.ok) {
                throw new Error('Failed to load metadata');
            }
            
            this.metadata = await response.json();
            console.log('📋 Metadata loaded successfully');
        } catch (error) {
            console.error('Error loading metadata:', error);
            this.metadata = this.generateFallbackMetadata();
        }
    }

    async loadCategoryData(category) {
        try {
            const response = await fetch(`database/docs/index/${category}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${category} data`);
            }
            
            const data = await response.json();
            
            // Use the competitions array from the JSON structure
            this.allCompetitions[category] = (data.competitions || []).map(competition => ({
                ...competition,
                category: category,
                files: competition.files || []
            }));
            
            console.log(`📁 Loaded ${this.allCompetitions[category].length} competitions for ${category.toUpperCase()}`);
        } catch (error) {
            console.error(`Error loading ${category} data:`, error);
            this.allCompetitions[category] = this.generateFallbackData(category);
        }
    }



    generateFallbackMetadata() {
        return {
            metadata: {
                last_updated: new Date().toISOString(),
                version: "1.0.0",
                data_source: "Федерація Дзюдо України",
                file_formats: ["PDF", "HTML"]
            },
            categories: {
                u15: { title: "Чемпіонати України 15", age_group: "до 15 років" },
                u16: { title: "Чемпіонати України 16", age_group: "до 16 років" },
                u17: { title: "Чемпіонати України 17", age_group: "до 17 років" },
                u18: { title: "Чемпіонати України 18", age_group: "до 18 років" },
                u21: { title: "Чемпіонати України 21", age_group: "до 21 року" },
                u23: { title: "Чемпіонати України 23", age_group: "до 23 років" }
            }
        };
    }

    generateFallbackData(category) {
        const currentYear = new Date().getFullYear();
        const years = Array.from({length: 5}, (_, i) => currentYear - i);
        
        return years.map(year => ({
            year: year,
            title: `Чемпіонат України серед молоді до ${category.substring(1)} років`,
            location: this.getRandomLocation(),
            date: this.getRandomDate(year),
            status: year === currentYear ? 'upcoming' : 'completed',
            category: category,
            files: [
                {
                    name: 'Протокол змагань',
                    type: 'protocol',
                    icon: 'protocol',
                    path: `database/docs/champ/${category}/${year}.pdf`,
                    description: 'Офіційний протокол змагань'
                }
            ]
        }));
    }

    getRandomLocation() {
        const locations = ['Київ', 'Львів', 'Харків', 'Дніпро', 'Одеса', 'Запоріжжя', 'Вінниця'];
        return locations[Math.floor(Math.random() * locations.length)];
    }

    getRandomDate(year) {
        const months = ['березня', 'квітня', 'травня', 'вересня', 'жовтня', 'листопада'];
        const month = months[Math.floor(Math.random() * months.length)];
        const day = Math.floor(Math.random() * 28) + 1;
        return `${day}-${day + 1} ${month} ${year}`;
    }

    renderCategories() {
        const container = document.getElementById('categories-grid');
        if (!container) return;

        const categories = [
            { id: 'u15', title: 'U15' },
            { id: 'u16', title: 'U16' },
            { id: 'u17', title: 'U17' },
            { id: 'u18', title: 'U18' },
            { id: 'u21', title: 'U21' },
            { id: 'u23', title: 'U23' }
        ];

        container.innerHTML = categories.map(category => {
            const competitions = this.allCompetitions[category.id] || [];
            const count = competitions.length;
            const years = this.getYearRange(competitions);
            
            // Get description from metadata or use fallback
            const metadataCategory = this.metadata?.categories?.[category.id];
            const description = metadataCategory?.age_group ? 
                `серед молоді ${metadataCategory.age_group}` :
                this.getFallbackDescription(category.id);
            
            const isActive = category.id === 'u23' ? ' active' : '';
            
            return `
                <div class="category-card${isActive}" data-category="${category.id}">
                    <div class="category-icon">${category.title}</div>
                    <div class="category-title">Чемпіонати України</div>
                    <div class="category-description">${description}</div>
                    <div class="category-stats">
                        <div class="stat-item">
                            <span class="stat-number">${count}</span>
                            <span class="stat-label">Змагань</span>
                        </div>
                        <div class="stat-years">${years}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getFallbackDescription(categoryId) {
        const descriptions = {
            u15: 'серед молоді до 15 років',
            u16: 'серед молоді до 16 років',
            u17: 'серед молоді до 17 років',
            u18: 'серед молоді до 18 років',
            u21: 'серед молоді до 21 року',
            u23: 'серед молоді до 23 років'
        };
        return descriptions[categoryId] || 'серед молоді';
    }

    getYearRange(competitions) {
        if (!competitions.length) return '2015-2024';
        
        const years = competitions.map(c => c.year).sort((a, b) => a - b);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        
        return minYear === maxYear ? `${minYear}` : `${minYear}-${maxYear}`;
    }

    setupEventListeners() {
        // Category selection
        document.addEventListener('click', (e) => {
            const categoryCard = e.target.closest('.category-card');
            if (categoryCard) {
                const category = categoryCard.dataset.category;
                this.showCategory(category);
            }
        });



        // Filters
        const yearFilter = document.getElementById('year-filter');
        if (yearFilter) {
            yearFilter.addEventListener('change', (e) => {
                this.currentYear = e.target.value;
                this.applyFilters();
            });
        }

        const searchFilter = document.getElementById('search-filter');
        if (searchFilter) {
            let searchTimeout;
            searchFilter.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentSearch = e.target.value.toLowerCase();
                    this.applyFilters();
                }, 300);
            });
        }

        // File clicks
        document.addEventListener('click', (e) => {
            const fileElement = e.target.closest('.competition-file');
            if (fileElement) {
                e.preventDefault();
                this.handleFileClick(fileElement);
            }
        });

        // Modal close
        this.setupModalListeners();
    }

    showCategory(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        
        // Update active category card
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        // Update title using metadata
        const metadataCategory = this.metadata?.categories?.[category];
        const title = metadataCategory?.title || `Чемпіонат України ${category.substring(1)}`;
        const description = metadataCategory ? 
            `серед молоді ${metadataCategory.age_group}` :
            this.getFallbackDescription(category);
        
        document.getElementById('competitions-category-title').textContent = title;
        document.getElementById('competitions-category-description').textContent = description;
        
        // Setup filters
        this.setupCategoryFilters(category);
        
        // Reset filters
        this.currentYear = '';
        this.currentSearch = '';
        
        // Render competitions
        this.applyFilters();
    }



    setupCategoryFilters(category) {
        const competitions = this.allCompetitions[category] || [];
        const years = [...new Set(competitions.map(c => c.year))].sort((a, b) => b - a);
        
        const yearFilter = document.getElementById('year-filter');
        if (yearFilter) {
            yearFilter.innerHTML = '<option value="">Всі роки</option>' +
                years.map(year => `<option value="${year}">${year}</option>`).join('');
        }
        
        const searchFilter = document.getElementById('search-filter');
        if (searchFilter) {
            searchFilter.value = '';
        }
    }

    applyFilters() {
        if (!this.currentCategory) return;
        
        const competitions = this.allCompetitions[this.currentCategory] || [];
        
        this.filteredCompetitions = competitions.filter(competition => {
            const yearMatch = !this.currentYear || competition.year.toString() === this.currentYear;
            const searchMatch = !this.currentSearch || 
                competition.title.toLowerCase().includes(this.currentSearch) ||
                competition.location.toLowerCase().includes(this.currentSearch);
            
            return yearMatch && searchMatch;
        });
        
        this.currentPage = 1;
        this.renderCompetitions();
        this.renderPagination();
    }

    renderCompetitions() {
        const container = document.getElementById('competitions-grid');
        if (!container) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageCompetitions = this.filteredCompetitions.slice(startIndex, endIndex);

        if (pageCompetitions.length === 0) {
            container.innerHTML = `
                <div class="no-competitions">
                    <div class="empty-icon">📄</div>
                    <h4>Змагання не знайдено</h4>
                    <p>Спробуйте змінити фільтри або пошуковий запит</p>
                </div>
            `;
            return;
        }

        container.innerHTML = pageCompetitions.map((competition, index) => {
            return this.renderCompetitionCard(competition, index);
        }).join('');

        // Add staggered animation
        const cards = container.querySelectorAll('.competition-card');
        cards.forEach((card, index) => {
            card.classList.add('fade-in-up');
            card.style.animationDelay = `${index * 0.1}s`;
        });

        // Add click listeners to files
        container.querySelectorAll('.competition-file').forEach(fileElement => {
            fileElement.addEventListener('click', () => this.handleFileClick(fileElement));
        });

        // Load file sizes
        this.loadFileSizes();
    }

    renderCompetitionCard(competition, index) {
        const isUpcoming = competition.status === 'upcoming';
        const yearClass = isUpcoming ? 'upcoming' : '';
        
        return `
            <div class="competition-card">
                <div class="competition-header">
                    <h3 class="competition-title">${competition.title}</h3>
                    <div class="competition-year ${yearClass}">${competition.year}</div>
                </div>
                
                <div class="competition-info">
                    <div class="info-item">
                        <div class="info-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                        </div>
                        <span class="info-text">${competition.location}</span>
                    </div>
                    <div class="info-item">
                        <div class="info-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                        </div>
                        <span class="info-text">${competition.date}</span>
                    </div>
                </div>
                
                <div class="competition-files">
                    ${competition.files.map(file => `
                        <div class="competition-file" 
                             data-file-type="${file.type}" 
                             data-file-path="${file.path}" 
                             data-file-name="${file.name}" 
                             data-competition-title="${competition.title}">
                            <div class="file-info">
                                <div class="file-icon ${file.icon}">${this.getFileIcon(file.icon)}</div>
                                <div class="file-details">
                                    <span class="file-name">${file.name}</span>
                                    <span class="file-meta">
                                        ${file.type === 'modal' ? 'Результати' : 'PDF'} • 
                                        <span class="file-size" data-file-path="${file.path}">Завантаження...</span>
                                    </span>
                                </div>
                            </div>
                            <div class="file-download">
                                ${file.type === 'modal' ? 
                                    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>` :
                                    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7,10 12,15 17,10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>`
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getFileIcon(iconType) {
        const icons = {
            protocol: '📋',
            results: '🏆',
            team: '👥',
            media: '📸',
            modal: '👁️'
        };
        return icons[iconType] || '📄';
    }

    async loadFileSizes() {
        const fileSizeElements = document.querySelectorAll('.file-size[data-file-path]');
        
        fileSizeElements.forEach(async (element) => {
            const filePath = element.dataset.filePath;
            
            try {
                const response = await fetch(filePath, { method: 'HEAD' });
                if (response.ok) {
                    const contentLength = response.headers.get('content-length');
                    if (contentLength) {
                        const size = this.formatFileSize(parseInt(contentLength));
                        element.textContent = size;
                    } else {
                        element.textContent = 'Невідомо';
                    }
                } else {
                    element.textContent = 'Недоступно';
                }
            } catch (error) {
                element.textContent = 'Помилка';
            }
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Б';
        
        const k = 1024;
        const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    renderPagination() {
        const container = document.getElementById('competitions-pagination');
        if (!container) return;

        const totalPages = Math.ceil(this.filteredCompetitions.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.filteredCompetitions.length);
        
        container.innerHTML = `
            <div class="pagination-info">
                Показано ${startItem}-${endItem} з ${this.filteredCompetitions.length} змагань
            </div>
            <div class="pagination-controls">
                <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15,18 9,12 15,6"/>
                    </svg>
                    Попередня
                </button>
                <div class="pagination-numbers">
                    ${this.generatePageNumbers(this.currentPage, totalPages)}
                </div>
                <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
                    Наступна
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9,18 15,12 9,6"/>
                    </svg>
                </button>
            </div>
        `;

        // Add pagination event listeners
        container.querySelectorAll('[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.currentTarget.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.renderCompetitions();
                    this.renderPagination();
                    
                    // Scroll to top of competitions
                    document.getElementById('competitions-section').scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }
            });
        });
    }

    generatePageNumbers(currentPage, totalPages) {
        const pages = [];
        const maxVisible = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        if (startPage > 1) {
            pages.push(`<a href="#" class="page-number" data-page="1">1</a>`);
            if (startPage > 2) {
                pages.push(`<span class="page-ellipsis">...</span>`);
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === currentPage ? 'active' : '';
            pages.push(`<a href="#" class="page-number ${activeClass}" data-page="${i}">${i}</a>`);
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(`<span class="page-ellipsis">...</span>`);
            }
            pages.push(`<a href="#" class="page-number" data-page="${totalPages}">${totalPages}</a>`);
        }
        
        return pages.join('');
    }

    handleFileClick(fileElement) {
        const fileType = fileElement.dataset.fileType;
        const filePath = fileElement.dataset.filePath;
        const fileName = fileElement.dataset.fileName;
        const competitionTitle = fileElement.dataset.competitionTitle;
        
        if (fileType === 'modal') {
            this.showResultsModal(filePath, fileName, competitionTitle);
        } else {
            window.open(filePath, '_blank');
        }
        
        // Track download
        this.trackProtocolDownload(fileName, this.currentCategory);
    }

    async showResultsModal(filePath, fileName, competitionTitle) {
        const modal = document.getElementById('results-modal');
        if (!modal) return;

        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error('Failed to load results');
            }
            
            const htmlContent = await response.text();
            this.displayModal(htmlContent, `${competitionTitle} - ${fileName}`);
        } catch (error) {
            console.error('Error loading results:', error);
            this.showNotification('Помилка завантаження результатів', 'error');
        }
    }

    displayModal(content, title) {
        const modal = document.getElementById('results-modal');
        if (!modal) return;

        const modalTitle = modal.querySelector('.modal-title');
        const modalBody = modal.querySelector('.modal-body');
        
        modalTitle.textContent = title;
        modalBody.innerHTML = this.wrapContentWithControls(content);

        this.initializeModalControls(modal);
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    wrapContentWithControls(content) {
        return `
            <div class="results-controls">
                <div class="results-search">
                    <input type="text" placeholder="Пошук по імені спортсмена..." id="modal-search">
                </div>
                <div class="gender-filter">
                    <button class="gender-btn active" data-gender="all">Усі</button>
                    <button class="gender-btn" data-gender="male">Юноші</button>
                    <button class="gender-btn" data-gender="female">Дівчата</button>
                </div>
            </div>
            <div class="modal-results">
                ${content}
            </div>
        `;
    }

    initializeModalControls(modal) {
        const searchInput = modal.querySelector('#modal-search');
        const genderButtons = modal.querySelectorAll('.gender-btn');

        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filterResults(e.target.value.toLowerCase(), this.getActiveGender());
                }, 300);
            });
        }

        genderButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                genderButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const gender = btn.dataset.gender;
                const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
                this.filterResults(searchTerm, gender);
            });
        });
    }

    getActiveGender() {
        const activeBtn = document.querySelector('.gender-btn.active');
        return activeBtn ? activeBtn.dataset.gender : 'all';
    }

    filterResults(searchTerm, gender) {
        const resultsSections = document.querySelectorAll('.results-section');
        let hasVisibleResults = false;

        resultsSections.forEach(section => {
            const sectionTitle = section.querySelector('h3').textContent.toLowerCase();
            const isGenderMatch = gender === 'all' || 
                                (gender === 'male' && sectionTitle.includes('юноші')) ||
                                (gender === 'female' && sectionTitle.includes('дівчата'));

            if (!isGenderMatch) {
                section.classList.add('hidden');
                return;
            }

            section.classList.remove('hidden');
            const categories = section.querySelectorAll('.weight-category');
            let sectionHasVisible = false;

            categories.forEach(category => {
                const participants = category.querySelectorAll('li');
                let categoryHasVisible = false;

                participants.forEach(participant => {
                    const name = participant.textContent.toLowerCase();
                    const isMatch = !searchTerm || name.includes(searchTerm);
                    
                    if (isMatch) {
                        participant.classList.remove('hidden');
                        categoryHasVisible = true;
                    } else {
                        participant.classList.add('hidden');
                    }
                });

                if (categoryHasVisible) {
                    category.classList.remove('hidden');
                    sectionHasVisible = true;
                } else {
                    category.classList.add('hidden');
                }
            });

            if (sectionHasVisible) {
                hasVisibleResults = true;
            } else {
                section.classList.add('hidden');
            }
        });

        this.updateEmptyState(!hasVisibleResults, searchTerm, gender);
    }

    updateEmptyState(isEmpty, searchTerm, gender) {
        const modalResults = document.querySelector('.modal-results');
        let emptyState = modalResults.querySelector('.results-empty');

        if (isEmpty) {
            if (!emptyState) {
                emptyState = document.createElement('div');
                emptyState.className = 'results-empty';
                modalResults.appendChild(emptyState);
            }

            const message = searchTerm 
                ? `Не знайдено результатів для "${searchTerm}"`
                : 'Немає результатів для обраного фільтра';

            emptyState.innerHTML = `
                <div class="empty-icon">🔍</div>
                <p>${message}</p>
                <p style="font-size: 0.9rem; opacity: 0.7;">Спробуйте змінити критерії пошуку</p>
            `;
        } else if (emptyState) {
            emptyState.remove();
        }
    }

    setupModalListeners() {
        const modal = document.getElementById('results-modal');
        if (!modal) return;

        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                this.closeModal();
            }
        });
    }

    closeModal() {
        const modal = document.getElementById('results-modal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    trackProtocolDownload(fileName, category) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'download', {
                'event_category': 'competition_protocols',
                'event_label': `${category}_${fileName}`
            });
        }
        
        console.log(`📥 Downloaded: ${fileName} (${category ? category.toUpperCase() : 'UNKNOWN'})`);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" aria-label="Закрити">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
    }

    hideLoading() {
        const loadingState = document.getElementById('loading-state');
        if (loadingState) {
            loadingState.style.display = 'none';
        }
    }

    showError() {
        const loadingState = document.getElementById('loading-state');
        const errorState = document.getElementById('error-state');
        
        if (loadingState) {
            loadingState.style.display = 'none';
        }
        
        if (errorState) {
            errorState.style.display = 'block';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProtocolsManager();
}); 