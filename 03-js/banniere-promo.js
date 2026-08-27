// ==========================================================================
// TRIÈDRE — Bandeau promo automatique
// Vérifie si au moins un produit est en solde et adapte le message du haut
// À charger sur TOUTES les pages (comme panier.js)
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {

  const banniere = document.querySelector('.top-banner p');
  if (!banniere) return;

  fetch('../04-data/produits.json')
    .then(function (reponse) {
      if (!reponse.ok) throw new Error('Impossible de charger produits.json');
      return reponse.json();
    })
    .then(function (donnees) {
      const produitsEnSolde = donnees.produits.filter(function (p) {
        return p.prixOriginal && p.prixOriginal > p.prix;
      });

      if (produitsEnSolde.length === 0) return; // garde le message par défaut

      // ---- Trouve le meilleur pourcentage pour un message percutant ----
      let meilleurPourcentage = 0;
      produitsEnSolde.forEach(function (p) {
        const pourcentage = Math.round(((p.prixOriginal - p.prix) / p.prixOriginal) * 100);
        if (pourcentage > meilleurPourcentage) meilleurPourcentage = pourcentage;
      });

      const messageOriginal = banniere.textContent;
      banniere.textContent = 'Soldes — Jusqu\'à -' + meilleurPourcentage + '% sur une sélection d\'articles' + ' • ' + messageOriginal ;
    })
    .catch(function (erreur) {
      console.error('Erreur de vérification des promos :', erreur);
    });

});
