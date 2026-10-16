/* =========================================================
   TRIÈDRE — Admin : gestion du stock
   Lecture et écriture uniquement via les fonctions Supabase
   admin_stock_list / admin_stock_apply / admin_stock_history
   (rôle admin vérifié côté serveur, voir stock-admin-V1.sql).
   ========================================================= */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const SEUIL_FAIBLE = 3;
  const MOTIFS = {
    reception: 'Réception fournisseur', correction: 'Correction d’inventaire', retour: 'Retour client',
    endommage: 'Article endommagé', autre: 'Autre', vente: 'Vente', annulation: 'Remise en stock',
    reservation: 'Réservation'
  };

  let supabase = null;
  let variantes = [];            // lignes product_variants
  let catalogue = {};            // sku → { produit, hex }
  let nomsProduits = {};         // product_id → nom
  const modifs = new Map();      // sku → nouveau stock

  /* ---------- Messages (fenêtre TRIÈDRE) ---------- */
  function info(message, titre = 'STOCK') {
    if (window.triedreModal && window.triedreModal.alert) return window.triedreModal.alert({ eyebrow: 'Stock', title: titre, message });
    window.alert(message); return Promise.resolve(true);
  }
  function confirmer(message, titre, bouton) {
    if (window.triedreModal && window.triedreModal.confirm) {
      return window.triedreModal.confirm({ eyebrow: 'Stock', title: titre, message, confirmText: bouton, cancelText: 'Annuler' });
    }
    return Promise.resolve(window.confirm(message));
  }
  function messageErreur(error) {
    const txt = (error && (error.message || error.details)) || '';
    if (/Could not find the function|PGRST202|does not exist/i.test(txt)) {
      return 'Les fonctions de stock ne sont pas encore installées dans Supabase. Exécute le script stock-admin-V1.sql dans le SQL Editor.';
    }
    return txt || 'Erreur inconnue.';
  }

  /* ---------- Chargement ---------- */
  async function chargerCatalogue() {
    try {
      const res = await fetch('../04-data/produits.json', { cache: 'no-store' });
      const data = await res.json();
      (data.produits || []).forEach(p => {
        nomsProduits[p.id] = p.nom || p.id;
        (p.variantes || []).forEach(v => { catalogue[v.sku] = { produit: p.nom || p.id, hex: v.hex || '#777' }; });
      });
    } catch (e) {
      console.warn('[TRIÈDRE Stock] produits.json indisponible :', e);
    }
  }

  async function chargerStock() {
    $('stock-liste').innerHTML = '<p class="admin-empty">Chargement du stock…</p>';
    const { data, error } = await supabase.rpc('admin_stock_list');
    if (error) {
      $('stock-liste').innerHTML = '';
      const p = document.createElement('p'); p.className = 'admin-empty'; p.textContent = messageErreur(error);
      $('stock-liste').append(p);
      return;
    }
    variantes = (data || []).map(v => ({ ...v, stock: Number(v.stock) || 0 }));
    remplirFiltreProduits();
    afficher();
  }

  async function chargerHistorique() {
    const box = $('stock-historique');
    const { data, error } = await supabase.rpc('admin_stock_history', { p_limit: 50 });
    box.replaceChildren();
    if (error) { const p = document.createElement('p'); p.className = 'admin-empty'; p.textContent = messageErreur(error); box.append(p); return; }
    if (!data || !data.length) { const p = document.createElement('p'); p.className = 'admin-empty'; p.textContent = 'Aucun mouvement enregistré pour le moment.'; box.append(p); return; }
    data.forEach(m => {
      const ligne = document.createElement('div'); ligne.className = 'stock-histo-ligne';
      const date = document.createElement('time');
      date.dateTime = m.created_at;
      date.textContent = new Date(m.created_at).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' });
      const quoi = document.createElement('div'); quoi.className = 'stock-histo-quoi';
      const nom = document.createElement('strong'); nom.textContent = (catalogue[m.sku] ? catalogue[m.sku].produit + ' · ' : '') + m.sku;
      const motif = document.createElement('span'); motif.textContent = MOTIFS[m.motif] || m.motif;
      quoi.append(nom, motif);
      if (m.note) { const note = document.createElement('em'); note.textContent = m.note; quoi.append(note); }
      const chiffres = document.createElement('div'); chiffres.className = 'stock-histo-chiffres';
      const delta = document.createElement('b');
      delta.className = m.delta > 0 ? 'positif' : 'negatif';
      delta.textContent = (m.delta > 0 ? '+' : '') + m.delta;
      const avantApres = document.createElement('span'); avantApres.textContent = m.stock_avant + ' → ' + m.stock_apres;
      chiffres.append(delta, avantApres);
      ligne.append(date, quoi, chiffres);
      box.append(ligne);
    });
  }

  /* ---------- Affichage ---------- */
  function remplirFiltreProduits() {
    const sel = $('stock-filtre-produit'), actuel = sel.value;
    const ids = [...new Set(variantes.map(v => v.product_id))];
    sel.replaceChildren(new Option('Tous les produits', ''), ...ids.map(id => new Option(nomsProduits[id] || id, id)));
    sel.value = ids.includes(actuel) ? actuel : '';
  }

  function etat(v) {
    const stock = modifs.has(v.sku) ? modifs.get(v.sku) : v.stock;
    if (v.active === false) return { cle: 'inactive', libelle: 'Inactive' };
    if (stock <= 0) return { cle: 'rupture', libelle: 'Rupture' };
    if (stock <= SEUIL_FAIBLE) return { cle: 'faible', libelle: 'Stock faible' };
    return { cle: 'ok', libelle: 'En stock' };
  }

  function afficher() {
    const texte = $('stock-recherche').value.trim().toLowerCase();
    const produit = $('stock-filtre-produit').value;
    const filtreEtat = $('stock-filtre-etat').value;

    const visibles = variantes.filter(v => {
      if (produit && v.product_id !== produit) return false;
      const e = etat(v).cle;
      if (filtreEtat === 'rupture' && e !== 'rupture') return false;
      if (filtreEtat === 'faible' && e !== 'faible') return false;
      if (filtreEtat === 'modifie' && !modifs.has(v.sku)) return false;
      if (!texte) return true;
      return [v.sku, v.color, v.size, nomsProduits[v.product_id], v.product_id].join(' ').toLowerCase().includes(texte);
    });

    // Indicateurs (sur tout le stock, modifications en cours incluses)
    const actives = variantes.filter(v => v.active !== false);
    const valeur = v => (modifs.has(v.sku) ? modifs.get(v.sku) : v.stock);
    $('stock-kpi-unites').textContent = actives.reduce((t, v) => t + Math.max(0, valeur(v)), 0);
    $('stock-kpi-rupture').textContent = actives.filter(v => valeur(v) <= 0).length;
    $('stock-kpi-faible').textContent = actives.filter(v => valeur(v) > 0 && valeur(v) <= SEUIL_FAIBLE).length;
    $('stock-compte').textContent = visibles.length + ' / ' + variantes.length + ' variantes';

    const liste = $('stock-liste');
    liste.replaceChildren();
    if (!visibles.length) {
      const p = document.createElement('p'); p.className = 'admin-empty'; p.textContent = 'Aucune variante ne correspond aux filtres.';
      liste.append(p); majBarre(); return;
    }

    let produitCourant = null;
    visibles.forEach(v => {
      if (v.product_id !== produitCourant) {
        produitCourant = v.product_id;
        const titre = document.createElement('h3'); titre.className = 'stock-produit';
        const total = variantes.filter(x => x.product_id === v.product_id).reduce((t, x) => t + Math.max(0, valeur(x)), 0);
        titre.textContent = nomsProduits[v.product_id] || v.product_id;
        const sous = document.createElement('span'); sous.textContent = total + ' unité' + (total > 1 ? 's' : '');
        titre.append(sous);
        liste.append(titre);
      }
      liste.append(ligneVariante(v));
    });
    majBarre();
  }

  function ligneVariante(v) {
    const e = etat(v), modifie = modifs.has(v.sku), courant = modifie ? modifs.get(v.sku) : v.stock;
    const ligne = document.createElement('div');
    ligne.className = 'stock-ligne' + (modifie ? ' is-modifie' : '') + (v.active === false ? ' is-inactive' : '');

    const pastille = document.createElement('span'); pastille.className = 'stock-pastille';
    pastille.style.backgroundColor = (catalogue[v.sku] && catalogue[v.sku].hex) || '#777';

    const ident = document.createElement('div'); ident.className = 'stock-ident';
    const nom = document.createElement('strong'); nom.textContent = [v.color, v.size].filter(Boolean).join(' · ') || v.sku;
    const sku = document.createElement('code'); sku.textContent = v.sku;
    ident.append(nom, sku);

    const badge = document.createElement('span'); badge.className = 'stock-badge is-' + e.cle; badge.textContent = e.libelle;

    const controle = document.createElement('div'); controle.className = 'stock-controle';
    const moins = document.createElement('button'); moins.type = 'button'; moins.textContent = '−'; moins.setAttribute('aria-label', 'Retirer 1 · ' + v.sku);
    const champ = document.createElement('input');
    champ.type = 'number'; champ.min = '0'; champ.max = '100000'; champ.step = '1'; champ.inputMode = 'numeric';
    champ.value = courant; champ.setAttribute('aria-label', 'Stock · ' + v.sku);
    const plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+'; plus.setAttribute('aria-label', 'Ajouter 1 · ' + v.sku);
    controle.append(moins, champ, plus);

    const diff = document.createElement('span'); diff.className = 'stock-diff';
    const majDiff = () => {
      const d = (modifs.has(v.sku) ? modifs.get(v.sku) : v.stock) - v.stock;
      diff.textContent = d ? (d > 0 ? '+' : '') + d : '';
      diff.className = 'stock-diff ' + (d > 0 ? 'positif' : d < 0 ? 'negatif' : '');
    };
    majDiff();

    const appliquer = valeur => {
      const n = Math.max(0, Math.min(100000, Math.round(Number(valeur) || 0)));
      if (n === v.stock) modifs.delete(v.sku); else modifs.set(v.sku, n);
      champ.value = n;
      const nouvelEtat = etat(v);
      badge.className = 'stock-badge is-' + nouvelEtat.cle; badge.textContent = nouvelEtat.libelle;
      ligne.classList.toggle('is-modifie', modifs.has(v.sku));
      majDiff(); majIndicateurs(); majBarre();
    };
    champ.addEventListener('change', () => appliquer(champ.value));
    champ.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); appliquer(champ.value); } });
    moins.addEventListener('click', () => appliquer((Number(champ.value) || 0) - 1));
    plus.addEventListener('click', () => appliquer((Number(champ.value) || 0) + 1));

    ligne.append(pastille, ident, badge, controle, diff);
    return ligne;
  }

  function majIndicateurs() {
    const actives = variantes.filter(v => v.active !== false);
    const valeur = v => (modifs.has(v.sku) ? modifs.get(v.sku) : v.stock);
    $('stock-kpi-unites').textContent = actives.reduce((t, v) => t + Math.max(0, valeur(v)), 0);
    $('stock-kpi-rupture').textContent = actives.filter(v => valeur(v) <= 0).length;
    $('stock-kpi-faible').textContent = actives.filter(v => valeur(v) > 0 && valeur(v) <= SEUIL_FAIBLE).length;
  }

  function majBarre() {
    const n = modifs.size;
    $('stock-barre').hidden = n === 0;
    $('stock-barre-nb').textContent = n;
    $('stock-barre-libelle').textContent = n > 1 ? 'variantes modifiées' : 'variante modifiée';
  }

  /* ---------- Enregistrement ---------- */
  async function enregistrer() {
    if (!modifs.size) return;
    const motif = $('stock-motif').value, note = $('stock-note').value.trim();
    const changements = [...modifs].map(([sku, stock]) => {
      const v = variantes.find(x => x.sku === sku);
      return { sku, stock, stock_avant: v.stock };
    });
    const apercu = changements.slice(0, 8).map(c => c.sku + ' : ' + c.stock_avant + ' → ' + c.stock).join(' · ') +
      (changements.length > 8 ? ' · … (+' + (changements.length - 8) + ')' : '');
    const ok = await confirmer(
      changements.length + ' variante(s) · Motif : ' + MOTIFS[motif] + (note ? ' · « ' + note + ' »' : '') + '. ' + apercu,
      'ENREGISTRER LE STOCK ?', 'Enregistrer');
    if (!ok) return;

    const bouton = $('stock-enregistrer');
    bouton.disabled = true; bouton.textContent = 'Enregistrement…';
    const { data, error } = await supabase.rpc('admin_stock_apply', { p_changes: changements, p_motif: motif, p_note: note || null });
    bouton.disabled = false; bouton.textContent = 'Enregistrer';

    if (error) {
      const conflit = /a changé entre-temps/i.test(error.message || '');
      await info(messageErreur(error) + (conflit ? ' Aucune modification n’a été appliquée.' : ''), conflit ? 'STOCK MODIFIÉ ENTRE-TEMPS' : 'ERREUR');
      if (conflit) { modifs.clear(); await Promise.all([chargerStock(), chargerHistorique()]); }
      return;
    }
    modifs.clear();
    $('stock-note').value = '';
    await Promise.all([chargerStock(), chargerHistorique()]);
    info(((data && data.modifies) || 0) + ' variante(s) mise(s) à jour. La boutique affiche déjà les nouvelles quantités.', 'STOCK ENREGISTRÉ');
  }

  async function annuler() {
    if (!modifs.size) return;
    if (!(await confirmer('Les ' + modifs.size + ' modification(s) en cours seront perdues.', 'ANNULER LES MODIFICATIONS ?', 'Tout annuler'))) return;
    modifs.clear(); afficher();
  }

  /* ---------- Démarrage ---------- */
  document.addEventListener('DOMContentLoaded', async () => {
    if (window.triedreAdminPret && !(await window.triedreAdminPret)) return;
    supabase = window.triedreSupabase;
    if (!supabase) return;

    ['stock-recherche', 'stock-filtre-produit', 'stock-filtre-etat'].forEach(id => $(id).addEventListener('input', afficher));
    $('stock-recharger').addEventListener('click', async () => {
      if (modifs.size && !(await confirmer('Les modifications non enregistrées seront perdues.', 'ACTUALISER ?', 'Actualiser'))) return;
      modifs.clear(); await Promise.all([chargerStock(), chargerHistorique()]);
    });
    $('stock-enregistrer').addEventListener('click', enregistrer);
    $('stock-annuler').addEventListener('click', annuler);
    window.addEventListener('beforeunload', e => { if (modifs.size) { e.preventDefault(); e.returnValue = ''; } });

    await chargerCatalogue();
    await Promise.all([chargerStock(), chargerHistorique()]);
  });
})();
