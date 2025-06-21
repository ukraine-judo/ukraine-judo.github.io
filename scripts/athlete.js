// Athlete Profile JavaScript
document.addEventListener('DOMContentLoaded', function() {
    
    // Get athlete ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const athleteId = urlParams.get('id');
    
    if (!athleteId) {
        showError('Не вказано ID спортсмена');
        return;
    }
    
    // Load athlete data
    loadAthleteData(athleteId);
    
    /**
     * Load athlete data from JSON file
     */
    async function loadAthleteData(id) {
        try {
            showLoading();
            
            // Try to load from men folder first, then women folder
            let athleteData = null;
            let loadSuccess = false;
            
            // Try men folder
            try {
                const menResponse = await fetch(`scripts/team/men/${id}.json`);
                if (menResponse.ok) {
                    athleteData = await menResponse.json();
                    loadSuccess = true;
                }
            } catch (error) {
                console.log('Not found in men folder, trying women folder...');
            }
            
            // If not found in men, try women folder
            if (!loadSuccess) {
                try {
                    const womenResponse = await fetch(`scripts/team/women/${id}.json`);
                    if (womenResponse.ok) {
                        athleteData = await womenResponse.json();
                        loadSuccess = true;
                    }
                } catch (error) {
                    console.log('Not found in women folder either');
                }
            }
            
            if (!loadSuccess || !athleteData) {
                throw new Error('Спортсмен не знайдений');
            }
            
            displayAthleteData(athleteData);
            hideLoading();
            
        } catch (error) {
            console.error('Error loading athlete data:', error);
            showError('Не вдалося завантажити дані спортсмена');
            hideLoading();
        }
    }
    
    /**
     * Setup athlete image with placeholder fallback
     */
    function setupAthleteImage(athlete) {
        const imageContainer = document.querySelector('.athlete-hero-image');
        const existingImg = document.getElementById('athlete-image');
        
        // Check if elements exist
        if (!imageContainer || !existingImg) {
            console.warn('Image container or image element not found');
            return;
        }
        
        // Get initials from name
        const getInitials = (name) => {
            return name.split(' ')
                .map(word => word.charAt(0))
                .join('')
                .substring(0, 2)
                .toUpperCase();
        };
        
        const initials = getInitials(athlete.name);
        
        // Check if image exists and is not a placeholder path
        const hasImage = athlete.image && 
                         athlete.image.trim() !== '' &&
                         !athlete.image.includes('placeholder') && 
                         athlete.image !== 'assets/images/placeholder.jpg';
        
        if (hasImage) {
            // Try to load the image
            existingImg.src = athlete.image;
            existingImg.alt = athlete.name;
            existingImg.onerror = function() {
                // If image fails to load, replace with placeholder
                imageContainer.innerHTML = `
                    <div class="athlete-image-wrapper">
                        <div class="athlete-placeholder athlete-hero-placeholder">
                            <div class="athlete-placeholder-initials">${initials}</div>
                        </div>
                        <div class="athlete-badges">
                            <div id="athlete-team-status" class="athlete-badge team-status"></div>
                            <div id="athlete-weight" class="athlete-badge weight"></div>
                        </div>
                    </div>`;
            };
        } else {
            // No image or placeholder path, show placeholder directly
            imageContainer.innerHTML = `
                <div class="athlete-image-wrapper">
                    <div class="athlete-placeholder athlete-hero-placeholder">
                        <div class="athlete-placeholder-initials">${initials}</div>
                    </div>
                    <div class="athlete-badges">
                        <div id="athlete-team-status" class="athlete-badge team-status"></div>
                        <div id="athlete-weight" class="athlete-badge weight"></div>
                    </div>
                </div>`;
        }
    }
    
    /**
     * Display athlete data on the page
     */
    function displayAthleteData(athlete) {
        // Update page title and meta
        document.getElementById('page-title').textContent = `${athlete.name} - Федерація Дзюдо України`;
        
        const metaStatusText = athlete.status === 'main' ? 'основний склад' : 'резерв';
        document.getElementById('page-description').setAttribute('content', 
            `Профіль ${athlete.name} - ${athlete.weight}, ${athlete.dan}, ${metaStatusText} національної збірної України з дзюдо`);
        document.getElementById('breadcrumb-name').textContent = athlete.name;
        
        // Hero section - handle image with placeholder fallback
        setupAthleteImage(athlete);
        
        // Update hero section elements with null checks
        const athleteName = document.getElementById('athlete-name');
        const athleteNameEn = document.getElementById('athlete-name-en');
        const athleteTeamStatus = document.getElementById('athlete-team-status');
        const athleteWeight = document.getElementById('athlete-weight');
        
        if (athleteName) athleteName.textContent = athlete.name;
        if (athleteNameEn) athleteNameEn.textContent = athlete.nameEn;
        if (athleteTeamStatus) {
            if (athlete.status === 'main') {
                athleteTeamStatus.textContent = 'Основний Склад';
                athleteTeamStatus.className = 'athlete-badge team-status';
            } else {
                athleteTeamStatus.textContent = 'Резерв';
                athleteTeamStatus.className = 'athlete-badge team-status reserve';
            }
        }
        if (athleteWeight) athleteWeight.textContent = athlete.weight;
        


        // Basic info with null checks
        const athleteLocation = document.getElementById('athlete-location');
        const athleteAge = document.getElementById('athlete-age');
        const danElement = document.getElementById('athlete-dan');
        const athleteClub = document.getElementById('athlete-club');
        
        if (athleteLocation) athleteLocation.textContent = `${athlete.city}, ${athlete.country}`;
        if (athleteAge) athleteAge.textContent = `${calculateAge(athlete.birthDate)} років`;
        
        if (danElement) {
            const titleInfo = getTitleInfo(athlete.dan);
            danElement.textContent = athlete.dan;
            
            // Add class based on sport title
            danElement.className = 'stat-value dan-title';
            danElement.classList.add(titleInfo.class);
            
            // Add tooltip with full title name
            if (titleInfo.fullName) {
                danElement.setAttribute('title', titleInfo.fullName);
                danElement.setAttribute('data-tooltip', titleInfo.description || titleInfo.fullName);
            }
        }
        
        if (athleteClub && athlete.biography) {
            athleteClub.textContent = athlete.biography.club;
        }
        

        

        
        // Achievements
        if (athlete.achievements && athlete.achievements.length > 0) {
            displayAchievements(athlete.achievements);
        }
        
        // Biography
        if (athlete.biography) {
            displayBiography(athlete.biography, athlete);
        }
        

        
        // Gallery
        if (athlete.gallery && athlete.gallery.length > 0) {
            displayGallery(athlete.gallery);
        } else {
            hideSection('athlete-gallery');
        }
        
        // Social media
        if (athlete.socialMedia && Object.keys(athlete.socialMedia).length > 0) {
            displaySocialMedia(athlete.socialMedia);
        } else {
            hideSection('athlete-social');
        }
        
        // Hide achievements section if no achievements
        if (!athlete.achievements || athlete.achievements.length === 0) {
            hideSection('athlete-achievements');
        }
        

        
        // Show content
        document.getElementById('athlete-content').style.display = 'block';
        
        // Initialize animations
        initScrollAnimations();
    }
    

    
    /**
     * Display achievements section
     */
    function displayAchievements(achievements) {
        // Display achievement stats
        displayAchievementStats(achievements);
        
        // Display achievement cards
        const achievementsContainer = document.getElementById('achievements-list');
        achievementsContainer.innerHTML = '';
        
        achievements.forEach((achievement, index) => {
            const achievementDiv = document.createElement('div');
            achievementDiv.className = `achievement-item ${achievement.type}`;
            
            const medalSvg = {
                'gold': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="8" r="7"/>
                    <polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"/>
                </svg>`,
                'silver': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="8" r="7"/>
                    <polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"/>
                </svg>`,
                'bronze': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="8" r="7"/>
                    <polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"/>
                </svg>`
            };
            
            const rankText = {
                'gold': 'Золото',
                'silver': 'Срібло', 
                'bronze': 'Бронза'
            };
            
            achievementDiv.innerHTML = `
                <div class="achievement-medal-section">
                    <div class="achievement-medal">${medalSvg[achievement.type]}</div>
                    <div class="achievement-rank">${rankText[achievement.type]}</div>
                </div>
                <div class="achievement-content">
                    <h3 class="achievement-title">${achievement.title}</h3>
                    <div class="achievement-meta">
                        <span class="achievement-year">${achievement.year}</span>
                        <span class="achievement-location">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; vertical-align: middle;">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            ${achievement.location}
                        </span>
                    </div>
                    <p class="achievement-description">${achievement.description}</p>
                </div>
            `;
            
            // Add staggered animation delay
            achievementDiv.style.animationDelay = `${index * 0.1}s`;
            
            achievementsContainer.appendChild(achievementDiv);
        });
    }
    
    /**
     * Display achievement statistics
     */
    function displayAchievementStats(achievements) {
        const statsContainer = document.getElementById('achievements-stats');
        
        // Count medals by type
        const stats = {
            gold: achievements.filter(a => a.type === 'gold').length,
            silver: achievements.filter(a => a.type === 'silver').length,
            bronze: achievements.filter(a => a.type === 'bronze').length
        };
        
                 statsContainer.innerHTML = `
             <div class="achievement-stat">
                 <span class="achievement-stat-number gold" data-target="${stats.gold}">0</span>
                 <span class="achievement-stat-label">Золото</span>
             </div>
             <div class="achievement-stat">
                 <span class="achievement-stat-number silver" data-target="${stats.silver}">0</span>
                 <span class="achievement-stat-label">Срібло</span>
             </div>
             <div class="achievement-stat">
                 <span class="achievement-stat-number bronze" data-target="${stats.bronze}">0</span>
                 <span class="achievement-stat-label">Бронза</span>
             </div>
         `;
         
         // Animate counters
         setTimeout(() => {
             const counters = statsContainer.querySelectorAll('.achievement-stat-number');
             counters.forEach(counter => {
                 animateStatCounter(counter);
             });
         }, 500);
    }
    
    /**
     * Display biography information
     */
    function displayBiography(biography, athlete) {
        document.getElementById('bio-birth-date').textContent = biography.birthDate || '—';
        document.getElementById('bio-start-year').textContent = biography.careerStart ? `${biography.careerStart} рік` : (biography.startYear ? `${biography.startYear} рік` : '—');
        document.getElementById('bio-coach').textContent = biography.coach || '—';
        document.getElementById('bio-club').textContent = biography.club || '—';
        document.getElementById('bio-birth-place').textContent = biography.birthPlace || '—';
        
        // Fill region and weight from main athlete data
        document.getElementById('bio-region').textContent = athlete.region || '—';
        document.getElementById('bio-weight').textContent = athlete.weight || '—';
        
        document.getElementById('bio-education').textContent = biography.education || '—';
        
        // Hide height section since we removed height data
        const heightItem = document.getElementById('bio-height');
        if (heightItem) {
            const heightBioItem = heightItem.closest('.bio-item');
            if (heightBioItem) {
                heightBioItem.style.display = 'none';
            }
        }
    }
    

    

    
    /**
     * Display social media and professional links
     */
    function displaySocialMedia(socialMedia) {
        const socialContainer = document.getElementById('athlete-social-links');
        socialContainer.innerHTML = '';
        
        if (socialMedia.instagram) {
            const instagramLink = document.createElement('a');
            instagramLink.href = `https://www.instagram.com/${socialMedia.instagram.replace('@', '')}`;
            instagramLink.className = 'athlete-social-btn instagram';
            instagramLink.target = '_blank';
            instagramLink.innerHTML = `
                <div class="social-btn-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                    </svg>
                </div>
                <span class="social-btn-text">Instagram</span>
            `;
            socialContainer.appendChild(instagramLink);
        }
        
        if (socialMedia.facebook) {
            const facebookLink = document.createElement('a');
            facebookLink.href = `https://facebook.com/${socialMedia.facebook}`;
            facebookLink.className = 'athlete-social-btn facebook';
            facebookLink.target = '_blank';
            facebookLink.innerHTML = `
                <div class="social-btn-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                </div>
                <span class="social-btn-text">Facebook</span>
            `;
            socialContainer.appendChild(facebookLink);
        }

        if (socialMedia.judoInside) {
            const judoInsideLink = document.createElement('a');
            judoInsideLink.href = socialMedia.judoInside;
            judoInsideLink.className = 'athlete-social-btn judoinside';
            judoInsideLink.target = '_blank';
            judoInsideLink.innerHTML = `
                <div class="social-btn-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                        <path d="M8 12h8"/>
                    </svg>
                </div>
                <span class="social-btn-text">JudoInside</span>
            `;
            socialContainer.appendChild(judoInsideLink);
        }

        if (socialMedia.judoBase) {
            const judoBaseLink = document.createElement('a');
            judoBaseLink.href = socialMedia.judoBase;
            judoBaseLink.className = 'athlete-social-btn judobase';
            judoBaseLink.target = '_blank';
            judoBaseLink.innerHTML = `
                <div class="social-btn-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                    </svg>
                </div>
                <span class="social-btn-text">JudoBase</span>
            `;
            socialContainer.appendChild(judoBaseLink);
        }

        if (socialMedia.ijf) {
            const ijfLink = document.createElement('a');
            ijfLink.href = socialMedia.ijf;
            ijfLink.className = 'athlete-social-btn ijf';
            ijfLink.target = '_blank';
            ijfLink.innerHTML = `
                <div class="social-btn-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="8" r="2"/>
                    </svg>
                </div>
                <span class="social-btn-text">IJF Profile</span>
            `;
            socialContainer.appendChild(ijfLink);
        }
    }
    
    /**
     * Animate stat counter
     */
    function animateStatCounter(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 1500;
        const increment = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    }
    
    /**
     * Calculate age from birth date
     */
    function calculateAge(birthDateString) {
        // Parse Ukrainian date format (e.g., "30 квітня 2002")
        const monthNames = {
            'січня': 0, 'лютого': 1, 'березня': 2, 'квітня': 3,
            'травня': 4, 'червня': 5, 'липня': 6, 'серпня': 7,
            'вересня': 8, 'жовтня': 9, 'листопада': 10, 'грудня': 11
        };
        
        const parts = birthDateString.split(' ');
        if (parts.length >= 3) {
            const day = parseInt(parts[0]);
            const month = monthNames[parts[1]];
            const year = parseInt(parts[2]);
            
            if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                const birthDate = new Date(year, month, day);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                
                return age;
            }
        }
        
        // Fallback: try to extract year and calculate approximate age
        const yearMatch = birthDateString.match(/(\d{4})/);
        if (yearMatch) {
            const year = parseInt(yearMatch[1]);
            return new Date().getFullYear() - year;
        }
        
        return 0;
    }

    /**
     * Format date string
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('uk-UA', options);
    }
    
    /**
     * Show loading indicator
     */
    function showLoading() {
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('error').style.display = 'none';
        document.getElementById('athlete-content').style.display = 'none';
    }
    
    /**
     * Hide loading indicator
     */
    function hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }
    
    /**
     * Show error message
     */
    function showError(message) {
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').querySelector('p').textContent = message;
        document.getElementById('loading').style.display = 'none';
        document.getElementById('athlete-content').style.display = 'none';
    }
    
    /**
     * Initialize scroll-based animations
     */
    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        // Observe elements for animation
        const animatedElements = document.querySelectorAll('.achievement-item, .biography-section, .bio-item, .social-link');
        animatedElements.forEach(el => {
            observer.observe(el);
        });
        
        // Add CSS for animations
        addAnimationStyles();
    }
    
    /**
     * Add animation styles dynamically
     */
    function addAnimationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .achievement-item, .biography-section, .bio-item, .social-link {
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.6s ease;
            }
            
            .achievement-item.animate-in, .biography-section.animate-in, .bio-item.animate-in,
            .social-link.animate-in {
                opacity: 1;
                transform: translateY(0);
            }
            
            .achievement-item:nth-child(2n).animate-in {
                transition-delay: 0.1s;
            }
            
            .biography-section:nth-child(2).animate-in {
                transition-delay: 0.2s;
            }
            
            .bio-item:nth-child(odd).animate-in {
                transition-delay: 0.1s;
            }
            
            .social-link:nth-child(2).animate-in {
                transition-delay: 0.1s;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Display gallery
     */
    function displayGallery(gallery) {
        const galleryContainer = document.getElementById('gallery-grid');
        galleryContainer.innerHTML = '';
        
        if (!gallery || gallery.length === 0) {
            const noGallery = document.createElement('div');
            noGallery.className = 'no-gallery';
            noGallery.innerHTML = '<p>Галерея поки що порожня</p>';
            galleryContainer.appendChild(noGallery);
            return;
        }
        
        gallery.forEach((imagePath, index) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'gallery-item';
            galleryItem.onclick = () => openGalleryModal(index, gallery);
            
            galleryItem.innerHTML = `
                <img src="${imagePath}" alt="Фото ${index + 1}" class="gallery-image">
                <div class="gallery-overlay">
                    <div class="gallery-title">Фото ${index + 1}</div>
                    <div class="gallery-description">Натисніть для перегляду у повному розмірі</div>
                </div>
            `;
            
            galleryContainer.appendChild(galleryItem);
        });
    }

});

