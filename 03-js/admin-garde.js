// ==========================================================================
// TRIÈDRE — Garde d'accès des pages d'administration
// ==========================================================================
// À charger dans le <head>, APRÈS supabase-js et supabase-config.js :
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="../03-js/supabase-config.js"></script>
//   <script src="../03-js/admin-garde.js"></script>
//
// Même vérification que admin.js : utilisateur connecté + rôle « admin »
// (RPC get_my_access_context). Tant que l'accès n'est pas confirmé, le
// contenu <main> reste masqué ; s'il est refusé, il est remplacé par un
// message. Les autres scripts peuvent attendre : await window.triedreAdminPret
//
// Rappel : cette garde protège l'interface. La vraie protection des données
// reste côté serveur (RLS Supabase) — à appliquer à toute future écriture
// (ex. bouton « Publier » du studio).
// ==========================================================================

(function () {
  'use strict';

  document.documentElement.classList.add('admin-verrou');

  function afficherRefus(titre, texte) {
    const main = document.querySelector('main');
    if (!main) return;
    const bloc = document.createElement('section');
    bloc.className = 'admin-card admin-garde-refus';

    const eyebrow = document.createElement('p');
    eyebrow.className = 'section-eyebrow';
    eyebrow.textContent = 'Accès restreint';

    const h2 = document.createElement('h2');
    h2.textContent = titre;

    const p = document.createElement('p');
    p.textContent = texte;

    const lien = document.createElement('a');
    lien.className = 'btn btn-primary';
    lien.href = '/membre';
    lien.textContent = 'Se connecter';

    bloc.append(eyebrow, h2, p, lien);
    main.replaceChildren(bloc);
    main.classList.add('admin-garde-page');
    document.documentElement.classList.remove('admin-verrou');
  }

  async function verifier() {
    const supabase = window.triedreSupabase;
    if (!supabase) {
      afficherRefus('ADMINISTRATION TRIÈDRE', 'Connexion Supabase indisponible. Réessaie dans un instant.');
      return false;
    }
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        afficherRefus('ADMINISTRATION TRIÈDRE', 'Connecte-toi d’abord à ton compte TRIÈDRE pour accéder à l’administration.');
        return false;
      }
      const { data: contexte, error } = await supabase.rpc('get_my_access_context');
      if (error) throw error;
      const valeur = Array.isArray(contexte) ? contexte[0] : contexte;
      if (!valeur || valeur.role !== 'admin') {
        afficherRefus('ADMINISTRATION TRIÈDRE', 'Ce compte ne possède pas les droits administrateur.');
        return false;
      }
      document.documentElement.classList.remove('admin-verrou');
      return true;
    } catch (e) {
      console.error('[TRIÈDRE] Vérification de l’accès administrateur :', e);
      afficherRefus('ADMINISTRATION TRIÈDRE', 'Impossible de vérifier l’accès administrateur pour le moment.');
      return false;
    }
  }

  window.triedreAdminPret = new Promise(function (resolve) {
    const lancer = function () { verifier().then(resolve); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', lancer);
    else lancer();
  });
})();
