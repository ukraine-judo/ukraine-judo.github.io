/**
 * Coach SEO Manager - Динамічне управління SEO для сторінки тренера
 * Автоматично оновлює мета-теги, structured data та контент на основі даних тренера
 */

class CoachSEO {
    constructor() {
        this.defaultImage = 'https://motoshfq.github.io/assets/coaches/default-coach.jpg';
        this.siteUrl = 'https://motoshfq.github.io/';
        this.currentCoach = null;
        
        // Емодзі для різних категорій тренерів
        this.categoryEmoji = {
            'Головний тренер': '👨‍🏫',
            'Старший тренер': '🎯',
            'Тренер': '🥋',
            'Асистент тренера': '📋',
            'Тренер-консультант': '💡',
            'default': '🎯'
        };
        
        this.experienceEmoji = {
            '20+': '🏆',
            '15+': '⭐',
            '10+': '🌟',
            '5+': '📈',
            'default': '💪'
        };
    }

    /**
     * Генерує SEO-friendly title для тренера
     */
    generateTitle(coach) {
        if (!coach) return '🎯 Тренер збірної України з дзюдо | Профіль наставника ФДУ';
        
        const emoji = this.categoryEmoji[coach.position] || this.categoryEmoji.default;
        const position = coach.position ? ` | ${coach.position}` : '';
        const experience = coach.experience ? ` (${coach.experience} досвіду)` : '';
        
        return `${emoji} ${coach.name} - тренер збірної України з дзюдо${position}${experience} | ФДУ`;
    }

    /**
     * Генерує SEO-friendly description
     */
    generateDescription(coach) {
        if (!coach) return 'Офіційний профіль тренера національної збірної України з дзюдо: біографія, досвід, кар\'єрні досягнення та методики підготовки спортсменів ФДУ';
        
        let description = `Офіційний профіль ${coach.name} - тренера національної збірної України з дзюдо. `;
        
        if (coach.position) {
            description += `${coach.position} з досвідом роботи `;
        }
        
        if (coach.experience) {
            description += `${coach.experience}. `;
        }
        
        if (coach.education) {
            description += `Освіта: ${coach.education}. `;
        }
        
        if (coach.awards && coach.awards.length > 0) {
            const mainAward = coach.awards[0];
            description += `${mainAward.title}. `;
        }
        
        if (coach.titles && coach.titles.length > 0) {
            description += `Звання: ${coach.titles.join(', ')}. `;
        }
        
        description += 'Біографія, досвід та методики підготовки спортсменів на офіційному сайті ФДУ.';
        
        return description;
    }

    /**
     * Генерує keywords на основі даних тренера
     */
    generateKeywords(coach) {
        const baseKeywords = [
            'тренер дзюдо україна',
            'наставник фду',
            'тренерський штаб збірна',
            'методики дзюдо',
            'підготовка спортсменів',
            'олімпійський тренер україна'
        ];
        
        if (!coach) return baseKeywords.join(', ');
        
        const coachKeywords = [
            coach.name,
            `${coach.name} тренер`,
            `${coach.name} дзюдо`,
            `${coach.name} збірна україна`
        ];
        
        if (coach.position) {
            coachKeywords.push(`${coach.position.toLowerCase()} дзюдо`);
        }
        
        if (coach.titles && coach.titles.length > 0) {
            coach.titles.forEach(title => {
                if (title.includes('Заслужений')) {
                    coachKeywords.push('заслужений тренер україни');
                }
                if (title.includes('Майстер спорту')) {
                    coachKeywords.push('майстер спорту тренер');
                }
            });
        }
        
        if (coach.awards && coach.awards.length > 0) {
            coach.awards.slice(0, 3).forEach(award => {
                if (award.title.includes('Олімпійський')) {
                    coachKeywords.push('олімпійський тренер дзюдо');
                }
                if (award.title.includes('чемпіон світу')) {
                    coachKeywords.push('тренер чемпіона світу дзюдо');
                }
                if (award.title.includes('Заслужений тренер')) {
                    coachKeywords.push('заслужений тренер україни');
                }
            });
        }
        
        return [...baseKeywords, ...coachKeywords].join(', ');
    }

