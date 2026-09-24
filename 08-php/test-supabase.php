<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

$config = require __DIR__ . '/config.php';

$url = rtrim($config['supabase_url'] ?? '', '/');
$key = $config['supabase_secret_key'] ?? '';

if ($url === '' || $key === '') {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Configuration Supabase manquante.'
    ]);

    exit;
}

$endpoint =
    $url .
    '/rest/v1/product_variants' .
    '?select=product_id,variant_id,sku,color,size,price,currency,stock,active,image_url' .
    '&active=eq.true' .
    '&order=stock.desc' .
    '&limit=10';

$curl = curl_init($endpoint);

curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'apikey: ' . $key,
        'Authorization: Bearer ' . $key,
        'Accept: application/json',
    ],
    CURLOPT_TIMEOUT => 15,
]);

$response = curl_exec($curl);

if ($response === false) {
    echo json_encode([
        'success' => false,
        'message' => curl_error($curl)
    ]);

    curl_close($curl);
    exit;
}

$status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);

curl_close($curl);

http_response_code($status);

echo json_encode([
    'success' => $status >= 200 && $status < 300,
    'http_status' => $status,
    'supabase_response' => json_decode($response, true)
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);