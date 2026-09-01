<?php
declare(strict_types=1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Méthode non autorisée.');
}

$config = require __DIR__ . '/config.php';

$nom = trim((string)($_POST['nom'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$sujet = trim((string)($_POST['sujet'] ?? ''));
$message = trim((string)($_POST['message'] ?? ''));
$honeypot = trim((string)($_POST['site_web'] ?? ''));

if ($honeypot !== '') {
    header('Location: /contact?statut=envoye');
    exit;
}

$sujets = ['Question générale', 'Suivi de commande', 'Retour ou échange', 'Partenariat'];

if (
    $nom === '' ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    !in_array($sujet, $sujets, true) ||
    $message === ''
) {
    header('Location: /contact?statut=invalide');
    exit;
}

function smtpRead($socket): string {
    $data = '';
    while (($line = fgets($socket, 515)) !== false) {
        $data .= $line;
        if (strlen($line) >= 4 && $line[3] === ' ') break;
    }
    return $data;
}

function smtpExpect($socket, array $codes): string {
    $response = smtpRead($socket);
    $code = (int) substr($response, 0, 3);
    if (!in_array($code, $codes, true)) {
        throw new RuntimeException(trim($response));
    }
    return $response;
}

function smtpCommand($socket, string $command, array $codes): string {
    fwrite($socket, $command . "\r\n");
    return smtpExpect($socket, $codes);
}

$host = $config['smtp_host'];
$port = (int)$config['smtp_port'];
$user = $config['smtp_username'];
$pass = $config['smtp_password'];
$recipient = $config['recipient_email'];

$socket = @stream_socket_client($host . ':' . $port, $errno, $errstr, 20);

if (!$socket) {
    error_log("TRIEDRE SMTP connexion: $errno $errstr");
    header('Location: /contact?statut=erreur');
    exit;
}

try {
    smtpExpect($socket, [220]);
    smtpCommand($socket, 'EHLO triedreofficiel.com', [250]);
    smtpCommand($socket, 'STARTTLS', [220]);

    if (stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT) !== true) {
        throw new RuntimeException('TLS impossible');
    }

    smtpCommand($socket, 'EHLO triedreofficiel.com', [250]);
    smtpCommand($socket, 'AUTH LOGIN', [334]);
    smtpCommand($socket, base64_encode($user), [334]);
    smtpCommand($socket, base64_encode($pass), [235]);
    smtpCommand($socket, 'MAIL FROM:<' . $user . '>', [250]);
    smtpCommand($socket, 'RCPT TO:<' . $recipient . '>', [250, 251]);
    smtpCommand($socket, 'DATA', [354]);

    $subject = '=?UTF-8?B?' . base64_encode('[TRIÈDRE] ' . $sujet) . '?=';
    $body =
        "Nouveau message depuis triedreofficiel.com\r\n\r\n" .
        "Nom : $nom\r\n" .
        "Courriel : $email\r\n" .
        "Sujet : $sujet\r\n\r\n" .
        "Message :\r\n$message\r\n";

    $headers = [
        'From: TRIÈDRE Site <' . $user . '>',
        'Reply-To: ' . $email,
        'To: <' . $recipient . '>',
        'Subject: ' . $subject,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit'
    ];

    $payload = implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.";
    smtpCommand($socket, $payload, [250]);
    smtpCommand($socket, 'QUIT', [221]);

    fclose($socket);
    header('Location: /contact?statut=envoye');
    exit;

} catch (Throwable $e) {
    error_log('TRIEDRE SMTP: ' . $e->getMessage());
    if (is_resource($socket)) fclose($socket);
    header('Location: /contact?statut=erreur');
    exit;
}
