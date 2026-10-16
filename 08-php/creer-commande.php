<?php

declare(strict_types=1);

// ============================================================================
// TRIÈDRE — Création serveur d'une commande
// V1 : Supabase réel, sans Stripe
// ============================================================================

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    repondreErreur('Méthode non autorisée.', 405);
}

$config = require __DIR__ . '/config.php';
require_once __DIR__ . '/livraison-lib.php';

$supabaseUrl = rtrim((string)($config['supabase_url'] ?? ''), '/');
$supabaseSecretKey = (string)($config['supabase_secret_key'] ?? '');

if ($supabaseUrl === '' || $supabaseSecretKey === '') {
    error_log('[TRIÈDRE] Configuration Supabase serveur manquante.');
    repondreErreur('Configuration serveur indisponible.', 500);
}


// ============================================================================
// 1. Lecture JSON
// ============================================================================

$corpsBrut = file_get_contents('php://input');

if ($corpsBrut === false || trim($corpsBrut) === '') {
    repondreErreur('Données de commande manquantes.', 400);
}

$donnees = json_decode($corpsBrut, true);

if (!is_array($donnees)) {
    repondreErreur('Format de commande invalide.', 400);
}


// ============================================================================
// 2. Données client
// ============================================================================

$client = is_array($donnees['client'] ?? null)
    ? $donnees['client']
    : [];

$nom = nettoyerTexte($client['nom'] ?? '', 120);
$email = strtolower(nettoyerTexte($client['email'] ?? '', 254));
$telephone = nettoyerTexte($client['telephone'] ?? '', 40);

$pays = strtoupper(nettoyerTexte($client['pays'] ?? '', 10));
$region = nettoyerTexte($client['region'] ?? '', 120);
$ville = nettoyerTexte($client['ville'] ?? '', 120);
$codePostal = nettoyerTexte($client['code_postal'] ?? '', 30);
$adresse = nettoyerTexte($client['adresse'] ?? '', 250);

if (
    $nom === '' ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    $telephone === '' ||
    $pays === '' ||
    $region === '' ||
    $ville === '' ||
    $codePostal === '' ||
    $adresse === ''
) {
    repondreErreur(
        'Les informations de livraison sont incomplètes.',
        422
    );
}


// ============================================================================
// 3. Panier transmis
//
// IMPORTANT :
// le serveur ne fait confiance qu'au SKU et à la quantité.
// Prix, couleur, taille, stock, variante et devise seront relus dans Supabase.
// ============================================================================

$panier = $donnees['panier'] ?? null;

if (!is_array($panier) || count($panier) === 0) {
    repondreErreur('Le panier est vide.', 422);
}

if (count($panier) > 50) {
    repondreErreur('Le panier contient trop de lignes.', 422);
}


// ============================================================================
// 4. Normalisation SKU + quantités
// ============================================================================

$lignesDemandees = [];

foreach ($panier as $item) {
    if (!is_array($item)) {
        repondreErreur('Une ligne du panier est invalide.', 422);
    }

    $sku = strtoupper(nettoyerTexte($item['sku'] ?? '', 100));
    $quantite = filter_var(
        $item['quantite'] ?? null,
        FILTER_VALIDATE_INT
    );

    if (
        $sku === '' ||
        $quantite === false ||
        $quantite < 1 ||
        $quantite > 20
    ) {
        repondreErreur(
            'Une quantité ou une variante du panier est invalide.',
            422
        );
    }

    // Fusionne d'éventuelles lignes du même SKU.
    if (isset($lignesDemandees[$sku])) {
        $lignesDemandees[$sku] += $quantite;
    } else {
        $lignesDemandees[$sku] = $quantite;
    }

    if ($lignesDemandees[$sku] > 20) {
        repondreErreur(
            'La quantité demandée pour un produit est trop élevée.',
            422
        );
    }
}


// ============================================================================
// 5. Lecture des variantes réelles dans Supabase
// ============================================================================

$skus = array_keys($lignesDemandees);

$filtreSku = implode(
    ',',
    array_map(
        static fn(string $sku): string => '"' . addcslashes($sku, '"\\') . '"',
        $skus
    )
);

$urlVariantes =
    $supabaseUrl .
    '/rest/v1/product_variants' .
    '?select=product_id,variant_id,sku,color,size,price,currency,stock,active,image_url' .
    '&sku=in.(' . rawurlencode($filtreSku) . ')';

$variantes = requeteSupabase(
    'GET',
    $urlVariantes,
    $supabaseSecretKey
);

if (!is_array($variantes)) {
    repondreErreur('Catalogue indisponible.', 503);
}

$variantesParSku = [];

