// ==========================================================================
// TRIÈDRE — Gestion du panier (localStorage)
// ==========================================================================

function getPanier() {
  const donnees = localStorage.getItem('triedre_panier');
  return donnees ? JSON.parse(donnees) : [];
}

function sauvegarderPanier(panier) {
  localStorage.setItem('triedre_panier', JSON.stringify(panier));
  mettreAJourCompteur();
}

function ajouterAuPanier(article) {
  const panier = getPanier();
  const existant = panier.find(function (item) {
    return item.id === article.id &&
           item.couleur === article.couleur &&
           item.taille === article.taille;
  });

  if (existant) existant.quantite += article.quantite;
  else panier.push(article);

  sauvegarderPanier(panier);
}

function supprimerDuPanier(index) {
  const panier = getPanier();
  panier.splice(index, 1);
  sauvegarderPanier(panier);
}

function viderPanier() {
  sauvegarderPanier([]);
}

function nombreArticlesPanier() {
  return getPanier().reduce(function (total, item) {
    return total + item.quantite;
  }, 0);
}

function totalPanier() {
  return getPanier().reduce(function (total, item) {
    return total + (item.prix * item.quantite);
  }, 0);
}

function mettreAJourCompteur() {
  const badges = document.querySelectorAll('.cart-count');
  const total = nombreArticlesPanier();

  badges.forEach(function (badge) {
    badge.textContent = total;
  });
}

// ==========================================================================
// Notifications premium
// ==========================================================================

function afficherToast(message, type) {
  const typeToast = type || 'succes';
  let conteneurToast = document.getElementById('toast-conteneur');

  if (!conteneurToast) {
    conteneurToast = document.createElement('div');
    conteneurToast.id = 'toast-conteneur';
    conteneurToast.setAttribute('aria-live', 'polite');
    conteneurToast.setAttribute('aria-atomic', 'true');
    document.body.appendChild(conteneurToast);
  }

  const icones = {
    succes: '✓',
    avertissement: '!',
    erreur: '×',
    info: 'i'
  };

  const toast = document.createElement('div');
  toast.className = 'toast toast-' + typeToast;

  const icone = document.createElement('span');
  icone.className = 'toast-icone';
  icone.textContent = icones[typeToast] || 'i';

  const texte = document.createElement('p');
  texte.className = 'toast-message';
  texte.textContent = message;

  const fermer = document.createElement('button');
  fermer.className = 'toast-fermer';
  fermer.type = 'button';
  fermer.setAttribute('aria-label', 'Fermer la notification');
  fermer.textContent = '×';

  toast.appendChild(icone);
  toast.appendChild(texte);
  toast.appendChild(fermer);
  conteneurToast.appendChild(toast);

  function retirerToast() {
    toast.classList.remove('toast-visible');

    setTimeout(function () {
      toast.remove();
      if (conteneurToast.children.length === 0) {
        conteneurToast.remove();
      }
    }, 250);
  }

  fermer.addEventListener('click', retirerToast);

  requestAnimationFrame(function () {
    toast.classList.add('toast-visible');
  });

  setTimeout(retirerToast, 3800);
}

