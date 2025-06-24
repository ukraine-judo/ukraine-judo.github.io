/**
 * Athlete SEO Manager - Динамічне управління SEO для сторінки спортсмена
 * Автоматично оновлює мета-теги, structured data та контент на основі даних атлета
 */

class AthleteSEO {
    constructor() {
        this.defaultImage = 'https://ukraine-judo.github.io/assets/team/default-athlete.jpg';
        this.siteUrl = 'https://ukraine-judo.github.io/';
        this.currentAthlete = null;
        
        // Емодзі для різних категорій атлетів
        this.genderEmoji = {
            'М': '👨‍🥋',
            'Ч': '👨‍🥋', 
            'Ж': '👩‍🥋',
            'default': '🥋'
        };
        
        this.statusEmoji = {
            'Олімпійський чемпіон': '🥇',
            'Чемпіон світу': '🌍',
            'Чемпіон Європи': '🇪🇺',
            'Призер Олімпіади': '🥈',
            'Призер ЧС': '🥉',
            'Основний склад': '⭐',
            'Резерв': '🔄',
            'Молодіжна збірна': '🌟',
            'default': '🥋'
        };
    }

    /**
     * Генерує SEO-friendly title для атлета
     */
    generateTitle(athlete) {
        if (!athlete) return '🥋 Спортсмен національної збірної України з дзюдо | Профіль атлета ФДУ';
        
        const emoji = this.genderEmoji[athlete.gender] || this.genderEmoji.default;
        const status = athlete.status ? ` | ${athlete.status}` : '';
        const weight = athlete.weight ? ` (${athlete.weight} кг)` : '';
        
        return `${emoji} ${athlete.name} - дзюдоїст збірної України${weight}${status} | ФДУ`;
    }

    /**
     * Генерує SEO-friendly description
     */
    generateDescription(athlete) {
        if (!athlete) return 'Офіційний профіль спортсмена національної збірної України з дзюдо: біографія, досягнення, статистика змагань та особиста інформація атлета ФДУ';
        
        let description = `Офіційний профіль ${athlete.name} - спортсмена національної збірної України з дзюдо. `;
        
        if (athlete.achievements && athlete.achievements.length > 0) {
            const mainAchievement = athlete.achievements[0];
            description += `${mainAchievement.title} ${mainAchievement.year || ''}. `;
        }
        
        if (athlete.weight) {
            description += `Вагова категорія: ${athlete.weight} кг. `;
        }
        
        if (athlete.region) {
            description += `Регіон: ${athlete.region}. `;
        }
        
        if (athlete.club) {
            description += `Клуб: ${athlete.club}. `;
        }
        
        description += 'Біографія, досягнення та статистика змагань на офіційному сайті ФДУ.';
        
        return description;
    }

    /**
     * Генерує keywords на основі даних атлета
     */
    generateKeywords(athlete) {
        const baseKeywords = [
            'дзюдо україна',
            'спортсмен фду',
            'національна збірна дзюдо',
            'біографія дзюдоїст',
            'досягнення спортсмена',
            'українське дзюдо'
        ];
        
        if (!athlete) return baseKeywords.join(', ');
        
        const athleteKeywords = [
            athlete.name,
            `${athlete.name} дзюдо`,
            `${athlete.name} збірна україна`
        ];
        
        if (athlete.weight) {
            athleteKeywords.push(`дзюдо ${athlete.weight} кг`);
        }
        
        if (athlete.region) {
            athleteKeywords.push(`дзюдо ${athlete.region}`);
        }
        
        if (athlete.achievements && athlete.achievements.length > 0) {
            athlete.achievements.slice(0, 3).forEach(achievement => {
                if (achievement.title.includes('Олімпіада')) {
                    athleteKeywords.push('олімпійці україна дзюдо');
                }
                if (achievement.title.includes('Чемпіон світу')) {
                    athleteKeywords.push('чемпіон світу дзюдо україна');
                }
                if (achievement.title.includes('Чемпіон Європи')) {
                    athleteKeywords.push('чемпіон європи дзюдо');
                }
            });
        }
        
        return [...baseKeywords, ...athleteKeywords].join(', ');
    }

