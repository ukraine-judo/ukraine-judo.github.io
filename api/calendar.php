<?php
/**
 * Calendar API для FJU (Федерации Дзюдо Украины)
 * 
 * Обеспечивает безопасный доступ к календарным данным
 * через POST запросы с временными токенами
 */

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

// Обработка OPTIONS запроса
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Только POST запросы
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Получение JSON данных
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit();
}

// Проверка токена
if (!isset($data['token'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Token required']);
    exit();
}

// Простая хеш-функция для совместимости с JavaScript
function simpleHash($str) {
    $hash = 0;
    $len = strlen($str);
    
    for ($i = 0; $i < $len; $i++) {
        $char = ord($str[$i]);
        $hash = (($hash << 5) - $hash) + $char;
        $hash = $hash & 0xFFFFFFFF; // 32-битное число
    }
    
    return dechex(abs($hash));
}

// Валидация токена
$currentHour = date('Y-m-d-H');
$expectedToken = simpleHash('fju_calendar_' . $currentHour);
$previousHour = date('Y-m-d-H', strtotime('-1 hour'));
$previousToken = simpleHash('fju_calendar_' . $previousHour);

if ($data['token'] !== $expectedToken && $data['token'] !== $previousToken) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid token']);
    exit();
}

// Проверка referer (опционально)
$allowedDomains = [
    'localhost',
    '127.0.0.1',
    'motoshfq.github.io',
    'ukrainejudo.com',
    'www.ukrainejudo.com'
];

$referer = $_SERVER['HTTP_REFERER'] ?? '';
$refererValid = false;

foreach ($allowedDomains as $domain) {
    if (strpos($referer, $domain) !== false) {
        $refererValid = true;
        break;
    }
}

// В локальной разработке не проверяем referer
if (!$refererValid && !in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1'])) {
    // Пропускаем для совместимости, но логируем
    error_log('Calendar API: Invalid referer - ' . $referer);
}

// Загрузка данных календаря
$calendarFile = __DIR__ . '/calendar/db.json';

if (!file_exists($calendarFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Calendar data not found']);
    exit();
}

$calendarData = json_decode(file_get_contents($calendarFile), true);

if (!$calendarData) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid calendar data']);
    exit();
}

// Обработка запросов
$action = $data['action'] ?? '';

try {
    switch ($action) {
        case 'getFullData':
            // Возвращаем все данные календаря
            echo json_encode([
                'success' => true,
                'data' => $calendarData
            ]);
            break;
            
        case 'getEvents':
            // Получение событий с фильтром
            $filter = $data['filter'] ?? 'all';
            $events = getAllEvents($calendarData);
            
            if ($filter !== 'all') {
                $events = array_filter($events, function($event) use ($filter) {
                    return $event['category'] === $filter;
                });
                $events = array_values($events); // Переиндексация
            }
            
            echo json_encode([
                'success' => true,
                'data' => $events
            ]);
            break;
            
        case 'getEventById':
            // Получение события по ID
            $eventId = intval($data['id'] ?? 0);
            $event = getEventById($calendarData, $eventId);
            
            if ($event) {
                echo json_encode([
                    'success' => true,
                    'data' => $event
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Event not found']);
            }
            break;
            
        case 'getEventsByMonth':
            // Получение событий по месяцу
            $year = intval($data['year'] ?? date('Y'));
            $month = intval($data['month'] ?? (date('n') - 1)); // 0-индексация
            
            $events = getEventsByMonth($calendarData, $year, $month);
            
            echo json_encode([
                'success' => true,
                'data' => $events
            ]);
            break;
            
        case 'getUpcomingEvents':
            // Получение предстоящих событий
            $limit = intval($data['limit'] ?? 5);
            $events = getUpcomingEvents($calendarData, $limit);
            
            echo json_encode([
                'success' => true,
                'data' => $events
            ]);
            break;
            
        case 'getCategories':
            // Получение категорий
            echo json_encode([
                'success' => true,
                'data' => $calendarData['categories'] ?? []
            ]);
            break;
            
        case 'getStatuses':
            // Получение статусов
            echo json_encode([
                'success' => true,
                'data' => $calendarData['statuses'] ?? []
            ]);
            break;
            
        case 'getAgeGroups':
            // Получение возрастных групп
            echo json_encode([
                'success' => true,
                'data' => $calendarData['ageGroups'] ?? []
            ]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

// Вспомогательные функции
function getAllEvents($calendarData) {
    $allEvents = [];
    
    if (isset($calendarData['months'])) {
        foreach ($calendarData['months'] as $month) {
            if (isset($month['events'])) {
                $allEvents = array_merge($allEvents, $month['events']);
            }
        }
    }
    
    return $allEvents;
}

function getEventById($calendarData, $eventId) {
    if (!isset($calendarData['months'])) {
        return null;
    }
    
    foreach ($calendarData['months'] as $month) {
        if (isset($month['events'])) {
            foreach ($month['events'] as $event) {
                if ($event['id'] === $eventId) {
                    return $event;
                }
            }
        }
    }
    
    return null;
}

function getEventsByMonth($calendarData, $year, $month) {
    $monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
    ];
    
    if ($month < 0 || $month >= 12) {
        return [];
    }
    
    $monthKey = $monthNames[$month];
    
    if (!isset($calendarData['months'][$monthKey]['events'])) {
        return [];
    }
    
    $events = $calendarData['months'][$monthKey]['events'];
    
    // Фильтруем по году
    return array_values(array_filter($events, function($event) use ($year) {
        $eventDate = new DateTime($event['date']);
        return $eventDate->format('Y') == $year;
    }));
}

function getUpcomingEvents($calendarData, $limit = 5) {
    $allEvents = getAllEvents($calendarData);
    $now = new DateTime();
    
    // Фильтруем предстоящие события
    $upcomingEvents = array_filter($allEvents, function($event) use ($now) {
        $eventDate = new DateTime($event['date']);
        return $eventDate >= $now;
    });
    
    // Сортируем по дате
    usort($upcomingEvents, function($a, $b) {
        return strtotime($a['date']) - strtotime($b['date']);
    });
    
    // Ограничиваем количество
    return array_slice($upcomingEvents, 0, $limit);
}

// Добавляем небольшую задержку для защиты от spam
usleep(100000); // 100ms
?>