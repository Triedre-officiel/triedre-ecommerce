<?php
declare(strict_types=1);

// ============================================================================
// TRIÈDRE — Règles de livraison partagées (tarifs, livraison gratuite, sécurité)
// Utilisé par tarifs-postes-canada.php et creer-commande.php.
// ============================================================================

const TR_LIV_SEUIL_GRATUITE = 100.00;   // Livraison standard offerte dès ce sous-total (CAD)
const TR_LIV_CODE_STANDARD = 'DOM.RP';  // Postes Canada — Colis standard
const TR_LIV_DUREE_VALIDITE = 1800;     // Un tarif affiché reste valable 30 minutes

// Services Postes Canada proposés au client, dans l'ordre d'affichage.
const TR_LIV_SERVICES = [
    'DOM.RP' => 'Livraison standard',
    'DOM.EP' => 'Livraison accélérée',
    'DOM.XP' => 'Livraison express',
    'DOM.PC' => 'Livraison prioritaire',
];

function trLivNomService(string $code): string
{
    return TR_LIV_SERVICES[$code] ?? 'Livraison';
}

// Retrouve le code Postes Canada à partir d'un code ou d'un nom (anglais ou français).
function trLivCodeService(string $codeOuNom): ?string
{
    $valeur = strtolower(trim($codeOuNom));
    $correspondances = [
        'dom.rp' => 'DOM.RP', 'regular parcel' => 'DOM.RP', 'colis standard' => 'DOM.RP',
        'dom.ep' => 'DOM.EP', 'expedited parcel' => 'DOM.EP', 'colis accélérés' => 'DOM.EP',
        'dom.xp' => 'DOM.XP', 'xpresspost' => 'DOM.XP',
        'dom.pc' => 'DOM.PC', 'priority' => 'DOM.PC', 'priorité' => 'DOM.PC',
    ];
    return $correspondances[$valeur] ?? null;
}

function trLivLireMontant(mixed $objet): ?float
{
    if (!is_array($objet)) return null;
    foreach (['due', 'totalPrice', 'price', 'amount', 'total', 'totalCharge', 'total_charge'] as $cle) {
        if (isset($objet[$cle]) && is_numeric($objet[$cle]) && (float)$objet[$cle] >= 0) {
            return round((float)$objet[$cle], 2);
        }
    }
    return null;
}

// Cherche un délai (jours) ou une date de livraison estimée dans la réponse Postes Canada.
function trLivLireDelai(array $objet, int $profondeur = 0): array
{
    $resultat = ['jours' => null, 'date' => null];
    if ($profondeur > 3) return $resultat;

    foreach ($objet as $cle => $valeur) {
        $cleTexte = strtolower((string)$cle);
        if ($resultat['jours'] === null && preg_match('/transit/', $cleTexte) && is_numeric($valeur)) {
            $resultat['jours'] = (int)$valeur;
        }
        if ($resultat['date'] === null && preg_match('/delivery.?date/', $cleTexte) && is_string($valeur)
            && preg_match('/^\d{4}-\d{2}-\d{2}/', $valeur)) {
            $resultat['date'] = substr($valeur, 0, 10);
        }
        if (is_array($valeur) && ($resultat['jours'] === null || $resultat['date'] === null)) {
            $sous = trLivLireDelai($valeur, $profondeur + 1);
            $resultat['jours'] ??= $sous['jours'];
            $resultat['date'] ??= $sous['date'];
        }
    }
    return $resultat;
}

// Transforme la réponse Postes Canada en options simples : code, nom, montant, délai.
function trLivExtraireOptions(array $donnees): array
{
    $options = [];

    $parcourir = function (mixed $valeur) use (&$parcourir, &$options): void {
        if (!is_array($valeur)) return;

        if (!array_is_list($valeur)) {
            $nom = (string)($valeur['serviceCode'] ?? $valeur['service_code'] ?? $valeur['serviceName']
                ?? $valeur['service'] ?? $valeur['name'] ?? '');
            $code = $nom !== '' ? trLivCodeService($nom) : null;

            // Le nom peut être fourni à part du code : on essaie les deux.
            if ($code === null) {
                foreach (['serviceName', 'name', 'service'] as $cle) {
                    if (isset($valeur[$cle]) && is_string($valeur[$cle])) {
                        $code = trLivCodeService($valeur[$cle]);
                        if ($code !== null) break;
                    }
                }
            }

            $montant = trLivLireMontant($valeur);
            if ($montant === null && isset($valeur['priceDetails'])) {
                $montant = trLivLireMontant($valeur['priceDetails']);
            }

            if ($code !== null && $montant !== null && !isset($options[$code])) {
                $delai = trLivLireDelai($valeur);
                $options[$code] = [
                    'code' => $code,
                    'nom' => trLivNomService($code),
                    'montant_original' => $montant,
                    'montant' => $montant,
                    'gratuit' => false,
                    'delai_jours' => $delai['jours'],
                    'date_estimee' => $delai['date'],
                ];
            }
        }

        foreach ($valeur as $enfant) {
            $parcourir($enfant);
        }
    };

    $parcourir($donnees);

    // Ordre d'affichage : standard, accélérée, express, prioritaire.
    $tries = [];
    foreach (array_keys(TR_LIV_SERVICES) as $code) {
        if (isset($options[$code])) $tries[] = $options[$code];
    }
    return $tries;
}

