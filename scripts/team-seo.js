/**
 * Team Page SEO Enhancement
 * Улучшение SEO функциональности страницы команды
 */

class TeamSEO {
    constructor() {
        this.athletes = [];
        this.coaches = [];
        this.currentFilters = {
            gender: 'all',
            age: 'all', 
            weight: 'all',
            status: 'all'
        };
        
        this.init();
    }

    init() {
        // Обновляем мета-теги при фильтрации
        this.setupFilterListeners();
        
        // Обновляем заголовки страницы при поиске
        this.setupSearchListeners();
        
        // Добавляем динамические микроданные
        this.setupDynamicSchema();
        
        // Отслеживаем взаимодействие для аналитики
        this.setupAnalytics();
    }

    setupFilterListeners() {
        // Фильтры по полу
        document.querySelectorAll('.team-category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.updateFilters('gender', category);
                this.updatePageTitle();
                this.updateMetaDescription();
            });
        });

        // Фильтры по возрасту
        document.querySelectorAll('.team-age-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const age = e.target.dataset.age;
                this.updateFilters('age', age);
                this.updatePageTitle();
            });
        });

        // Фильтры по статусу
        document.querySelectorAll('.team-status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const status = e.target.dataset.status;
                this.updateFilters('status', status);
                this.updatePageTitle();
            });
        });
    }

    setupSearchListeners() {
        const searchInput = document.querySelector('.enhanced-search-input');
        if (searchInput) {
            let debounceTimer;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    const query = e.target.value.trim();
                    this.handleSearch(query);
                }, 300);
            });
        }
    }

    updateFilters(type, value) {
        this.currentFilters[type] = value;
        
        // Обновляем URL без перезагрузки для SEO
        this.updateURL();
    }

    updatePageTitle() {
        const filters = this.currentFilters;
        let titleParts = ['Національна збірна України з дзюдо'];
        
        // Добавляем фильтры в заголовок
        if (filters.gender !== 'all') {
            if (filters.gender === 'men') titleParts.push('Чоловіча команда');
            else if (filters.gender === 'women') titleParts.push('Жіноча команда');
        }
        
        if (filters.age !== 'all') {
            const ageLabels = {
                'u17': 'до 17 років',
                'u18': 'до 18 років', 
                'u21': 'до 21 року',
                'u23': 'до 23 років',
                'senior': 'дорослі'
            };
            titleParts.push(ageLabels[filters.age]);
        }
        
        if (filters.status !== 'all') {
            if (filters.status === 'main') titleParts.push('основний склад');
            else if (filters.status === 'reserve') titleParts.push('резерв');
        }
        
        titleParts.push('ФДУ 2025');
        
        const newTitle = titleParts.join(' | ');
        document.title = newTitle;
        
        // Обновляем Open Graph title
        this.updateOpenGraphTitle(newTitle);
    }

    updateMetaDescription() {
        const filters = this.currentFilters;
        let description = 'Склад національної збірної України з дзюдо 2025: ';
        
        if (filters.gender === 'men') {
            description += 'чоловіча команда - ';
        } else if (filters.gender === 'women') {
            description += 'жіноча команда - ';
        }
        
        description += 'спортсмени, тренери, статистика та досягнення. ';
        
        // Добавляем имена топ-спортсменов для SEO
        const topAthletes = ['Дарія Білодід', 'Георгій Зантарая', 'Яків Хаммо'];
        description += topAthletes.join(', ') + ' та інші зірки українського дзюдо.';
        
        this.updateMetaTag('description', description);
    }

    handleSearch(query) {
        if (query.length > 0) {
            // Обновляем заголовок при поиске
            document.title = `Пошук "${query}" | Національна збірна України з дзюдо`;
            
            // Добавляем поисковый запрос в микроданные
            this.updateSearchSchema(query);
        } else {
            this.updatePageTitle();
        }
        
        // Отслеживаем поисковые запросы для SEO аналитики
        this.trackSearch(query);
    }

    updateURL() {
        const filters = this.currentFilters;
        const params = new URLSearchParams();
        
        Object.keys(filters).forEach(key => {
            if (filters[key] !== 'all') {
                params.set(key, filters[key]);
            }
        });
        
        const newURL = params.toString() ? 
            `${window.location.pathname}?${params.toString()}` : 
            window.location.pathname;
            
        window.history.replaceState({}, '', newURL);
    }

    updateOpenGraphTitle(title) {
        let ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) {
            ogTitle.setAttribute('content', title);
        }
    }

    updateMetaTag(name, content) {
        let metaTag = document.querySelector(`meta[name="${name}"]`);
        if (metaTag) {
            metaTag.setAttribute('content', content);
        }
    }

    setupDynamicSchema() {
        // Обновляем schema.org данные при изменении контента
        this.updateTeamSchema();
    }

    updateSearchSchema(query) {
        // Добавляем schema для поискового запроса
        const searchSchema = {
            "@context": "https://schema.org",
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": `https://ukraine-judo.github.io/team.html?search=${query}`
            },
            "query-input": {
                "@type": "PropertyValueSpecification",
                "valueRequired": true,
                "valueName": "search"
            }
        };
        
        this.addSchemaScript('search-schema', searchSchema);
    }

    updateTeamSchema() {
        // Обновляем основную schema команды с актуальными данными
        const teamSchema = {
            "@context": "https://schema.org",
            "@type": "SportsTeam",
            "name": "Національна збірна України з дзюдо",
            "numberOfMembers": this.athletes.length,
            "sport": "Judo",
            "memberOf": {
                "@type": "SportsOrganization",
                "name": "Федерація Дзюдо України"
            }
        };
        
        this.addSchemaScript('team-dynamic-schema', teamSchema);
    }

    addSchemaScript(id, schema) {
        // Удаляем предыдущую schema если есть
        const existingScript = document.getElementById(id);
        if (existingScript) {
            existingScript.remove();
        }
        
        // Добавляем новую schema
        const script = document.createElement('script');
        script.id = id;
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema, null, 2);
        document.head.appendChild(script);
    }

    setupAnalytics() {
        // Отслеживаем взаимодействия для SEO аналитики
        this.trackPageView();
        this.trackFilters();
    }

    trackPageView() {
        // Отправляем информацию о просмотре страницы
        if (typeof gtag !== 'undefined') {
            gtag('event', 'page_view', {
                page_title: document.title,
                page_location: window.location.href,
                content_group1: 'Team Page'
            });
        }
    }

    trackFilters() {
        // Отслеживаем использование фильтров
        document.addEventListener('click', (e) => {
            if (e.target.matches('.team-category-btn, .team-age-btn, .team-status-btn')) {
                const filterType = e.target.closest('.filter-group').querySelector('.filter-label').textContent;
                const filterValue = e.target.textContent.trim();
                
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'filter_use', {
                        event_category: 'Team Filters',
                        event_label: `${filterType}: ${filterValue}`,
                        value: 1
                    });
                }
            }
        });
    }

    trackSearch(query) {
        if (query && typeof gtag !== 'undefined') {
            gtag('event', 'search', {
                search_term: query,
                content_group1: 'Team Search'
            });
        }
    }

    // Загрузка начальных параметров из URL
    loadFiltersFromURL() {
        const params = new URLSearchParams(window.location.search);
        
        params.forEach((value, key) => {
            if (this.currentFilters.hasOwnProperty(key)) {
                this.currentFilters[key] = value;
                
                // Активируем соответствующие кнопки фильтров
                this.activateFilterButton(key, value);
            }
        });
        
        // Обновляем заголовок согласно фильтрам из URL
        this.updatePageTitle();
        this.updateMetaDescription();
    }

    activateFilterButton(filterType, value) {
        const selectors = {
            'gender': `.team-category-btn[data-category="${value}"]`,
            'age': `.team-age-btn[data-age="${value}"]`,
            'status': `.team-status-btn[data-status="${value}"]`
        };
        
        const selector = selectors[filterType];
        if (selector) {
            const button = document.querySelector(selector);
            if (button) {
                // Убираем active класс с других кнопок той же группы
                const group = button.closest('.filter-group');
                group.querySelectorAll('.active').forEach(btn => btn.classList.remove('active'));
                
                // Добавляем active класс к текущей кнопке
                button.classList.add('active');
            }
        }
    }
}

// Инициализация SEO функций после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    const teamSEO = new TeamSEO();
    
    // Загружаем фильтры из URL при первой загрузке
    teamSEO.loadFiltersFromURL();
    
    // Экспортируем в глобальную область для возможности использования в других скриптах
    window.TeamSEO = teamSEO;
});

// Обновление meta-тегов при изменении URL (для SPA навигации)
window.addEventListener('popstate', () => {
    if (window.TeamSEO) {
        window.TeamSEO.loadFiltersFromURL();
    }
}); 