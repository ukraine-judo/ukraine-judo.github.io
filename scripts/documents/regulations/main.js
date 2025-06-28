/**
 * Regulations Manager - Main JavaScript for Regulations Page
 * Handles regulations display by years, filtering, pagination, and document viewing
 */

class RegulationsManager {
    constructor() {
        this.currentYear = '2024'; // Default to latest year
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.allRegulations = {};
        this.filteredRegulations = [];
        this.currentSearch = '';
        
        // DOM Elements
        this.elements = {
            regulationsSection: document.getElementById('regulations-section'),
            regulationsGrid: document.getElementById('regulations-grid'),
            regulationsPagination: document.getElementById('regulations-pagination'),
            loadingState: document.getElementById('loading-state'),
            errorState: document.getElementById('error-state'),
            searchFilter: document.getElementById('search-filter'),
            categoriesGrid: document.getElementById('categories-grid'),
            regulationsCategoryTitle: document.getElementById('regulations-category-title'),
            regulationsCategoryDescription: document.getElementById('regulations-category-description'),
            viewerModal: document.getElementById('viewer-modal'),
            viewerContainer: document.getElementById('viewer-container'),
            modalTitle: document.querySelector('.viewer-modal .modal-title'),
            downloadBtn: document.getElementById('download-btn'),
            zoomInBtn: document.getElementById('zoom-in'),
            zoomOutBtn: document.getElementById('zoom-out'),
            modalClose: document.querySelector('.viewer-modal .modal-close')
        };
        
        this.initialize();
    }
    
    async initialize() {
        try {
            await this.loadAllData();
            this.renderYears();
            this.setupEventListeners();
            this.updateYearFilter(); // Update year filter after data is loaded
            this.showYear('2024'); // Show default year
            this.hideLoading();
        } catch (error) {
            console.error('Error initializing regulations:', error);
            this.showError();
        }
    }

