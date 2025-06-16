/**
 * Coach Profile Page JavaScript
 * Handles loading and displaying individual coach profiles
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Coach profile page loaded');
    
    // Get coach ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const coachId = urlParams.get('id');
    
    if (coachId) {
        loadCoachProfile(coachId);
    } else {
        showError('Не вказано ID тренера');
    }
    
    // Initialize gallery functionality
    initGallery();
});

/**
 * Load coach profile data
 */
async function loadCoachProfile(coachId) {
    try {
        showLoading();
        
        // Load basic coach data
        const coachResponse = await fetch('scripts/team/coaches.json');
        const coachesData = await coachResponse.json();
        const basicCoach = coachesData.coaches.find(c => c.id === coachId);
        
        if (!basicCoach) {
            throw new Error('Тренера не знайдено');
        }
        
        // Load detailed coach data
        const detailResponse = await fetch(`scripts/team/articles/coaches/${coachId}.json`);
        const detailedCoach = await detailResponse.json();
        
        // Combine data
        const coach = { ...basicCoach, ...detailedCoach };
        
        // Update page title and meta
        updatePageMeta(coach);
        
        // Populate all sections
        populateHeroSection(coach);
        populateBiography(coach);
        populateAwards(coach);
        populateGallery(coach);
        
        hideLoading();
        showContent();
        
    } catch (error) {
        console.error('Error loading coach profile:', error);
        hideLoading();
        showError(error.message || 'Помилка завантаження профілю тренера');
    }
}

/**
 * Update page title and meta information
 */
function updatePageMeta(coach) {
    document.title = `${coach.name} - Тренер - Федерація Дзюдо України`;
    document.getElementById('page-title').textContent = `${coach.name} - Тренер - Федерація Дзюдо України`;
    document.getElementById('page-description').setAttribute('content', 
        `Профіль тренера ${coach.name} - ${coach.position}. ${coach.specialization || ''}`);
    document.getElementById('breadcrumb-name').textContent = coach.name;
}

/**
 * Populate hero section
 */
function populateHeroSection(coach) {
    // Name and basic info
    document.getElementById('coach-name').textContent = coach.name;
    document.getElementById('coach-name-en').textContent = coach.nameEn || '';
    document.getElementById('coach-position').textContent = coach.position;
    
    // Image with fallback
    const imageElement = document.getElementById('coach-image');
    const imageContainer = imageElement.parentElement;
    
    if (coach.image && !coach.image.includes('placeholder')) {
        imageElement.src = coach.image;
        imageElement.alt = coach.name;
        imageElement.style.display = 'block';
        imageElement.onerror = function() {
            this.style.display = 'none';
            showCoachPlaceholder(imageContainer, coach.name);
        };
    } else {
        imageElement.style.display = 'none';
        showCoachPlaceholder(imageContainer, coach.name);
    }
    
    // Badges
    document.getElementById('coach-category').textContent = getCategoryDisplayName(coach.category);
    document.getElementById('coach-experience').textContent = `${coach.experience} досвіду`;
    
    // Location and basic info
    document.getElementById('coach-location').textContent = `${coach.city || ''}, ${coach.region || 'Україна'}`;
    
    // Coaching years
    const coachingYears = calculateCoachingYears(coach);
    document.getElementById('coach-coaching-years').textContent = coachingYears;
    

    
    // Education
    document.getElementById('coach-education').textContent = coach.education || 'Не вказано';
}

/**
 * Show coach placeholder avatar
 */
