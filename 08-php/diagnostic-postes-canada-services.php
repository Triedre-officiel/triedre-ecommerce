<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'etape'=>'configuration','message'=>'config.php introuvable.'], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
    exit;
}
$config = require $configPath;

$clientId = trim((string)($config['CANADA_POST_LIVE_API_KEY'] ?? ''));
$clientSecret = trim((string)($config['CANADA_POST_LIVE_API_SECRET'] ?? ''));
if ($clientId === '' || $clientSecret === '') {
    http_response_code(500);
    echo json_encode(['ok'=>false,'etape'=>'configuration','message'=>'Identifiants LIVE Postes Canada absents.'], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
    exit;
}

$tokenUrl = 'https://api.canadapost-postescanada.ca/prod/devportal-portaildesdeveloppeurs/cpc-api-native-oauth-provider/oauth2/token';
$servicesUrl = 'https://api.canadapost-postescanada.ca/prod/devportal-portaildesdeveloppeurs/rating/v1/services?country=CA';

$ch = curl_init($tokenUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Content-Type: application/x-www-form-urlencoded',
        'User-Agent: Triedre-Ecommerce/1.0'
    ],
    CURLOPT_POSTFIELDS => http_build_query([
        'grant_type'=>'client_credentials',
        'client_id'=>$clientId,
        'client_secret'=>$clientSecret,
        'scope'=>'merchant'
    ], '', '&', PHP_QUERY_RFC3986)
]);
$tokenBody = curl_exec($ch);
$tokenHttp = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$tokenCurlError = curl_error($ch);
curl_close($ch);

if ($tokenBody === false || $tokenCurlError !== '') {
    http_response_code(502);
    echo json_encode(['ok'=>false,'etape'=>'oauth','http'=>$tokenHttp,'message'=>'Erreur réseau OAuth.','curl_error'=>$tokenCurlError], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
    exit;
}

$tokenJson = json_decode($tokenBody, true);
$accessToken = is_array($tokenJson) ? trim((string)($tokenJson['access_token'] ?? '')) : '';
if ($tokenHttp < 200 || $tokenHttp >= 300 || $accessToken === '') {
    http_response_code(502);
    echo json_encode(['ok'=>false,'etape'=>'oauth','http'=>$tokenHttp,'message'=>'Jeton LIVE refusé ou absent.','provider'=>is_array($tokenJson)?$tokenJson:$tokenBody], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
    exit;
}

$ch = curl_init($servicesUrl);
curl_setopt_array($ch, [
    CURLOPT_HTTPGET => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $accessToken,
        'Accept: application/json',
        'Accept-Language: fr-CA',
        'User-Agent: Triedre-Ecommerce/1.0'
    ]
]);
$body = curl_exec($ch);
$http = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($body === false || $curlError !== '') {
    http_response_code(502);
    echo json_encode(['ok'=>false,'etape'=>'discover_services','oauth'=>'OK','http'=>$http,'message'=>'Erreur réseau Discover Services.','curl_error'=>$curlError], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
    exit;
}

$decoded = json_decode($body, true);
echo json_encode([
    'ok'=>$http >= 200 && $http < 300,
    'etape'=>'discover_services',
    'oauth'=>'OK',
    'http'=>$http,
    'endpoint'=>'GET /rating/v1/services?country=CA',
    'provider'=>json_last_error() === JSON_ERROR_NONE ? $decoded : $body
], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