foreach ($variantes as $variante) {
    if (!is_array($variante) || empty($variante['sku'])) {
        continue;
    }

    $variantesParSku[(string)$variante['sku']] = $variante;
}


// ============================================================================
// 6. Validation stock / prix / devise
// ============================================================================

$sousTotal = 0.0;
$deviseCommande = null;
$lignesCommande = [];

foreach ($lignesDemandees as $sku => $quantite) {
    $variante = $variantesParSku[$sku] ?? null;

    if (!$variante) {
        repondreErreur(
            'Une variante du panier n’existe plus.',
            409
        );
    }

    if (($variante['active'] ?? false) !== true) {
        repondreErreur(
            'La variante ' . $sku . ' est indisponible.',
            409
        );
    }

    $stock = (int)($variante['stock'] ?? 0);

    if ($stock < $quantite) {
        repondreErreur(
            'Stock insuffisant pour ' . $sku . '.',
            409
        );
    }

    $prix = (float)($variante['price'] ?? -1);

    if ($prix < 0) {
        repondreErreur(
            'Prix serveur invalide pour ' . $sku . '.',
            500
        );
    }

    $devise = strtoupper((string)($variante['currency'] ?? 'CAD'));

    if ($deviseCommande === null) {
        $deviseCommande = $devise;
    }

    if ($devise !== $deviseCommande) {
        repondreErreur(
            'Le panier contient plusieurs devises.',
            422
        );
    }

    $totalLigne = arrondirMontant($prix * $quantite);

    $sousTotal = arrondirMontant(
        $sousTotal + $totalLigne
    );

    $lignesCommande[] = [
        'product_id' => (string)$variante['product_id'],
        'variant_id' => (string)$variante['variant_id'],
        'sku' => (string)$variante['sku'],
        'color' => (string)$variante['color'],
        'size' => (string)$variante['size'],
        'quantity' => $quantite,
        'unit_price' => arrondirMontant($prix),
        'line_total' => $totalLigne,
        'image_url' => $variante['image_url'] ?? null,
    ];
}

if ($deviseCommande === null) {
    $deviseCommande = 'CAD';
}


// ============================================================================
// 7. Catalogue local : nom réel du produit
//
// product_variants ne possède pas product_name.
// On le retrouve donc dans 04-data/produits.json.
// ============================================================================

$catalogue = chargerCatalogueProduits();

$produitsParId = [];

foreach ($catalogue as $produit) {
    if (
        is_array($produit) &&
        isset($produit['id'], $produit['nom'])
    ) {
        $produitsParId[(string)$produit['id']] =
            (string)$produit['nom'];
    }
}

foreach ($lignesCommande as &$ligne) {
    $ligne['product_name'] =
        $produitsParId[$ligne['product_id']]
        ?? 'Produit TRIÈDRE';
}

unset($ligne);


// ============================================================================
// 8. Montants de la commande
//
// Le navigateur envoie le tarif choisi AVEC sa signature serveur (tarifs-postes-canada.php).
// Le prix ne peut donc pas être modifié côté client. La livraison gratuite est
// recalculée ici à partir du sous-total réel (prix Supabase).
// ============================================================================

$livraisonTransmise = is_array($donnees['livraison'] ?? null)
    ? $donnees['livraison']
    : [];

$codeLivraison = strtoupper(nettoyerTexte($livraisonTransmise['code'] ?? '', 20));
$montantOriginalBrut = $livraisonTransmise['montant_original'] ?? null;
$expirationLivraison = filter_var($livraisonTransmise['expiration'] ?? null, FILTER_VALIDATE_INT);
$jetonLivraison = nettoyerTexte($livraisonTransmise['jeton'] ?? '', 128);

if (
    !isset(TR_LIV_SERVICES[$codeLivraison]) ||
    !is_numeric($montantOriginalBrut) ||
    $expirationLivraison === false ||
    $jetonLivraison === ''
) {
    repondreErreur('Le tarif de livraison validé est manquant.', 422);
}

$montantOriginal = arrondirMontant((float)$montantOriginalBrut);

if ($montantOriginal < 0 || $montantOriginal > 500) {
    repondreErreur('Le tarif de livraison est invalide.', 422);
}

$empreintePanier = trLivEmpreintePanier($lignesDemandees);

if (!trLivVerifier(
    $config,
    $codeLivraison,
    $montantOriginal,
    $codePostal,
    $empreintePanier,
    (int)$expirationLivraison,
    $jetonLivraison
)) {
    repondreErreur(
        'Le tarif de livraison a expiré ou ne correspond plus à ton panier. Valide de nouveau ton adresse.',
        409
    );
}

$serviceLivraison = trLivNomService($codeLivraison);

