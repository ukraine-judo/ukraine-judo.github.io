/**
 * Конфигурация безопасности для новостной системы FJU
 */

const SecurityConfig = {
    // URL API для разных окружений
    apiUrls: {
        development: 'api/news.php',                        // Локальная разработка
        github: 'https://motoshfq.github.io/FJU/api/news.php',  // GitHub Pages
        production: 'https://ukrainejudo.com/api/news.php'      // Основной домен
    },

    // Разрешенные домены для referer
    allowedDomains: [
        'localhost',
        '127.0.0.1',
        'fju.local',
        'motoshfq.github.io',           // GitHub Pages (разработка)
        'ukrainejudo.com',              // Основной домен (продакшн)
        'www.ukrainejudo.com'           // WWW версия основного домена
    ],

    // Настройки кеширования
    cache: {
        expiry: 5 * 60 * 1000, // 5 минут
        maxSize: 100 // максимум 100 статей в кеше
    },

    // Настройки защиты
    security: {
        tokenExpiry: 60 * 60 * 1000, // 1 час
        maxRetries: 3,
        rateLimitDelay: 1000 // 1 секунда между запросами
    },

    // Проверка безопасности браузера
    checkBrowserSecurity() {
        const checks = {
            https: location.protocol === 'https:' || location.hostname === 'localhost',
            referrerPolicy: document.referrerPolicy !== '',
            csp: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]')
        };

        const passed = Object.values(checks).filter(Boolean).length;
        const total = Object.keys(checks).length;

        // console.log(`🔒 Перевірки безпеки: ${passed}/${total}`, checks);
        
        return {
            score: passed / total,
            checks: checks,
            recommendations: this.getSecurityRecommendations(checks)
        };
    },

    // Рекомендации по безопасности
    getSecurityRecommendations(checks) {
        const recommendations = [];

        if (!checks.https) {
            recommendations.push('🔒 Рекомендуємо використовувати HTTPS');
        }

        if (!checks.referrerPolicy) {
            recommendations.push('📋 Додайте Referrer Policy для кращої безпеки');
        }

        if (!checks.csp) {
            recommendations.push('🛡️ Додайте Content Security Policy');
        }

        return recommendations;
    },

    // Получить API URL в зависимости от окружения
    getApiUrl() {
        const hostname = location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('.local')) {
            return this.apiUrls.development;
        } else if (hostname === 'motoshfq.github.io') {
            return this.apiUrls.github;
        } else if (hostname === 'ukrainejudo.com' || hostname === 'www.ukrainejudo.com') {
            return this.apiUrls.production;
        }
        
        // Fallback для неизвестных доменов
        return this.apiUrls.development;
    },

    // Определение текущего окружения
    getEnvironment() {
        const hostname = location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('.local')) {
            return 'development';
        } else if (hostname === 'motoshfq.github.io') {
            return 'github';
        } else if (hostname === 'ukrainejudo.com' || hostname === 'www.ukrainejudo.com') {
            return 'production';
        }
        
        return 'development';
    }
};

// Автоматическая проверка безопасности при загрузке
document.addEventListener('DOMContentLoaded', function() {
    const securityCheck = SecurityConfig.checkBrowserSecurity();
    
    // Тихий режим - логи только для разработки
    if (securityCheck.score < 0.5 && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
        console.warn('⚠️ Низький рівень безпеки браузера');
        securityCheck.recommendations.forEach(rec => console.warn(rec));
    }
});

// Экспорт для использования в других модулях
if (typeof window !== 'undefined') {
    window.SecurityConfig = SecurityConfig;
} 