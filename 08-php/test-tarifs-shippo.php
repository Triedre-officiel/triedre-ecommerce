<?php
declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');

$config = require __DIR__ . '/config.php';
$shippoToken = $config['SHIPPO_LIVE_TOKEN'] ?? '';

if ($shippoToken === '') {
    http_response_code(500);
    exit('Erreur : SHIPPO_LIVE_TOKEN est absent de config.php.');
}

$adresseExpediteur = [
    'name'    => 'TRIÈDRE',
    'street1' => '308-170 Boulevard Réné-Lévesque Est',
    'city'    => 'Montréal',
    'state'   => 'QC',
    'zip'     => 'H2X 0G1',
    'country' => 'CA',
    'phone'   => '5146033856',
    'email'   => 'info@triedreofficiel.com',
];

$adresseDestinataire = [
    'name'    => 'Client test',
    'street1' => '1100 Boulevard René-Lévesque Est',
    'city'    => 'Québec',
    'state'   => 'QC',
    'zip'     => 'G1R 5V2',
    'country' => 'CA',
];

$colis = [
    'length'        => '13',
    'width'         => '10',
    'height'        => '2',
    'distance_unit' => 'in',
    'weight'        => '0.99',
    'mass_unit'     => 'lb',
];

$payload = [
    'address_from' => $adresseExpediteur,
    'address_to'   => $adresseDestinataire,
    'parcels'      => [$colis],
    'async'        => false,
];

$ch = curl_init('https://api.goshippo.com/shipments/');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: ShippoToken ' . $shippoToken,
        'Content-Type: application/json',
        'Accept: application/json',
    ],
    CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT        => 30,
]);

$response = curl_exec($ch);

if ($response === false) {
    $erreur = curl_error($ch);
    curl_close($ch);
    http_response_code(500);
    exit('Erreur cURL : ' . htmlspecialchars($erreur, ENT_QUOTES, 'UTF-8'));
}

$httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$data = json_decode($response, true);

function h($value): string {
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function afficherMessages(array $messages, string $titre): void {
    if (!$messages) return;
    echo '<div class="card warning">';
    echo '<h2>' . h($titre) . '</h2>';
    echo '<pre>' . h(json_encode($messages, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) . '</pre>';
    echo '</div>';
}

echo '<!doctype html><html lang="fr"><head><meta charset="utf-8">';
echo '<meta name="viewport" content="width=device-width,initial-scale=1">';
echo '<title>TRIÈDRE — Test tarifs Shippo V2</title>';
echo '<style>
body{font-family:Arial,sans-serif;background:#111;color:#eee;padding:24px;line-height:1.45}
.wrap{max-width:1050px;margin:auto} h1{font-size:24px} h2{font-size:18px;margin-top:0}
.card{background:#1c1c1c;border:1px solid #333;border-radius:12px;padding:18px;margin:14px 0}
.ok{color:#8fd694}.bad{color:#ff8b8b}.muted{color:#aaa}.warning{border-color:#8a6a2b}
table{width:100%;border-collapse:collapse;margin-top:12px} th,td{border-bottom:1px solid #333;padding:10px;text-align:left;vertical-align:top}
th{color:#d6b36a} pre{white-space:pre-wrap;word-break:break-word;background:#151515;padding:12px;border-radius:8px;overflow:auto}
.small{font-size:13px;color:#aaa}
</style></head><body><div class="wrap">';

echo '<h1>TRIÈDRE — Test de tarifs Shippo V2</h1>';
echo '<div class="card"><strong>Colis :</strong> 14 × 11 × 4 po — 2 lb<br>';
echo '<span class="muted">Cette page demande uniquement des tarifs. Elle n’achète aucune étiquette.</span></div>';

if ($httpCode < 200 || $httpCode >= 300) {
    echo '<div class="card"><p class="bad"><strong>Shippo a retourné HTTP ' . h($httpCode) . '.</strong></p>';
    echo '<pre>' . h(json_encode($data ?? $response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) . '</pre>';
    echo '</div></div></body></html>';
    exit;
}

echo '<div class="card"><p class="ok"><strong>Requête acceptée par Shippo.</strong></p>';
echo '<div class="small">Shipment ID : ' . h($data['object_id'] ?? '—') . '</div></div>';

$messagesGlobaux = $data['messages'] ?? [];
afficherMessages(is_array($messagesGlobaux) ? $messagesGlobaux : [], 'Messages Shippo / transporteurs');

$rates = $data['rates'] ?? [];

if (!$rates) {
    echo '<div class="card"><p>Aucun tarif n’a été retourné.</p></div>';
} else {
    usort($rates, static function (array $a, array $b): int {
        return (float)($a['amount'] ?? 0) <=> (float)($b['amount'] ?? 0);
    });

    echo '<div class="card"><h2>Tarifs retournés</h2><table>';
    echo '<thead><tr><th>Transporteur</th><th>Service</th><th>Tarif</th><th>Délai</th><th>Messages du tarif</th></tr></thead><tbody>';

    foreach ($rates as $rate) {
        $provider = $rate['provider'] ?? '—';
        $service  = $rate['servicelevel']['name'] ?? ($rate['servicelevel']['token'] ?? '—');
        $amount   = $rate['amount'] ?? '—';
        $currency = $rate['currency'] ?? '';
        $days     = $rate['estimated_days'] ?? null;
        $rateMessages = $rate['messages'] ?? [];

        echo '<tr><td>' . h($provider) . '</td><td>' . h($service) . '</td>';
        echo '<td><strong>' . h($amount . ' ' . $currency) . '</strong></td>';
        echo '<td>' . ($days !== null ? h($days . ' jour(s)') : '—') . '</td>';
        echo '<td>' . ((is_array($rateMessages) && $rateMessages)
            ? '<pre>' . h(json_encode($rateMessages, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) . '</pre>'
            : '—') . '</td></tr>';
    }

    echo '</tbody></table></div>';
}

$diagnostic = [
    'object_state' => $data['object_state'] ?? null,
    'status'       => $data['status'] ?? null,
    'test'         => $data['test'] ?? null,
    'metadata'     => $data['metadata'] ?? null,
];

echo '<div class="card"><h2>Diagnostic Shippo</h2><pre>';
echo h(json_encode($diagnostic, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
echo '</pre></div>';

echo '<div class="card muted">Référence commerciale : Printful avait facturé 25,51 CAD de livraison pour l’envoi de référence.</div>';
echo '</div></body></html>';
