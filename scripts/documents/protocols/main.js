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
        this.currentModal = null;
        
        // URL State Management
        this.urlState = {
            category: 'u23',
            page: 1,
            year: '',
            search: '',
            modal: null,
            modalFile: null,
            modalCompetition: null
        };
        
        this.init();
    }

    async init() {
        try {
            await this.loadAllData();
            this.renderCategories();
            this.setupEventListeners();
            this.setupURLStateManagement();
            this.restoreStateFromURL();
            this.updateStructuredData();
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
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ESC to close modal
            if (e.key === 'Escape') {
                this.closeModal();
            }
            
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchFilter = document.getElementById('search-filter');
                if (searchFilter) {
                    searchFilter.focus();
                }
            }
        });
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
        
        // Update URL state
        this.updateURLState({
            category: category,
            page: 1,
            year: '',
            search: '',
            modal: null,
            modalFile: null,
            modalCompetition: null
        });
        
        // Update structured data
        this.updateCategorySchema();
        this.updateBreadcrumbSchema();
        
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
        
        // Update URL state
        this.updateURLState({
            year: this.currentYear,
            search: this.currentSearch,
            page: 1
        });
        
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
            container.innerHTML = '';
            return;
        }

        const pageNumbers = this.generatePageNumbers(this.currentPage, totalPages);
        
        container.innerHTML = `
            <div class="pagination-controls">
                <button class="pagination-btn prev-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                        data-page="${this.currentPage - 1}" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15,18 9,12 15,6"/>
                    </svg>
                    Попередня
                </button>
                
                <div class="pagination-numbers">
                    ${pageNumbers.map(page => {
                        if (page === '...') {
                            return '<span class="pagination-ellipsis">...</span>';
                        }
                        const isActive = page === this.currentPage;
                        return `<button class="pagination-btn number-btn ${isActive ? 'active' : ''}" data-page="${page}">${page}</button>`;
                    }).join('')}
                </div>
                
                <button class="pagination-btn next-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                        data-page="${this.currentPage + 1}" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    Наступна
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9,18 15,12 9,6"/>
                    </svg>
                </button>
            </div>
            
            <div class="pagination-info">
                <span class="pagination-text">
                    Сторінка ${this.currentPage} з ${totalPages}
                </span>
                <span class="pagination-count">
                    ${this.filteredCompetitions.length} змагань
                </span>
            </div>
        `;

        // Add click listeners
        container.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(btn.dataset.page);
                if (page && page !== this.currentPage && page >= 1 && page <= totalPages) {
                    this.currentPage = page;
                    
                    // Update URL state
                    this.updateURLState({ page: page });
                    
                    this.renderCompetitions();
                    this.renderPagination();
                    
                    // Scroll to top of competitions section
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
        try {
            // Update URL state for modal
            this.updateURLState({
                modal: fileName,
                modalFile: filePath,
                modalCompetition: competitionTitle
            });
            
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error('Failed to load modal content');
            }
            
            const content = await response.text();
            this.displayModal(content, fileName);
            
        } catch (error) {
            console.error('Error loading modal:', error);
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
            
            // Clear modal state from URL
            this.updateURLState({
                modal: null,
                modalFile: null,
                modalCompetition: null
            });
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
        const errorState = document.getElementById('error-state');
        
        if (loadingState) {
            loadingState.style.display = 'none';
        }
        
        // Also hide error state if it was shown
        if (errorState) {
            errorState.style.display = 'none';
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

    // URL State Management Methods
    setupURLStateManagement() {
        // Listen for browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            this.restoreStateFromURL();
        });

        // Listen for hash changes
        window.addEventListener('hashchange', (event) => {
            this.restoreStateFromURL();
        });
    }

    updateURLState(newState = {}) {
        // Merge new state with current state
        this.urlState = { ...this.urlState, ...newState };
        
        // Build URL parameters
        const params = new URLSearchParams();
        
        if (this.urlState.category && this.urlState.category !== 'u23') {
            params.set('category', this.urlState.category);
        }
        
        if (this.urlState.page && this.urlState.page > 1) {
            params.set('page', this.urlState.page.toString());
        }
        
        if (this.urlState.year) {
            params.set('year', this.urlState.year);
        }
        
        if (this.urlState.search) {
            params.set('search', this.urlState.search);
        }

        // Build hash for modal state
        let hash = '';
        if (this.urlState.modal) {
            hash = `#modal=${this.urlState.modal}`;
            if (this.urlState.modalFile) {
                hash += `&file=${encodeURIComponent(this.urlState.modalFile)}`;
            }
            if (this.urlState.modalCompetition) {
                hash += `&competition=${encodeURIComponent(this.urlState.modalCompetition)}`;
            }
        }

        // Update URL without triggering navigation
        const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}${hash}`;
        window.history.replaceState(this.urlState, '', newURL);
        
        // Update page title for better UX
        this.updatePageTitle();
    }

    updatePageTitle() {
        let title = 'Протоколи змагань | ФДУ';
        
        if (this.urlState.category && this.urlState.category !== 'u23') {
            const categoryName = this.urlState.category.toUpperCase();
            title = `Протоколи ${categoryName} | ФДУ`;
        }
        
        if (this.urlState.modal) {
            title = `${this.urlState.modal} | ${title}`;
        }
        
        document.title = title;
    }

    createDirectLink(state = null) {
        const linkState = state || this.urlState;
        const params = new URLSearchParams();
        
        if (linkState.category && linkState.category !== 'u23') {
            params.set('category', linkState.category);
        }
        
        if (linkState.page && linkState.page > 1) {
            params.set('page', linkState.page.toString());
        }
        
        if (linkState.year) {
            params.set('year', linkState.year);
        }
        
        if (linkState.search) {
            params.set('search', linkState.search);
        }

        let hash = '';
        if (linkState.modal) {
            hash = `#modal=${linkState.modal}`;
            if (linkState.modalFile) {
                hash += `&file=${encodeURIComponent(linkState.modalFile)}`;
            }
            if (linkState.modalCompetition) {
                hash += `&competition=${encodeURIComponent(linkState.modalCompetition)}`;
            }
        }

        return `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}${hash}`;
    }

    copyCurrentLink() {
        const link = this.createDirectLink();
        navigator.clipboard.writeText(window.location.origin + link).then(() => {
            this.showNotification('Посилання скопійовано в буфер обміну', 'success');
        }).catch(() => {
            this.showNotification('Помилка копіювання посилання', 'error');
        });
    }

    restoreStateFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash.substring(1);
        
        // Parse URL parameters
        const category = urlParams.get('category') || 'u23';
        const page = parseInt(urlParams.get('page')) || 1;
        const year = urlParams.get('year') || '';
        const search = urlParams.get('search') || '';
        
        // Parse hash for modal state
        let modal = null;
        let modalFile = null;
        let modalCompetition = null;
        
        if (hash) {
            const hashParams = new URLSearchParams(hash);
            modal = hashParams.get('modal');
            modalFile = hashParams.get('file');
            modalCompetition = hashParams.get('competition');
        }

        // Update internal state
        this.urlState = {
            category,
            page,
            year,
            search,
            modal,
            modalFile,
            modalCompetition
        };

        // Apply state changes
        this.applyURLState();
    }

    applyURLState() {
        // Apply category
        if (this.urlState.category !== this.currentCategory) {
            this.showCategory(this.urlState.category);
        }

        // Apply filters
        if (this.urlState.year !== this.currentYear) {
            this.currentYear = this.urlState.year;
            const yearFilter = document.getElementById('year-filter');
            if (yearFilter) {
                yearFilter.value = this.urlState.year;
            }
        }

        if (this.urlState.search !== this.currentSearch) {
            this.currentSearch = this.urlState.search;
            const searchFilter = document.getElementById('search-filter');
            if (searchFilter) {
                searchFilter.value = this.urlState.search;
            }
        }

        // Apply pagination
        if (this.urlState.page !== this.currentPage) {
            this.currentPage = this.urlState.page;
        }

        // Apply filters and render
        this.applyFilters();

        // Apply modal state
        if (this.urlState.modal && this.urlState.modalFile) {
            this.showResultsModal(this.urlState.modalFile, this.urlState.modal, this.urlState.modalCompetition);
        }
    }

    updateStructuredData() {
        this.updateProtocolsSchema();
        this.updateCategorySchema();
        this.updateBreadcrumbSchema();
    }

    updateProtocolsSchema() {
        const schemaElement = document.getElementById('protocols-schema');
        if (!schemaElement) return;

        // Собираем все протоколы из всех категорий
        const allProtocols = [];
        let totalCount = 0;

        Object.keys(this.allCompetitions).forEach(category => {
            const competitions = this.allCompetitions[category] || [];
            competitions.forEach(competition => {
                totalCount += competition.files.length;
                competition.files.forEach(file => {
                    allProtocols.push({
                        "@type": "CreativeWork",
                        "name": `${competition.title} - ${file.name}`,
                        "description": `Протокол змагань ${competition.title} ${competition.year} року`,
                        "url": `https://judo.org.ua/${file.path}`,
                        "datePublished": `${competition.year}-01-01`,
                        "author": {
                            "@type": "SportsOrganization",
                            "name": "Федерація дзюдо України"
                        },
                        "publisher": {
                            "@type": "SportsOrganization",
                            "name": "Федерація дзюдо України",
                            "url": "https://judo.org.ua"
                        },
                        "about": {
                            "@type": "SportsEvent",
                            "name": competition.title,
                            "description": `Чемпіонат України з дзюдо ${competition.year}`,
                            "startDate": `${competition.year}-01-01`,
                            "location": {
                                "@type": "Place",
                                "name": competition.location
                            },
                            "organizer": {
                                "@type": "SportsOrganization",
                                "name": "Федерація дзюдо України"
                            }
                        },
                        "genre": "Sports Protocol",
                        "fileFormat": file.type === 'modal' ? 'text/html' : 'application/pdf'
                    });
                });
            });
        });

        const schema = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Протоколи змагань ФДУ",
            "description": `Офіційні протоколи чемпіонатів України з дзюдо серед юніорів та молоді. Всього ${totalCount} документів.`,
            "numberOfItems": totalCount,
            "itemListElement": allProtocols.slice(0, 50).map((protocol, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": protocol
            }))
        };

        schemaElement.textContent = JSON.stringify(schema, null, 2);
    }

    updateCategorySchema() {
        const schemaElement = document.getElementById('category-schema');
        if (!schemaElement || !this.currentCategory) return;

        const competitions = this.allCompetitions[this.currentCategory] || [];
        if (competitions.length === 0) return;

        // Берем последнее соревнование как пример
        const latestCompetition = competitions[0];
        const metadataCategory = this.metadata?.categories?.[this.currentCategory];

        const schema = {
            "@context": "https://schema.org",
            "@type": "SportsEvent",
            "name": metadataCategory?.title || `Чемпіонат України ${this.currentCategory.toUpperCase()}`,
            "description": `Чемпіонати України з дзюдо ${metadataCategory?.age_group || 'серед молоді'}`,
            "sport": "Judo",
            "organizer": {
                "@type": "SportsOrganization",
                "name": "Федерація дзюдо України",
                "url": "https://judo.org.ua"
            },
            "location": {
                "@type": "Place",
                "name": "Україна"
            },
            "eventStatus": "EventScheduled",
            "eventAttendanceMode": "OfflineEventAttendanceMode",
            "audience": {
                "@type": "Audience",
                "audienceType": "Sports Fans"
            },
            "offers": {
                "@type": "Offer",
                "availability": "https://schema.org/InStock",
                "price": "0",
                "priceCurrency": "UAH"
            },
            "hasPart": competitions.slice(0, 10).map(competition => ({
                "@type": "SportsEvent",
                "name": competition.title,
                "description": `Чемпіонат України з дзюдо ${competition.year}`,
                "startDate": `${competition.year}-01-01`,
                "location": {
                    "@type": "Place",
                    "name": competition.location
                },
                "eventStatus": competition.status === 'upcoming' ? "EventScheduled" : "EventCompleted"
            }))
        };

        schemaElement.textContent = JSON.stringify(schema, null, 2);
    }

    updateBreadcrumbSchema() {
        const schemaElement = document.getElementById('protocols-breadcrumb-schema');
        if (!schemaElement) return;

        const breadcrumbItems = [
            {
                "@type": "ListItem",
                "position": 1,
                "name": "Головна",
                "item": "https://judo.org.ua/"
            },
            {
                "@type": "ListItem",
                "position": 2,
                "name": "Документи ФДУ",
                "item": "https://judo.org.ua/documents"
            },
            {
                "@type": "ListItem",
                "position": 3,
                "name": "Протоколи змагань",
                "item": "https://judo.org.ua/protocols"
            }
        ];

        // Добавляем текущую категорию если она выбрана
        if (this.currentCategory && this.currentCategory !== 'u23') {
            const categoryName = this.currentCategory.toUpperCase();
            breadcrumbItems.push({
                "@type": "ListItem",
                "position": 4,
                "name": `Категорія ${categoryName}`,
                "item": `https://judo.org.ua/protocols?category=${this.currentCategory}`
            });
        }

        const schema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbItems
        };

        schemaElement.textContent = JSON.stringify(schema, null, 2);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProtocolsManager();
}); 