// Livraison standard offerte dès le seuil ; les options plus rapides restent payantes.
function trLivAppliquerGratuite(array $options, float $sousTotal): array
{
    if ($sousTotal + 0.001 < TR_LIV_SEUIL_GRATUITE) return $options;

    foreach ($options as &$option) {
        if ($option['code'] === TR_LIV_CODE_STANDARD) {
            $option['montant'] = 0.0;
            $option['gratuit'] = true;
        }
    }
    unset($option);
    return $options;
}

// Empreinte du panier (SKU + quantités) pour lier un tarif à un panier précis.
function trLivEmpreintePanier(array $quantitesParSku): string
{
    $lignes = [];
    foreach ($quantitesParSku as $sku => $quantite) {
        $lignes[] = strtoupper(trim((string)$sku)) . ':' . (int)$quantite;
    }
    sort($lignes);
    return hash('sha256', implode('|', $lignes));
}

function trLivCleSignature(array $config): string
{
    $secret = (string)($config['supabase_secret_key'] ?? '');
    if ($secret === '') throw new RuntimeException('Clé serveur absente pour signer la livraison.');
    return hash('sha256', 'triedre-livraison|' . $secret);
}

// Signature : le navigateur ne peut pas modifier le prix d'un tarif sans l'invalider.
function trLivSigner(array $config, string $code, float $montantOriginal, string $codePostal, string $empreinte, int $expiration): string
{
    $donnees = implode('|', [$code, number_format($montantOriginal, 2, '.', ''), strtoupper(preg_replace('/\s+/', '', $codePostal)), $empreinte, $expiration]);
    return hash_hmac('sha256', $donnees, trLivCleSignature($config));
}

function trLivVerifier(array $config, string $code, float $montantOriginal, string $codePostal, string $empreinte, int $expiration, string $jeton): bool
{
    if ($expiration < time()) return false;
    $attendu = trLivSigner($config, $code, $montantOriginal, $codePostal, $empreinte, $expiration);
    return hash_equals($attendu, $jeton);
}

// ============================================================================
// Emballage — choix automatique du colis selon le contenu du panier
// ============================================================================

// Tes emballages, du plus petit au plus grand.
// Ajuste les poids après avoir pesé chaque emballage vide.
const TR_LIV_EMBALLAGES = [
    'pochette' => [
        'nom' => 'Pochette 33 × 25 cm',
        'dimensions' => ['length' => 33.0, 'width' => 25.4, 'height' => 5.1],
        'poids_g' => 9.1,
        'max_articles' => 2,      // Validé : 1 à 2 articles
        'capacite' => 6,
    ],
    'boite' => [
        'nom' => 'Boîte 14 × 11 × 4 po',
        'dimensions' => ['length' => 35.6, 'width' => 27.9, 'height' => 10.2],
        'poids_g' => 280.0,       // Estimation — à remplacer par le poids réel de la boîte vide
        'max_articles' => 99,
        'capacite' => 6,          // Validé : hoodie + t-shirt + casquette (3 + 1 + 2)
    ],
    'grande_boite' => [
        'nom' => 'Grande boîte 18 × 14 × 8 po',
        'dimensions' => ['length' => 45.7, 'width' => 35.6, 'height' => 20.3],
        'poids_g' => 550.0,       // Estimation — à remplacer par le poids réel de la boîte vide
        'max_articles' => 99,
        'capacite' => 18,         // ≈ 3 fois le volume de la boîte 14 × 11 × 4
    ],
];

// La grande boîte n'est utilisée que si son contenu demanderait au moins 3 petites boîtes.
// En dessous, 1 ou 2 petits colis coûtent moins cher (Postes Canada facture aussi le volume).
const TR_LIV_SEUIL_GRANDE_BOITE = 12;

// Place occupée par chaque type de produit (préfixe du SKU), en « unités ».
const TR_LIV_VOLUMES = [
    'TRD-HD'  => 3,   // Hoodie
    'TRD-VST' => 2,   // Veste légère
    'TRD-CAP' => 2,   // Casquette (forme à protéger)
    'TRD-TS'  => 1,   // T-shirt
    'TRD-LEG' => 1,   // Leggings
    'TRD-BRA' => 1,   // Brassière
];
const TR_LIV_VOLUME_PAR_DEFAUT = 2;
const TR_LIV_POIDS_MAX_COLIS_G = 15000;
const TR_LIV_MAX_COLIS = 30;  // Garde-fou anti-abus seulement

function trLivVolumeSku(string $sku): float
{
    $sku = strtoupper($sku);
    foreach (TR_LIV_VOLUMES as $prefixe => $volume) {
        if (str_starts_with($sku, $prefixe . '-')) return (float)$volume;
    }
    return (float)TR_LIV_VOLUME_PAR_DEFAUT;
}

