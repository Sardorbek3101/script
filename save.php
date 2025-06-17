<?php
date_default_timezone_set('Asia/Tashkent'); // или твоя зона

// Проверка данных
if (!isset($_POST['url']) || !isset($_POST['html'])) {
    http_response_code(400);
    echo "Missing url or html";
    exit;
}

$url = $_POST['url'];
$html = $_POST['html'];

// Генерация имени файла на основе времени и хеша
$timestamp = date("Y-m-d_H-i-s");
$hash = substr(sha1($url), 0, 8);
$filename = "saved_pages/page_{$timestamp}_{$hash}.html";

// Создание директории, если не существует
if (!is_dir("saved_pages")) {
    mkdir("saved_pages", 0777, true);
}

// Сохранение HTML
file_put_contents($filename, $html);

// (опционально) лог
file_put_contents("saved_pages/log.txt", "$timestamp | $url -> $filename\n", FILE_APPEND);

echo "✅ Saved to $filename";
