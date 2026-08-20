// ==========================================================================
// TRIÈDRE — Chargement dynamique de la fiche produit
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {

  const conteneurProduit = document.getElementById('produit-nom');
  if (!conteneurProduit) return;

  const parametres = new URLSearchParams(window.location.search);
  const idProduit = parametres.get('id');

  fetch('../04-data/produits.json')
    .then(function (reponse) {
      if (!reponse.ok) {
        throw new Error('Impossible de charger produits.json');
      }
      return reponse.json();
    })
    .then(function (donnees) {
      const produit = donnees.produits.find(function (p) {
        return p.id === idProduit;
      });

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

    const cheminImages = '../05-images/produits/';
    const premiereCouleur = produit.couleurs[0];

    const imagePrincipale = document.getElementById('image-principale');
    imagePrincipale.src = cheminImages + premiereCouleur.image;
    imagePrincipale.alt = produit.nom + ' — ' + premiereCouleur.nom;

    document.getElementById('couleur-selectionnee').textContent = premiereCouleur.nom;

    const listeMiniatures = document.getElementById('miniatures-liste');
    listeMiniatures.innerHTML = '';
    produit.couleurs.forEach(function (couleur, index) {
      const li = document.createElement('li');
      const bouton = document.createElement('button');
      bouton.className = 'miniature' + (index === 0 ? ' active' : '');
      bouton.setAttribute('data-image', cheminImages + couleur.image);
      bouton.setAttribute('data-couleur', couleur.nom);
      bouton.setAttribute('aria-label', 'Voir en ' + couleur.nom);

      const img = document.createElement('img');
      img.src = cheminImages + couleur.image;
      img.alt = produit.nom + ' — ' + couleur.nom;

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
        bouton.setAttribute('data-image', cheminImages + couleur.image);
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
      if (produit.tailles.length === 1) {
        bouton.classList.add('active');
      }
      bouton.textContent = taille;
      li.appendChild(bouton);
      listeTailles.appendChild(li);
    });

    activerInteractivite();
  }

  function activerInteractivite() {
    const imagePrincipale = document.getElementById('image-principale');
    const couleurTexte = document.getElementById('couleur-selectionnee');

    function selectionnerImage(nouvelleImage, nomCouleur) {
      imagePrincipale.src = nouvelleImage;
      imagePrincipale.alt = nomCouleur;
      couleurTexte.textContent = nomCouleur;

      document.querySelectorAll('.miniature, .couleur-swatch').forEach(function (el) {
        el.classList.toggle('active', el.getAttribute('data-image') === nouvelleImage);
      });
    }

    document.getElementById('miniatures-liste').addEventListener('click', function (e) {
      const bouton = e.target.closest('.miniature');
      if (!bouton) return;
      selectionnerImage(bouton.getAttribute('data-image'), bouton.getAttribute('data-couleur'));
    });

    document.getElementById('couleur-options-liste').addEventListener('click', function (e) {
      const bouton = e.target.closest('.couleur-swatch');
      if (!bouton) return;
      selectionnerImage(bouton.getAttribute('data-image'), bouton.getAttribute('data-couleur'));
    });

    document.getElementById('taille-options-liste').addEventListener('click', function (e) {
      const bouton = e.target.closest('.taille-btn');
      if (!bouton) return;
      document.querySelectorAll('.taille-btn').forEach(function (b) {
        b.classList.remove('active');
      });
      bouton.classList.add('active');
    });

    const quantiteInput = document.querySelector('.quantite-input');
    const boutonMoins = document.querySelector('.quantite-moins');
    const boutonPlus = document.querySelector('.quantite-plus');

    boutonMoins.addEventListener('click', function () {
      const valeur = parseInt(quantiteInput.value, 10);
      if (valeur > 1) quantiteInput.value = valeur - 1;
    });

    boutonPlus.addEventListener('click', function () {
      quantiteInput.value = parseInt(quantiteInput.value, 10) + 1;
    });

    document.querySelector('.btn-ajouter-panier').addEventListener('click', function () {
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

      alert(nom + ' ajouté au panier !');
    });
  }

});
