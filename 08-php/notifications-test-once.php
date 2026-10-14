<?php
declare(strict_types=1);
// Uniquement en CLI local. Aucun cron, aucune route HTTP, aucun rappel.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require_once __DIR__.'/notifications-lib.php';
$orderNumber = 'TRD-20261013-91D83A';
$c = require __DIR__.'/config.php';
// URL HTTPS publique de l'espace membre, à définir dans config.php (ne jamais partager).
$memberUrl = trim((string)($c['member_orders_url'] ?? ''));
if (!filter_var($memberUrl,FILTER_VALIDATE_URL) || !str_starts_with($memberUrl,'https://')) {
 // L'URL du bouton est facultative pendant le test local : ne jamais bloquer SMTP pour ce motif.
 $memberUrl = '';
 echo "Lien espace membre non configure : bouton omis du courriel de test.\n";
}
if (!isset($c['supabase_url'],$c['supabase_secret_key'],$c['smtp_host'],$c['smtp_port'],$c['smtp_username'],$c['smtp_password'])) {
 fwrite(STDERR,"Configuration SMTP/Supabase incomplète.\n"); exit(1);
}
try {
 $jobs = trRpc($c,'triedre_claim_test_confirmation',['p_order_number'=>$orderNumber]);
 if (count($jobs)!==1) { echo "Aucune confirmation en attente pour cette commande (déjà traitée ou non éligible).\n"; exit(0); }
 $job=$jobs[0]; $id=(int)$job['id'];
 try {
  $order=trOrder($c,(string)$job['order_id']);
  if (!$order || ($order['order_number']??'')!==$orderNumber || ($order['payment_status']??'')!=='paid' || ($order['status']??'')!=='paid' || empty($order['paid_at'])) {
   throw new RuntimeException('Commande non éligible');
  }
  $order['_member_url']=$memberUrl;
  $items=trRequest($c,'GET','/rest/v1/order_items?order_id=eq.'.rawurlencode((string)$job['order_id']).'&select=product_name,color,size,quantity,unit_price');
  [$subject,$html]=trTemplate($order,'paid_confirmation',$items);
  trMail($c,(string)($order['customer_email']??''),$subject,$html);
  trRequest($c,'PATCH','/rest/v1/order_email_jobs?id=eq.'.$id.'&state=eq.sending',['state'=>'sent','sent_at'=>gmdate('c'),'last_error'=>null]);
  echo "SMTP accepté; notification marquée sent. Vérifier la réception.\n";
 } catch (Throwable $e) {
  // Pas de relance automatique : l'envoi peut avoir été accepté par SMTP avant une erreur de suivi.
  try {trRequest($c,'PATCH','/rest/v1/order_email_jobs?id=eq.'.$id.'&state=eq.sending',['state'=>'failed','last_error'=>'Vérification manuelle nécessaire avant tout nouvel essai']);} catch(Throwable $ignored) {}
  error_log('[TRIEDRE test mail] Commande '.$orderNumber.' : '.get_class($e).' : '.$e->getMessage());
  fwrite(STDERR,"Échec ou résultat incertain : contrôler la boîte et la table avant toute relance.\n");exit(1);
 }
} catch(Throwable $e) {error_log('[TRIEDRE test mail] '.$e->getMessage());fwrite(STDERR,"Erreur technique. Consulter les journaux PHP.\n");exit(1);}
