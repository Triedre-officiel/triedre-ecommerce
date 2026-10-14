<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['success'=>false,'message'=>'Méthode interdite.']); exit; }
try {
  $config=require __DIR__.'/config.php';
  $url=rtrim((string)($config['supabase_url']??''),'/');
  $key=(string)($config['supabase_secret_key']??'');
  $stripe=(string)($config['stripe_secret_key']??'');
  if(!$url||!$key||!$stripe) throw new RuntimeException('Configuration indisponible.');
  require_once __DIR__.'/commandes-auth.php';
  $actor=membreAuthentifie($url,$key);
  if(!$actor){http_response_code(401);echo json_encode(['success'=>false,'message'=>'Reconnecte-toi.']);exit;}
  $payload=json_decode(file_get_contents('php://input'),true);
  $id=(string)($payload['order_id']??'');
  if(!preg_match('/^[a-f0-9-]{36}$/i',$id)){http_response_code(422);echo json_encode(['success'=>false,'message'=>'Commande invalide.']);exit;}
  $headers=['apikey: '.$key,'Authorization: Bearer '.$key,'Accept: application/json','Content-Type: application/json','Prefer: return=representation'];
  $request=function(string $method,string $endpoint,?array $data=null) use($headers):array {
    $ch=curl_init($endpoint);
    curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_HTTPHEADER=>$headers,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>20]);
    if($data!==null)curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($data));
    $body=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);curl_close($ch);
    if($status<200||$status>=300)throw new RuntimeException('Échec de la vérification de commande.');
    $decoded=is_string($body)&&$body!==''?json_decode($body,true):[];
    return is_array($decoded)?$decoded:[];
  };
  $rows=$request('GET',$url.'/rest/v1/orders?id=eq.'.rawurlencode($id).'&user_id=eq.'.rawurlencode($actor).'&select=id,status,payment_status,paid_at,stripe_checkout_session_id');
  if(!$rows){http_response_code(404);echo json_encode(['success'=>false,'message'=>'Commande introuvable.']);exit;}
  $order=$rows[0];
  if(($order['status']??'')!=='pending'||($order['payment_status']??'')!=='pending'||!empty($order['paid_at'])){
    http_response_code(409);echo json_encode(['success'=>false,'message'=>'Cette commande ne peut plus être annulée.']);exit;
  }
  $sid=(string)($order['stripe_checkout_session_id']??'');
  if($sid!=='') {
    $session=stripeSession($stripe,$sid);
    if(($session['payment_status']??'')==='paid'||($session['status']??'')==='complete'){
      http_response_code(409);echo json_encode(['success'=>false,'message'=>'Paiement déjà effectué : actualise tes commandes.']);exit;
    }
    if(($session['status']??'')==='open') stripeSession($stripe,$sid,true);
  }
  $updated=$request('PATCH',$url.'/rest/v1/orders?id=eq.'.rawurlencode($id).'&user_id=eq.'.rawurlencode($actor).'&status=eq.pending&payment_status=eq.pending&paid_at=is.null&select=id,status', ['status'=>'cancelled']);
  if(count($updated)!==1){http_response_code(409);echo json_encode(['success'=>false,'message'=>'La commande a changé de statut. Actualise la page.']);exit;}
  echo json_encode(['success'=>true,'message'=>'Commande annulée.']);
} catch(Throwable $e){error_log('[TRIÈDRE] Annulation commande : '.$e->getMessage());http_response_code(503);echo json_encode(['success'=>false,'message'=>'Annulation impossible pour le moment.']);}