    /**
     * Оновлює всі мета-теги
     */
    updateMetaTags(athlete) {
        if (!athlete) return;
        
        this.currentAthlete = athlete;
        
        // Основні мета-теги
        const title = this.generateTitle(athlete);
        const description = this.generateDescription(athlete);
        const keywords = this.generateKeywords(athlete);
        const imageUrl = athlete.image || this.defaultImage;
        const pageUrl = `${this.siteUrl}athlete.html?id=${athlete.id || ''}`;
        
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
        this.updateBreadcrumb(athlete);
        
        // Structured Data
        this.updateStructuredData(athlete);
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
    updateBreadcrumb(athlete) {
        const breadcrumbName = document.getElementById('breadcrumb-name');
        if (breadcrumbName && athlete) {
            breadcrumbName.textContent = athlete.name;
        }
    }

    /**
     * Оновлює structured data
     */
    updateStructuredData(athlete) {
        this.updateAthleteSchema(athlete);
        this.updateBreadcrumbSchema(athlete);
        this.updateProfilePageSchema(athlete);
    }

    /**
     * Оновлює схему спортсмена
     */
    updateAthleteSchema(athlete) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "Person",
            "name": athlete.name,
            "alternateName": athlete.nameEn || athlete.name,
            "jobTitle": "Професійний дзюдоїст",
            "description": this.generateDescription(athlete),
            "url": `${this.siteUrl}athlete.html?id=${athlete.id || ''}`,
            "image": athlete.image || this.defaultImage,
            "nationality": "Ukrainian",
            "sport": "Judo",
            "memberOf": {
                "@type": "SportsTeam",
                "name": "Національна збірна України з дзюдо",
                "parentOrganization": {
                    "@type": "SportsOrganization",
                    "name": "Федерація Дзюдо України",
                    "url": this.siteUrl
                }
            },
            "address": {
                "@type": "PostalAddress",
                "addressCountry": "UA"
            },
            "sponsor": {
                "@type": "SportsOrganization",
                "name": "Федерація Дзюдо України"
            }
        };

        // Додаємо додаткові поля якщо є дані
        if (athlete.birthDate) {
            schema.birthDate = athlete.birthDate;
        }
        
        if (athlete.birthPlace) {
            schema.birthPlace = {
                "@type": "Place",
                "name": athlete.birthPlace
            };
        }
        
        if (athlete.height) {
            schema.height = `${athlete.height} см`;
        }
        
        if (athlete.weight) {
            schema.weight = `${athlete.weight} кг`;
        }

        if (athlete.achievements && athlete.achievements.length > 0) {
            schema.award = athlete.achievements.map(achievement => achievement.title);
        }

        if (athlete.coach) {
            schema.coach = {
                "@type": "Person",
                "name": athlete.coach,
                "jobTitle": "Тренер з дзюдо"
            };
        }

        if (athlete.club) {
            schema.affiliation = {
                "@type": "SportsOrganization",
                "name": athlete.club
            };
        }

        this.updateSchemaElement('athlete-schema', schema);
    }

    /**
     * Оновлює breadcrumb схему
     */
    updateBreadcrumbSchema(athlete) {
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
                    "name": athlete ? athlete.name : "Спортсмен",
                    "item": `${this.siteUrl}athlete.html${athlete ? `?id=${athlete.id}` : ''}`
                }
            ]
        };

        this.updateSchemaElement('breadcrumb-schema', schema);
    }

    /**
     * Оновлює ProfilePage схему
     */
    updateProfilePageSchema(athlete) {
        const schema = {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "name": athlete ? `Профіль ${athlete.name}` : "Профіль спортсмена",
            "description": this.generateDescription(athlete),
            "url": `${this.siteUrl}athlete.html${athlete ? `?id=${athlete.id}` : ''}`,
            "mainEntity": {
                "@type": "Person",
                "name": athlete ? athlete.name : "Спортсмен ФДУ"
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
                        "name": athlete ? athlete.name : "Спортсмен",
                        "item": `${this.siteUrl}athlete.html${athlete ? `?id=${athlete.id}` : ''}`
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
    trackAthleteView(athlete) {
        if (!athlete) return;
        
        // Google Analytics 4 event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'athlete_profile_view', {
                'athlete_name': athlete.name,
                'athlete_id': athlete.id,
                'weight_category': athlete.weight,
                'region': athlete.region,
                'team_status': athlete.status
            });
        }
        
        // Facebook Pixel event
        if (typeof fbq !== 'undefined') {
            fbq('track', 'ViewContent', {
                'content_type': 'athlete_profile',
                'content_ids': [athlete.id],
                'content_name': athlete.name
            });
        }
    }

    /**
     * Генерує structured data для досягнень атлета
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
     * Ініціалізація SEO для сторінки атлета
     */
    init(athlete = null) {
        // Оновлюємо SEO дані якщо передано атлета
        if (athlete) {
            this.updateMetaTags(athlete);
            this.trackAthleteView(athlete);
        }
        
        // Відстежуємо зміни в URL параметрах
        window.addEventListener('popstate', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const athleteId = urlParams.get('id');
            if (athleteId && this.currentAthlete && this.currentAthlete.id !== athleteId) {
                // Потрібно перезавантажити дані атлета
                this.loadAthleteData(athleteId);
            }
        });
    }

    /**
     * Завантажує дані атлета по ID (заглушка - має бути реалізовано в основному коді)
     */
    async loadAthleteData(athleteId) {
        // Це має бути реалізовано в основному коді сторінки
        console.log(`Loading athlete data for ID: ${athleteId}`);
    }
}

// Глобальний екземпляр
window.AthleteSEO = new AthleteSEO();

// Експорт для використання в інших модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AthleteSEO;
} 