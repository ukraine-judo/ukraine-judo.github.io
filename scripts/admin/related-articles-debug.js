/**
 * Инструмент для отладки и тестирования алгоритма похожих статей
 * Использовать в консоли браузера для анализа работы алгоритма
 */

class RelatedArticlesDebugger {
    constructor() {
        this.loader = new NewsLoader();
    }

    /**
     * Тестирует алгоритм для конкретной статьи
     */
    async testArticle(articleId) {
        try {
            const article = await this.loader.loadArticle(articleId);
            if (!article) {
                console.error(`Статья ${articleId} не найдена`);
                return;
            }

            console.log(`\n=== АНАЛИЗ ПОХОЖИХ СТАТЕЙ ===`);
            console.log(`Статья: "${article.title}"`);
            console.log(`Категория: ${article.category}`);
            console.log(`Теги: ${article.tags ? article.tags.join(', ') : 'нет'}`);
            console.log(`Автор: ${article.author?.name || 'неизвестен'}`);
            console.log(`Дата: ${new Date(article.publishedAt).toLocaleDateString('uk-UA')}`);
            
            // Получаем предопределенные связанные статьи
            if (article.related && article.related.length > 0) {
                console.log(`\n--- ПРЕДОПРЕДЕЛЕННЫЕ СВЯЗАННЫЕ (${article.related.length}) ---`);
                const manifest = await this.loader.createArticlesManifest();
                const predefinedRelated = manifest.articles.filter(a => 
                    article.related.includes(a.id)
                );
                predefinedRelated.forEach((related, index) => {
                    console.log(`${index + 1}. "${related.title}" (ID: ${related.id})`);
                });
            }

            // Получаем предложения алгоритма
            console.log(`\n--- ПРЕДЛОЖЕНИЯ АЛГОРИТМА ---`);
            const suggestions = await this.loader.suggestRelatedArticles(article, 10);
            
            suggestions.forEach((item, index) => {
                console.log(`${index + 1}. "${item.article.title}" (ID: ${item.article.id})`);
                console.log(`   Рейтинг: ${item.score}`);
                console.log(`   Причины: ${item.reasons.join('; ')}`);
                console.log('');
            });

            // Получаем финальный результат
            console.log(`\n--- ФИНАЛЬНЫЙ РЕЗУЛЬТАТ ---`);
            const finalRelated = await this.loader.getRelatedArticles(article, 4);
            finalRelated.forEach((related, index) => {
                console.log(`${index + 1}. "${related.title}" (ID: ${related.id})`);
            });

            return {
                article,
                suggestions,
                finalRelated
            };

        } catch (error) {
            console.error('Ошибка при тестировании:', error);
        }
    }

    /**
     * Анализирует все статьи и показывает статистику
     */
    async analyzeAll() {
        try {
            const manifest = await this.loader.createArticlesManifest();
            const articles = manifest.articles;
            
            console.log(`\n=== ОБЩАЯ СТАТИСТИКА ===`);
            console.log(`Всего статей: ${articles.length}`);
            
            const withPredefined = articles.filter(a => a.related && a.related.length > 0);
            console.log(`Статей с предопределенными связями: ${withPredefined.length}`);
            
            const avgPredefined = withPredefined.length > 0 ? 
                withPredefined.reduce((sum, a) => sum + a.related.length, 0) / withPredefined.length : 0;
            console.log(`Среднее количество предопределенных связей: ${avgPredefined.toFixed(1)}`);

            // Анализ по категориям
            const categories = {};
            articles.forEach(article => {
                if (!categories[article.category]) {
                    categories[article.category] = 0;
                }
                categories[article.category]++;
            });

            console.log(`\n--- СТАТЬИ ПО КАТЕГОРИЯМ ---`);
            Object.entries(categories).forEach(([category, count]) => {
                console.log(`${category}: ${count} статей`);
            });

            // Анализ тегов
            const tagCounts = {};
            articles.forEach(article => {
                if (article.tags) {
                    article.tags.forEach(tag => {
                        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    });
                }
            });

            const popularTags = Object.entries(tagCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10);

            console.log(`\n--- ПОПУЛЯРНЫЕ ТЕГИ ---`);
            popularTags.forEach(([tag, count]) => {
                console.log(`${tag}: ${count} статей`);
            });

        } catch (error) {
            console.error('Ошибка при анализе:', error);
        }
    }