// Global variables for gallery modal
let currentImageIndex = 0;
let galleryImages = [];

/**
 * Open gallery modal with navigation
 */
function openGalleryModal(index, images) {
    currentImageIndex = index;
    galleryImages = images;
    
    const modal = document.getElementById('gallery-modal');
    const modalImage = document.getElementById('gallery-modal-image');
    const imageCounter = document.getElementById('gallery-counter');
    const thumbnailsContainer = document.getElementById('gallery-thumbnails');
    
    // Set current image
    modalImage.src = images[index];
    modalImage.alt = `Фото ${index + 1}`;
    
    // Update counter
    imageCounter.textContent = `${index + 1} / ${images.length}`;
    
    // Generate thumbnails
    generateThumbnails(thumbnailsContainer, images, index);
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Add event listeners
    addGalleryEventListeners();
}

/**
 * Generate thumbnails for gallery modal
 */
function generateThumbnails(container, images, currentIndex) {
    container.innerHTML = '';
    
    images.forEach((imagePath, index) => {
        const thumbnail = document.createElement('img');
        thumbnail.className = `gallery-thumbnail ${index === currentIndex ? 'active' : ''}`;
        thumbnail.src = imagePath;
        thumbnail.alt = `Мініатюра ${index + 1}`;
        thumbnail.onclick = () => goToImage(index);
        
        container.appendChild(thumbnail);
    });
}

