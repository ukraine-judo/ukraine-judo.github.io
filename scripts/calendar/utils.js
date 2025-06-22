// Calendar utilities and rendering helpers
class CalendarUtils {
    static getEventTypeLabel(type) {
        const labels = {
            'championship': 'Чемпіонат',
            'cup': 'Кубок',
            'tournament': 'Турнір',
            'youth': 'Молодь',
            'international': 'Міжнародний',
            'seminar': 'Семінар',
            'education': 'Освіта',
            'veterans': 'Ветерани',
            'training': 'Тренування'
        };
        return labels[type] || type;
    }

    static getCategoryName(category) {
        const categories = {
            'championship': 'Чемпіонат',
            'youth': 'Молодіжні',
            'international': 'Міжнародні',
            'education': 'Освітні',
            'tournament': 'Турніри',
            'veterans': 'Ветерани',
            'memorial': 'Меморіали',
            'patriotic': 'Патріотичні'
        };
        return categories[category] || category;
    }

    static showCalendarNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        if (type === 'success') {
            notification.style.backgroundColor = '#10b981';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#ef4444';
        } else {
            notification.style.backgroundColor = '#3b82f6';
        }
        
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    static addToCalendar(event) {
        if (!event) return;

        const startDate = new Date(event.date);
        const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 3600000);

        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&location=${encodeURIComponent(event.location)}&details=${encodeURIComponent(event.description)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;

        window.open(googleCalendarUrl, '_blank');
        CalendarUtils.showCalendarNotification('Подію додано до календаря!', 'success');
    }

    static shareEvent(event, api) {
        console.log('shareEvent called with:', event, api);
        
        if (!event) {
            console.error('Event is null or undefined');
            CalendarUtils.showCalendarNotification('Помилка: подія не знайдена', 'error');
            return;
        }

        try {
            const dateInfo = api ? api.formatDate(event.date) : { day: 'N/A', month: 'N/A', year: 'N/A' };
            const shareText = `${event.title} - ${event.location}, ${dateInfo.day} ${dateInfo.month} ${dateInfo.year}`;
            
            console.log('Share text:', shareText);
            
            if (navigator.share) {
                navigator.share({
                    title: event.title,
                    text: shareText,
                    url: window.location.href
                }).then(() => {
                    console.log('Share successful');
                }).catch((error) => {
                    console.error('Share failed:', error);
                    // Fallback to clipboard
                    CalendarUtils.copyToClipboard(shareText);
                });
            } else {
                CalendarUtils.copyToClipboard(shareText);
            }
        } catch (error) {
            console.error('Error in shareEvent:', error);
            CalendarUtils.showCalendarNotification('Помилка при поділитись подією', 'error');
        }
    }

    static copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                CalendarUtils.showNotification('Інформацію скопійовано в буфер обміну!', 'success');
            }).catch((error) => {
                console.error('Clipboard write failed:', error);
                CalendarUtils.fallbackCopyToClipboard(text);
            });
        } else {
            CalendarUtils.fallbackCopyToClipboard(text);
        }
    }

    static fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                CalendarUtils.showNotification('Інформацію скопійовано в буфер обміну!', 'success');
            } else {
                CalendarUtils.showNotification('Не вдалося скопіювати інформацію', 'error');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            CalendarUtils.showNotification('Не вдалося скопіювати інформацію', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    static setupAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        setTimeout(() => {
            const animatedElements = document.querySelectorAll('.event-item');
            animatedElements.forEach(el => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                observer.observe(el);
            });
        }, 100);
    }
}

class CalendarRenderer {
    constructor(api) {
        this.api = api;
    }

