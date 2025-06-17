// Regions Page JavaScript - Backend refactored to use JSON data

class RegionsManager {
    constructor() {
        this.regionsData = {};
        this.currentFilter = 'all';
        this.selectedRegion = null;
        this.mapContainer = null;
        
        // Map SVG IDs to region data keys
        this.svgToRegionMap = {
            'chernigov': 'chernigov',
            'kiev': 'kiev',
            'kievskya': 'kievskya', 
            'volun': 'volun',
            'rivne': 'rivne',
            'zhytomir': 'zhytomir',
            'lviv': 'lviv',
            'ternopil': 'ternopil',
            'kharkiv': 'kharkiv',
            'donetsk': 'donetsk',
            'cherkassy': 'cherkassy',
            'vinnitsya': 'vinnitsya',
            'kirovograd': 'kirovograd',
            'poltava': 'poltava',
            'sumy': 'sumy',
            'odessa': 'odessa',
            'mykolaiv': 'mykolaiv',
            'kherson': 'kherson'
        };
    }

    async init() {
        try {
            await this.loadRegionsData();
            await this.loadUkraineSVG();
            this.setupMapInteractions();
            this.renderRegionsGrid();
            this.setupEventListeners();
            this.calculateAndUpdateStats();
        } catch (error) {
            console.error('Failed to initialize regions:', error);
        }
    }

    async loadRegionsData() {
        const jsonFiles = [
            'scripts/regions/kyiv.json',
            'scripts/regions/kharkiv.json', 
            'scripts/regions/donetsk.json',
            'scripts/regions/western.json',
            'scripts/regions/central.json',
            'scripts/regions/northern.json',
            'scripts/regions/southern.json'
        ];

        try {
            const responses = await Promise.all(
                jsonFiles.map(file => fetch(file).then(res => res.json()))
            );
            
            // Merge all regions data
            responses.forEach(data => {
                Object.assign(this.regionsData, data);
            });
            
            console.log('Loaded regions data:', Object.keys(this.regionsData));
        } catch (error) {
            console.error('Error loading regions data:', error);
            this.regionsData = {}; // fallback to empty object
        }
    }

    async loadUkraineSVG() {
        try {
            const response = await fetch('assets/ukraine.svg');
            const svgText = await response.text();
            this.mapContainer = document.querySelector('.ukraine-map');
            
            if (this.mapContainer) {
                this.mapContainer.innerHTML = svgText;
                
                // Add the ukraine-svg class to the SVG element
                const svgElement = this.mapContainer.querySelector('svg');
                if (svgElement) {
                    svgElement.classList.add('ukraine-svg');
                }
            }
        } catch (error) {
            console.error('Failed to load Ukraine SVG:', error);
        }
    }

