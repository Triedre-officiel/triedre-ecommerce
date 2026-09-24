<?php
declare(strict_types=1);

/*
 * TRIÈDRE — Diagnostic Postes Canada LIVE / POST /prices
 *
 * Deux appels avec le même OAuth et le même colis :
 * A) counter    : sans customerNumber
 * B) commercial : avec CANADA_POST_CUSTOMER_NUMBER
 *
 * Aucun achat d'étiquette, aucune commande, aucune modification de données.
 */

header('Content-Type: application/json; charset=utf-8');

$configPath = __DIR__ . '/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'etape'=>'configuration','message'=>'config.php introuvable.'], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
    exit;
}

$config = require $configPath;

$clientId       = trim((string)($config['CANADA_POST_LIVE_API_KEY'] ?? ''));
$clientSecret   = trim((string)($config['CANADA_POST_LIVE_API_SECRET'] ?? ''));
$customerNumber = trim((string)($config['CANADA_POST_CUSTOMER_NUMBER'] ?? ''));
$originPostal   = strtoupper(str_replace(' ', '', trim((string)($config['CANADA_POST_ORIGIN_POSTAL_CODE'] ?? ''))));

if ($clientId === '' || $clientSecret === '' || $customerNumber === '' || $originPostal === '') {
    http_response_code(500);
    echo json_encode([
        'ok'=>false,
        'etape'=>'configuration',
        'message'=>'Une configuration Postes Canada LIVE requise est absente.'
    ], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
    exit;
}

$tokenUrl = 'https://api.canadapost-postescanada.ca/prod/devportal-portaildesdeveloppeurs/cpc-api-native-oauth-provider/oauth2/token';
$pricesUrl = 'https://api.canadapost-postescanada.ca/prod/devportal-portaildesdeveloppeurs/rating/v1/prices';

/* OAuth LIVE */
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
$tokenErr  = curl_error($ch);
curl_close($ch);

$tokenJson = is_string($tokenBody) ? json_decode($tokenBody, true) : null;
$accessToken = is_array($tokenJson) ? trim((string)($tokenJson['access_token'] ?? '')) : '';

if ($tokenErr !== '' || $tokenHttp < 200 || $tokenHttp >= 300 || $accessToken === '') {
    http_response_code(502);
    echo json_encode([
        'ok'=>false,
        'etape'=>'oauth',
        'http'=>$tokenHttp,
        'message'=>'Impossible d’obtenir le jeton LIVE.',
        'curl_error'=>$tokenErr,
        'provider'=>is_array($tokenJson) ? $tokenJson : $tokenBody
    ], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
    exit;
}

/*
 * Même scénario de colis pour A et B.
 * Destination documentaire de Postes Canada : K1K1K1.
 * Poids/dimensions respectent le schéma Rating.
 */
$base = [
    'originPostalCode' => $originPostal,
    'parcelCharacteristics' => [
        'weight' => '0.380',
        'dimensions' => [
            'length' => 33.0,
            'width'  => 25.4,
            'height' => 5.1
        ]
    ],
    'destination' => [
        'domestic' => [
            'postalCode' => 'K1K1K1'
        ]
    ]
];

function appelerPrices(string $url, string $token, array $payload): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'Accept: application/json',
            'Accept-Language: fr-CA',
            'Content-Type: application/json',
            'User-Agent: Triedre-Ecommerce/1.0'
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)
    ]);

    $body = curl_exec($ch);
    $http = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);

    $decoded = is_string($body) ? json_decode($body, true) : null;

    return [
        'http' => $http,
        'curl_error' => $err !== '' ? $err : null,
        'provider' => is_array($decoded) ? $decoded : $body
    ];
}

/* A — tarif comptoir : aucun numéro client */
$payloadA = $base;
$payloadA['quoteType'] = 'counter';

/* B — tarif commercial SFSB : numéro client, aucun contractId */
$payloadB = $base;
$payloadB['customerNumber'] = $customerNumber;
$payloadB['quoteType'] = 'commercial';

$resultA = appelerPrices($pricesUrl, $accessToken, $payloadA);
$resultB = appelerPrices($pricesUrl, $accessToken, $payloadB);

echo json_encode([
    'ok' => true,
    'oauth' => 'OK',
    'endpoint' => 'POST /rating/v1/prices',
    'diagnostic_A_counter_sans_customerNumber' => $resultA,
    'diagnostic_B_commercial_avec_customerNumber' => $resultB,
    'secrets_affiches' => false
], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
