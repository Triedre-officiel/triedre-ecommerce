<?php
declare(strict_types=1);

/**
 * TRIÈDRE — Test OAuth Postes Canada
 * Nouveau Developer Portal / application TEST.
 *
 * Ce fichier teste uniquement l'obtention d'un jeton OAuth.
 * Aucun tarif, aucun colis, aucune étiquette, aucun achat.
 */

header('Content-Type: text/html; charset=utf-8');

$configPath = __DIR__ . '/config.php';

if (!is_file($configPath)) {
    http_response_code(500);
    exit('config.php introuvable.');
}

$config = require $configPath;

$apiKey    = trim((string)($config['CANADA_POST_TEST_API_KEY'] ?? ''));
$apiSecret = trim((string)($config['CANADA_POST_TEST_API_SECRET'] ?? ''));

if ($apiKey === '' || $apiSecret === '') {
    http_response_code(500);
    exit('Identifiants TEST de Postes Canada absents de config.php.');
}

/*
 * Le portail actuel publie cette URL pour l'obtention du jeton OAuth,
 * y compris lorsque les identifiants proviennent d'une application TEST.
 */
$tokenUrl =
    'https://api.canadapost-postescanada.ca/prod/' .
    'devportal-portaildesdeveloppeurs/' .
    'cpc-api-native-oauth-provider/oauth2/token';

/*
 * OAuth2 Client Credentials.
 * Les identifiants sont envoyés dans le formulaire OAuth.
 * La portée publiée par Postes Canada est "merchant".
 */
$postFields = http_build_query(
    [
        'grant_type'    => 'client_credentials',
        'client_id'     => $apiKey,
        'client_secret' => $apiSecret,
        'scope'         => 'merchant',
    ],
    '',
    '&',
    PHP_QUERY_RFC3986
);

$ch = curl_init($tokenUrl);

curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER         => false,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_HTTPHEADER     => [
        'Accept: application/json',
        'Content-Type: application/x-www-form-urlencoded',
        'User-Agent: Triedre-Ecommerce/1.0',
    ],
    CURLOPT_POSTFIELDS     => $postFields,
]);

$response  = curl_exec($ch);
$curlError = curl_error($ch);
$httpCode  = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

curl_close($ch);

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function masquerSecrets(string $texte, string $apiKey, string $apiSecret): string
{
    return str_replace(
        [$apiKey, $apiSecret],
        ['[CLÉ MASQUÉE]', '[SECRET MASQUÉ]'],
        $texte
    );
}

echo '<!doctype html><html lang="fr"><head><meta charset="utf-8">';
echo '<meta name="viewport" content="width=device-width,initial-scale=1">';
echo '<title>TRIÈDRE — Test Postes Canada</title>';
echo '<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#111;color:#eee;margin:0;padding:32px}
main{max-width:760px;margin:auto;background:#1b1b1b;border:1px solid #333;border-radius:16px;padding:28px}
h1{margin-top:0}.ok{color:#70d68a}.err{color:#ff8585}.muted{color:#aaa}
code{background:#292929;padding:3px 7px;border-radius:6px}
pre{white-space:pre-wrap;background:#0d0d0d;padding:16px;border-radius:10px;overflow:auto}
</style></head><body><main>';

echo '<h1>TRIÈDRE × Postes Canada</h1>';
echo '<p class="muted">OAuth TEST uniquement — aucun colis, aucune étiquette, aucun achat.</p>';

if ($response === false) {
    echo '<h2 class="err">❌ Erreur réseau</h2>';
    echo '<p>' . h($curlError ?: 'Erreur cURL inconnue.') . '</p>';
    echo '</main></body></html>';
    exit;
}

$data = json_decode((string)$response, true);

if (
    $httpCode >= 200 &&
    $httpCode < 300 &&
    is_array($data) &&
    !empty($data['access_token'])
) {
    echo '<h2 class="ok">✅ Authentification réussie</h2>';
    echo '<p>Postes Canada a délivré un jeton OAuth à TRIÈDRE.</p>';
    echo '<p>HTTP : <code>' . $httpCode . '</code></p>';

    if (!empty($data['token_type'])) {
        echo '<p>Type : <code>' . h((string)$data['token_type']) . '</code></p>';
    }

    if (isset($data['expires_in'])) {
        echo '<p>Expiration : <code>' .
            h((string)$data['expires_in']) .
            ' secondes</code></p>';
    }

    if (!empty($data['scope'])) {
        echo '<p>Portée : <code>' . h((string)$data['scope']) . '</code></p>';
    }

    echo '<p class="muted">La clé, le secret et le jeton sont volontairement masqués.</p>';
} else {
    echo '<h2 class="err">❌ Authentification refusée</h2>';
    echo '<p>HTTP : <code>' . $httpCode . '</code></p>';

    if ($contentType !== '') {
        echo '<p>Réponse : <code>' . h($contentType) . '</code></p>';
    }

    if (is_array($data)) {
        foreach ([
            'access_token',
            'refresh_token',
            'client_id',
            'client_secret',
            'api_key',
            'api_secret',
            'token'
        ] as $champSensible) {
            unset($data[$champSensible]);
        }

        $safe = json_encode(
            $data,
            JSON_PRETTY_PRINT |
            JSON_UNESCAPED_UNICODE |
            JSON_UNESCAPED_SLASHES
        );

        echo '<pre>' . h(masquerSecrets((string)$safe, $apiKey, $apiSecret)) . '</pre>';
    } else {
        $safe = masquerSecrets((string)$response, $apiKey, $apiSecret);
        echo '<pre>' . h(substr($safe, 0, 3000)) . '</pre>';
    }
}

echo '</main></body></html>';