    setupMapInteractions() {
        if (!this.mapContainer) return;
        
        // Find all path elements with IDs that match our regions
        const svgElement = this.mapContainer.querySelector('svg');
        if (!svgElement) return;
        
        Object.keys(this.svgToRegionMap).forEach(svgId => {
            const pathElement = svgElement.querySelector(`#${svgId}, path[id="${svgId}"]`);
            if (pathElement) {
                // Add data-region attribute
                pathElement.setAttribute('data-region', this.svgToRegionMap[svgId]);
                
                // Add click event
                pathElement.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    const regionId = pathElement.getAttribute('data-region');
                    console.log('Clicked region:', regionId);
                        this.selectRegion(regionId);
                });
                
                // Add hover effects via CSS classes
                pathElement.classList.add('region-path');
                
                // Ensure proper cursor
                pathElement.style.cursor = 'pointer';
            } else {
                console.warn(`SVG path not found for region: ${svgId}`);
            }
        });
    }

    selectRegion(regionId) {
        if (!regionId || !this.regionsData[regionId]) {
            console.warn('Region not found:', regionId);
            return;
        }
        
        console.log('Selecting region:', regionId, this.regionsData[regionId]);
        
        this.selectedRegion = regionId;
        this.updateMapSelection(regionId);
        this.updateRegionInfo(this.regionsData[regionId]);
    }

    updateMapSelection(selectedId) {
        if (!this.mapContainer) return;
        
        const svgElement = this.mapContainer.querySelector('svg');
        if (!svgElement) return;
        
        // Remove selected class from all paths
        svgElement.querySelectorAll('path[data-region]').forEach(path => {
            path.classList.remove('selected');
        });
        
        // Add selected class to current region
        const selectedPath = svgElement.querySelector(`path[data-region="${selectedId}"]`);
        if (selectedPath) {
            selectedPath.classList.add('selected');
        }
    }

    updateRegionInfo(regionData) {
        const infoContainer = document.querySelector('#region-info');
        if (!infoContainer) return;

        infoContainer.innerHTML = `
            <div class="region-info-content">
                <div class="region-header">
                        <h3>${regionData.name}</h3>
                    <div class="region-badges">
                        <span class="zone-badge zone-${regionData.zone}">${this.getZoneName(regionData.zone)}</span>
                        ${regionData.wartime ? '<span class="wartime-badge">Воєнний час</span>' : ''}
                    </div>
                </div>
                

                
                <div class="region-description">
                    <p>${regionData.description}</p>
                </div>
                
                <div class="region-achievements">
                    <h4>Досягнення:</h4>
                    <ul>
                        ${regionData.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="region-leadership">
                    <h4>Керівництво:</h4>
                    <div class="contact-info">
                        ${regionData.leadership ? `
                            <p><strong>Президент:</strong> ${regionData.leadership.president.name}</p>
                            ${regionData.leadership.president.phone ? `<p><strong>Телефон:</strong> ${regionData.leadership.president.phone}</p>` : ''}
                            ${regionData.leadership.vicePresident ? `
                                <p><strong>Віцепрезидент:</strong> ${regionData.leadership.vicePresident.name}</p>
                                <p><strong>Телефон:</strong> ${regionData.leadership.vicePresident.phone}</p>
                            ` : ''}
                            ${regionData.leadership.vicePresidents ? 
                                regionData.leadership.vicePresidents.map(vp => `
                                    <p><strong>Віцепрезидент:</strong> ${vp.name}</p>
                                    ${vp.phone ? `<p><strong>Телефон:</strong> ${vp.phone}</p>` : ''}
                                `).join('') : ''
                            }
                            ${regionData.leadership.secretary ? `
                                <p><strong>Генеральний секретар:</strong> ${regionData.leadership.secretary.name}</p>
                                <p><strong>Телефон:</strong> ${regionData.leadership.secretary.phone}</p>
                            ` : ''}
                            ${regionData.leadership.executiveDirector ? `
                                <p><strong>Виконавчий директор:</strong> ${regionData.leadership.executiveDirector.name}</p>
                                <p><strong>Телефон:</strong> ${regionData.leadership.executiveDirector.phone}</p>
                            ` : ''}
                        ` : `
                            <p><strong>Президент:</strong> ${regionData.president}</p>
                            <p><strong>Телефон:</strong> ${regionData.phone}</p>
                        `}
                        <p><strong>Адреса:</strong> ${regionData.address}</p>
                    </div>
                </div>
                
                                ${regionData.cities ? `
                <div class="region-clubs">
                    <h4>Клуби і школи області:</h4>
                    <div class="cities-list">
                        <div class="clubs-stats">
                            <div class="clubs-stat">
                                <span class="clubs-stat-number">${Object.values(regionData.cities).length}</span>
                                <span class="clubs-stat-label">Міст</span>
                                    </div>
                            <div class="clubs-stat">
                                <span class="clubs-stat-number">${Object.values(regionData.cities).reduce((total, city) => total + city.clubs.length, 0)}</span>
                                <span class="clubs-stat-label">Клубів</span>
                            </div>
                        </div>
                        ${Object.values(regionData.cities).map(city => `
                            <div class="city-section">
                                <h5>${city.name}</h5>
                                <ul>
                                    ${city.clubs.map(club => `
                                        <li>
                                            <strong>${club.name}</strong>
                                            <div class="club-details">
                                                ${club.coach ? `<span class="coach-info">Тренер: ${club.coach}</span>` : ''}
                                                ${club.phone ? `<span class="phone-info">Телефон: <a href="tel:${club.phone}">${club.phone}</a></span>` : ''}
                                            </div>
                                        </li>
                    `).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${regionData.schools ? `
                <div class="region-clubs">
                    <h4>Школи дзюдо:</h4>
                    <div class="cities-list">

                        ${regionData.schools.map(school => `
                            <div class="city-section">
                                <h5>${school.name} (${school.type})</h5>
                                ${school.locations ? school.locations.map(location => `
                                    <div class="contact-info">
                                        <p><strong>Адреса:</strong> ${location.address}</p>
                                        ${location.phone ? `<p><strong>Телефон:</strong> ${location.phone}</p>` : ''}
                                        ${location.email ? `<p><strong>Email:</strong> ${location.email}</p>` : ''}
                                        ${location.director ? `<p><strong>Директор:</strong> ${location.director.name} ${location.director.phone ? `(${location.director.phone})` : ''}</p>` : ''}
                                        ${location.coaches && location.coaches.length > 0 ? `
                                            <p><strong>Тренери:</strong></p>
                                            <ul class="coaches-list">
                                                ${location.coaches.map(coach => `
                                                    <li>${coach.name} ${coach.phone ? `(${coach.phone})` : ''}</li>
                                                `).join('')}
                                            </ul>
                                        ` : ''}
                            </div>
                                `).join('') : `
                                    <div class="contact-info">
                                        <p><strong>Адреса:</strong> ${school.address}</p>
                                        ${school.phone ? `<p><strong>Телефон:</strong> ${school.phone}</p>` : ''}
                                        ${school.email ? `<p><strong>Email:</strong> ${school.email}</p>` : ''}
                                        ${school.director ? `<p><strong>Директор:</strong> ${school.director.name} ${school.director.phone ? `(${school.director.phone})` : ''}</p>` : ''}
                                        ${school.coaches && school.coaches.length > 0 ? `
                                            <p><strong>Тренери:</strong></p>
                                            <ul class="coaches-list">
                                                ${school.coaches.map(coach => `
                                                    <li>${coach.name} ${coach.phone ? `(${coach.phone})` : ''}</li>
                    `).join('')}
                                            </ul>
                    ` : ''}
                </div>
                                `}
                    </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${regionData.clubs && regionData.clubs.length > 0 ? `
                <div class="region-clubs">
                    <h4>Спортивні клуби:</h4>
                    <div class="cities-list">
                        ${regionData.clubs.map(club => `
                            <div class="city-section">
                                <h5>${club.name} (${club.type})</h5>
                                ${club.locations ? club.locations.map(location => `
                                    <div class="contact-info">
                                        <p><strong>Адреса:</strong> ${location.address}</p>
                                        ${location.coaches && location.coaches.length > 0 ? `
                                            <p><strong>Тренери:</strong></p>
                                            <ul class="coaches-list">
                                                ${location.coaches.map(coach => `
                                                    <li>${coach.name} ${coach.phone ? `(${coach.phone})` : ''}</li>
                                                `).join('')}
                                            </ul>
                                        ` : ''}
                    </div>
                                `).join('') : `
                                    <div class="contact-info">
                                        ${club.address ? `<p><strong>Адреса:</strong> ${club.address}</p>` : ''}
                                        ${club.email ? `<p><strong>Email:</strong> ${club.email}</p>` : ''}
                                        ${club.website ? `<p><strong>Сайт:</strong> ${club.website}</p>` : ''}
                                        ${club.coaches && club.coaches.length > 0 ? `
                                            <p><strong>Тренери:</strong></p>
                                            <ul class="coaches-list">
                                                ${club.coaches.map(coach => `
                                                    <li>${coach.name} ${coach.phone ? `(${coach.phone})` : ''}</li>
                                                `).join('')}
                                            </ul>
                                        ` : ''}
                    </div>
                                `}
                    </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
            </div>
        `;
    }

    setupEventListeners() {
        // Filter tabs
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const filter = tab.getAttribute('data-filter');
                this.setFilter(filter);
            });
        });

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-filter') === filter);
        });
        
        this.filterRegionsGrid();
    }

    filterRegionsGrid() {
        const regionCards = document.querySelectorAll('.region-card');
        
        regionCards.forEach(card => {
            const zone = card.getAttribute('data-zone');
            const shouldShow = this.currentFilter === 'all' || zone === this.currentFilter;
            
            if (shouldShow) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    renderRegionsGrid() {
        const gridContainer = document.querySelector('.regions-grid');
        if (!gridContainer) return;

        const regionsHTML = Object.values(this.regionsData).map(region => {
            return this.createRegionCard(region);
        }).join('');

        gridContainer.innerHTML = regionsHTML;
    }

    createRegionCard(region) {
        return `
            <div class="region-card" data-zone="${region.zone}" data-region="${region.id}">
                <div class="region-card-header">
                        <h3>${region.name}</h3>
                    <div class="region-badges">
                        <span class="zone-badge zone-${region.zone}">${this.getZoneName(region.zone)}</span>
                        ${region.wartime ? '<span class="wartime-badge">Воєнний час</span>' : ''}
                    </div>
                </div>
                

                
                                <div class="region-card-info">
                    <p class="president"><strong>Президент:</strong> ${region.president}</p>
                    ${region.vice_president ? `<p class="vice-president"><strong>Віце-президент:</strong> ${region.vice_president}</p>` : ''}
                    ${region.general_secretary ? `<p class="secretary"><strong>Генеральний секретар:</strong> ${region.general_secretary}</p>` : ''}
                    ${region.executive_director ? `<p class="director"><strong>Виконавчий директор:</strong> ${region.executive_director}</p>` : ''}
                    <p class="phone"><strong>Телефон:</strong> ${region.phone}</p>
                    ${region.email ? `<p class="email"><strong>Email:</strong> ${region.email}</p>` : ''}
                    ${region.address ? `<p class="address"><strong>Адреса:</strong> ${region.address}</p>` : ''}
                    </div>
                
                <div class="region-card-actions">
                    <button class="btn-primary" onclick="regionsManager.selectRegion('${region.id}')">
                        Детальніше
                    </button>
                </div>
            </div>
        `;
    }

    getZoneName(zone) {
        const zoneNames = {
            'north': 'Північ',
            'south': 'Південь', 
            'east': 'Схід',
            'west': 'Захід',
            'central': 'Центр'
        };
        return zoneNames[zone] || zone;
    }

    calculateAndUpdateStats() {
        const regions = Object.values(this.regionsData);
        const totalClubs = regions.reduce((sum, region) => sum + region.clubs, 0);
        const totalAthletes = regions.reduce((sum, region) => sum + region.athletes, 0);
        const totalRegions = regions.length;

        // Update stats in hero section
        this.updateStatElements(totalRegions, totalClubs, totalAthletes);
    }

    updateStatElements(regions, clubs, athletes) {
        const statsElements = {
            '.hero-stats .stat-number': [regions, clubs, athletes]
        };

        document.querySelectorAll('.hero-stats .stat-item').forEach((item, index) => {
            const numberElement = item.querySelector('.stat-number');
            if (numberElement && statsElements['.hero-stats .stat-number'][index]) {
                numberElement.textContent = statsElements['.hero-stats .stat-number'][index];
            }
        });
    }

    handleResize() {
        // Handle responsive behavior if needed
        this.filterRegionsGrid();
    }
}

// Initialize when DOM is loaded
let regionsManager;

document.addEventListener('DOMContentLoaded', () => {
    regionsManager = new RegionsManager();
    regionsManager.init();
});

// Export for global access
window.regionsManager = regionsManager; 