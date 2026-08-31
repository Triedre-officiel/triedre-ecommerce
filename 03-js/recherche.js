// ==========================================================================
// TRIÈDRE — Barre de recherche
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {

  const boutonRecherche = document.querySelector('.header-icons button[aria-label="Rechercher"]');
  if (!boutonRecherche) return;

  let produitsChargés = null;
  let panneauOuvert = false;

  const panneau = document.createElement('div');
  panneau.className = 'recherche-panneau';
  panneau.innerHTML =
    '<input type="text" class="recherche-input" placeholder="Rechercher un produit..." aria-label="Rechercher un produit">' +
    '<ul class="recherche-resultats"></ul>';
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
    if (produitsChargés) return;
    fetch('../04-data/produits.json')
      .then(function (reponse) { return reponse.json(); })
      .then(function (donnees) {
        produitsChargés = donnees.produits;
      })
      .catch(function () {
        listeResultats.innerHTML = '<li>Recherche indisponible pour le moment.</li>';
      });
  }

  champRecherche.addEventListener('input', function () {
    const requete = champRecherche.value.trim().toLowerCase();
    listeResultats.innerHTML = '';

    if (requete === '' || !produitsChargés) return;

    const resultats = produitsChargés.filter(function (produit) {
      return produit.nom.toLowerCase().includes(requete);
    });

    if (resultats.length === 0) {
      listeResultats.innerHTML = '<li>Aucun résultat pour "' + champRecherche.value + '"</li>';
      return;
    }

    resultats.forEach(function (produit) {
      const texteComplet = produit.nom + '. ' + produit.prix.toFixed(2) + ' $';
      const li = document.createElement('li');
      const lien = document.createElement('a');
      lien.href = 'produit?id=' + produit.id;
      lien.textContent = texteComplet;
      li.appendChild(lien);
      listeResultats.appendChild(li);
    });
  });

});
