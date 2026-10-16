/* =========================================================
   TRIÈDRE — Admin : Produits & visuels
   Liste le catalogue et affiche l'état des projets du Studio Mockup
   (lus dans IndexedDB, même navigateur).
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {
  const conteneur = document.getElementById('admin-visuels-produits');
  const compteur = document.getElementById('admin-visuels-count');
  const recherche = document.getElementById('admin-visuels-search');
  const message = document.getElementById('admin-visuels-message');
  if (!conteneur) return;

  const cheminImages = '../05-images/produits/';
  const NB_VUES = 5;
  let produits = [];
  let projetsStudio = {};  // produitId → [projets]

  charger();

  async function charger() {
    // Accès réservé aux administrateurs (voir admin-garde.js)
    if (window.triedreAdminPret && !(await window.triedreAdminPret)) return;
    try {
      const res = await fetch('../04-data/produits.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('Impossible de charger produits.json');
      const data = await res.json();
      produits = Array.isArray(data.produits) ? data.produits : [];
    } catch (e) {
      console.error('[TRIÈDRE] Chargement catalogue impossible :', e);
      conteneur.innerHTML = '<p class="admin-empty">Impossible de charger le catalogue.</p>';
      if (message) { message.hidden = false; message.textContent = 'Le catalogue produits n’a pas pu être chargé.'; }
      return;
    }
    projetsStudio = await lireProjetsStudio();
    afficher(produits);
  }

  /* Même base et même structure que admin-studio-mockup.js */
  function lireProjetsStudio() {
    return new Promise(function (resolve) {
      if (!('indexedDB' in window)) { resolve({}); return; }
      const req = indexedDB.open('triedre-studio-v6', 1);
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains('projets')) req.result.createObjectStore('projets', { keyPath: 'cle' });
      };
      req.onerror = function () { resolve({}); };
      req.onsuccess = function () {
        const db = req.result;
        const tout = db.transaction('projets', 'readonly').objectStore('projets').getAll();
        tout.onsuccess = function () {
          const parProduit = {};
          (tout.result || []).forEach(function (p) {
            (parProduit[p.produitId] = parProduit[p.produitId] || []).push(p);
          });
          db.close();
          resolve(parProduit);
        };
        tout.onerror = function () { db.close(); resolve({}); };
      };
    });
  }

  function afficher(liste) {
    conteneur.innerHTML = '';
    if (compteur) compteur.textContent = liste.length + (liste.length > 1 ? ' produits' : ' produit');
    if (!liste.length) { conteneur.innerHTML = '<p class="admin-empty">Aucun produit trouvé.</p>'; return; }
    liste.forEach(function (p) { conteneur.appendChild(carte(p)); });
  }

  function etatStudio(p) {
    const projets = projetsStudio[p.id] || [];
    const el = document.createElement('p');
    el.className = 'admin-produit-studio';
    if (!projets.length) { el.textContent = 'Studio : aucun projet enregistré'; return el; }
    el.classList.add('is-pret');
    el.textContent = 'Studio : ' + projets.map(function (pr) {
      const vues = Object.keys(pr.photos || {}).length;
      const emp = Object.keys(pr.placements || {}).length;
      return pr.couleur + ' (' + vues + '/' + NB_VUES + ' vues, ' + emp + ' emplacement' + (emp > 1 ? 's' : '') + ')';
    }).join(' · ');
    return el;
  }

  function carte(p) {
    const article = document.createElement('article');
    article.className = 'admin-produit-card';

    const variantes = Array.isArray(p.variantes) ? p.variantes.filter(function (v) { return v.actif !== false; }) : [];
    const couleurs = [];
    variantes.forEach(function (v) {
      if (!couleurs.some(function (c) { return c.nom === v.couleur; })) couleurs.push({ nom: v.couleur, hex: v.hex });
    });

    const photo = (variantes.find(function (v) { return v.photoFace; }) || {}).photoFace || (p.vuesCommunes && p.vuesCommunes[0]) || '';
    const blocImage = document.createElement('div');
    blocImage.className = 'admin-produit-image';
    if (photo) {
      const img = document.createElement('img');
      img.src = cheminImages + photo;
      img.alt = p.nom || 'Produit TRIÈDRE';
      img.loading = 'lazy';
      blocImage.appendChild(img);
    }

    const contenu = document.createElement('div');
    contenu.className = 'admin-produit-contenu';

    const meta = document.createElement('div');
    meta.className = 'admin-produit-meta';
    const categorie = document.createElement('p');
    categorie.className = 'admin-produit-categorie';
    categorie.textContent = p.categorie || 'Produit';
    const etat = document.createElement('p');
    etat.className = 'admin-produit-etat ' + (p.actif === false ? 'is-inactif' : 'is-actif');
    etat.textContent = p.actif === false ? 'Inactif' : 'Actif';
    meta.append(categorie, etat);

    const titre = document.createElement('h3');
    titre.textContent = p.nom || p.id;

    const pastilles = document.createElement('div');
    pastilles.className = 'admin-produit-couleurs';
    couleurs.forEach(function (c) {
      const s = document.createElement('span');
      s.className = 'admin-produit-couleur';
      s.style.backgroundColor = c.hex || '#777';
      s.title = c.nom;
      pastilles.appendChild(s);
    });

    const infos = document.createElement('p');
    infos.className = 'admin-produit-infos';
    infos.textContent = couleurs.length + ' couleur' + (couleurs.length > 1 ? 's' : '') + ' • ' +
      variantes.length + ' variante' + (variantes.length > 1 ? 's' : '');

    const actions = document.createElement('div');
    actions.className = 'admin-produit-actions';
    const bouton = document.createElement('a');
    bouton.className = 'btn btn-primary';
    bouton.href = '/admin-studio-mockup?id=' + encodeURIComponent(p.id);
    bouton.textContent = 'Gérer les visuels';
    actions.appendChild(bouton);

    contenu.append(meta, titre, pastilles, infos, etatStudio(p), actions);
    article.append(blocImage, contenu);
    return article;
  }

  if (recherche) {
    recherche.addEventListener('input', function () {
      const t = recherche.value.trim().toLowerCase();
      afficher(!t ? produits : produits.filter(function (p) {
        return [p.id, p.nom, p.categorie].join(' ').toLowerCase().includes(t);
      }));
    });
  }
});
