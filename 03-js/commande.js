// ==========================================================================
// TRIÈDRE — Page de commande (checkout simulé)
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {

  const conteneur = document.getElementById('commande-contenu');
  if (!conteneur) return;

  afficherPageCommande();

  function afficherPageCommande() {
    const panier = getPanier();

    if (panier.length === 0) {
      conteneur.innerHTML =
        '<div class="panier-vide">' +
        '<p>Ton panier est vide — impossible de passer commande.</p>' +
        '<a href="boutique.html" class="btn btn-primary">Voir la boutique</a>' +
        '</div>';
      return;
    }

    let articlesHTML = '';
    panier.forEach(function (item) {
      const sousTotal = (item.prix * item.quantite).toFixed(2);
      articlesHTML +=
        '<div class="commande-article-resume">' +
          '<img src="' + item.image + '" alt="' + item.nom + '">' +
          '<div>' +
            '<h4>' + item.nom + '</h4>' +
            '<p>' + item.couleur + ' — ' + item.taille + ' — Qté ' + item.quantite + '</p>' +
          '</div>' +
          '<span class="commande-article-prix">' + sousTotal + ' $</span>' +
        '</div>';
    });

    const total = totalPanier().toFixed(2);

    conteneur.innerHTML =
      '<div class="commande-layout">' +

        '<form class="commande-formulaire" id="formulaire-commande">' +
          '<h2>Adresse de livraison</h2>' +
          '<div class="champ-groupe">' +
            '<label for="cmd-nom">Nom complet</label>' +
            '<input type="text" id="cmd-nom" required>' +
          '</div>' +
          '<div class="champ-groupe">' +
            '<label for="cmd-email">Courriel</label>' +
            '<input type="email" id="cmd-email" required>' +
          '</div>' +
          '<div class="champ-groupe">' +
            '<label for="cmd-adresse">Adresse</label>' +
            '<input type="text" id="cmd-adresse" required>' +
          '</div>' +
          '<div class="champ-ligne">' +
            '<div class="champ-groupe">' +
              '<label for="cmd-ville">Ville</label>' +
              '<input type="text" id="cmd-ville" required>' +
            '</div>' +
            '<div class="champ-groupe">' +
              '<label for="cmd-postal">Code postal</label>' +
              '<input type="text" id="cmd-postal" required>' +
            '</div>' +
          '</div>' +
          '<div class="champ-groupe">' +
            '<label for="cmd-province">Province</label>' +
            '<select id="cmd-province">' +
              '<option>Québec</option>' +
              '<option>Ontario</option>' +
              '<option>Colombie-Britannique</option>' +
              '<option>Alberta</option>' +
              '<option>Autre</option>' +
            '</select>' +
          '</div>' +
          '<div class="champ-groupe">' +
            '<label for="cmd-telephone">Téléphone</label>' +
            '<input type="tel" id="cmd-telephone" required>' +
          '</div>' +
          '<button type="submit" class="btn btn-primary btn-confirmer-commande">Confirmer la commande</button>' +
        '</form>' +

        '<div class="commande-resume">' +
          '<h2>Résumé</h2>' +
          '<div class="commande-articles-liste">' + articlesHTML + '</div>' +
          '<div class="panier-total"><span>Total</span><span class="accent">' + total + ' $</span></div>' +
        '</div>' +

      '</div>';

    const formulaire = document.getElementById('formulaire-commande');
    formulaire.addEventListener('submit', function (e) {
      e.preventDefault();
      afficherConfirmation();
    });
  }

  function afficherConfirmation() {
    const numeroCommande = 'TRD-' + Math.floor(100000 + Math.random() * 900000);

    conteneur.innerHTML =
      '<div class="commande-confirmation">' +
        '<p class="confirmation-icone">✓</p>' +
        '<h2>Merci pour ta commande !</h2>' +
        '<p>Ta commande <strong>#' + numeroCommande + '</strong> a bien été enregistrée.</p>' +
        '<p>Un courriel de confirmation te sera envoyé sous peu avec les détails de livraison.</p>' +
        '<a href="index.html" class="btn btn-primary">Retour à l\'accueil</a>' +
      '</div>';

    viderPanier();
  }

});
