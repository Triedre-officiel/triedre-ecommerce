<?php
declare(strict_types=1);
// EXÉCUTION CLI UNIQUEMENT (cron Hostinger), jamais depuis le navigateur.
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require_once __DIR__.'/notifications-lib.php';
$c=require __DIR__.'/config.php';
try{
 trRpc($c,'triedre_queue_due_reminders');
 for($n=0;$n<30;$n++){
  $jobs=trRpc($c,'triedre_claim_email_job');if(!$jobs)break;
  $j=$jobs[0];$id=(int)$j['id'];
  try {
  $order=trOrder($c,(string)$j['order_id']);
  $kind=(string)$j['kind'];$eligible=$order && (
   ($kind==='paid_confirmation' && ($order['payment_status']??'')==='paid' && ($order['status']??'')==='paid' && !empty($order['paid_at'])) ||
   ($kind==='pending_reminder' && ($order['payment_status']??'')==='pending' && ($order['status']??'')==='pending' && empty($order['paid_at']) && strtotime((string)$order['created_at'])<=time()-86400)
  );
  if(!$eligible){trRequest($c,'PATCH','/rest/v1/order_email_jobs?id=eq.'.$id,['state'=>'skipped','last_error'=>'Commande non éligible']);continue;}
  // Dernière vérification Stripe pour ne jamais rappeler une commande payée mais pas encore synchronisée.
  if($kind==='pending_reminder'&&!empty($order['stripe_checkout_session_id'])){
   $ch=curl_init('https://api.stripe.com/v1/checkout/sessions/'.rawurlencode((string)$order['stripe_checkout_session_id']));
   curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_USERPWD=>(string)$c['stripe_secret_key'].':',CURLOPT_TIMEOUT=>20]);
   $raw=curl_exec($ch);$code=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);curl_close($ch);
   if($code!==200)throw new RuntimeException('Stripe indisponible : rappel différé');
   $session=json_decode((string)$raw,true);
   if(($session['payment_status']??'')==='paid'){trRequest($c,'PATCH','/rest/v1/order_email_jobs?id=eq.'.$id,['state'=>'skipped','last_error'=>'Paiement constaté dans Stripe']);continue;}
  }
  $items=trRequest($c,'GET','/rest/v1/order_items?order_id=eq.'.rawurlencode((string)$j['order_id']).'&select=product_name,color,size,quantity,unit_price');
  [$subject,$html]=trTemplate($order,$kind,$items);
  trMail($c,(string)$order['customer_email'],$subject,$html);
  trRequest($c,'PATCH','/rest/v1/order_email_jobs?id=eq.'.$id.'&state=eq.sending',['state'=>'sent','sent_at'=>gmdate('c'),'last_error'=>null]);
  } catch (Throwable $jobError) {
   // L'envoi a pu être accepté par SMTP avant une erreur de suivi : ne jamais relancer automatiquement.
   error_log('[TRIÈDRE cron] Job '.$id.' : '.$jobError->getMessage());
   try { trRequest($c,'PATCH','/rest/v1/order_email_jobs?id=eq.'.$id.'&state=eq.sending',[
     'state'=>'failed', 'last_error'=>'Résultat incertain : vérification manuelle nécessaire avant toute relance'
   ]); } catch (Throwable $updateError) { error_log('[TRIÈDRE cron] Mise à jour job '.$id.' impossible : '.$updateError->getMessage()); }
  }
 }
}catch(Throwable $e){error_log('[TRIÈDRE cron] '.$e->getMessage());exit(1);}
