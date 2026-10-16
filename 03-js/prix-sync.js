// ==========================================================================
// TRIÈDRE — Synchronisation cartes boutique — Catalogue V1 + stock Supabase
// ==========================================================================

const CHEMIN_IMAGES_PRODUITS = '../05-images/produits/';

function normaliserCouleur(texte) {
  return String(texte || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

function obtenirClientStockSupabase() {
  if (window.triedreStockSupabase) {
    return Promise.resolve(window.triedreStockSupabase);
  }

  if (window.triedreStockReady) {
    return window.triedreStockReady;
  }

  window.triedreStockReady = new Promise(function (resolve, reject) {
    const existant = document.querySelector('script[data-triedre-stock-supabase]');

    if (existant) {
      existant.addEventListener('load', function () {
        if (window.triedreStockSupabase) {
          resolve(window.triedreStockSupabase);
        } else {
          reject(new Error('Client stock Supabase introuvable.'));
        }
      }, { once: true });

      existant.addEventListener('error', function () {
        reject(new Error('Impossible de charger stock-supabase.js.'));
      }, { once: true });

      return;
    }

    const script = document.createElement('script');
    script.src = '../03-js/stock-supabase.js';
    script.async = true;
    script.setAttribute('data-triedre-stock-supabase', '');

    script.onload = function () {
      if (window.triedreStockSupabase) {
        resolve(window.triedreStockSupabase);
      } else {
        reject(new Error('Client stock Supabase introuvable.'));
      }
    };

    script.onerror = function () {
      reject(new Error('Impossible de charger stock-supabase.js.'));
    };

    document.head.appendChild(script);
  });

  return window.triedreStockReady;
}

document.addEventListener('DOMContentLoaded', async function () {

  const cartes =
    document.querySelectorAll('.produit-card a[href*="produit?id="]');

  if (cartes.length === 0) return;

  // Styles des pastilles : ajoutés automatiquement sur toute page qui affiche des cartes (accueil, boutique…).
  if (!document.querySelector('link[href*="produits-disponibilite.css"]')) {
    const feuille = document.createElement('link');
    feuille.rel = 'stylesheet';
    feuille.href = '../02-css/produits-disponibilite.css';
    document.head.appendChild(feuille);
  }

  try {
    const reponse = await fetch('../04-data/produits.json');

    if (!reponse.ok) {
      throw new Error('Impossible de charger produits.json');
    }

    const donnees = await reponse.json();
    const clientStock = await obtenirClientStockSupabase();
    const stocksParSku = await clientStock.indexParSku(true);

    cartes.forEach(function (lien) {
      const url = new URL(lien.href);
      const id = url.searchParams.get('id');

      const produit = donnees.produits.find(function (p) {
        return p.id === id;
      });

      if (!produit || produit.actif === false) return;

      const variantes = (produit.variantes || [])
        .filter(function (v) {
          return v.actif !== false;
        })
        .map(function (v) {
          const distante = stocksParSku.get(v.sku);

          return Object.assign({}, v, {
            stock: distante ? distante.stock : 0,
            actif: distante ? distante.active !== false : false
          });
        })
        .filter(function (v) {
          return v.actif !== false;
        });

      if (variantes.length === 0) return;

      const reference = variantes.reduce(function (moinsCher, variante) {
        return variante.prix < moinsCher.prix ? variante : moinsCher;
      }, variantes[0]);

      const spanPrix = lien.querySelector('.prix');

      if (spanPrix) {
        spanPrix.textContent =
          reference.prix.toFixed(2).replace('.', ',') + ' $';
      }

      lien.querySelectorAll(
        '.badge-produit, .stock-limite'
      ).forEach(function (element) {
        element.remove();
      });

      lien.classList.remove('produit-rupture');

      if (produit.badge) {
        const badge = document.createElement('span');
        badge.className = 'badge-produit';
        badge.textContent = produit.badge;
        lien.appendChild(badge);
      }

      const stockTotal = variantes.reduce(function (total, v) {
        return total + v.stock;
      }, 0);

      // Couleurs du produit, avec leur disponibilité (au moins une taille en stock).
      const couleurs = [];
      variantes.forEach(function (v) {
        let couleur = couleurs.find(function (c) { return c.nom === v.couleur; });
        if (!couleur) {
          couleur = { nom: v.couleur, hex: v.hex, photoFace: v.photoFace, stock: 0 };
          couleurs.push(couleur);
        }
        couleur.stock += v.stock > 0 ? v.stock : 0;
      });

      const image = lien.querySelector('img');
      const premiereDisponible = couleurs.find(function (c) { return c.stock > 0; });

      // L'image de la carte montre une couleur réellement disponible.
      if (image && premiereDisponible && premiereDisponible.photoFace) {
        image.src = CHEMIN_IMAGES_PRODUITS + premiereDisponible.photoFace;
      }
      const imageParDefaut = image ? image.src : '';

      lien.querySelectorAll('.carte-couleurs').forEach(function (el) { el.remove(); });

      if (couleurs.length > 1) {
        const pastilles = document.createElement('span');
        pastilles.className = 'carte-couleurs';

        couleurs.forEach(function (couleur) {
          const pastille = document.createElement('span');
          const epuisee = couleur.stock === 0;

          pastille.className = 'carte-couleur' + (epuisee ? ' epuise' : '');
          pastille.style.backgroundColor = couleur.hex;
          pastille.title = couleur.nom + (epuisee ? ' — épuisé' : '');
          pastille.setAttribute('role', 'link');
          pastille.setAttribute('aria-label', pastille.title);

          // Survol : aperçu de la couleur. Clic : fiche ouverte sur cette couleur.
          pastille.addEventListener('mouseenter', function () {
            if (image && couleur.photoFace) image.src = CHEMIN_IMAGES_PRODUITS + couleur.photoFace;
          });
          pastille.addEventListener('mouseleave', function () {
            if (image) image.src = imageParDefaut;
          });
          pastille.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href =
              'produit?id=' + encodeURIComponent(produit.id) +
              '&couleur=' + encodeURIComponent(normaliserCouleur(couleur.nom));
          });

          pastilles.appendChild(pastille);
        });

        lien.appendChild(pastilles);
      }

      const messageStock = document.createElement('span');
      messageStock.className = 'stock-limite';

      if (stockTotal === 0) {
        lien.classList.add('produit-rupture');

        const badgeIndisponible = document.createElement('span');
        badgeIndisponible.className = 'badge-produit badge-rupture';
        badgeIndisponible.textContent = 'Indisponible';
        lien.appendChild(badgeIndisponible);
      } else if (stockTotal <= 5) {
        // Message clair : le détail par couleur et par taille est sur la fiche produit.
        messageStock.textContent = 'Stock limité';
        lien.appendChild(messageStock);
      }
    });

  } catch (erreur) {
    console.error(
      '[TRIÈDRE] Erreur de synchronisation boutique / Supabase :',
      erreur
    );
  }
});
