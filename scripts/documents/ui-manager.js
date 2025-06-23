/**
 * Documents UI Manager
 * Handles rendering and updating of document-related UI elements
 */

class DocumentsUIManager {
    constructor() {
        this.templates = {};
        this.containers = {};
        this.svgIcons = this.initializeSVGIcons();
        
        this.initializeContainers();
        this.loadTemplates();
    }

    /**
     * Initialize SVG icons
     */
    initializeSVGIcons() {
        return {
            // Document type icons
            pdf: `<svg viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>`,
            doc: `<svg viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M8,12V14H16V12H8M8,16V18H13V16H8Z"/></svg>`,
            xls: `<svg viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M8,12H16V14H8V12M8,16H16V18H8V16Z"/></svg>`,
            
            // Category icons
            protocols: `<svg viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M8,12V14H16V12H8M8,16V18H13V16H8Z"/></svg>`,
            statutory: `<svg viewBox="0 0 24 24"><path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z"/></svg>`,
            competitions: `<svg viewBox="0 0 24 24"><path d="M5,16L3,5H1V3H4L6,14L7,18H20V16H5M7,24A2,2 0 0,1 5,22A2,2 0 0,1 7,20A2,2 0 0,1 9,22A2,2 0 0,1 7,24M17,24A2,2 0 0,1 15,22A2,2 0 0,1 17,20A2,2 0 0,1 19,22A2,2 0 0,1 17,24M7.17,14L6.05,12H15.55L16.3,14H7.17Z"/></svg>`,
            athletes: `<svg viewBox="0 0 24 24"><path d="M12,2A2,2 0 0,1 14,4A2,2 0 0,1 12,6A2,2 0 0,1 10,4A2,2 0 0,1 12,2M21,9V7L15,1V3H9V1L3,7V9H5V20A2,2 0 0,0 7,22H17A2,2 0 0,0 19,20V9H21Z"/></svg>`,
            medical: `<svg viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M17,13H13V17H11V13H7V11H11V7H13V11H17V13Z"/></svg>`,
            financial: `<svg viewBox="0 0 24 24"><path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/></svg>`,
            education: `<svg viewBox="0 0 24 24"><path d="M12,3L1,9L12,15L21,10.09V17H23V9M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18Z"/></svg>`,
            
            // Meta icons
            calendar: `<svg viewBox="0 0 24 24"><path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19M5,6V5H19V6H5Z"/></svg>`,
            file: `<svg viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>`,
            size: `<svg viewBox="0 0 24 24"><path d="M5,4V7H10.5V19H13.5V7H19V4H5Z"/></svg>`,
            language: `<svg viewBox="0 0 24 24"><path d="M12.87,15.07L10.33,12.56L10.36,12.53C12.1,10.59 13.34,8.36 14.07,6H17V4H10V2H8V4H1V6H12.17C11.5,7.92 10.44,9.75 9,11.35C8.07,10.32 7.3,9.19 6.69,8H4.69C5.42,9.63 6.42,11.17 7.67,12.56L2.58,17.58L4,19L9,14L12.11,17.11L12.87,15.07Z"/></svg>`,
            
            // Action icons
            download: `<svg viewBox="0 0 24 24"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/></svg>`,
            view: `<svg viewBox="0 0 24 24"><path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/></svg>`,
            
            // Empty state
            empty: `<svg viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>`
        };
    }

    /**
     * Initialize UI containers
     */
    initializeContainers() {
        this.containers = {
            documentGrid: document.querySelector('.document-grid'),
            categoriesGrid: document.querySelector('.categories-grid'),
            importantGrid: document.querySelector('.important-grid'),
            documentsStats: document.querySelector('.documents-stats')
        };
    }

    /**
     * Load HTML templates for rendering
     */
    loadTemplates() {
        this.templates = {
            documentItem: this.createDocumentItemTemplate(),
            categoryCard: this.createCategoryCardTemplate(),
            importantCard: this.createImportantCardTemplate()
        };
    }