/**
 * Navigate to specific image
 */
function goToImage(index) {
    if (index < 0 || index >= galleryImages.length) return;
    
    currentImageIndex = index;
    const modalImage = document.getElementById('gallery-modal-image');
    const imageCounter = document.getElementById('gallery-counter');
    const thumbnailsContainer = document.getElementById('gallery-thumbnails');
    
    // Add loading class for smooth transition
    modalImage.classList.add('loading');
    
    // Update main image with enhanced fade effect
    setTimeout(() => {
        modalImage.src = galleryImages[index];
        modalImage.alt = `Фото ${index + 1}`;
        
        // Remove loading class after image loads
        modalImage.onload = () => {
            modalImage.classList.remove('loading');
        };
    }, 200);
    
    // Update counter with smooth animation
    imageCounter.style.transform = 'scale(0.9)';
    setTimeout(() => {
        imageCounter.textContent = `${index + 1} / ${galleryImages.length}`;
        imageCounter.style.transform = 'scale(1)';
    }, 150);
    
    // Update thumbnails
    const thumbnails = thumbnailsContainer.querySelectorAll('.gallery-thumbnail');
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
    
    // Scroll active thumbnail into view with smooth animation
    const activeThumbnail = thumbnailsContainer.querySelector('.gallery-thumbnail.active');
    if (activeThumbnail) {
        activeThumbnail.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest', 
            inline: 'center' 
        });
    }
}

