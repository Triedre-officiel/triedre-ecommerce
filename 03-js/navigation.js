// ==========================================================================
// TRIÈDRE — Menu de navigation mobile (hamburger)
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {

  const bouton = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.main-nav ul');

  if (!bouton || !menu) return;

  bouton.addEventListener('click', function (e) {
    e.stopPropagation();
    const estOuvert = menu.classList.toggle('menu-ouvert');
    bouton.classList.toggle('actif', estOuvert);
    bouton.setAttribute('aria-expanded', estOuvert);
  });

  // ---- Fermer si clic à l'extérieur du menu ----
  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target) && e.target !== bouton) {
      menu.classList.remove('menu-ouvert');
      bouton.classList.remove('actif');
      bouton.setAttribute('aria-expanded', 'false');
    }
  });

  // ---- Fermer automatiquement si on clique sur un lien du menu ----
  menu.querySelectorAll('a').forEach(function (lien) {
    lien.addEventListener('click', function () {
      menu.classList.remove('menu-ouvert');
      bouton.classList.remove('actif');
      bouton.setAttribute('aria-expanded', 'false');
    });
  });

});
