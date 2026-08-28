// ==========================================================================
// TRIÈDRE — Synchronisation des prix + promos/badges/stock depuis produits.json
// À charger sur toute page contenant des cartes .produit-card
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {

  const cartes = document.querySelectorAll('.produit-card a[href*="produit.html?id="]');
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
        const produit = donnees.produits.find(function (p) { return p.id === id; });
        if (!produit) return;

        const spanPrix = lien.querySelector('.prix');
        if (!spanPrix) return;

        const prixFormate = produit.prix.toFixed(2).replace('.', ',') + ' $';

        // ---- Prix barré + pourcentage si en promo ----
        if (produit.prixOriginal && produit.prixOriginal > produit.prix) {
          const pourcentage = Math.round(
            ((produit.prixOriginal - produit.prix) / produit.prixOriginal) * 100
          );
          const prixOriginalFormate = produit.prixOriginal.toFixed(2).replace('.', ',') + ' $';

          spanPrix.innerHTML =
            '<span class="prix-original">' + prixOriginalFormate + '</span>' +
            '<span class="prix-actuel">' + prixFormate + '</span>' +
            '<span class="badge-promo">-' + pourcentage + '%</span>';
        } else {
          spanPrix.textContent = prixFormate;
        }

        // ---- Badge texte libre (Nouveau, Solde, etc.) ----
        if (produit.badge) {
          const badge = document.createElement('span');
          badge.className = 'badge-produit';
          badge.textContent = produit.badge;
          lien.appendChild(badge);
        }

        // ---- Stock (élément toujours créé pour un alignement constant) ----
        const stockLimite = document.createElement('span');
        stockLimite.className = 'stock-limite';

        if (produit.stock !== undefined) {
          if (produit.stock === 0) {
            lien.classList.add('produit-rupture');
            const badgeRupture = document.createElement('span');
            badgeRupture.className = 'badge-produit badge-rupture';
            badgeRupture.textContent = 'Rupture de stock';
            lien.appendChild(badgeRupture);
          } else if (produit.stock <= 5) {
            stockLimite.textContent = 'Plus que ' + produit.stock + ' en stock';
          }
        }
        lien.appendChild(stockLimite);
      });
    })
    .catch(function (erreur) {
      console.error('Erreur de synchronisation des prix :', erreur);
    });

});