    /**
     * Create document item template
     * @returns {Function} Template function
     */
    createDocumentItemTemplate() {
        return (doc) => `
            <div class="document-item" data-category="${doc.category}" data-document-id="${doc.id}">
                <div class="document-icon">
                    ${this.getDocumentIcon(doc)}
                </div>
                <div class="document-content">
                    <h3 class="document-title">${this.escapeHtml(doc.title)}</h3>
                    <div class="document-meta">
                        <span>${this.svgIcons.calendar} ${doc.formattedDate || doc.date}</span>
                        <span>${this.svgIcons.file} ${doc.format || 'PDF'}</span>
                        <span>${this.svgIcons.language} ${doc.language || 'Українська'}</span>
                    </div>
                    <p class="document-description">
                        ${this.escapeHtml(doc.description)}
                    </p>
                    <div class="document-actions">
                        <a href="${doc.path}" 
                           class="document-action primary" 
                           data-document-id="${doc.id}"
                           download="${doc.filename}">
                            ${this.svgIcons.download}
                            Завантажити
                        </a>
                        <a href="${doc.path}" 
                           class="document-action secondary" 
                           data-document-id="${doc.id}"
                           target="_blank">
                            ${this.svgIcons.view}
                            Переглянути
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create category card template
     * @returns {Function} Template function
     */
    createCategoryCardTemplate() {
        return (category, documentCount) => `
            <div class="category-card">
                <span class="category-icon">${this.getCategoryIcon(category.id)}</span>
                <h3 class="category-title">${this.escapeHtml(category.name)}</h3>
                <p class="category-description">
                    ${this.escapeHtml(category.description)}
                </p>
                <div class="category-count">${documentCount} документів</div>
                <a href="#${category.id}" class="category-link">
                    Переглянути документи
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </a>
            </div>
        `;
    }

    /**
     * Create important card template
     * @returns {Function} Template function
     */
    createImportantCardTemplate() {
        return (doc) => `
            <div class="important-card">
                <div class="important-badge">Важливо</div>
                <h3 class="important-title">${this.escapeHtml(doc.title)}</h3>
                <p class="important-description">
                    ${this.escapeHtml(doc.description)}
                </p>
                <div class="important-meta">
                    <span>${this.svgIcons.calendar} ${doc.formattedDate || doc.date}</span>
                    <span>${this.svgIcons.file} ${doc.format || 'PDF'}</span>
                </div>
                <div class="important-actions">
                    <a href="${doc.path}" 
                       class="important-action download" 
                       data-document-id="${doc.id}"
                       download="${doc.filename}">
                        ${this.svgIcons.download}
                        Завантажити
                    </a>
                    <a href="${doc.path}" 
                       class="important-action view" 
                       data-document-id="${doc.id}"
                       target="_blank">
                        ${this.svgIcons.view}
                        Переглянути
                    </a>
                </div>
            </div>
        `;
    }

    /**
     * Render all documents in the document grid
     */
    async renderDocuments() {
        // This method is replaced by the new renderDocuments method below
        console.warn('Old renderDocuments method called - use new renderDocuments(documents) instead');
    }

    /**
     * Render document categories
     */
    async renderCategories() {
        // This method is replaced by category counting in filter manager
        console.warn('Old renderCategories method called - categories handled by filter manager');
    }

    /**
     * Render important documents
     */
    async renderImportantDocuments() {
        if (!this.containers.importantGrid) {
            console.warn('Important documents grid container not found');
            return;
        }

        try {
            const importantDocuments = this.dataManager.getImportantDocuments();
            
            if (importantDocuments.length === 0) {
                this.containers.importantGrid.style.display = 'none';
                return;
            }

            const importantHtml = importantDocuments
                .slice(0, 3) // Show only first 3 important documents
                .map(doc => this.templates.importantCard(doc))
                .join('');

            this.containers.importantGrid.innerHTML = importantHtml;
            
            console.log(`Rendered ${importantDocuments.length} important documents`);
            
        } catch (error) {
            console.error('Error rendering important documents:', error);
        }
    }

    /**
     * Attach event listeners to document elements
     */
    attachDocumentEventListeners() {
        // Download tracking
        document.querySelectorAll('.document-action.primary').forEach(button => {
            button.addEventListener('click', (e) => {
                const documentId = e.target.dataset.documentId;
                this.trackDocumentDownload(documentId);
            });
        });

        // View tracking
        document.querySelectorAll('.document-action.secondary').forEach(button => {
            button.addEventListener('click', (e) => {
                const documentId = e.target.dataset.documentId;
                this.trackDocumentView(documentId);
            });
        });
    }

    /**
     * Update document visibility based on filters
     * @param {Array} visibleDocumentIds - Array of visible document IDs
     */
    updateDocumentVisibility(visibleDocumentIds) {
        const documentItems = document.querySelectorAll('.document-item');
        const visibleIds = new Set(visibleDocumentIds);
        
        documentItems.forEach(item => {
            const documentId = item.dataset.documentId;
            
            if (visibleIds.has(documentId)) {
                item.style.display = 'flex';
                item.classList.remove('hidden');
            } else {
                item.style.display = 'none';
                item.classList.add('hidden');
            }
        });
        
        // Update results count
        this.updateResultsCount(visibleDocumentIds.length);
    }

    /**
     * Update results count display
     * @param {number} count - Number of visible results
     */
    updateResultsCount(count) {
        const resultsCount = document.querySelector('.results-count');
        if (resultsCount) {
            resultsCount.textContent = `Показано: ${count} документів`;
        }
    }

    /**
     * Render empty state
     * @param {Element} container - Container element
     * @param {string} message - Empty state message
     */
    renderEmptyState(container, message) {
        container.innerHTML = `
            <div class="empty-state">
                ${this.svgIcons.empty}
                <h3 class="empty-state-title">${message}</h3>
                <p class="empty-state-description">
                    Документи будуть додані найближчим часом
                </p>
            </div>
        `;
    }

    /**
     * Render error state
     * @param {Element} container - Container element
     * @param {string} message - Error message
     */
    renderErrorState(container, message) {
        container.innerHTML = `
            <div class="error-state">
                <div class="error-state-icon">⚠️</div>
                <h3 class="error-state-title">${message}</h3>
                <p class="error-state-description">
                    Будь ласка, спробуйте оновити сторінку
                </p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Оновити сторінку
                </button>
            </div>
        `;
    }

    /**
     * Get appropriate icon for document type
     * @param {Object} doc - Document object
     * @returns {string} SVG icon HTML
     */
    getDocumentIcon(doc) {
        const extension = doc.extension || doc.format?.toLowerCase() || 'pdf';
        
        switch (extension) {
            case 'pdf': return this.svgIcons.pdf;
            case 'doc':
            case 'docx': return this.svgIcons.doc;
            case 'xls':
            case 'xlsx': return this.svgIcons.xls;
            default: return this.svgIcons.pdf;
        }
    }

    /**
     * Get category icon
     * @param {string} categoryId - Category ID
     * @returns {string} SVG icon HTML
     */
    getCategoryIcon(categoryId) {
        return this.svgIcons[categoryId] || this.svgIcons.file;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        if (!text) return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Show loading state
     * @param {Element} container - Container element
     */
    showLoadingState(container) {
        if (!container) return;
        
        container.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Завантаження документів...</p>
            </div>
        `;
    }

