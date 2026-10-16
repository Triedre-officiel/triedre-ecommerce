<?php
declare(strict_types=1);
// EXÉCUTION CLI UNIQUEMENT (cron Hostinger), jamais depuis le navigateur.
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require_once __DIR__.'/notifications-lib.php';
$c=require __DIR__.'/config.php';

// Journal visible dans « Afficher le résultat » (Hostinger) ET dans le journal d'erreurs PHP.
function trLog(string $message):void{
 $ligne='['.gmdate('Y-m-d H:i:s').' UTC] '.$message;
 echo $ligne.PHP_EOL;
 error_log('[TRIÈDRE cron] '.$message);
}

// Filet de sécurité du stock : libère les réservations expirées (paiement jamais finalisé)
// si un événement Stripe s'est perdu. Une erreur ici n'empêche pas l'envoi des courriels.
try{
 $liberees=(int)(trRpc($c,'triedre_stock_liberer_expirees')['result']??0);
 if($liberees>0)trLog('Stock : '.$liberees.' réservation(s) expirée(s) libérée(s).');
}catch(Throwable $e){trLog('Stock : libération des réservations impossible : '.$e->getMessage());}

$envoyes=0;$ignores=0;
try{
 trRpc($c,'triedre_queue_due_reminders');
 for($n=0;$n<30;$n++){
  $jobs=trRpc($c,'triedre_claim_email_job');
  if(!$jobs){trLog('Aucun mail en attente.');break;}
  $j=$jobs[0];$id=(int)$j['id'];$order=trOrder($c,(string)$j['order_id']);
  $kind=(string)$j['kind'];$eligible=$order && (
   ($kind==='paid_confirmation' && ($order['payment_status']??'')==='paid' && ($order['status']??'')==='paid' && !empty($order['paid_at'])) ||
   ($kind==='pending_reminder' && ($order['payment_status']??'')==='pending' && ($order['status']??'')==='pending' && empty($order['paid_at']) && strtotime((string)$order['created_at'])<=time()-86400)
  );
  if(!$eligible){
   trRequest($c,'PATCH','/rest/v1/order_email_jobs?id=eq.'.$id,['state'=>'skipped','last_error'=>'Commande non éligible']);
   trLog('Job '.$id.' ('.$kind.') ignoré : commande non éligible.');$ignores++;continue;
  }
  // Dernière vérification Stripe pour ne jamais rappeler une commande payée mais pas encore synchronisée.
  if($kind==='pending_reminder'&&!empty($order['stripe_checkout_session_id'])){
   $ch=curl_init('https://api.stripe.com/v1/checkout/sessions/'.rawurlencode((string)$order['stripe_checkout_session_id']));
   curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_USERPWD=>(string)$c['stripe_secret_key'].':',CURLOPT_TIMEOUT=>20]);
   $raw=curl_exec($ch);$code=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);curl_close($ch);
   if($code!==200)throw new RuntimeException('Stripe indisponible : rappel différé');
   $session=json_decode((string)$raw,true);
   if(($session['payment_status']??'')==='paid'){
    trRequest($c,'PATCH','/rest/v1/order_email_jobs?id=eq.'.$id,['state'=>'skipped','last_error'=>'Paiement constaté dans Stripe']);
    trLog('Job '.$id.' ignoré : paiement constaté dans Stripe.');$ignores++;continue;
   }
  }
  $items=trRequest($c,'GET','/rest/v1/order_items?order_id=eq.'.rawurlencode((string)$j['order_id']).'&select=product_name,color,size,quantity,unit_price');
  // Adresse du site pour le bouton du mail ('site_url' dans config.php, sinon le site de production).
  $order['_site_url']=(string)($c['site_url']??'https://www.triedreofficiel.com');
  [$subject,$html]=trTemplate($order,$kind,$items);
  try{
   trMail($c,(string)$order['customer_email'],$subject,$html);
  }catch(Throwable $mailError){
   // L'échec est enregistré sur le job (colonne last_error) : la tâche réessaiera, jusqu'à 3 tentatives.
   trRequest($c,'PATCH','/rest/v1/order_email_jobs?id=eq.'.$id,['state'=>'queued','last_error'=>substr($mailError->getMessage(),0,500)]);
   throw $mailError;
  }
  trRequest($c,'PATCH','/rest/v1/order_email_jobs?id=eq.'.$id,['state'=>'sent','sent_at'=>gmdate('c'),'last_error'=>null]);
  trLog('Job '.$id.' ('.$kind.') envoyé à la commande '.($order['order_number']??'').'.');$envoyes++;
 }
 trLog('Terminé : '.$envoyes.' envoyé(s), '.$ignores.' ignoré(s).');
}catch(Throwable $e){trLog('ERREUR : '.$e->getMessage());exit(1);}
