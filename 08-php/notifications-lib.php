<?php
declare(strict_types=1);
// Bibliothèque serveur uniquement. Ne jamais afficher les erreurs techniques au public.
function trRequest(array $c,string $method,string $path,?array $payload=null): array {
 $url=rtrim((string)$c['supabase_url'],'/').$path;
 $key=(string)$c['supabase_secret_key'];
 $headers=['apikey: '.$key,'Authorization: Bearer '.$key,'Accept: application/json'];
 if($payload!==null)$headers[]='Content-Type: application/json';
 $ch=curl_init($url);
 curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_HTTPHEADER=>$headers,CURLOPT_TIMEOUT=>25,CURLOPT_CONNECTTIMEOUT=>10]);
 // Un tableau vide doit partir en objet JSON {} (et non []) : c'est le format attendu par les fonctions RPC Supabase.
 if($payload!==null)curl_setopt($ch,CURLOPT_POSTFIELDS,$payload===[]?'{}':json_encode($payload,JSON_THROW_ON_ERROR));
 $raw=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);$error=curl_error($ch);curl_close($ch);
 if($raw===false||$status<200||$status>=300)throw new RuntimeException('Supabase HTTP '.$status.' sur '.$method.' '.strtok($path,'?').' : '.$error.' '.substr((string)$raw,0,300));
 if($raw==='')return [];
 $data=json_decode($raw,true,512,JSON_THROW_ON_ERROR);
 // Certaines fonctions Supabase renvoient un nombre ou null (ex. : nombre de rappels créés) : on l'emballe dans un tableau.
 if($data===null)return [];
 return is_array($data)?$data:['result'=>$data];
}
function trRpc(array $c,string $name,array $args=[]): array {return trRequest($c,'POST','/rest/v1/rpc/'.$name,$args);}
function trOrder(array $c,string $id): ?array {
 $r=trRequest($c,'GET','/rest/v1/orders?id=eq.'.rawurlencode($id).'&select=*&limit=1');
 return $r[0]??null;
}
function trEsc($s):string{return htmlspecialchars((string)$s,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
function trMoney($v):string{return number_format((float)$v,2,',',' ').' $';}
function trMail(array $c,string $to,string $subject,string $html):void {
 if(!filter_var($to,FILTER_VALIDATE_EMAIL))throw new RuntimeException('Adresse courriel invalide');
 $host=(string)$c['smtp_host'];$port=(int)$c['smtp_port'];$user=(string)$c['smtp_username'];$pass=(string)$c['smtp_password'];
 // Port 465 = SSL direct (réglage courant chez Hostinger) ; port 587 = STARTTLS.
 $sslDirect=($port===465);
 $sock=@stream_socket_client(($sslDirect?'ssl://':'tcp://').$host.':'.$port,$errno,$errstr,20);
 if(!$sock)throw new RuntimeException('Connexion SMTP impossible ('.$host.':'.$port.') : '.$errstr);
 stream_set_timeout($sock,25);
 $read=function()use($sock):int{$line='';do{$part=fgets($sock,515);if($part===false)throw new RuntimeException('SMTP interrompu');$line=$part;}while(strlen($line)<4||$line[3]!==' ');return (int)substr($line,0,3);};
 $cmd=function(string $s,array $expected)use($sock,$read):void{
  fwrite($sock,$s."\r\n");
  $code=$read();
  if(in_array($code,$expected,true))return; // Réponse attendue : on continue.
  // Nom de l'étape sans jamais afficher les identifiants (envoyés encodés en base64).
  $etape=strtok($s,' :');
  if(!in_array($etape,['EHLO','STARTTLS','AUTH','MAIL','RCPT','DATA','QUIT'],true)){
   $etape=($expected===[250])?'envoi du message':'identifiants';
  }
  throw new RuntimeException('SMTP rejeté (code '.$code.' à l’étape '.$etape.')');
 };
 try{
 if($read()!==220)throw new RuntimeException('SMTP accueil');
 $cmd('EHLO triedreofficiel.com',[250]);
 if(!$sslDirect){
  $cmd('STARTTLS',[220]);
  if(stream_socket_enable_crypto($sock,true,STREAM_CRYPTO_METHOD_TLS_CLIENT)!==true)throw new RuntimeException('TLS impossible');
  $cmd('EHLO triedreofficiel.com',[250]);
 }$cmd('AUTH LOGIN',[334]);$cmd(base64_encode($user),[334]);$cmd(base64_encode($pass),[235]);
 $cmd('MAIL FROM:<'.$user.'>',[250]);$cmd('RCPT TO:<'.$to.'>',[250,251]);$cmd('DATA',[354]);
 $headers=['From: TRIÈDRE <'.$user.'>','To: <'.$to.'>','Subject: =?UTF-8?B?'.base64_encode($subject).'?=','MIME-Version: 1.0','Content-Type: text/html; charset=UTF-8','Content-Transfer-Encoding: base64'];
 $payload=implode("\r\n",$headers)."\r\n\r\n".chunk_split(base64_encode($html),76,"\r\n");
 $cmd(rtrim($payload,"\r\n")."\r\n.",[250]);$cmd('QUIT',[221]);
 }finally{fclose($sock);}
}
function trTemplate(array $order,string $kind,array $items=[]):array {
 // Design aligné sur le courriel « Réinitialise ton mot de passe » (Supabase Auth).
 // Palette identique aux courriels Supabase (réinitialisation, mot de passe modifié).
 $gold='#d6a51c';$card='#181818';$line='#2d2d2d';$text='#c7c7c7';$font='Arial,Helvetica,sans-serif';
 $number=trEsc($order['order_number']??'');
 $prenom=trEsc(explode(' ',trim((string)($order['customer_name']??'')))[0]??'');
 $isPaid=$kind==='paid_confirmation';
 $title=$isPaid?'Ta commande est confirmée':'Ta commande t’attend';
 $message=$isPaid
  ?'Ton paiement a été confirmé. Merci pour ta confiance. Nous préparons maintenant ta commande avec soin.'
  :'Ta commande est toujours en attente de paiement. Tes articles t’attendent encore, mais pour peu de temps.';
 // Bouton : un membre va vers son espace, un invité (sans compte) vers la boutique.
 $siteUrl=rtrim((string)($order['_site_url']??'https://www.triedreofficiel.com'),'/');
 $isGuest=empty($order['user_id']);
 $link=trEsc($siteUrl.($isGuest?'/boutique':'/membre'));
 $buttonLabel=$isGuest?'Découvrir la boutique':($isPaid?'Voir mes commandes':'Finaliser ma commande');

 $lignes='';
 foreach($items as $i){
  $details=trim(trEsc($i['color']??'').' · '.trEsc($i['size']??''),' ·');
  $qte=(int)($i['quantity']??1);
  $lignes.='<tr>'
   .'<td style="padding:14px 0;border-bottom:1px solid '.$line.';font-family:'.$font.';font-size:15px;line-height:1.5;color:#ffffff;">'
   .trEsc($i['product_name']??'Produit')
   .'<br><span style="font-size:13px;color:#9a9a9a;">'.$details.' · Qté '.$qte.'</span></td>'
   .'<td align="right" style="padding:14px 0;border-bottom:1px solid '.$line.';font-family:'.$font.';font-size:15px;color:#ffffff;white-space:nowrap;vertical-align:top;">'
   .trMoney(((float)($i['unit_price']??0))*$qte).'</td></tr>';
 }
 $ligneTotal=function(string $libelle,string $montant)use($font,$text):string{
  return '<tr><td style="padding:4px 0;font-family:'.$font.';font-size:15px;color:'.$text.';">'.$libelle.'</td>'
   .'<td align="right" style="padding:4px 0;font-family:'.$font.';font-size:15px;color:'.$text.';">'.$montant.'</td></tr>';
 };
 $totaux=$ligneTotal('Sous-total',trMoney($order['subtotal']??0))
  .$ligneTotal('Livraison',((float)($order['shipping_amount']??0))>0?trMoney($order['shipping_amount']):'Gratuite');
 if(((float)($order['tax_amount']??0))>0)$totaux.=$ligneTotal('Taxes',trMoney($order['tax_amount']));

 $html='<!doctype html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
 .'<meta name="color-scheme" content="dark"><title>'.trEsc($title).'</title></head>'
 .'<body style="margin:0;padding:0;background:#111111;">'
 .'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#111111;"><tr><td align="center" style="padding:32px 16px;">'
 .'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:'.$card.';border:1px solid '.$line.';border-radius:12px;overflow:hidden;">'
 // En-tête
 .'<tr><td align="center" style="padding:40px 24px 32px;border-bottom:1px solid '.$line.';">'
 .'<div style="font-family:'.$font.';font-size:34px;font-weight:700;letter-spacing:6px;color:#ffffff;">TRIÈDRE</div>'
 .'<div style="margin-top:12px;font-family:'.$font.';font-size:14px;font-weight:700;letter-spacing:4px;color:'.$gold.';">Deviens Plus</div>'
 .'</td></tr>'
 // Corps
 .'<tr><td style="padding:40px 36px 36px;">'
 .'<h1 style="margin:0 0 24px;font-family:'.$font.';font-size:28px;line-height:1.3;font-weight:700;color:#ffffff;">'.trEsc($title).'</h1>'
 .'<p style="margin:0 0 16px;font-family:'.$font.';font-size:16px;line-height:1.75;color:'.$text.';">Bonjour'.($prenom!==''?' '.$prenom:'').',</p>'
 .'<p style="margin:0 0 28px;font-family:'.$font.';font-size:16px;line-height:1.75;color:'.$text.';">'.trEsc($message).'</p>'
 .'<p style="margin:0 0 8px;font-family:'.$font.';font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:'.$gold.';">Commande '.$number.'</p>'
 .'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid '.$line.';">'.$lignes.'</table>'
 .'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">'.$totaux
 .'<tr><td style="padding:14px 0 0;font-family:'.$font.';font-size:18px;font-weight:700;color:#ffffff;">Total</td>'
 .'<td align="right" style="padding:14px 0 0;font-family:'.$font.';font-size:20px;font-weight:700;color:'.$gold.';">'.trMoney($order['total_amount']??0).'</td></tr>'
 .'</table>'
 // Bouton
 .'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:36px;"><tr>'
 .'<td align="center" bgcolor="'.$gold.'" style="border-radius:8px;">'
 .'<a href="'.$link.'" style="display:block;padding:18px 24px;font-family:'.$font.';font-size:16px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#111111;text-decoration:none;">'.trEsc($buttonLabel).'</a>'
 .'</td></tr></table>'
 .'</td></tr>'
 // Pied (identique aux courriels Supabase)
 .'<tr><td align="center" style="padding:22px 32px;background:#141414;border-top:1px solid '.$line.';font-family:'.$font.';">'
 .'<p style="margin:0 0 10px;font-size:12px;line-height:1.6;color:#888888;">Une question ? Écris-nous à <a href="mailto:info@triedreofficiel.com" style="color:'.$gold.';text-decoration:none;">info@triedreofficiel.com</a></p>'
 .'<p style="margin:0 0 6px;font-size:12px;color:#777777;">TRIÈDRE</p>'
 .'<p style="margin:0;font-size:11px;letter-spacing:1px;color:'.$gold.';">CORPS • MENTAL • CONFIANCE</p>'
 .'</td></tr>'
 .'</table></td></tr></table></body></html>';
 return [$title.' — '.$order['order_number'],$html];
}
