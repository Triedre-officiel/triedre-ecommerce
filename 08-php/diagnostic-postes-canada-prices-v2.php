<?php
declare(strict_types=1);

/*
 * TRIÈDRE — Diagnostic Postes Canada LIVE / POST /prices — V2
 *
 * A) counter, sans customerNumber
 * B) commercial, avec CANADA_POST_CUSTOMER_NUMBER
 *
 * Corrections V2 :
 * - weight est envoyé comme NOMBRE (0.380), pas comme chaîne.
 * - originPostalCode est normalisé (espaces/tirets retirés, majuscules)
 *   et validé AVANT l'appel API.
 *
 * Aucun achat d'étiquette. Aucune commande. Aucune modification de données.
 */

header('Content-Type: application/json; charset=utf-8');

function sortie(array $data, int $http = 200): never {
    http_response_code($http);
    echo json_encode(
        $data,
        JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}

function normaliserCodePostal(string $value): string {
    return strtoupper((string)preg_replace('/[^A-Za-z0-9]/', '', trim($value)));
}

$configPath = __DIR__ . '/config.php';

if (!is_file($configPath)) {
    sortie([
        'ok' => false,
        'etape' => 'configuration',
        'message' => 'config.php introuvable.'
    ], 500);
}

$config = require $configPath;

$clientId       = trim((string)($config['CANADA_POST_LIVE_API_KEY'] ?? ''));
$clientSecret   = trim((string)($config['CANADA_POST_LIVE_API_SECRET'] ?? ''));
$customerNumber = trim((string)($config['CANADA_POST_CUSTOMER_NUMBER'] ?? ''));
$originPostal   = normaliserCodePostal(
    (string)($config['CANADA_POST_ORIGIN_POSTAL_CODE'] ?? '')
);

if ($clientId === '' || $clientSecret === '' || $customerNumber === '') {
    sortie([
        'ok' => false,
        'etape' => 'configuration',
        'message' => 'Une configuration Postes Canada LIVE requise est absente.'
    ], 500);
}

/*
 * Format canadien attendu : A1A1A1
 * On ne montre PAS le code postal dans la sortie.
 */
if (!preg_match('/^[A-Z][0-9][A-Z][0-9][A-Z][0-9]$/', $originPostal)) {
    sortie([
        'ok' => false,
        'etape' => 'configuration',
        'champ' => 'CANADA_POST_ORIGIN_POSTAL_CODE',
        'message' => 'Le code postal d’origine enregistré dans config.php n’est pas un code postal canadien valide au format A1A1A1.',
        'valeur_affichee' => false
    ], 500);
}

$tokenUrl =
    'https://api.canadapost-postescanada.ca/prod/' .
    'devportal-portaildesdeveloppeurs/' .
    'cpc-api-native-oauth-provider/oauth2/token';

$pricesUrl =
    'https://api.canadapost-postescanada.ca/prod/' .
    'devportal-portaildesdeveloppeurs/rating/v1/prices';

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
        'grant_type' => 'client_credentials',
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'scope' => 'merchant'
    ], '', '&', PHP_QUERY_RFC3986)
]);

$tokenBody = curl_exec($ch);
$tokenHttp = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$tokenErr  = curl_error($ch);

curl_close($ch);

$tokenJson = is_string($tokenBody) ? json_decode($tokenBody, true) : null;
$accessToken = is_array($tokenJson)
    ? trim((string)($tokenJson['access_token'] ?? ''))
    : '';

if (
    $tokenErr !== '' ||
    $tokenHttp < 200 ||
    $tokenHttp >= 300 ||
    $accessToken === ''
) {
    sortie([
        'ok' => false,
        'etape' => 'oauth',
        'http' => $tokenHttp,
        'message' => 'Impossible d’obtenir le jeton LIVE.',
        'curl_error' => $tokenErr !== '' ? $tokenErr : null,
        'provider' => is_array($tokenJson) ? $tokenJson : $tokenBody
    ], 502);
}

/*
 * Scénario identique A/B.
 * 0.380 est un FLOAT PHP : JSON l'envoie donc comme nombre.
 * Destination K1K1K1 = valeur de démonstration utilisée dans la doc Rating.
 */
$base = [
    'originPostalCode' => $originPostal,
    'parcelCharacteristics' => [
        'weight' => 0.380,
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
    $json = json_encode(
        $payload,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES |
        JSON_PRESERVE_ZERO_FRACTION
    );

    if ($json === false) {
        return [
            'http' => 0,
            'curl_error' => null,
            'provider' => 'Impossible d’encoder le payload JSON.'
        ];
    }

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
        CURLOPT_POSTFIELDS => $json
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

/* A — tarif comptoir : aucun customerNumber */
$payloadA = $base;
$payloadA['quoteType'] = 'counter';

/* B — Solutions petites entreprises : customerNumber, sans contractId */
$payloadB = $base;
$payloadB['customerNumber'] = $customerNumber;
$payloadB['quoteType'] = 'commercial';

$resultA = appelerPrices($pricesUrl, $accessToken, $payloadA);
$resultB = appelerPrices($pricesUrl, $accessToken, $payloadB);

sortie([
    'ok' => true,
    'version_diagnostic' => 2,
    'oauth' => 'OK',
    'origin_postal_code_validation' => 'OK',
    'endpoint' => 'POST /rating/v1/prices',
    'diagnostic_A_counter_sans_customerNumber' => $resultA,
    'diagnostic_B_commercial_avec_customerNumber' => $resultB,
    'secrets_affiches' => false
]);
