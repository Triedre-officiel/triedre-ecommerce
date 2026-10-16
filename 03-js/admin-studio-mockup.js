/* =========================================================
   TRIÈDRE — Studio Mockup V7
   Modèle : EMPLACEMENTS (ce qui est imprimé/brodé) ≠ VUES (photos).
   - Le vêtement est détecté sur chaque photo (cadre + fond blanc automatique).
   - Les zones sont placées en cm à partir du col (repères du guide Shopify),
     donc indépendantes du cadrage de la photo.
   - Un projet par produit du catalogue + couleur (IndexedDB).
   - Chaque emplacement reçoit son propre design et ses réglages en cm.
   - Chaque vue affiche tous les emplacements visibles sous cet angle
     (projection calibrable : position, largeur, compression, inclinaison).
   - Export : un PNG par vue, nommé comme dans produits.json.
   ========================================================= */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  /* ---------- 1. Vues : mêmes noms que les fichiers du catalogue ---------- */
  const VUES = [
    { id: 'face', nom: 'Face' },
    { id: 'dos', nom: 'Dos' },
    { id: 'gauche', nom: 'Côté gauche' },
    { id: 'droite', nom: 'Côté droit' },
    { id: 'isometrique', nom: 'Isométrique' }
  ];
  const nomVue = id => (VUES.find(v => v.id === id) || {}).nom || id;

  /* ---------- 2. Gabarits : repères du vêtement et emplacements ----------
     vetement.longueur : longueur réelle (cm) entre le point de départ et l'ourlet → échelle px/cm (modifiable par projet :
                         longueur de la taille photographiée, d'après le guide des tailles du fournisseur)
     vetement.depart   : 'haut' = haut du vêtement (épaule/col au dos) · 'epaules' = base de la capuche détectée
     vetement.col      : distance (cm) entre le point de départ et l'encolure de chaque vue
     Vérification : t-shirt Comfort Colors 1717 taille S (longueur 71 cm) sur Printful → haut du logo poitrine gauche
     à 14 cm du haut du vêtement = encolure (6,5 cm) + 7,5 cm (Printful : « 3 po sous l'encolure »).
     cm               : taille maximale de la zone d'impression (indicative, à confirmer avec l'imprimeur)
     proj[vue]        : dx  = décalage horizontal du centre de la zone depuis le milieu du vêtement (cm, + = vers la droite de l'image)
                        col = distance entre le col et le HAUT de la zone (cm)
                        sx  = compression horizontale (1 = de face, < 1 = vu en biais) · rot = inclinaison (°)
     Repères verticaux : guide Shopify « Positionnement du logo sur un t-shirt » (poitrine gauche 7–8 cm sous le col,
     centre poitrine 7,5–12,5 cm, grand centre 7,6–10,2 cm, nuque ≈ 2 cm, haut du dos ≈ 10 cm, dos complet 7–8 cm). */
  function hautDuCorps(options = {}) {
    const liste = [
      { id: 'poitrine-gauche', nom: 'Poitrine gauche', cm: [10, 10], defaut: 7, proj: {
        face: { dx: 9, col: 7.5 }, isometrique: { dx: 6, col: 7.5, sx: .8 }, gauche: { dx: -11, col: 7.5, sx: .35 } } },
      { id: 'poitrine-centrale', nom: 'Poitrine centrale', cm: [25, 25], proj: {
        face: { dx: 0, col: 8 }, isometrique: { dx: -2, col: 8, sx: .85 } } },
      { id: 'grand-centre', nom: 'Grand centre', cm: [35, 40], proj: {
        face: { dx: 0, col: 8 }, isometrique: { dx: -2, col: 8, sx: .85 } } },
      { id: 'nuque', nom: 'Nuque', cm: [7, 7], proj: { dos: { dx: 0, col: 2 } } },
      { id: 'haut-dos', nom: 'Haut du dos', cm: [35, 15], proj: { dos: { dx: 0, col: 10 } } },
      { id: 'grand-dos', nom: 'Grand dos', cm: [35, 40], proj: { dos: { dx: 0, col: 7.5 } } },
      { id: 'manche-gauche', nom: 'Manche gauche', cm: [10, 10], proj: { gauche: { dx: 1, col: 4 } } },
      { id: 'manche-droite', nom: 'Manche droite', cm: [10, 10], proj: { droite: { dx: -1, col: 4 } } }
    ];
    return options.sans ? liste.filter(e => !options.sans.includes(e.id)) : liste;
  }

  const TYPES = {
    tshirt: { nom: 'T-shirt', vetement: { longueur: 72, depart: 'haut', col: { face: 6.5, dos: 2, gauche: 4, droite: 4, isometrique: 6 } },
      emplacements: hautDuCorps() },
    hoodie: { nom: 'Hoodie', vetement: { longueur: 68, depart: 'epaules', col: { face: 3, dos: 1, gauche: 2, droite: 2, isometrique: 3 } },
      emplacements: hautDuCorps({ sans: ['nuque'] }) },
    veste: { nom: 'Veste légère', vetement: { longueur: 72, depart: 'haut', col: { face: 7, dos: 2, gauche: 4, droite: 4, isometrique: 6 } },
      emplacements: hautDuCorps({ sans: ['grand-centre'] }) },
    casquette: { nom: 'Casquette', vetement: { longueur: 14, depart: 'haut', col: { face: 0, dos: 0, gauche: 0, droite: 0, isometrique: 0 } },
      emplacements: [
        { id: 'avant', nom: 'Panneau avant', cm: [11, 5.5], proj: {
          face: { dx: 0, col: 2.5 }, isometrique: { dx: -2, col: 2.5, sx: .8 },
          gauche: { dx: -6, col: 3, sx: .35 }, droite: { dx: 6, col: 3, sx: .35 } } },
        { id: 'cote-gauche', nom: 'Côté gauche', cm: [6, 2.5], proj: { gauche: { dx: 2, col: 7 } } },
        { id: 'cote-droit', nom: 'Côté droit', cm: [6, 2.5], proj: {
          droite: { dx: -2, col: 7 }, isometrique: { dx: 7, col: 6, sx: .6 } } },
        { id: 'arriere', nom: 'Arrière', cm: [8, 3], proj: { dos: { dx: 0, col: 6 } } }
      ] },
    brassiere: { nom: 'Brassière', vetement: { longueur: 32, depart: 'haut', col: { face: 10, dos: 8, gauche: 9, droite: 9, isometrique: 10 } },
      emplacements: [
        { id: 'poitrine-centrale', nom: 'Poitrine centrale', cm: [12, 6], proj: {
          face: { dx: 0, col: 2 }, isometrique: { dx: -1, col: 2, sx: .85 } } },
        { id: 'poitrine-gauche', nom: 'Poitrine gauche', cm: [7, 7], proj: { face: { dx: 6, col: 2 } } },
        { id: 'dos-central', nom: 'Dos central', cm: [12, 8], proj: { dos: { dx: 0, col: 3 } } }
      ] },
    leggings: { nom: 'Leggings', vetement: { longueur: 95, depart: 'haut', col: { face: 0, dos: 0, gauche: 0, droite: 0, isometrique: 0 } },
      emplacements: [
        { id: 'ceinture-avant', nom: 'Ceinture avant', cm: [10, 3], proj: { face: { dx: 0, col: 2 } } },
        { id: 'ceinture-arriere', nom: 'Ceinture arrière', cm: [10, 3], proj: { dos: { dx: 0, col: 2 } } },
        { id: 'cuisse-gauche', nom: 'Cuisse gauche', cm: [9, 9], proj: {
          face: { dx: 9, col: 28 }, gauche: { dx: 0, col: 28 } } },
        { id: 'cuisse-droite', nom: 'Cuisse droite', cm: [9, 9], proj: {
          face: { dx: -9, col: 28 }, droite: { dx: 0, col: 28 } } }
      ] }
  };

  /* Produits de secours si produits.json est inaccessible (ex. ouverture locale sans serveur) */
  const CATALOGUE_SECOURS = Object.keys(TYPES).map(t => ({
    id: t, nom: TYPES[t].nom, vuesCommunes: ['produit-' + t + '-face.webp'], variantes: [{ couleur: 'Noir', hex: '#0D0D0D' }]
  }));

  /* ---------- 3. Utilitaires ---------- */
  const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function slugProduit(p) {
    const vue = (p.vuesCommunes || [])[0] || '';
    const m = vue.match(/^produit-(.+?)-face\./);
    return m ? m[1] : slug(p.id);
  }
  function typeProduit(p) {
    const s = slugProduit(p);
    if (TYPES[s]) return s;
    const trouve = Object.keys(TYPES).find(t => s.includes(t) || slug(p.id).includes(t));
    return trouve || 'tshirt';
  }
  function couleursProduit(p) {
    const liste = [];
    (p.variantes || []).filter(v => v.actif !== false).forEach(v => {
      if (v.couleur && !liste.some(c => c.nom === v.couleur)) liste.push({ nom: v.couleur, hex: v.hex });
    });
    return liste.length ? liste : [{ nom: 'Noir', hex: '#0D0D0D' }];
  }
  function decoder(blob) {
    return new Promise((ok, err) => {
      const url = URL.createObjectURL(blob), im = new Image();
      im.onload = () => { URL.revokeObjectURL(url); ok(im); };
      im.onerror = () => { URL.revokeObjectURL(url); err(new Error('Image illisible')); };
      im.src = url;
    });
  }
  const versBlob = cv => new Promise((ok, err) =>
    cv.toBlob(b => b ? ok(b) : err(new Error('Conversion PNG impossible')), 'image/png'));
  /* Visuels exportés en WebP (≈ 30× plus légers que le PNG) ; repli PNG si le navigateur ne sait pas encoder le WebP */
  const versBlobExport = cv => new Promise((ok, err) =>
    cv.toBlob(b => b ? ok(b) : err(new Error('Conversion de l’image impossible')), 'image/webp', 0.88));
  const extension = blob => blob.type === 'image/webp' ? '.webp' : '.png';
  /* Messages et confirmations : fenêtre popup TRIÈDRE (modal.js), repli natif si absente */
  function warn(message, titre = 'STUDIO MOCKUP') {
    if (window.triedreModal && typeof window.triedreModal.alert === 'function') {
      window.triedreModal.alert({ eyebrow: 'Studio Mockup', title: titre, message });
    } else {
      window.alert(message);
    }
  }
  function confirmer(message, titre = 'CONFIRMER L’ACTION', confirmText = 'Confirmer') {
    if (window.triedreModal && typeof window.triedreModal.confirm === 'function') {
      return window.triedreModal.confirm({ eyebrow: 'Studio Mockup', title: titre, message, confirmText, cancelText: 'Annuler' });
    }
    return Promise.resolve(window.confirm(message));
  }

  /* ---------- 4. Stockage IndexedDB : un projet par produit + couleur ---------- */
  const DB_NOM = 'triedre-studio-v6', STORE = 'projets';
  function ouvrirDB() {
    return new Promise((ok, err) => {
      const r = indexedDB.open(DB_NOM, 1);
      r.onupgradeneeded = () => {
        if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'cle' });
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => err(r.error);
    });
  }
  async function dbFaire(mode, action) {
    const db = await ouvrirDB();
    return new Promise((ok, err) => {
      const tx = db.transaction(STORE, mode), req = action(tx.objectStore(STORE));
      tx.oncomplete = () => { db.close(); ok(req ? req.result : undefined); };
      tx.onerror = () => { db.close(); err(tx.error); };
      tx.onabort = () => { db.close(); err(tx.error || new Error('Transaction annulée')); };
    });
  }
  const dbLire = cle => dbFaire('readonly', s => s.get(cle));
  const dbTout = () => dbFaire('readonly', s => s.getAll());
  const dbEcrire = projet => dbFaire('readwrite', s => s.put(projet));
  const dbSupprimer = cle => dbFaire('readwrite', s => s.delete(cle));

  /* ---------- 5. Projections calibrées (par type de produit, vue et emplacement) ---------- */
  const CLE_PROJ = 'triedre-studio-projections-v7';  // v7 : repères en cm depuis le col
  let projections = {};
  try { projections = JSON.parse(localStorage.getItem(CLE_PROJ) || '{}'); } catch { projections = {}; }
  const sauverProjections = () => {
    try { localStorage.setItem(CLE_PROJ, JSON.stringify(projections)); } catch { /* stockage indisponible */ }
  };
  const cleProj = (type, vue, emp) => type + '|' + vue + '|' + emp;

  function emplacementDef(type, empId) {
    return TYPES[type].emplacements.find(e => e.id === empId);
  }
  /* Retourne la projection active ou null si l'emplacement n'est pas visible sur cette vue */
  function projection(type, vue, empId) {
    const stockee = projections[cleProj(type, vue, empId)];
    if (stockee) return stockee.visible === false ? null : { sx: 1, rot: 0, echelle: 1, ...stockee };
    const def = emplacementDef(type, empId);
    const p = def && def.proj[vue];
    return p ? { sx: 1, rot: 0, echelle: 1, ...p } : null;
  }
  const vuesVisibles = (type, empId) => VUES.filter(v => projection(type, v.id, empId)).map(v => v.nom);

  /* ---------- 6. État ---------- */
  let catalogue = [];
  let produit = null, type = 'tshirt', couleur = 'Noir';
  let projet = null;                         // données sauvegardées (Blobs + réglages)
  let images = { photos: {}, designs: {}, analyses: {} };  // images décodées + analyse des photos (cadre, fond blanc)
  let vue = 'face', empId = null;
  let dirty = false;
  let apercuFond = null;                     // { designId, canvas } — aperçu non appliqué
  let zoomZone = false;                      // plan de travail : vêtement entier ou zoom sur l'emplacement
  const RATIO_EXPORT = 4 / 5;                // format des visuels exportés (comme les photos du catalogue)

  const c = $('studio-render'), ctx = c.getContext('2d');

  function nouveauProjet() {
    return {
      cle: produit.id + '|' + slug(couleur),
      produitId: produit.id, produitNom: produit.nom, couleur, type,
      slug: slugProduit(produit), gabarit: typeProduit(produit), fondBlanc: true,
      photos: {}, designs: {}, placements: {}, maj: null
    };
  }
  function marquerModifie() {
    dirty = true;
    $('studio-status').textContent = 'Modifications non enregistrées';
  }
  function majStatut() {
    if (dirty) return;
    $('studio-status').textContent = projet.maj
      ? 'Enregistré · ' + new Date(projet.maj).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Nouveau projet';
  }

  /* ---------- 7. Géométrie ----------
     Tout le placement du design est exprimé en cm dans l'espace de l'emplacement
     (origine = centre de la zone). Chaque vue projette cet espace sur sa photo. */
  function geometrieDesign(pl, def, img) {
    const [aw, ah] = def.cm;
    const rad = (pl.rotation || 0) * Math.PI / 180;
    let w = Math.max(.1, pl.largeurCm), h = Math.max(.1, pl.hauteurCm);
    const rw = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad));
    const rh = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
    const echelle = Math.min(1, aw / rw, ah / rh);
    w *= echelle; h *= echelle;
    const demiW = rw * echelle / 2, demiH = rh * echelle / 2;
    const x = clamp(pl.dx || 0, -aw / 2 + demiW, aw / 2 - demiW);
    const y = clamp(pl.dy || 0, -ah / 2 + demiH, ah / 2 - demiH);
    return { x, y, w, h, rad, ajuste: echelle < .999, img,
      maxX: aw / 2 - demiW, maxY: ah / 2 - demiH };  // déplacement maximal depuis le centre
  }

  /* ---------- Analyse d'une photo vierge ----------
     1. Couleurs de fond = 2 teintes dominantes du bord (gère les damiers « transparence » incrustés).
     2. Remplissage depuis les bords : seul le fond relié au bord est retiré (l'intérieur du vêtement est protégé).
     3. Cadre du vêtement = rectangle englobant le reste. 4. Version « fond blanc » de la photo. */
  function analyserPhoto(img) {
    const W = img.naturalWidth, H = img.naturalHeight;
    const s = Math.min(1, 900 / Math.max(W, H)), w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(H * s));
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, w, h);
    const d = g.getImageData(0, 0, w, h).data;

    const bord = [];
    const prendre = (x, y) => { const i = (y * w + x) * 4; if (d[i + 3] > 20) bord.push([d[i], d[i + 1], d[i + 2]]); };
    for (let x = 0; x < w; x += 2) { prendre(x, 0); prendre(x, h - 1); }
    for (let y = 0; y < h; y += 2) { prendre(0, y); prendre(w - 1, y); }
    let centres = [];
    if (bord.length) {  // k-moyennes à 2 groupes (clair / foncé du damier, ou une seule teinte)
      const lum = c => c[0] + c[1] + c[2];
      const tri = bord.slice().sort((a, b) => lum(a) - lum(b));
      centres = [tri[Math.floor(tri.length * .2)].slice(), tri[Math.floor(tri.length * .8)].slice()];
      for (let it = 0; it < 6; it++) {
        const acc = [[0, 0, 0, 0], [0, 0, 0, 0]];
        bord.forEach(c => {
          const k = dist(c, centres[0]) <= dist(c, centres[1]) ? 0 : 1;
          acc[k][0] += c[0]; acc[k][1] += c[1]; acc[k][2] += c[2]; acc[k][3]++;
        });
        acc.forEach((a, k) => { if (a[3]) centres[k] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
      }
    }
    function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }
    const SEUIL = 30;
    const estFond = p => {
      const i = p * 4;
      if (d[i + 3] < 20) return true;
      const c = [d[i], d[i + 1], d[i + 2]];
      return centres.some(ct => dist(c, ct) < SEUIL);
    };
    const fond = new Uint8Array(w * h), pile = [];
    const pousser = p => { if (!fond[p] && estFond(p)) { fond[p] = 1; pile.push(p); } };
    for (let x = 0; x < w; x++) { pousser(x); pousser((h - 1) * w + x); }
    for (let y = 0; y < h; y++) { pousser(y * w); pousser(y * w + w - 1); }
    while (pile.length) {
      const p = pile.pop(), x = p % w;
      if (x > 0) pousser(p - 1);
      if (x < w - 1) pousser(p + 1);
      if (p >= w) pousser(p - w);
      if (p < w * (h - 1)) pousser(p + w);
    }
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!fond[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    const trouve = x1 >= x0 && (x1 - x0) * (y1 - y0) > w * h * .02;
    const cadre = trouve
      ? { x: x0 / s, y: y0 / s, w: (x1 - x0 + 1) / s, h: (y1 - y0 + 1) / s, detecte: true }
      : { x: 0, y: 0, w: W, h: H, detecte: false };

    // Version fond blanc à pleine résolution (le masque réduit est agrandi)
    const propre = document.createElement('canvas'); propre.width = W; propre.height = H;
    const gp = propre.getContext('2d', { willReadFrequently: true });
    gp.fillStyle = '#fff'; gp.fillRect(0, 0, W, H);
    gp.drawImage(img, 0, 0);
    if (trouve) {
      const px = gp.getImageData(0, 0, W, H), q = px.data;
      for (let y = 0; y < H; y++) {
        const my = Math.min(h - 1, Math.floor(y * s)) * w;
        for (let x = 0; x < W; x++) {
          if (fond[my + Math.min(w - 1, Math.floor(x * s))]) { const i = (y * W + x) * 4; q[i] = q[i + 1] = q[i + 2] = 255; }
        }
      }
      gp.putImageData(px, 0, 0);
    }
    // Ligne des épaules : première rangée où le vêtement atteint 55 % de sa largeur maximale.
    // Une capuche donne une partie haute étroite et longue (> 14 % de la hauteur).
    let epaules = cadre.y, capuche = false;
    if (trouve) {
      const largeurs = [];
      let maxL = 0;
      for (let y = y0; y <= y1; y++) {
        let g0 = -1, g1 = -1;
        for (let x = x0; x <= x1; x++) if (!fond[y * w + x]) { if (g0 < 0) g0 = x; g1 = x; }
        const l = g0 < 0 ? 0 : g1 - g0 + 1;
        largeurs.push(l); if (l > maxL) maxL = l;
      }
      const i = largeurs.findIndex(l => l >= maxL * .55);
      if (i >= 0) {
        epaules = (y0 + i) / s;
        capuche = i / Math.max(1, y1 - y0) > .14;
      }
    }
    return { cadre, propre, epaules, capuche };
  }

  /* Cadre du vêtement sur une vue (photo) ou cadre fictif quand la photo manque */
  const PHOTO_VIDE = { w: 900, h: 1125 };
  function cadreVue(vueId) {
    const a = images.analyses[vueId];
    return a ? a.cadre : { x: 200, y: 110, w: 500, h: 900, detecte: false };
  }
  function tailleVue(vueId) {
    const p = images.photos[vueId];
    return p ? { w: p.naturalWidth, h: p.naturalHeight } : PHOTO_VIDE;
  }

  /* Repères d'une vue : échelle (px/cm) et ligne du col (px).
     Automatiques depuis la photo, ou ajustés à la main pour cette photo (projet.reperes[vue]). */
  function reperesVue(vueId) {
    const vet = TYPES[type].vetement, cadre = cadreVue(vueId), a = images.analyses[vueId];
    const manuel = (projet.reperes || {})[vueId] || {};
    const depart = vet.depart === 'epaules' && a ? a.epaules : cadre.y;
    const longueur = projet.longueurCm || vet.longueur;
    const k = Math.max(1, cadre.y + cadre.h - depart) / longueur * (manuel.echelle || 1);  // px par cm
    const yColAuto = depart + (vet.col[vueId] || 0) * k;
    const yCol = typeof manuel.colY === 'number' ? manuel.colY * tailleVue(vueId).h : yColAuto;
    return { k, yCol, manuel: typeof manuel.colY === 'number' || (manuel.echelle && manuel.echelle !== 1) };
  }

  /* Position d'un emplacement sur une vue, en pixels de la photo */
  function zoneSurVue(vueId, def, p) {
    const cadre = cadreVue(vueId), { k, yCol } = reperesVue(vueId);
    return {
      k, yCol,
      cx: cadre.x + cadre.w / 2 + (p.dx || 0) * k,
      cy: yCol + ((p.col || 0) + def.cm[1] / 2) * k
    };
  }

  /* Cadrage affiché : vêtement entier (marge régulière) ou zoom sur l'emplacement actif */
  function etendreAuRatio(r, ratio) {
    let { x, y, w, h } = r;
    if (w / h > ratio) { const nh = w / ratio; y -= (nh - h) / 2; h = nh; }
    else { const nw = h * ratio; x -= (nw - w) / 2; w = nw; }
    return { x, y, w, h };
  }
  function cadrage(vueId, ratio, zoom = false) {
    if (zoom) {
      const def = emplacementDef(type, empId), p = projection(type, vueId, empId);
      if (def && p) {
        const z = zoneSurVue(vueId, def, p);
        const cote = Math.max(def.cm[0] * p.sx, def.cm[1]) * z.k * 2.2;
        return etendreAuRatio({ x: z.cx - cote / 2, y: z.cy - cote / 2, w: cote, h: cote }, ratio);
      }
    }
    const cadre = cadreVue(vueId), t = tailleVue(vueId);
    if (!images.photos[vueId]) return etendreAuRatio({ x: 0, y: 0, w: t.w, h: t.h }, ratio);
    const m = Math.max(cadre.w, cadre.h) * .07;
    return etendreAuRatio({ x: cadre.x - m, y: cadre.y - m, w: cadre.w + 2 * m, h: cadre.h + 2 * m }, ratio);
  }

  /* Dessine une vue sur n'importe quel canvas (plan de travail, aperçu, vignette, export).
     Le canvas doit avoir le même ratio que le cadrage. */
  function rendreVue(cible, vueId, { guides = false, cadre: rect = null } = {}) {
    const g = cible.getContext('2d'), W = cible.width, H = cible.height;
    const r = rect || cadrage(vueId, W / H);
    const s = W / r.w;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
    g.setTransform(s, 0, 0, s, -r.x * s, -r.y * s);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';

    const photo = images.photos[vueId], analyse = images.analyses[vueId];
    if (photo) {
      g.drawImage(projet.fondBlanc !== false && analyse ? analyse.propre : photo, 0, 0);
    } else {
      const t = tailleVue(vueId);
      g.fillStyle = '#f3f3f3'; g.fillRect(0, 0, t.w, t.h);
      g.fillStyle = '#8a8a8a'; g.textAlign = 'center';
      g.font = `600 ${t.w * .04}px sans-serif`;
      g.fillText('Photo vierge à importer', t.w / 2, t.h / 2 - t.w * .03);
      g.font = `${t.w * .03}px sans-serif`;
      g.fillText(TYPES[type].nom + ' · ' + nomVue(vueId), t.w / 2, t.h / 2 + t.w * .03);
    }

    if (guides) {  // cadre détecté + ligne du col
      const cadre = cadreVue(vueId), { yCol } = reperesVue(vueId);
      g.save();
      g.lineWidth = 1 / s; g.setLineDash([5 / s, 4 / s]); g.strokeStyle = 'rgba(120,120,120,.6)';
      g.strokeRect(cadre.x, cadre.y, cadre.w, cadre.h);
      g.strokeStyle = 'rgba(214,92,92,.85)';
      g.beginPath(); g.moveTo(cadre.x, yCol); g.lineTo(cadre.x + cadre.w, yCol); g.stroke();
      g.restore();
    }

    for (const def of TYPES[type].emplacements) {
      const p = projection(type, vueId, def.id);
      if (!p) continue;
      const pl = projet.placements[def.id];
      const z = zoneSurVue(vueId, def, p);
      g.save();
      g.translate(z.cx, z.cy);
      g.rotate((p.rot || 0) * Math.PI / 180);
      g.scale(p.sx, 1);
      g.scale(z.k, z.k);  // unités = cm
      if (pl && photo) {
        const img = imageDesign(pl.design);
        if (img) {
          const geo = geometrieDesign(pl, def, img);
          g.save();
          g.translate(geo.x, geo.y);
          g.rotate(geo.rad);
          g.scale(pl.flipX ? -1 : 1, pl.flipY ? -1 : 1);
          g.drawImage(img, -geo.w / 2, -geo.h / 2, geo.w, geo.h);
          g.restore();
        }
      }
      if (guides) {
        const actif = def.id === empId, px = 1 / (z.k * s);
        g.setLineDash([6 * px, 4 * px]);
        g.lineWidth = (actif ? 2 : 1) * px;
        g.strokeStyle = actif ? '#c9a227' : 'rgba(100,184,207,.75)';
        g.strokeRect(-def.cm[0] / 2, -def.cm[1] / 2, def.cm[0], def.cm[1]);
      }
      g.restore();
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  /* Canvas à la bonne taille pour un cadrage (résolution plafonnée) */
  function dimensionner(cv, r, max, agrandir = true) {
    const f = agrandir ? max / Math.max(r.w, r.h) : Math.min(1, max / Math.max(r.w, r.h));
    const W = Math.max(1, Math.round(r.w * f)), H = Math.max(1, Math.round(r.h * f));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  }
  function imageDesign(designId) {
    const d = projet.designs[designId], im = images.designs[designId];
    if (!d || !im) return null;
    return d.fondRetire && im.traite ? im.traite : im.original;
  }

  /* ---------- 8. Rafraîchissement de l'affichage ---------- */
  let rafPrevu = false;
  function dessiner() {
    if (rafPrevu) return;
    rafPrevu = true;
    requestAnimationFrame(() => {
      rafPrevu = false;
      if (mode === 'apercu') { dessinerApercu(); return; }
      const cadreHtml = $('studio-canvas');
      const ratio = cadreHtml.clientWidth > 0 && cadreHtml.clientHeight > 0
        ? cadreHtml.clientWidth / cadreHtml.clientHeight : RATIO_EXPORT;
      const r = cadrage(vue, ratio, zoomZone);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      dimensionner(c, r, Math.min(2000, Math.max(cadreHtml.clientWidth, cadreHtml.clientHeight, 600) * dpr));
      rendreVue(c, vue, { cadre: r, guides: $('studio-guides').checked || $('studio-calibrate').checked });
      majQualite();
    });
  }

  /* Mode Aperçu (disposition Printful) : vignettes des 5 vues à gauche, grande image à droite.
     Une vue sans photo affiche un emplacement « + Ajouter » qui ouvre directement le choix du fichier. */
  function dessinerApercu() {
    const avecPhoto = VUES.filter(v => images.photos[v.id]);
    if (!images.photos[vue] && avecPhoto.length) vue = avecPhoto[0].id;
    $('studio-apercu-export').disabled = $('studio-apercu-export-all').disabled = !avecPhoto.length;

    const main = $('studio-apercu-main');
    const r = cadrage(vue, RATIO_EXPORT);
    dimensionner(main, r, 1400);
    rendreVue(main, vue, { cadre: r });
    $('studio-apercu-legende').textContent = nomVue(vue) + (images.photos[vue] ? '' : ' — photo vierge manquante');

    const grille = $('studio-apercu-grille');
    grille.replaceChildren();
    VUES.forEach(v => {
      const b = document.createElement('button');
      b.type = 'button';
      const aPhoto = !!images.photos[v.id];
      b.className = (v.id === vue ? 'active ' : '') + (aPhoto ? '' : 'vide');
      b.setAttribute('aria-pressed', String(v.id === vue));
      b.title = aPhoto ? v.nom : 'Ajouter la photo vierge : ' + v.nom;
      if (aPhoto) {
        const cv = document.createElement('canvas'), rv = cadrage(v.id, RATIO_EXPORT);
        dimensionner(cv, rv, 360);
        rendreVue(cv, v.id, { cadre: rv });
        b.append(cv);
        b.onclick = () => { vue = v.id; dessinerApercu(); };
      } else {
        const plus = document.createElement('span');
        plus.className = 'studio-apercu-plus'; plus.textContent = '+';
        b.append(plus);
        b.onclick = () => { const inp = $('studio-apercu-upload'); inp.dataset.vue = v.id; inp.click(); };
      }
      const nom = document.createElement('small');
      nom.textContent = v.nom;
      b.append(nom);
      grille.append(b);
    });
  }

  /* Fait défiler la page pour que la barre Création / Aperçu soit en haut : le studio occupe tout l'écran */
  function allerAuStudio() {
    const barre = document.querySelector('.studio-modes');
    if (barre) window.scrollTo({ top: barre.getBoundingClientRect().top + window.scrollY - 8 });
  }

  let mode = 'creation';
  function changerMode(nouveau) {
    mode = nouveau;
    const apercu = mode === 'apercu';
    $('studio-layout').hidden = apercu;
    $('studio-apercu').hidden = !apercu;
    for (const [id, actif] of [['studio-mode-creation', !apercu], ['studio-mode-apercu', apercu]]) {
      $(id).classList.toggle('active', actif);
      $(id).setAttribute('aria-selected', String(actif));
    }
    if (!apercu) { majBarreVues(); majCalibrage(); majInfoZone(); }
    allerAuStudio();
    dessiner();
  }
  $('studio-mode-creation').onclick = () => changerMode('creation');
  $('studio-mode-apercu').onclick = () => changerMode('apercu');

  function majBarreVues() {
    const bar = $('studio-viewbar');
    bar.replaceChildren();
    VUES.forEach(v => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = v.nom + (projet.photos[v.id] ? ' ✓' : '');
      b.className = v.id === vue ? 'active' : '';
      b.setAttribute('aria-pressed', String(v.id === vue));
      b.onclick = () => changerVue(v.id);
      bar.append(b);
    });
  }

  function majInfoZone() {
    const def = emplacementDef(type, empId);
    const visibles = vuesVisibles(type, empId);
    const surVue = projection(type, vue, empId);
    $('studio-emplacement-vues').textContent =
      'Zone max ' + def.cm[0] + ' × ' + def.cm[1] + ' cm (à confirmer avec l’imprimeur). ' +
      (visibles.length
        ? 'Visible sur : ' + visibles.join(', ') + '.' + (surVue ? '' : ' Pas sur la vue ' + nomVue(vue) + '.')
        : 'Visible sur aucune vue : active-le dans « Projection sur cette vue ».');
  }

  function majListeEmplacements() {
    const sel = $('studio-zone');
    sel.replaceChildren();
    TYPES[type].emplacements.forEach(def => {
      const o = document.createElement('option');
      o.value = def.id;
      o.textContent = def.nom + (projet.placements[def.id] ? ' ●' : '');
      sel.append(o);
    });
    if (!emplacementDef(type, empId)) empId = TYPES[type].emplacements[0].id;
    sel.value = empId;
  }

  function majListeDesigns() {
    const sel = $('studio-design-select');
    sel.replaceChildren();
    const aucun = document.createElement('option');
    aucun.value = ''; aucun.textContent = '— Aucun design —';
    sel.append(aucun);
    Object.entries(projet.designs).forEach(([id, d]) => {
      const o = document.createElement('option');
      o.value = id; o.textContent = d.nom;
      sel.append(o);
    });
    const pl = projet.placements[empId];
    sel.value = pl ? pl.design : '';
  }

  function majReglages() {
    const pl = projet.placements[empId];
    const actif = !!pl;
    ['studio-width-cm', 'studio-height-cm', 'studio-rotation'].forEach(id => { $(id).disabled = !actif; });
    document.querySelectorAll('[data-move], [data-align], #studio-flip-x, #studio-flip-y, #studio-clear-logo')
      .forEach(b => { b.disabled = !actif; });
    $('studio-width-cm').value = actif ? pl.largeurCm : '';
    $('studio-height-cm').value = actif ? pl.hauteurCm : '';
    $('studio-rotation').value = actif ? pl.rotation : 0;
    $('studio-rotation-value').textContent = (actif ? pl.rotation : 0) + '°';
    majOutilsFond();
  }

  function majQualite() {
    const pl = projet.placements[empId], def = emplacementDef(type, empId);
    if (!pl) { $('studio-quality').textContent = 'Aucun design sur cet emplacement.'; return; }
    const img = imageDesign(pl.design);
    if (!img) { $('studio-quality').textContent = ''; return; }
    const geo = geometrieDesign(pl, def, img);
    const dpi = Math.round(img.naturalWidth / (geo.w / 2.54));
    $('studio-quality').textContent =
      'Source : ' + img.naturalWidth + ' × ' + img.naturalHeight + ' px · ' +
      pl.largeurCm + ' × ' + pl.hauteurCm + ' cm ≈ ' + dpi + ' ppp' +
      (dpi < 150 ? ' (faible pour l’impression, vise 300 ppp)' : '') +
      (geo.ajuste ? ' · Aperçu réduit pour tenir dans la zone.' : '');
  }

  const UNITES = { dx: ' cm', col: ' cm', sx: ' %', rot: '°' };
  function majReperes() {
    const r = reperesVue(vue), m = (projet.reperes || {})[vue] || {};
    const colPct = Math.round(r.yCol / tailleVue(vue).h * 1000) / 10;
    $('studio-coly').value = colPct;
    $('studio-coly-value').textContent = String(colPct).replace('.', ',') + ' %';
    const ech = Math.round((m.echelle || 1) * 100);
    $('studio-echp').value = ech;
    $('studio-echp-value').textContent = ech + ' %';
    $('studio-reperes-etat').textContent = r.manuel ? 'Repères ajustés à la main pour cette photo.' : 'Repères automatiques.';
  }
  function majConseilGabarit() {
    const a = images.analyses.face, box = $('studio-gabarit-conseil');
    let conseil = null;
    if (a && a.cadre.detecte) {
      if (type === 'hoodie' && !a.capuche) conseil = 'tshirt';
      if ((type === 'tshirt' || type === 'veste') && a.capuche) conseil = 'hoodie';
    }
    box.hidden = !conseil;
    if (conseil) {
      $('studio-gabarit-conseil-texte').textContent = conseil === 'tshirt'
        ? 'La photo de face ne montre pas de capuche : le gabarit Hoodie place les zones trop bas.'
        : 'La photo de face semble avoir une capuche : le gabarit Hoodie est plus adapté.';
      $('studio-gabarit-appliquer').dataset.gabarit = conseil;
      $('studio-gabarit-appliquer').textContent = 'Utiliser le gabarit ' + TYPES[conseil].nom;
    }
  }
  function majCalibrage() {
    majReperes();
    majConseilGabarit();
    const p = projection(type, vue, empId);
    $('studio-visible').checked = !!p;
    const champs = $('studio-calibration-champs');
    champs.hidden = !p;
    if (!p) return;
    const valeurs = { dx: p.dx || 0, col: p.col || 0, sx: Math.round(p.sx * 100), rot: p.rot || 0 };
    for (const k of Object.keys(valeurs)) {
      $('studio-' + k).value = valeurs[k];
      $('studio-' + k + '-value').textContent = String(valeurs[k]).replace('.', ',') + UNITES[k];
    }
  }

  function majLongueur() {
    const vet = TYPES[type].vetement;
    $('studio-longueur').placeholder = vet.longueur;
    $('studio-longueur').value = projet.longueurCm || vet.longueur;
    $('studio-longueur-aide').textContent = vet.depart === 'epaules'
      ? 'Hoodie : de la base de la capuche (épaule) à l’ourlet. Valeur par défaut : ' + vet.longueur + ' cm.'
      : 'Du haut de l’épaule à l’ourlet, pour la taille photographiée (guide des tailles du fournisseur). Valeur par défaut : ' + vet.longueur + ' cm.';
  }
  function toutRafraichir() {
    majLongueur();
    $('studio-fond-blanc').checked = projet.fondBlanc !== false;
    majBarreVues();
    majListeEmplacements();
    majListeDesigns();
    majReglages();
    majCalibrage();
    majInfoZone();
    majStatut();
    dessiner();
  }

  /* ---------- 9. Catalogue, produits et projets ---------- */
  async function chargerCatalogue() {
    try {
      const res = await fetch('../04-data/produits.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      catalogue = (data.produits || []).filter(p => p && p.id);
      if (!catalogue.length) throw new Error('Catalogue vide');
    } catch (e) {
      console.warn('[TRIÈDRE Studio] Catalogue indisponible, produits de secours utilisés :', e);
      catalogue = CATALOGUE_SECOURS;
      warn('Catalogue introuvable : produits génériques affichés.');
    }
  }

  async function remplirProduits() {
    let enregistres = new Set();
    try { enregistres = new Set((await dbTout()).map(p => p.produitId)); } catch { /* base indisponible */ }
    const sel = $('studio-product');
    sel.replaceChildren();
    catalogue.forEach(p => {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = (p.nom || p.id) + (enregistres.has(p.id) ? ' ✓' : '');
      sel.append(o);
    });
    sel.value = produit ? produit.id : catalogue[0].id;
  }

  function remplirCouleurs() {
    const sel = $('studio-color');
    sel.replaceChildren();
    couleursProduit(produit).forEach(col => {
      const o = document.createElement('option');
      o.value = col.nom; o.textContent = col.nom;
      sel.append(o);
    });
    sel.value = couleur;
  }

  async function ouvrirProjet(produitId, couleurVoulue) {
    produit = catalogue.find(p => p.id === produitId) || catalogue[0];
    type = typeProduit(produit);
    const couleurs = couleursProduit(produit);
    couleur = couleurs.some(cl => cl.nom === couleurVoulue) ? couleurVoulue : couleurs[0].nom;
    remplirCouleurs();
    $('studio-product').value = produit.id;

    const cle = produit.id + '|' + slug(couleur);
    let sauve = null;
    try { sauve = await dbLire(cle); } catch (e) { warn('Lecture des projets impossible : ' + e.message); }
    projet = sauve || nouveauProjet();
    if (!TYPES[projet.gabarit]) projet.gabarit = type;
    type = projet.gabarit;  // gabarit choisi pour ce projet (par défaut : celui du catalogue)
    projet.type = type;
    $('studio-gabarit').value = type;

    images = { photos: {}, designs: {}, analyses: {} };
    apercuFond = null;
    for (const [v, blob] of Object.entries(projet.photos)) {
      try { await chargerPhoto(v, blob); } catch { delete projet.photos[v]; }
    }
    for (const [id, d] of Object.entries(projet.designs)) {
      try {
        images.designs[id] = {
          original: await decoder(d.original),
          traite: d.traite ? await decoder(d.traite) : null
        };
      } catch { delete projet.designs[id]; }
    }
    vue = 'face';
    empId = Object.keys(projet.placements)[0] || TYPES[type].emplacements[0].id;
    dirty = false;
    history.replaceState(null, '', '?id=' + encodeURIComponent(produit.id) + '&couleur=' + encodeURIComponent(couleur));
    toutRafraichir();
  }

  async function chargerPhoto(v, blob) {
    const im = await decoder(blob);
    images.photos[v] = im;
    images.analyses[v] = analyserPhoto(im);
  }

  async function confirmerAbandon() {
    return !dirty || confirmer('Des modifications non enregistrées seront perdues.', 'QUITTER SANS ENREGISTRER ?', 'Continuer');
  }

  /* ---------- 10. Interactions ---------- */
  function changerVue(v) {
    vue = v;
    majBarreVues();
    majCalibrage();
    majInfoZone();
    dessiner();
  }

  $('studio-product').onchange = async e => {
    if (!(await confirmerAbandon())) { e.target.value = produit.id; return; }
    await ouvrirProjet(e.target.value, null);
  };
  $('studio-color').onchange = async e => {
    if (!(await confirmerAbandon())) { e.target.value = couleur; return; }
    await ouvrirProjet(produit.id, e.target.value);
  };

  /* Photos vierges : un fichier = vue active ; plusieurs fichiers = repérage par nom (face, dos, gauche…) */
  function vueDepuisNom(nom) {
    const n = slug(nom);
    if (/iso/.test(n)) return 'isometrique';
    if (/(^|-)(dos|back|arriere)(-|$)/.test(n)) return 'dos';
    if (/(^|-)(gauche|left)(-|$)/.test(n)) return 'gauche';
    if (/(^|-)(droite|right)(-|$)/.test(n)) return 'droite';
    if (/(^|-)(face|front|devant)(-|$)/.test(n)) return 'face';
    return null;
  }
  $('studio-base-upload').onchange = async e => {
    const fichiers = [...e.target.files];
    e.target.value = '';
    if (!fichiers.length) return;
    const recus = [], problemes = [];
    for (const f of fichiers) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type) || f.size > 15e6) {
        problemes.push(f.name + ' : format non pris en charge ou plus de 15 Mo.'); continue;
      }
      const cible = fichiers.length === 1 ? vue : vueDepuisNom(f.name);
      if (!cible) { problemes.push(f.name + ' : vue non reconnue (le nom doit contenir face, dos, gauche, droite ou iso).'); continue; }
      try {
        await chargerPhoto(cible, f);
        projet.photos[cible] = f;
        recus.push(nomVue(cible));
        if (!images.analyses[cible].cadre.detecte) problemes.push(f.name + ' : vêtement non détecté (fond trop chargé). Les zones utilisent toute la photo.');
      } catch { problemes.push('Impossible de lire ' + f.name + '.'); }
    }
    if (recus.length) { marquerModifie(); majBarreVues(); majCalibrage(); dessiner(); }
    if (recus.includes(nomVue('face')) && !$('studio-gabarit-conseil').hidden) {
      const cible = $('studio-gabarit-appliquer').dataset.gabarit;
      const ok = await confirmer($('studio-gabarit-conseil-texte').textContent, 'GABARIT ' + TYPES[type].nom.toUpperCase() + ' ?',
        'Utiliser ' + TYPES[cible].nom);
      if (ok) { $('studio-gabarit').value = cible; $('studio-gabarit').dispatchEvent(new Event('change')); }
    }
    if (problemes.length) {
      warn((recus.length ? 'Photos chargées : ' + recus.join(', ') + '. ' : '') + problemes.join(' '), 'PHOTOS VIERGES');
    }
  };
  $('studio-clear-base').onclick = () => {
    if (!projet.photos[vue]) { warn('Aucune photo vierge sur la vue ' + nomVue(vue) + '.'); return; }
    delete projet.photos[vue]; delete images.photos[vue]; delete images.analyses[vue];
    marquerModifie(); majBarreVues(); dessiner();
  };

  $('studio-zone').onchange = e => {
    empId = e.target.value;
    majListeDesigns(); majReglages(); majCalibrage(); majInfoZone(); dessiner();
    const visibles = vuesVisibles(type, empId);
    if (!projection(type, vue, empId) && visibles.length) {
      const cible = VUES.find(v => projection(type, v.id, empId));
      changerVue(cible.id);
    }
  };

  function placerDesign(designId) {
    const def = emplacementDef(type, empId), img = imageDesign(designId);
    const ratio = img ? img.naturalHeight / img.naturalWidth : 1;
    let w = def.defaut || def.cm[0] * .8, h = w * ratio;
    if (h > def.cm[1]) { h = def.cm[1]; w = h / ratio; }
    projet.placements[empId] = {
      design: designId,
      largeurCm: +w.toFixed(1), hauteurCm: +h.toFixed(1),
      rotation: 0, dx: 0, dy: +(-(def.cm[1] - h) / 2).toFixed(2),  // haut du design = haut de la zone (repère « sous le col »)
      flipX: false, flipY: false
    };
  }

  $('studio-design-select').onchange = e => {
    const id = e.target.value;
    if (!id) delete projet.placements[empId];
    else if (projet.placements[empId]) projet.placements[empId].design = id;
    else placerDesign(id);
    marquerModifie(); majListeEmplacements(); majReglages(); majInfoZone(); dessiner();
  };

  $('studio-logo-upload').onchange = async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!['image/png', 'image/webp', 'image/svg+xml'].includes(f.type) || f.size > 5e6) {
      warn('Design non pris en charge (PNG, WebP ou SVG, 5 Mo maximum).'); return;
    }
    if (f.type === 'image/svg+xml') {
      const txt = await f.text();
      if (/<script|<foreignObject|\bon\w+\s*=|(?:href|src)\s*=\s*["'](?:https?:|data:|javascript:)/i.test(txt)) {
        warn('SVG actif ou externe refusé. Utilise un SVG simple ou un PNG transparent.'); return;
      }
    }
    try {
      const im = await decoder(f);
      const id = 'd' + Date.now().toString(36);
      projet.designs[id] = { nom: f.name, original: f, traite: null, fondRetire: false, tolerance: 30 };
      images.designs[id] = { original: im, traite: null };
      placerDesign(id);
      marquerModifie(); majListeEmplacements(); majListeDesigns(); majReglages(); majInfoZone(); dessiner();
    } catch { warn('Impossible de lire ce design.'); }
  };

  $('studio-clear-logo').onclick = () => {
    if (!projet.placements[empId]) return;
    delete projet.placements[empId];
    marquerModifie(); majListeEmplacements(); majListeDesigns(); majReglages(); dessiner();
  };

  /* Dimensions, rotation, déplacement, pivots */
  function majMesure(champ) {
    const pl = projet.placements[empId];
    if (!pl) return;
    const img = imageDesign(pl.design), ratio = img ? img.naturalHeight / img.naturalWidth : 1;
    const v = clamp(Number($(champ === 'w' ? 'studio-width-cm' : 'studio-height-cm').value) || .1, .1, 100);
    if (champ === 'w') {
      pl.largeurCm = v;
      if ($('studio-lock-ratio').checked) { pl.hauteurCm = +(v * ratio).toFixed(2); $('studio-height-cm').value = pl.hauteurCm; }
    } else {
      pl.hauteurCm = v;
      if ($('studio-lock-ratio').checked) { pl.largeurCm = +(v / ratio).toFixed(2); $('studio-width-cm').value = pl.largeurCm; }
    }
    marquerModifie(); dessiner();
  }
  $('studio-width-cm').oninput = () => majMesure('w');
  $('studio-height-cm').oninput = () => majMesure('h');
  $('studio-lock-ratio').onchange = () => { if ($('studio-lock-ratio').checked) majMesure('w'); };
  $('studio-rotation').oninput = () => {
    const pl = projet.placements[empId]; if (!pl) return;
    pl.rotation = +$('studio-rotation').value;
    $('studio-rotation-value').textContent = pl.rotation + '°';
    marquerModifie(); dessiner();
  };
  /* Pas de 0,5 cm ; Maj + clic = 0,1 cm. La position est mémorisée telle quelle, l'affichage la borne à la zone. */
  document.querySelectorAll('[data-move]').forEach(b => {
    b.onclick = e => {
      const pl = projet.placements[empId]; if (!pl) return;
      const pas = e.shiftKey ? .1 : .5, def = emplacementDef(type, empId);
      const geo = geometrieDesign(pl, def, null);
      pl.dx = geo.x; pl.dy = geo.y;  // repartir de la position réellement affichée
      if (b.dataset.move === 'left') pl.dx -= pas;
      if (b.dataset.move === 'right') pl.dx += pas;
      if (b.dataset.move === 'up') pl.dy -= pas;
      if (b.dataset.move === 'down') pl.dy += pas;
      pl.dx = +pl.dx.toFixed(2); pl.dy = +pl.dy.toFixed(2);
      marquerModifie(); dessiner();
    };
  });
  /* Aligner dans la zone d'impression (bords et centres) */
  document.querySelectorAll('[data-align]').forEach(b => {
    b.onclick = () => {
      const pl = projet.placements[empId]; if (!pl) return;
      const geo = geometrieDesign(pl, emplacementDef(type, empId), null);
      const a = b.dataset.align;
      if (a === 'centre-v') pl.dy = 0;
      if (a === 'centre-h') pl.dx = 0;
      if (a === 'gauche') pl.dx = -geo.maxX;
      if (a === 'droite') pl.dx = geo.maxX;
      if (a === 'haut') pl.dy = -geo.maxY;
      if (a === 'bas') pl.dy = geo.maxY;
      pl.dx = +pl.dx.toFixed(2); pl.dy = +pl.dy.toFixed(2);
      marquerModifie(); dessiner();
    };
  });
  $('studio-flip-x').onclick = () => {
    const pl = projet.placements[empId]; if (!pl) return;
    pl.flipX = !pl.flipX; marquerModifie(); dessiner();
  };
  $('studio-flip-y').onclick = () => {
    const pl = projet.placements[empId]; if (!pl) return;
    pl.flipY = !pl.flipY; marquerModifie(); dessiner();
  };

  /* ---------- 11. Suppression du fond noir (par design, non destructive) ---------- */
  function rendreTransparent(source, tolerance) {
    const cv = document.createElement('canvas');
    cv.width = source.naturalWidth || source.width; cv.height = source.naturalHeight || source.height;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(source, 0, 0);
    const pixels = cx.getImageData(0, 0, cv.width, cv.height), d = pixels.data;
    let gauche = cv.width, haut = cv.height, droite = -1, bas = -1;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
      const i = (y * cv.width + x) * 4;
      const lum = Math.max(d[i], d[i + 1], d[i + 2]);
      const fondu = clamp((lum - tolerance) / Math.max(8, tolerance * .55), 0, 1);
      d[i + 3] = Math.round(d[i + 3] * fondu);
      if (d[i + 3] > 3) { gauche = Math.min(gauche, x); droite = Math.max(droite, x); haut = Math.min(haut, y); bas = Math.max(bas, y); }
    }
    cx.putImageData(pixels, 0, 0);
    if (droite < gauche) return null;
    const m = 2, x = Math.max(0, gauche - m), y = Math.max(0, haut - m);
    const w = Math.min(cv.width - x, droite - gauche + 1 + m * 2), h = Math.min(cv.height - y, bas - haut + 1 + m * 2);
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    out.getContext('2d').drawImage(cv, x, y, w, h, 0, 0, w, h);
    return out;
  }
  function vignette(cv, img) {
    const g = cv.getContext('2d'), carre = 12;
    g.clearRect(0, 0, cv.width, cv.height);
    for (let y = 0; y < cv.height; y += carre) for (let x = 0; x < cv.width; x += carre) {
      g.fillStyle = ((x + y) / carre) % 2 === 0 ? '#f0f0f0' : '#c7c7c7';
      g.fillRect(x, y, carre, carre);
    }
    if (!img) return;
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const s = Math.min((cv.width - 12) / iw, (cv.height - 12) / ih);
    g.drawImage(img, (cv.width - iw * s) / 2, (cv.height - ih * s) / 2, iw * s, ih * s);
  }
  function majOutilsFond() {
    const pl = projet.placements[empId];
    const box = $('studio-background-tools');
    box.hidden = !pl;
    if (!pl) return;
    const d = projet.designs[pl.design], im = images.designs[pl.design];
    if (!d || !im) { box.hidden = true; return; }
    $('studio-bg-tolerance').value = d.tolerance;
    $('studio-bg-tolerance-value').textContent = d.tolerance;
    $('studio-background-state').textContent = d.fondRetire ? 'Fond retiré' : 'Original';
    vignette($('studio-before'), im.original);
    if (!apercuFond || apercuFond.designId !== pl.design) calculerApercuFond();
    else vignette($('studio-after'), apercuFond.canvas);
  }
  function calculerApercuFond() {
    const pl = projet.placements[empId]; if (!pl) return;
    const im = images.designs[pl.design]; if (!im) return;
    const cv = rendreTransparent(im.original, +$('studio-bg-tolerance').value);
    apercuFond = cv ? { designId: pl.design, canvas: cv } : null;
    vignette($('studio-after'), cv);
    $('studio-background-state').textContent = cv
      ? (projet.designs[pl.design].fondRetire ? 'Fond retiré' : 'Original')
      : 'Rien de détecté : réduis la tolérance';
  }
  $('studio-bg-tolerance').oninput = () => {
    $('studio-bg-tolerance-value').textContent = $('studio-bg-tolerance').value;
    calculerApercuFond();
  };
  $('studio-remove-bg').onclick = async () => {
    const pl = projet.placements[empId]; if (!pl) return;
    calculerApercuFond();
    if (!apercuFond) { warn('Aucun dessin détecté après suppression du fond. Réduis la tolérance.', 'FOND DU DESIGN'); return; }
    try {
      const d = projet.designs[pl.design];
      const blob = await versBlob(apercuFond.canvas);
      d.traite = blob; d.fondRetire = true; d.tolerance = +$('studio-bg-tolerance').value;
      images.designs[pl.design].traite = await decoder(blob);
      if ($('studio-lock-ratio').checked) majMesure('w');
      marquerModifie(); majOutilsFond(); dessiner();
    } catch (e) { warn('Suppression impossible : ' + e.message); }
  };
  $('studio-restore-bg').onclick = () => {
    const pl = projet.placements[empId]; if (!pl) return;
    projet.designs[pl.design].fondRetire = false;
    if ($('studio-lock-ratio').checked) majMesure('w');
    marquerModifie(); majOutilsFond(); dessiner();
  };

  /* ---------- 12. Projection sur la vue active (calibrage administrateur) ---------- */
  $('studio-guides').onchange = dessiner;
  $('studio-calibrate').onchange = e => {
    $('studio-calibration').hidden = !e.target.checked;
    majCalibrage(); dessiner();
  };
  $('studio-visible').onchange = e => {
    const cle = cleProj(type, vue, empId);
    const actuelle = projection(type, vue, empId) || { dx: 0, col: 8, echelle: 1, sx: 1, rot: 0 };
    projections[cle] = { ...actuelle, visible: e.target.checked };
    majCalibrage(); majInfoZone(); dessiner();
  };
  const CHAMP_PROJ = { dx: 'dx', col: 'col', sx: 'sx', rot: 'rot' };
  for (const k of Object.keys(CHAMP_PROJ)) {
    $('studio-' + k).oninput = () => {
      const p = projection(type, vue, empId); if (!p) return;
      const v = +$('studio-' + k).value;
      projections[cleProj(type, vue, empId)] = { ...p, [CHAMP_PROJ[k]]: k === 'sx' ? v / 100 : v, visible: true };
      $('studio-' + k + '-value').textContent = String(v).replace('.', ',') + UNITES[k];
      dessiner();
    };
  }

  /* Repères de la photo active (ligne du col, échelle) */
  function repereManuel() {
    projet.reperes = projet.reperes || {};
    return (projet.reperes[vue] = projet.reperes[vue] || {});
  }
  $('studio-coly').oninput = () => {
    repereManuel().colY = +$('studio-coly').value / 100;
    marquerModifie(); majReperes(); dessiner();
  };
  $('studio-echp').oninput = () => {
    repereManuel().echelle = +$('studio-echp').value / 100;
    marquerModifie(); majReperes(); dessiner();
  };
  $('studio-reperes-auto').onclick = () => {
    if (projet.reperes) delete projet.reperes[vue];
    marquerModifie(); majReperes(); dessiner();
  };
  $('studio-gabarit-appliquer').onclick = e => {
    $('studio-gabarit').value = e.currentTarget.dataset.gabarit;
    $('studio-gabarit').dispatchEvent(new Event('change'));
  };

  $('studio-longueur').oninput = () => {
    const v = Number($('studio-longueur').value);
    projet.longueurCm = v >= 10 && v <= 200 ? v : null;
    marquerModifie(); majReperes(); dessiner();
  };

  /* Gabarit, fond blanc, zoom */
  $('studio-gabarit').onchange = e => {
    type = projet.gabarit = projet.type = e.target.value;
    projet.longueurCm = null;  // la longueur par défaut suit le nouveau gabarit
    empId = Object.keys(projet.placements).find(id => emplacementDef(type, id)) || TYPES[type].emplacements[0].id;
    marquerModifie(); toutRafraichir();
  };
  $('studio-fond-blanc').onchange = e => { projet.fondBlanc = e.target.checked; marquerModifie(); dessiner(); };
  document.querySelectorAll('[data-zoom]').forEach(b => {
    b.onclick = () => {
      zoomZone = b.dataset.zoom === 'zone';
      document.querySelectorAll('[data-zoom]').forEach(x => {
        x.classList.toggle('active', x === b); x.setAttribute('aria-pressed', String(x === b));
      });
      dessiner();
    };
  });
  window.addEventListener('resize', dessiner);
  $('studio-apercu-upload').onchange = async e => {
    const f = e.target.files[0], cible = e.target.dataset.vue;
    e.target.value = '';
    if (!f || !cible) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type) || f.size > 15e6) {
      warn('Format non pris en charge ou plus de 15 Mo.', 'PHOTOS VIERGES'); return;
    }
    try {
      await chargerPhoto(cible, f);
      projet.photos[cible] = f; vue = cible;
      marquerModifie(); majBarreVues(); dessiner();
    } catch { warn('Impossible de lire ce fichier.', 'PHOTOS VIERGES'); }
  };
  $('studio-save-template').onclick = () => {
    sauverProjections();
    warn('Projection enregistrée pour ' + TYPES[type].nom + ' · ' + nomVue(vue) + ' · ' + emplacementDef(type, empId).nom + '.', 'PROJECTION ENREGISTRÉE');
  };
  $('studio-reset-template').onclick = () => {
    delete projections[cleProj(type, vue, empId)];
    sauverProjections(); majCalibrage(); majInfoZone(); dessiner();
  };

  /* ---------- 13. Enregistrement, export, suppression ---------- */
  function nettoyerDesigns() {
    const utilises = new Set(Object.values(projet.placements).map(p => p.design));
    for (const id of Object.keys(projet.designs)) {
      if (!utilises.has(id)) { delete projet.designs[id]; delete images.designs[id]; }
    }
  }
  $('studio-save').onclick = async () => {
    try {
      nettoyerDesigns();
      projet.maj = new Date().toISOString();
      await dbEcrire(projet);
      sauverProjections();
      dirty = false;
      majListeDesigns(); majStatut(); await remplirProduits();
      warn(produit.nom + ' · ' + couleur + ' est enregistré dans ce navigateur.', 'PROJET ENREGISTRÉ');
    } catch (e) { warn('Échec de l’enregistrement : ' + e.message, 'ERREUR'); }
  };

  const nomFichier = (v, ext = '.webp') => 'produit-' + projet.slug + '-' + slug(couleur) + '-' + v + ext;
  async function exporterVue(v) {
    const cv = document.createElement('canvas'), r = cadrage(v, RATIO_EXPORT);
    dimensionner(cv, r, 2400, false);  // jamais plus grand que la photo d'origine
    rendreVue(cv, v, { cadre: r });
    const blob = await versBlobExport(cv);
    const a = document.createElement('a'), url = URL.createObjectURL(blob);
    a.href = url; a.download = nomFichier(v, extension(blob));
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  $('studio-export').onclick = async () => {
    if (!images.photos[vue]) { warn('Importe une photo vierge sur la vue ' + nomVue(vue) + ' avant l’export.'); return; }
    await exporterVue(vue);
    warn('Fichier téléchargé : ' + nomFichier(vue), 'EXPORT TERMINÉ');
  };
  $('studio-export-all').onclick = async () => {
    const pretes = VUES.filter(v => images.photos[v.id]);
    if (!pretes.length) { warn('Aucune photo vierge à exporter.'); return; }
    for (const v of pretes) {
      await exporterVue(v.id);
      await new Promise(r => setTimeout(r, 400));  // laisse le navigateur traiter chaque téléchargement
    }
    const manquantes = VUES.filter(v => !images.photos[v.id]).map(v => v.nom);
    warn(pretes.length + ' vue(s) exportée(s)' + (manquantes.length ? ' · sans photo : ' + manquantes.join(', ') : '') +
      '. Si le navigateur demande l’autorisation de télécharger plusieurs fichiers, accepte-la.', 'EXPORT TERMINÉ');
  };
  $('studio-apercu-export').onclick = () => $('studio-export').click();
  $('studio-apercu-export-all').onclick = () => $('studio-export-all').click();
  $('studio-delete-project').onclick = async () => {
    const ok = await confirmer('Le projet ' + produit.nom + ' · ' + couleur + ' sera supprimé définitivement de ce navigateur.',
      'SUPPRIMER LE PROJET ?', 'Supprimer');
    if (!ok) return;
    try {
      await dbSupprimer(projet.cle);
      dirty = false;
      await ouvrirProjet(produit.id, couleur);
      await remplirProduits();
    } catch (e) { warn('Suppression impossible : ' + e.message); }
  };

  /* ---------- 14. Protection contre la perte de travail ---------- */
  $('studio-back').addEventListener('click', async e => {
    if (!dirty) return;
    e.preventDefault();
    const destination = e.currentTarget.href;
    if (await confirmer('Des modifications non enregistrées seront perdues.', 'QUITTER LE STUDIO ?', 'Quitter')) {
      dirty = false;
      location.href = destination;
    }
  });
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  /* ---------- 15. Démarrage ---------- */
  (async () => {
    // Accès réservé aux administrateurs (voir admin-garde.js)
    if (window.triedreAdminPret && !(await window.triedreAdminPret)) return;
    $('studio-gabarit').replaceChildren(...Object.entries(TYPES).map(([id, t]) => {
      const o = document.createElement('option'); o.value = id; o.textContent = t.nom; return o;
    }));
    await chargerCatalogue();
    const params = new URLSearchParams(location.search);
    produit = catalogue.find(p => p.id === params.get('id')) || catalogue[0];
    await remplirProduits();
    await ouvrirProjet(produit.id, params.get('couleur'));
    allerAuStudio();
  })();
})();
