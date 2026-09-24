// ==========================================================================
// TRIÈDRE — Page de commande
// Commande réelle + redirection Stripe Checkout
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {

  const conteneur = document.getElementById('commande-contenu');
  if (!conteneur) return;

  const parametresUrl = new URLSearchParams(window.location.search);

  if (parametresUrl.get('stripe') === 'success') {
    verifierRetourStripe();
    return;
  }

  const provincesCanada = [
    'Alberta',
    'Colombie-Britannique',
    'Île-du-Prince-Édouard',
    'Manitoba',
    'Nouveau-Brunswick',
    'Nouvelle-Écosse',
    'Ontario',
    'Québec',
    'Saskatchewan',
    'Terre-Neuve-et-Labrador',
    'Territoires du Nord-Ouest',
    'Nunavut',
    'Yukon'
  ];

  const etatsUnis = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'Californie',
    'Caroline du Nord', 'Caroline du Sud', 'Colorado', 'Connecticut',
    'Dakota du Nord', 'Dakota du Sud', 'Delaware', 'District de Columbia',
    'Floride', 'Géorgie', 'Hawaï', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiane', 'Maine', 'Maryland', 'Massachusetts',
    'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska',
    'Nevada', 'New Hampshire', 'New Jersey', 'New York', 'Nouveau-Mexique',
    'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvanie', 'Rhode Island',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginie',
    'Virginie-Occidentale', 'Washington', 'Wisconsin', 'Wyoming'
  ];


  const etatsMexique = [
    'Aguascalientes', 'Basse-Californie', 'Basse-Californie du Sud',
    'Campeche', 'Chiapas', 'Chihuahua', 'Coahuila', 'Colima',
    'Durango', 'État de Mexico', 'Guanajuato', 'Guerrero', 'Hidalgo',
    'Jalisco', 'Mexico', 'Michoacán', 'Morelos', 'Nayarit',
    'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo',
    'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas',
    'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
  ];

  afficherChoixCommande();

  function afficherChoixCommande() {
    const panier = getPanier();

    if (panier.length === 0) {
      afficherPanierVide();
      return;
    }

    conteneur.innerHTML = `
      <div class="commande-acces">
        <div class="commande-acces-intro">
          <p class="section-eyebrow">Étape suivante</p>
          <h2>Comment veux-tu passer ta commande ?</h2>
          <p>Connecte-toi à ton compte TRIÈDRE, crée un compte ou continue simplement en tant qu’invité.</p>
        </div>

        <div class="commande-acces-options">
          <div class="commande-acces-carte">
            <h3>Déjà membre</h3>
            <p>Connecte-toi pour retrouver ton espace et faciliter tes prochaines commandes.</p>
            <a href="membre" class="btn btn-primary">Se connecter</a>
          </div>

          <div class="commande-acces-carte">
            <h3>Créer un compte</h3>
            <p>Inscris-toi pour rejoindre l’univers TRIÈDRE et préparer ton espace membre.</p>
            <a href="membre" class="btn btn-secondary">S’inscrire</a>
          </div>

          <div class="commande-acces-carte">
            <h3>Commander sans compte</h3>
            <p>Tu peux finaliser ton achat maintenant sans créer de compte.</p>
            <button type="button" class="btn btn-primary" id="commande-invite">Continuer en invité</button>
          </div>
        </div>
      </div>
    `;

    const boutonInvite = document.getElementById('commande-invite');
    boutonInvite.addEventListener('click', afficherPageCommande);
  }

  function afficherPanierVide() {
    conteneur.innerHTML = `
      <div class="panier-vide">
        <p>Ton panier est vide — impossible de passer commande.</p>
        <a href="boutique" class="btn btn-primary">Voir la boutique</a>
      </div>
    `;
  }

  function afficherPageCommande() {
    const panier = getPanier();

    if (panier.length === 0) {
      afficherPanierVide();
      return;
    }

    let articlesHTML = '';

    panier.forEach(function (item) {
      const sousTotal = (item.prix * item.quantite).toFixed(2);

      articlesHTML += `
        <div class="commande-article-resume">
          <img src="${item.image}" alt="${item.nom}">
          <div>
            <h4>${item.nom}</h4>
            <p>${item.couleur} — ${item.taille} — Qté ${item.quantite}</p>
          </div>
          <span class="commande-article-prix">${sousTotal} $</span>
        </div>
      `;
    });

    const total = totalPanier().toFixed(2);

    conteneur.innerHTML = `
      <div class="commande-layout">

        <form class="commande-formulaire" id="formulaire-commande" novalidate>
          <h2>Adresse de livraison</h2>
          <p class="commande-champs-obligatoires"><span aria-hidden="true">*</span> Champs obligatoires</p>

          <div class="champ-groupe">
            <label for="cmd-nom">Nom complet <span class="champ-obligatoire" aria-hidden="true">*</span></label>
            <input type="text" id="cmd-nom" autocomplete="name">
          </div>

          <div class="champ-groupe">
            <label for="cmd-email">Courriel <span class="champ-obligatoire" aria-hidden="true">*</span></label>
            <input type="email" id="cmd-email" autocomplete="email">
          </div>

          <div class="champ-groupe">
            <label for="cmd-pays">Pays <span class="champ-obligatoire" aria-hidden="true">*</span></label>
            <select id="cmd-pays" autocomplete="country-name">
              <option value="CA">Canada</option>
              <option value="US">États-Unis</option>
              <option value="MX">Mexique</option>
              <option value="OTHER">Autre pays</option>
            </select>
          </div>

          <div class="champ-groupe">
            <label for="cmd-adresse">Adresse <span class="champ-obligatoire" aria-hidden="true">*</span></label>
            <input type="text" id="cmd-adresse" autocomplete="street-address">
          </div>

          <div class="champ-ligne">
            <div class="champ-groupe">
              <label for="cmd-ville">Ville <span class="champ-obligatoire" aria-hidden="true">*</span></label>
              <input type="text" id="cmd-ville" autocomplete="address-level2">
            </div>

            <div class="champ-groupe">
              <label for="cmd-postal" id="cmd-postal-label">Code postal <span class="champ-obligatoire" aria-hidden="true">*</span></label>
              <input type="text" id="cmd-postal" autocomplete="postal-code" placeholder="A1A 1A1">
            </div>
          </div>

          <div class="champ-groupe" id="cmd-region-groupe"></div>

          <div class="champ-groupe">
            <label for="cmd-telephone">Téléphone <span class="champ-obligatoire" aria-hidden="true">*</span></label>
            <input type="tel" id="cmd-telephone" autocomplete="tel">
          </div>

          <button type="submit" class="btn btn-primary btn-confirmer-commande">Confirmer la commande</button>
        </form>

        <div class="commande-resume-colonne">
          <a href="panier" class="retour-panier">Retour au panier</a>

          <div class="commande-resume">
            <h2>Résumé</h2>
            <div class="commande-articles-liste">${articlesHTML}</div>

            <div class="commande-livraison" id="commande-livraison">
              <span>Livraison</span>
              <span id="commande-livraison-valeur">Calculée après l’adresse</span>
            </div>

            <div class="panier-total">
              <span>Total</span>
              <span class="accent" id="commande-total">${total} $</span>
            </div>
          </div>
        </div>

      </div>
    `;

    const formulaire = document.getElementById('formulaire-commande');
    const pays = document.getElementById('cmd-pays');
    const postal = document.getElementById('cmd-postal');
    const postalLabel = document.getElementById('cmd-postal-label');

    mettreAJourRegion();

    pays.addEventListener('change', function () {
      mettreAJourRegion();

      if (pays.value === 'US') {
        postalLabel.innerHTML = 'Code ZIP <span class="champ-obligatoire" aria-hidden="true">*</span>';
        postal.placeholder = '12345';
        return;
      }

      postalLabel.innerHTML = 'Code postal <span class="champ-obligatoire" aria-hidden="true">*</span>';

      if (pays.value === 'CA') {
        postal.placeholder = 'A1A 1A1';
      } else if (pays.value === 'MX') {
        postal.placeholder = '01234';
      } else {
        postal.placeholder = '';
      }
    });

    formulaire.addEventListener('submit', async function (e) {
      e.preventDefault();

      const nom = document.getElementById('cmd-nom');
      const email = document.getElementById('cmd-email');
      const adresse = document.getElementById('cmd-adresse');
      const ville = document.getElementById('cmd-ville');
      const region = document.getElementById('cmd-region');
      const telephone = document.getElementById('cmd-telephone');
      const bouton = formulaire.querySelector('.btn-confirmer-commande');

      if (!nom.value.trim()) {
        erreurChamp(nom, 'Indique ton nom complet.');
        return;
      }

      if (!estCourrielValide(email.value)) {
        erreurChamp(email, 'Entre une adresse courriel valide.');
        return;
      }

      if (!adresse.value.trim()) {
        erreurChamp(adresse, 'Indique ton adresse de livraison.');
        return;
      }

      if (!ville.value.trim()) {
        erreurChamp(ville, 'Indique ta ville.');
        return;
      }

      if (!region.value.trim()) {
        let messageRegion = 'Indique ton État, ta province ou ta région.';

        if (pays.value === 'CA') {
          messageRegion = 'Sélectionne ta province ou ton territoire.';
        } else if (pays.value === 'US' || pays.value === 'MX') {
          messageRegion = 'Sélectionne ton État.';
        }

        erreurChamp(region, messageRegion);
        return;
      }

      if (!estCodePostalValide(postal.value, pays.value)) {
        erreurChamp(postal, messageCodePostal(pays.value));
        return;
      }

      if (!estTelephoneValide(telephone.value, pays.value)) {
        erreurChamp(telephone, messageTelephone(pays.value));
        return;
      }

      const panier = getPanier();

      if (!panier.length) {
        afficherPanierVide();
        return;
      }

      const libelleBouton = bouton ? bouton.textContent : '';

      try {
        const livraisonValeur = document.getElementById('commande-livraison-valeur');

        if (livraisonValeur) {
          livraisonValeur.textContent = 'Calcul en cours...';
        }

        const reponseLivraison = await fetch('/08-php/tarifs-postes-canada.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            client: {
              pays: pays.value,
              region: region.value.trim(),
              ville: ville.value.trim(),
              code_postal: postal.value.trim(),
              adresse: adresse.value.trim()
            },
            panier: panier.map(function (item) {
              return {
                sku: item.sku,
                quantite: Number(item.quantite)
              };
            })
          })
        });

        const resultatLivraison = await lireJson(reponseLivraison);

        if (!reponseLivraison.ok || resultatLivraison.success !== true) {
          const detailPostesCanada =
            resultatLivraison.provider?.detail ||
            resultatLivraison.provider?.message ||
            resultatLivraison.provider?.title ||
            '';

          throw new Error(
            detailPostesCanada ||
            resultatLivraison.error ||
            resultatLivraison.message ||
            'Impossible de calculer la livraison.'
          );
        }

        const tarifsPostesCanada = extraireTarifsPostesCanada(resultatLivraison.canada_post);

        if (!tarifsPostesCanada.length) {
          throw new Error('Postes Canada n’a retourné aucun tarif de livraison.');
        }

        // V1 du checkout : on retient automatiquement le tarif disponible le moins cher.
        // Le choix explicite du service pourra être ajouté ensuite.
        tarifsPostesCanada.sort(function (a, b) {
          return a.montant - b.montant;
        });

        const tarifLivraison = tarifsPostesCanada[0];
        const totalAvecLivraison = Number(totalPanier()) + tarifLivraison.montant;

        if (livraisonValeur) {
          livraisonValeur.textContent =
            tarifLivraison.service + ' — ' +
            tarifLivraison.montant.toFixed(2) + ' $';
        }

        const totalCommande = document.getElementById('commande-total');
        if (totalCommande) {
          totalCommande.textContent = totalAvecLivraison.toFixed(2) + ' $';
        }


        if (bouton) {
          bouton.disabled = true;
          bouton.textContent = 'Préparation du paiement...';
        }

        const commandePayload = {
          client: {
            nom: nom.value.trim(),
            email: email.value.trim(),
            telephone: telephone.value.trim(),
            pays: pays.value,
            adresse: adresse.value.trim(),
            ville: ville.value.trim(),
            region: region.value.trim(),
            code_postal: postal.value.trim()
          },
          panier: panier.map(function (item) {
            return {
              sku: item.sku,
              quantite: Number(item.quantite)
            };
          })
        };

        const reponseCommande = await fetch('/08-php/creer-commande.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(commandePayload)
        });

        const resultatCommande = await lireJson(reponseCommande);

        if (!reponseCommande.ok || resultatCommande.success === false) {
          throw new Error(
            resultatCommande.error ||
            resultatCommande.message ||
            'Impossible de créer la commande.'
          );
        }

        const orderId =
          resultatCommande.order_id ||
          resultatCommande.id ||
          resultatCommande.order?.id ||
          resultatCommande.commande?.id;

        if (!orderId) {
          throw new Error('La commande a été créée, mais son identifiant est introuvable.');
        }

        if (bouton) {
          bouton.textContent = 'Ouverture du paiement sécurisé...';
        }

        const reponseStripe = await fetch('/08-php/creer-checkout-stripe.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ order_id: orderId })
        });

        const resultatStripe = await lireJson(reponseStripe);

        if (!reponseStripe.ok || resultatStripe.success === false) {
          throw new Error(
            resultatStripe.error ||
            resultatStripe.message ||
            'Impossible d’ouvrir le paiement Stripe.'
          );
        }

        const checkoutUrl =
          resultatStripe.url ||
          resultatStripe.checkout_url ||
          resultatStripe.session_url;

        if (!checkoutUrl) {
          throw new Error('Stripe n’a retourné aucune URL de paiement.');
        }

        window.location.assign(checkoutUrl);

      } catch (erreur) {
        const livraisonValeur = document.getElementById('commande-livraison-valeur');
        if (livraisonValeur && livraisonValeur.textContent.includes('cours')) {
          livraisonValeur.textContent = 'Non calculée';
        }

        console.error('[TRIÈDRE] Création de commande / Stripe :', erreur);

        afficherToast(
          erreur && erreur.message
            ? erreur.message
            : 'Impossible de préparer le paiement pour le moment.',
          'avertissement'
        );

        if (bouton) {
          bouton.disabled = false;
          bouton.textContent = libelleBouton || 'Confirmer la commande';
        }
      }
    });
  }

  function erreurChamp(champ, message) {
    afficherToast(message, 'avertissement');
    champ.focus();
  }

  function mettreAJourRegion() {
    const pays = document.getElementById('cmd-pays');
    const groupeRegion = document.getElementById('cmd-region-groupe');

    if (pays.value === 'CA') {
      groupeRegion.innerHTML = `
        <label for="cmd-region">Province ou territoire <span class="champ-obligatoire" aria-hidden="true">*</span></label>
        <select id="cmd-region" autocomplete="address-level1">
          <option value="">Sélectionner</option>
          ${optionsDepuisListe(provincesCanada, 'Québec')}
        </select>
      `;
      return;
    }

    if (pays.value === 'US') {
      groupeRegion.innerHTML = `
        <label for="cmd-region">État <span class="champ-obligatoire" aria-hidden="true">*</span></label>
        <select id="cmd-region" autocomplete="address-level1">
          <option value="">Sélectionner</option>
          ${optionsDepuisListe(etatsUnis)}
        </select>
      `;
      return;
    }

    if (pays.value === 'MX') {
      groupeRegion.innerHTML = `
        <label for="cmd-region">État <span class="champ-obligatoire" aria-hidden="true">*</span></label>
        <select id="cmd-region" autocomplete="address-level1">
          <option value="">Sélectionner</option>
          ${optionsDepuisListe(etatsMexique)}
        </select>
      `;
      return;
    }

    groupeRegion.innerHTML = `
      <label for="cmd-region">État, province ou région <span class="champ-obligatoire" aria-hidden="true">*</span></label>
      <input type="text" id="cmd-region" autocomplete="address-level1">
    `;
  }

  function optionsDepuisListe(liste, selection) {
    return liste.map(function (element) {
      const selected = element === selection ? ' selected' : '';
      return `<option value="${element}"${selected}>${element}</option>`;
    }).join('');
  }

  function estCourrielValide(valeur) {
    const courriel = valeur.trim();

    if (!courriel || courriel.length > 254) return false;

    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(courriel);
  }

  function estCodePostalValide(valeur, pays) {
    const code = valeur.trim();

    if (pays === 'CA') {
      return /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z][ -]?\d[ABCEGHJ-NPRSTV-Z]\d$/i.test(code);
    }

    if (pays === 'US') {
      return /^\d{5}(-\d{4})?$/.test(code);
    }

    if (pays === 'MX') {
      return /^\d{5}$/.test(code);
    }

    return /^[A-Za-z0-9][A-Za-z0-9 -]{1,10}[A-Za-z0-9]$/.test(code);
  }

  function messageCodePostal(pays) {
    if (pays === 'CA') {
      return 'Entre un code postal canadien valide, par exemple H2X 1Y4.';
    }

    if (pays === 'US') {
      return 'Entre un code ZIP valide, par exemple 10001 ou 10001-1234.';
    }

    if (pays === 'MX') {
      return 'Entre un code postal mexicain valide à 5 chiffres.';
    }

    return 'Entre un code postal valide.';
  }

  function estTelephoneValide(valeur, pays) {
    const chiffres = valeur.trim().replace(/\D/g, '');

    if (!chiffres) return false;

    if (pays === 'CA' || pays === 'US') {
      const sansIndicatif = chiffres.length === 11 && chiffres.startsWith('1')
        ? chiffres.slice(1)
        : chiffres;

      return sansIndicatif.length === 10 &&
        /^[2-9]\d{2}[2-9]\d{6}$/.test(sansIndicatif);
    }

    if (pays === 'MX') {
      const sansIndicatif = chiffres.length === 12 && chiffres.startsWith('52')
        ? chiffres.slice(2)
        : chiffres;

      return sansIndicatif.length === 10 && /^\d{10}$/.test(sansIndicatif);
    }

    return /^\d{10,15}$/.test(chiffres);
  }

  function messageTelephone(pays) {
    if (pays === 'CA' || pays === 'US') {
      return 'Entre un numéro de téléphone nord-américain valide à 10 chiffres.';
    }

    if (pays === 'MX') {
      return 'Entre un numéro de téléphone mexicain valide à 10 chiffres.';
    }

    return 'Entre un numéro de téléphone valide de 10 à 15 chiffres, avec indicatif international si nécessaire.';
  }

  function extraireTarifsPostesCanada(donnees) {
    if (!donnees || typeof donnees !== 'object') return [];

    const candidats = [];

    function parcourir(valeur) {
      if (Array.isArray(valeur)) {
        valeur.forEach(parcourir);
        return;
      }

      if (!valeur || typeof valeur !== 'object') return;

      const service =
        valeur.serviceName ||
        valeur.service ||
        valeur.name ||
        valeur.serviceCode ||
        valeur.service_code ||
        '';

      const montantBrut =
        valeur.totalPrice ??
        valeur.price ??
        valeur.amount ??
        valeur.due ??
        valeur.total ??
        valeur.totalCharge ??
        valeur.total_charge;

      const montant = Number(montantBrut);

      if (service && Number.isFinite(montant) && montant >= 0) {
        candidats.push({
          service: String(service),
          montant: montant
        });
      }

      Object.values(valeur).forEach(parcourir);
    }

    parcourir(donnees);

    const uniques = [];
    const vus = new Set();

    candidats.forEach(function (tarif) {
      const cle = tarif.service + '|' + tarif.montant.toFixed(2);
      if (!vus.has(cle)) {
        vus.add(cle);
        uniques.push(tarif);
      }
    });

    return uniques;
  }

  async function lireJson(response) {
    const texte = await response.text();

    if (!texte) return {};

    try {
      return JSON.parse(texte);
    } catch (erreur) {
      console.error('[TRIÈDRE] Réponse serveur non JSON :', texte);
      throw new Error('Réponse inattendue du serveur.');
    }
  }

  async function verifierRetourStripe() {
    const sessionId = parametresUrl.get('session_id');

    if (!sessionId) {
      afficherEchecConfirmation(
        'Impossible de vérifier ce paiement. L’identifiant de session est manquant.'
      );
      return;
    }

    afficherVerificationPaiement();

    // Le webhook Stripe peut arriver quelques instants après le retour du client.
    // On attend donc brièvement la confirmation serveur.
    const maxTentatives = 8;

    for (let tentative = 1; tentative <= maxTentatives; tentative += 1) {
      try {
        const reponse = await fetch(
          '/08-php/verifier-paiement-stripe.php?session_id=' +
          encodeURIComponent(sessionId),
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            },
            cache: 'no-store'
          }
        );

        const resultat = await lireJson(reponse);

        if (reponse.ok && resultat.success === true && resultat.paid === true) {
          // Le panier est vidé UNIQUEMENT après confirmation serveur.
          viderPanier();
          afficherConfirmationPaiement(resultat.order_number || '');
          return;
        }

        if (resultat.status === 'pending' && tentative < maxTentatives) {
          await attendre(900);
          continue;
        }

        throw new Error(
          resultat.error ||
          resultat.message ||
          'La confirmation du paiement n’est pas encore disponible.'
        );

      } catch (erreur) {
        if (tentative < maxTentatives) {
          await attendre(900);
          continue;
        }

        console.error('[TRIÈDRE] Vérification retour Stripe :', erreur);

        afficherEchecConfirmation(
          'Ton paiement est en cours de vérification. Actualise cette page dans quelques instants.'
        );
      }
    }
  }

  function afficherVerificationPaiement() {
    conteneur.innerHTML = `
      <div class="commande-confirmation">
        <p class="commande-confirmation-icone">✓</p>
        <h2>Confirmation en cours...</h2>
        <p>Nous vérifions ton paiement et finalisons ta commande.</p>
      </div>
    `;
  }

  function afficherConfirmationPaiement(numeroCommande) {
    const reference = numeroCommande
      ? `<p>Ta commande <strong>#${numeroCommande}</strong> est confirmée.</p>`
      : '<p>Ta commande TRIÈDRE est confirmée.</p>';

    conteneur.innerHTML = `
      <div class="commande-confirmation">
        <p class="commande-confirmation-icone">✓</p>
        <h2>Merci pour ta commande !</h2>
        <p>Ton paiement a été traité avec succès.</p>
        ${reference}
        <p>Un courriel de confirmation arrive sous peu avec tous les détails.</p>
        <a href="./" class="btn btn-primary">Retour à l’accueil</a>
      </div>
    `;
  }

  function afficherEchecConfirmation(message) {
    conteneur.innerHTML = `
      <div class="commande-confirmation">
        <h2>Vérification du paiement</h2>
        <p>${message}</p>
        <a href="commande" class="btn btn-primary">Actualiser</a>
      </div>
    `;
  }

  function attendre(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

});
