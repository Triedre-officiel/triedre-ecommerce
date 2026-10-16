<?php

declare(strict_types=1);

// ============================================================================
// TRIÈDRE — Création d'une session Stripe Checkout
// À partir d'une vraie commande Supabase existante.
// Le stock est RÉSERVÉ ici (fonction SQL triedre_stock_reserver, V4) avant
// d'ouvrir la page Stripe, valable 30 minutes.
// ============================================================================

// Durée de la réservation en base : un peu plus que la session Stripe (31 min),
// pour qu'un paiement terminé à la dernière seconde trouve sa réservation.
const TR_RESERVATION_MINUTES = 45;

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    repondreErreur('Méthode non autorisée.', 405);
}

// Toute erreur imprévue (réseau Supabase/Stripe) renvoie un JSON propre
// au lieu d'une page d'erreur PHP.
set_exception_handler(function (Throwable $e): void {
    error_log('[TRIÈDRE] Checkout : ' . $e->getMessage());
    repondreErreur('Service de paiement temporairement indisponible.', 502);
});

$config = require __DIR__ . '/config.php';

// URL publique du site (à définir dans config.php : 'site_url' => 'https://www.triedreofficiel.com')
$siteUrl = rtrim((string)($config['site_url'] ?? 'https://www.triedreofficiel.com'), '/');

$supabaseUrl = rtrim((string)($config['supabase_url'] ?? ''), '/');
$supabaseSecretKey = (string)($config['supabase_secret_key'] ?? '');
$stripeSecretKey = (string)($config['stripe_secret_key'] ?? '');

if (
    $supabaseUrl === '' ||
    $supabaseSecretKey === '' ||
    $stripeSecretKey === ''
) {
    error_log('[TRIÈDRE] Configuration serveur incomplète.');
    repondreErreur('Configuration serveur indisponible.', 500);
}


// ============================================================================
// 1. Lire la requête JSON
// ============================================================================

$corpsBrut = file_get_contents('php://input');

if ($corpsBrut === false || trim($corpsBrut) === '') {
    repondreErreur('Données manquantes.', 400);
}

$donnees = json_decode($corpsBrut, true);

if (!is_array($donnees)) {
    repondreErreur('Format JSON invalide.', 400);
}

$orderId = trim((string)($donnees['order_id'] ?? ''));

if ($orderId === '') {
    repondreErreur('Identifiant de commande manquant.', 422);
}


// ============================================================================
// 2. Lire la commande dans Supabase
// ============================================================================

$urlCommande =
    $supabaseUrl .
    '/rest/v1/orders' .
    '?id=eq.' . rawurlencode($orderId) .
    '&select=id,order_number,status,payment_status,currency,' .
    'subtotal,shipping_amount,tax_amount,total_amount,customer_email,' .
    'stripe_checkout_session_id,user_id';

$commandes = requeteSupabase(
    'GET',
    $urlCommande,
    $supabaseSecretKey
);

if (!is_array($commandes) || !isset($commandes[0])) {
    repondreErreur('Commande introuvable.', 404);
}

$commande = $commandes[0];
require_once __DIR__ . '/commandes-auth.php';
$owner = (string)($commande['user_id'] ?? '');
if ($owner !== '') {
    $actor = membreAuthentifie($supabaseUrl, $supabaseSecretKey);
    if ($actor === null) repondreErreur('Connexion membre requise.', 401);
    if (!hash_equals($owner, $actor)) repondreErreur('Accès refusé.', 403);
}



// ============================================================================
// 3. Vérifier l'état de la commande
// ============================================================================

if (($commande['payment_status'] ?? '') === 'paid') {
    repondreErreur('Cette commande est déjà payée.', 409);
}

if (($commande['status'] ?? '') !== 'pending') {
    repondreErreur(
        'Cette commande ne peut pas être envoyée au paiement.',
        409
    );
}


// ============================================================================
// 4. Lire les articles de la commande
// ============================================================================

