/**
 * ArticleSEO - Класс для управления SEO мета-тегами статьи новостей
 * Динамически обновляет meta-теги, Open Graph, Twitter Cards и JSON-LD данные
 */
class ArticleSEO {
    constructor() {
        this.baseUrl = 'https://ukraine-judo.github.io/';
        this.defaultImage = 'assets/fju-logo.png';
        this.organizationName = 'Федерація Дзюдо України';
        this.organizationLogo = 'assets/fju-logo.png';
    }

    /**
     * Обновить все SEO мета-теги для статьи
     * @param {Object} article - Объект статьи с данными
     */
    updateArticleSEO(article) {
        if (!article) {
            console.error('ArticleSEO: article data is required');
            return;
        }

        try {
            // Подготовить данные
            const articleData = this.prepareArticleData(article);
            
            // Обновить базовые мета-теги
            this.updateBasicMetaTags(articleData);
            
            // Обновить Open Graph
            this.updateOpenGraphTags(articleData);
            
            // Обновить Twitter Cards
            this.updateTwitterTags(articleData);
            
            // Обновить JSON-LD structured data
            this.updateStructuredData(articleData);
            
            // Обновить breadcrumbs
            this.updateBreadcrumbs(articleData);
            
            // Обновить canonical URL
            this.updateCanonicalUrl(articleData);
            
            console.log('ArticleSEO: Successfully updated all meta tags');
        } catch (error) {
            console.error('ArticleSEO: Error updating meta tags:', error);
        }
    }

    /**
     * Подготовить данные статьи
     */
    prepareArticleData(article) {
        const url = this.getCurrentArticleUrl();
        const imageUrl = this.getFullImageUrl(article.image);
        const publishDate = this.formatDate(article.date);
        const modifiedDate = article.modifiedDate ? this.formatDate(article.modifiedDate) : publishDate;
        
        // Создать SEO-оптимизированный title
        const seoTitle = this.createSEOTitle(article.title, article.category);
        
        // Создать SEO-оптимизированное description
        const seoDescription = this.createSEODescription(article.excerpt || article.title, article.category);
        
        // Подготовить keywords
        const keywords = this.createKeywords(article);

        return {
            ...article,
            url,
            imageUrl,
            publishDate,
            modifiedDate,
            seoTitle,
            seoDescription,
            keywords
        };
    }

    /**
     * Создать SEO-оптимизированный заголовок
     */
    createSEOTitle(title, category) {
        const emoji = this.getCategoryEmoji(category);
        const shortTitle = title.length > 50 ? title.substring(0, 50) + '...' : title;
        return `${emoji} ${shortTitle} | Дзюдо України ФДУ`;
    }

    /**
     * Создать SEO-оптимизированное описание
     */
    createSEODescription(text, category) {
        const emoji = this.getCategoryEmoji(category);
        const cleanText = text.replace(/<[^>]*>/g, '').substring(0, 120);
        return `${emoji} ${cleanText}. Офіційні новини Федерації Дзюдо України, результати змагань та досягнення українських дзюдоїстів.`;
    }

    /**
     * Получить эмодзи для категории
     */
    getCategoryEmoji(category) {
        const emojiMap = {
            'achievements': '🏆',
            'competitions': '🥇',
            'events': '📅',
            'announcements': '📢',
            'general': '📰'
        };
        return emojiMap[category] || '📰';
    }

    /**
     * Создать keywords на основе статьи
     */
    createKeywords(article) {
        const baseKeywords = [
            'дзюдо україна',
            'федерація дзюдо україни',
            'фду',
            'новини дзюдо',
            'українське дзюдо'
        ];

        // Добавить keywords на основе категории
        const categoryKeywords = this.getCategoryKeywords(article.category);
        
        // Добавить теги статьи если есть
        const articleTags = article.tags ? article.tags.map(tag => tag.toLowerCase()) : [];
        
        return [...baseKeywords, ...categoryKeywords, ...articleTags].slice(0, 15).join(', ');
    }

    /**
     * Получить keywords для категории
     */
    getCategoryKeywords(category) {
        const categoryMap = {
            'achievements': ['досягнення', 'перемоги', 'нагороди', 'медалі'],
            'competitions': ['змагання', 'чемпіонат', 'турнір', 'результати'],
            'events': ['події', 'календар', 'анонс'],
            'announcements': ['оголошення', 'новини', 'інформація']
        };
        return categoryMap[category] || ['новини'];
    }

    /**
     * Обновить базовые мета-теги
     */
    updateBasicMetaTags(article) {
        // Title
        document.title = article.seoTitle;
        this.updateMetaTag('meta-title', 'content', article.seoTitle);
        
        // Description
        this.updateMetaTag('meta-description', 'content', article.seoDescription);
        
        // Keywords
        this.updateMetaTag('meta-keywords', 'content', article.keywords);
        
        // Author
        this.updateMetaTag('meta-author', 'content', this.organizationName);
        
        // Publish date
        this.updateMetaTag('meta-publish-date', 'content', article.publishDate);
        this.updateMetaTag('meta-article-published', 'content', article.publishDate);
        this.updateMetaTag('meta-article-modified', 'content', article.modifiedDate);
        
        // Article tags
        this.updateMetaTag('meta-article-tags', 'content', article.keywords);
    }

    /**
     * Обновить Open Graph теги
     */
    updateOpenGraphTags(article) {
        this.updateMetaTag('og-url', 'content', article.url);
        this.updateMetaTag('og-title', 'content', article.seoTitle);
        this.updateMetaTag('og-description', 'content', article.seoDescription);
        this.updateMetaTag('og-image', 'content', article.imageUrl);
        this.updateMetaTag('og-article-author', 'content', this.organizationName);
    }