    /**
     * Находит статьи без связанных и предлагает их
     */
    async findOrphans() {
        try {
            const manifest = await this.loader.createArticlesManifest();
            const orphans = manifest.articles.filter(article => 
                !article.related || article.related.length === 0
            );

            console.log(`\n=== СТАТЬИ БЕЗ СВЯЗАННЫХ (${orphans.length}) ===`);
            
            for (const orphan of orphans.slice(0, 5)) { // Показываем первые 5
                console.log(`\nСтатья: "${orphan.title}" (ID: ${orphan.id})`);
                const suggestions = await this.loader.suggestRelatedArticles(orphan, 3);
                
                if (suggestions.length > 0) {
                    console.log('Предлагаемые связанные:');
                    suggestions.forEach((item, index) => {
                        console.log(`  ${index + 1}. "${item.article.title}" (рейтинг: ${item.score})`);
                    });
                } else {
                    console.log('Нет подходящих связанных статей');
                }
            }

            return orphans;

        } catch (error) {
            console.error('Ошибка при поиске сирот:', error);
        }
    }

    /**
     * Сравнивает два алгоритма: старый и новый
     */
    async compareAlgorithms(articleId) {
        try {
            const article = await this.loader.loadArticle(articleId);
            if (!article) {
                console.error(`Статья ${articleId} не найдена`);
                return;
            }

            // Старый алгоритм (простой)
            const manifest = await this.loader.createArticlesManifest();
            const oldResults = manifest.articles
                .filter(a => 
                    a.id !== article.id &&
                    (a.category === article.category ||
                     (article.tags && a.tags && 
                      article.tags.some(tag => a.tags.includes(tag))))
                )
                .slice(0, 4);

            // Новый алгоритм
            const newResults = await this.loader.getRelatedArticles(article, 4);

            console.log(`\n=== СРАВНЕНИЕ АЛГОРИТМОВ ===`);
            console.log(`Статья: "${article.title}"`);
            
            console.log(`\n--- СТАРЫЙ АЛГОРИТМ ---`);
            oldResults.forEach((related, index) => {
                console.log(`${index + 1}. "${related.title}"`);
            });

            console.log(`\n--- НОВЫЙ АЛГОРИТМ ---`);
            newResults.forEach((related, index) => {
                console.log(`${index + 1}. "${related.title}"`);
            });

            // Анализ различий
            const oldIds = new Set(oldResults.map(a => a.id));
            const newIds = new Set(newResults.map(a => a.id));
            
            const onlyInOld = oldResults.filter(a => !newIds.has(a.id));
            const onlyInNew = newResults.filter(a => !oldIds.has(a.id));

            if (onlyInOld.length > 0) {
                console.log(`\n--- ТОЛЬКО В СТАРОМ ---`);
                onlyInOld.forEach(a => console.log(`- "${a.title}"`));
            }

            if (onlyInNew.length > 0) {
                console.log(`\n--- ТОЛЬКО В НОВОМ ---`);
                onlyInNew.forEach(a => console.log(`- "${a.title}"`));
            }

            return { oldResults, newResults };

        } catch (error) {
            console.error('Ошибка при сравнении:', error);
        }
    }
}

// Делаем доступным в глобальной области
if (typeof window !== 'undefined') {
    window.RelatedArticlesDebugger = RelatedArticlesDebugger;
    
    // Создаем экземпляр для быстрого доступа
    window.relatedDebug = new RelatedArticlesDebugger();
    
    console.log('🔧 Related Articles Debugger загружен!');
    console.log('Используйте: relatedDebug.testArticle(ID) для тестирования');
    console.log('Или: relatedDebug.analyzeAll() для общего анализа');
} 