<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Простая защита - разрешаем только POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Простая защита - проверяем referer
$allowed_domains = [
    'localhost', 
    '127.0.0.1', 
    'fju.local',
    'motoshfq.github.io',           // GitHub Pages (разработка)
    'ukrainejudo.com',              // Основной домен (продакшн)
    'www.ukrainejudo.com'           // WWW версия основного домена
];
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$is_valid_referer = false;

foreach ($allowed_domains as $domain) {
    if (strpos($referer, $domain) !== false) {
        $is_valid_referer = true;
        break;
    }
}

if (!$is_valid_referer && !empty($referer)) {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit;
}

// Получаем POST данные
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['action'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$action = $input['action'];
$articles_dir = 'articles/';

// Простая защита - проверяем токен времени (валиден 1 час)
$provided_token = $input['token'] ?? '';
$current_hour = date('YmdH');
$valid_token = md5('fju_news_' . $current_hour);

if ($provided_token !== $valid_token) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token']);
    exit;
}

switch ($action) {
    case 'list':
        // Получаем список всех статей
        $articles = [];
        
        // Сканируем директорию на наличие JSON файлов
        for ($i = 1; $i <= 50; $i++) {
            $file_path = $articles_dir . $i . '.json';
            if (file_exists($file_path)) {
                $content = file_get_contents($file_path);
                $article = json_decode($content, true);
                
                if ($article && validateArticle($article)) {
                    $articles[] = $article;
                }
            }
        }
        
        // Сортируем по дате публикации
        usort($articles, function($a, $b) {
            return strtotime($b['publishedAt']) - strtotime($a['publishedAt']);
        });
        
        echo json_encode([
            'success' => true,
            'data' => $articles,
            'count' => count($articles)
        ]);
        break;
        
    case 'get':
        // Получаем конкретную статью
        $id = intval($input['id'] ?? 0);
        
        if ($id < 1 || $id > 50) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid article ID']);
            exit;
        }
        
        $file_path = $articles_dir . $id . '.json';
        
        if (!file_exists($file_path)) {
            http_response_code(404);
            echo json_encode(['error' => 'Article not found']);
            exit;
        }
        
        $content = file_get_contents($file_path);
        $article = json_decode($content, true);
        
        if (!$article || !validateArticle($article)) {
            http_response_code(500);
            echo json_encode(['error' => 'Invalid article data']);
            exit;
        }
        
        echo json_encode([
            'success' => true,
            'data' => $article
        ]);
        break;
        
    case 'related':
        // Получаем связанные статьи
        $id = intval($input['id'] ?? 0);
        $limit = intval($input['limit'] ?? 3);
        
        if ($id < 1) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid article ID']);
            exit;
        }
        
        // Загружаем основную статью
        $main_file = $articles_dir . $id . '.json';
        if (!file_exists($main_file)) {
            http_response_code(404);
            echo json_encode(['error' => 'Article not found']);
            exit;
        }
        
        $main_article = json_decode(file_get_contents($main_file), true);
        $related_articles = [];
        
        // Ищем связанные статьи
        if (isset($main_article['related']) && is_array($main_article['related'])) {
            foreach ($main_article['related'] as $related_id) {
                $related_file = $articles_dir . $related_id . '.json';
                if (file_exists($related_file)) {
                    $article = json_decode(file_get_contents($related_file), true);
                    if ($article && validateArticle($article)) {
                        $related_articles[] = $article;
                    }
                }
            }
        }
        
        // Если связанных статей мало, добавляем из той же категории
        if (count($related_articles) < $limit) {
            for ($i = 1; $i <= 50 && count($related_articles) < $limit; $i++) {
                if ($i === $id) continue;
                
                $file_path = $articles_dir . $i . '.json';
                if (file_exists($file_path)) {
                    $article = json_decode(file_get_contents($file_path), true);
                    if ($article && 
                        validateArticle($article) && 
                        $article['category'] === $main_article['category'] &&
                        !in_array($article, $related_articles)) {
                        $related_articles[] = $article;
                    }
                }
            }
        }
        
        echo json_encode([
            'success' => true,
            'data' => array_slice($related_articles, 0, $limit)
        ]);
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Unknown action']);
        exit;
}

function validateArticle($article) {
    $required_fields = ['id', 'title', 'excerpt', 'content', 'category', 'publishedAt'];
    
    foreach ($required_fields as $field) {
        if (!isset($article[$field]) || empty($article[$field])) {
            return false;
        }
    }
    
    // Проверяем валидность даты
    if (!strtotime($article['publishedAt'])) {
        return false;
    }
    
    return true;
}
?> 