// Livraison standard offerte dès le seuil, calculé sur le sous-total serveur.
$livraison = (
    $codeLivraison === TR_LIV_CODE_STANDARD &&
    $sousTotal + 0.001 >= TR_LIV_SEUIL_GRATUITE
) ? 0.00 : $montantOriginal;

$taxes = 0.00;

$total = arrondirMontant(
    $sousTotal + $livraison + $taxes
);


// ============================================================================
// 9. Identification sécurisée du membre (commande invitée toujours possible)
// ============================================================================

$userId = null;
// Certains environnements Apache/PHP transmettent Authorization sous une autre forme.
$authorization = trim((string)($_SERVER['HTTP_AUTHORIZATION'] ?? ''));
if ($authorization === '') {
    $authorization = trim((string)($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? ''));
}
if ($authorization === '' && function_exists('getallheaders')) {
    foreach (getallheaders() as $headerName => $headerValue) {
        if (strcasecmp((string)$headerName, 'Authorization') === 0) {
            $authorization = trim((string)$headerValue);
            break;
        }
    }
}
if ($authorization === '' && function_exists('apache_request_headers')) {
    foreach (apache_request_headers() as $headerName => $headerValue) {
        if (strcasecmp((string)$headerName, 'Authorization') === 0) {
            $authorization = trim((string)$headerValue);
            break;
        }
    }
}

if ($authorization !== '') {
    if (!preg_match('/^Bearer\s+([^\s]+)$/i', $authorization, $matches)) {
        repondreErreur('Authentification membre invalide.', 401);
    }
    $token = $matches[1];
    $curlAuth = curl_init($supabaseUrl . '/auth/v1/user');
    if ($curlAuth === false) {
        repondreErreur('Service d’authentification indisponible.', 503);
    }
    curl_setopt_array($curlAuth, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPGET => true,
        CURLOPT_HTTPHEADER => [
            'apikey: ' . $supabaseSecretKey,
            'Authorization: Bearer ' . $token,
            'Accept: application/json',
        ],
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 20,
    ]);
    $authBody = curl_exec($curlAuth);
    $authStatus = (int)curl_getinfo($curlAuth, CURLINFO_RESPONSE_CODE);
    curl_close($curlAuth);
    $authUser = is_string($authBody) ? json_decode($authBody, true) : null;
    if ($authStatus !== 200 || !is_array($authUser) || !isset($authUser['id']) ||
        !preg_match('/^[a-f0-9-]{36}$/i', (string)$authUser['id'])) {
        repondreErreur('Session membre invalide ou expirée.', 401);
    }
    $userId = (string)$authUser['id'];
}


// ============================================================================
// 10. Création du numéro public TRIÈDRE
// ============================================================================

$numeroCommande = genererNumeroCommande();


// ============================================================================
// 11. Création de orders
// ============================================================================

$commande = [
    'user_id' => $userId,
    'order_number' => $numeroCommande,
    'status' => 'pending',
    'currency' => $deviseCommande,

    'subtotal' => $sousTotal,
    'shipping_amount' => $livraison,
    'tax_amount' => $taxes,
    'total_amount' => $total,

    'customer_name' => $nom,
    'customer_email' => $email,
    'customer_phone' => $telephone,

    'shipping_country' => $pays,
    'shipping_region' => $region,
    'shipping_city' => $ville,
    'shipping_postal_code' => $codePostal,
    'shipping_address' => $adresse,

    'payment_status' => 'pending',
];

$urlOrders = $supabaseUrl . '/rest/v1/orders';

$ordersCrees = requeteSupabase(
    'POST',
    $urlOrders,
    $supabaseSecretKey,
    [$commande],
    [
        'Prefer: return=representation'
    ]
);

if (
    !is_array($ordersCrees) ||
    !isset($ordersCrees[0]['id'])
) {
    repondreErreur(
        'Impossible de créer la commande.',
        500
    );
}

$orderId = (string)$ordersCrees[0]['id'];


// ============================================================================
// 12. Création des order_items
// ============================================================================

$itemsAInserer = [];

foreach ($lignesCommande as $ligne) {
    $itemsAInserer[] = [
        'order_id' => $orderId,
        'product_id' => $ligne['product_id'],
        'variant_id' => $ligne['variant_id'],
        'sku' => $ligne['sku'],
        'product_name' => $ligne['product_name'],
        'color' => $ligne['color'],
        'size' => $ligne['size'],
        'quantity' => $ligne['quantity'],
        'unit_price' => $ligne['unit_price'],
        'line_total' => $ligne['line_total'],
        'image_url' => $ligne['image_url'],
    ];
}