    /**
     * Оновлює всі мета-теги
     */
    updateMetaTags(coach) {
        if (!coach) return;
        
        this.currentCoach = coach;
        
        // Основні мета-теги
        const title = this.generateTitle(coach);
        const description = this.generateDescription(coach);
        const keywords = this.generateKeywords(coach);
        const imageUrl = coach.image || this.defaultImage;
        const pageUrl = `${this.siteUrl}coach.html?id=${coach.id || ''}`;
        
        // Оновлюємо title
        document.title = title;
        this.updateMetaTag('page-title', 'textContent', title);
        this.updateMetaTag('page-meta-title', 'content', title);
        
        // Оновлюємо description
        this.updateMetaTag('page-description', 'content', description);
        
        // Оновлюємо keywords
        this.updateMetaTag('page-keywords', 'content', keywords);
        
        // Оновлюємо canonical URL
        this.updateLinkTag('canonical-url', 'href', pageUrl);
        
        // Open Graph
        this.updateMetaTag('og-url', 'content', pageUrl);
        this.updateMetaTag('og-title', 'content', title);
        this.updateMetaTag('og-description', 'content', description);
        this.updateMetaTag('og-image', 'content', imageUrl);
        
        // Twitter Cards
        this.updateMetaTag('twitter-url', 'content', pageUrl);
        this.updateMetaTag('twitter-title', 'content', title);
        this.updateMetaTag('twitter-description', 'content', description);
        this.updateMetaTag('twitter-image', 'content', imageUrl);
        
        // Breadcrumb
        this.updateBreadcrumb(coach);
        
        // Structured Data
        this.updateStructuredData(coach);
    }

    /**
     * Оновлює мета-тег
     */
    updateMetaTag(id, attribute, value) {
        const element = document.getElementById(id);
        if (element) {
            if (attribute === 'textContent') {
                element.textContent = value;
            } else {
                element.setAttribute(attribute, value);
            }
        }
    }

    /**
     * Оновлює link тег
     */
    updateLinkTag(id, attribute, value) {
        const element = document.getElementById(id);
        if (element) {
            element.setAttribute(attribute, value);
        }
    }

    /**
     * Оновлює breadcrumb
     */
    updateBreadcrumb(coach) {
        const breadcrumbName = document.getElementById('breadcrumb-name');
        if (breadcrumbName && coach) {
            breadcrumbName.textContent = coach.name;
        }
    }

    /**
     * Оновлює structured data
     */
    updateStructuredData(coach) {
        this.updateCoachSchema(coach);
        this.updateBreadcrumbSchema(coach);
        this.updateProfilePageSchema(coach);
    }

