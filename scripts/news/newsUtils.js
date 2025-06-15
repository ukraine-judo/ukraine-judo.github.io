// News Utilities - Minimal helper functions (legacy support)
class NewsUtils {
    
    // Date formatting utilities
    static formatDate(dateString, format = 'full') {
        const date = new Date(dateString);
        const months = [
            'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
            'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'
        ];
        
        const shortMonths = [
            'січ', 'лют', 'бер', 'кві', 'тра', 'чер',
            'лип', 'сер', 'вер', 'жов', 'лис', 'гру'
        ];

        switch (format) {
            case 'short':
                return `${date.getDate()} ${shortMonths[date.getMonth()]}`;
            case 'medium':
                return `${date.getDate()} ${shortMonths[date.getMonth()]} ${date.getFullYear()}`;
            case 'full':
            default:
                return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
        }
    }

    // Time ago formatting
    static timeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        const intervals = {
            'рік': 31536000,
            'місяць': 2592000,
            'тиждень': 604800,
            'день': 86400,
            'година': 3600,
            'хвилина': 60
        };

        for (let [unit, seconds] of Object.entries(intervals)) {
            const interval = Math.floor(diffInSeconds / seconds);
            if (interval >= 1) {
                return `${interval} ${this.pluralize(interval, unit)} тому`;
            }
        }

        return 'щойно';
    }

    // Ukrainian pluralization
    static pluralize(count, word) {
        const pluralRules = {
            'рік': ['рік', 'роки', 'років'],
            'місяць': ['місяць', 'місяці', 'місяців'],
            'тиждень': ['тиждень', 'тижні', 'тижнів'],
            'день': ['день', 'дні', 'днів'],
            'година': ['година', 'години', 'годин'],
            'хвилина': ['хвилина', 'хвилини', 'хвилин']
        };

        const forms = pluralRules[word];
        if (!forms) return word;

        if (count % 10 === 1 && count % 100 !== 11) {
            return forms[0];
        } else if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
            return forms[1];
        } else {
            return forms[2];
        }
    }

    // Category utilities
    static getCategoryInfo(category) {
        const categories = {
            'achievements': {
                name: 'Досягнення',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"/></svg>',
                color: '#28a745',
                description: 'Перемоги та досягнення українських дзюдоїстів'
            },
            'competitions': {
                name: 'Змагання',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
                color: '#007bff',
                description: 'Турніри, чемпіонати та спортивні події'
            },
            'events': {
                name: 'Події',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
                color: '#6f42c1',
                description: 'Семінари, тренування та організаційні заходи'
            },
            'announcements': {
                name: 'Анонси',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',
                color: '#fd7e14',
                description: 'Оголошення та майбутні події'
            }
        };

        return categories[category] || {
            name: 'Новини',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>',
            color: '#6c757d',
            description: 'Загальні новини'
        };
    }

    // Text utilities
    static truncateText(text, maxLength = 150) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength).trim() + '...';
    }

    static stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    static highlightSearchTerm(text, searchTerm) {
        if (!searchTerm) return text;
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    // URL utilities
    static createNewsUrl(newsId, title) {
        const slug = title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();
        return `news/${newsId}/${slug}`;
    }

    static shareNews(news, platform) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(news.title);
        const text = encodeURIComponent(news.excerpt);

        const shareUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
            telegram: `https://t.me/share/url?url=${url}&text=${title}`,
            viber: `viber://forward?text=${title} ${url}`,
            email: `mailto:?subject=${title}&body=${text} ${url}`
        };

        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    }

    // Local storage utilities
    static saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    static getFromLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    // Reading progress utilities
    static calculateReadingTime(content) {
        const wordsPerMinute = 200;
        const text = this.stripHtml(content);
        const wordCount = text.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / wordsPerMinute);
        return readingTime;
    }

    static formatReadingTime(minutes) {
        if (minutes === 1) {
            return '1 хвилина читання';
        } else if (minutes < 5) {
            return `${minutes} хвилини читання`;
        } else {
            return `${minutes} хвилин читання`;
        }
    }

    // Search utilities
    static createSearchIndex(newsArray) {
        return newsArray.map(news => ({
            id: news.id,
            searchText: [
                news.title,
                news.excerpt,
                news.content,
                news.author,
                ...news.tags
            ].join(' ').toLowerCase()
        }));
    }

    static searchNews(newsArray, query, searchIndex = null) {
        if (!query) return newsArray;

        const searchTerm = query.toLowerCase();
        
        if (searchIndex) {
            const matchingIds = searchIndex
                .filter(item => item.searchText.includes(searchTerm))
                .map(item => item.id);
            
            return newsArray.filter(news => matchingIds.includes(news.id));
        }

        return newsArray.filter(news => 
            news.title.toLowerCase().includes(searchTerm) ||
            news.excerpt.toLowerCase().includes(searchTerm) ||
            news.content.toLowerCase().includes(searchTerm) ||
            news.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }



    // Validation utilities
    static validateNewsData(news) {
        const required = ['id', 'title', 'excerpt', 'content', 'category', 'date'];
        const missing = required.filter(field => !news[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        if (new Date(news.date) > new Date()) {
            console.warn(`News ${news.id} has future date: ${news.date}`);
        }

        return true;
    }

    // Performance utilities
    static debounce(func, wait) {
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

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsUtils;
} 