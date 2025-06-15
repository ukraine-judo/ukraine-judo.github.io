/**
 * Documents Filter Manager
 * Handles filtering, searching, and sorting of documents
 */

class DocumentsFilterManager {
    constructor() {
        this.documents = [];
        this.filteredDocuments = [];
        this.activeFilter = 'all';
        this.searchQuery = '';
        this.sortOrder = 'date-desc';
        this.searchTimeout = null;
    }

    initialize(documents) {
        this.documents = documents || [];
        this.filteredDocuments = [...this.documents];
        this.activeFilter = 'all';
        this.searchQuery = '';
        this.sortOrder = 'date-desc';
        
        this.updateCategoryCounts();
    }

    updateCategoryCounts() {
        const categoryCounts = {};
        
        // Count documents per category
        this.documents.forEach(doc => {
            categoryCounts[doc.category] = (categoryCounts[doc.category] || 0) + 1;
        });
        
        // Update category buttons
        Object.entries(categoryCounts).forEach(([category, count]) => {
            this.updateCategoryButtonCount(category, count);
        });
    }

    updateCategoryButtonCount(category, count) {
        const button = document.querySelector(`[data-filter="${category}"]`);
        if (button) {
            let countElement = button.querySelector('.category-count');
            if (!countElement) {
                countElement = document.createElement('span');
                countElement.className = 'category-count';
                button.appendChild(countElement);
            }
            countElement.textContent = count;
        }
    }

    setActiveFilter(filter) {
        this.activeFilter = filter;
        this.applyFilters();
    }

    getActiveFilter() {
        return this.activeFilter;
    }

    setSearchQuery(query) {
        this.searchQuery = query.toLowerCase().trim();
        
        // Clear existing search timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.applyFilters();
        }, 300);
    }

    setSortOrder(order) {
        this.sortOrder = order;
        this.applyFilters();
    }

    applyFilters() {
        let filtered = [...this.documents];
        
        // Apply category filter
        if (this.activeFilter !== 'all') {
            filtered = filtered.filter(doc => doc.category === this.activeFilter);
        }
        
        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(doc => 
                doc.title.toLowerCase().includes(this.searchQuery) ||
                doc.description.toLowerCase().includes(this.searchQuery) ||
                doc.tags?.some(tag => tag.toLowerCase().includes(this.searchQuery))
            );
        }
        
        // Apply sorting
        filtered = this.sortDocuments(filtered);
        
        this.filteredDocuments = filtered;
    }

    sortDocuments(documents) {
        return documents.sort((a, b) => {
            switch (this.sortOrder) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'title-asc':
                    return a.title.localeCompare(b.title, 'uk');
                case 'title-desc':
                    return b.title.localeCompare(a.title, 'uk');
                case 'size-desc':
                    return this.parseSize(b.size) - this.parseSize(a.size);
                case 'size-asc':
                    return this.parseSize(a.size) - this.parseSize(b.size);
                default:
                    return 0;
            }
        });
    }

    parseSize(sizeStr) {
        if (!sizeStr) return 0;
        
        const match = sizeStr.match(/^([\d.,]+)\s*(КБ|МБ|ГБ|KB|MB|GB)/i);
        if (!match) return 0;
        
        const size = parseFloat(match[1].replace(',', '.'));
        const unit = match[2].toUpperCase();
        
        switch (unit) {
            case 'ГБ':
            case 'GB':
                return size * 1024 * 1024;
            case 'МБ':
            case 'MB':
                return size * 1024;
            case 'КБ':
            case 'KB':
            default:
                return size;
        }
    }

    getFilteredDocuments() {
        return this.filteredDocuments;
    }

    getTotalCount() {
        return this.documents.length;
    }

    getFilteredCount() {
        return this.filteredDocuments.length;
    }

    getCategoryCount(category) {
        return this.documents.filter(doc => doc.category === category).length;
    }

    clearFilters() {
        this.activeFilter = 'all';
        this.searchQuery = '';
        this.sortOrder = 'date-desc';
        this.applyFilters();
    }
} 