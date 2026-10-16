<?php
declare(strict_types=1);
// Endpoint PUBLIC Stripe. Ne pas utiliser une page de succès comme preuve de paiement.
//
// Événements à cocher dans Stripe › Webhooks (destination vers ce fichier) :
//   checkout.session.completed               → paiement confirmé (ou paiement différé en cours)
//   checkout.session.async_payment_succeeded → paiement différé confirmé
//   checkout.session.async_payment_failed    → paiement différé refusé : stock libéré
//   checkout.session.expired                 → session de 30 min expirée : stock libéré
header('Content-Type: application/json; charset=utf-8');
if($_SERVER['REQUEST_METHOD']!=='POST'){http_response_code(405);exit;}

function trWebhookOk(array $extra=[]):never{http_response_code(200);echo json_encode(['received'=>true]+$extra);exit;}

try{
 require_once __DIR__.'/notifications-lib.php';
 $c=require __DIR__.'/config.php';$secret=(string)($c['stripe_webhook_secret']??'');
 if($secret===''||strlen($secret)<16)throw new RuntimeException('Webhook non configuré');

 // 1. Signature Stripe (HMAC SHA-256) et fraîcheur de l'événement (5 min)
 $raw=file_get_contents('php://input');$header=(string)($_SERVER['HTTP_STRIPE_SIGNATURE']??'');
 if(!is_string($raw)||strlen($raw)>1048576||!preg_match('/(?:^|,)t=(\d+)/',$header,$m)){http_response_code(400);exit;}
 $timestamp=(int)$m[1];if(abs(time()-$timestamp)>300){http_response_code(400);exit;}
 preg_match_all('/(?:^|,)v1=([a-f0-9]{64})/i',$header,$sigs);
 $expected=hash_hmac('sha256',$timestamp.'.'.$raw,$secret);$valid=false;
 foreach($sigs[1] as $sig){if(hash_equals($expected,strtolower($sig)))$valid=true;}
 if(!$valid){http_response_code(400);exit;}

 // 2. Événement et commande concernés
 $event=json_decode($raw,true,512,JSON_THROW_ON_ERROR);
 $type=(string)($event['type']??'');
 $gere=['checkout.session.completed','checkout.session.async_payment_succeeded',
        'checkout.session.async_payment_failed','checkout.session.expired'];
 if(!in_array($type,$gere,true))trWebhookOk();
 $session=$event['data']['object']??[];
 if(($session['object']??'')!=='checkout.session')trWebhookOk();
 $sessionId=(string)($session['id']??'');
 $id=(string)($session['metadata']['order_id']??$session['client_reference_id']??'');
 if(!preg_match('/^[a-f0-9-]{36}$/i',$id))throw new RuntimeException('Référence invalide');

 // 3. Session expirée ou paiement différé refusé : on rend les articles réservés.
 //    Sans effet si ce n'est plus la session de la commande (paiement relancé) ou si elle est payée.
 if($type==='checkout.session.expired'||$type==='checkout.session.async_payment_failed'){
  $note=$type==='checkout.session.expired'?'Session de paiement expirée (30 min)':'Paiement refusé (paiement différé)';
  $r=trRpc($c,'triedre_stock_liberer_session',['p_order_id'=>$id,'p_session'=>$sessionId,'p_note'=>$note]);
  trWebhookOk(['stock_libere'=>($r['result']??false)===true]);
 }

 // 4. Paiement : contrôles stricts avant toute confirmation
 $order=trOrder($c,$id);
 if(!$order||($order['stripe_checkout_session_id']??'')!==$sessionId)throw new RuntimeException('Session différente');
 // Contrôle du montant/devise : ne jamais confirmer un montant différent.
 $expectedCents=(int)round(((float)$order['total_amount'])*100);
 if((int)($session['amount_total']??-1)!==$expectedCents||strtolower((string)($session['currency']??''))!==strtolower((string)($order['currency']??'cad')))throw new RuntimeException('Montant ou devise incohérent');

 if(($session['payment_status']??'')!=='paid'){
  // Paiement différé en cours (ex. prélèvement bancaire) : la réservation est maintenue
  // jusqu'à async_payment_succeeded ou async_payment_failed.
  if($type==='checkout.session.completed')trRpc($c,'triedre_stock_maintenir',['p_order_id'=>$id,'p_session'=>$sessionId]);
  trWebhookOk();
 }

 // Le stock est géré en base par le déclencheur triedre_orders_stock (réservation → vente).
 trRpc($c,'triedre_mark_order_paid',['p_order_id'=>$id,'p_session'=>$sessionId,'p_intent'=>(string)($session['payment_intent']??'')]);
 trWebhookOk();
}catch(Throwable $e){error_log('[TRIÈDRE webhook] '.$e->getMessage());http_response_code(500);echo '{"received":false}';}
