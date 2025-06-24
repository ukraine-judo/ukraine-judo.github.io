/**
 * Documents Page Main Module
 * Initializes and coordinates all document-related functionality
 */

class DocumentsManager {
    constructor() {
        this.dataManager = null;
        this.filterManager = null;
        this.uiManager = null;
        this.statsManager = null;
        this.seoManager = null;
        
        this.init();
    }

    async init() {
        try {
            // First load all module scripts
            await this.loadModules();
            
            // Then initialize modules
            await this.initializeModules();
            
        } catch (error) {
            console.error('Error initializing documents system:', error);
            this.handleError('Помилка завантаження документів');
        }
    }

    async initializeModules() {
        try {
            // Show loading state first
            this.showLoadingState();
            
            // Initialize data manager
            this.dataManager = new DocumentsDataManager();
            await this.dataManager.loadDocuments();
            
            // Initialize other managers
            this.filterManager = new DocumentsFilterManager();
            this.uiManager = new DocumentsUIManager();
            this.statsManager = new DocumentsStatsManager();
            this.seoManager = new DocumentsSEOManager();
            
            // Get loaded data
            const data = this.dataManager.getData();
            if (data) {
                // Initialize filter manager with documents
                this.filterManager.initialize(data.documents);
                
                // Update UI with data
                this.uiManager.updateStatistics(data);
                this.statsManager.updateStats(data);
                
                // Initialize SEO manager with data
                await this.seoManager.init(this.dataManager);
                
                // Initial render
                this.renderCurrentDocuments();
            }
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize competition protocols
            await this.initializeProtocols();
            
            console.log('Documents page initialized successfully');
        } catch (error) {
            console.error('Failed to initialize modules:', error);
            this.handleError('Помилка ініціалізації модулів');
        }
    }

