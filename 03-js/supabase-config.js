// ==========================================================================
// TRIÈDRE — Configuration Supabase
// ==========================================================================
// La Publishable Key est conçue pour être utilisée côté navigateur avec RLS.
// Ne jamais mettre ici une Secret Key ou une service_role key.

(function () {
  'use strict';

  const SUPABASE_URL = 'https://blfkudqguqvjmvqqlilh.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_PYAPe69yejBM0i7Z0G0uog_DDzhEkQR';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error(
      '[TRIÈDRE] Supabase JS n’est pas chargé. Vérifie le script CDN.'
    );
    return;
  }

  window.triedreSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
})();