$urlItems =
    $supabaseUrl .
    '/rest/v1/order_items' .
    '?order_id=eq.' . rawurlencode($orderId) .
    '&select=product_name,color,size,quantity,unit_price,line_total,sku';

$items = requeteSupabase(
    'GET',
    $urlItems,
    $supabaseSecretKey
);

if (!is_array($items) || count($items) === 0) {
    repondreErreur('La commande ne contient aucun article.', 409);
}


// ============================================================================
// 5. Recalcul de contrôle
// ============================================================================

$totalArticles = 0.00;

foreach ($items as $item) {
    $quantite = (int)($item['quantity'] ?? 0);
    $prixUnitaire = (float)($item['unit_price'] ?? 0);

    if ($quantite < 1 || $prixUnitaire < 0) {
        repondreErreur('Une ligne de commande est invalide.', 500);
    }

    $totalArticles += round($prixUnitaire * $quantite, 2);
}

$totalArticles = round($totalArticles, 2);
$sousTotalCommande = round((float)$commande['subtotal'], 2);

if (abs($totalArticles - $sousTotalCommande) > 0.001) {
    error_log(
        '[TRIÈDRE] Écart montant commande ' .
        $orderId .
        ' : items=' . $totalArticles .
        ' / order=' . $sousTotalCommande
    );

    repondreErreur(
        'Le montant de la commande est incohérent.',
        409
    );
}


// ============================================================================
// 5 bis. Réserver le stock (vérification + retrait en une seule opération)
//
// Deux clients ne peuvent plus payer le même dernier article : le second reçoit
// « Stock insuffisant » avant d'arriver sur Stripe. La réservation dure un peu
// plus longtemps que la session Stripe (30 min) ; elle est libérée si le client
// abandonne (retour sur le site, expiration Stripe, annulation, ou cron).
// ============================================================================

$ancienneSession = (string)($commande['stripe_checkout_session_id'] ?? '');

$reservation = requeteSupabase(
    'POST',
    $supabaseUrl . '/rest/v1/rpc/triedre_stock_reserver',
    $supabaseSecretKey,
    [
        'p_order_id' => $orderId,
        'p_minutes' => TR_RESERVATION_MINUTES,
    ]
);

if (!is_array($reservation) || ($reservation['success'] ?? false) !== true) {
    $raison = is_array($reservation) ? (string)($reservation['raison'] ?? '') : '';

    if ($raison !== 'stock_insuffisant') {
        repondreErreur('Cette commande ne peut plus être payée.', 409);
    }

    // Nouvelle commande jamais envoyée à Stripe : on l'annule pour qu'elle
    // ne reçoive pas de courriel de rappel. Une commande relancée depuis
    // l'espace membre reste en attente (le stock peut revenir).
    if ($ancienneSession === '') {
        try {
            requeteSupabase(
                'PATCH',
                $supabaseUrl . '/rest/v1/orders?id=eq.' . rawurlencode($orderId) .
                '&status=eq.pending&payment_status=eq.pending',
                $supabaseSecretKey,
                ['status' => 'cancelled'],
                ['Prefer: return=minimal']
            );
        } catch (Throwable $e) {
            error_log('[TRIÈDRE] Annulation commande sans stock ' . $orderId . ' : ' . $e->getMessage());
        }
    }

    repondreErreur(
        messageStockInsuffisant($reservation['manquants'] ?? [], $items),
        409
    );
}


// ============================================================================
// 6. Construire les line_items Stripe
// ============================================================================

$currency = strtolower((string)($commande['currency'] ?? 'CAD'));