    renderEventItem(event) {
        const dateInfo = this.api.formatDate(event.date);
        const endDateInfo = event.endDate ? this.api.formatDate(event.endDate) : null;
        const actualStatus = this.api.getActualEventStatus(event);
        const statusInfo = this.api.getStatusInfo(actualStatus);
        const ageGroupInfo = this.api.getAgeGroupInfo(event.ageGroup);

        const imageContent = event.image 
            ? `<img src="${event.image}" alt="${event.title}" class="event-image" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
            : `<div class="event-placeholder">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
                <div class="event-placeholder-text">Зображення відсутнє</div>
               </div>`;

        const fallbackPlaceholder = event.image ? `
            <div class="event-placeholder" style="display: none;">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
                <div class="event-placeholder-text">Зображення відсутнє</div>
            </div>` : '';

        return `
            <div class="event-item" data-category="${event.category}" data-event-id="${event.id}">
                <div class="event-image-container">
                    ${imageContent}
                    ${fallbackPlaceholder}
                    <div class="event-overlay">
                        <div class="event-date-badge">
                            <span class="date">${endDateInfo ? `${dateInfo.day}-${endDateInfo.day}` : dateInfo.day}</span>
                            <span class="month">${dateInfo.month.slice(0, 3)}</span>
                        </div>
                        <div class="event-status-badge ${actualStatus}">
                            ${statusInfo ? statusInfo.name : actualStatus}
                        </div>
                    </div>
                    <div class="event-category-badge">${CalendarUtils.getEventTypeLabel(event.type)}</div>
                </div>
                <div class="event-content">
                    <div class="event-header">
                        <h3 class="event-title">${event.title}</h3>
                        <div class="event-type-badge">${CalendarUtils.getCategoryName(event.category)}</div>
                    </div>
                    <div class="event-info-grid">
                        <div class="event-info-item">
                            <span class="icon-location event-icon"></span>
                            <span class="event-info-text">${event.location}</span>
                        </div>
                        <div class="event-info-item">
                            <span class="icon-users event-icon"></span>
                            <span class="event-info-text">${ageGroupInfo ? ageGroupInfo.name : event.ageGroup}</span>
                        </div>
                        ${event.endDate ? `
                        <div class="event-info-item">
                            <span class="icon-calendar event-icon"></span>
                            <span class="event-info-text">${event.date} - ${event.endDate}</span>
                        </div>` : ''}
                    </div>
                    <div class="event-actions">
                        <button class="event-btn event-btn-primary" onclick="calendar.showEventDetails(${event.id})">
                            <span class="icon-description"></span> Подробнее
                        </button>
                        ${event.regulationLink ? `
                        <a href="${event.regulationLink}" class="event-btn event-regulation-btn" target="_blank">
                            <span class="icon-regulation"></span> Регламент
                        </a>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderPagination(totalPages, totalEvents, currentPage, eventsPerPage) {
        const paginationElement = document.getElementById('eventsPagination');
        if (!paginationElement) return;

        let paginationHTML = `
            <div class="pagination-info">
                Показано ${((currentPage - 1) * eventsPerPage) + 1}-${Math.min(currentPage * eventsPerPage, totalEvents)} з ${totalEvents} подій
            </div>
            <div class="pagination-controls">
        `;

        if (currentPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="calendar.goToPage(${currentPage - 1})">‹ Попередня</button>`;
        }

        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="calendar.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === currentPage ? 'active' : '';
            paginationHTML += `<button class="pagination-btn ${activeClass}" onclick="calendar.goToPage(${i})">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-dots">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="calendar.goToPage(${totalPages})">${totalPages}</button>`;
        }

        if (currentPage < totalPages) {
            paginationHTML += `<button class="pagination-btn" onclick="calendar.goToPage(${currentPage + 1})">Наступна ›</button>`;
        }

        paginationHTML += `</div>`;
        paginationElement.innerHTML = paginationHTML;
    }

    renderEventModal(event) {
        const dateInfo = this.api.formatDate(event.date);
        const endDateInfo = event.endDate ? this.api.formatDate(event.endDate) : null;
        const actualStatus = this.api.getActualEventStatus(event);
        const statusInfo = this.api.getStatusInfo(actualStatus);
        const ageGroupInfo = this.api.getAgeGroupInfo(event.ageGroup);

        const modal = document.createElement('div');
        modal.className = 'event-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${event.title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-body-content">
                        <div class="event-modal-info">
                            <p><strong><span class="icon-calendar"></span> Дата:</strong> ${dateInfo.day} ${dateInfo.month} ${dateInfo.year}${endDateInfo ? ` - ${endDateInfo.day} ${endDateInfo.month} ${endDateInfo.year}` : ''}</p>
                            <p><strong><span class="icon-location"></span> Місце:</strong> ${event.location}</p>
                            <p><strong><span class="icon-trophy"></span> Тип:</strong> ${CalendarUtils.getEventTypeLabel(event.type)}</p>
                            <p><strong><span class="icon-users"></span> Вікова група:</strong> ${ageGroupInfo ? ageGroupInfo.name : event.ageGroup}</p>
                            <p><strong><span class="icon-status"></span> Статус:</strong> <span class="status-text ${actualStatus}">${statusInfo ? statusInfo.name : actualStatus}</span></p>
                            <p><strong><span class="icon-description"></span> Опис:</strong> ${event.description}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="CalendarUtils.addToCalendar(calendar.api.getEventById('${event.id}'))">
                        <span class="icon-calendar"></span> Додати до календаря
                    </button>
                    <button class="btn btn-outline" onclick="CalendarUtils.shareEvent(calendar.api.getEventById('${event.id}'), calendar.api)">
                        <span class="icon-share"></span> Поділитися
                    </button>
                    ${event.regulationLink ? `<a href="${event.regulationLink}" class="btn btn-outline" target="_blank"><span class="icon-regulation"></span> Регламент</a>` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Анимация открытия
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                if (document.body.contains(modal)) {
                    document.body.removeChild(modal);
                }
            }, 400);
        };
        
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Закрытие по ESC
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);

        return modal;
    }
} 