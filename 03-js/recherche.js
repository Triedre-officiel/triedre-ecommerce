// ==========================================================================
// TRIÈDRE — Barre de recherche — Catalogue V1
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {

  const boutonRecherche =
    document.querySelector('.header-icons button[aria-label="Rechercher"]');

  if (!boutonRecherche) return;

  let produitsCharges = null;
  let panneauOuvert = false;

  const panneau = document.createElement('div');
  panneau.className = 'recherche-panneau';
  panneau.innerHTML =
    '<label class="sr-only" for="recherche-produit">Rechercher un produit</label>' +
    '<input type="search" id="recherche-produit" name="recherche-produit" class="recherche-input" placeholder="Rechercher un produit..." autocomplete="off">' +
    '<ul class="recherche-resultats" aria-live="polite"></ul>';

  boutonRecherche.parentElement.style.position = 'relative';
  boutonRecherche.parentElement.appendChild(panneau);

  const champRecherche = panneau.querySelector('.recherche-input');
  const listeResultats = panneau.querySelector('.recherche-resultats');

  boutonRecherche.addEventListener('click', function (e) {
    e.stopPropagation();

    panneauOuvert = !panneauOuvert;
    panneau.classList.toggle('actif', panneauOuvert);

    if (panneauOuvert) {
      champRecherche.focus();
      chargerProduitsSiNecessaire();
    }
  });

  document.addEventListener('click', function (e) {
    if (!panneau.contains(e.target) && e.target !== boutonRecherche) {
      panneau.classList.remove('actif');
      panneauOuvert = false;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      panneau.classList.remove('actif');
      panneauOuvert = false;
    }
  });

  function chargerProduitsSiNecessaire() {
    if (produitsCharges) return;

    fetch('../04-data/produits.json')
      .then(function (reponse) {
        if (!reponse.ok) {
          throw new Error('Impossible de charger produits.json');
        }

        return reponse.json();
      })
      .then(function (donnees) {
        produitsCharges = donnees.produits || [];
      })
      .catch(function () {
        listeResultats.innerHTML =
          '<li>Recherche indisponible pour le moment.</li>';
      });
  }

  function varianteDeReference(produit) {
    const variantes = (produit.variantes || []).filter(function (variante) {
      return variante.actif !== false;
    });

    if (variantes.length === 0) return null;

    return variantes.reduce(function (moinsChere, variante) {
      return variante.prix < moinsChere.prix ? variante : moinsChere;
    }, variantes[0]);
  }

  champRecherche.addEventListener('input', function () {
    const requete = champRecherche.value.trim().toLowerCase();
    listeResultats.innerHTML = '';

    if (requete === '' || !produitsCharges) return;

    const resultats = produitsCharges.filter(function (produit) {
      return produit.actif !== false &&
        produit.nom.toLowerCase().includes(requete);
    });

    if (resultats.length === 0) {
      const li = document.createElement('li');
      li.textContent =
        'Aucun résultat pour "' + champRecherche.value + '"';
      listeResultats.appendChild(li);
      return;
    }

    resultats.forEach(function (produit) {
      const reference = varianteDeReference(produit);
      if (!reference) return;

      const li = document.createElement('li');
      const lien = document.createElement('a');

      lien.href = 'produit?id=' + encodeURIComponent(produit.id);
      lien.textContent =
        produit.nom + '. ' +
        reference.prix.toFixed(2).replace('.', ',') + ' $';

      li.appendChild(lien);
      listeResultats.appendChild(li);
    });
  });

});