// Range les articles (déjà triés du plus gros au plus petit) dans des groupes d'une capacité donnée.
function trLivRemplir(array $articles, float $capacite, float $poidsEmballageG): array
{
    $groupes = [];
    foreach ($articles as $article) {
        if ($article['volume'] > $capacite) {
            throw new RuntimeException('Un article dépasse la capacité de l’emballage.');
        }
        $place = false;
        foreach ($groupes as &$groupe) {
            if ($groupe['volume'] + $article['volume'] <= $capacite
                && $groupe['poids'] + $article['poids'] + $poidsEmballageG <= TR_LIV_POIDS_MAX_COLIS_G) {
                $groupe['volume'] += $article['volume'];
                $groupe['poids'] += $article['poids'];
                $groupe['articles'][] = $article;
                $place = true;
                break;
            }
        }
        unset($groupe);
        if (!$place) {
            $groupes[] = ['volume' => $article['volume'], 'poids' => $article['poids'], 'articles' => [$article]];
        }
    }
    return $groupes;
}

/**
 * Répartit les articles dans le moins de colis possible, au meilleur coût.
 * $quantites : [sku => quantité], $poidsSku : [sku => grammes]
 * Retourne une liste de colis : emballage, nombre d'articles, poids (g et kg), dimensions.
 */
function trLivPreparerColis(array $quantites, array $poidsSku): array
{
    $articles = [];
    foreach ($quantites as $sku => $qte) {
        for ($i = 0; $i < $qte; $i++) {
            $articles[] = ['sku' => (string)$sku, 'poids' => (float)$poidsSku[$sku], 'volume' => trLivVolumeSku((string)$sku)];
        }
    }

    // Les plus gros articles d'abord.
    usort($articles, fn($a, $b) => $b['volume'] <=> $a['volume'] ?: $b['poids'] <=> $a['poids']);

    $grande = TR_LIV_EMBALLAGES['grande_boite'];
    $petite = TR_LIV_EMBALLAGES['boite'];

    // 1) On remplit d'abord des grandes boîtes.
    // 2) Une grande boîte peu remplie est redécoupée en petits colis, moins chers.
    $groupesFinaux = [];
    foreach (trLivRemplir($articles, $grande['capacite'], $grande['poids_g']) as $groupe) {
        if ($groupe['volume'] > TR_LIV_SEUIL_GRANDE_BOITE) {
            $groupe['emballage'] = 'grande_boite';
            $groupesFinaux[] = $groupe;
            continue;
        }
        foreach (trLivRemplir($groupe['articles'], $petite['capacite'], $petite['poids_g']) as $petitGroupe) {
            $groupesFinaux[] = $petitGroupe;
        }
    }

    if (count($groupesFinaux) > TR_LIV_MAX_COLIS) {
        throw new LengthException('Commande trop volumineuse pour un calcul automatique.');
    }

    // Chaque petit groupe part dans le plus petit emballage qui le contient.
    $colis = [];
    foreach ($groupesFinaux as $groupe) {
        $choix = $groupe['emballage'] ?? null;
        if ($choix === null) {
            foreach (TR_LIV_EMBALLAGES as $cle => $emballage) {
                if (count($groupe['articles']) <= $emballage['max_articles'] && $groupe['volume'] <= $emballage['capacite']) {
                    $choix = $cle;
                    break;
                }
            }
        }
        $emballage = TR_LIV_EMBALLAGES[$choix ?? 'grande_boite'];
        $poidsG = $groupe['poids'] + $emballage['poids_g'];
        $colis[] = [
            'emballage' => $emballage['nom'],
            'articles' => count($groupe['articles']),
            'poids_g' => round($poidsG, 1),
            'poids_kg' => ceil($poidsG) / 1000,
            'dimensions' => $emballage['dimensions'],
        ];
    }
    return $colis;
}

/**
 * Additionne les tarifs de plusieurs colis, service par service.
 * Seuls les services disponibles pour TOUS les colis sont gardés.
 */
function trLivCombinerOptions(array $optionsParColis): array
{
    if (count($optionsParColis) === 1) return $optionsParColis[0];

    $combinees = null;
    foreach ($optionsParColis as $options) {
        $parCode = [];
        foreach ($options as $option) $parCode[$option['code']] = $option;

        if ($combinees === null) {
            $combinees = $parCode;
            continue;
        }
        foreach ($combinees as $code => &$total) {
            if (!isset($parCode[$code])) { unset($combinees[$code]); continue; }
            $autre = $parCode[$code];
            $total['montant_original'] = round($total['montant_original'] + $autre['montant_original'], 2);
            $total['montant'] = $total['montant_original'];
            $total['delai_jours'] = max((int)$total['delai_jours'], (int)$autre['delai_jours']) ?: null;
            if ($autre['date_estimee'] && (!$total['date_estimee'] || $autre['date_estimee'] > $total['date_estimee'])) {
                $total['date_estimee'] = $autre['date_estimee'];
            }
        }
        unset($total);
    }
    return array_values($combinees ?? []);
}
