<?php
declare(strict_types=1);

/**
 * TRIÈDRE — Test direct de tarification Postes Canada
 * TEST UNIQUEMENT : obtient un jeton OAuth puis demande des tarifs.
 * Ne crée aucun envoi et n'achète aucune étiquette.
 */

header('Content-Type: text/html; charset=utf-8');

$config = require __DIR__ . '/config.php';

$clientId     = trim((string)($config['CANADA_POST_TEST_API_KEY'] ?? ''));
$clientSecret = trim((string)($config['CANADA_POST_TEST_API_SECRET'] ?? ''));

function h(string $v): string {
    return htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function apiPost(string $url, array $headers, string $body): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => $body,
    ]);
    $response = curl_exec($ch);
    $error = curl_error($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $type = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    curl_close($ch);
    return [$status, $response, $error, $type];
}

echo '<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TRIÈDRE — Tarifs Postes Canada</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#111;color:#eee;margin:0;padding:28px}
main{max-width:850px;margin:auto;background:#1b1b1b;border:1px solid #333;border-radius:16px;padding:28px}
h1{margin-top:0}.ok{color:#70d68a}.err{color:#ff8585}.muted{color:#aaa}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
label{display:block;color:#bbb;font-size:.9rem}input{width:100%;box-sizing:border-box;margin-top:5px;padding:11px;border-radius:8px;border:1px solid #555;background:#111;color:#fff}
button{margin-top:18px;padding:12px 18px;border:0;border-radius:9px;font-weight:700;cursor:pointer}
pre{white-space:pre-wrap;background:#0d0d0d;padding:16px;border-radius:10px;overflow:auto}
table{width:100%;border-collapse:collapse;margin-top:18px}th,td{text-align:left;padding:10px;border-bottom:1px solid #333}
@media(max-width:650px){.grid{grid-template-columns:1fr}}
</style></head><body><main>';

echo '<h1>TRIÈDRE × Postes Canada</h1>';
echo '<p class="muted">Tarification TEST uniquement — aucune étiquette, aucun achat.</p>';

if ($clientId === '' || $clientSecret === '') {
    echo '<h2 class="err">Identifiants TEST absents de config.php.</h2></main></body></html>';
    exit;
}

$origin = strtoupper(str_replace(' ', '', trim((string)($_POST['origin'] ?? ''))));
$destination = strtoupper(str_replace(' ', '', trim((string)($_POST['destination'] ?? ''))));

echo '<form method="post"><div class="grid">
<label>Code postal d’origine<input name="origin" required maxlength="7" value="'.h($origin).'"></label>
<label>Code postal de destination<input name="destination" required maxlength="7" value="'.h($destination).'"></label>
<label>Poids total (kg)<input name="weight" type="number" step="0.0001" min="0.001" value="'.h((string)($_POST['weight'] ?? '0.3791')).'"></label>
<label>Longueur (cm)<input name="length" type="number" step="0.1" min="0.1" value="'.h((string)($_POST['length'] ?? '33.0')).'"></label>
<label>Largeur (cm)<input name="width" type="number" step="0.1" min="0.1" value="'.h((string)($_POST['width'] ?? '25.4')).'"></label>
<label>Hauteur (cm)<input name="height" type="number" step="0.1" min="0.1" value="'.h((string)($_POST['height'] ?? '5.1')).'"></label>
</div><button type="submit">Obtenir les tarifs TEST</button></form>';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo '</main></body></html>';
    exit;
}

$weight = (float)($_POST['weight'] ?? 0);
$length = (float)($_POST['length'] ?? 0);
$width  = (float)($_POST['width'] ?? 0);
$height = (float)($_POST['height'] ?? 0);

if ($origin === '' || $destination === '' || $weight <= 0 || $length <= 0 || $width <= 0 || $height <= 0) {
    echo '<h2 class="err">Données du colis incomplètes.</h2></main></body></html>';
    exit;
}

/* 1. Jeton OAuth */
$tokenUrl = 'https://api.canadapost-postescanada.ca/prod/devportal-portaildesdeveloppeurs/cpc-api-native-oauth-provider/oauth2/token';
$tokenBody = http_build_query([
    'grant_type' => 'client_credentials',
    'client_id' => $clientId,
    'client_secret' => $clientSecret,
    'scope' => 'merchant',
], '', '&', PHP_QUERY_RFC3986);

[$tokenStatus, $tokenResponse, $tokenError] = apiPost($tokenUrl, [
    'Accept: application/json',
    'Content-Type: application/x-www-form-urlencoded',
    'User-Agent: Triedre-Ecommerce/1.0',
], $tokenBody);

$tokenData = json_decode((string)$tokenResponse, true);
$accessToken = is_array($tokenData) ? (string)($tokenData['access_token'] ?? '') : '';

if ($tokenStatus < 200 || $tokenStatus >= 300 || $accessToken === '') {
    echo '<h2 class="err">❌ OAuth refusé — HTTP '.h((string)$tokenStatus).'</h2>';
    echo '<pre>'.h($tokenError ?: 'Impossible d’obtenir le jeton OAuth.').'</pre></main></body></html>';
    exit;
}

/* 2. Demande de tarifs — aucune création d'envoi */
$ratingUrl = 'https://api.canadapost-postescanada.ca/prod/devportal-portaildesdeveloppeurs/rating/v1/prices';

$payload = [
    'originPostalCode' => $origin,
    'services' => [
        'DOM.RP', // Colis standard
        'DOM.EP', // Colis accélérés
        'DOM.PC', // Priorité
        'DOM.XP', // Xpresspost
    ],
    'parcelCharacteristics' => [
        'weight' => $weight,
        'dimensions' => [
            'length' => $length,
            'width' => $width,
            'height' => $height,
        ],
    ],
    'destination' => [
        'domestic' => [
            'postalCode' => $destination,
        ],
    ],
];

$json = json_encode($payload, JSON_UNESCAPED_SLASHES);

[$rateStatus, $rateResponse, $rateError, $rateType] = apiPost($ratingUrl, [
    'Authorization: Bearer '.$accessToken,
    'Accept: application/json',
    'Content-Type: application/json',
    'Accept-Language: fr-CA',
    'User-Agent: Triedre-Ecommerce/1.0',
], (string)$json);

echo '<h2 class="'.(($rateStatus >= 200 && $rateStatus < 300) ? 'ok' : 'err').'">';
echo (($rateStatus >= 200 && $rateStatus < 300) ? '✅ Réponse de tarification' : '❌ Tarification refusée');
echo ' — HTTP '.h((string)$rateStatus).'</h2>';

if ($rateError !== '') {
    echo '<pre>'.h($rateError).'</pre>';
} else {
    $decoded = json_decode((string)$rateResponse, true);

    if ($rateStatus >= 200 && $rateStatus < 300 && is_array($decoded)) {
        // La réponse Rating est une liste de services.
        $rates = array_is_list($decoded) ? $decoded : ($decoded['rates'] ?? $decoded['services'] ?? []);

        if (is_array($rates) && count($rates) > 0) {
            echo '<table><thead><tr><th>Service</th><th>Tarif</th><th>Délai estimé</th></tr></thead><tbody>';

            foreach ($rates as $rate) {
                if (!is_array($rate)) continue;

                $service = (string)($rate['service-name'] ?? $rate['serviceName'] ?? $rate['serviceCode'] ?? '—');

                $priceDetails = $rate['price-details'] ?? $rate['priceDetails'] ?? [];
                $amount = null;
                if (is_array($priceDetails)) {
                    $amount = $priceDetails['due'] ?? $priceDetails['total'] ?? null;
                }
                $amount ??= $rate['due'] ?? $rate['price'] ?? $rate['totalPrice'] ?? null;

                $standard = $rate['serviceStandard'] ?? $rate['service-standard'] ?? [];
                $days = null;
                if (is_array($standard)) {
                    $days = $standard['expectedTransitTime'] ?? $standard['expected-transit-time'] ?? null;
                }
                $days ??= $rate['expectedTransitTime'] ?? $rate['expected-transit-time'] ?? null;

                $priceText = is_numeric($amount)
                    ? number_format((float)$amount, 2, ',', ' ') . ' $'
                    : '—';

                $daysText = is_numeric($days)
                    ? ((int)$days . (((int)$days === 1) ? ' jour' : ' jours'))
                    : '—';

                echo '<tr><td>'.h($service).'</td><td>'.h($priceText).'</td><td>'.h($daysText).'</td></tr>';
            }

            echo '</tbody></table>';
        } else {
            echo '<p class="err">La réponse est valide, mais aucun tarif exploitable n’a été trouvé.</p>';
            echo '<pre>'.h((string)json_encode($decoded, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)).'</pre>';
        }
    } else {
        echo '<pre>'.h(is_array($decoded)
            ? (string)json_encode($decoded, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)
            : (string)$rateResponse
        ).'</pre>';
    }
}

echo '</main></body></html>';