try {
    requeteSupabase(
        'POST',
        $supabaseUrl . '/rest/v1/order_items',
        $supabaseSecretKey,
        $itemsAInserer,
        [
            'Prefer: return=minimal'
        ]
    );
} catch (Throwable $e) {

    // Nettoyage de sécurité :
    // si les lignes échouent, on supprime la commande incomplète.
    try {
        requeteSupabase(
            'DELETE',
            $supabaseUrl .
            '/rest/v1/orders?id=eq.' .
            rawurlencode($orderId),
            $supabaseSecretKey,
            null,
            [
                'Prefer: return=minimal'
            ]
        );
    } catch (Throwable $nettoyageErreur) {
        error_log(
            '[TRIÈDRE] Nettoyage commande ' .
            $orderId .
            ' impossible : ' .
            $nettoyageErreur->getMessage()
        );
    }

    throw $e;
}


// ============================================================================
// 13. Réponse au navigateur
// ============================================================================

http_response_code(201);

echo json_encode(
    [
        'success' => true,
        'order_id' => $orderId,
        'order_number' => $numeroCommande,
        'member_linked' => $userId !== null,
        'currency' => $deviseCommande,
        'subtotal' => $sousTotal,
        'shipping_amount' => $livraison,
        'tax_amount' => $taxes,
        'total_amount' => $total,
    ],
    JSON_UNESCAPED_UNICODE |
    JSON_UNESCAPED_SLASHES
);

exit;


// ============================================================================
// FONCTIONS
// ============================================================================

function nettoyerTexte(mixed $valeur, int $longueurMax): string
{
    $texte = trim((string)$valeur);

    if (mb_strlen($texte) > $longueurMax) {
        $texte = mb_substr($texte, 0, $longueurMax);
    }

    return $texte;
}


function arrondirMontant(float $montant): float
{
    return round($montant, 2);
}


function genererNumeroCommande(): string
{
    return sprintf(
        'TRD-%s-%s',
        gmdate('Ymd'),
        strtoupper(bin2hex(random_bytes(3)))
    );
}


function chargerCatalogueProduits(): array
{
    $chemin = dirname(__DIR__) . '/04-data/produits.json';

    if (!is_file($chemin)) {
        throw new RuntimeException(
            'Catalogue produits.json introuvable.'
        );
    }

    $json = file_get_contents($chemin);

    if ($json === false) {
        throw new RuntimeException(
            'Impossible de lire produits.json.'
        );
    }

    $donnees = json_decode($json, true);

    if (
        !is_array($donnees) ||
        !isset($donnees['produits']) ||
        !is_array($donnees['produits'])
    ) {
        throw new RuntimeException(
            'Catalogue produits.json invalide.'
        );
    }

    return $donnees['produits'];
}


function requeteSupabase(
    string $methode,
    string $url,
    string $secretKey,
    ?array $corps = null,
    array $headersSupplementaires = []
): mixed {

    $curl = curl_init($url);

    if ($curl === false) {
        throw new RuntimeException(
            'Impossible d’initialiser la connexion Supabase.'
        );
    }

    $headers = [
        'apikey: ' . $secretKey,
        'Authorization: Bearer ' . $secretKey,
        'Accept: application/json',
        'Content-Type: application/json',
    ];

    foreach ($headersSupplementaires as $header) {
        $headers[] = $header;
    }

    curl_setopt_array(
        $curl,
        [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $methode,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => 20,
        ]
    );

    if ($corps !== null) {
        curl_setopt(
            $curl,
            CURLOPT_POSTFIELDS,
            json_encode(
                $corps,
                JSON_UNESCAPED_UNICODE |
                JSON_UNESCAPED_SLASHES
            )
        );
    }

    $reponse = curl_exec($curl);

    if ($reponse === false) {
        $message = curl_error($curl);
        curl_close($curl);

        throw new RuntimeException(
            'Erreur réseau Supabase : ' . $message
        );
    }

    $statutHttp = (int)curl_getinfo(
        $curl,
        CURLINFO_RESPONSE_CODE
    );

    curl_close($curl);

    if ($statutHttp < 200 || $statutHttp >= 300) {
        error_log(
            '[TRIÈDRE] Supabase HTTP ' .
            $statutHttp .
            ' : ' .
            $reponse
        );

        throw new RuntimeException(
            'Supabase a refusé la requête.'
        );
    }

    if ($reponse === '') {
        return null;
    }

    $json = json_decode($reponse, true);

    return $json ?? null;
}


function repondreErreur(
    string $message,
    int $statutHttp
): never {

    http_response_code($statutHttp);

    echo json_encode(
        [
            'success' => false,
            'message' => $message,
        ],
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

    exit;
}