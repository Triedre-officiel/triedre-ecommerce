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
  if (existant) {
    existant.quantite += article.quantite;
  } else {
    panier.push(article);
  }
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
  const panier = getPanier();
  return panier.reduce(function (total, item) {
    return total + item.quantite;
  }, 0);
}

function totalPanier() {
  const panier = getPanier();
  return panier.reduce(function (total, item) {
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

// ---- Notification discrète (toast), utilisable sur toutes les pages ----
function afficherToast(message) {
  let conteneurToast = document.getElementById('toast-conteneur');
  if (!conteneurToast) {
    conteneurToast = document.createElement('div');
    conteneurToast.id = 'toast-conteneur';
    document.body.appendChild(conteneurToast);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  conteneurToast.appendChild(toast);

  requestAnimationFrame(function () {
    toast.classList.add('toast-visible');
  });

  setTimeout(function () {
    toast.classList.remove('toast-visible');
    setTimeout(function () {
      toast.remove();
    }, 300);
  }, 3000);
}

// ---- Affichage complet de la page panier ----
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
    '<div class="panier-header-actions">' +
      '<button class="btn-vider-panier">Vider le panier</button>' +
    '</div>' +
    '<div class="panier-layout">' +
      '<div class="panier-articles">' + articlesHTML + '</div>' +
      '<div class="panier-resume">' +
        '<h2>Résumé</h2>' +
        '<div class="panier-ligne-resume"><span>Sous-total</span><span>' + total + ' $</span></div>' +
        '<div class="panier-ligne-resume"><span>Livraison</span><span>Calculée à l\'étape suivante</span></div>' +
        '<div class="panier-total"><span>Total</span><span class="accent">' + total + ' $</span></div>' +
        '<button class="btn btn-primary btn-commander">Passer à la commande</button>' +
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
      const confirmation = confirm('Es-tu sûr de vouloir vider ton panier ? Cette action est irréversible.');
      if (confirmation) {
        viderPanier();
        afficherPagePanier();
      }
    });
  }
}

// ---- Interactions du panier (délégation d'événements, attachée une seule fois) ----
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
      supprimerDuPanier(index);
      afficherPagePanier();
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {

  mettreAJourCompteur();
  afficherPagePanier();
  initialiserInteractionsPanier();

  // ---- Année automatique du copyright ----
  const copyrightElement = document.querySelector('.footer-copyright');
  if (copyrightElement) {
    copyrightElement.textContent = copyrightElement.textContent.replace(/\d{4}/, new Date().getFullYear());
  }

  const onglets = document.querySelectorAll('.onglet-btn');
  if (onglets.length > 0) {
    onglets.forEach(function (onglet) {
      onglet.addEventListener('click', function () {
        onglets.forEach(function (o) { o.classList.remove('active'); });
        onglet.classList.add('active');
        const cible = onglet.getAttribute('data-cible');
        document.querySelectorAll('[data-formulaire]').forEach(function (formulaire) {
          formulaire.style.display = formulaire.id === cible ? 'flex' : 'none';
        });
      });
    });
  }

  document.querySelectorAll('[data-formulaire]').forEach(function (formulaire) {
    formulaire.addEventListener('submit', function (e) {
      e.preventDefault();
      alert('Formulaire envoyé ! (connexion à un vrai serveur à venir)');
      formulaire.reset();
    });
  });

});
