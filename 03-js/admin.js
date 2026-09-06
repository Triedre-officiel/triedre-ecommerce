document.addEventListener('DOMContentLoaded', async function () {
  'use strict';

  const supabase = window.triedreSupabase;
  const acces = document.getElementById('admin-acces');
  const zone = document.getElementById('admin-zone');

  if (!supabase) {
    acces.textContent = 'Connexion Supabase indisponible.';
    return;
  }

  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      acces.textContent =
        'Connecte-toi d’abord à ton compte TRIÈDRE pour accéder à l’administration.';
      return;
    }

    const { data, error } = await supabase.rpc('get_my_access_context');

    if (error) {
      throw error;
    }

    const contexte = Array.isArray(data) ? data[0] : data;

    if (!contexte || contexte.role !== 'admin') {
      acces.innerHTML =
        '<p class="section-eyebrow">Accès restreint</p>' +
        '<h2>ADMINISTRATION TRIÈDRE</h2>' +
        '<p>Ce compte ne possède pas les droits administrateur.</p>';
      return;
    }

    acces.hidden = true;
    zone.hidden = false;
  } catch (error) {
    console.error('[TRIÈDRE] Accès admin :', error);
    acces.textContent =
      'Impossible de vérifier l’accès administrateur pour le moment.';
  }
});
