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


// --------------------------------------------------------------------------
// Stockage local du panier
// --------------------------------------------------------------------------

const CLE_PANIER = 'triedre_panier';
const CLE_PANIER_COMPTE = 'triedre_panier_compte'; // id du membre propriétaire du panier local
const CLE_PANIER_MAJ = 'triedre_panier_maj';       // date de dernière modification locale

function getPanier() {
  try {
    const donnees = localStorage.getItem(CLE_PANIER);
    const panier = donnees ? JSON.parse(donnees) : [];
    return Array.isArray(panier) ? panier : [];
  } catch (erreur) {
    return [];
  }
}

function sauvegarderPanier(panier, options) {
  const parametres = options || {};
  localStorage.setItem(CLE_PANIER, JSON.stringify(panier));
  localStorage.setItem(CLE_PANIER_MAJ, parametres.dateMaj || new Date().toISOString());
  mettreAJourCompteur();

  // Membre connecté : chaque modification est aussi enregistrée dans son compte.
  if (!parametres.sansSynchronisation) planifierEnvoiPanierCompte();
}

// --------------------------------------------------------------------------
// Panier lié au compte membre (Supabase — table member_carts)
// --------------------------------------------------------------------------

let minuterieEnvoiPanier = null;
let synchronisationEnCours = null;

function clientPanierSupabase() {
  return window.triedreSupabase || null;
}

function cleArticle(item) {
  return item.sku || [item.id, item.couleur, item.taille].join('|');
}

// Fusion panier du compte + panier invité : quantités additionnées pour un même article.
function fusionnerPaniers(panierCompte, panierLocal) {
  const resultat = panierCompte.map(function (item) { return Object.assign({}, item); });

  panierLocal.forEach(function (item) {
    const existant = resultat.find(function (r) { return cleArticle(r) === cleArticle(item); });
    if (existant) existant.quantite = (Number(existant.quantite) || 0) + (Number(item.quantite) || 0);
    else resultat.push(Object.assign({}, item));
  });

  return resultat;
}

function viderPanierLocal() {
  clearTimeout(minuterieEnvoiPanier);
  localStorage.removeItem(CLE_PANIER);
  localStorage.removeItem(CLE_PANIER_COMPTE);
  localStorage.removeItem(CLE_PANIER_MAJ);
  mettreAJourCompteur();
  if (document.getElementById('panier-contenu')) afficherPagePanier();
}

async function envoyerPanierCompte() {
  const client = clientPanierSupabase();
  const proprietaire = localStorage.getItem(CLE_PANIER_COMPTE);
  if (!client || !proprietaire) return;

  const { error } = await client
    .from('member_carts')
    .upsert({
      user_id: proprietaire,
      items: getPanier(),
      updated_at: localStorage.getItem(CLE_PANIER_MAJ) || new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) console.error('[TRIÈDRE] Sauvegarde du panier dans le compte :', error);
}

function planifierEnvoiPanierCompte() {
  if (!clientPanierSupabase() || !localStorage.getItem(CLE_PANIER_COMPTE)) return;
  clearTimeout(minuterieEnvoiPanier);
  minuterieEnvoiPanier = setTimeout(envoyerPanierCompte, 400);
}

// Appelée à la connexion (et à chaque chargement de page avec une session active).
async function synchroniserPanierCompte(userId) {
  const client = clientPanierSupabase();
  if (!client || !userId) return;
  if (synchronisationEnCours) return synchronisationEnCours;

  synchronisationEnCours = (async function () {
    const { data, error } = await client
      .from('member_carts')
      .select('items, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[TRIÈDRE] Lecture du panier du compte :', error);
      return;
    }

    const panierCompte = data && Array.isArray(data.items) ? data.items : [];
    const majCompte = data ? Date.parse(data.updated_at) || 0 : 0;
    const proprietaire = localStorage.getItem(CLE_PANIER_COMPTE);
    const panierLocal = getPanier();
    const majLocale = Date.parse(localStorage.getItem(CLE_PANIER_MAJ)) || 0;

    let resultat;
    let envoyer = true;

    if (proprietaire === userId) {
      // Même membre : on garde la version la plus récente (appareil ou compte).
      if (majLocale >= majCompte) {
        resultat = panierLocal;
      } else {
        resultat = panierCompte;
        envoyer = false;
      }
    } else if (proprietaire && proprietaire !== userId) {
      // Panier resté d'un autre compte : jamais partagé avec ce membre.
      resultat = panierCompte;
      envoyer = false;
    } else {
      // Panier invité : fusionné avec celui du compte.
      resultat = fusionnerPaniers(panierCompte, panierLocal);
      envoyer = panierLocal.length > 0;
      if (panierCompte.length > 0 && typeof afficherToast === 'function') {
        afficherToast('Ton panier a été retrouvé.', 'info');
      }
    }

    localStorage.setItem(CLE_PANIER_COMPTE, userId);
    sauvegarderPanier(resultat, {
      sansSynchronisation: true,
      dateMaj: envoyer ? new Date().toISOString() : (data ? data.updated_at : undefined)
    });

    if (envoyer) await envoyerPanierCompte();
    if (document.getElementById('panier-contenu')) afficherPagePanier();
  })();

  try {
    await synchronisationEnCours;
  } finally {
    synchronisationEnCours = null;
  }
}