$parametresStripe = [
    'mode' => 'payment',

    'client_reference_id' => $orderId,

    'customer_email' => (string)$commande['customer_email'],

    'metadata' => [
        'order_id' => $orderId,
        'order_number' => (string)$commande['order_number'],
    ],

    'success_url' =>
        $siteUrl . '/commande' .
        '?stripe=success&session_id={CHECKOUT_SESSION_ID}',

    // Le numéro de commande permet de libérer immédiatement la réservation
    // quand le client revient sur le site sans avoir payé.
    'cancel_url' =>
        $siteUrl . '/commande' .
        '?stripe=cancelled&commande=' . rawurlencode($orderId),

    'locale' => 'fr-CA',

    // Session limitée à 30 minutes (minimum autorisé par Stripe) : passé ce
    // délai, le client ne peut plus payer et les articles reviennent en stock.
    // 31 minutes pour absorber un éventuel décalage d'horloge.
    'expires_at' => time() + 31 * 60,

    // Message affiché sous le bouton « Payer » de la page Stripe.
    'custom_text' => [
        'submit' => [
            'message' => 'Tes articles sont réservés pendant 30 minutes, le temps de finaliser ton paiement.',
        ],
    ],
];

foreach ($items as $index => $item) {

    $nom = (string)$item['product_name'];
    $couleur = trim((string)($item['color'] ?? ''));
    $taille = trim((string)($item['size'] ?? ''));

    $description = trim(
        implode(
            ' — ',
            array_filter([$couleur, $taille])
        )
    );

    $unitAmount = (int)round(
        ((float)$item['unit_price']) * 100
    );

    $parametresStripe['line_items'][$index] = [
        'price_data' => [
            'currency' => $currency,
            'unit_amount' => $unitAmount,
            'product_data' => [
                'name' => $nom,
                'description' => $description,
            ],
        ],

        'quantity' => (int)$item['quantity'],
    ];
}


// Ajouter la livraison enregistrée dans la commande comme ligne Stripe distincte.
$shippingAmount = round((float)($commande['shipping_amount'] ?? 0), 2);

if ($shippingAmount > 0) {
    $parametresStripe['line_items'][] = [
        'price_data' => [
            'currency' => $currency,
            'unit_amount' => (int)round($shippingAmount * 100),
            'product_data' => [
                'name' => 'Livraison — Postes Canada',
            ],
        ],
        'quantity' => 1,
    ];
}


// ============================================================================
// 7. Créer la session Stripe Checkout
// ============================================================================

try {
    $session = requeteStripe(
        'POST',
        'https://api.stripe.com/v1/checkout/sessions',
        $stripeSecretKey,
        $parametresStripe
    );

    if (
        !is_array($session) ||
        empty($session['id']) ||
        empty($session['url'])
    ) {
        throw new RuntimeException('Stripe n’a pas retourné de session valide.');
    }
} catch (Throwable $e) {
    // Paiement impossible à ouvrir : on rend immédiatement les articles réservés.
    libererReservation($supabaseUrl, $supabaseSecretKey, $orderId, 'Ouverture du paiement impossible');
    throw $e;
}

$sessionId = (string)$session['id'];
$checkoutUrl = (string)$session['url'];


// ============================================================================
// 8. Enregistrer la session Stripe dans la commande
// ============================================================================

requeteSupabase(
    'PATCH',
    $supabaseUrl .
    '/rest/v1/orders?id=eq.' .
    rawurlencode($orderId),
    $supabaseSecretKey,
    [
        'stripe_checkout_session_id' => $sessionId,
    ],
    [
        'Prefer: return=minimal'
    ]
);

// Paiement relancé depuis l'espace membre : l'ancienne session Stripe est fermée
// pour qu'un seul lien de paiement reste valable. Son expiration est ignorée
// par le webhook (ce n'est plus la session enregistrée sur la commande).
if ($ancienneSession !== '' && $ancienneSession !== $sessionId) {
    try {
        require_once __DIR__ . '/commandes-auth.php';
        $etatAncienne = stripeSession($stripeSecretKey, $ancienneSession);
        if (($etatAncienne['status'] ?? '') === 'open') {
            stripeSession($stripeSecretKey, $ancienneSession, true);
        }
    } catch (Throwable $e) {
        error_log('[TRIÈDRE] Fermeture ancienne session ' . $ancienneSession . ' : ' . $e->getMessage());
    }
}


// ============================================================================
// 9. Réponse
// ============================================================================

echo json_encode(
    [
        'success' => true,
        'order_id' => $orderId,
        'order_number' => $commande['order_number'],
        'stripe_session_id' => $sessionId,
        'checkout_url' => $checkoutUrl,
    ],
    JSON_UNESCAPED_UNICODE |
    JSON_UNESCAPED_SLASHES
);