    /**
     * Оновлює схему тренера
     */
    updateCoachSchema(coach) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": coach.name,
            "alternateName": coach.nameEn || coach.name,
            "jobTitle": coach.position || "Тренер з дзюдо",
            "description": this.generateDescription(coach),
            "url": `${this.siteUrl}coach.html?id=${coach.id || ''}`,
            "image": coach.image || this.defaultImage,
            "nationality": "Ukrainian",
            "worksFor": {
                "@type": "SportsOrganization",
                "name": "Федерація Дзюдо України",
                "url": this.siteUrl
            },
            "address": {
                "@type": "PostalAddress",
                "addressCountry": "UA"
            },
            "knowsAbout": ["Judo", "Sports Training", "Athletic Coaching"],
            "occupation": {
                "@type": "Occupation",
                "name": "Judo Coach"
            }
        };

        // Додаємо додаткові поля якщо є дані
        if (coach.birthDate) {
            schema.birthDate = coach.birthDate;
        }
        
        if (coach.city && coach.region) {
            schema.address.addressLocality = coach.city;
            schema.address.addressRegion = coach.region;
        }
        
        if (coach.education) {
            schema.alumniOf = {
                "@type": "EducationalOrganization",
                "name": coach.education
            };
        }

        if (coach.awards && coach.awards.length > 0) {
            schema.award = coach.awards.map(award => award.title);
        }

        if (coach.titles && coach.titles.length > 0) {
            schema.honorificSuffix = coach.titles;
        }

        if (coach.experience) {
            schema.hasOccupation = {
                "@type": "Occupation",
                "name": "Judo Coach",
                "description": `${coach.experience} досвіду`
            };
        }

        this.updateSchemaElement('coach-schema', schema);
    }

    /**
     * Оновлює breadcrumb схему
     */
    updateBreadcrumbSchema(coach) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Головна",
                    "item": this.siteUrl
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Збірна",
                    "item": `${this.siteUrl}team.html`
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": "Тренерський штаб",
                    "item": `${this.siteUrl}team.html#coaches`
                },
                {
                    "@type": "ListItem",
                    "position": 4,
                    "name": coach ? coach.name : "Тренер",
                    "item": `${this.siteUrl}coach.html${coach ? `?id=${coach.id}` : ''}`
                }
            ]
        };

        this.updateSchemaElement('breadcrumb-schema', schema);
    }

    /**
     * Оновлює ProfilePage схему
     */
    updateProfilePageSchema(coach) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "name": coach ? `Профіль ${coach.name}` : "Профіль тренера",
            "description": this.generateDescription(coach),
            "url": `${this.siteUrl}coach.html${coach ? `?id=${coach.id}` : ''}`,
            "mainEntity": {
                "@type": "Person",
                "name": coach ? coach.name : "Тренер ФДУ"
            },
            "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Головна",
                        "item": this.siteUrl
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Збірна",
                        "item": `${this.siteUrl}team.html`
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": "Тренерський штаб",
                        "item": `${this.siteUrl}team.html#coaches`
                    },
                    {
                        "@type": "ListItem",
                        "position": 4,
                        "name": coach ? coach.name : "Тренер",
                        "item": `${this.siteUrl}coach.html${coach ? `?id=${coach.id}` : ''}`
                    }
                ]
            },
            "inLanguage": "uk-UA"
        };

        this.updateSchemaElement('profile-page-schema', schema);
    }

    /**
     * Оновлює schema element
     */
    updateSchemaElement(id, schema) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = JSON.stringify(schema, null, 2);
        }
    }

    /**
     * Додає analytics tracking для переглядів профілю
     */
    trackCoachView(coach) {
        if (!coach) return;
        
        // Google Analytics 4 event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'coach_profile_view', {
                'coach_name': coach.name,
                'coach_id': coach.id,
                'position': coach.position,
                'experience': coach.experience
            });
        }
        
        // Facebook Pixel event
        if (typeof fbq !== 'undefined') {
            fbq('track', 'ViewContent', {
                'content_type': 'coach_profile',
                'content_ids': [coach.id],
                'content_name': coach.name
            });
        }
    }

    /**
     * Генерує structured data для досягнень тренера
     */
    generateAchievementsSchema(achievements) {
        if (!achievements || achievements.length === 0) return null;

        return achievements.map(achievement => ({
            "@type": "Achievement",
            "name": achievement.title,
            "description": achievement.description || achievement.title,
            "dateAwarded": achievement.year ? `${achievement.year}-01-01` : undefined,
            "award": {
                "@type": "Award",
                "name": achievement.title
            }
        }));
    }

    /**
     * Ініціалізація SEO для сторінки тренера
     */
    init(coach = null) {
        // Оновлюємо SEO дані якщо передано тренера
        if (coach) {
            this.updateMetaTags(coach);
            this.trackCoachView(coach);
        }
        
        // Відстежуємо зміни в URL параметрах
        window.addEventListener('popstate', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const coachId = urlParams.get('id');
            if (coachId && this.currentCoach && this.currentCoach.id !== coachId) {
                // Потрібно перезавантажити дані тренера
                this.loadCoachData(coachId);
            }
        });
    }

    /**
     * Завантажує дані тренера по ID (заглушка - має бути реалізовано в основному коді)
     */
    async loadCoachData(coachId) {
        // Це має бути реалізовано в основному коді сторінки
        console.log(`Loading coach data for ID: ${coachId}`);
    }
}

// Глобальний екземпляр
window.CoachSEO = new CoachSEO();

// Експорт для використання в інших модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoachSEO;
} 