// ==========================================================================
// TRIÈDRE — Bandeau promo automatique + compte à rebours optionnel
// À charger sur TOUTES les pages (comme panier.js)
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {

  const banniere = document.querySelector('.top-banner p');
  if (!banniere) return;

  const messageOriginal = banniere.textContent;

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

      let meilleurPourcentage = 0;
      produitsEnSolde.forEach(function (p) {
        const pourcentage = Math.round(((p.prixOriginal - p.prix) / p.prixOriginal) * 100);
        if (pourcentage > meilleurPourcentage) meilleurPourcentage = pourcentage;
      });

      const messagePromo = 'Soldes — Jusqu\'à -' + meilleurPourcentage + ' % sur une sélection d\'articles';

      // ---- Compte à rebours optionnel (si "promoFin" est défini dans produits.json) ----
      if (donnees.promoFin) {
        const dateFin = new Date(donnees.promoFin);

        function mettreAJourCompteAJours() {
          const maintenant = new Date();
          const difference = dateFin - maintenant;

          if (difference <= 0) {
            banniere.textContent = messagePromo + '     •     ' + messageOriginal;
            return;
          }

          const jours = Math.floor(difference / (1000 * 60 * 60 * 24));
          const heures = Math.floor((difference / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((difference / (1000 * 60)) % 60);

          let texteCompteARebours = 'Se termine dans ';
          if (jours > 0) texteCompteARebours += jours + 'j ';
          texteCompteARebours += heures + 'h ' + minutes + 'min';

          banniere.textContent =
            messagePromo + ' — ' + texteCompteARebours + '     •     ' + messageOriginal;
        }

        mettreAJourCompteAJours();
        setInterval(mettreAJourCompteAJours, 60000); // rafraîchit chaque minute
      } else {
        banniere.textContent = messagePromo + '     •     ' + messageOriginal;
      }
    })
    .catch(function (erreur) {
      console.error('Erreur de vérification des promos :', erreur);
    });

});
