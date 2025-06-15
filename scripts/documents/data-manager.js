/**
 * Documents Data Manager
 * Handles loading, caching, and providing access to document data
 */

class DocumentsDataManager {
    constructor() {
        this.documents = [];
        this.categories = [];
        this.metadata = {};
        this.cache = new Map();
        this.isLoaded = false;
        this.loadingPromise = null;
    }

    /**
     * Load documents from JSON file
     * @returns {Promise} Loading promise
     */
    async loadDocuments() {
        if (this.isLoaded) {
            return this.documents;
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this.fetchDocumentsData();
        return this.loadingPromise;
    }

    /**
     * Fetch documents data from JSON file
     * @returns {Promise} Fetch promise
     */
    async fetchDocumentsData() {
        try {
            const response = await fetch('assets/docs/documents.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Validate data structure
            this.validateData(data);
            
            // Store data
            this.documents = data.documents || [];
            this.categories = data.categories || [];
            this.metadata = data.metadata || {};
            
            // Process documents (add computed fields, etc.)
            this.processDocuments();
            
            // Mark as loaded
            this.isLoaded = true;
            
            console.log(`Loaded ${this.documents.length} documents from ${this.categories.length} categories`);
            
            return this.documents;
        } catch (error) {
            console.error('Failed to load documents data:', error);
            throw new Error('Не вдалося завантажити дані документів');
        }
    }

    /**
     * Validate loaded data structure
     * @param {Object} data - Raw data from JSON
     */
    validateData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }

        if (!Array.isArray(data.documents)) {
            throw new Error('Documents must be an array');
        }

        if (!Array.isArray(data.categories)) {
            throw new Error('Categories must be an array');
        }

        // Validate required fields for each document
        data.documents.forEach((doc, index) => {
            const requiredFields = ['id', 'title', 'category', 'path'];
            requiredFields.forEach(field => {
                if (!doc[field]) {
                    throw new Error(`Document ${index} missing required field: ${field}`);
                }
            });
        });
    }

    /**
     * Process documents to add computed fields and prepare for use
     */
    processDocuments() {
        this.documents = this.documents.map(doc => {
            // Add formatted date
            if (doc.date) {
                doc.formattedDate = this.formatDate(doc.date);
            }

            // Add file extension
            if (doc.filename) {
                doc.extension = doc.filename.split('.').pop()?.toLowerCase();
            }

            // Add category info
            const category = this.getCategoryById(doc.category);
            doc.categoryInfo = category;

            // Add search keywords
            doc.searchKeywords = this.generateSearchKeywords(doc);

            // Validate file path
            doc.isAvailable = this.validateFilePath(doc.path);

            return doc;
        });
    }

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('uk-UA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    /**
     * Generate search keywords for a document
     * @param {Object} doc - Document object
     * @returns {string} Space-separated keywords
     */
    generateSearchKeywords(doc) {
        const keywords = [];
        
        // Add title words
        if (doc.title) {
            keywords.push(...doc.title.toLowerCase().split(/\s+/));
        }
        
        // Add description words
        if (doc.description) {
            keywords.push(...doc.description.toLowerCase().split(/\s+/));
        }
        
        // Add tags
        if (doc.tags && Array.isArray(doc.tags)) {
            keywords.push(...doc.tags.map(tag => tag.toLowerCase()));
        }
        
        // Add category name
        const category = this.getCategoryById(doc.category);
        if (category) {
            keywords.push(...category.name.toLowerCase().split(/\s+/));
        }
        
        return [...new Set(keywords)].join(' ');
    }

    /**
     * Validate if file path exists (basic check)
     * @param {string} path - File path
     * @returns {boolean} Whether file is likely available
     */
    validateFilePath(path) {
        // Basic validation - check if path looks valid
        return path && typeof path === 'string' && path.length > 0;
    }

    /**
     * Get all documents
     * @returns {Array} Array of document objects
     */
    getAllDocuments() {
        return [...this.documents];
    }

    /**
     * Get documents by category
     * @param {string} categoryId - Category ID
     * @returns {Array} Filtered documents
     */
    getDocumentsByCategory(categoryId) {
        if (categoryId === 'all') {
            return this.getAllDocuments();
        }
        
        const cacheKey = `category_${categoryId}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const filtered = this.documents.filter(doc => doc.category === categoryId);
        this.cache.set(cacheKey, filtered);
        
        return filtered;
    }

    /**
     * Get document by ID
     * @param {string} id - Document ID
     * @returns {Object|null} Document object or null
     */
    getDocumentById(id) {
        return this.documents.find(doc => doc.id === id) || null;
    }

    /**
     * Search documents by text
     * @param {string} searchText - Search query
     * @returns {Array} Matching documents
     */
    searchDocuments(searchText) {
        if (!searchText || searchText.trim().length === 0) {
            return this.getAllDocuments();
        }
        
        const query = searchText.toLowerCase().trim();
        const cacheKey = `search_${query}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const results = this.documents.filter(doc => {
            return doc.searchKeywords.includes(query) ||
                   doc.title.toLowerCase().includes(query) ||
                   doc.description.toLowerCase().includes(query);
        });
        
        this.cache.set(cacheKey, results);
        return results;
    }

    /**
     * Get featured documents
     * @returns {Array} Featured documents
     */
    getFeaturedDocuments() {
        const cacheKey = 'featured';
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const featured = this.documents.filter(doc => doc.featured === true);
        this.cache.set(cacheKey, featured);
        
        return featured;
    }

    /**
     * Get important documents
     * @returns {Array} Important documents
     */
    getImportantDocuments() {
        const cacheKey = 'important';
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        const important = this.documents.filter(doc => doc.important === true);
        this.cache.set(cacheKey, important);
        
        return important;
    }

    /**
     * Get all categories
     * @returns {Array} Array of category objects
     */
    getAllCategories() {
        return [...this.categories];
    }

    /**
     * Get category by ID
     * @param {string} id - Category ID
     * @returns {Object|null} Category object or null
     */
    getCategoryById(id) {
        return this.categories.find(cat => cat.id === id) || null;
    }

    /**
     * Get document count by category
     * @param {string} categoryId - Category ID
     * @returns {number} Document count
     */
    getDocumentCountByCategory(categoryId) {
        return this.getDocumentsByCategory(categoryId).length;
    }

    /**
     * Get statistics
     * @returns {Object} Statistics object
     */
    getStatistics() {
        return {
            totalDocuments: this.documents.length,
            totalCategories: this.categories.length,
            featuredDocuments: this.getFeaturedDocuments().length,
            importantDocuments: this.getImportantDocuments().length,
            categoryCounts: this.categories.reduce((acc, cat) => {
                acc[cat.id] = this.getDocumentCountByCategory(cat.id);
                return acc;
            }, {}),
            lastUpdated: this.metadata.lastUpdated,
            version: this.metadata.version
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Refresh data (reload from server)
     * @returns {Promise} Refresh promise
     */
    async refresh() {
        this.isLoaded = false;
        this.loadingPromise = null;
        this.clearCache();
        
        return this.loadDocuments();
    }

    /**
     * Check if data is loaded
     * @returns {boolean} Whether data is loaded
     */
    isDataLoaded() {
        return this.isLoaded;
    }

    /**
     * Get complete data structure
     * @returns {Object} Complete data with documents, categories, and metadata
     */
    getData() {
        return {
            documents: this.documents,
            categories: this.categories,
            metadata: this.metadata
        };
    }
} 