<?php
declare(strict_types=1);

/*
 * TRIÈDRE — Diagnostic Postes Canada LIVE / POST /prices — V4
 * Saisie manuelle des codes postaux, comme l'ancien test.
 * A = counter sans customerNumber
 * B = commercial avec customerNumber
 * Aucun achat, aucune étiquette, aucune commande.
 */

$config = require __DIR__ . '/config.php';

function normPostal(string $v): string {
    return strtoupper((string)preg_replace('/[^A-Za-z0-9]/', '', trim($v)));
}

function apiCall(string $url, string $token, array $payload): array {
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);
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
    $err = curl_error($ch);
    curl_close($ch);
    $decoded = is_string($body) ? json_decode($body, true) : null;
    return [
        'http' => $http,
        'curl_error' => $err !== '' ? $err : null,
        'provider' => is_array($decoded) ? $decoded : $body
    ];
}

$result = null;
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $origin = normPostal((string)($_POST['origin'] ?? ''));
    $destination = normPostal((string)($_POST['destination'] ?? ''));

    if (!preg_match('/^[A-Z][0-9][A-Z][0-9][A-Z][0-9]$/', $origin) ||
        !preg_match('/^[A-Z][0-9][A-Z][0-9][A-Z][0-9]$/', $destination)) {
        $error = 'Les deux codes postaux doivent être au format canadien A1A1A1.';
    } else {
        $clientId = trim((string)($config['CANADA_POST_LIVE_API_KEY'] ?? ''));
        $clientSecret = trim((string)($config['CANADA_POST_LIVE_API_SECRET'] ?? ''));
        $customerNumber = trim((string)($config['CANADA_POST_CUSTOMER_NUMBER'] ?? ''));

        if ($clientId === '' || $clientSecret === '' || $customerNumber === '') {
            $error = 'Configuration LIVE Postes Canada incomplète.';
        } else {
            $tokenUrl = 'https://api.canadapost-postescanada.ca/prod/devportal-portaildesdeveloppeurs/cpc-api-native-oauth-provider/oauth2/token';
            $pricesUrl = 'https://api.canadapost-postescanada.ca/prod/devportal-portaildesdeveloppeurs/rating/v1/prices';

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
            $tokenErr = curl_error($ch);
            curl_close($ch);

            $tokenData = is_string($tokenBody) ? json_decode($tokenBody, true) : null;
            $token = is_array($tokenData) ? trim((string)($tokenData['access_token'] ?? '')) : '';

            if ($tokenErr !== '' || $tokenHttp < 200 || $tokenHttp >= 300 || $token === '') {
                $error = 'OAuth LIVE refusé (HTTP ' . $tokenHttp . ').';
            } else {
                $base = [
                    'originPostalCode' => $origin,
                    'parcelCharacteristics' => [
                        'weight' => 0.380,
                        'dimensions' => [
                            'length' => 33.0,
                            'width' => 25.4,
                            'height' => 5.1
                        ]
                    ],
                    'destination' => [
                        'domestic' => ['postalCode' => $destination]
                    ]
                ];

                $a = $base;
                $a['quoteType'] = 'counter';

                $b = $base;
                $b['customerNumber'] = $customerNumber;
                $b['quoteType'] = 'commercial';

                $result = [
                    'A — counter sans customerNumber' => apiCall($pricesUrl, $token, $a),
                    'B — commercial avec customerNumber' => apiCall($pricesUrl, $token, $b)
                ];
            }
        }
    }
}
?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TRIÈDRE × Postes Canada — Diagnostic V4</title>
<style>
body{font-family:Arial,sans-serif;background:#111;color:#eee;margin:0;padding:32px}
main{max-width:850px;margin:auto;background:#1b1b1b;border:1px solid #555;border-radius:16px;padding:28px}
h1{margin-top:0} p{color:#ccc}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
label{display:block;font-weight:700;margin-bottom:6px}
input{width:100%;box-sizing:border-box;padding:12px;border-radius:8px;border:1px solid #777;background:#222;color:#fff}
button{margin-top:18px;padding:12px 18px;border:0;border-radius:8px;font-weight:700;cursor:pointer}
.err{margin-top:20px;color:#ff8d8d;font-weight:700}
.results{margin-top:24px}
.card{background:#101010;border:1px solid #444;border-radius:10px;padding:16px;margin-top:12px}
.ok{color:#8ee59b}.bad{color:#ff8d8d}
pre{white-space:pre-wrap;word-break:break-word;background:#080808;padding:12px;border-radius:8px}
@media(max-width:650px){.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<main>
<h1>TRIÈDRE × Postes Canada</h1>
<p>Diagnostic LIVE V4 — consultation de tarifs uniquement. Aucune étiquette, aucun achat.</p>

<form method="post">
<div class="grid">
<div>
<label for="origin">Code postal d’origine</label>
<input id="origin" name="origin" required placeholder="A1A1A1"
       value="<?= htmlspecialchars((string)($_POST['origin'] ?? ''), ENT_QUOTES) ?>">
</div>
<div>
<label for="destination">Code postal de destination</label>
<input id="destination" name="destination" required placeholder="A1A1A1"
       value="<?= htmlspecialchars((string)($_POST['destination'] ?? ''), ENT_QUOTES) ?>">
</div>
</div>
<button type="submit">Lancer le diagnostic A / B</button>
</form>

<?php if ($error): ?>
<div class="err"><?= htmlspecialchars($error, ENT_QUOTES) ?></div>
<?php endif; ?>

<?php if ($result): ?>
<div class="results">
<?php foreach ($result as $name => $r): ?>
<div class="card">
<h2><?= htmlspecialchars($name, ENT_QUOTES) ?></h2>
<p class="<?= ($r['http'] >= 200 && $r['http'] < 300) ? 'ok' : 'bad' ?>">
HTTP <?= (int)$r['http'] ?>
</p>
<pre><?= htmlspecialchars(json_encode($r['provider'], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES), ENT_QUOTES) ?></pre>
</div>
<?php endforeach; ?>
</div>
<?php endif; ?>

</main>
</body>
</html>