function demanderConfirmation(options) {
  const parametres = options || {};

  return new Promise(function (resolve) {
    const ancienModal = document.getElementById('triedre-confirmation');
    if (ancienModal) ancienModal.remove();

    const modal = document.createElement('div');
    modal.id = 'triedre-confirmation';
    modal.className = 'triedre-confirmation-modal';

    modal.innerHTML =
      '<div class="triedre-confirmation-overlay"></div>' +
      '<section class="triedre-confirmation-contenu" role="dialog" aria-modal="true" aria-labelledby="triedre-confirmation-titre">' +
        '<button class="triedre-confirmation-fermer" type="button" aria-label="Fermer">×</button>' +
        '<div class="triedre-confirmation-icone" aria-hidden="true">!</div>' +
        '<h2 id="triedre-confirmation-titre">' + (parametres.titre || 'Confirmation') + '</h2>' +
        '<p>' + (parametres.message || 'Souhaites-tu continuer ?') + '</p>' +
        '<div class="triedre-confirmation-actions">' +
          '<button class="btn triedre-confirmation-annuler" type="button">' +
            (parametres.annuler || 'Annuler') +
          '</button>' +
          '<button class="btn btn-primary triedre-confirmation-confirmer" type="button">' +
            (parametres.confirmer || 'Confirmer') +
          '</button>' +
        '</div>' +
      '</section>';

    document.body.appendChild(modal);
    document.body.classList.add('triedre-modal-ouverte');

    const boutonConfirmer = modal.querySelector('.triedre-confirmation-confirmer');
    const boutonAnnuler = modal.querySelector('.triedre-confirmation-annuler');
    const boutonFermer = modal.querySelector('.triedre-confirmation-fermer');
    const overlay = modal.querySelector('.triedre-confirmation-overlay');

    function fermer(resultat) {
      document.body.classList.remove('triedre-modal-ouverte');
      document.removeEventListener('keydown', gererClavier);
      modal.classList.remove('is-visible');

      setTimeout(function () {
        modal.remove();
        resolve(resultat);
      }, 200);
    }

    function gererClavier(e) {
      if (e.key === 'Escape') fermer(false);
    }

    boutonConfirmer.addEventListener('click', function () { fermer(true); });
    boutonAnnuler.addEventListener('click', function () { fermer(false); });
    boutonFermer.addEventListener('click', function () { fermer(false); });
    overlay.addEventListener('click', function () { fermer(false); });
    document.addEventListener('keydown', gererClavier);

    requestAnimationFrame(function () {
      modal.classList.add('is-visible');
      boutonAnnuler.focus();
    });
  });
}

// ==========================================================================
// Affichage du panier
// ==========================================================================

function afficherPagePanier() {
  const conteneur = document.getElementById('panier-contenu');
  if (!conteneur) return;

  const panier = getPanier();

  if (panier.length === 0) {
    conteneur.innerHTML =
      '<div class="panier-vide">' +
        '<p>Ton panier est vide pour l\'instant.</p>' +
        '<a href="boutique" class="btn btn-primary">Voir la boutique</a>' +
      '</div>';
    return;
  }

  let articlesHTML = '';

  panier.forEach(function (item, index) {
    const sousTotal = (item.prix * item.quantite).toFixed(2);

    articlesHTML +=
      '<div class="panier-article" data-index="' + index + '">' +
        '<img src="' + item.image + '" alt="' + item.nom + '">' +
        '<div class="panier-article-info">' +
          '<h3>' + item.nom + '</h3>' +
          '<p class="panier-article-details">Couleur : ' + item.couleur + ' — Taille : ' + item.taille + '</p>' +
          '<p class="panier-article-prix">' + sousTotal + ' $</p>' +
        '</div>' +
        '<div class="panier-article-actions">' +
          '<div class="panier-quantite">' +
            '<button class="panier-moins" aria-label="Diminuer">−</button>' +
            '<span>' + item.quantite + '</span>' +
            '<button class="panier-plus" aria-label="Augmenter">+</button>' +
          '</div>' +
          '<button class="panier-supprimer">Retirer</button>' +
        '</div>' +
      '</div>';
  });

  const total = totalPanier().toFixed(2);

  conteneur.innerHTML =
    '<div class="panier-layout">' +

      '<div class="panier-articles-colonne">' +
        '<div class="panier-colonne-action panier-colonne-action-gauche">' +
          '<a href="boutique" class="panier-continuer-achats">Continuer mes achats</a>' +
        '</div>' +
        '<div class="panier-articles">' +
          articlesHTML +
        '</div>' +
      '</div>' +

      '<div class="panier-resume-colonne">' +
        '<div class="panier-colonne-action panier-colonne-action-droite">' +
          '<button class="btn-vider-panier" type="button">Vider le panier</button>' +
        '</div>' +
        '<div class="panier-resume">' +
          '<h2>Résumé</h2>' +
          '<div class="panier-ligne-resume"><span>Sous-total</span><span>' + total + ' $</span></div>' +
          '<div class="panier-ligne-resume"><span>Livraison</span><span>Calculée à l\'étape suivante</span></div>' +
          '<div class="panier-total"><span>Total</span><span class="accent">' + total + ' $</span></div>' +
          '<button class="btn btn-primary btn-commander">Passer à la commande</button>' +
        '</div>' +
      '</div>' +

    '</div>';

  const boutonCommander = conteneur.querySelector('.btn-commander');

  if (boutonCommander) {
    boutonCommander.addEventListener('click', function () {
      window.location.href = 'commande';
    });
  }

  const boutonVider = conteneur.querySelector('.btn-vider-panier');

  if (boutonVider) {
    boutonVider.addEventListener('click', function () {
      demanderConfirmation({
        titre: 'Vider le panier ?',
        message: 'Tous les articles seront retirés de ton panier. Cette action est irréversible.',
        confirmer: 'Vider le panier',
        annuler: 'Annuler'
      }).then(function (confirmation) {
        if (!confirmation) return;

        viderPanier();
        afficherPagePanier();
        afficherToast('Ton panier a été vidé.', 'succes');
      });
    });
  }
}

