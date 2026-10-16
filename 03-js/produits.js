// ==========================================================================
// TRIÈDRE — Fiche produit — Catalogue V1 + stock Supabase
// ==========================================================================

document.addEventListener('DOMContentLoaded', async function () {

  const conteneurProduit = document.getElementById('produit-nom');
  if (!conteneurProduit) return;

  const parametres = new URLSearchParams(window.location.search);
  const idProduit = parametres.get('id');

  let vueActuelle = 0;
  const cheminImages = '../05-images/produits/';
  let listeVues = [];
  let produitActuel = null;
  let stockSupabaseCharge = false;

  // Sélection en cours (déclarées ici, avant le premier affichage du produit).
  let couleurActive = '';
  let tailleActive = '';

  // Au-delà de ce seuil, une taille n'est plus signalée « stock limité ».
  const SEUIL_STOCK_FAIBLE = 5;

  const guideTaillesBouton = document.getElementById('guide-tailles-bouton');
  const guideTaillesModal = document.getElementById('guide-tailles-modal');
  const guideTaillesProduit = document.getElementById('guide-tailles-produit');
  const guideTaillesCorps = document.getElementById('guide-tailles-corps');
  const boutonsFermerGuide =
    document.querySelectorAll('[data-fermer-guide-tailles]');

  const boutonFavori = document.querySelector('.btn-favori');
  const favorisModal = document.getElementById('favoris-modal');
  const boutonsFermerFavoris =
    document.querySelectorAll('[data-fermer-favoris]');

  try {
    const reponse = await fetch('../04-data/produits.json');

    if (!reponse.ok) {
      throw new Error('Impossible de charger produits.json');
    }

    const donnees = await reponse.json();

    const produit = donnees.produits.find(function (p) {
      return p.id === idProduit;
    });

    if (!produit) {
      document.getElementById('produit-nom').textContent =
        'Produit introuvable';
      document.getElementById('produit-description').textContent =
        'Ce produit n\'existe pas ou n\'est plus disponible.';
      return;
    }

    produitActuel = produit;

    await chargerStockSupabase(produitActuel);

    afficherProduit(produitActuel);
    mettreAJourVisibiliteGuideTailles();
    afficherProduitsSimilaires(donnees.produits, produitActuel);
    afficherAvis(produitActuel);

  } catch (erreur) {
    console.error(erreur);
    document.getElementById('produit-nom').textContent =
      'Erreur de chargement';
  }

  async function chargerStockSupabase(produit) {
    stockSupabaseCharge = false;

    if (!window.triedreSupabase) {
      console.error(
        '[TRIÈDRE] Client Supabase indisponible : le stock ne peut pas être vérifié.'
      );
      return;
    }

    try {
      const { data, error } = await window.triedreSupabase
        .from('product_variants')
        .select('variant_id, sku, stock, active')
        .eq('product_id', produit.id);

      if (error) {
        console.error(
          '[TRIÈDRE] Erreur de lecture du stock Supabase :',
          error
        );
        return;
      }

      const stocksParSku = new Map();

      (data || []).forEach(function (varianteSupabase) {
        stocksParSku.set(varianteSupabase.sku, varianteSupabase);
      });

      (produit.variantes || []).forEach(function (varianteLocale) {
        const varianteSupabase = stocksParSku.get(varianteLocale.sku);

        if (!varianteSupabase) {
          varianteLocale.stock = 0;
          varianteLocale.actif = false;
          return;
        }

        varianteLocale.stock = Number(varianteSupabase.stock);
        varianteLocale.actif = varianteSupabase.active !== false;
      });

      stockSupabaseCharge = true;

      console.log(
        '[TRIÈDRE] Stock Supabase chargé pour ' +
        produit.id +
        ' — variantes reçues : ' +
        (data || []).length
      );

    } catch (erreur) {
      console.error(
        '[TRIÈDRE] Erreur inattendue pendant la lecture du stock :',
        erreur
      );
    }
  }

  // ==========================================================================
  // Disponibilité — couleur + taille visibles d'un coup d'œil
  // ==========================================================================

  function variantesActives(produit) {
    return (produit.variantes || []).filter(function (v) {
      return v.actif !== false;
    });
  }

  function prixReference(produit) {
    const variantes = variantesActives(produit);
    if (variantes.length === 0) return null;

    return variantes.reduce(function (moinsCher, variante) {
      return variante.prix < moinsCher.prix ? variante : moinsCher;
    }, variantes[0]);
  }

  function valeursUniques(liste) {
    return liste.filter(function (valeur, index) {
      return liste.indexOf(valeur) === index;
    });
  }

  function formaterPrix(montant) {
    return Number(montant).toFixed(2).replace('.', ',') + ' $';
  }

  function normaliser(texte) {
    return String(texte || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim()
      .toLowerCase();
  }

  function estDisponible(variante) {
    return Boolean(
      stockSupabaseCharge &&
      variante &&
      variante.actif !== false &&
      typeof variante.stock === 'number' &&
      variante.stock > 0
    );
  }

  function estStockFaible(variante) {
    return estDisponible(variante) && variante.stock <= SEUIL_STOCK_FAIBLE;
  }

  function variantesDeCouleur(couleur) {
    return variantesActives(produitActuel).filter(function (v) {
      return v.couleur === couleur;
    });
  }

  function couleurDisponible(couleur) {
    return variantesDeCouleur(couleur).some(estDisponible);
  }

  function listeCouleurs(produit) {
    const couleurs = [];

    variantesActives(produit).forEach(function (variante) {
      if (!couleurs.some(function (c) { return c.nom === variante.couleur; })) {
        couleurs.push({
          nom: variante.couleur,
          hex: variante.hex,
          photoFace: variante.photoFace
        });
      }
    });

    return couleurs;
  }

  // Couleur d'arrivée : celle de l'adresse (?couleur=noir), sinon la première disponible.
  function choisirCouleurInitiale(produit) {
    const couleurs = listeCouleurs(produit);
    const demandee = parametres.get('couleur');

    if (demandee) {
      const trouvee = couleurs.find(function (c) {
        return normaliser(c.nom) === normaliser(demandee);
      });
      if (trouvee) return trouvee.nom;
    }

    const disponible = couleurs.find(function (c) {
      return couleurDisponible(c.nom);
    });

    return (disponible || couleurs[0] || { nom: '' }).nom;
  }

  function photoDeCouleur(couleur) {
    const variante = variantesDeCouleur(couleur)[0];
    return variante ? variante.photoFace : '';
  }

  // Galerie : la photo de face de la couleur choisie, puis les vues communes (dos, côtés…).
  function construireVues(produit) {
    const face = photoDeCouleur(couleurActive);
    const vuesCommunes = produit.vuesCommunes || [];

    if (!face) return vuesCommunes.slice();

    const autresVues = vuesCommunes.filter(function (vue) {
      return !/-face\.[a-z0-9]+$/i.test(vue);
    });

    return [face].concat(autresVues);
  }

  function memoriserCouleurDansAdresse() {
    if (!window.history || !window.history.replaceState || !couleurActive) return;

    const url = new URL(window.location.href);
    url.searchParams.set('couleur', normaliser(couleurActive));
    window.history.replaceState(null, '', url.pathname + url.search);
  }

  function afficherProduit(produit) {
    const reference = prixReference(produit);

    document.getElementById('page-title').textContent = produit.nom + ' - TRIÈDRE';
    document.getElementById('breadcrumb-produit').textContent = produit.nom;
    document.getElementById('produit-categorie').textContent = produit.categorie;
    document.getElementById('produit-nom').textContent = produit.nom;
    document.getElementById('produit-description').textContent = produit.description;

    if (reference) {
      document.getElementById('produit-prix').textContent = formaterPrix(reference.prix);
    }

    couleurActive = choisirCouleurInitiale(produit);
    tailleActive = '';

    // Taille unique disponible : sélection automatique.
    const tailles = valeursUniques(variantesDeCouleur(couleurActive).map(function (v) {
      return v.taille;
    }));
    if (tailles.length === 1) {
      const seule = variantesDeCouleur(couleurActive)[0];
      if (estDisponible(seule)) tailleActive = seule.taille;
    }

    rafraichirSelection(produit, true);
    activerInteractivite();
  }

  // Met à jour tout l'affichage à partir de couleurActive / tailleActive.
  function rafraichirSelection(produit, reconstruireGalerie) {
    document.getElementById('couleur-selectionnee').textContent =
      couleurActive + (couleurActive && !couleurDisponible(couleurActive) ? ' - épuisé' : '');

    if (reconstruireGalerie) {
      listeVues = construireVues(produit);
      vueActuelle = 0;
      afficherMiniatures(produit);
      afficherVue(0);
    }

    afficherCouleurs(produit);
    afficherTailles(produit);
    mettreAJourStockEtPrix();
  }

  function afficherMiniatures(produit) {
    const listeMiniatures = document.getElementById('miniatures-liste');
    listeMiniatures.innerHTML = '';

    listeVues.forEach(function (vue, index) {
      const li = document.createElement('li');
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'miniature' + (index === 0 ? ' active' : '');
      bouton.setAttribute('data-index', index);
      bouton.setAttribute('aria-label', 'Voir la photo ' + (index + 1));

      const img = document.createElement('img');
      img.src = cheminImages + vue;
      img.alt = produit.nom + (index === 0 && couleurActive ? ' - ' + couleurActive : '');

      bouton.appendChild(img);
      li.appendChild(bouton);
      listeMiniatures.appendChild(li);
    });
  }

  function afficherCouleurs(produit) {
    const blocCouleur = document.getElementById('bloc-couleur');
    const conteneur = document.getElementById('couleur-options-liste');
    const couleurs = listeCouleurs(produit);

    conteneur.innerHTML = '';

    if (couleurs.length <= 1) {
      blocCouleur.style.display = 'none';
      return;
    }

    blocCouleur.style.display = '';

    couleurs.forEach(function (couleur) {
      const disponible = couleurDisponible(couleur.nom);
      const li = document.createElement('li');
      const bouton = document.createElement('button');

      bouton.type = 'button';
      bouton.className = 'couleur-swatch' +
        (couleur.nom === couleurActive ? ' active' : '') +
        (stockSupabaseCharge && !disponible ? ' epuise' : '');
      bouton.setAttribute('data-couleur', couleur.nom);
      bouton.setAttribute('aria-pressed', couleur.nom === couleurActive ? 'true' : 'false');
      bouton.setAttribute(
        'aria-label',
        couleur.nom + (stockSupabaseCharge && !disponible ? ' - épuisé' : '')
      );
      bouton.title = bouton.getAttribute('aria-label');
      bouton.style.backgroundColor = couleur.hex;

      li.appendChild(bouton);
      conteneur.appendChild(li);
    });
  }

  function afficherTailles(produit) {
    const listeTailles = document.getElementById('taille-options-liste');
    const variantes = variantesDeCouleur(couleurActive);
    const tailles = valeursUniques(variantes.map(function (v) { return v.taille; }));

    listeTailles.innerHTML = '';

    tailles.forEach(function (taille) {
      const variante = variantes.find(function (v) { return v.taille === taille; });
      const disponible = estDisponible(variante);
      const faible = estStockFaible(variante);

      const li = document.createElement('li');
      const bouton = document.createElement('button');

      bouton.type = 'button';
      bouton.className = 'taille-btn' +
        (taille === tailleActive ? ' active' : '') +
        (!disponible ? ' indisponible' : '') +
        (faible ? ' stock-faible' : '');
      bouton.textContent = taille;
      bouton.setAttribute('data-taille', taille);
      bouton.setAttribute('aria-pressed', taille === tailleActive ? 'true' : 'false');

      if (!disponible) {
        bouton.disabled = true;
        bouton.setAttribute('aria-label', taille + ' - épuisé');
        bouton.title = 'Épuisé';
      } else if (faible) {
        bouton.setAttribute('aria-label', taille + ' - stock limité');
        bouton.title = 'Plus que ' + variante.stock;
      }

      li.appendChild(bouton);
      listeTailles.appendChild(li);
    });
  }

  function varianteSelectionnee() {
    if (!produitActuel || !tailleActive) return null;

    return variantesDeCouleur(couleurActive).find(function (v) {
      return v.taille === tailleActive;
    }) || null;
  }

  function mettreAJourStockEtPrix() {
    if (!produitActuel) return;

    const stockMessage = document.getElementById('produit-stock');
    const bouton = document.querySelector('.btn-ajouter-panier');
    const quantiteInput = document.querySelector('.quantite-input');
    const variante = varianteSelectionnee();
    const reference = prixReference(produitActuel);
    const prix = variante ? variante.prix : (reference ? reference.prix : 0);

    document.getElementById('produit-prix').textContent = formaterPrix(prix);

    if (!stockMessage || !bouton) return;

    function definirMessage(texte, classe) {
      stockMessage.textContent = texte;
      stockMessage.className = 'stock-message' + (classe ? ' ' + classe : '');
    }

    if (!stockSupabaseCharge) {
      definirMessage('Stock momentanément indisponible. Réessaie dans quelques instants.', 'stock-limite-texte');
      bouton.disabled = true;
      bouton.textContent = 'Stock indisponible';
      return;
    }

    if (!couleurDisponible(couleurActive)) {
      definirMessage('Cette couleur est épuisée pour le moment. Découvre les autres coloris.', 'stock-rupture');
      bouton.disabled = true;
      bouton.textContent = 'Épuisé';
      return;
    }

    if (!variante) {
      const faibles = variantesDeCouleur(couleurActive).filter(estStockFaible);
      definirMessage(faibles.length ? 'Stock limité sur certaines tailles.' : '', faibles.length ? 'stock-limite-texte' : '');
      bouton.disabled = false;
      bouton.textContent = 'Choisis ta taille';
      bouton.classList.add('btn-attente-taille');
      return;
    }

    bouton.classList.remove('btn-attente-taille');

    // La quantité ne peut jamais dépasser le stock de la taille choisie.
    if (quantiteInput) {
      const quantite = parseInt(quantiteInput.value, 10) || 1;
      if (quantite > variante.stock) quantiteInput.value = variante.stock;
      quantiteInput.max = variante.stock;
    }

    if (estStockFaible(variante)) {
      definirMessage('Plus que ' + variante.stock + ' en ' + variante.taille + ' - ' + variante.couleur, 'stock-limite-texte');
    } else {
      definirMessage('En stock', 'stock-ok');
    }

    bouton.disabled = false;
    bouton.textContent = 'Ajouter au panier';
  }

  function afficherVue(index) {
    if (listeVues.length === 0) return;

    vueActuelle = (index + listeVues.length) % listeVues.length;

    const imagePrincipale = document.getElementById('image-principale');
    imagePrincipale.src = cheminImages + listeVues[vueActuelle];
    imagePrincipale.alt = produitActuel
      ? produitActuel.nom + (couleurActive ? ' - ' + couleurActive : '')
      : '';

    document.querySelectorAll('.miniature').forEach(function (m) {
      m.classList.toggle(
        'active',
        parseInt(m.getAttribute('data-index'), 10) === vueActuelle
      );
    });
  }

  function signalerTailleManquante() {
    const listeTailles = document.getElementById('taille-options-liste');
    afficherToast('Choisis ta taille pour ajouter ce produit au panier.', 'avertissement');

    if (listeTailles) {
      listeTailles.classList.remove('taille-attention');
      void listeTailles.offsetWidth; // relance l'animation
      listeTailles.classList.add('taille-attention');
      const premiere = listeTailles.querySelector('.taille-btn:not(:disabled)');
      if (premiere) premiere.focus();
    }
  }

  function activerInteractivite() {
    const imagePrincipale = document.getElementById('image-principale');

    const listeMiniatures = document.getElementById('miniatures-liste');
    if (listeMiniatures) {
      listeMiniatures.addEventListener('click', function (e) {
        const bouton = e.target.closest('.miniature');
        if (!bouton) return;
        afficherVue(parseInt(bouton.getAttribute('data-index'), 10));
      });
    }

    const flecheGauche = document.querySelector('.galerie-fleche-gauche');
    const flecheDroite = document.querySelector('.galerie-fleche-droite');

    if (flecheGauche) {
      flecheGauche.addEventListener('click', function () { afficherVue(vueActuelle - 1); });
    }

    if (flecheDroite) {
      flecheDroite.addEventListener('click', function () { afficherVue(vueActuelle + 1); });
    }

    if (imagePrincipale) {
      let positionDepart = 0;

      imagePrincipale.addEventListener('touchstart', function (e) {
        positionDepart = e.touches[0].clientX;
      });

      imagePrincipale.addEventListener('touchend', function (e) {
        const difference = e.changedTouches[0].clientX - positionDepart;
        if (difference > 50) afficherVue(vueActuelle - 1);
        if (difference < -50) afficherVue(vueActuelle + 1);
      });
    }

    const conteneurCouleurs = document.getElementById('couleur-options-liste');

    if (conteneurCouleurs) {
      conteneurCouleurs.addEventListener('click', function (e) {
        const bouton = e.target.closest('.couleur-swatch');
        if (!bouton) return;

        const couleur = bouton.getAttribute('data-couleur');
        if (couleur === couleurActive) return;

        couleurActive = couleur;

        // On garde la taille choisie si elle existe aussi dans la nouvelle couleur.
        const memeTaille = variantesDeCouleur(couleur).find(function (v) {
          return v.taille === tailleActive;
        });
        if (!estDisponible(memeTaille)) tailleActive = '';

        rafraichirSelection(produitActuel, true);
        memoriserCouleurDansAdresse();
      });
    }

    const listeTailles = document.getElementById('taille-options-liste');

    if (listeTailles) {
      listeTailles.addEventListener('click', function (e) {
        const bouton = e.target.closest('.taille-btn');
        if (!bouton || bouton.disabled || !stockSupabaseCharge) return;

        tailleActive = bouton.getAttribute('data-taille');
        listeTailles.classList.remove('taille-attention');
        afficherTailles(produitActuel);
        mettreAJourStockEtPrix();
      });
    }

    const quantiteInput = document.querySelector('.quantite-input');
    const boutonMoins = document.querySelector('.quantite-moins');
    const boutonPlus = document.querySelector('.quantite-plus');

    if (boutonMoins && quantiteInput) {
      boutonMoins.addEventListener('click', function () {
        const valeur = parseInt(quantiteInput.value, 10);
        if (valeur > 1) quantiteInput.value = valeur - 1;
      });
    }

    if (boutonPlus && quantiteInput) {
      boutonPlus.addEventListener('click', function () {
        const valeur = parseInt(quantiteInput.value, 10);
        const variante = varianteSelectionnee();

        if (variante && typeof variante.stock === 'number' && valeur >= variante.stock) {
          afficherToast('Quantité maximale disponible atteinte.', 'info');
          return;
        }

        quantiteInput.value = valeur + 1;
      });
    }

    const boutonAjouter = document.querySelector('.btn-ajouter-panier');

    if (boutonAjouter) {
      boutonAjouter.addEventListener('click', function () {
        if (!stockSupabaseCharge) {
          afficherToast('Le stock ne peut pas être vérifié pour le moment.', 'avertissement');
          return;
        }

        const variante = varianteSelectionnee();

        if (!variante) {
          signalerTailleManquante();
          return;
        }

        if (!estDisponible(variante)) {
          afficherToast('Cette taille est épuisée.', 'avertissement');
          return;
        }

        const quantite = parseInt(document.querySelector('.quantite-input').value, 10) || 1;

        if (quantite > variante.stock) {
          afficherToast('La quantité demandée dépasse le stock disponible.', 'avertissement');
          return;
        }

        const article = {
          id: produitActuel.id,
          variantId: variante.id,
          sku: variante.sku,
          nom: produitActuel.nom,
          prix: variante.prix,
          couleur: variante.couleur,
          taille: variante.taille,
          // Toujours la photo de face de la couleur achetée (et non la vue affichée).
          image: new URL(cheminImages + (variante.photoFace || listeVues[0] || ''), window.location.href).href,
          quantite: quantite
        };

        ajouterAuPanier(article);

        if (typeof afficherAjoutPanierPremium === 'function') {
          afficherAjoutPanierPremium(article);
        } else {
          afficherToast(produitActuel.nom + ' ajouté au panier.', 'succes');
        }
      });
    }
  }


  function afficherProduitsSimilaires(tousLesProduits, produitActuel) {
    const conteneur = document.getElementById('produits-similaires-liste');
    if (!conteneur) return;

    const memeCategorie = tousLesProduits.filter(function (p) {
      return p.id !== produitActuel.id &&
             p.categorie === produitActuel.categorie &&
             p.actif !== false;
    });

    const autres = tousLesProduits.filter(function (p) {
      return p.id !== produitActuel.id &&
             p.categorie !== produitActuel.categorie &&
             p.actif !== false;
    });

    const suggestions = memeCategorie.concat(autres).slice(0, 4);

    if (suggestions.length === 0) {
      const section = document.querySelector('.produits-similaires');
      if (section) section.style.display = 'none';
      return;
    }

    conteneur.innerHTML = '';

    suggestions.forEach(function (p) {
      const reference = prixReference(p);
      if (!reference) return;

      const li = document.createElement('li');
      li.className = 'produit-card';

      const lien = document.createElement('a');
      lien.href = 'produit?id=' + p.id;

      const img = document.createElement('img');
      img.src = cheminImages + reference.photoFace;
      img.alt = p.nom;

      const titre = document.createElement('h3');
      titre.textContent = p.nom;

      const spanPrix = document.createElement('span');
      spanPrix.className = 'prix';

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

      lien.appendChild(img);
      lien.appendChild(titre);
      lien.appendChild(spanPrix);

      if (p.badge) {
        const badge = document.createElement('span');
        badge.className = 'badge-produit';
        badge.textContent = p.badge;
        lien.appendChild(badge);
      }

      li.appendChild(lien);
      conteneur.appendChild(li);
    });
  }

  function genererEtoiles(note) {
    const noteArrondie = Math.round(note);
    let html = '<span class="etoiles">';

    for (let i = 1; i <= 5; i++) {
      html += i <= noteArrondie ? '★' : '☆';
    }

    html += '</span>';
    return html;
  }

  function getAvisLocaux(id) {
    const donnees = localStorage.getItem('triedre_avis_' + id);
    return donnees ? JSON.parse(donnees) : [];
  }

  function sauvegarderAvisLocal(id, avis) {
    const avisExistants = getAvisLocaux(id);
    avisExistants.unshift(avis);

    localStorage.setItem(
      'triedre_avis_' + id,
      JSON.stringify(avisExistants)
    );
  }

  function afficherAvis(produit) {
    const conteneurResume = document.getElementById('avis-resume');
    const conteneurListe = document.getElementById('avis-liste');

    if (!conteneurResume || !conteneurListe) return;

    const avisStatiques = produit.avis || [];
    const avisLocaux = getAvisLocaux(produit.id);

    function rafraichir() {
      const liste = avisLocaux.concat(avisStatiques);

      if (liste.length === 0) {
        conteneurResume.innerHTML =
          '<p class="avis-aucun">Aucun avis pour l\'instant - sois le premier à en laisser un !</p>';
        conteneurListe.innerHTML = '';
        return;
      }

      const moyenne =
        liste.reduce(function (total, a) {
          return total + a.note;
        }, 0) / liste.length;

      conteneurResume.innerHTML =
        genererEtoiles(moyenne) +
        '<span class="avis-moyenne">' + moyenne.toFixed(1) + ' / 5</span>' +
        '<span class="avis-nombre">(' + liste.length + ' avis)</span>';

      conteneurListe.innerHTML = '';

      liste.forEach(function (avis) {
        const li = document.createElement('li');
        li.className = 'avis-item';

        li.innerHTML =
          '<div class="avis-item-header">' +
            '<strong>' + avis.auteur + '</strong>' +
            genererEtoiles(avis.note) +
          '</div>' +
          '<p>' + avis.commentaire + '</p>';

        conteneurListe.appendChild(li);
      });
    }

    rafraichir();

    const boutonsEtoiles =
      document.querySelectorAll('#avis-etoiles-input button');
    const inputNote = document.getElementById('avis-note');

    boutonsEtoiles.forEach(function (bouton) {
      bouton.addEventListener('click', function () {
        const note = parseInt(bouton.getAttribute('data-note'), 10);
        inputNote.value = note;

        boutonsEtoiles.forEach(function (b) {
          b.classList.toggle(
            'selectionnee',
            parseInt(b.getAttribute('data-note'), 10) <= note
          );
        });
      });
    });

    const formulaireAvis = document.getElementById('formulaire-avis');

    if (formulaireAvis) {
      formulaireAvis.addEventListener('submit', function (e) {
        e.preventDefault();

        const note = parseInt(inputNote.value, 10);

        if (note === 0) {
          afficherToast(
            'Sélectionne une note avant de publier ton avis.',
            'avertissement'
          );
          return;
        }

        const nouvelAvis = {
          auteur: document.getElementById('avis-nom').value,
          note: note,
          commentaire: document.getElementById('avis-commentaire').value
        };

        sauvegarderAvisLocal(produit.id, nouvelAvis);
        avisLocaux.unshift(nouvelAvis);
        rafraichir();

        formulaireAvis.reset();
        inputNote.value = 0;

        boutonsEtoiles.forEach(function (b) {
          b.classList.remove('selectionnee');
        });

        afficherToast('Merci pour ton avis.', 'succes');
      });
    }
  }

  // ==========================================================================
  // Guide des tailles
  // ==========================================================================

  function ouvrirGuideTailles(e) {
    if (e) e.preventDefault();
    if (!guideTaillesModal || !produitActuel) return;

    const tailles = valeursUniques(
      variantesActives(produitActuel).map(function (v) {
        return v.taille;
      })
    );

    guideTaillesProduit.textContent = produitActuel.nom;
    guideTaillesCorps.innerHTML = '';

    guideTaillesProduit.textContent =
      produitActuel.nom + (couleurActive ? ' - ' + couleurActive : '');

    tailles.forEach(function (taille) {
      const ligne = document.createElement('tr');

      const celluleTaille = document.createElement('th');
      celluleTaille.scope = 'row';
      celluleTaille.textContent = taille;

      // Disponibilité réelle de la taille dans la couleur sélectionnée.
      const variante = variantesDeCouleur(couleurActive).find(function (v) {
        return v.taille === taille;
      });
      const celluleDisponibilite = document.createElement('td');
      celluleDisponibilite.textContent = !estDisponible(variante)
        ? 'Épuisé'
        : (estStockFaible(variante) ? 'Stock limité' : 'Disponible');

      ligne.appendChild(celluleTaille);
      ligne.appendChild(celluleDisponibilite);
      guideTaillesCorps.appendChild(ligne);
    });

    guideTaillesModal.hidden = false;
    document.body.classList.add('triedre-modal-ouverte');

    const boutonFermer =
      guideTaillesModal.querySelector('.guide-tailles-fermer');

    if (boutonFermer) boutonFermer.focus();
  }

  function fermerGuideTailles() {
    if (!guideTaillesModal) return;

    guideTaillesModal.hidden = true;
    document.body.classList.remove('triedre-modal-ouverte');

    if (guideTaillesBouton && guideTaillesBouton.offsetParent !== null) {
      guideTaillesBouton.focus();
    }
  }

  function mettreAJourVisibiliteGuideTailles() {
    if (!guideTaillesBouton || !produitActuel) return;

    const tailles = valeursUniques(
      variantesActives(produitActuel).map(function (v) {
        return v.taille;
      })
    );

    guideTaillesBouton.hidden =
      tailles.length === 1 && tailles[0] === 'Taille unique';
  }

  if (guideTaillesBouton) {
    guideTaillesBouton.addEventListener('click', ouvrirGuideTailles);
  }

  boutonsFermerGuide.forEach(function (element) {
    element.addEventListener('click', fermerGuideTailles);
  });

  document.addEventListener('keydown', function (e) {
    if (
      e.key === 'Escape' &&
      guideTaillesModal &&
      !guideTaillesModal.hidden
    ) {
      fermerGuideTailles();
    }
  });

  function ouvrirModalFavoris() {
    if (!favorisModal) return;

    favorisModal.hidden = false;
    document.body.style.overflow = 'hidden';

    const boutonFermer =
      favorisModal.querySelector('.favoris-modal-fermer');

    if (boutonFermer) boutonFermer.focus();
  }

  function fermerModalFavoris() {
    if (!favorisModal) return;

    favorisModal.hidden = true;
    document.body.style.overflow = '';

    if (boutonFavori) boutonFavori.focus();
  }

  if (boutonFavori) {
    boutonFavori.addEventListener('click', ouvrirModalFavoris);
  }

  boutonsFermerFavoris.forEach(function (element) {
    element.addEventListener('click', fermerModalFavoris);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && favorisModal && !favorisModal.hidden) {
      fermerModalFavoris();
    }
  });
});
