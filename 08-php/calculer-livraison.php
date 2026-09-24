<?php
declare(strict_types=1);

/*
 * TRIÈDRE — Calcul de livraison
 * V1 : calcule le poids réel du panier à partir de produits.json
 * et prépare un colis validé pour 1 à 2 articles.
 *
 * IMPORTANT : ce fichier ne crée aucune commande et n'achète aucune étiquette.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    repondre(405, ['success' => false, 'error' => 'Méthode non autorisée.']);
}

$racine = dirname(__DIR__);
$fichierProduits = $racine . '/04-data/produits.json';

if (!is_file($fichierProduits)) {
    repondre(500, ['success' => false, 'error' => 'Catalogue produits introuvable.']);
}

$entree = json_decode((string) file_get_contents('php://input'), true);

if (!is_array($entree)) {
    repondre(400, ['success' => false, 'error' => 'Données JSON invalides.']);
}

$panier = $entree['panier'] ?? null;

if (!is_array($panier) || $panier === []) {
    repondre(400, ['success' => false, 'error' => 'Le panier est vide.']);
}

/* Le navigateur ne fournit que SKU + quantité. */
$quantitesParSku = [];

foreach ($panier as $ligne) {
    if (!is_array($ligne)) {
        repondre(400, ['success' => false, 'error' => 'Une ligne du panier est invalide.']);
    }

    $sku = trim((string) ($ligne['sku'] ?? ''));
    $quantite = filter_var(
        $ligne['quantite'] ?? null,
        FILTER_VALIDATE_INT,
        ['options' => ['min_range' => 1, 'max_range' => 99]]
    );

    if ($sku === '' || $quantite === false) {
        repondre(400, ['success' => false, 'error' => 'SKU ou quantité invalide.']);
    }

    $quantitesParSku[$sku] = ($quantitesParSku[$sku] ?? 0) + (int) $quantite;
}

$catalogue = json_decode((string) file_get_contents($fichierProduits), true);

if (!is_array($catalogue) || !isset($catalogue['produits']) || !is_array($catalogue['produits'])) {
    repondre(500, ['success' => false, 'error' => 'Catalogue produits invalide.']);
}

/* Index serveur SKU -> poids. */
$poidsParSku = [];

foreach ($catalogue['produits'] as $produit) {
    if (!is_array($produit) || empty($produit['actif']) || !isset($produit['variantes'])) {
        continue;
    }

    foreach ((array) $produit['variantes'] as $variante) {
        if (!is_array($variante) || empty($variante['actif'])) {
            continue;
        }

        $sku = trim((string) ($variante['sku'] ?? ''));
        $poids = $variante['poids_g'] ?? null;

        if ($sku !== '' && is_numeric($poids) && (float) $poids > 0) {
            $poidsParSku[$sku] = (float) $poids;
        }
    }
}

$poidsProduitsG = 0.0;
$nombreArticles = 0;

foreach ($quantitesParSku as $sku => $quantite) {
    if (!isset($poidsParSku[$sku])) {
        repondre(422, [
            'success' => false,
            'error' => 'Poids produit indisponible pour le SKU ' . $sku . '.'
        ]);
    }

    $poidsProduitsG += $poidsParSku[$sku] * $quantite;
    $nombreArticles += $quantite;
}

/*
 * Emballage actuellement validé :
 * enveloppe polymailer 10 x 13 po, 9,1 g.
 * Pour l'API Postes Canada, on utilise les dimensions remplies
 * déjà retenues pour un panier compatible : 33,0 x 25,4 x 5,1 cm.
 */
if ($nombreArticles < 1 || $nombreArticles > 2) {
    repondre(422, [
        'success' => false,
        'error' => 'Emballage non encore défini pour ce nombre d’articles.',
        'nombre_articles' => $nombreArticles
    ]);
}

$poidsEmballageG = 9.1;
$poidsTotalG = $poidsProduitsG + $poidsEmballageG;

/* Postes Canada : poids envoyé au kg avec précision au millième, arrondi vers le haut. */
$poidsTotalKg = ceil($poidsTotalG) / 1000;

repondre(200, [
    'success' => true,
    'colis' => [
        'nombre_articles' => $nombreArticles,
        'poids_produits_g' => round($poidsProduitsG, 1),
        'poids_emballage_g' => $poidsEmballageG,
        'poids_total_g' => round($poidsTotalG, 1),
        'poids_total_kg' => number_format($poidsTotalKg, 3, '.', ''),
        'emballage' => 'Polymailer 10 x 13 po',
        'dimensions_cm' => [
            'longueur' => 33.0,
            'largeur' => 25.4,
            'hauteur' => 5.1
        ]
    ]
]);

function repondre(int $statut, array $donnees): never
{
    http_response_code($statut);
    echo json_encode(
        $donnees,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
    exit;
}
