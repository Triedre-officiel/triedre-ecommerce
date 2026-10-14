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
 if($payload!==null)curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($payload,JSON_THROW_ON_ERROR));
 $raw=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);$error=curl_error($ch);curl_close($ch);
 if($raw===false||$status<200||$status>=300)throw new RuntimeException('Supabase HTTP '.$status.' '.$error);
 return $raw===''?[]:(json_decode($raw,true,512,JSON_THROW_ON_ERROR)??[]);
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
 $sock=@stream_socket_client('tcp://'.$host.':'.$port,$errno,$errstr,20);
 if(!$sock)throw new RuntimeException('Connexion SMTP impossible');
 stream_set_timeout($sock,25);
 $read=function()use($sock):int{$line='';do{$part=fgets($sock,515);if($part===false)throw new RuntimeException('SMTP interrompu');$line=$part;}while(strlen($line)<4||$line[3]!==' ');return (int)substr($line,0,3);};
 $cmd=function(string $s,array $expected)use($sock,$read):void{fwrite($sock,$s."\r\n");if(!in_array($read(),$expected,true))throw new RuntimeException('SMTP rejeté');};
 try{
 if($read()!==220)throw new RuntimeException('SMTP accueil');
 $cmd('EHLO triedreofficiel.com',[250]);$cmd('STARTTLS',[220]);
 if(stream_socket_enable_crypto($sock,true,STREAM_CRYPTO_METHOD_TLS_CLIENT)!==true)throw new RuntimeException('TLS impossible');
 $cmd('EHLO triedreofficiel.com',[250]);$cmd('AUTH LOGIN',[334]);$cmd(base64_encode($user),[334]);$cmd(base64_encode($pass),[235]);
 $cmd('MAIL FROM:<'.$user.'>',[250]);$cmd('RCPT TO:<'.$to.'>',[250,251]);$cmd('DATA',[354]);
 $headers=['From: TRIÈDRE <'.$user.'>','To: <'.$to.'>','Subject: =?UTF-8?B?'.base64_encode($subject).'?=','MIME-Version: 1.0','Content-Type: text/html; charset=UTF-8','Content-Transfer-Encoding: base64'];
 $payload=implode("\r\n",$headers)."\r\n\r\n".chunk_split(base64_encode($html),76,"\r\n");
 $cmd(rtrim($payload,"\r\n")."\r\n.",[250]);
 // Une réponse 250 après DATA signifie que le serveur SMTP a accepté le message.
 // QUIT est facultatif : son échec ne doit pas reclasser un envoi accepté en échec.
 try { $cmd('QUIT',[221]); } catch (Throwable $ignored) {}
 }finally{fclose($sock);}
}
function trTemplate(array $order,string $kind,array $items=[]):array {
 $number=trEsc($order['order_number']??'');$name=trEsc($order['customer_name']??'');
 $isPaid=$kind==='paid_confirmation';$title=$isPaid?'Ta commande est confirmée':'Ta commande t’attend';
 $message=$isPaid?'Ton paiement a été confirmé. Merci pour ta confiance.':'Ta commande est toujours en attente de paiement. Tu peux la finaliser depuis ton espace membre.';
 $lines='';foreach($items as $i){$lines.='<tr><td style="padding:8px 0;border-bottom:1px solid #333">'.trEsc($i['product_name']??'Produit').' — '.trEsc($i['color']??'').' '.trEsc($i['size']??'').'</td><td style="text-align:right">'.(int)($i['quantity']??1).' × '.trMoney($i['unit_price']??0).'</td></tr>';}
 $link=trEsc((string)($order['_member_url']??'')); // Fourni par la configuration, jamais une URL provisoire.
 $cta=$link!==''?'<p><a style="display:inline-block;padding:13px 20px;background:#c9a55b;color:#111;text-decoration:none;font-weight:bold" href="'.$link.'">'.($isPaid?'Voir mes commandes':'Finaliser ma commande').'</a></p>':'';
 $html='<!doctype html><html lang="fr"><meta charset="UTF-8"><body style="margin:0;background:#111;color:#eee;font:16px Arial,sans-serif;padding:30px"><div style="max-width:640px;margin:auto;background:#191919;padding:32px;border:1px solid #a78b45"><h1 style="color:#c9a55b;letter-spacing:3px">TRIÈDRE</h1><p style="color:#c9a55b">DEVIENS PLUS</p><h2>'.trEsc($title).'</h2><p>Bonjour '.$name.',</p><p>'.trEsc($message).'</p><p><strong>Commande : '.$number.'</strong></p><table style="width:100%;color:#eee">'.$lines.'</table><p>Sous-total : '.trMoney($order['subtotal']??0).'<br>Livraison : '.trMoney($order['shipping_amount']??0).'<br>Taxes : '.trMoney($order['tax_amount']??0).'</p><h2 style="color:#c9a55b">Total : '.trMoney($order['total_amount']??0).'</h2>'.$cta.'<p style="font-size:12px;color:#aaa">TRIÈDRE · Corps. Mental. Confiance.</p></div></body></html>';
 return [$title.' — '.$number,$html];
}
