<?php
declare(strict_types=1);

/*
 * TRIÈDRE — Tarifs Postes Canada LIVE
 * Reçoit le vrai panier + l'adresse du checkout.
 * Calcule le colis côté serveur puis demande les tarifs LIVE.
 * N'achète aucune étiquette.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function sortir(int $code, array $data): never {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sortir(405, ['success' => false, 'error' => 'Méthode non autorisée.']);
}

$root = dirname(__DIR__);
$configFile = __DIR__ . '/config.php';
$catalogueFile = $root . '/04-data/produits.json';

if (!is_file($configFile) || !is_file($catalogueFile)) {
    sortir(500, ['success' => false, 'error' => 'Configuration serveur incomplète.']);
}

$config = require $configFile;

$clientId = trim((string)($config['CANADA_POST_LIVE_API_KEY'] ?? ''));
$clientSecret = trim((string)($config['CANADA_POST_LIVE_API_SECRET'] ?? ''));
$customerNumber = trim((string)($config['CANADA_POST_CUSTOMER_NUMBER'] ?? ''));

/*
 * Le code postal d'origine reste côté serveur.
 * Si cette clé n'existe pas encore dans config.php, ajoute-la sans envoyer sa valeur dans le chat.
 */
$originPostalCode = strtoupper(preg_replace('/\s+/', '', trim((string)($config['CANADA_POST_ORIGIN_POSTAL_CODE'] ?? ''))));

if ($clientId === '' || $clientSecret === '' || $customerNumber === '' || $originPostalCode === '') {
    sortir(500, [
        'success' => false,
        'error' => 'Configuration Postes Canada LIVE incomplète.'
    ]);
}

$input = json_decode((string)file_get_contents('php://input'), true);
if (!is_array($input)) {
    sortir(400, ['success' => false, 'error' => 'Données JSON invalides.']);
}

$client = $input['client'] ?? [];
$panier = $input['panier'] ?? [];

if (!is_array($client) || !is_array($panier) || $panier === []) {
    sortir(400, ['success' => false, 'error' => 'Adresse ou panier invalide.']);
}

$pays = strtoupper(trim((string)($client['pays'] ?? '')));
$destinationPostal = strtoupper(preg_replace('/\s+/', '', trim((string)($client['code_postal'] ?? ''))));

if ($pays !== 'CA') {
    sortir(422, ['success' => false, 'error' => 'Cette première intégration Postes Canada couvre le Canada.']);
}

if (!preg_match('/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/i', $destinationPostal)) {
    sortir(422, ['success' => false, 'error' => 'Code postal canadien invalide.']);
}

/* Catalogue SKU -> poids */
$catalogue = json_decode((string)file_get_contents($catalogueFile), true);
if (!is_array($catalogue) || !isset($catalogue['produits']) || !is_array($catalogue['produits'])) {
    sortir(500, ['success' => false, 'error' => 'Catalogue produits invalide.']);
}

$poidsSku = [];
foreach ($catalogue['produits'] as $produit) {
    if (!is_array($produit) || empty($produit['actif'])) continue;
    foreach ((array)($produit['variantes'] ?? []) as $variante) {
        if (!is_array($variante) || empty($variante['actif'])) continue;
        $sku = trim((string)($variante['sku'] ?? ''));
        $poids = $variante['poids_g'] ?? null;
        if ($sku !== '' && is_numeric($poids) && (float)$poids > 0) {
            $poidsSku[$sku] = (float)$poids;
        }
    }
}

$quantites = [];
foreach ($panier as $ligne) {
    if (!is_array($ligne)) sortir(400, ['success' => false, 'error' => 'Ligne panier invalide.']);
    $sku = trim((string)($ligne['sku'] ?? ''));
    $qte = filter_var($ligne['quantite'] ?? null, FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1, 'max_range' => 99]
    ]);
    if ($sku === '' || $qte === false) {
        sortir(400, ['success' => false, 'error' => 'SKU ou quantité invalide.']);
    }
    $quantites[$sku] = ($quantites[$sku] ?? 0) + (int)$qte;
}

