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
];