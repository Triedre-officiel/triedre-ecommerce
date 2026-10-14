<?php
declare(strict_types=1);
// Helpers internes : aucun secret transmis au navigateur.
function membreAuthentifie(string $url, string $secret): ?string {
    // Apache/PHP peut exposer Authorization par plusieurs chemins.
    $header = trim((string)($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
    if ($header === '') {
        $header = trim((string)($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? ''));
    }
    if ($header === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $name => $value) {
            if (strcasecmp((string)$name, 'Authorization') === 0) {
                $header = trim((string)$value);
                break;
            }
        }
    }
    if ($header === '' && function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $name => $value) {
            if (strcasecmp((string)$name, 'Authorization') === 0) {
                $header = trim((string)$value);
                break;
            }
        }
    }
    if (!preg_match('/^Bearer\s+([^\s]+)$/i', $header, $m)) return null;
    $ch = curl_init(rtrim($url, '/') . '/auth/v1/user');
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER=>true, CURLOPT_HTTPGET=>true,
      CURLOPT_HTTPHEADER=>['apikey: '.$secret, 'Authorization: Bearer '.$m[1], 'Accept: application/json'],
      CURLOPT_CONNECTTIMEOUT=>10, CURLOPT_TIMEOUT=>20]);
    $body = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE); curl_close($ch);
    $data = is_string($body) ? json_decode($body, true) : null;
    return $code===200 && is_array($data) && preg_match('/^[a-f0-9-]{36}$/i', (string)($data['id']??'')) ? (string)$data['id'] : null;
}
function stripeSession(string $key, string $sessionId, bool $expire=false): array {
    if (!preg_match('/^cs_(test|live)_[A-Za-z0-9]+$/', $sessionId)) throw new RuntimeException('Session Stripe invalide.');
    $endpoint = 'https://api.stripe.com/v1/checkout/sessions/'.rawurlencode($sessionId).($expire?'/expire':'');
    $ch=curl_init($endpoint);
    curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_USERPWD=>$key.':',CURLOPT_HTTPHEADER=>['Accept: application/json'],CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>25]);
    if($expire) curl_setopt($ch,CURLOPT_POST,true);
    $body=curl_exec($ch); $code=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);curl_close($ch);
    $data=is_string($body)?json_decode($body,true):null;
    if($code<200||$code>=300||!is_array($data)) throw new RuntimeException('État Stripe indisponible ou session non annulable.');
    return $data;
}