    /**
     * Track document download
     * @param {string} documentId - Document ID
     */
    trackDocumentDownload(documentId) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'download', {
                event_category: 'documents',
                event_label: documentId,
                value: 1
            });
        }
        
        console.log('Document download tracked:', documentId);
    }

    /**
     * Track document view
     * @param {string} documentId - Document ID
     */
    trackDocumentView(documentId) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'view', {
                event_category: 'documents',
                event_label: documentId,
                value: 1
            });
        }
        
        console.log('Document view tracked:', documentId);
    }

    /**
     * Add CSS for dynamic states
     */
    addDynamicStyles() {
        if (document.querySelector('#documents-ui-styles')) {
            return;
        }
        
        const styles = document.createElement('style');

        
        document.head.appendChild(styles);
    }

    renderDocuments(documents) {
        const grid = document.querySelector('.document-grid');
        
        if (!documents || documents.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    ${this.svgIcons.empty}
                    <h3>Документів не знайдено</h3>
                    <p>Спробуйте змінити фільтри або пошуковий запит</p>
                </div>
            `;
            this.removePagination();
            return;
        }

        // Pagination logic
        const currentPage = this.getCurrentPage();
        const documentsPerPage = 6;
        const totalPages = Math.ceil(documents.length / documentsPerPage);
        const startIndex = (currentPage - 1) * documentsPerPage;
        const endIndex = startIndex + documentsPerPage;
        const pageDocuments = documents.slice(startIndex, endIndex);

        // Render documents for current page
        grid.innerHTML = pageDocuments.map(doc => this.renderDocument(doc)).join('');

        // Update pagination controls
        this.renderPagination(currentPage, totalPages, documents.length);
    }

    renderDocument(doc) {
        const categoryIcons = {
            'protocols': this.svgIcons.protocols,
            'statutory': this.svgIcons.statutory,
            'competitions': this.svgIcons.competitions,
            'athletes': this.svgIcons.athletes,
            'medical': this.svgIcons.medical,
            'financial': this.svgIcons.financial,
            'education': this.svgIcons.education
        };

        const categoryIcon = categoryIcons[doc.category] || this.svgIcons.file;
        const formattedDate = new Date(doc.date).toLocaleDateString('uk-UA');
        
        // Auto-determine format from filename
        const format = this.getFileFormat(doc.filename);
        
        // Auto-determine size (placeholder - would need actual file checking)
        const size = this.getFileSize(doc.filename);
        
        // Check if file can be previewed (only PDF)
        const canPreview = format === 'PDF';
        
        // Generate action buttons
        const actionButtons = `
            <a href="database/docs/all/${doc.filename}" 
               class="document-action primary" 
               target="_blank" 
               download="${doc.filename}">
               ${this.svgIcons.download}
               Завантажити
            </a>
            ${canPreview ? `
            <a href="database/docs/all/${doc.filename}" 
               class="document-action secondary" 
               target="_blank">
               ${this.svgIcons.view}
               Переглянути
            </a>
            ` : ''}
        `;
        
        return `
            <div class="document-item" data-category="${doc.category}">
                <div class="document-icon">${categoryIcon}</div>
                <div class="document-content">
                    <h3 class="document-title">${doc.title}</h3>
                    <div class="document-meta">
                        <span>${this.svgIcons.calendar} ${formattedDate}</span>
                        <span>${this.svgIcons.file} ${format}</span>
                        <span>${this.svgIcons.language} Українська</span>
                    </div>
                    <p class="document-description">
                        ${doc.description}
                    </p>
                    <div class="document-actions">
                        ${actionButtons.trim()}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get file format from filename
     * @param {string} filename - File name
     * @returns {string} File format
     */
    getFileFormat(filename) {
        if (!filename) return 'PDF';
        
        const extension = filename.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'pdf': return 'PDF';
            case 'doc': return 'DOC';
            case 'docx': return 'DOCX';
            case 'xls': return 'XLS';
            case 'xlsx': return 'XLSX';
            case 'txt': return 'TXT';
            default: return 'PDF';
        }
    }

    /**
     * Get estimated file size (placeholder)
     * @param {string} filename - File name
     * @returns {string} Estimated file size
     */
    getFileSize(filename) {
        // Placeholder logic - in production would check actual file
        if (!filename) return 'N/A';
        
        // Simple estimation based on filename patterns
        if (filename.includes('database') || filename.includes('база')) return '2.0 МБ';
        if (filename.includes('program') || filename.includes('програма')) return '2.5 МБ';
        if (filename.includes('statute') || filename.includes('статут')) return '2.8 МБ';
        if (filename.includes('form') || filename.includes('анкета')) return '0.5 МБ';
        if (filename.includes('application') || filename.includes('заява')) return '0.4 МБ';
        if (filename.includes('styling') || filename.includes('стилістика')) return '3.2 МБ';
        
        // Default estimation
        return '1.2 МБ';
    }

    updateStatistics(data) {
        if (!data) return;

        const totalDocs = data.documents ? data.documents.length : 0;
        const totalCategories = data.categories ? Object.keys(data.categories).length : 0;
        
        // Update hero statistics
        this.animateCounter('.stat-item:nth-child(1) .stat-number', totalDocs);
        this.animateCounter('.stat-item:nth-child(2) .stat-number', totalCategories);
        
        // Update category counts
        if (data.categories) {
            Object.entries(data.categories).forEach(([key, category]) => {
                const button = document.querySelector(`[data-filter="${key}"]`);
                if (button) {
                    const countElement = button.querySelector('.category-count');
                    if (countElement) {
                        countElement.textContent = category.count || 0;
                    }
                }
            });
        }
    }

    animateCounter(selector, targetValue) {
        const element = document.querySelector(selector);
        if (!element) return;

        const startValue = 0;
        const duration = 1000;
        const increment = targetValue / (duration / 16);
        let currentValue = startValue;

        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(timer);
            }
            element.textContent = Math.floor(currentValue);
        }, 16);
    }

    showLoadingState() {
        const grid = document.querySelector('.document-grid');
        grid.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Завантаження документів...</p>
            </div>
        `;
    }

    updateCategoryButton(category, count) {
        const button = document.querySelector(`[data-filter="${category}"]`);
        if (button) {
            const countElement = button.querySelector('.category-count') || 
                               button.appendChild(document.createElement('span'));
            countElement.className = 'category-count';
            countElement.textContent = count;
        }
    }

    /**
     * Pagination methods
     */
    getCurrentPage() {
        return parseInt(localStorage.getItem('documents-current-page') || '1');
    }

    setCurrentPage(page) {
        localStorage.setItem('documents-current-page', page.toString());
    }

    renderPagination(currentPage, totalPages, totalDocuments) {
        let paginationContainer = document.querySelector('.pagination-container');
        
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.className = 'pagination-container';
            const documentsSection = document.querySelector('.documents-list .container');
            documentsSection.appendChild(paginationContainer);
        }

        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        const startDoc = ((currentPage - 1) * 6) + 1;
        const endDoc = Math.min(currentPage * 6, totalDocuments);

        // Add animation class to numbers before changing
        const existingNumbers = paginationContainer.querySelector('.pagination-numbers');
        if (existingNumbers) {
            existingNumbers.classList.add('changing');
        }

        // Delayed update to allow fade-out animation
        setTimeout(() => {
            paginationContainer.innerHTML = `
                <div class="pagination-controls">
                    <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                            data-page="${currentPage - 1}" 
                            ${currentPage === 1 ? 'disabled' : ''}
                            style="transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); ${currentPage === 1 ? 'opacity: 0.4; transform: scale(0.95); cursor: not-allowed;' : 'opacity: 1; transform: scale(1); cursor: pointer;'}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 18L9 12L15 6"/>
                        </svg>
                    </button>
                    
                    <div class="pagination-numbers" style="transition: opacity 0.2s ease, transform 0.2s ease;">
                        ${this.generatePageNumbers(currentPage, totalPages)}
                    </div>
                    
                    <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                            data-page="${currentPage + 1}"
                            ${currentPage === totalPages ? 'disabled' : ''}
                            style="transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); ${currentPage === totalPages ? 'opacity: 0.4; transform: scale(0.95); cursor: not-allowed;' : 'opacity: 1; transform: scale(1); cursor: pointer;'}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 18L15 12L9 6"/>
                        </svg>
                    </button>
                </div>
            `;

            // Animate page numbers
            this.animatePageNumbers();
            
            // Attach event listeners after DOM update
            this.attachPaginationListeners();
        }, existingNumbers ? 200 : 0);
    }

    generatePageNumbers(currentPage, totalPages) {
        let pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            // Show all pages
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Show smart pagination
            if (currentPage <= 3) {
                pages = [1, 2, 3, 4, '...', totalPages];
            } else if (currentPage >= totalPages - 2) {
                pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
            }
        }

        return pages.map(page => {
            if (page === '...') {
                return '<span class="pagination-ellipsis">...</span>';
            } else {
                return `<button class="pagination-number ${page === currentPage ? 'active' : ''}" 
                               data-page="${page}">${page}</button>`;
            }
        }).join('');
    }

    attachPaginationListeners() {
        const paginationContainer = document.querySelector('.pagination-container');
        if (!paginationContainer) return;

        paginationContainer.addEventListener('click', (e) => {
            if (e.target.matches('.pagination-btn, .pagination-number')) {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                
                if (!isNaN(page) && !e.target.disabled && !e.target.classList.contains('disabled')) {
                    // Add visual feedback
                    e.target.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        e.target.style.transform = '';
                    }, 150);

                    // Show loading state for smooth transition
                    this.showPageTransition();
                    
                    // Update page with delay for smooth animation
                    setTimeout(() => {
                        this.setCurrentPage(page);
                        // Trigger re-render
                        const event = new CustomEvent('paginationChange', { detail: { page } });
                        document.dispatchEvent(event);
                    }, 100);
                }
            }
        });
    }

    showPageTransition() {
        const documentGrid = document.querySelector('.document-grid');
        if (documentGrid) {
            documentGrid.classList.add('loading');
            
            // Remove loading class after animation
            setTimeout(() => {
                documentGrid.classList.remove('loading');
            }, 400);
        }
    }

    animateCounters() {
        const counters = document.querySelectorAll('.pagination-info .counter');
        counters.forEach((counter, index) => {
            counter.classList.add('updating');
            
            // Stagger the animation
            setTimeout(() => {
                counter.classList.remove('updating');
            }, 200 + (index * 50));
        });
    }

    animatePageNumbers() {
        const pageNumbers = document.querySelectorAll('.pagination-number');
        pageNumbers.forEach((number, index) => {
            number.style.animationDelay = `${index * 50}ms`;
            number.style.animation = 'numberChange 0.4s ease-out';
            
            // Reset animation
            setTimeout(() => {
                number.style.animation = '';
                number.style.animationDelay = '';
            }, 600);
        });
    }

    removePagination() {
        const paginationContainer = document.querySelector('.pagination-container');
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
    }

    resetPagination() {
        this.setCurrentPage(1);
        this.removePagination();
    }

    // Handle file clicks
    handleFileClick(file, competition) {
        if (file.type === 'modal') {
            this.showResultsModal(file, competition);
        } else {
            this.downloadFile(file);
        }
    }

    // Download file
    downloadFile(file) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = file.path;
        link.download = file.name || '';
        link.target = '_blank';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('File download initiated:', file.name);
    }

    // Show results in modal window with enhanced features
    async showResultsModal(file, competition) {
        try {
            const response = await fetch(file.path);
            if (!response.ok) {
                throw new Error('Failed to load results');
            }
            
            const htmlContent = await response.text();
            this.displayModal(htmlContent, `${competition.title} - ${file.name}`, competition);
        } catch (error) {
            console.error('Error loading results:', error);
            this.showNotification('Помилка завантаження результатів', 'error');
        }
    }

    // Display enhanced modal with search and filter functionality
    displayModal(content, title, competition) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('results-modal');
        if (!modal) {
            modal = this.createModal();
        }

        // Update modal content
        const modalTitle = modal.querySelector('.modal-title');
        const modalBody = modal.querySelector('.modal-body');
        
        modalTitle.textContent = title;
        modalBody.innerHTML = this.wrapContentWithControls(content, competition);

        // Initialize modal functionality
        this.initializeModalControls(modal);

        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Add animation
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    // Wrap content with search and filter controls
    wrapContentWithControls(content, competition) {
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
                <div class="results-header">
                    <h2>${competition ? competition.title : 'Результати змагань'}</h2>
                    <h3>${competition ? `${competition.location}, ${competition.date}` : ''}</h3>
                </div>
                ${content}
            </div>
        `;
    }

    // Initialize modal controls (search and filters)
    initializeModalControls(modal) {
        const searchInput = modal.querySelector('#modal-search');
        const genderButtons = modal.querySelectorAll('.gender-btn');
        const resultsSections = modal.querySelectorAll('.results-section');

        // Store original content for filtering
        this.originalContent = Array.from(resultsSections).map(section => ({
            element: section,
            originalHTML: section.innerHTML,
            categories: Array.from(section.querySelectorAll('.weight-category'))
        }));

        // Search functionality
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filterResults(e.target.value.toLowerCase(), this.getActiveGender());
                }, 300);
            });
        }

        // Gender filter functionality
        genderButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active state
                genderButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Apply filter
                const gender = btn.dataset.gender;
                const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
                this.filterResults(searchTerm, gender);
            });
        });
    }

    // Get currently active gender filter
    getActiveGender() {
        const activeBtn = document.querySelector('.gender-btn.active');
        return activeBtn ? activeBtn.dataset.gender : 'all';
    }

    // Filter results based on search term and gender
    filterResults(searchTerm, gender) {
        const resultsSections = document.querySelectorAll('.results-section');
        let hasVisibleResults = false;

        resultsSections.forEach((section, sectionIndex) => {
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

        // Show empty state if no results
        this.updateEmptyState(!hasVisibleResults, searchTerm, gender);
    }

    // Update empty state display
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

    // Create enhanced modal element
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'results-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3 class="modal-title"></h3>
                    <button class="modal-close" aria-label="Закрити">
                        ✕
                    </button>
                </div>
                <div class="modal-body"></div>
            </div>
        `;

        // Add event listeners
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.closeModal());

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

        document.body.appendChild(modal);
        return modal;
    }

    // Close modal
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

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
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

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Add close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
    }
}

// Initialize dynamic styles when class is loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const tempUI = new DocumentsUIManager(null);
        tempUI.addDynamicStyles();
    });
} 