    /**
     * Обновить Twitter теги
     */
    updateTwitterTags(article) {
        this.updateMetaTag('twitter-url', 'content', article.url);
        this.updateMetaTag('twitter-title', 'content', article.title);
        this.updateMetaTag('twitter-description', 'content', article.seoDescription);
        this.updateMetaTag('twitter-image', 'content', article.imageUrl);
    }

    /**
     * Обновить JSON-LD structured data
     */
    updateStructuredData(article) {
        // Article structured data
        const articleSchema = {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": article.title,
            "description": article.seoDescription,
            "image": {
                "@type": "ImageObject",
                "url": article.imageUrl,
                "width": 1200,
                "height": 630
            },
            "author": {
                "@type": "Organization",
                "name": this.organizationName,
                "url": this.baseUrl
            },
            "publisher": {
                "@type": "Organization",
                "name": this.organizationName,
                "logo": {
                    "@type": "ImageObject",
                    "url": this.baseUrl + this.organizationLogo,
                    "width": 300,
                    "height": 300
                }
            },
            "datePublished": article.publishDate,
            "dateModified": article.modifiedDate,
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": article.url
            },
            "inLanguage": "uk-UA",
            "about": {
                "@type": "Thing",
                "name": "Дзюдо",
                "sameAs": "https://en.wikipedia.org/wiki/Judo"
            },
            "keywords": article.keywords,
            "articleSection": article.category || "Спорт",
            "wordCount": this.calculateWordCount(article.content),
            "articleBody": this.getCleanText(article.content)
        };

        this.updateJSONLD('article-structured-data', articleSchema);
    }

    /**
     * Обновить breadcrumbs
     */
    updateBreadcrumbs(article) {
        // Обновить видимый breadcrumb
        const breadcrumbTitle = document.getElementById('breadcrumb-title');
        if (breadcrumbTitle) {
            breadcrumbTitle.textContent = article.title;
        }

        // Обновить JSON-LD breadcrumbs
        const breadcrumbSchema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Головна",
                    "item": this.baseUrl
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Новини",
                    "item": this.baseUrl + "news.html"
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": article.title,
                    "item": article.url
                }
            ]
        };

        this.updateJSONLD('breadcrumb-structured-data', breadcrumbSchema);
    }

    /**
     * Обновить canonical URL
     */
    updateCanonicalUrl(article) {
        this.updateLinkTag('canonical-url', 'href', article.url);
        this.updateLinkTag('hreflang-uk', 'href', article.url);
        this.updateLinkTag('hreflang-default', 'href', article.url);
    }

    /**
     * Утилиты
     */
    
    updateMetaTag(id, attribute, value) {
        const element = document.getElementById(id);
        if (element) {
            element.setAttribute(attribute, value);
        }
    }

    updateLinkTag(id, attribute, value) {
        const element = document.getElementById(id);
        if (element) {
            element.setAttribute(attribute, value);
        }
    }

    updateJSONLD(id, schema) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = JSON.stringify(schema, null, 2);
        }
    }

    getCurrentArticleUrl() {
        return window.location.href;
    }

    getFullImageUrl(imagePath) {
        if (!imagePath) return this.baseUrl + this.defaultImage;
        if (imagePath.startsWith('http')) return imagePath;
        return this.baseUrl + imagePath.replace(/^\//, '');
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toISOString();
        } catch (error) {
            return new Date().toISOString();
        }
    }

    calculateWordCount(content) {
        if (!content) return 0;
        const cleanText = this.getCleanText(content);
        return cleanText.split(/\s+/).filter(word => word.length > 0).length;
    }

    getCleanText(html) {
        if (!html) return '';
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    }

    /**
     * Обновить изображение статьи с правильными атрибутами
     */
    updateArticleImage(article) {
        const img = document.getElementById('article-image');
        const imgContainer = img?.parentElement;
        
        if (img && article.image) {
            img.src = this.getFullImageUrl(article.image);
            img.alt = `Фото до новини: ${article.title} - Федерація Дзюдо України`;
            
            // Обновить schema для изображения
            if (imgContainer) {
                const captionMeta = imgContainer.querySelector('meta[itemprop="caption"]');
                if (captionMeta) {
                    captionMeta.setAttribute('content', article.title);
                }
            }
        }
    }

    /**
     * Обновить мета-данные в скрытых элементах
     */
    updateHiddenMetaData(article) {
        // Обновить description meta
        const descMeta = document.getElementById('article-description-meta');
        if (descMeta) {
            descMeta.setAttribute('content', article.seoDescription);
        }

        // Обновить date modified
        const dateModified = document.getElementById('article-date-modified');
        if (dateModified) {
            dateModified.setAttribute('content', article.modifiedDate);
        }

        // Обновить mainEntityOfPage
        const mainEntity = document.querySelector('meta[itemprop="mainEntityOfPage"]');
        if (mainEntity) {
            mainEntity.setAttribute('content', article.url);
        }
    }

    /**
     * Публичный метод для полного обновления страницы статьи
     */
    updateFullArticlePage(article) {
        this.updateArticleSEO(article);
        this.updateArticleImage(article);
        this.updateHiddenMetaData(article);
    }
}

// Экспорт для использования в других скриптах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArticleSEO;
} else if (typeof window !== 'undefined') {
    window.ArticleSEO = ArticleSEO;
} 