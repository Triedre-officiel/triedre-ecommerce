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

  const clientSupabase = window.triedreSupabase || null;
  let membreActuel = null;
  let adresseMembre = null;
  let profilMembre = null;
  let modeMembre = false;
  let modificationAdresseMembre = false;

  // Jeton Supabase transmis uniquement pour une commande membre.
  async function entetesCreationCommande() {
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
    if (!modeMembre) return headers;
    if (!clientSupabase) throw new Error('Session membre indisponible. Reconnecte-toi.');
    const { data, error } = await clientSupabase.auth.getSession();
    const accessToken = data?.session?.access_token;
    if (error || !accessToken) throw new Error('Ta session a expiré. Reconnecte-toi avant de commander.');
    headers.Authorization = 'Bearer ' + accessToken;
    return headers;
  }

  initialiserCommande();

  async function initialiserCommande() {
    if (!clientSupabase) return afficherChoixCommande();
    try {
      const { data: { user }, error } = await clientSupabase.auth.getUser();
      if (error || !user) return afficherChoixCommande();
      membreActuel = user;
      modeMembre = true;
      const [adresses, profil] = await Promise.all([
        clientSupabase.from('member_addresses').select('*').eq('user_id', user.id)
          .order('is_default', { ascending: false }).order('created_at', { ascending: true }),
        clientSupabase.from('profiles').select('first_name,last_name,phone').eq('id', user.id).maybeSingle()
      ]);
      if (adresses.error) throw adresses.error;
      adresseMembre = (adresses.data || [])[0] || null;
      profilMembre = profil.error ? null : profil.data;
      if (adresseMembre) afficherAdresseMembre();
      else afficherPageCommande();
    } catch (error) {
      console.error('[TRIÈDRE] Lecture adresse membre :', error);
      modeMembre = false;
      afficherChoixCommande();
      afficherToast('Impossible de charger ton adresse enregistrée. Tu peux continuer en invité.', 'avertissement');
    }
  }

  function afficherAdresseMembre() {
    if (!getPanier().length) return afficherPanierVide();
    const a = adresseMembre;
    const nom = [a.first_name, a.last_name].filter(Boolean).join(' ');
    conteneur.innerHTML = `
      <div class="commande-etape-final">
        <div class="commande-resume-final">
          <p class="section-eyebrow">Adresse enregistrée</p>
          <h2>Confirmer mon adresse</h2>
          <div class="commande-adresse-confirmee">
            <strong>${echapperHTML(nom)}</strong>
            <span>${echapperHTML(a.address_line1 || '')}</span>
            ${a.address_line2 ? `<span>${echapperHTML(a.address_line2)}</span>` : ''}
            <span>${echapperHTML(a.city || '')}, ${echapperHTML(a.province || '')} ${echapperHTML(a.postal_code || '')}</span>
            <span>${echapperHTML(a.phone || '')}</span>
          </div>
          <div class="commande-membre-actions">
            <button type="button" class="btn btn-secondary" id="commande-modifier-membre">Modifier l’adresse</button>
            <button type="button" class="btn btn-primary" id="commande-confirmer-membre">Confirmer mon adresse</button>
          </div>
        </div>
      </div>`;
    document.getElementById('commande-modifier-membre').addEventListener('click', () => {
      modificationAdresseMembre = true;
      afficherPageCommande();
    });
    document.getElementById('commande-confirmer-membre').addEventListener('click', confirmerAdresseEnregistree);

  }

  // Confirmation directe : aucun formulaire intermédiaire n'est affiché.
  async function confirmerAdresseEnregistree() {
    const bouton = document.getElementById('commande-confirmer-membre');
    if (!bouton || bouton.disabled || !adresseMembre || !membreActuel) return;
    const a = adresseMembre;
    const profil = profilMembre || {};
    const pays = String(a.country_code || 'CA').trim().toUpperCase();
    const nomsProvinces = {
      AB: 'Alberta', BC: 'Colombie-Britannique', PE: 'Île-du-Prince-Édouard',
      MB: 'Manitoba', NB: 'Nouveau-Brunswick', NS: 'Nouvelle-Écosse',
      ON: 'Ontario', QC: 'Québec', SK: 'Saskatchewan',
      NL: 'Terre-Neuve-et-Labrador', NT: 'Territoires du Nord-Ouest',
      NU: 'Nunavut', YT: 'Yukon'
    };
    const variantes = {
      britishcolumbia: 'BC', princeedwardisland: 'PE', newbrunswick: 'NB',
      novascotia: 'NS', newfoundlandandlabrador: 'NL', northwestterritories: 'NT'
    };
    const normaliser = valeur => String(valeur || '').normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const provinceBrute = String(a.province || '').trim();
    const codeProvince = nomsProvinces[provinceBrute.toUpperCase()]
      ? provinceBrute.toUpperCase() : variantes[normaliser(provinceBrute)];
    const province = pays === 'CA' && codeProvince ? nomsProvinces[codeProvince] : provinceBrute;
    const client = {
      nom: [a.first_name || profil.first_name, a.last_name || profil.last_name].filter(Boolean).join(' ').trim(),
      email: membreActuel.email || '',
      telephone: String(a.phone || profil.phone || '').trim(),
      pays,
      adresse: [a.address_line1, a.address_line2].filter(Boolean).join(', ').trim(),
      ville: String(a.city || '').trim(),
      region: province,
      code_postal: String(a.postal_code || '').trim()
    };
    if (!client.nom || !estCourrielValide(client.email) || !client.adresse ||
        !client.ville || !client.region || !estCodePostalValide(client.code_postal, pays) ||
        !estTelephoneValide(client.telephone, pays) ||
        (pays === 'CA' && !provincesCanada.includes(client.region))) {
      afficherToast('Certaines informations de ton adresse sont incomplètes. Clique sur « Modifier l’adresse » pour les corriger.', 'avertissement');
      return;
    }
    const panier = getPanier();
    if (!panier.length) return afficherPanierVide();
    bouton.disabled = true;
    bouton.textContent = 'Calcul de livraison en cours…';
    try {
      const reponse = await fetch('/08-php/tarifs-postes-canada.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          client: {
            pays: client.pays, region: client.region, ville: client.ville,
            code_postal: client.code_postal, adresse: client.adresse
          },
          panier: panier.map(item => ({ sku: item.sku, quantite: Number(item.quantite) }))
        })
      });
      const resultat = await lireJson(reponse);
      if (!reponse.ok || resultat.success !== true) {
        throw new Error(resultat.provider?.detail || resultat.error || resultat.message || 'Impossible de calculer la livraison.');
      }
      const tarifs = extraireTarifsPostesCanada(resultat.canada_post);
      if (!tarifs.length) throw new Error('Postes Canada n’a retourné aucun tarif de livraison.');
      tarifs.sort((a, b) => a.montant - b.montant);
      afficherResumeFinal(client, panier, tarifs[0]);
    } catch (erreur) {
      console.error('[TRIÈDRE] Confirmation adresse membre :', erreur);
      afficherToast(erreur?.message || 'Impossible de valider ton adresse pour le moment.', 'avertissement');
    } finally {
      if (bouton.isConnected) {
        bouton.disabled = false;
        bouton.textContent = 'Confirmer mon adresse';
      }
    }
  }

  function preRemplirAdresseMembre() {
    if (!modeMembre) return;
    const a = adresseMembre || {};
    const profil = profilMembre || {};
    const valeurs = {
      'cmd-nom': [a.first_name || profil.first_name, a.last_name || profil.last_name].filter(Boolean).join(' '),
      'cmd-email': membreActuel?.email || '',
      'cmd-adresse': [a.address_line1, a.address_line2].filter(Boolean).join(', '),
      'cmd-ville': a.city || '',
      'cmd-postal': a.postal_code || '',
      'cmd-telephone': a.phone || profil.phone || ''
    };
    const pays = document.getElementById('cmd-pays');
    if (a.country_code && Array.from(pays.options).some(o => o.value === a.country_code)) {
      pays.value = a.country_code;
      mettreAJourRegion();
    }
    for (const [id, valeur] of Object.entries(valeurs)) {
      const champ = document.getElementById(id);
      if (champ) champ.value = valeur;
    }
    const region = document.getElementById('cmd-region');
    if (region && a.province) {
      const normaliser = valeur => String(valeur || '').normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const codesCanada = {
        AB: 'Alberta', BC: 'Colombie-Britannique', PE: 'Île-du-Prince-Édouard',
        MB: 'Manitoba', NB: 'Nouveau-Brunswick', NS: 'Nouvelle-Écosse',
        ON: 'Ontario', QC: 'Québec', SK: 'Saskatchewan',
        NL: 'Terre-Neuve-et-Labrador', NT: 'Territoires du Nord-Ouest',
        NU: 'Nunavut', YT: 'Yukon'
      };
      const variantesCanada = {
        'britishcolumbia': 'BC', 'princeedwardisland': 'PE',
        'newbrunswick': 'NB', 'novascotia': 'NS',
        'newfoundlandandlabrador': 'NL', 'northwestterritories': 'NT'
      };
      const brute = String(a.province).trim();
      const code = brute.toUpperCase();
      const codeEquivalent = codesCanada[code] ? code : variantesCanada[normaliser(brute)];
      const valeurRecherche = pays.value === 'CA' && codeEquivalent
        ? codesCanada[codeEquivalent] : brute;
      if (region.tagName === 'SELECT') {
        const option = Array.from(region.options).find(o =>
          normaliser(o.value) === normaliser(valeurRecherche));
        // Ne jamais conserver la province présélectionnée par défaut si elle ne correspond pas.
        region.value = option ? option.value : '';
      } else {
        region.value = valeurRecherche;
      }
    }
  }

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

          ${modificationAdresseMembre ? '<button type="button" class="btn btn-secondary" id="commande-annuler-modification">Annuler les modifications</button>' : ''}
           <button type="submit" class="btn btn-primary btn-confirmer-commande">${modificationAdresseMembre ? 'Confirmer cette nouvelle adresse' : 'Valider mon adresse'}</button>
        </form>

        <div class="commande-resume-colonne commande-resume-adresse-cache">
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

          <button type="button" class="btn btn-primary btn-passer-paiement" id="btn-passer-paiement" disabled>Passer au paiement</button>
        </div>

      </div>
    `;

    const formulaire = document.getElementById('formulaire-commande');
    const pays = document.getElementById('cmd-pays');
    const postal = document.getElementById('cmd-postal');
    const postalLabel = document.getElementById('cmd-postal-label');

    // Tarif validé par le client avant passage au paiement.
    let tarifLivraisonValide = null;
    let empreinteTarifLivraison = '';

    mettreAJourRegion();
    preRemplirAdresseMembre();

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

    function obtenirChampsCommande() {
      return {
        nom: document.getElementById('cmd-nom'),
        email: document.getElementById('cmd-email'),
        adresse: document.getElementById('cmd-adresse'),
        ville: document.getElementById('cmd-ville'),
        region: document.getElementById('cmd-region'),
        telephone: document.getElementById('cmd-telephone')
      };
    }

    function empreinteCommande(panier) {
      const champs = obtenirChampsCommande();
      return JSON.stringify({
        pays: pays.value,
        region: champs.region ? champs.region.value.trim() : '',
        ville: champs.ville.value.trim(),
        code_postal: postal.value.trim(),
        adresse: champs.adresse.value.trim(),
        panier: panier.map(function (item) {
          return { sku: item.sku, quantite: Number(item.quantite) };
        })
      });
    }

    function invaliderAdresseValidee() {
      if (!tarifLivraisonValide) return;
      tarifLivraisonValide = null;
      empreinteTarifLivraison = '';

      const livraisonValeur = document.getElementById('commande-livraison-valeur');
      const totalCommande = document.getElementById('commande-total');
      const boutonPaiement = document.getElementById('btn-passer-paiement');

      if (livraisonValeur) livraisonValeur.textContent = 'Calculée après l’adresse';
      if (totalCommande) totalCommande.textContent = totalPanier().toFixed(2) + ' $';
      if (boutonPaiement) boutonPaiement.disabled = true;
    }

    formulaire.addEventListener('input', invaliderAdresseValidee);
    formulaire.addEventListener('change', invaliderAdresseValidee);

    formulaire.addEventListener('submit', async function (e) {
      e.preventDefault();

      const champs = obtenirChampsCommande();
      const boutonAdresse = formulaire.querySelector('.btn-confirmer-commande');
      const boutonPaiement = document.getElementById('btn-passer-paiement');

      if (!champs.nom.value.trim()) return erreurChamp(champs.nom, 'Indique ton nom complet.');
      if (!estCourrielValide(champs.email.value)) return erreurChamp(champs.email, 'Entre une adresse courriel valide.');
      if (!champs.adresse.value.trim()) return erreurChamp(champs.adresse, 'Indique ton adresse de livraison.');
      if (!champs.ville.value.trim()) return erreurChamp(champs.ville, 'Indique ta ville.');
      if (!champs.region || !champs.region.value.trim()) {
        return erreurChamp(champs.region, pays.value === 'CA' ? 'Sélectionne ta province ou ton territoire.' : 'Indique ton État, ta province ou ta région.');
      }
      if (!estCodePostalValide(postal.value, pays.value)) return erreurChamp(postal, messageCodePostal(pays.value));
      if (!estTelephoneValide(champs.telephone.value, pays.value)) return erreurChamp(champs.telephone, messageTelephone(pays.value));

      const panier = getPanier();
      if (!panier.length) return afficherPanierVide();

      try {
        const livraisonValeur = document.getElementById('commande-livraison-valeur');
        const totalCommande = document.getElementById('commande-total');

        boutonAdresse.disabled = true;
        boutonAdresse.textContent = 'Validation en cours...';
        if (livraisonValeur) livraisonValeur.textContent = 'Calcul en cours...';

        const reponseLivraison = await fetch('/08-php/tarifs-postes-canada.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            client: {
              pays: pays.value,
              region: champs.region.value.trim(),
              ville: champs.ville.value.trim(),
              code_postal: postal.value.trim(),
              adresse: champs.adresse.value.trim()
            },
            panier: panier.map(function (item) {
              return { sku: item.sku, quantite: Number(item.quantite) };
            })
          })
        });

        const resultatLivraison = await lireJson(reponseLivraison);
        if (!reponseLivraison.ok || resultatLivraison.success !== true) {
          throw new Error(resultatLivraison.provider?.detail || resultatLivraison.error || resultatLivraison.message || 'Impossible de calculer la livraison.');
        }

        const tarifs = extraireTarifsPostesCanada(resultatLivraison.canada_post);
        if (!tarifs.length) throw new Error('Postes Canada n’a retourné aucun tarif de livraison.');
        tarifs.sort(function (a, b) { return a.montant - b.montant; });

        tarifLivraisonValide = tarifs[0];
        empreinteTarifLivraison = empreinteCommande(panier);
        const totalAvecLivraison = Number(totalPanier()) + tarifLivraisonValide.montant;

        if (livraisonValeur) livraisonValeur.textContent = tarifLivraisonValide.service + ' — ' + tarifLivraisonValide.montant.toFixed(2) + ' $';
        if (totalCommande) totalCommande.textContent = totalAvecLivraison.toFixed(2) + ' $';

        afficherResumeFinal({
          nom: champs.nom.value.trim(),
          email: champs.email.value.trim(),
          telephone: champs.telephone.value.trim(),
          pays: pays.value,
          adresse: champs.adresse.value.trim(),
          ville: champs.ville.value.trim(),
          region: champs.region.value.trim(),
          code_postal: postal.value.trim()
        }, panier, tarifLivraisonValide);
      } catch (erreur) {
        console.error('[TRIÈDRE] Validation adresse / livraison :', erreur);
        tarifLivraisonValide = null;
        empreinteTarifLivraison = '';
        const livraisonValeur = document.getElementById('commande-livraison-valeur');
        if (livraisonValeur) livraisonValeur.textContent = 'Non calculée';
        if (boutonPaiement) boutonPaiement.disabled = true;
        afficherToast(erreur?.message || 'Impossible de valider l’adresse pour le moment.', 'avertissement');
      } finally {
        boutonAdresse.disabled = false;
        if (!tarifLivraisonValide) boutonAdresse.textContent = modificationAdresseMembre ? 'Confirmer cette nouvelle adresse' : 'Valider mon adresse';
      }
    });

    document.getElementById('btn-passer-paiement').addEventListener('click', async function () {
      const boutonPaiement = this;
      const champs = obtenirChampsCommande();
      const panier = getPanier();

      if (!tarifLivraisonValide || empreinteTarifLivraison !== empreinteCommande(panier)) {
        invaliderAdresseValidee();
        afficherToast('Valide ton adresse avant de passer au paiement.', 'avertissement');
        return;
      }

      try {
        boutonPaiement.disabled = true;
        boutonPaiement.textContent = 'Préparation du paiement...';

        const commandePayload = {
          client: {
            nom: champs.nom.value.trim(), email: champs.email.value.trim(), telephone: champs.telephone.value.trim(),
            pays: pays.value, adresse: champs.adresse.value.trim(), ville: champs.ville.value.trim(),
            region: champs.region.value.trim(), code_postal: postal.value.trim()
          },
          panier: panier.map(function (item) { return { sku: item.sku, quantite: Number(item.quantite) }; }),
          livraison: { service: tarifLivraisonValide.service, montant: tarifLivraisonValide.montant }
        };

        const reponseCommande = await fetch('/08-php/creer-commande.php', {
          method: 'POST', headers: await entetesCreationCommande(),
          body: JSON.stringify(commandePayload)
        });
        const resultatCommande = await lireJson(reponseCommande);
        if (!reponseCommande.ok || resultatCommande.success === false) throw new Error(resultatCommande.error || resultatCommande.message || 'Impossible de créer la commande.');

        const orderId = resultatCommande.order_id || resultatCommande.id || resultatCommande.order?.id || resultatCommande.commande?.id;
        if (!orderId) throw new Error('La commande a été créée, mais son identifiant est introuvable.');

        boutonPaiement.textContent = 'Ouverture du paiement sécurisé...';
        const reponseStripe = await fetch('/08-php/creer-checkout-stripe.php', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ order_id: orderId })
        });
        const resultatStripe = await lireJson(reponseStripe);
        if (!reponseStripe.ok || resultatStripe.success === false) throw new Error(resultatStripe.error || resultatStripe.message || 'Impossible d’ouvrir le paiement Stripe.');

        const checkoutUrl = resultatStripe.url || resultatStripe.checkout_url || resultatStripe.session_url;
        if (!checkoutUrl) throw new Error('Stripe n’a retourné aucune URL de paiement.');
        window.location.assign(checkoutUrl);
      } catch (erreur) {
        console.error('[TRIÈDRE] Création de commande / Stripe :', erreur);
        afficherToast(erreur?.message || 'Impossible de préparer le paiement pour le moment.', 'avertissement');
        boutonPaiement.disabled = false;
        boutonPaiement.textContent = 'Passer au paiement';
      }
    });
  }


  function afficherResumeFinal(client, panier, tarifLivraison) {
    const sousTotal = Number(totalPanier());
    const totalFinal = sousTotal + Number(tarifLivraison.montant);

    const articlesHTML = panier.map(function (item) {
      const sousTotalArticle = (item.prix * item.quantite).toFixed(2);
      return `
        <div class="commande-article-resume">
          <img src="${item.image}" alt="${item.nom}">
          <div>
            <h4>${item.nom}</h4>
            <p>${item.couleur} — ${item.taille} — Qté ${item.quantite}</p>
          </div>
          <span class="commande-article-prix">${sousTotalArticle} $</span>
        </div>
      `;
    }).join('');

    conteneur.innerHTML = `
      <div class="commande-etape-final">
        <div class="commande-etapes">
          <span class="is-complete">Panier ✓</span><span>→</span>
          <span class="is-complete">Adresse ✓</span><span>→</span>
          <span class="is-active">Résumé</span><span>→</span>
          <span>Paiement</span>
        </div>

        <div class="commande-resume-final">
          <div class="commande-resume-entete">
            <div>
              <p class="section-eyebrow">Étape 3</p>
              <h2>Résumé de la commande</h2>
            </div>
            <button type="button" class="commande-lien-action" id="modifier-adresse">Modifier l’adresse</button>
          </div>

          <div class="commande-adresse-confirmee">
            <strong>${echapperHTML(client.nom)}</strong>
            <span>${echapperHTML(client.adresse)}</span>
            <span>${echapperHTML(client.ville)}, ${echapperHTML(client.region)} ${echapperHTML(client.code_postal)}</span>
          </div>

          <div class="commande-articles-liste">${articlesHTML}</div>

          <div class="commande-ligne-final">
            <span>Sous-total</span><span>${sousTotal.toFixed(2)} $</span>
          </div>
          <div class="commande-ligne-final">
            <span>Livraison — ${echapperHTML(tarifLivraison.service)}</span>
            <span>${Number(tarifLivraison.montant).toFixed(2)} $</span>
          </div>
          <div class="panier-total commande-total-final">
            <span>Total</span><span class="accent">${totalFinal.toFixed(2)} $</span>
          </div>

          <button type="button" class="btn btn-primary" id="btn-resume-commande">Passer la commande</button>
        </div>
      </div>
    `;

    document.getElementById('modifier-adresse').addEventListener('click', function () {
      afficherPageCommande();
    });

    document.getElementById('btn-resume-commande').addEventListener('click', async function () {
      const bouton = this;
      try {
        bouton.disabled = true;
        bouton.textContent = 'Préparation du paiement...';

        const commandePayload = {
          client: client,
          panier: panier.map(function (item) {
            return { sku: item.sku, quantite: Number(item.quantite) };
          }),
          livraison: {
            service: tarifLivraison.service,
            montant: tarifLivraison.montant
          }
        };

        const reponseCommande = await fetch('/08-php/creer-commande.php', {
          method: 'POST',
          headers: await entetesCreationCommande(),
          body: JSON.stringify(commandePayload)
        });
        const resultatCommande = await lireJson(reponseCommande);
        if (!reponseCommande.ok || resultatCommande.success === false) {
          throw new Error(resultatCommande.error || resultatCommande.message || 'Impossible de créer la commande.');
        }

        const orderId = resultatCommande.order_id || resultatCommande.id ||
          resultatCommande.order?.id || resultatCommande.commande?.id;
        if (!orderId) throw new Error('La commande a été créée, mais son identifiant est introuvable.');

        const reponseStripe = await fetch('/08-php/creer-checkout-stripe.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ order_id: orderId })
        });
        const resultatStripe = await lireJson(reponseStripe);
        if (!reponseStripe.ok || resultatStripe.success === false) {
          throw new Error(resultatStripe.error || resultatStripe.message || 'Impossible d’ouvrir le paiement Stripe.');
        }

        const checkoutUrl = resultatStripe.url || resultatStripe.checkout_url || resultatStripe.session_url;
        if (!checkoutUrl) throw new Error('Stripe n’a retourné aucune URL de paiement.');
        window.location.assign(checkoutUrl);
      } catch (erreur) {
        console.error('[TRIÈDRE] Résumé / Stripe :', erreur);
        afficherToast(erreur?.message || 'Impossible de préparer le paiement.', 'avertissement');
        bouton.disabled = false;
        bouton.textContent = 'Passer la commande';
      }
    });
  }

  function echapperHTML(valeur) {
    return String(valeur ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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

    function lireMontant(objet) {
      if (!objet || typeof objet !== 'object') return null;

      const montantBrut =
        objet.due ??
        objet.totalPrice ??
        objet.price ??
        objet.amount ??
        objet.total ??
        objet.totalCharge ??
        objet.total_charge;

      const montant = Number(montantBrut);

      return Number.isFinite(montant) && montant >= 0
        ? montant
        : null;
    }

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

      let montant = lireMontant(valeur);

      // Postes Canada place normalement le prix dans le sous-objet priceDetails.
      if (montant === null && valeur.priceDetails) {
        montant = lireMontant(valeur.priceDetails);
      }

      if (service && montant !== null) {
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
