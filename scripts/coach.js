/**
 * Coach Profile Page JavaScript
 * Handles loading and displaying individual coach profiles
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Coach profile page loaded');
    
    // Initialize SEO manager
    if (window.CoachSEO) {
        window.CoachSEO.init();
    }
    
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
        
        // Load coach data directly from individual file
        const coachResponse = await fetch(`scripts/team/coaches/${coachId}.json`);
        
        if (!coachResponse.ok) {
            throw new Error('Тренера не знайдено');
        }
        
        const coach = await coachResponse.json();
        
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
    // Використовуємо новий SEO менеджер для оновлення всіх мета-тегів
    if (window.CoachSEO) {
        window.CoachSEO.updateMetaTags(coach);
    } else {
        // Fallback до старої логіки
    document.title = `${coach.name} - Тренер - Федерація Дзюдо України`;
    document.getElementById('page-title').textContent = `${coach.name} - Тренер - Федерація Дзюдо України`;
    document.getElementById('page-description').setAttribute('content', 
        `Профіль тренера ${coach.name} - ${coach.position}. ${coach.specialization || ''}`);
    document.getElementById('breadcrumb-name').textContent = coach.name;
    }
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
    
    // Stats grid
    document.getElementById('coach-location').textContent = `${coach.city || ''}, ${coach.region || 'Україна'}`;
    
    // Coaching years
    const coachingYears = calculateCoachingYears(coach);
    document.getElementById('coach-coaching-years').textContent = coachingYears;
    
    // Education
    document.getElementById('coach-education').textContent = coach.education || 'Не вказано';
    
    // Category display
    document.getElementById('coach-category-display').textContent = getCategoryDisplayName(coach.category);
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
    placeholder.className = 'coach-placeholder coach-hero-placeholder';
    placeholder.innerHTML = `<span class="coach-placeholder-initials">${initials}</span>`;
    
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
    // Personal info as bio items
    const personalContainer = document.getElementById('biography-personal');
    const personalBioItems = [
        { 
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>`,
            label: 'Дата народження',
            value: coach.birthDate || 'Не вказано'
        },
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>`,
            label: 'Місце народження',
            value: coach.birthPlace || 'Не вказано'
        },
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>`,
            label: 'Освіта',
            value: coach.education || 'Не вказано'
        }
    ];
    
    personalContainer.innerHTML = personalBioItems.map(item => `
        <div class="bio-item">
            <div class="bio-icon">${item.icon}</div>
            <div class="bio-content">
                <div class="bio-label">${item.label}</div>
                <div class="bio-value">${item.value}</div>
            </div>
        </div>
    `).join('');
    
    // Career info as bio items
    const careerContainer = document.getElementById('biography-career');
    const careerBioItems = [
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                  </svg>`,
            label: 'Позиція',
            value: coach.position || 'Не вказано'
        },
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6"/>
                    <path d="m15.5 3.5-1 1M8.5 20.5l1-1M3.5 8.5l1 1M20.5 15.5l-1-1"/>
                  </svg>`,
            label: 'Досвід роботи',
            value: coach.experience || 'Не вказано'
        },
        {
            icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>`,
            label: 'Категорія',
            value: getCategoryDisplayName(coach.category)
        }
    ];
    
    careerContainer.innerHTML = careerBioItems.map(item => `
        <div class="bio-item">
            <div class="bio-icon">${item.icon}</div>
            <div class="bio-content">
                <div class="bio-label">${item.label}</div>
                <div class="bio-value">${item.value}</div>
            </div>
        </div>
    `).join('');
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
        <div class="achievement-item ${award.type || 'gold'}">
            <div class="achievement-medal-section">
                <div class="achievement-medal">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </div>
                <div class="achievement-rank">${award.rank || 'Нагорода'}</div>
            </div>
            <div class="achievement-content">
                <div class="achievement-title">${award.title}</div>
                <div class="achievement-meta">
                    <div class="achievement-year">${award.year}</div>
                    ${award.location ? `<div class="achievement-location">${award.location}</div>` : ''}
                </div>
                ${award.description ? `<div class="achievement-description">${award.description}</div>` : ''}
            </div>
        </div>
    `).join('');
}

/**
 * Get category display name
 */
function getCategoryDisplayName(category) {
    const categories = {
        'men': 'Чоловіча',
        'women': 'Жіноча',
        'cadet_boys': 'Кадети (Хлопці)',
        'cadet_girls': 'Кадети (Дівчата)',
        'youth': 'до 15 років',
        'staff': 'Штат',
        'reserve': 'Резервної',
        'junior_women': 'Юніорська (Жінки)',
        'junior_men': 'Юніорська (Чоловіки)'
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
    const galleryContainer = document.getElementById('gallery-grid');
    galleryContainer.innerHTML = '';
    
    if (!coach.gallery || !Array.isArray(coach.gallery) || coach.gallery.length === 0) {
        const noGallery = document.createElement('div');
        noGallery.className = 'no-gallery';
        noGallery.innerHTML = '<p>Галерея поки що порожня</p>';
        galleryContainer.appendChild(noGallery);
        return;
    }
    
    coach.gallery.forEach((imagePath, index) => {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.onclick = () => openGalleryModal(index, coach.gallery);
        
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

/**
 * Initialize gallery functionality
 */
function initGallery() {
    // Gallery initialization happens automatically with the new modal system
}

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
 * Download current image from gallery
 */
function downloadCurrentImage() {
    if (!galleryImages || galleryImages.length === 0 || currentImageIndex < 0) {
        console.error('No image available for download');
        return;
    }
    
    const currentImageSrc = galleryImages[currentImageIndex];
    const imageFileName = `coach-photo-${currentImageIndex + 1}.jpg`;
    
    // Add visual feedback
    const downloadBtn = document.querySelector('.gallery-download-btn');
    const originalTransform = downloadBtn.style.transform;
    downloadBtn.style.transform = 'scale(0.95) translateY(-2px)';
    
    setTimeout(() => {
        downloadBtn.style.transform = originalTransform;
    }, 200);
    
    // Create a temporary anchor element to trigger download
    fetch(currentImageSrc)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = imageFileName;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }, 100);
            
            // Show success feedback
            showDownloadSuccess();
        })
        .catch(error => {
            console.error('Download failed:', error);
            showDownloadError();
        });
}

/**
 * Show download success feedback
 */
function showDownloadSuccess() {
    const downloadBtn = document.querySelector('.gallery-download-btn');
    const originalHTML = downloadBtn.innerHTML;
    
    downloadBtn.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
        </svg>
    `;
    downloadBtn.style.background = 'rgba(34, 197, 94, 0.8)';
    
    setTimeout(() => {
        downloadBtn.innerHTML = originalHTML;
        downloadBtn.style.background = '';
    }, 2000);
}

/**
 * Show download error feedback
 */
function showDownloadError() {
    const downloadBtn = document.querySelector('.gallery-download-btn');
    const originalHTML = downloadBtn.innerHTML;
    
    downloadBtn.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    `;
    downloadBtn.style.background = 'rgba(239, 68, 68, 0.8)';
    
    setTimeout(() => {
        downloadBtn.innerHTML = originalHTML;
        downloadBtn.style.background = '';
    }, 2000);
} 