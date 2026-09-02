// ==========================================================================
// TRIÈDRE — Synchronisation cartes boutique — Catalogue V1
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {

  const cartes =
    document.querySelectorAll('.produit-card a[href*="produit?id="]');

  if (cartes.length === 0) return;

  fetch('../04-data/produits.json')
    .then(function (reponse) {
      if (!reponse.ok) throw new Error('Impossible de charger produits.json');
      return reponse.json();
    })
    .then(function (donnees) {
      cartes.forEach(function (lien) {
        const url = new URL(lien.href);
        const id = url.searchParams.get('id');

        const produit = donnees.produits.find(function (p) {
          return p.id === id;
        });

        if (!produit || produit.actif === false) return;

        const variantes = (produit.variantes || []).filter(function (v) {
          return v.actif !== false;
        });

        if (variantes.length === 0) return;

        const reference = variantes.reduce(function (moinsCher, variante) {
          return variante.prix < moinsCher.prix ? variante : moinsCher;
        }, variantes[0]);

        const spanPrix = lien.querySelector('.prix');
        if (!spanPrix) return;

        const prixFormate =
          reference.prix.toFixed(2).replace('.', ',') + ' $';

        if (reference.prixOriginal &&
            reference.prixOriginal > reference.prix) {
          const pourcentage = Math.round(
            ((reference.prixOriginal - reference.prix) /
              reference.prixOriginal) * 100
          );

          const prixOriginalFormate =
            reference.prixOriginal.toFixed(2).replace('.', ',') + ' $';

          spanPrix.innerHTML =
            '<span class="prix-original">' + prixOriginalFormate + '</span>' +
            '<span class="prix-actuel">' + prixFormate + '</span>' +
            '<span class="badge-promo">-' + pourcentage + '%</span>';
        } else {
          spanPrix.textContent = prixFormate;
        }

        lien.querySelectorAll(
          '.badge-produit, .stock-limite'
        ).forEach(function (element) {
          element.remove();
        });

        if (produit.badge) {
          const badge = document.createElement('span');
          badge.className = 'badge-produit';
          badge.textContent = produit.badge;
          lien.appendChild(badge);
        }

        const stocksConnus = variantes.filter(function (v) {
          return typeof v.stock === 'number';
        });

        const stockLimite = document.createElement('span');
        stockLimite.className = 'stock-limite';

        if (stocksConnus.length === variantes.length) {
          const stockTotal = stocksConnus.reduce(function (total, v) {
            return total + v.stock;
          }, 0);

          if (stockTotal === 0) {
            lien.classList.add('produit-rupture');

            const badgeRupture = document.createElement('span');
            badgeRupture.className = 'badge-produit badge-rupture';
            badgeRupture.textContent = 'Rupture de stock';
            lien.appendChild(badgeRupture);
          } else if (stockTotal <= 5) {
            stockLimite.textContent =
              'Plus que ' + stockTotal + ' en stock';
          }
        }

        lien.appendChild(stockLimite);
      });
    })
    .catch(function (erreur) {
      console.error('Erreur de synchronisation des prix :', erreur);
    });
});