function showCoachPlaceholder(container, name) {
    const initials = name.split(' ')
        .map(word => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
    
    const placeholder = document.createElement('div');
    placeholder.className = 'coach-placeholder';
    placeholder.innerHTML = `<span>${initials}</span>`;
    
    container.appendChild(placeholder);
}

/**
 * Calculate coaching years display
 */
function calculateCoachingYears(coach) {
    if (coach.coachingCareer?.startYear) {
        const currentYear = new Date().getFullYear();
        const years = currentYear - coach.coachingCareer.startYear;
        return `${years} років тренерства`;
    }
    return coach.experience || 'Досвідчений тренер';
}







/**
 * Populate biography section
 */
function populateBiography(coach) {
    // Personal info paragraph
    const personalContainer = document.getElementById('biography-personal');
    const personalInfo = coach.biography?.personalInfo || 'Інформація недоступна';
    personalContainer.innerHTML = `<p>${personalInfo}</p>`;
    
    // Career info paragraph
    const careerContainer = document.getElementById('biography-career');
    const careerInfo = coach.biography?.careerInfo || 'Інформація про кар\'єру недоступна';
    careerContainer.innerHTML = `<p>${careerInfo}</p>`;
}

/**
 * Populate awards section
 */
function populateAwards(coach) {
    const container = document.getElementById('awards-list');
    
    if (!coach.awards || !Array.isArray(coach.awards)) {
        container.innerHTML = '<p class="no-data">Інформація про нагороди недоступна</p>';
        return;
    }
    
    container.innerHTML = coach.awards.map(award => `
        <div class="award-item">
            <div class="award-icon">🏆</div>
            <h4 class="award-title">${award.title}</h4>
            <div class="award-year">${award.year}</div>
        </div>
    `).join('');
}





/**
 * Get category display name
 */
function getCategoryDisplayName(category) {
    const categories = {
        'head': 'Керівництво',
        'men': 'Чоловіча збірна',
        'women': 'Жіноча збірна',
        'youth': 'Молодіжна збірна',
        'technical': 'Технічний штаб',
        'medical': 'Медичний персонал',
        'physical': 'Фізична підготовка'
    };
    return categories[category] || category;
}





/**
 * Show loading indicator
 */
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('error').style.display = 'none';
    document.getElementById('coach-content').style.display = 'none';
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

/**
 * Show content
 */
function showContent() {
    document.getElementById('coach-content').style.display = 'block';
}

/**
 * Show error message
 */
function showError(message) {
    document.getElementById('error').style.display = 'block';
    document.getElementById('error').querySelector('p').innerHTML = 
        `${message} <a href="team.html">Повернутися до збірної</a>`;
}

/**
 * Populate gallery section
 */
function populateGallery(coach) {
    const container = document.getElementById('gallery-grid');
    
    if (!coach.gallery || !Array.isArray(coach.gallery)) {
        container.innerHTML = '<p class="no-data">Галерея недоступна</p>';
        return;
    }
    
    container.innerHTML = coach.gallery.map((image, index) => `
        <div class="gallery-item" onclick="openGalleryModal(${index})">
            <img src="${image}" alt="Фото ${index + 1}" class="gallery-image">
            <div class="gallery-overlay">
                <h4 class="gallery-title">Фото ${index + 1}</h4>
            </div>
        </div>
    `).join('');
    
    // Store gallery data globally for modal
    window.galleryData = coach.gallery;
}

/**
 * Initialize gallery functionality
 */
function initGallery() {
    window.currentGalleryIndex = 0;
    
    // Close modal on background click
    const modal = document.getElementById('gallery-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeGalleryModal();
            }
        });
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('gallery-modal');
        if (modal && modal.classList.contains('active')) {
            if (e.key === 'Escape') {
                closeGalleryModal();
            } else if (e.key === 'ArrowLeft') {
                previousImage();
            } else if (e.key === 'ArrowRight') {
                nextImage();
            }
        }
    });
}

/**
 * Open gallery modal
 */
function openGalleryModal(index) {
    if (!window.galleryData) return;
    
    window.currentGalleryIndex = index;
    const modal = document.getElementById('gallery-modal');
    
    updateGalleryModal();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close gallery modal
 */
function closeGalleryModal() {
    const modal = document.getElementById('gallery-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Navigate to previous image
 */
function previousImage() {
    if (!window.galleryData) return;
    
    window.currentGalleryIndex = 
        (window.currentGalleryIndex - 1 + window.galleryData.length) % window.galleryData.length;
    updateGalleryModal();
}

/**
 * Navigate to next image
 */
function nextImage() {
    if (!window.galleryData) return;
    
    window.currentGalleryIndex = 
        (window.currentGalleryIndex + 1) % window.galleryData.length;
    updateGalleryModal();
}

/**
 * Update gallery modal content
 */
function updateGalleryModal() {
    if (!window.galleryData) return;
    
    const currentImage = window.galleryData[window.currentGalleryIndex];
    
    // Update main image
    document.getElementById('gallery-modal-image').src = currentImage;
    
    // Update counter
    document.getElementById('gallery-counter').textContent = 
        `${window.currentGalleryIndex + 1} з ${window.galleryData.length}`;
    
    // Update thumbnails
    const thumbnailsContainer = document.getElementById('gallery-thumbnails');
    thumbnailsContainer.innerHTML = window.galleryData.map((image, index) => `
        <div class="gallery-thumbnail ${index === window.currentGalleryIndex ? 'active' : ''}" 
             onclick="window.currentGalleryIndex = ${index}; updateGalleryModal();">
            <img src="${image}" alt="Thumbnail ${index + 1}">
        </div>
    `).join('');
} 