exit;


// ============================================================================
// FONCTIONS
// ============================================================================

/**
 * Message client lisible à partir des articles manquants renvoyés par Supabase.
 * $manquants : [{sku, demande, disponible}] ; $items : lignes order_items.
 */
function messageStockInsuffisant(mixed $manquants, array $items): string
{
    $parSku = [];
    foreach ($items as $item) {
        $parSku[(string)($item['sku'] ?? '')] = $item;
    }

    $details = [];
    foreach (is_array($manquants) ? $manquants : [] as $manquant) {
        $sku = (string)($manquant['sku'] ?? '');
        $item = $parSku[$sku] ?? [];
        $libelle = trim(implode(' — ', array_filter([
            (string)($item['product_name'] ?? ''),
            trim(implode(', ', array_filter([
                (string)($item['color'] ?? ''),
                (string)($item['size'] ?? ''),
            ]))),
        ])));
        if ($libelle === '') {
            $libelle = $sku;
        }
        $disponible = max(0, (int)($manquant['disponible'] ?? 0));
        $details[] = '« ' . $libelle . ' » ' . ($disponible === 0
            ? 'n’est plus disponible'
            : ': il n’en reste que ' . $disponible);
    }

    if (!$details) {
        return 'Un article de ton panier n’est plus disponible. Ajuste ton panier puis réessaie.';
    }

    return 'Stock insuffisant : ' . implode(' ; ', $details) .
        '. Ton panier est conservé : ajuste-le puis réessaie.';
}


/**
 * Libère la réservation d'une commande (sans effet si elle est déjà libérée ou vendue).
 * Ne lève jamais d'exception : le cron sert de filet de sécurité.
 */
function libererReservation(string $supabaseUrl, string $secretKey, string $orderId, string $note): void
{
    try {
        requeteSupabase(
            'POST',
            $supabaseUrl . '/rest/v1/rpc/triedre_stock_liberer',
            $secretKey,
            ['p_order_id' => $orderId, 'p_note' => $note]
        );
    } catch (Throwable $e) {
        error_log('[TRIÈDRE] Libération réservation ' . $orderId . ' : ' . $e->getMessage());
    }
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
            'Impossible d’initialiser Supabase.'
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

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $methode,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 20,
    ]);

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

    $statut = (int)curl_getinfo(
        $curl,
        CURLINFO_RESPONSE_CODE
    );

    curl_close($curl);

    if ($statut < 200 || $statut >= 300) {
        error_log(
            '[TRIÈDRE] Supabase HTTP ' .
            $statut .
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

    return json_decode($reponse, true);
}


function requeteStripe(
    string $methode,
    string $url,
    string $secretKey,
    array $parametres
): mixed {

    $curl = curl_init($url);

    if ($curl === false) {
        throw new RuntimeException(
            'Impossible d’initialiser Stripe.'
        );
    }

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $methode,

        // Stripe utilise une authentification serveur.
        CURLOPT_USERPWD => $secretKey . ':',

        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'Content-Type: application/x-www-form-urlencoded',
        ],

        CURLOPT_POSTFIELDS => http_build_query(
            $parametres,
            '',
            '&',
            PHP_QUERY_RFC3986
        ),

        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
    ]);

    $reponse = curl_exec($curl);

    if ($reponse === false) {
        $message = curl_error($curl);
        curl_close($curl);

        throw new RuntimeException(
            'Erreur réseau Stripe : ' . $message
        );
    }

    $statut = (int)curl_getinfo(
        $curl,
        CURLINFO_RESPONSE_CODE
    );

    curl_close($curl);

    if ($statut < 200 || $statut >= 300) {
        error_log(
            '[TRIÈDRE] Stripe HTTP ' .
            $statut .
            ' : ' .
            $reponse
        );

        throw new RuntimeException(
            'Stripe a refusé la création du paiement.'
        );
    }

    return json_decode($reponse, true);
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