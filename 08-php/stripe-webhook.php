<?php
declare(strict_types=1);
// Endpoint PUBLIC Stripe. Ne pas utiliser une page de succès comme preuve de paiement.
header('Content-Type: application/json; charset=utf-8');
if($_SERVER['REQUEST_METHOD']!=='POST'){http_response_code(405);exit;}
try{
 require_once __DIR__.'/notifications-lib.php';
 $c=require __DIR__.'/config.php';$secret=(string)($c['stripe_webhook_secret']??'');
 if($secret===''||strlen($secret)<16)throw new RuntimeException('Webhook non configuré');
 $raw=file_get_contents('php://input');$header=(string)($_SERVER['HTTP_STRIPE_SIGNATURE']??'');
 if(!is_string($raw)||strlen($raw)>1048576||!preg_match('/(?:^|,)t=(\d+)/',$header,$m)){http_response_code(400);exit;}
 $timestamp=(int)$m[1];if(abs(time()-$timestamp)>300){http_response_code(400);exit;}
 preg_match_all('/(?:^|,)v1=([a-f0-9]{64})/i',$header,$sigs);
 $expected=hash_hmac('sha256',$timestamp.'.'.$raw,$secret);$valid=false;
 foreach($sigs[1] as $sig){if(hash_equals($expected,strtolower($sig)))$valid=true;}
 if(!$valid){http_response_code(400);exit;}
 $event=json_decode($raw,true,512,JSON_THROW_ON_ERROR);
 if(!in_array($event['type']??'', ['checkout.session.completed','checkout.session.async_payment_succeeded'],true)){http_response_code(200);echo '{"received":true}';exit;}
 $session=$event['data']['object']??[];
 if(($session['object']??'')!=='checkout.session'||($session['payment_status']??'')!=='paid'){http_response_code(200);echo '{"received":true}';exit;}
 $id=(string)($session['metadata']['order_id']??$session['client_reference_id']??'');
 if(!preg_match('/^[a-f0-9-]{36}$/i',$id))throw new RuntimeException('Référence invalide');
 $order=trOrder($c,$id);
 if(!$order||($order['stripe_checkout_session_id']??'')!==($session['id']??''))throw new RuntimeException('Session différente');
 // Contrôle du montant/devise : ne jamais confirmer un montant différent.
 $expectedCents=(int)round(((float)$order['total_amount'])*100);
 if((int)($session['amount_total']??-1)!==$expectedCents||strtolower((string)($session['currency']??''))!==strtolower((string)($order['currency']??'cad')))throw new RuntimeException('Montant ou devise incohérent');
 trRpc($c,'triedre_mark_order_paid',['p_order_id'=>$id,'p_session'=>(string)$session['id'],'p_intent'=>(string)($session['payment_intent']??'')]);
 http_response_code(200);echo '{"received":true}';
}catch(Throwable $e){error_log('[TRIÈDRE webhook] '.$e->getMessage());http_response_code(500);echo '{"received":false}';}
