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
    if (flecheGauche) flecheGauche.addEventListener('click', function () { afficherVue(vueActuelle - 1); });
    if (flecheDroite) flecheDroite.addEventListener('click', function () { afficherVue(vueActuelle + 1); });

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
        document.getElementById('couleur-selectionnee').textContent = bouton.getAttribute('data-couleur');
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
        document.querySelectorAll('.taille-btn').forEach(function (b) { b.classList.remove('active'); });
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
          alert('Merci de sélectionner une taille avant d\'ajouter au panier.');
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

        afficherToast(nom + ' ajouté au panier ✓');
      });
    }
  }

});
