/**
 * Documents Statistics Manager
 * Handles statistics display and analytics for documents
 */

class DocumentsStatsManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.statsContainers = {};
        this.animationDuration = 2000; // 2 seconds
        this.counters = new Map();
        this.svgIcons = this.initializeSVGIcons();
        
        this.initializeContainers();
    }

    /**
     * Initialize SVG icons
     */
    initializeSVGIcons() {
        return {
            warning: `<svg viewBox="0 0 24 24"><path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/></svg>`,
            info: `<svg viewBox="0 0 24 24"><path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/></svg>`,
            success: `<svg viewBox="0 0 24 24"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/></svg>`,
            document: `<svg viewBox="0 0 24 24"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>`,
            category: `<svg viewBox="0 0 24 24"><path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/></svg>`,
            calendar: `<svg viewBox="0 0 24 24"><path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19M5,6V5H19V6H5Z"/></svg>`
        };
    }

    /**
     * Initialize statistics containers
     */
    initializeContainers() {
        this.statsContainers = {
            documentsCount: document.querySelector('.documents-stat-number'),
            categoriesCount: document.querySelectorAll('.documents-stat-number')[1],
            yearStat: document.querySelectorAll('.documents-stat-number')[2],
            heroStats: document.querySelectorAll('.hero-stat-number'),
            categoryCards: document.querySelectorAll('.category-count')
        };
    }

    /**
     * Update all statistics
     */
    updateStats(data) {
        try {
            if (!data || !data.documents) {
                console.warn('No data provided to updateStats');
                return;
            }

            const stats = {
                totalDocuments: data.documents.length,
                totalCategories: this.countCategories(data.documents),
                categoryCounts: this.getCategoryCounts(data.documents)
            };
            
            // Update main hero statistics
            this.updateHeroStats(stats);
            
            // Update category statistics
            this.updateCategoryStats(stats);
            
            // Update document page statistics
            this.updateDocumentPageStats(stats);
            
            console.log('Statistics updated successfully');
            
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }

    /**
     * Count unique categories
     */
    countCategories(documents) {
        const categories = new Set();
        documents.forEach(doc => {
            if (doc.category) {
                categories.add(doc.category);
            }
        });
        return categories.size;
    }

    /**
     * Get document counts by category
     */
    getCategoryCounts(documents) {
        const counts = {};
        documents.forEach(doc => {
            if (doc.category) {
                counts[doc.category] = (counts[doc.category] || 0) + 1;
            }
        });
        return counts;
    }

    /**
     * Update hero section statistics with animation
     * @param {Object} stats - Statistics object
     */
    updateHeroStats(stats) {
        const heroStatNumbers = document.querySelectorAll('.stat-number');
        
        if (heroStatNumbers.length >= 3) {
            // Documents count
            this.animateCounter(heroStatNumbers[0], stats.totalDocuments, '+');
            
            // Categories count
            this.animateCounter(heroStatNumbers[1], stats.totalCategories);
            
            // Current year
            const currentYear = new Date().getFullYear();
            this.animateCounter(heroStatNumbers[2], currentYear);
        }
    }

    /**
     * Update category statistics
     * @param {Object} stats - Statistics object
     */
    updateCategoryStats(stats) {
        // Update category cards with document counts
        document.querySelectorAll('.category-card').forEach((card, index) => {
            const categoryId = this.getCategoryIdFromCard(card);
            const count = stats.categoryCounts[categoryId] || 0;
            
            const countElement = card.querySelector('.category-count');
            if (countElement) {
                const suffix = this.getDocumentCountSuffix(count);
                countElement.textContent = `${count} ${suffix}`;
            }
        });
    }

    /**
     * Update document page specific statistics
     * @param {Object} stats - Statistics object
     */
    updateDocumentPageStats(stats) {
        // Update filter counts
        this.updateFilterCounts(stats);
        
        // Update metadata information
        this.updateMetadataInfo(stats);
        
        // Update page title with count
        this.updatePageTitle(stats.totalDocuments);
    }

    /**
     * Animate counter from 0 to target value
     * @param {Element} element - Target element
     * @param {number} target - Target number
     * @param {string} prefix - Prefix like '+'
     * @param {string} suffix - Suffix
     */
    animateCounter(element, target, prefix = '', suffix = '') {
        if (!element || isNaN(target)) return;
        
        // Clear any existing animation
        const elementId = this.getElementId(element);
        if (this.counters.has(elementId)) {
            clearInterval(this.counters.get(elementId));
        }
        
        const startValue = 0;
        const increment = target / (this.animationDuration / 50); // 50ms intervals
        let currentValue = startValue;
        
        const updateCounter = () => {
            currentValue += increment;
            
            if (currentValue >= target) {
                currentValue = target;
                element.textContent = `${prefix}${Math.floor(currentValue)}${suffix}`;
                clearInterval(interval);
                this.counters.delete(elementId);
            } else {
                element.textContent = `${prefix}${Math.floor(currentValue)}${suffix}`;
            }
        };
        
        const interval = setInterval(updateCounter, 50);
        this.counters.set(elementId, interval);
        
        // Start immediately
        updateCounter();
    }

    /**
     * Get unique ID for element
     * @param {Element} element - DOM element
     * @returns {string} Unique ID
     */
    getElementId(element) {
        if (!element.id) {
            element.id = 'stats-element-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        }
        return element.id;
    }

    /**
     * Get category ID from card element
     * @param {Element} card - Category card element
     * @returns {string} Category ID
     */
    getCategoryIdFromCard(card) {
        const link = card.querySelector('.category-link');
        if (link) {
            const href = link.getAttribute('href');
            return href ? href.substring(1) : '';
        }
        return '';
    }

    /**
     * Get appropriate suffix for document count
     * @param {number} count - Document count
     * @returns {string} Appropriate suffix
     */
    getDocumentCountSuffix(count) {
        if (count === 1) {
            return 'документ';
        } else if (count >= 2 && count <= 4) {
            return 'документи';
        } else {
            return 'документів';
        }
    }

    /**
     * Update filter button counts
     * @param {Object} stats - Statistics object
     */
    updateFilterCounts(stats) {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(button => {
            const filter = button.dataset.filter;
            let count = 0;
            
            if (filter === 'all') {
                count = stats.totalDocuments;
            } else {
                count = stats.categoryCounts[filter] || 0;
            }
            
            // Add count badge to button
            this.addCountBadgeToButton(button, count);
        });
    }

    /**
     * Add count badge to filter button
     * @param {Element} button - Filter button
     * @param {number} count - Document count
     */
    addCountBadgeToButton(button, count) {
        // Remove existing badge
        const existingBadge = button.querySelector('.filter-count-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Add new badge
        
        // Add styles if not present
        this.addCountBadgeStyles();
    }

    /**
     * Add styles for count badges
     */
    addCountBadgeStyles() {
        if (document.querySelector('#stats-badge-styles')) {
            return;
        }
        
        const styles = document.createElement('style');
        styles.id = 'stats-badge-styles';
        styles.textContent = `
            .filter-count-badge {
                display: none;
                background: var(--primary-color);
                color: white;
                font-size: 0.75rem;
                padding: 0.125rem 0.375rem;
                border-radius: 10px;
                margin-left: 0.5rem;
                font-weight: 600;
                min-width: 1.25rem;
                text-align: center;
                display: inline-block;
            }
            
            .filter-btn.active .filter-count-badge {
                background: white;
                color: var(--primary-color);
            }
            
            .stats-highlight {
                color: var(--primary-color);
                font-weight: 600;
            }
            
            .stats-updated {
                font-size: 0.8rem;
                color: #666;
                margin-top: 0.5rem;
            }

            .stats-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                padding: 1rem;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 300px;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .stats-notification svg {
                width: 20px;
                height: 20px;
                flex-shrink: 0;
            }

            .stats-notification.success {
                border-left: 4px solid #4caf50;
            }

            .stats-notification.success svg {
                fill: #4caf50;
            }

            .stats-notification.warning {
                border-left: 4px solid #ff9800;
            }

            .stats-notification.warning svg {
                fill: #ff9800;
            }

            .stats-notification.error {
                border-left: 4px solid #f44336;
            }

            .stats-notification.error svg {
                fill: #f44336;
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Update metadata information display
     * @param {Object} stats - Statistics object
     */
    updateMetadataInfo(stats) {
        // Update last updated timestamp
        if (stats.lastUpdated) {
            const lastUpdatedElements = document.querySelectorAll('.last-updated');
            const formattedDate = this.formatLastUpdated(stats.lastUpdated);
            
            lastUpdatedElements.forEach(element => {
                element.innerHTML = `${this.svgIcons.calendar} Останнє оновлення: ${formattedDate}`;
            });
        }
        
        // Update version info
        if (stats.version) {
            const versionElements = document.querySelectorAll('.data-version');
            versionElements.forEach(element => {
                element.innerHTML = `${this.svgIcons.info} Версія: ${stats.version}`;
            });
        }
    }

    /**
     * Format last updated timestamp
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Formatted date
     */
    formatLastUpdated(timestamp) {
        try {
            const date = new Date(timestamp);
            return date.toLocaleDateString('uk-UA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return timestamp;
        }
    }

    /**
     * Update page title with document count
     * @param {number} count - Total document count
     */
    updatePageTitle(count) {
        const titleElement = document.querySelector('.page-title, .documents-hero h1');
        if (titleElement && count > 0) {
            const originalTitle = titleElement.textContent;
            if (!originalTitle.includes('(')) {
                titleElement.innerHTML = `${originalTitle} <span class="stats-highlight">(${count})</span>`;
            }
        }
    }

    /**
     * Get real-time statistics
     * @returns {Object} Current statistics
     */
    getRealTimeStats() {
        return {
            visibleDocuments: document.querySelectorAll('.document-item:not(.hidden)').length,
            totalDocuments: document.querySelectorAll('.document-item').length,
            activeFilters: document.querySelectorAll('.filter-btn.active').length,
            downloadLinks: document.querySelectorAll('.document-action.primary').length,
            viewLinks: document.querySelectorAll('.document-action.secondary').length
        };
    }

    /**
     * Update filter results statistics
     * @param {number} filteredCount - Number of filtered results
     * @param {number} totalCount - Total number of documents
     */
    updateFilterResults(filteredCount, totalCount) {
        const resultsInfo = document.querySelector('.filter-results-info');
        
        if (!resultsInfo) {
            // Create results info element
            const filterSection = document.querySelector('.documents-filter');
            if (filterSection) {
                const infoElement = document.createElement('div');
                infoElement.className = 'filter-results-info';
                filterSection.parentNode.insertBefore(infoElement, filterSection.nextSibling);
            }
        }
        
        const info = document.querySelector('.filter-results-info');
        if (info) {
            if (filteredCount === totalCount) {
                info.innerHTML = `${this.svgIcons.document} Показано всі ${totalCount} документів`;
            } else {
                info.innerHTML = `${this.svgIcons.document} Показано ${filteredCount} з ${totalCount} документів`;
            }
            
            info.className = 'filter-results-info';
            if (filteredCount === 0) {
                info.classList.add('no-results');
            }
        }
    }

    /**
     * Show statistics notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, warning, error)
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `stats-notification ${type}`;
        
        const icon = this.svgIcons[type] || this.svgIcons.info;
        notification.innerHTML = `
            ${icon}
            <span>${message}</span>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }

    /**
     * Track usage statistics
     * @param {string} action - Action type
     * @param {Object} data - Additional data
     */
    trackUsage(action, data = {}) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: 'documents_stats',
                ...data
            });
        }
        
        // Console logging for development
        console.log('Usage tracked:', action, data);
    }

    /**
     * Generate usage report
     * @returns {Object} Usage report
     */
    generateUsageReport() {
        const realTimeStats = this.getRealTimeStats();
        
        return {
            timestamp: new Date().toISOString(),
            totalDocuments: realTimeStats.totalDocuments,
            currentlyVisible: realTimeStats.visibleDocuments,
            sessionStats: {
                pageLoaded: true,
                filtersUsed: realTimeStats.activeFilters > 1,
                documentsInteracted: realTimeStats.downloadLinks > 0
            }
        };
    }

    /**
     * Reset all counters
     */
    resetCounters() {
        this.counters.forEach((interval, id) => {
            clearInterval(interval);
        });
        this.counters.clear();
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.resetCounters();
    }
} 