$nombreArticles = 0;
$poidsProduitsG = 0.0;
foreach ($quantites as $sku => $qte) {
    if (!isset($poidsSku[$sku])) {
        sortir(422, ['success' => false, 'error' => 'Poids indisponible pour ' . $sku . '.']);
    }
    $nombreArticles += $qte;
    $poidsProduitsG += $poidsSku[$sku] * $qte;
}

if ($nombreArticles < 1 || $nombreArticles > 2) {
    sortir(422, [
        'success' => false,
        'error' => 'Emballage non encore défini pour ce nombre d’articles.'
    ]);
}

/* Emballage validé 1–2 articles */
$poidsTotalG = $poidsProduitsG + 9.1;
$poidsKg = ceil($poidsTotalG) / 1000;

/* OAuth LIVE */
$tokenUrl =
    'https://api.canadapost-postescanada.ca/prod/' .
    'devportal-portaildesdeveloppeurs/' .
    'cpc-api-native-oauth-provider/oauth2/token';

$ch = curl_init($tokenUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
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
    ])
]);

$tokenBody = curl_exec($ch);
$tokenHttp = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$tokenError = curl_error($ch);
curl_close($ch);

if ($tokenBody === false || $tokenHttp !== 200) {
    sortir(502, [
        'success' => false,
        'error' => 'Postes Canada : authentification LIVE indisponible.',
        'provider_http' => $tokenHttp,
        'provider_error' => $tokenError ?: null
    ]);
}

$tokenJson = json_decode((string)$tokenBody, true);
$accessToken = trim((string)($tokenJson['access_token'] ?? ''));

if ($accessToken === '') {
    sortir(502, ['success' => false, 'error' => 'Postes Canada : jeton OAuth absent.']);
}

/* Rating LIVE — schéma moderne REST/JSON */
$ratingUrl =
    'https://api.canadapost-postescanada.ca/prod/' .
    'devportal-portaildesdeveloppeurs/rating/v1/prices';

$payload = [
    'customerNumber' => $customerNumber,
    'quoteType' => 'commercial',
    'originPostalCode' => $originPostalCode,
    'parcelCharacteristics' => [
        'weight' => number_format($poidsKg, 3, '.', ''),
        'dimensions' => [
            'length' => 33.0,
            'width' => 25.4,
            'height' => 5.1
        ]
    ],
    'destination' => [
        'domestic' => [
            'postalCode' => $destinationPostal
        ]
    ]
];

$ch = curl_init($ratingUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Content-Type: application/json',
        'Authorization: Bearer ' . $accessToken,
        'User-Agent: Triedre-Ecommerce/1.0'
    ],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES)
]);

$body = curl_exec($ch);
$http = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($body === false || $http < 200 || $http >= 300) {
    $provider = json_decode((string)$body, true);

    sortir(502, [
        'success' => false,
        'error' => 'Postes Canada a refusé la tarification LIVE.',
        'provider_http' => $http,
        'provider' => is_array($provider) ? $provider : null,
        'provider_error' => $curlError ?: null
    ]);
}

$data = json_decode((string)$body, true);
if (!is_array($data)) {
    sortir(502, ['success' => false, 'error' => 'Réponse Postes Canada invalide.']);
}

/*
 * On renvoie la réponse fournisseur au checkout sans acheter de label.
 * Le JS pourra ensuite normaliser/afficher les services réellement retournés.
 */
sortir(200, [
    'success' => true,
    'colis' => [
        'nombre_articles' => $nombreArticles,
        'poids_total_g' => round($poidsTotalG, 1),
        'poids_total_kg' => number_format($poidsKg, 3, '.', ''),
        'dimensions_cm' => ['longueur' => 33.0, 'largeur' => 25.4, 'hauteur' => 5.1]
    ],
    'canada_post' => $data
]);
