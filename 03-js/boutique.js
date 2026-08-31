// ==========================================================================
// TRIÈDRE — Filtres et tri de la page boutique
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {

  const selectCategorie = document.getElementById('filtre-categorie');
  const selectTri = document.getElementById('filtre-tri');
  const grille = document.querySelector('.produits-grid');

  // Cette page ne s'exécute que si on est sur boutique
  if (!selectCategorie || !grille) return;

  // On garde une copie de tous les articles d'origine (avant tout filtrage)
  const tousLesArticles = Array.from(grille.querySelectorAll('.produit-card'));

  function extraitPrix(article) {
    const texte = article.querySelector('.prix').textContent;
    return parseFloat(texte.replace(' $', '').replace(',', '.'));
  }

  function appliquerFiltres() {
    const categorieChoisie = selectCategorie.value;
    const triChoisi = selectTri.value;

    // ---- Filtrage par catégorie ----
    let articlesFiltres = tousLesArticles.filter(function (article) {
      if (categorieChoisie === 'tous') return true;
      return article.getAttribute('data-categorie') === categorieChoisie;
    });

    // ---- Tri ----
    if (triChoisi === 'prix-croissant') {
      articlesFiltres.sort(function (a, b) {
        return extraitPrix(a) - extraitPrix(b);
      });
    } else if (triChoisi === 'prix-decroissant') {
      articlesFiltres.sort(function (a, b) {
        return extraitPrix(b) - extraitPrix(a);
      });
    }

    // ---- Réaffichage de la grille ----
    grille.innerHTML = '';

    if (articlesFiltres.length === 0) {
      const messageVide = document.createElement('p');
      messageVide.className = 'boutique-vide';
      messageVide.textContent = 'Aucun produit ne correspond à cette catégorie pour le moment.';
      grille.appendChild(messageVide);
      return;
    }

    articlesFiltres.forEach(function (article) {
      grille.appendChild(article);
    });
  }

  selectCategorie.addEventListener('change', appliquerFiltres);
  selectTri.addEventListener('change', appliquerFiltres);

});
