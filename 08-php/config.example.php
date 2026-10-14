<?php

return [
    // =========================================================================
    // SMTP
    // =========================================================================

    'smtp_host' => 'mail.privateemail.com',
    'smtp_port' => 587,
    'smtp_username' => 'info@triedreofficiel.com',
    'smtp_password' => 'REMPLACE_PAR_LE_MOT_DE_PASSE_DE_LA_BOITE',
    'recipient_email' => 'info@triedreofficiel.com',

    // =========================================================================
    // SUPABASE — SERVEUR UNIQUEMENT
    // =========================================================================

    'supabase_url' => 'https://TON-PROJET.supabase.co',

    // Clé privée serveur : sb_secret_...
    // JAMAIS dans le JavaScript ni sur GitHub.
    'supabase_secret_key' => 'REMPLACE_PAR_LA_CLE_SECRETE_SUPABASE',

    // =========================================================================
    // STRIPE — SERVEUR UNIQUEMENT
    // =========================================================================

    // Clé secrète Stripe correspondant au mode TEST ou LIVE choisi.
    'stripe_secret_key' => 'sk_test_REMPLACE_PAR_LA_CLE_SECRETE_STRIPE',

    // Secret de signature du endpoint webhook Stripe (distinct de la clé API).
    // Obtenir la valeur dans Stripe > Developers > Webhooks.
    'stripe_webhook_secret' => 'whsec_REMPLACE_PAR_LE_SECRET_DU_WEBHOOK',

    // Adresse HTTPS publique de l'espace membre (facultative pour le test local).
    // Ne pas utiliser http://triedre-ecommerce.test dans un courriel envoyé à un client.
    'member_orders_url' => 'https://triedreofficiel.com/01-html/membre',

];