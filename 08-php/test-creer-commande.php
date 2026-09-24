<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

// ============================================================================
// TRIÈDRE — Test contrôlé de creer-commande.php
// ATTENTION : crée réellement une commande de test dans Supabase.
// Aucun paiement Stripe.
// Aucun décrément de stock.
// ============================================================================

$url = 'http://triedre-ecommerce.test/08-php/creer-commande.php';

$commandeTest = [
    'client' => [
        'nom' => 'Client Test TRIÈDRE',
        'email' => 'test-commande@triedreofficiel.com',
        'telephone' => '5145551234',
        'pays' => 'CA',
        'region' => 'Québec',
        'ville' => 'Montréal',
        'code_postal' => 'H2X 1Y4',
        'adresse' => '100 Rue Test',
    ],

    'panier' => [
        [
            // Brassière Active — Noir — L
            // Stock de test actuel : 2
            'sku' => 'TRD-BRA-ACT-NR-L',
            'quantite' => 1,
        ],
    ],
];

$curl = curl_init($url);

if ($curl === false) {
    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Impossible d’initialiser le test.'
    ]);

    exit;
}

curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode(
        $commandeTest,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    ),
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 30,
]);

$response = curl_exec($curl);

if ($response === false) {
    $erreur = curl_error($curl);
    curl_close($curl);

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Erreur pendant le test.',
        'detail' => $erreur,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    exit;
}

$status = (int) curl_getinfo(
    $curl,
    CURLINFO_RESPONSE_CODE
);

curl_close($curl);

$reponseDecodee = json_decode($response, true);

echo json_encode([
    'http_status' => $status,
    'reponse_creer_commande' =>
        $reponseDecodee ?? $response,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);