    async loadModules() {
        const modules = [
            'scripts/documents/data-manager.js',
            'scripts/documents/filter-manager.js',
            'scripts/documents/ui-manager.js',
            'scripts/documents/stats-manager.js',
            'scripts/documents/seo-manager.js'
        ];

        const loadPromises = modules.map(module => this.loadScript(module));
        await Promise.all(loadPromises);
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script is already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupEventListeners() {
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = btn.dataset.filter;
                this.filterManager.setActiveFilter(filter);
                this.uiManager.resetPagination();
                this.renderCurrentDocuments();
                this.updateFilterResults();
            });
        });

        // Search input
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterManager.setSearchQuery(e.target.value);
                this.uiManager.resetPagination();
                this.renderCurrentDocuments();
                this.updateFilterResults();
            });
        }

        // Sort dropdown
        const sortSelect = document.querySelector('.sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.filterManager.setSortOrder(e.target.value);
                this.uiManager.resetPagination();
                this.renderCurrentDocuments();
            });
        }

        // Pagination event listener
        document.addEventListener('paginationChange', (e) => {
            this.renderCurrentDocuments();
        });

        // Document download tracking
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('document-action')) {
                const documentTitle = e.target.closest('.document-item')
                    ?.querySelector('.document-title')?.textContent;
                
                if (documentTitle) {
                    this.trackDownload(documentTitle);
                }
            }
        });
    }

    renderCurrentDocuments() {
        const filteredDocuments = this.filterManager.getFilteredDocuments();
        this.uiManager.renderDocuments(filteredDocuments);
        
        // Update filter button states
        this.updateFilterButtonStates();
    }

    updateFilterButtonStates() {
        const activeFilter = this.filterManager.getActiveFilter();
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === activeFilter);
        });
    }

    updateFilterResults() {
        const filteredCount = this.filterManager.getFilteredCount();
        const totalCount = this.filterManager.getTotalCount();
        
        if (this.statsManager) {
            this.statsManager.updateFilterResults(filteredCount, totalCount);
        }
    }

    handleError(message) {
        const grid = document.querySelector('.document-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="#ccc">
                        <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                    </svg>
                    <h3>Помилка</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">
                        Оновити сторінку
                    </button>
                </div>
            `;
        }

        // Show notification if stats manager is available
        if (this.statsManager) {
            this.statsManager.showNotification(message, 'error');
        }
    }

    trackDownload(documentTitle) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'download', {
                'event_category': 'documents',
                'event_label': documentTitle
            });
        }
        
        // Stats tracking
        if (this.statsManager) {
            this.statsManager.trackUsage('document_download', {
                document_title: documentTitle
            });
        }
        
        console.log(`Document downloaded: ${documentTitle}`);
    }

    async renderInitialState() {
        try {
            // Render document categories
            await this.uiManager.renderCategories();
            
            // Render document list
            await this.uiManager.renderDocuments();
            
            // Update statistics
            this.statsManager.updateStats();
            
            // Initialize filters
            this.filterManager.initializeFilters();
            
        } catch (error) {
            console.error('Failed to render initial state:', error);
            this.showError('Помилка відображення документів');
        }
    }

    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <div class="error-content">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="#dc3545">
                    <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                </svg>
                <span class="error-message">${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles if not already present
        if (!document.querySelector('#error-notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'error-notification-styles';
            styles.textContent = `
                .error-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #dc3545;
                    color: white;
                    padding: 1rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10000;
                    max-width: 400px;
                }
                .error-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .error-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.5rem;
                    cursor: pointer;
                    margin-left: auto;
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(errorDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    showLoadingState() {
        const grid = document.querySelector('.document-grid');
        if (grid) {
            grid.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Завантаження документів...</p>
                </div>
            `;
        }
    }

    // Public API for external access
    getDataManager() {
        return this.dataManager;
    }

    getFilterManager() {
        return this.filterManager;
    }

    getUIManager() {
        return this.uiManager;
    }

    getStatsManager() {
        return this.statsManager;
    }

    // Public methods for external control
    filterByCategory(category) {
        if (this.filterManager) {
            this.filterManager.setActiveFilter(category);
            this.renderCurrentDocuments();
            this.updateFilterResults();
        }
    }

    searchDocuments(query) {
        if (this.filterManager) {
            this.filterManager.setSearchQuery(query);
            this.renderCurrentDocuments();
            this.updateFilterResults();
        }
    }

    sortDocuments(order) {
        if (this.filterManager) {
            this.filterManager.setSortOrder(order);
            this.renderCurrentDocuments();
        }
    }

    refreshData() {
        if (this.dataManager) {
            return this.dataManager.refresh().then(() => {
                const data = this.dataManager.getData();
                this.filterManager.initialize(data.documents);
                this.uiManager.updateStatistics(data);
                this.statsManager.updateStats(data);
                this.renderCurrentDocuments();
                
                if (this.statsManager) {
                    this.statsManager.showNotification('Дані оновлено успішно', 'success');
                }
            }).catch(error => {
                console.error('Failed to refresh data:', error);
                this.handleError('Помилка оновлення даних');
            });
        }
    }

    getStatistics() {
        if (this.dataManager) {
            return this.dataManager.getStatistics();
        }
        return null;
    }

    /**
     * Competition Protocols Management
     */
    async initializeProtocols() {
        try {
            await this.loadChampionshipsData();
            this.setupProtocolTabs();
        } catch (error) {
            console.error('Failed to initialize protocols:', error);
            this.handleProtocolsError();
        }
    }

    async loadChampionshipsData() {
        try {
            // Load metadata first
            const metadataResponse = await fetch('database/docs/index/metadata.json');
            if (!metadataResponse.ok) {
                throw new Error(`Failed to load metadata: ${metadataResponse.status}`);
            }
            const metadataData = await metadataResponse.json();
            
            this.fileTypes = metadataData.file_types;
            const categories = metadataData.categories;
            
            // Load individual category files
            this.championshipsData = {};
            const loadPromises = Object.keys(categories).map(async (categoryKey) => {
                const categoryFile = categories[categoryKey].file;
                try {
                    const response = await fetch(`database/docs/index/${categoryFile}`);
                    if (!response.ok) {
                        throw new Error(`Failed to load ${categoryFile}: ${response.status}`);
                    }
                    const categoryData = await response.json();
                    this.championshipsData[categoryKey] = categoryData;
                } catch (error) {
                    console.error(`Error loading ${categoryFile}:`, error);
                    // Create fallback data for this category
                    this.championshipsData[categoryKey] = {
                        title: categories[categoryKey].title,
                        description: `Змагання ${categories[categoryKey].age_group}`,
                        competitions: []
                    };
                }
            });
            
            await Promise.all(loadPromises);
            
            // Calculate metadata automatically based on loaded data
            this.championshipsMetadata = this.calculateMetadata(metadataData.metadata);
            
            // Update tab counters with real data
            this.updateTabCounters();
            
            console.log('📊 Championships data loaded:', {
                categories: Object.keys(this.championshipsData).length,
                total_competitions: this.championshipsMetadata.total_competitions,
                total_categories: this.championshipsMetadata.total_categories,
                years_range: this.championshipsMetadata.supported_years,
                version: this.championshipsMetadata.version
            });
            
        } catch (error) {
            console.error('Failed to load championships data:', error);
            // Fallback to generated data
            this.generateCompetitionsData();
        }
    }

    calculateMetadata(baseMetadata) {
        let totalCompetitions = 0;
        let allYears = new Set();
        let totalCategories = 0;
        let categoryYearRanges = {};
        
        // Calculate values from actual data
        Object.keys(this.championshipsData).forEach(categoryKey => {
            const categoryData = this.championshipsData[categoryKey];
            totalCategories++;
            
            if (categoryData.competitions && Array.isArray(categoryData.competitions)) {
                const competitions = categoryData.competitions;
                totalCompetitions += competitions.length;
                
                // Collect all years for this category
                const categoryYears = competitions.map(comp => comp.year).sort((a, b) => a - b);
                categoryYears.forEach(year => allYears.add(year));
                
                // Calculate year range and excluded years for this category
                if (categoryYears.length > 0) {
                    const minYear = Math.min(...categoryYears);
                    const maxYear = Math.max(...categoryYears);
                    const expectedYears = [];
                    
                    for (let year = minYear; year <= maxYear; year++) {
                        expectedYears.push(year);
                    }
                    
                    const excludedYears = expectedYears.filter(year => !categoryYears.includes(year));
                    
                    categoryYearRanges[categoryKey] = {
                        years: `${minYear}-${maxYear}`,
                        total_competitions: competitions.length,
                        excluded_years: excludedYears
                    };
                }
            }
        });
        
        // Calculate overall year range
        const sortedYears = Array.from(allYears).sort((a, b) => a - b);
        const supportedYears = sortedYears.length > 0 ? 
            `${sortedYears[0]}-${sortedYears[sortedYears.length - 1]}` : 
            baseMetadata.supported_years;
        
        // Update individual category metadata in championshipsData
        Object.keys(this.championshipsData).forEach(categoryKey => {
            const categoryData = this.championshipsData[categoryKey];
            const calculatedData = categoryYearRanges[categoryKey];
            
            if (calculatedData) {
                categoryData.years = calculatedData.years;
                categoryData.total_competitions = calculatedData.total_competitions;
                categoryData.excluded_years = calculatedData.excluded_years;
            }
        });
        
        return {
            ...baseMetadata,
            total_competitions: totalCompetitions,
            total_categories: totalCategories,
            supported_years: supportedYears,
            last_updated: new Date().toISOString(),
            calculated_metadata: true // Flag to indicate this was calculated
        };
    }

    updateTabCounters() {
        Object.keys(this.championshipsData).forEach(category => {
            const categoryData = this.championshipsData[category];
            const tab = document.querySelector(`[data-category="${category}"]`);
            
            if (tab && categoryData) {
                const countElement = tab.querySelector('.tab-count');
                const yearsElement = tab.querySelector('.tab-years');
                
                if (countElement) {
                    const competitionsCount = categoryData.competitions ? categoryData.competitions.length : categoryData.total_competitions;
                    countElement.textContent = `${competitionsCount} змагань`;
                }
                
                if (yearsElement && categoryData.years) {
                    yearsElement.textContent = categoryData.years;
                }
                
                // Update protocol header as well
                const protocolHeader = document.querySelector(`[data-category="${category}"] .protocol-header`);
                if (protocolHeader) {
                    const titleElement = protocolHeader.querySelector('h3');
                    const descElement = protocolHeader.querySelector('p');
                    
                    if (titleElement && categoryData.title) {
                        titleElement.textContent = categoryData.title;
                    }
                    
                    if (descElement && categoryData.description) {
                        descElement.textContent = categoryData.description;
                    }
                }
            }
        });
    }

    handleProtocolsError() {
        const protocolsSection = document.querySelector('.competition-protocols');
        if (protocolsSection) {
            protocolsSection.innerHTML = `
                <div class="container">
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h3>Помилка завантаження протоколів</h3>
                        <p>Не вдалося завантажити дані про змагання. Спробуйте оновити сторінку.</p>
                        <button onclick="location.reload()" class="retry-btn">Оновити сторінку</button>
                    </div>
                </div>
            `;
        }
    }

    setupProtocolTabs() {
        const tabButtons = document.querySelectorAll('.protocol-tab');
        const tabContents = document.querySelectorAll('.protocol-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.dataset.category;
                
                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab
                button.classList.add('active');
                
                // Show corresponding content
                const targetContent = document.querySelector(`.protocol-content[data-category="${category}"]`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
                
                // Reset pagination to page 1 when switching tabs
                this.setCurrentProtocolPage(category, 1);
                
                // Render competitions for the selected category
                this.renderCompetitions(category);
                
                // Update URL hash
                window.location.hash = `protocols-${category}`;
                
                console.log(`📋 Switched to ${category.toUpperCase()} protocols`);
            });
        });
        
        // Handle initial tab based on URL hash
        const hash = window.location.hash;
        if (hash && hash.startsWith('#protocols-')) {
            const category = hash.replace('#protocols-', '');
            const targetTab = document.querySelector(`.protocol-tab[data-category="${category}"]`);
            if (targetTab) {
                targetTab.click();
                return;
            }
        }
        
        // Default to first tab
        const firstTab = tabButtons[0];
        if (firstTab) {
            firstTab.click();
        }
    }

    generateCompetitionsData() {
        this.competitionsData = {
            u23: this.generateYearRange(2009, 2024, true), // exclude 2022
            u21: this.generateYearRange(2009, 2024, false),
            u18: this.generateYearRange(2013, 2024, false),
            u17: this.generateYearRange(2009, 2024, false),
            u16: this.generateYearRange(2011, 2024, false),
            u15: this.generateYearRange(2012, 2024, false)
        };
    }

    generateYearRange(startYear, endYear, excludeCurrentYear = false) {
        const competitions = [];
        const currentYear = new Date().getFullYear();
        
        for (let year = endYear; year >= startYear; year--) {
            // Skip 2022 for U23 due to war
            if (excludeCurrentYear && year === 2022) {
                continue;
            }
            
            competitions.push({
                year: year,
                title: `Чемпіонат України ${year}`,
                location: this.getCompetitionLocation(year),
                date: this.getCompetitionDate(year),
                status: 'completed',
                files: this.generateCompetitionFiles(year)
            });
        }
        
        return competitions;
    }

    getCompetitionLocation(year) {
        const locations = [
            'Київ', 'Львів', 'Харків', 'Одеса', 'Дніпро', 
            'Запоріжжя', 'Вінниця', 'Черкаси', 'Полтава', 'Житомир'
        ];
        return locations[year % locations.length];
    }

    getCompetitionDate(year) {
        const months = [
            'березня', 'квітня', 'травня', 'червня', 
            'жовтня', 'листопада', 'грудня'
        ];
        const day = Math.floor(Math.random() * 28) + 1;
        const month = months[year % months.length];
        return `${day} ${month} ${year}`;
    }

    generateCompetitionFiles(year) {
        const files = [];
        
        // Main protocol always exists
        files.push({
            name: 'Протокол змагань',
            type: 'protocol',
            icon: 'protocol',
            path: `assets/protocols/${year}/protocol.pdf`
        });
        
        // Results by weight categories
        if (year >= 2015) {
            files.push({
                name: 'Результати за ваговими категоріями',
                type: 'results',
                icon: 'results',
                path: `assets/protocols/${year}/results.pdf`
            });
        }
        
        // Team standings (newer competitions)
        if (year >= 2018) {
            files.push({
                name: 'Командний залік',
                type: 'team',
                icon: 'team',
                path: `assets/protocols/${year}/team_standings.pdf`
            });
        }
        
        // Photos/media (recent years)
        if (year >= 2020) {
            files.push({
                name: 'Фотозвіт',
                type: 'media',
                icon: 'media',
                path: `assets/protocols/${year}/photos.pdf`
            });
        }
        
        return files;
    }

    renderCompetitions(category) {
        const container = document.querySelector(`[data-category="${category}"] .competitions-grid`);
        const data = this.championshipsData[category];
        
        if (!container) {
            console.error(`Container not found for category: ${category}`);
            return;
        }
        
        if (!data || !data.competitions) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>Протоколи недоступні</h3>
                    <p>Протоколи для цієї категорії будуть додані найближчим часом</p>
                </div>
            `;
            return;
        }
        
        const competitions = data.competitions;
        const itemsPerPage = 6;
        const currentPage = this.getCurrentProtocolPage(category);
        const totalPages = Math.ceil(competitions.length / itemsPerPage);
        
        // Calculate start and end indices
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentCompetitions = competitions.slice(startIndex, endIndex);
        
        // Render competitions
        container.innerHTML = currentCompetitions.map(comp => this.renderCompetitionCard(comp)).join('');
        
        // Render pagination
        this.renderProtocolPagination(category, currentPage, totalPages, competitions.length);
        
        // Load file sizes asynchronously
        setTimeout(() => {
            this.loadFileSizes();
        }, 100);
        
        // Add download tracking
        container.addEventListener('click', (e) => {
            const fileElement = e.target.closest('.competition-file');
            if (fileElement) {
                e.preventDefault();
                
                const fileType = fileElement.dataset.fileType;
                const filePath = fileElement.dataset.filePath;
                const fileName = fileElement.dataset.fileName;
                const competitionTitle = fileElement.dataset.competitionTitle;
                
                const file = {
                    type: fileType,
                    path: filePath,
                    name: fileName
                };
                
                const competition = {
                    title: competitionTitle
                };
                
                // Use UIManager's handleFileClick method
                if (this.uiManager && this.uiManager.handleFileClick) {
                    this.uiManager.handleFileClick(file, competition);
                } else {
                    // Fallback for regular downloads
                    if (fileType !== 'modal') {
                        window.open(filePath, '_blank');
                    }
                }
                
                // Track the action
                this.trackProtocolDownload(fileName, category);
            }
        });
    }

    renderCompetitionCard(competition) {
        const statusClass = competition.status === 'upcoming' ? 'upcoming' : '';
        
        return `
            <div class="competition-card">
                <div class="competition-year ${statusClass}">${competition.year}</div>
                <h4 class="competition-title">${competition.title}</h4>
                
                <div class="competition-info">
                    <div class="info-item">
                        <span class="info-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                        </span>
                        <span>${competition.location}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-icon">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                        </span>
                        <span>${competition.date}</span>
                    </div>
                </div>
                
                <div class="competition-files">
                    ${competition.files.map(file => `
                        <div class="competition-file" data-file-type="${file.type}" data-file-path="${file.path}" data-file-name="${file.name}" data-competition-title="${competition.title}">
                            <div class="file-info">
                                <span class="file-icon">${this.getFileIcon(file.icon)}</span>
                                <div class="file-details">
                                    <span class="file-name">${file.name}</span>
                                    <span class="file-meta">${file.type === 'modal' ? 'Результати' : 'PDF'} • <span class="file-size">Завантаження...</span></span>
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
            protocol: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
            </svg>`,
            results: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="8" r="7"/>
                <polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"/>
            </svg>`,
            team: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>`,
            media: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
            </svg>`
        };
        
        return icons[iconType] || icons.protocol;
    }

    async loadFileSizes() {
        const fileElements = document.querySelectorAll('.competition-file[data-file-path]');
        
        for (const element of fileElements) {
            const filePath = element.dataset.filePath;
            const sizeElement = element.querySelector('.file-size');
            
            try {
                const size = await this.getFileSize(filePath);
                sizeElement.textContent = size;
            } catch (error) {
                sizeElement.textContent = 'Недоступно';
                console.warn(`Could not get size for file: ${filePath}`, error);
            }
        }
    }

    async getFileSize(filePath) {
        try {
            const response = await fetch(filePath, { method: 'HEAD' });
            if (response.ok) {
                const contentLength = response.headers.get('content-length');
                if (contentLength) {
                    return this.formatFileSize(parseInt(contentLength));
                }
            }
            
            // Fallback: try to get file info via fetch
            const fullResponse = await fetch(filePath);
            if (fullResponse.ok) {
                const blob = await fullResponse.blob();
                return this.formatFileSize(blob.size);
            }
            
            throw new Error('Could not determine file size');
        } catch (error) {
            // Return a placeholder size if file doesn't exist or can't be accessed
            return this.getPlaceholderSize(filePath);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Б';
        
        const k = 1024;
        const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    getPlaceholderSize(filePath) {
        // Generate consistent placeholder sizes based on file path
        const hash = this.simpleHash(filePath);
        const sizes = ['1.2 МБ', '1.8 МБ', '2.1 МБ', '2.5 МБ', '3.1 МБ', '1.5 МБ', '2.8 МБ'];
        return sizes[hash % sizes.length];
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    trackProtocolDownload(fileName, category) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'download', {
                'event_category': 'competition_protocols',
                'event_label': `${category}_${fileName}`
            });
        }
        
        // Internal tracking
        if (this.statsManager) {
            this.statsManager.trackUsage('protocol_download', {
                file_name: fileName,
                category: category,
                timestamp: Date.now()
            });
        }
        
        console.log(`📥 Downloaded: ${fileName} (${category.toUpperCase()})`);
    }

    // Get current page for protocols
    getCurrentProtocolPage(category) {
        const key = `protocol_page_${category}`;
        return parseInt(localStorage.getItem(key)) || 1;
    }

    // Set current page for protocols
    setCurrentProtocolPage(category, page) {
        const key = `protocol_page_${category}`;
        localStorage.setItem(key, page.toString());
    }

    // Render protocol pagination
    renderProtocolPagination(category, currentPage, totalPages, totalItems) {
        const paginationId = `protocol-pagination-${category}`;
        let paginationContainer = document.getElementById(paginationId);
        
        if (!paginationContainer) {
            // Create pagination container if it doesn't exist
            const container = document.querySelector(`[data-category="${category}"] .competitions-grid`);
            if (container) {
                const paginationDiv = document.createElement('div');
                paginationDiv.id = paginationId;
                paginationDiv.className = 'pagination-container';
                container.parentNode.insertBefore(paginationDiv, container.nextSibling);
                paginationContainer = paginationDiv;
            }
        }
        
        if (!paginationContainer) {
            console.error(`Could not create pagination container for category: ${category}`);
            return;
        }
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        const pageNumbers = this.generateProtocolPageNumbers(currentPage, totalPages);
        
        paginationContainer.innerHTML = `
            <div class="pagination-wrapper">
                <div class="pagination-controls">
                    <button class="pagination-btn prev-btn" ${currentPage === 1 ? 'disabled' : ''} 
                            data-page="${currentPage - 1}" data-category="${category}"
                            style="transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); ${currentPage === 1 ? 'opacity: 0.4; transform: scale(0.95); cursor: not-allowed;' : 'opacity: 1; transform: scale(1); cursor: pointer;'}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 18L9 12L15 6"/>
                        </svg>
                    </button>
                    
                    <div class="pagination-numbers" style="transition: opacity 0.2s ease, transform 0.2s ease;">
                        ${pageNumbers.map(page => `
                            <button class="pagination-number ${page === currentPage ? 'active' : ''}" 
                                    data-page="${page}" data-category="${category}"
                                    style="transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                                ${page}
                            </button>
                        `).join('')}
                    </div>
                    
                    <button class="pagination-btn next-btn" ${currentPage === totalPages ? 'disabled' : ''} 
                            data-page="${currentPage + 1}" data-category="${category}"
                            style="transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); ${currentPage === totalPages ? 'opacity: 0.4; transform: scale(0.95); cursor: not-allowed;' : 'opacity: 1; transform: scale(1); cursor: pointer;'}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 18L15 12L9 6"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        this.attachProtocolPaginationListeners(category);
        
        // Animate page numbers
        setTimeout(() => {
            this.animateProtocolPageNumbers(category);
        }, 50);
    }

    // Generate page numbers for protocols
    generateProtocolPageNumbers(currentPage, totalPages) {
        const pages = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1, '...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...', totalPages);
            }
        }
        
        return pages.filter(page => page !== '...' || pages.indexOf(page) === pages.lastIndexOf(page));
    }

    // Attach pagination event listeners
    attachProtocolPaginationListeners(category) {
        const paginationId = `protocol-pagination-${category}`;
        const paginationBtns = document.querySelectorAll(`#${paginationId} [data-page]`);
        
        paginationBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.target.dataset.page);
                
                if (!isNaN(page) && page > 0) {
                    this.setCurrentProtocolPage(category, page);
                    this.renderCompetitions(category);
                    
                    // Smooth scroll to top of competitions
                    document.querySelector(`[data-category="${category}"] .competitions-grid`).scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Animate page numbers
    animateProtocolPageNumbers(category) {
        const pageNumbers = document.querySelectorAll(`#protocol-pagination-${category} .pagination-number`);
        
        pageNumbers.forEach((number, index) => {
            setTimeout(() => {
                number.style.transform = 'scale(1.1)';
                number.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
                
                setTimeout(() => {
                    number.style.transform = 'scale(1)';
                }, 150);
            }, index * 50);
        });
    }
}

// Initialize the Documents Manager
const documentsManager = new DocumentsManager();

// Export for global access
window.DocumentsManager = documentsManager; 