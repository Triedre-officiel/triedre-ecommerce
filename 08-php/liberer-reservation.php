<?php
declare(strict_types=1);
// ============================================================================
// TRIÈDRE — Retour du client sans paiement (bouton « Retour » de Stripe)
// Ferme la session Stripe encore ouverte puis remet immédiatement en stock les
// articles réservés. Le client peut ainsi repasser commande tout de suite, sans
// être bloqué par sa propre réservation.
// Entrée : POST {"order_id": "<uuid>"} — jeton membre requis si la commande est liée à un compte.
// ============================================================================
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

function trReponse(array $donnees, int $statut = 200): never {
  http_response_code($statut);
  echo json_encode($donnees, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') trReponse(['success' => false, 'message' => 'Méthode interdite.'], 405);

try {
  require_once __DIR__ . '/notifications-lib.php';
  require_once __DIR__ . '/commandes-auth.php';
  $c = require __DIR__ . '/config.php';
  $url = rtrim((string)($c['supabase_url'] ?? ''), '/');
  $key = (string)($c['supabase_secret_key'] ?? '');
  $stripe = (string)($c['stripe_secret_key'] ?? '');
  if ($url === '' || $key === '' || $stripe === '') throw new RuntimeException('Configuration indisponible.');

  $payload = json_decode((string)file_get_contents('php://input'), true);
  $id = (string)($payload['order_id'] ?? '');
  if (!preg_match('/^[a-f0-9-]{36}$/i', $id)) trReponse(['success' => false, 'message' => 'Commande invalide.'], 422);

  $order = trOrder($c, $id);
  if (!$order) trReponse(['success' => false, 'message' => 'Commande introuvable.'], 404);

  // Commande liée à un compte : seul son propriétaire peut agir dessus.
  $owner = (string)($order['user_id'] ?? '');
  if ($owner !== '') {
    $actor = membreAuthentifie($url, $key);
    if ($actor === null || !hash_equals($owner, $actor)) trReponse(['success' => false, 'message' => 'Accès refusé.'], 403);
  }

  if (($order['payment_status'] ?? '') === 'paid') trReponse(['success' => true, 'etat' => 'payee']);
  if (($order['status'] ?? '') !== 'pending') trReponse(['success' => true, 'etat' => (string)($order['status'] ?? '')]);

  $sid = (string)($order['stripe_checkout_session_id'] ?? '');
  if ($sid === '') trReponse(['success' => true, 'etat' => 'sans_paiement']);

  // Ne jamais libérer un paiement en cours de confirmation.
  $session = stripeSession($stripe, $sid);
  if (($session['payment_status'] ?? '') === 'paid' || ($session['status'] ?? '') === 'complete') {
    trReponse(['success' => true, 'etat' => 'payee']);
  }
  // Session encore ouverte : on la ferme, le client ne pourra plus payer ce lien.
  if (($session['status'] ?? '') === 'open') stripeSession($stripe, $sid, true);

  $r = trRpc($c, 'triedre_stock_liberer_session', [
    'p_order_id' => $id, 'p_session' => $sid, 'p_note' => 'Paiement abandonné (retour du client sur le site)',
  ]);
  trReponse(['success' => true, 'etat' => 'liberee', 'stock_libere' => ($r['result'] ?? false) === true]);
} catch (Throwable $e) {
  // Sans gravité pour le client : l'expiration Stripe ou le cron libéreront le stock.
  error_log('[TRIÈDRE] Libération réservation : ' . $e->getMessage());
  trReponse(['success' => false, 'message' => 'Libération différée.'], 503);
}
