// ==========================================================================
// TRIÈDRE — Home V2.1
// Carrousel Apparel : 3 produits desktop, 2 tablette, 1 mobile.
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {
  const carousel = document.querySelector('[data-home-products-carousel]');

  if (!carousel) return;

  const viewport = carousel.querySelector('.home-produits-viewport');
  const track = carousel.querySelector('.home-produits-track');
  const cards = Array.from(track.querySelectorAll('.produit-card'));
  const prev = carousel.querySelector('[data-home-products-prev]');
  const next = carousel.querySelector('[data-home-products-next]');
  const dots = Array.from(
    carousel.querySelectorAll('.home-produits-pagination span')
  );

  if (!viewport || !track || !cards.length) return;

  let index = 0;
  let startX = null;

  function visibleCount() {
    if (window.innerWidth <= 520) return 1;
    if (window.innerWidth <= 720) return 2;
    return 3;
  }

  function gapValue() {
    const styles = window.getComputedStyle(track);
    return parseFloat(styles.gap || styles.columnGap || '0') || 0;
  }

  function applyCardWidths() {
    const visible = visibleCount();
    const gap = gapValue();
    const width =
      (viewport.clientWidth - gap * (visible - 1)) / visible;

    cards.forEach(function (card) {
      card.style.width = width + 'px';
      card.style.flexBasis = width + 'px';
    });
  }

  function maxIndex() {
    return Math.max(0, cards.length - visibleCount());
  }

  function stepSize() {
    const first = cards[0].getBoundingClientRect();
    return first.width + gapValue();
  }

  function updateDots() {
    dots.forEach(function (dot, dotIndex) {
      dot.classList.toggle('active', dotIndex === index);
    });
  }

  function update() {
    applyCardWidths();

    index = Math.max(0, Math.min(index, maxIndex()));

    track.style.transform =
      'translate3d(' + (-index * stepSize()) + 'px, 0, 0)';

    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index >= maxIndex();

    updateDots();
  }

  if (prev) {
    prev.addEventListener('click', function () {
      index -= 1;
      update();
    });
  }

  if (next) {
    next.addEventListener('click', function () {
      index += 1;
      update();
    });
  }

  viewport.addEventListener(
    'touchstart',
    function (event) {
      startX = event.touches[0].clientX;
    },
    { passive: true }
  );

  viewport.addEventListener(
    'touchend',
    function (event) {
      if (startX === null) return;

      const endX = event.changedTouches[0].clientX;
      const delta = endX - startX;

      if (Math.abs(delta) > 45) {
        index += delta < 0 ? 1 : -1;
        update();
      }

      startX = null;
    },
    { passive: true }
  );

  window.addEventListener('resize', function () {
    update();
  });

  update();
});