    async loadAllData() {
        try {
            // Load all year data
            const years = ['2020', '2021', '2022', '2023', '2024'];
            const promises = years.map(year => this.loadYearData(year));
            
            await Promise.all(promises);
            console.log('📋 All regulations data loaded successfully');
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }
    
    async loadYearData(year) {
        try {
            const response = await fetch(`database/docs/regulations/${year}.json`);
        if (!response.ok) {
                console.warn(`Failed to load ${year} data - file might not exist`);
                this.allRegulations[year] = [];
                return;
        }
        
        const data = await response.json();
            
            // Use the regulations array from the JSON structure
            this.allRegulations[year] = (data.regulations || []).map(regulation => ({
                ...regulation,
                year: parseInt(year),
                files: regulation.files || []
            }));
            
            console.log(`📁 Loaded ${this.allRegulations[year].length} regulations for ${year}`);
            } catch (error) {
            console.error(`Error loading ${year} data:`, error);
            this.allRegulations[year] = [];
        }
    }

    renderYears() {
        const container = this.elements.categoriesGrid;
        if (!container) return;

        const years = [
            { id: '2020', title: '2020' },
            { id: '2021', title: '2021' },
            { id: '2022', title: '2022' },
            { id: '2023', title: '2023' },
            { id: '2024', title: '2024' }
        ];

        container.innerHTML = years.map(year => {
            const regulations = this.allRegulations[year.id] || [];
            const count = regulations.length;
            
            const isActive = year.id === '2024' ? ' active' : '';
            
            return `
                <div class="category-card${isActive}" data-category="${year.id}">
                    <div class="category-icon">${year.title}</div>
                    <div class="category-title">Регламенти ФДУ</div>
                    <div class="category-description">офіційні документи ${year.title} року</div>
                    <div class="category-stats">
                        <div class="stat-item">
                            <span class="stat-number">${count}</span>
                            <span class="stat-label">Регламентів</span>
                </div>
                        <span class="stat-period">Рік ${year.title}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    setupEventListeners() {
        // Year category selection
        if (this.elements.categoriesGrid) {
            this.elements.categoriesGrid.addEventListener('click', (e) => {
                const categoryCard = e.target.closest('.category-card');
                if (categoryCard) {
                    const year = categoryCard.dataset.category;
                    this.showYear(year);
                }
            });
        }
        
        // Year filter dropdown
        const yearFilter = document.getElementById('year-filter');
        if (yearFilter) {
            this.updateYearFilter();
            yearFilter.addEventListener('change', (e) => {
                const selectedYear = e.target.value;
                if (selectedYear) {
                    this.showYear(selectedYear);
                } else {
                    // Show all years combined or default to 2024
                    this.showYear('2024');
                }
            });
        }
        
        // Search filter
        if (this.elements.searchFilter) {
            this.elements.searchFilter.addEventListener('input', this.debounce((e) => {
                this.currentSearch = e.target.value;
                this.currentPage = 1;
                this.applyFilters();
            }, 300));
        }
    }

    updateYearFilter() {
        const yearFilter = document.getElementById('year-filter');
        if (!yearFilter) return;
        
        const years = ['2020', '2021', '2022', '2023', '2024'];
        
        yearFilter.innerHTML = `
            <option value="">Всі роки</option>
            ${years.map(year => {
                const regulations = this.allRegulations[year] || [];
                return `<option value="${year}">${year} (${regulations.length})</option>`;
            }).join('')}
        `;
    }

    showYear(year) {
        console.log(`📅 Showing regulations for year: ${year}`);
        
        // Update active category
        this.elements.categoriesGrid.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('active');
        });
        
        const activeCard = this.elements.categoriesGrid.querySelector(`[data-category="${year}"]`);
        if (activeCard) {
            activeCard.classList.add('active');
        }
        
        // Update year filter dropdown
        const yearFilter = document.getElementById('year-filter');
        if (yearFilter) {
            yearFilter.value = year;
        }
        
        // Update current state
        this.currentYear = year;
        this.currentPage = 1;
        this.currentSearch = '';
        
        // Update UI
        if (this.elements.regulationsCategoryTitle) {
            this.elements.regulationsCategoryTitle.textContent = `Регламенти ${year}`;
        }
        if (this.elements.regulationsCategoryDescription) {
            this.elements.regulationsCategoryDescription.textContent = `офіційні документи ${year} року`;
        }
        if (this.elements.searchFilter) {
            this.elements.searchFilter.value = '';
        }
        
        // Apply filters and render
        this.applyFilters();
        
        // Scroll to regulations section
        if (this.elements.regulationsSection) {
            this.elements.regulationsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    applyFilters() {
        const regulations = this.allRegulations[this.currentYear] || [];
        
        // Apply search filter
        this.filteredRegulations = regulations.filter(regulation => {
            if (!this.currentSearch) return true;
            
            const searchLower = this.currentSearch.toLowerCase();
            return regulation.title.toLowerCase().includes(searchLower) ||
                   regulation.description.toLowerCase().includes(searchLower);
        });
        
        this.renderRegulations();
    }

    renderRegulations() {
        if (!this.elements.regulationsGrid) return;
        
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
        const pageRegulations = this.filteredRegulations.slice(startIndex, endIndex);
        
        if (pageRegulations.length === 0) {
            this.elements.regulationsGrid.innerHTML = `
                <div class="no-regulations">
                    <div class="empty-icon">📋</div>
                    <h4>Регламенти не знайдено</h4>
                    <p>За вашими критеріями пошуку регламенти не знайдено. Спробуйте змінити фільтри.</p>
                </div>
            `;
            return;
        }
        
        this.elements.regulationsGrid.innerHTML = pageRegulations.map(regulation => this.renderRegulationCard(regulation)).join('');
    }

    renderRegulationCard(regulation) {
        return `
            <div class="regulation-card fade-in-up">
                <div class="regulation-header">
                    <div class="regulation-title">
                        <h3>${regulation.title}</h3>
                    </div>
                    <span class="regulation-year">${regulation.year}</span>
                </div>
                
                <div class="regulation-info">
                    <div class="info-item">
                        <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4"/>
                            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
                        </svg>
                        <span class="info-text">${regulation.description}</span>
                    </div>
                </div>
                
                <div class="regulation-files">
                    ${regulation.files.map(file => `
                        <div class="regulation-file">
                            <div class="file-info">
                                <div class="file-icon ${file.type}"></div>
                                <div class="file-details">
                                    <span class="file-name">${file.name}</span>
                                    <div class="file-meta">
                                        <span class="file-type">${this.getFileTypeLabel(file.type)}</span>
                                        <span class="file-size">${file.size}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="file-actions">
                                <button class="file-btn view" 
                                        data-file-url="${file.url}" 
                                        data-file-type="${file.type}" 
                                        data-file-name="${file.name}"
                                        title="Оглянути">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    getFileTypeLabel(type) {
        const labels = {
            'pdf': 'PDF',
            'image': 'Зображення',
            'document': 'Документ'
        };
        return labels[type] || type.toUpperCase();
    }
    
    showLoading() {
        if (this.elements.loadingState) {
            this.elements.loadingState.style.display = 'flex';
        }
        if (this.elements.errorState) {
            this.elements.errorState.style.display = 'none';
        }
    }
    
    hideLoading() {
        if (this.elements.loadingState) {
            this.elements.loadingState.style.display = 'none';
        }
    }
    
    showError() {
        if (this.elements.errorState) {
            this.elements.errorState.style.display = 'block';
        }
        if (this.elements.loadingState) {
            this.elements.loadingState.style.display = 'none';
        }
    }
    
    // Utility functions
    debounce(func, wait) {
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.regulationsManager = new RegulationsManager();
}); 