// À appeler AVANT supabase.auth.signOut() : enregistre le panier dans le compte, puis vide l'appareil.
async function preparerDeconnexionPanier() {
  clearTimeout(minuterieEnvoiPanier);
  try {
    await envoyerPanierCompte();
  } catch (erreur) {
    console.error('[TRIÈDRE] Sauvegarde du panier avant déconnexion :', erreur);
  }
  viderPanierLocal();
}

window.triedrePanierCompte = {
  synchroniser: synchroniserPanierCompte,
  avantDeconnexion: preparerDeconnexionPanier,
  viderLocal: viderPanierLocal
};

async function initialiserPanierCompte() {
  const client = clientPanierSupabase();
  if (!client) return; // Page sans Supabase : le panier local suffit, il sera synchronisé plus tard.

  try {
    const { data } = await client.auth.getSession();
    const session = data && data.session;

    if (session && session.user) {
      await synchroniserPanierCompte(session.user.id);
    } else if (localStorage.getItem(CLE_PANIER_COMPTE)) {
      // Session terminée ailleurs : le panier du membre ne reste pas sur l'appareil.
      viderPanierLocal();
    }

    client.auth.onAuthStateChange(function (evenement, sessionActive) {
      if (evenement === 'SIGNED_IN' && sessionActive && sessionActive.user) {
        setTimeout(function () { synchroniserPanierCompte(sessionActive.user.id); }, 0);
      }
      if (evenement === 'SIGNED_OUT' && localStorage.getItem(CLE_PANIER_COMPTE)) {
        viderPanierLocal();
      }
    });
  } catch (erreur) {
    console.error('[TRIÈDRE] Synchronisation du panier :', erreur);
  }
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
        '<a href="commande" class="btn btn-primary triedre-ajout-panier-paiement">Terminer ma commande</a>' +
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

// Même seuil que le serveur (08-php/livraison-lib.php).
const SEUIL_LIVRAISON_GRATUITE = 100;

function barreLivraisonGratuitePanier(sousTotal) {
  const montant = function (valeur) { return valeur.toFixed(2).replace('.', ',') + ' $'; };
  const iconeCamion = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5h11v9H3z" /><path d="M14 9.5h3.6l3.4 3.4v2.6h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg>';
  const iconeCoche = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>';

  if (sousTotal >= SEUIL_LIVRAISON_GRATUITE) {
    return '<div class="tr-livgratuite is-atteint" role="status">' +
        '<span class="tr-livgratuite-icone">' + iconeCoche + '</span>' +
        '<div class="tr-livgratuite-corps">' +
          '<p class="tr-livgratuite-message">La livraison standard t’est offerte.</p>' +
          '<div class="tr-livgratuite-piste"><span class="tr-livgratuite-remplissage" style="--progression:100%"></span></div>' +
        '</div>' +
      '</div>';
  }

  const progression = Math.max(4, Math.min(100, Math.round((sousTotal / SEUIL_LIVRAISON_GRATUITE) * 100)));
  return '<div class="tr-livgratuite">' +
      '<span class="tr-livgratuite-icone">' + iconeCamion + '</span>' +
      '<div class="tr-livgratuite-corps">' +
        '<p class="tr-livgratuite-message">Plus que <strong>' + montant(SEUIL_LIVRAISON_GRATUITE - sousTotal) + '</strong> pour profiter de la livraison standard gratuite.</p>' +
        '<div class="tr-livgratuite-piste" role="progressbar" aria-label="Progression vers la livraison gratuite" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + progression + '">' +
          '<span class="tr-livgratuite-remplissage" style="--progression:' + progression + '%"></span>' +
        '</div>' +
        '<div class="tr-livgratuite-pied"><span>' + montant(sousTotal) + '</span><span>' + montant(SEUIL_LIVRAISON_GRATUITE) + '</span></div>' +
      '</div>' +
    '</div>';
}

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
          '<div class="panier-ligne-resume"><span>Livraison</span><span>' +
            (totalPanier() >= SEUIL_LIVRAISON_GRATUITE ? 'Gratuite' : 'Calculée à l\'étape suivante') +
          '</span></div>' +
          barreLivraisonGratuitePanier(totalPanier()) +
          '<div class="panier-total"><span>Total</span><span class="accent">' + total + ' $</span></div>' +
          '<button class="btn btn-primary btn-commander"' +
            (panierValide ? '' : ' disabled') +
          '>Terminer ma commande</button>' +
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
  initialiserPanierCompte();

  const copyrightElement = document.querySelector('.footer-copyright');

  if (copyrightElement) {
    copyrightElement.textContent =
      copyrightElement.textContent.replace(/\d{4}/, new Date().getFullYear());
  }
});