/**
 * Navigate to previous image
 */
function previousImage() {
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : galleryImages.length - 1;
    goToImage(newIndex);
    
    // Add visual feedback
    const prevBtn = document.querySelector('.gallery-prev-btn');
    prevBtn.style.transform = 'translateY(-50%) scale(0.9)';
    setTimeout(() => {
        prevBtn.style.transform = 'translateY(-50%) scale(1)';
    }, 150);
}

/**
 * Navigate to next image
 */
function nextImage() {
    const newIndex = currentImageIndex < galleryImages.length - 1 ? currentImageIndex + 1 : 0;
    goToImage(newIndex);
    
    // Add visual feedback
    const nextBtn = document.querySelector('.gallery-next-btn');
    nextBtn.style.transform = 'translateY(-50%) scale(0.9)';
    setTimeout(() => {
        nextBtn.style.transform = 'translateY(-50%) scale(1)';
    }, 150);
}

/**
 * Add event listeners for gallery modal
 */
function addGalleryEventListeners() {
    const modal = document.getElementById('gallery-modal');
    
    // Remove existing listeners to prevent duplicates
    modal.removeEventListener('click', handleModalClick);
    document.removeEventListener('keydown', handleKeyDown);
    
    // Add new listeners
    modal.addEventListener('click', handleModalClick);
    document.addEventListener('keydown', handleKeyDown);
    
    // Add touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    modal.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    modal.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextImage(); // Swipe left - next image
            } else {
                previousImage(); // Swipe right - previous image
            }
        }
    }
}

