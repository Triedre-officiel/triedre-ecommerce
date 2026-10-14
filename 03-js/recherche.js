// ==========================================================================
// TRIÈDRE — Barre de recherche — Catalogue V1 + stock Supabase
// ==========================================================================

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

document.addEventListener('DOMContentLoaded', function () {

  const boutonRecherche =
    document.querySelector('.header-icons button[aria-label="Rechercher"]');

  if (!boutonRecherche) return;

  let produitsCharges = null;
  let stocksParSku = null;
  let chargementProduits = null;
  let panneauOuvert = false;

  const panneau = document.createElement('div');
  panneau.className = 'recherche-panneau';
  panneau.innerHTML =
    '<label class="sr-only" for="recherche-produit">Rechercher un produit</label>' +
    '<input type="search" id="recherche-produit" name="recherche-produit" class="recherche-input" placeholder="Rechercher un produit..." autocomplete="off">' +
    '<ul class="recherche-resultats" aria-live="polite"></ul>';

  boutonRecherche.parentElement.style.position = 'relative';
  boutonRecherche.parentElement.appendChild(panneau);

  const champRecherche = panneau.querySelector('.recherche-input');
  const listeResultats = panneau.querySelector('.recherche-resultats');

  boutonRecherche.addEventListener('click', function (e) {
    e.stopPropagation();

    panneauOuvert = !panneauOuvert;
    panneau.classList.toggle('actif', panneauOuvert);

    if (panneauOuvert) {
      champRecherche.focus();
      chargerProduitsSiNecessaire();
    }
  });

  document.addEventListener('click', function (e) {
    if (!panneau.contains(e.target) && e.target !== boutonRecherche) {
      panneau.classList.remove('actif');
      panneauOuvert = false;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      panneau.classList.remove('actif');
      panneauOuvert = false;
    }
  });

  function chargerProduitsSiNecessaire() {
    if (chargementProduits) return chargementProduits;

    chargementProduits = Promise.all([
      fetch('../04-data/produits.json').then(function (reponse) {
        if (!reponse.ok) {
          throw new Error('Impossible de charger produits.json');
        }
        return reponse.json();
      }),
      obtenirClientStockSupabase().then(function (client) {
        return client.indexParSku(true);
      })
    ])
      .then(function (resultats) {
        produitsCharges = resultats[0].produits || [];
        stocksParSku = resultats[1];
        return produitsCharges;
      })
      .catch(function (erreur) {
        console.error('[TRIÈDRE] Recherche indisponible :', erreur);
        listeResultats.innerHTML =
          '<li>Recherche indisponible pour le moment.</li>';
        throw erreur;
      });

    return chargementProduits;
  }

  function variantesActivesAvecStock(produit) {
    return (produit.variantes || [])
      .filter(function (variante) {
        return variante.actif !== false;
      })
      .map(function (variante) {
        const distante = stocksParSku ? stocksParSku.get(variante.sku) : null;

        return Object.assign({}, variante, {
          stock: distante ? distante.stock : 0,
          actif: distante ? distante.active !== false : false
        });
      })
      .filter(function (variante) {
        return variante.actif !== false;
      });
  }

  function varianteDeReference(produit) {
    const variantes = variantesActivesAvecStock(produit);

    if (variantes.length === 0) return null;

    return variantes.reduce(function (moinsChere, variante) {
      return variante.prix < moinsChere.prix ? variante : moinsChere;
    }, variantes[0]);
  }

  function etatStockProduit(produit) {
    const variantes = variantesActivesAvecStock(produit);

    if (variantes.length === 0) {
      return { total: 0, texte: 'Indisponible' };
    }

    const total = variantes.reduce(function (somme, variante) {
      return somme + variante.stock;
    }, 0);

    if (total === 0) {
      return { total: 0, texte: 'Indisponible' };
    }

    if (total <= 5) {
      return {
        total: total,
        texte: 'Plus que ' + total + ' en stock'
      };
    }

    return { total: total, texte: '' };
  }

  champRecherche.addEventListener('input', async function () {
    const requete = champRecherche.value.trim().toLowerCase();
    listeResultats.innerHTML = '';

    if (requete === '') return;

    if (!produitsCharges || !stocksParSku) {
      try {
        await chargerProduitsSiNecessaire();
      } catch (erreur) {
        return;
      }
    }

    const resultats = produitsCharges.filter(function (produit) {
      return produit.actif !== false &&
        produit.nom.toLowerCase().includes(requete);
    });

    if (resultats.length === 0) {
      const li = document.createElement('li');
      li.textContent =
        'Aucun résultat pour "' + champRecherche.value + '"';
      listeResultats.appendChild(li);
      return;
    }

    resultats.forEach(function (produit) {
      const reference = varianteDeReference(produit);
      if (!reference) return;

      const etat = etatStockProduit(produit);
      const li = document.createElement('li');
      const lien = document.createElement('a');

      lien.href = 'produit?id=' + encodeURIComponent(produit.id);

      let texte =
        produit.nom + '. ' +
        reference.prix.toFixed(2).replace('.', ',') + ' $';

      if (etat.texte) {
        texte += ' — ' + etat.texte;
      }

      lien.textContent = texte;

      li.appendChild(lien);
      listeResultats.appendChild(li);
    });
  });

});
