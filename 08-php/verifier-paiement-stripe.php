<?php

declare(strict_types=1);

// ============================================================================
// TRIÈDRE — Vérification sécurisée du retour Stripe
// Vérifie Stripe + Supabase avant que le navigateur vide le panier.
// ============================================================================

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    repondre([
        'success' => false,
        'error' => 'Méthode non autorisée.'
    ], 405);
}

$config = require __DIR__ . '/config.php';

$stripeSecretKey = (string)($config['stripe_secret_key'] ?? '');
$supabaseUrl = rtrim((string)($config['supabase_url'] ?? ''), '/');
$supabaseSecretKey = (string)($config['supabase_secret_key'] ?? '');

if (
    $stripeSecretKey === '' ||
    $supabaseUrl === '' ||
    $supabaseSecretKey === ''
) {
    error_log('[TRIÈDRE] Configuration serveur Stripe/Supabase manquante.');
    repondre([
        'success' => false,
        'error' => 'Configuration serveur indisponible.'
    ], 500);
}

$sessionId = trim((string)($_GET['session_id'] ?? ''));

if (
    $sessionId === '' ||
    !preg_match('/^cs_(test|live)_[A-Za-z0-9_]+$/', $sessionId)
) {
    repondre([
        'success' => false,
        'error' => 'Session Stripe invalide.'
    ], 400);
}


// ============================================================================
// 1. Vérifier directement la session auprès de Stripe
// ============================================================================

$session = requeteStripe(
    'GET',
    'https://api.stripe.com/v1/checkout/sessions/' . rawurlencode($sessionId),
    $stripeSecretKey
);

if (!is_array($session) || ($session['id'] ?? '') !== $sessionId) {
    repondre([
        'success' => false,
        'error' => 'Session Stripe introuvable.'
    ], 404);
}

if (($session['payment_status'] ?? '') !== 'paid') {
    repondre([
        'success' => true,
        'paid' => false,
        'status' => 'pending'
    ], 202);
}

$orderId = trim((string)(
    $session['metadata']['order_id']
    ?? $session['client_reference_id']
    ?? ''
));

if ($orderId === '') {
    error_log('[TRIÈDRE] order_id absent de la session Stripe ' . $sessionId);
    repondre([
        'success' => false,
        'error' => 'Référence de commande introuvable.'
    ], 409);
}


// ============================================================================
// 2. Vérifier que le webhook a finalisé CETTE commande dans Supabase
// ============================================================================

$urlCommande =
    $supabaseUrl .
    '/rest/v1/orders' .
    '?select=id,order_number,status,payment_status,stripe_checkout_session_id,paid_at' .
    '&id=eq.' . rawurlencode($orderId) .
    '&limit=1';

$commandes = requeteSupabase(
    'GET',
    $urlCommande,
    $supabaseSecretKey
);

$commande = is_array($commandes) && isset($commandes[0])
    ? $commandes[0]
    : null;

if (!is_array($commande)) {
    repondre([
        'success' => false,
        'error' => 'Commande TRIÈDRE introuvable.'
    ], 404);
}

$sessionEnregistree =
    (string)($commande['stripe_checkout_session_id'] ?? '');

$paiementConfirme =
    ($commande['payment_status'] ?? '') === 'paid' &&
    ($commande['status'] ?? '') === 'paid' &&
    $sessionEnregistree === $sessionId &&
    !empty($commande['paid_at']);

if (!$paiementConfirme) {
    // Le retour navigateur peut arriver avant que le webhook ait fini.
    repondre([
        'success' => true,
        'paid' => false,
        'status' => 'pending'
    ], 202);
}

repondre([
    'success' => true,
    'paid' => true,
    'status' => 'paid',
    'order_number' => (string)($commande['order_number'] ?? '')
], 200);


// ============================================================================
// Fonctions
// ============================================================================

function requeteStripe(
    string $methode,
    string $url,
    string $secretKey
): mixed {
    $curl = curl_init($url);

    if ($curl === false) {
        throw new RuntimeException('Impossible d’initialiser Stripe.');
    }

    curl_setopt_array(
        $curl,
        [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $methode,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $secretKey,
                'Accept: application/json',
            ],
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 20,
        ]
    );

    $reponse = curl_exec($curl);

    if ($reponse === false) {
        $message = curl_error($curl);
        curl_close($curl);
        throw new RuntimeException('Erreur réseau Stripe : ' . $message);
    }

    $statutHttp = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);

    $json = json_decode($reponse, true);

    if ($statutHttp < 200 || $statutHttp >= 300) {
        error_log(
            '[TRIÈDRE] Stripe HTTP ' .
            $statutHttp .
            ' : ' .
            $reponse
        );

        throw new RuntimeException('Stripe a refusé la vérification.');
    }

    return is_array($json) ? $json : null;
}


function requeteSupabase(
    string $methode,
    string $url,
    string $secretKey
): mixed {
    $curl = curl_init($url);

    if ($curl === false) {
        throw new RuntimeException('Impossible d’initialiser Supabase.');
    }

    curl_setopt_array(
        $curl,
        [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $methode,
            CURLOPT_HTTPHEADER => [
                'apikey: ' . $secretKey,
                'Authorization: Bearer ' . $secretKey,
                'Accept: application/json',
                'Content-Type: application/json',
            ],
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 20,
        ]
    );

    $reponse = curl_exec($curl);

    if ($reponse === false) {
        $message = curl_error($curl);
        curl_close($curl);
        throw new RuntimeException('Erreur réseau Supabase : ' . $message);
    }

    $statutHttp = (int)curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    curl_close($curl);

    if ($statutHttp < 200 || $statutHttp >= 300) {
        error_log(
            '[TRIÈDRE] Supabase HTTP ' .
            $statutHttp .
            ' : ' .
            $reponse
        );

        throw new RuntimeException('Supabase a refusé la vérification.');
    }

    if ($reponse === '') {
        return null;
    }

    $json = json_decode($reponse, true);

    return is_array($json) ? $json : null;
}


function repondre(array $donnees, int $statut): never
{
    http_response_code($statut);

    echo json_encode(
        $donnees,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

    exit;
}
