// ==========================================================================
// TRIÈDRE — Favoris V8.2 — Variante exacte par SKU
// Fiche produit uniquement.
// ==========================================================================

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const supabase = window.triedreSupabase;
    const boutonFavori = document.querySelector('.btn-favori');

    // V8.2 : aucun cœur automatique dans la boutique.
    // Les favoris sont créés uniquement depuis une fiche produit,
    // après sélection de la variante.
    if (!boutonFavori) {
      return;
    }

    if (!supabase) {
      console.warn(
        '[TRIÈDRE] Favoris indisponibles : client Supabase non initialisé.'
      );
      return;
    }

    initialiserFavorisProduit(supabase, boutonFavori);
  });

  async function initialiserFavorisProduit(supabase, boutonFavori) {
    const parametresUrl = new URLSearchParams(window.location.search);
    const productId = parametresUrl.get('id');
    const skuDepuisUrl = parametresUrl.get('sku');
    const couleurDepuisUrl = parametresUrl.get('couleur');
    const tailleDepuisUrl = parametresUrl.get('taille');

    if (!productId) {
      return;
    }

    let produit = null;
    let couleurConfirmee = false;
    let tailleConfirmee = false;

    try {
      produit = await chargerProduit(productId);
    } catch (error) {
      console.error('[TRIÈDRE] Catalogue favoris :', error);
      return;
    }

    const couleurs = valeursUniques(
      (produit.variantes || [])
        .filter(function (v) { return v.actif !== false; })
        .map(function (v) { return v.couleur; })
    );

    const tailles = valeursUniques(
      (produit.variantes || [])
        .filter(function (v) { return v.actif !== false; })
        .map(function (v) { return v.taille; })
    );

    // Un seul choix possible = choix implicite acceptable.
    couleurConfirmee = couleurs.length <= 1;
    tailleConfirmee = tailles.length <= 1;

    const listeCouleurs = document.getElementById('couleur-options-liste');
    const listeTailles = document.getElementById('taille-options-liste');

    if (listeCouleurs) {
      listeCouleurs.addEventListener('click', function (event) {
        const bouton = event.target.closest('.couleur-swatch');

        if (!bouton || bouton.disabled) {
          return;
        }

        couleurConfirmee = true;

        // Une nouvelle couleur implique un nouveau choix de taille
        // sauf si cette couleur n'offre qu'une seule taille.
        window.setTimeout(function () {
          const taillesDisponibles =
            document.querySelectorAll('.taille-btn:not([disabled])');

          tailleConfirmee = taillesDisponibles.length <= 1;
          synchroniserEtatBoutonPourSelection();
        }, 0);
      });
    }

    if (listeTailles) {
      listeTailles.addEventListener('click', function (event) {
        const bouton = event.target.closest('.taille-btn');

        if (!bouton || bouton.disabled) {
          return;
        }

        tailleConfirmee = true;

        window.setTimeout(function () {
          synchroniserEtatBoutonPourSelection();
        }, 0);
      });
    }

    // Si l'utilisateur arrive depuis « Mes favoris », on restaure
    // automatiquement la variante exacte avant d'évaluer le cœur.
    if (skuDepuisUrl || (couleurDepuisUrl && tailleDepuisUrl)) {
      const varianteDemandee =
        trouverVarianteDemandee(
          produit,
          skuDepuisUrl,
          couleurDepuisUrl,
          tailleDepuisUrl
        );

      if (varianteDemandee) {
        const restauree = await restaurerVarianteDansInterface(varianteDemandee);

        if (restauree) {
          couleurConfirmee = true;
          tailleConfirmee = true;
          await synchroniserEtatBoutonPourSelection();
        }
      }
    }

    // Prend la main avant l'ancien faux comportement local de produits.js.
    boutonFavori.addEventListener(
      'click',
      async function (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (!couleurConfirmee || !tailleConfirmee) {
          notifier(
            messageSelectionManquante(couleurConfirmee, tailleConfirmee),
            'avertissement'
          );
          return;
        }

        const variante = trouverVarianteSelectionnee(produit);

        if (!variante) {
          notifier(
            'Sélectionne une couleur et une taille avant d’ajouter ce produit aux favoris.',
            'avertissement'
          );
          return;
        }

        await basculerFavori(supabase, boutonFavori, produit, variante);
      },
      true
    );

    // Si une taille unique a déjà été activée automatiquement.
    window.setTimeout(function () {
      const boutonTailleActif = document.querySelector('.taille-btn.active');
      const boutonsTailleDisponibles =
        document.querySelectorAll('.taille-btn:not([disabled])');

      if (
        boutonTailleActif &&
        boutonsTailleDisponibles.length <= 1
      ) {
        tailleConfirmee = true;
      }

      synchroniserEtatBoutonPourSelection();
    }, 150);

    async function synchroniserEtatBoutonPourSelection() {
      if (!couleurConfirmee || !tailleConfirmee) {
        definirEtatBouton(boutonFavori, false);
        return;
      }

      const variante = trouverVarianteSelectionnee(produit);

      if (!variante) {
        definirEtatBouton(boutonFavori, false);
        return;
      }

      try {
        const user = await obtenirUtilisateur(supabase);

        if (!user) {
          definirEtatBouton(boutonFavori, false);
          return;
        }

        const existe = await favoriExisteParSku(
          supabase,
          user.id,
          variante.sku
        );

        definirEtatBouton(boutonFavori, existe);
      } catch (error) {
        console.warn('[TRIÈDRE] État favori :', error);
      }
    }
  }

  async function basculerFavori(
    supabase,
    bouton,
    produit,
    variante
  ) {
    if (bouton.dataset.favoriChargement === '1') {
      return;
    }

    bouton.dataset.favoriChargement = '1';
    bouton.disabled = true;

    try {
      const user = await obtenirUtilisateur(supabase);

      if (!user) {
        ouvrirModalConnexionFavoris();
        return;
      }

      const existe = await favoriExisteParSku(
        supabase,
        user.id,
        variante.sku
      );

      if (existe) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('sku', variante.sku);

        if (error) {
          throw error;
        }

        definirEtatBouton(bouton, false);
        notifier('Variante retirée de tes favoris.', 'succes');
        return;
      }

      const image =
        (document.getElementById('image-principale') || {}).src || '';

      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          product_id: produit.id,
          variant_id: variante.id,
          sku: variante.sku,
          product_name: produit.nom,
          color: variante.couleur,
          size: variante.taille,
          product_url:
            'produit?id=' +
            encodeURIComponent(produit.id) +
            '&sku=' +
            encodeURIComponent(variante.sku) +
            '&couleur=' +
            encodeURIComponent(variante.couleur) +
            '&taille=' +
            encodeURIComponent(variante.taille),
          image_url: image,
          price: Number(variante.prix),
          currency: variante.devise || 'CAD'
        });

      if (error) {
        // Une double insertion sur le même SKU ne doit pas casser l'UX.
        if (String(error.code) === '23505') {
          definirEtatBouton(bouton, true);
          notifier('Cette variante est déjà dans tes favoris.', 'info');
          return;
        }

        throw error;
      }

      definirEtatBouton(bouton, true);

      notifier(
        produit.nom +
          ' — ' +
          variante.couleur +
          ' — ' +
          variante.taille +
          ' ajouté à tes favoris.',
        'succes'
      );
    } catch (error) {
      console.error('[TRIÈDRE] Favoris variante :', error);
      notifier(
        'Impossible de mettre à jour tes favoris pour le moment.',
        'erreur'
      );
    } finally {
      bouton.dataset.favoriChargement = '0';
      bouton.disabled = false;
    }
  }

  function trouverVarianteDemandee(
    produit,
    sku,
    couleur,
    taille
  ) {
    const variantes = (produit.variantes || []).filter(function (variante) {
      return variante.actif !== false;
    });

    if (sku) {
      const parSku = variantes.find(function (variante) {
        return variante.sku === sku;
      });

      if (parSku) {
        return parSku;
      }
    }

    if (couleur && taille) {
      return variantes.find(function (variante) {
        return (
          variante.couleur === couleur &&
          variante.taille === taille
        );
      }) || null;
    }

    return null;
  }

  async function restaurerVarianteDansInterface(variante) {
    const controlesPrets = await attendreControlesProduit();

    if (!controlesPrets) {
      console.warn(
        '[TRIÈDRE] Impossible de restaurer la variante : contrôles produit absents.'
      );
      return false;
    }

    const boutonCouleur = Array.from(
      document.querySelectorAll('.couleur-swatch')
    ).find(function (bouton) {
      return (
        (bouton.getAttribute('data-couleur') || '').trim() ===
        variante.couleur
      );
    });

    // Un produit peut n'avoir qu'une seule couleur et masquer les swatches.
    if (boutonCouleur) {
      boutonCouleur.click();

      // Le clic couleur peut reconstruire entièrement la liste des tailles.
      await attendreProchainePeinture();
      await attendreTaille(variante.taille);
    } else {
      const couleurAffichee =
        ((document.getElementById('couleur-selectionnee') || {}).textContent || '')
          .trim();

      if (couleurAffichee !== variante.couleur) {
        return false;
      }
    }

    const boutonTaille = Array.from(
      document.querySelectorAll('.taille-btn')
    ).find(function (bouton) {
      return (
        (bouton.getAttribute('data-taille') || bouton.textContent || '').trim() ===
        variante.taille
      );
    });

    if (!boutonTaille) {
      return false;
    }

    // Même une variante actuellement indisponible doit pouvoir être
    // restaurée pour consultation depuis les favoris.
    if (boutonTaille.disabled) {
      document.querySelectorAll('.taille-btn').forEach(function (bouton) {
        bouton.classList.remove('active');
      });
      boutonTaille.classList.add('active');
      boutonTaille.dispatchEvent(
        new CustomEvent('triedre:favori-variante-restauree', {
          bubbles: true
        })
      );
    } else {
      boutonTaille.click();
    }

    await attendreProchainePeinture();

    const couleurFinale =
      ((document.getElementById('couleur-selectionnee') || {}).textContent || '')
        .trim();

    const tailleFinale = document.querySelector('.taille-btn.active');
    const tailleFinaleValeur = tailleFinale
      ? (
          tailleFinale.getAttribute('data-taille') ||
          tailleFinale.textContent ||
          ''
        ).trim()
      : '';

    return (
      couleurFinale === variante.couleur &&
      tailleFinaleValeur === variante.taille
    );
  }

  function attendreControlesProduit() {
    return new Promise(function (resolve) {
      let essais = 0;

      const timer = window.setInterval(function () {
        essais += 1;

        const nom = document.getElementById('produit-nom');
        const couleur = document.getElementById('couleur-selectionnee');
        const tailles = document.getElementById('taille-options-liste');

        const pret =
          nom &&
          nom.textContent.trim() &&
          nom.textContent.trim().toLowerCase() !== 'chargement...' &&
          couleur &&
          tailles &&
          tailles.children.length > 0;

        if (pret || essais >= 50) {
          window.clearInterval(timer);
          resolve(Boolean(pret));
        }
      }, 80);
    });
  }

  function attendreTaille(taille) {
    return new Promise(function (resolve) {
      let essais = 0;

      const timer = window.setInterval(function () {
        essais += 1;

        const existe = Array.from(
          document.querySelectorAll('.taille-btn')
        ).some(function (bouton) {
          return (
            (bouton.getAttribute('data-taille') || bouton.textContent || '')
              .trim() === taille
          );
        });

        if (existe || essais >= 25) {
          window.clearInterval(timer);
          resolve(existe);
        }
      }, 40);
    });
  }

  function attendreProchainePeinture() {
    return new Promise(function (resolve) {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(resolve);
      });
    });
  }

  function trouverVarianteSelectionnee(produit) {
    const couleur =
      ((document.getElementById('couleur-selectionnee') || {}).textContent || '')
        .trim();

    const boutonTaille = document.querySelector('.taille-btn.active');

    if (!couleur || !boutonTaille) {
      return null;
    }

    const taille =
      (boutonTaille.getAttribute('data-taille') || boutonTaille.textContent || '')
        .trim();

    if (!taille) {
      return null;
    }

    return (produit.variantes || []).find(function (variante) {
      return (
        variante.actif !== false &&
        variante.couleur === couleur &&
        variante.taille === taille
      );
    }) || null;
  }

  function messageSelectionManquante(couleurOk, tailleOk) {
    if (!couleurOk && !tailleOk) {
      return 'Sélectionne une couleur et une taille avant d’ajouter ce produit aux favoris.';
    }

    if (!couleurOk) {
      return 'Sélectionne une couleur avant d’ajouter ce produit aux favoris.';
    }

    return 'Sélectionne une taille avant d’ajouter ce produit aux favoris.';
  }

  async function chargerProduit(productId) {
    const response = await fetch('../04-data/produits.json');

    if (!response.ok) {
      throw new Error('Impossible de charger produits.json');
    }

    const donnees = await response.json();
    const produit = (donnees.produits || []).find(function (item) {
      return item.id === productId;
    });

    if (!produit) {
      throw new Error('Produit introuvable');
    }

    return produit;
  }

  async function obtenirUtilisateur(supabase) {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return user || null;
  }

  async function favoriExisteParSku(supabase, userId, sku) {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('sku', sku)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return Boolean(data);
  }

  function definirEtatBouton(bouton, actif) {
    bouton.classList.toggle('is-active', actif);
    bouton.setAttribute('aria-pressed', actif ? 'true' : 'false');
    bouton.setAttribute(
      'aria-label',
      actif ? 'Retirer des favoris' : 'Ajouter aux favoris'
    );

    const texte = bouton.querySelector('.btn-favori-texte');
    const icone = bouton.querySelector('.btn-favori-icone');

    if (texte) {
      texte.textContent = actif
        ? 'Ajouté aux favoris'
        : 'Ajouter aux favoris';
    }

    if (icone) {
      icone.textContent = actif ? '♥' : '♡';
    }
  }

  function notifier(message, type) {
    if (typeof window.afficherToast === 'function') {
      window.afficherToast(message, type);
      return;
    }

    let toast = document.getElementById('favoris-toast-v82');

    if (toast) {
      toast.remove();
    }

    toast = document.createElement('div');
    toast.id = 'favoris-toast-v82';
    toast.textContent = message;
    toast.style.cssText =
      'position:fixed;top:20px;right:20px;z-index:4000;max-width:380px;' +
      'padding:14px 16px;border:1px solid rgba(212,175,55,.65);' +
      'border-radius:8px;background:#222;color:#fff;';

    document.body.appendChild(toast);

    window.setTimeout(function () {
      toast.remove();
    }, 3000);
  }

  function ouvrirModalConnexionFavoris() {
    let modal = document.getElementById('favoris-auth-modal-v82');

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'favoris-auth-modal-v82';
      modal.innerHTML =
        '<div data-fermer-favoris-v82 style="position:absolute;inset:0;background:rgba(0,0,0,.72)"></div>' +
        '<section role="dialog" aria-modal="true" style="position:relative;z-index:1;width:min(520px,calc(100% - 32px));padding:24px;border:1px solid rgba(255,255,255,.16);border-radius:10px;background:#222;color:#fff">' +
          '<button type="button" data-fermer-favoris-v82 aria-label="Fermer" style="position:absolute;right:16px;top:12px;border:0;background:none;color:#fff;font-size:26px;cursor:pointer">×</button>' +
          '<p class="section-eyebrow">Espace membre</p>' +
          '<h2>Enregistre tes favoris.</h2>' +
          '<p>Connecte-toi ou crée ton compte TRIÈDRE pour enregistrer cette variante.</p>' +
          '<a class="btn btn-primary" href="membre">Se connecter / créer un compte</a>' +
        '</section>';

      modal.style.cssText =
        'position:fixed;inset:0;z-index:3900;display:grid;place-items:center;';

      document.body.appendChild(modal);

      modal.querySelectorAll('[data-fermer-favoris-v82]').forEach(function (el) {
        el.addEventListener('click', function () {
          modal.hidden = true;
        });
      });
    }

    modal.hidden = false;
  }

  function valeursUniques(liste) {
    return liste.filter(function (valeur, index) {
      return liste.indexOf(valeur) === index;
    });
  }
})();
