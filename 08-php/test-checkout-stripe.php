<?php

declare(strict_types=1);

// ============================================================================
// TRIÈDRE — Test Stripe Checkout
// Utilise la commande de test déjà créée.
// ============================================================================

$orderId = 'daba8823-84d2-447d-a28b-04af5df4d9e5';

$url =
    'http://triedre-ecommerce.test/' .
    '08-php/creer-checkout-stripe.php';

$curl = curl_init($url);

curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'order_id' => $orderId,
    ]),
    CURLOPT_TIMEOUT => 30,
]);

$reponse = curl_exec($curl);

if ($reponse === false) {
    die('Erreur : ' . curl_error($curl));
}

$statut = (int)curl_getinfo(
    $curl,
    CURLINFO_RESPONSE_CODE
);

curl_close($curl);

$donnees = json_decode($reponse, true);

if (
    $statut >= 200 &&
    $statut < 300 &&
    is_array($donnees) &&
    !empty($donnees['checkout_url'])
) {
    header(
        'Location: ' .
        $donnees['checkout_url'],
        true,
        302
    );

    exit;
}

header('Content-Type: application/json; charset=UTF-8');

echo json_encode(
    [
        'http_status' => $statut,
        'response' => $donnees ?? $reponse,
    ],
    JSON_PRETTY_PRINT |
    JSON_UNESCAPED_UNICODE
);