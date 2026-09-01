// ========================================================================== 
// TRIÈDRE — Chargement dynamique de la fiche produit
// ========================================================================== 

document.addEventListener('DOMContentLoaded', function () {

  const conteneurProduit = document.getElementById('produit-nom');
  if (!conteneurProduit) return;

  const parametres = new URLSearchParams(window.location.search);
  const idProduit = parametres.get('id');

  let vueActuelle = 0;
  const cheminImages = '../05-images/produits/';
  let listeVues = [];

  fetch('../04-data/produits.json')
    .then(function (reponse) {
      if (!reponse.ok) throw new Error('Impossible de charger produits.json');
      return reponse.json();
    })
    .then(function (donnees) {
      const produit = donnees.produits.find(function (p) { return p.id === idProduit; });

      if (!produit) {
        document.getElementById('produit-nom').textContent = 'Produit introuvable';
        document.getElementById('produit-description').textContent =
          'Ce produit n\'existe pas ou n\'est plus disponible.';
        return;
      }

      afficherProduit(produit);
      afficherProduitsSimilaires(donnees.produits, produit);
      afficherAvis(produit);
    })
    .catch(function (erreur) {
      console.error(erreur);
      document.getElementById('produit-nom').textContent = 'Erreur de chargement';
    });

  function afficherProduit(produit) {
    document.getElementById('page-title').textContent = produit.nom + ' — TRIÈDRE';
    document.getElementById('breadcrumb-produit').textContent = produit.nom;
    document.getElementById('produit-categorie').textContent = produit.categorie;
    document.getElementById('produit-nom').textContent = produit.nom;
    document.getElementById('produit-prix').textContent = produit.prix.toFixed(2) + ' $';
    document.getElementById('produit-description').textContent = produit.description;

    const stockMessage = document.getElementById('produit-stock');
    const boutonAjouterPanier = document.querySelector('.btn-ajouter-panier');

    if (stockMessage) {
      if (produit.stock === 0) {
        stockMessage.textContent = 'Rupture de stock';
        stockMessage.className = 'stock-message stock-rupture';

        if (boutonAjouterPanier) {
          boutonAjouterPanier.disabled = true;
          boutonAjouterPanier.textContent = 'Rupture de stock';
        }
      } else if (produit.stock !== undefined && produit.stock <= 5) {
        stockMessage.textContent = 'Plus que ' + produit.stock + ' en stock — dépêche-toi !';
        stockMessage.className = 'stock-message stock-limite-texte';
      } else {
        stockMessage.textContent = '';
        stockMessage.className = 'stock-message';
      }
    }

    listeVues = produit.vuesCommunes || [];
    vueActuelle = 0;

    const imagePrincipale = document.getElementById('image-principale');

    if (listeVues.length > 0) {
      imagePrincipale.src = cheminImages + listeVues[0];
      imagePrincipale.alt = produit.nom;
    }

    document.getElementById('couleur-selectionnee').textContent = produit.couleurs[0].nom;

    const listeMiniatures = document.getElementById('miniatures-liste');
    listeMiniatures.innerHTML = '';

    listeVues.forEach(function (vue, index) {
      const li = document.createElement('li');
      const bouton = document.createElement('button');
      bouton.className = 'miniature' + (index === 0 ? ' active' : '');
      bouton.setAttribute('data-index', index);

      const img = document.createElement('img');
      img.src = cheminImages + vue;
      img.alt = produit.nom;

      bouton.appendChild(img);
      li.appendChild(bouton);
      listeMiniatures.appendChild(li);
    });

    const blocCouleur = document.getElementById('bloc-couleur');
    const listeCouleurs = document.getElementById('couleur-options-liste');
    listeCouleurs.innerHTML = '';

    if (produit.couleurs.length <= 1) {
      blocCouleur.style.display = 'none';
    } else {
      blocCouleur.style.display = '';

      produit.couleurs.forEach(function (couleur, index) {
        const li = document.createElement('li');
        const bouton = document.createElement('button');

        bouton.className = 'couleur-swatch' + (index === 0 ? ' active' : '');
        bouton.setAttribute('data-couleur', couleur.nom);
        bouton.setAttribute('data-photo', cheminImages + couleur.photoFace);
        bouton.setAttribute('aria-label', couleur.nom);
        bouton.style.backgroundColor = couleur.hex;

        li.appendChild(bouton);
        listeCouleurs.appendChild(li);
      });
    }

    const listeTailles = document.getElementById('taille-options-liste');
    listeTailles.innerHTML = '';

    produit.tailles.forEach(function (taille) {
      const li = document.createElement('li');
      const bouton = document.createElement('button');

      bouton.className = 'taille-btn';
      if (produit.tailles.length === 1) bouton.classList.add('active');
      bouton.textContent = taille;

      li.appendChild(bouton);
      listeTailles.appendChild(li);
    });

    activerInteractivite();
  }

  function afficherVue(index) {
    if (listeVues.length === 0) return;

    vueActuelle = (index + listeVues.length) % listeVues.length;

    const imagePrincipale = document.getElementById('image-principale');
    imagePrincipale.src = cheminImages + listeVues[vueActuelle];

    document.querySelectorAll('.miniature').forEach(function (m) {
      m.classList.toggle('active', parseInt(m.getAttribute('data-index'), 10) === vueActuelle);
    });
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
      flecheGauche.addEventListener('click', function () {
        afficherVue(vueActuelle - 1);
      });
    }

    if (flecheDroite) {
      flecheDroite.addEventListener('click', function () {
        afficherVue(vueActuelle + 1);
      });
    }

    if (imagePrincipale) {
      let positionDepart = 0;

      imagePrincipale.addEventListener('touchstart', function (e) {
        positionDepart = e.touches[0].clientX;
      });

      imagePrincipale.addEventListener('touchend', function (e) {
        const positionFin = e.changedTouches[0].clientX;
        const difference = positionFin - positionDepart;

        if (difference > 50) afficherVue(vueActuelle - 1);
        if (difference < -50) afficherVue(vueActuelle + 1);
      });
    }

    const listeCouleurs = document.getElementById('couleur-options-liste');
    if (listeCouleurs) {
      listeCouleurs.addEventListener('click', function (e) {
        const bouton = e.target.closest('.couleur-swatch');
        if (!bouton) return;

        imagePrincipale.src = bouton.getAttribute('data-photo');
        document.getElementById('couleur-selectionnee').textContent =
          bouton.getAttribute('data-couleur');

        document.querySelectorAll('.couleur-swatch').forEach(function (el) {
          el.classList.toggle('active', el === bouton);
        });

        document.querySelectorAll('.miniature').forEach(function (m) {
          m.classList.remove('active');
        });
      });
    }

    const listeTailles = document.getElementById('taille-options-liste');
    if (listeTailles) {
      listeTailles.addEventListener('click', function (e) {
        const bouton = e.target.closest('.taille-btn');
        if (!bouton) return;

        document.querySelectorAll('.taille-btn').forEach(function (b) {
          b.classList.remove('active');
        });

        bouton.classList.add('active');
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
        quantiteInput.value = parseInt(quantiteInput.value, 10) + 1;
      });
    }

    const boutonAjouter = document.querySelector('.btn-ajouter-panier');

    if (boutonAjouter) {
      boutonAjouter.addEventListener('click', function () {
        const tailleSelectionnee = document.querySelector('.taille-btn.active');

        if (!tailleSelectionnee) {
          afficherToast(
            'Sélectionne une taille avant d\'ajouter ce produit au panier.',
            'avertissement'
          );
          return;
        }

        const couleurActuelle = document.getElementById('couleur-selectionnee').textContent;
        const quantite = parseInt(document.querySelector('.quantite-input').value, 10);
        const nom = document.getElementById('produit-nom').textContent;
        const prixTexte = document.getElementById('produit-prix').textContent;
        const prix = parseFloat(prixTexte.replace(' $', '').replace(',', '.'));
        const image = document.getElementById('image-principale').src;

        ajouterAuPanier({
          id: idProduit,
          nom: nom,
          prix: prix,
          couleur: couleurActuelle,
          taille: tailleSelectionnee.textContent,
          image: image,
          quantite: quantite
        });

        afficherToast(nom + ' ajouté au panier.', 'succes');
      });
    }
  }

  function afficherProduitsSimilaires(tousLesProduits, produitActuel) {
    const conteneur = document.getElementById('produits-similaires-liste');
    if (!conteneur) return;

    const memeCategorie = tousLesProduits.filter(function (p) {
      return p.id !== produitActuel.id && p.categorie === produitActuel.categorie;
    });

    const autres = tousLesProduits.filter(function (p) {
      return p.id !== produitActuel.id && p.categorie !== produitActuel.categorie;
    });

    const suggestions = memeCategorie.concat(autres).slice(0, 4);

    if (suggestions.length === 0) {
      const section = document.querySelector('.produits-similaires');
      if (section) section.style.display = 'none';
      return;
    }

    conteneur.innerHTML = '';

    suggestions.forEach(function (p) {
      const li = document.createElement('li');
      li.className = 'produit-card';

      const lien = document.createElement('a');
      lien.href = 'produit?id=' + p.id;

      const img = document.createElement('img');
      img.src = cheminImages + p.couleurs[0].photoFace;
      img.alt = p.nom;

      const titre = document.createElement('h3');
      titre.textContent = p.nom;

      const spanPrix = document.createElement('span');
      spanPrix.className = 'prix';

      const prixFormate = p.prix.toFixed(2).replace('.', ',') + ' $';

      if (p.prixOriginal && p.prixOriginal > p.prix) {
        const pourcentage =
          Math.round(((p.prixOriginal - p.prix) / p.prixOriginal) * 100);

        const prixOriginalFormate =
          p.prixOriginal.toFixed(2).replace('.', ',') + ' $';

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

  function getAvisLocaux(idProduit) {
    const donnees = localStorage.getItem('triedre_avis_' + idProduit);
    return donnees ? JSON.parse(donnees) : [];
  }

  function sauvegarderAvisLocal(idProduit, avis) {
    const avisExistants = getAvisLocaux(idProduit);
    avisExistants.unshift(avis);

    localStorage.setItem(
      'triedre_avis_' + idProduit,
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
          '<p class="avis-aucun">Aucun avis pour l\'instant — sois le premier à en laisser un !</p>';

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
  // Favoris — ouverture de la fenêtre de connexion
  // ========================================================================== 

  const boutonFavori = document.querySelector('.btn-favori');
  const favorisModal = document.getElementById('favoris-modal');
  const boutonsFermerFavoris = document.querySelectorAll('[data-fermer-favoris]');

  function ouvrirModalFavoris() {
    if (!favorisModal) return;

    favorisModal.hidden = false;
    document.body.style.overflow = 'hidden';

    const boutonFermer =
      favorisModal.querySelector('.favoris-modal-fermer');

    if (boutonFermer) {
      boutonFermer.focus();
    }
  }

  function fermerModalFavoris() {
    if (!favorisModal) return;

    favorisModal.hidden = true;
    document.body.style.overflow = '';

    if (boutonFavori) {
      boutonFavori.focus();
    }
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