// ==========================================================================
// Interactions du panier
// ==========================================================================

function initialiserInteractionsPanier() {
  const conteneur = document.getElementById('panier-contenu');
  if (!conteneur) return;

  conteneur.addEventListener('click', function (e) {
    const ligne = e.target.closest('.panier-article');
    if (!ligne) return;

    const index = parseInt(ligne.getAttribute('data-index'), 10);
    const panierActuel = getPanier();

    if (e.target.classList.contains('panier-plus')) {
      panierActuel[index].quantite += 1;
      sauvegarderPanier(panierActuel);
      afficherPagePanier();
    }

    if (e.target.classList.contains('panier-moins')) {
      if (panierActuel[index].quantite > 1) {
        panierActuel[index].quantite -= 1;
        sauvegarderPanier(panierActuel);
        afficherPagePanier();
      }
    }

    if (e.target.classList.contains('panier-supprimer')) {
      const article = panierActuel[index];

      demanderConfirmation({
        titre: 'Retirer ce produit ?',
        message: 'Es-tu sûr de vouloir retirer « ' + article.nom + ' » de ton panier ?',
        confirmer: 'Retirer',
        annuler: 'Annuler'
      }).then(function (confirmation) {
        if (!confirmation) return;

        supprimerDuPanier(index);
        afficherPagePanier();
        afficherToast(article.nom + ' retiré du panier.', 'info');
      });
    }
  });
}

// ==========================================================================
// Initialisation
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {
  mettreAJourCompteur();
  afficherPagePanier();
  initialiserInteractionsPanier();

  const copyrightElement = document.querySelector('.footer-copyright');

  if (copyrightElement) {
    copyrightElement.textContent =
      copyrightElement.textContent.replace(/\d{4}/, new Date().getFullYear());
  }

  const onglets = document.querySelectorAll('.onglet-btn');

  if (onglets.length > 0) {
    onglets.forEach(function (onglet) {
      onglet.addEventListener('click', function () {
        onglets.forEach(function (o) {
          o.classList.remove('active');
        });

        onglet.classList.add('active');

        const cible = onglet.getAttribute('data-cible');

        document.querySelectorAll('[data-formulaire]').forEach(function (formulaire) {
          formulaire.style.display =
            formulaire.id === cible ? 'flex' : 'none';
        });
      });
    });
  }

  document.querySelectorAll('[data-formulaire]').forEach(function (formulaire) {
    formulaire.addEventListener('submit', function (e) {
      e.preventDefault();
      afficherToast('Fonctionnalité bientôt disponible.', 'info');
      formulaire.reset();
    });
  });
});