/**
 * Handle modal background click
 */
function handleModalClick(e) {
    const modal = document.getElementById('gallery-modal');
    const overlay = document.querySelector('.gallery-modal-overlay');
    
    if (e.target === modal || e.target === overlay) {
        closeGalleryModal();
    }
}

/**
 * Handle keyboard navigation
 */
function handleKeyDown(e) {
    const modal = document.getElementById('gallery-modal');
    if (!modal.classList.contains('active')) return;
    
    switch(e.key) {
        case 'Escape':
            e.preventDefault();
            closeGalleryModal();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            e.preventDefault();
            previousImage();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            e.preventDefault();
            nextImage();
            break;
        case ' ': // Space bar
            e.preventDefault();
            nextImage();
            break;
        case 'Home':
            e.preventDefault();
            goToImage(0);
            break;
        case 'End':
            e.preventDefault();
            goToImage(galleryImages.length - 1);
            break;
    }
}

/**
 * Close gallery modal
 */
function closeGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    
    // Add closing animation
    modal.style.opacity = '0';
    
    setTimeout(() => {
        modal.classList.remove('active');
        modal.style.opacity = '';
        document.body.style.overflow = '';
        
        // Remove event listeners
        modal.removeEventListener('click', handleModalClick);
        document.removeEventListener('keydown', handleKeyDown);
        
        // Reset variables
        currentImageIndex = 0;
        galleryImages = [];
    }, 300);
}

