// ==========================================================================
// TRIÈDRE — Stock Supabase partagé
// Source de vérité du stock pour boutique, recherche, panier et commande.
// ==========================================================================

(function () {
  'use strict';

  const SUPABASE_URL = 'https://blfkudqguqvjmvqqlilh.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_PYAPe69yejBM0i7Z0G0uog_DDzhEkQR';

  let cacheVariantes = null;

  async function chargerVariantes(force) {
    if (!force && cacheVariantes) return cacheVariantes;

    const url =
      SUPABASE_URL +
      '/rest/v1/product_variants' +
      '?select=product_id,variant_id,sku,stock,active';

    const reponse = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: 'Bearer ' + SUPABASE_PUBLISHABLE_KEY,
        Accept: 'application/json'
      },
      cache: 'no-store'
    });

    if (!reponse.ok) {
      throw new Error(
        'Supabase stock indisponible (' + reponse.status + ')'
      );
    }

    const variantes = await reponse.json();

    cacheVariantes = (variantes || []).map(function (variante) {
      return {
        product_id: variante.product_id,
        variant_id: variante.variant_id,
        sku: variante.sku,
        stock: Number(variante.stock),
        active: variante.active !== false
      };
    });

    return cacheVariantes;
  }

  async function indexParSku(force) {
    const variantes = await chargerVariantes(Boolean(force));
    const index = new Map();

    variantes.forEach(function (variante) {
      index.set(variante.sku, variante);
    });

    return index;
  }

  async function obtenirVariante(sku, force) {
    const index = await indexParSku(Boolean(force));
    return index.get(sku) || null;
  }

  async function verifierPanier(panier, force) {
    const index = await indexParSku(Boolean(force));

    return (panier || []).map(function (item) {
      const distante = index.get(item.sku);

      if (!distante || distante.active === false) {
        return {
          item: item,
          disponible: false,
          stock: 0,
          raison: 'indisponible'
        };
      }

      const stock = distante.stock;

      return {
        item: item,
        disponible: stock > 0 && item.quantite <= stock,
        stock: stock,
        raison:
          stock <= 0
            ? 'indisponible'
            : item.quantite > stock
              ? 'quantite'
              : 'ok'
      };
    });
  }

  window.triedreStockSupabase = {
    chargerVariantes: chargerVariantes,
    indexParSku: indexParSku,
    obtenirVariante: obtenirVariante,
    verifierPanier: verifierPanier
  };
})();
