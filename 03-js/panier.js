// ========================================================================== 
// TRIÈDRE — Gestion du panier (localStorage)
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

// ========================================================================== 
// Panneau premium — Produit ajouté au panier
// ========================================================================== 

function afficherAjoutPanierPremium(article) {
  const ancienPanneau = document.getElementById('triedre-ajout-panier');
  if (ancienPanneau) ancienPanneau.remove();

  const panneau = document.createElement('div');
  panneau.id = 'triedre-ajout-panier';
  panneau.className = 'triedre-ajout-panier';

  const prixTotal = (article.prix * article.quantite).toFixed(2);

  panneau.innerHTML =
    '<div class="triedre-ajout-panier-overlay"></div>' +
    '<aside class="triedre-ajout-panier-panneau" role="dialog" aria-modal="true" aria-labelledby="triedre-ajout-panier-titre">' +
      '<div class="triedre-ajout-panier-entete">' +
        '<div class="triedre-ajout-panier-validation">' +
          '<span class="triedre-ajout-panier-check" aria-hidden="true">✓</span>' +
          '<h2 id="triedre-ajout-panier-titre">Ajouté au panier</h2>' +
        '</div>' +
        '<button class="triedre-ajout-panier-fermer" type="button" aria-label="Fermer">×</button>' +
      '</div>' +
      '<div class="triedre-ajout-panier-produit">' +
        '<img class="triedre-ajout-panier-image" src="' + article.image + '" alt="' + article.nom + '">' +
        '<div class="triedre-ajout-panier-infos">' +
          '<h3>' + article.nom + '</h3>' +
          '<p>Couleur : ' + article.couleur + '</p>' +
          '<p>Taille : ' + article.taille + '</p>' +
          '<p>Quantité : ' + article.quantite + '</p>' +
          '<strong>' + prixTotal + ' $</strong>' +
        '</div>' +
      '</div>' +
      '<div class="triedre-ajout-panier-actions">' +
        '<a href="panier" class="btn triedre-ajout-panier-voir">Afficher le panier</a>' +
        '<a href="commande" class="btn btn-primary triedre-ajout-panier-paiement">Paiement</a>' +
      '</div>' +
    '</aside>';

  document.body.appendChild(panneau);
  document.body.classList.add('triedre-modal-ouverte');

  const boutonFermer = panneau.querySelector('.triedre-ajout-panier-fermer');
  const overlay = panneau.querySelector('.triedre-ajout-panier-overlay');

  function fermerPanneau() {
    document.body.classList.remove('triedre-modal-ouverte');
    document.removeEventListener('keydown', gererClavier);
    panneau.classList.remove('is-visible');

    setTimeout(function () {
      panneau.remove();
    }, 250);
  }

  function gererClavier(e) {
    if (e.key === 'Escape') fermerPanneau();
  }

  boutonFermer.addEventListener('click', fermerPanneau);
  overlay.addEventListener('click', fermerPanneau);
  document.addEventListener('keydown', gererClavier);

  requestAnimationFrame(function () {
    panneau.classList.add('is-visible');
    boutonFermer.focus();
  });
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

async function afficherPagePanier() {
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

  let verifications = null;

  try {
    const clientStock = await obtenirClientStockSupabase();
    verifications = await clientStock.verifierPanier(panier, true);
  } catch (erreur) {
    console.error('[TRIÈDRE] Vérification du stock du panier impossible :', erreur);
  }

  const etatsParSku = new Map();

  if (verifications) {
    verifications.forEach(function (verification) {
      etatsParSku.set(verification.item.sku, verification);
    });
  }

  let articlesHTML = '';
  let panierValide = Boolean(verifications);

  panier.forEach(function (item, index) {
    const sousTotal = (item.prix * item.quantite).toFixed(2);
    const etat = etatsParSku.get(item.sku);
    let messageStock = '';

    if (!etat) {
      panierValide = false;
      messageStock = 'Stock momentanément indisponible';
    } else if (etat.raison === 'indisponible') {
      panierValide = false;
      messageStock = 'Indisponible';
    } else if (etat.raison === 'quantite') {
      panierValide = false;
      messageStock = 'Plus que ' + etat.stock + ' en stock';
    } else if (etat.stock <= 5) {
      messageStock = 'Plus que ' + etat.stock + ' en stock';
    }

    articlesHTML +=
      '<div class="panier-article" data-index="' + index + '">' +
        '<img src="' + item.image + '" alt="' + item.nom + '">' +
        '<div class="panier-article-info">' +
          '<h3>' + item.nom + '</h3>' +
          '<p class="panier-article-details">Couleur : ' + item.couleur + ' — Taille : ' + item.taille + '</p>' +
          (messageStock
            ? '<p class="stock-message stock-limite-texte">' + messageStock + '</p>'
            : '') +
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
        '<div class="panier-articles">' + articlesHTML + '</div>' +
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
          '<button class="btn btn-primary btn-commander"' +
            (panierValide ? '' : ' disabled') +
          '>Passer à la commande</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  const boutonCommander = conteneur.querySelector('.btn-commander');

  if (boutonCommander) {
    boutonCommander.addEventListener('click', async function () {
      try {
        const clientStock = await obtenirClientStockSupabase();
        const controles = await clientStock.verifierPanier(getPanier(), true);
        const invalide = controles.find(function (controle) {
          return !controle.disponible;
        });

        if (invalide) {
          afficherToast(
            invalide.raison === 'indisponible'
              ? invalide.item.nom + ' est maintenant indisponible.'
              : 'La quantité de ' + invalide.item.nom +
                ' dépasse le stock disponible (' + invalide.stock + ').',
            'avertissement'
          );
          afficherPagePanier();
          return;
        }

        window.location.href = 'commande';
      } catch (erreur) {
        console.error('[TRIÈDRE] Vérification avant commande impossible :', erreur);
        afficherToast(
          'Le stock ne peut pas être vérifié pour le moment.',
          'avertissement'
        );
      }
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
      const article = panierActuel[index];

      obtenirClientStockSupabase()
        .then(function (clientStock) {
          return clientStock.obtenirVariante(article.sku, true);
        })
        .then(function (variante) {
          if (!variante || variante.active === false || variante.stock <= 0) {
            afficherToast('Cette variante est indisponible.', 'avertissement');
            afficherPagePanier();
            return;
          }

          if (article.quantite >= variante.stock) {
            afficherToast(
              'Plus que ' + variante.stock + ' en stock.',
              'avertissement'
            );
            return;
          }

          panierActuel[index].quantite += 1;
          sauvegarderPanier(panierActuel);
          afficherPagePanier();
        })
        .catch(function (erreur) {
          console.error('[TRIÈDRE] Vérification du stock impossible :', erreur);
          afficherToast(
            'Le stock ne peut pas être vérifié pour le moment.',
            'avertissement'
          );
        });
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
});