/**
 * Hide empty sections
 */
function hideSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'none';
    }
}

/**
 * Get title information for sport ranks
 */
function getTitleInfo(dan) {
    const titles = {
        'МСУМК': {
            class: 'title-msmk',
            fullName: 'Майстер спорту України міжнародного класу',
            description: 'Найвище спортивне звання в Україні',
            level: 5
        },
        'ЗМСУ': {
            class: 'title-zmsu',
            fullName: 'Заслужений майстер спорту України',
            description: 'Почесне звання за видатні спортивні досягнення',
            level: 4
        },
        'МС': {
            class: 'title-ms',
            fullName: 'Майстер спорту',
            description: 'Високе спортивне звання',
            level: 3
        },
        'МСУ': {
            class: 'title-ms', // Використовуємо той же стиль що і МС
            fullName: 'Майстер спорту України',
            description: 'Високе спортивне звання України',
            level: 3
        },
        'КМС': {
            class: 'title-kms',
            fullName: 'Кандидат у майстри спорту',
            description: 'Підготовчий рівень до майстра спорту',
            level: 2
        },
        'КМСУ': {
            class: 'title-kms', // Використовуємо той же стиль що і КМС
            fullName: 'Кандидат у майстри спорту України',
            description: 'Підготовчий рівень до майстра спорту України',
            level: 2
        }
    };

    return titles[dan] || {
        class: 'title-default',
        fullName: dan,
        description: 'Спортивне звання',
        level: 1
    };
} 