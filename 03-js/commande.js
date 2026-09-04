// ==========================================================================
// TRIÈDRE — Page de commande (checkout simulé)
// Choix du mode de commande + validation adaptative internationale
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {

  const conteneur = document.getElementById('commande-contenu');
  if (!conteneur) return;

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
            <div class="panier-total">
              <span>Total</span>
              <span class="accent">${total} $</span>
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

    formulaire.addEventListener('submit', function (e) {
      e.preventDefault();

      const nom = document.getElementById('cmd-nom');
      const email = document.getElementById('cmd-email');
      const adresse = document.getElementById('cmd-adresse');
      const ville = document.getElementById('cmd-ville');
      const region = document.getElementById('cmd-region');
      const telephone = document.getElementById('cmd-telephone');

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

      afficherConfirmation();
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

  function afficherConfirmation() {
    const numeroCommande = 'TRD-' + Math.floor(100000 + Math.random() * 900000);

    conteneur.innerHTML = `
      <div class="commande-confirmation">
        <p class="commande-confirmation-icone">✓</p>
        <h2>Merci pour ta commande !</h2>
        <p>Ta commande <strong>#${numeroCommande}</strong> a bien été enregistrée.</p>
        <p>Un courriel de confirmation te sera envoyé sous peu avec les détails de livraison.</p>
        <a href="./" class="btn btn-primary">Retour à l’accueil</a>
      </div>
    `;

    viderPanier();
  }

});
