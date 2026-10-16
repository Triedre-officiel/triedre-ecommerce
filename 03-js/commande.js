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

  // Retour depuis Stripe sans paiement (bouton « Retour », ou session expirée) :
  // on rend les articles réservés et on prévient le client. Son panier est conservé
  // et la page de commande s'affiche normalement.
  if (parametresUrl.get('stripe') === 'cancelled') {
    traiterRetourSansPaiement(parametresUrl.get('commande'));
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

  // Ajoute le jeton membre s'il existe une session, sans jamais bloquer un invité.
  // Utilisé au retour de Stripe, quand la page vient d'être rechargée.
  // Lit window.triedreSupabase directement : au retour de Stripe, la page s'arrête
  // avant la déclaration de clientSupabase (voir le return en haut du fichier).
  async function entetesAvecSessionOptionnelle() {
    const headers = { 'Accept': 'application/json' };
    const supabaseClient = window.triedreSupabase || null;
    if (!supabaseClient) return headers;
    try {
      const { data } = await supabaseClient.auth.getSession();
      const accessToken = data?.session?.access_token;
      if (accessToken) headers.Authorization = 'Bearer ' + accessToken;
    } catch (erreur) {
      console.warn('[TRIÈDRE] Session membre non lue :', erreur);
    }
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
      const livraison = lireOptionsLivraison(resultat);
      afficherResumeFinal(client, panier, livraison);
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

  // Adresse d'un invité gardée le temps de la visite (onglet) :
  // s'il retourne à la boutique compléter son panier, il n'a rien à retaper.
  const CLE_ADRESSE_INVITE = 'triedre_adresse_invite';

  function memoriserAdresseInvite(client) {
    if (modeMembre) return;
    try { sessionStorage.setItem(CLE_ADRESSE_INVITE, JSON.stringify(client)); } catch (e) { /* stockage indisponible */ }
  }

  function oublierAdresseInvite() {
    try { sessionStorage.removeItem(CLE_ADRESSE_INVITE); } catch (e) { /* stockage indisponible */ }
  }

  function preRemplirAdresseInvite() {
    if (modeMembre) return;
    let client = null;
    try { client = JSON.parse(sessionStorage.getItem(CLE_ADRESSE_INVITE) || 'null'); } catch (e) { client = null; }
    if (!client || typeof client !== 'object') return;

    const pays = document.getElementById('cmd-pays');
    if (client.pays && Array.from(pays.options).some(o => o.value === client.pays)) {
      pays.value = client.pays;
      pays.dispatchEvent(new Event('change'));
    }
    const valeurs = {
      'cmd-nom': client.nom, 'cmd-email': client.email, 'cmd-adresse': client.adresse,
      'cmd-ville': client.ville, 'cmd-postal': client.code_postal, 'cmd-telephone': client.telephone
    };
    for (const [id, valeur] of Object.entries(valeurs)) {
      const champ = document.getElementById(id);
      if (champ && valeur) champ.value = valeur;
    }
    const region = document.getElementById('cmd-region');
    if (region && client.region) region.value = client.region;
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

    preRemplirAdresseInvite();

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

        const livraisonDisponible = lireOptionsLivraison(resultatLivraison);

        tarifLivraisonValide = livraisonDisponible.optionParDefaut;
        empreinteTarifLivraison = empreinteCommande(panier);
        const totalAvecLivraison = Number(totalPanier()) + tarifLivraisonValide.montant;

        if (livraisonValeur) livraisonValeur.textContent = tarifLivraisonValide.service + ' — ' + (tarifLivraisonValide.gratuit ? 'Gratuite' : formaterMontant(tarifLivraisonValide.montant));
        if (totalCommande) totalCommande.textContent = formaterMontant(totalAvecLivraison);

        const clientCommande = {
          nom: champs.nom.value.trim(),
          email: champs.email.value.trim(),
          telephone: champs.telephone.value.trim(),
          pays: pays.value,
          adresse: champs.adresse.value.trim(),
          ville: champs.ville.value.trim(),
          region: champs.region.value.trim(),
          code_postal: postal.value.trim()
        };
        memoriserAdresseInvite(clientCommande);
        afficherResumeFinal(clientCommande, panier, livraisonDisponible);
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
          livraison: donneesLivraisonCommande(tarifLivraisonValide)
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
        // Même en-têtes que la création : le jeton membre accompagne la commande jusqu'au paiement.
        const reponseStripe = await fetch('/08-php/creer-checkout-stripe.php', {
          method: 'POST', headers: await entetesCreationCommande(),
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


  function afficherResumeFinal(client, panier, livraison) {
    const sousTotal = Number(totalPanier());
    let optionChoisie = livraison.optionParDefaut;

    const articlesHTML = panier.map(function (item) {
      return `
        <div class="commande-article-resume">
          <img src="${echapperHTML(item.image)}" alt="${echapperHTML(item.nom)}">
          <div>
            <h4>${echapperHTML(item.nom)}</h4>
            <p>${echapperHTML(item.couleur)} — ${echapperHTML(item.taille)} — Qté ${Number(item.quantite)}</p>
          </div>
          <span class="commande-article-prix">${formaterMontant(item.prix * item.quantite)}</span>
        </div>
      `;
    }).join('');

    const optionsHTML = livraison.options.map(function (option) {
      const prix = option.gratuit
        ? `<span class="livraison-option-prix"><strong class="accent">Gratuite</strong></span>`
        : `<span class="livraison-option-prix"><strong>${formaterMontant(option.montant)}</strong></span>`;
      return `
        <label class="livraison-option${option.code === optionChoisie.code ? ' is-active' : ''}">
          <input type="radio" name="option-livraison" value="${echapperHTML(option.code)}"${option.code === optionChoisie.code ? ' checked' : ''}>
          <span class="livraison-option-infos">
            <span class="livraison-option-nom">${echapperHTML(option.service)}</span>
            <small class="livraison-option-delai">${echapperHTML(texteDelaiLivraison(option))}</small>
          </span>
          ${prix}
        </label>
      `;
    }).join('');

    conteneur.innerHTML = `
      <div class="commande-etape-final">
        ${etapesCommandeHTML('resume')}

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

          <fieldset class="livraison-options">
            <legend>Mode de livraison <small>· Postes Canada</small></legend>
            ${barreLivraisonGratuiteHTML(sousTotal, livraison.seuil)}
            ${optionsHTML}
          </fieldset>

          <div class="commande-ligne-final">
            <span>Sous-total</span><span>${formaterMontant(sousTotal)}</span>
          </div>
          <div class="commande-ligne-final">
            <span id="resume-livraison-nom"></span>
            <span id="resume-livraison-montant"></span>
          </div>
          <div class="panier-total commande-total-final">
            <span>Total</span><span class="accent" id="resume-total"></span>
          </div>

          <button type="button" class="btn btn-primary" id="btn-resume-commande">Passer la commande</button>
        </div>
      </div>
    `;

    function mettreAJourTotaux() {
      document.getElementById('resume-livraison-nom').textContent = optionChoisie.service;
      document.getElementById('resume-livraison-montant').innerHTML = optionChoisie.gratuit
        ? '<strong class="accent">Gratuite</strong>'
        : formaterMontant(optionChoisie.montant);
      document.getElementById('resume-total').textContent =
        formaterMontant(sousTotal + Number(optionChoisie.montant));
    }

    mettreAJourTotaux();

    conteneur.querySelector('.livraison-options').addEventListener('change', function (e) {
      if (!e.target.matches('input[name="option-livraison"]')) return;
      const choix = livraison.options.find(function (o) { return o.code === e.target.value; });
      if (!choix) return;
      optionChoisie = choix;
      conteneur.querySelectorAll('.livraison-option').forEach(function (carte) {
        carte.classList.toggle('is-active', carte.contains(e.target));
      });
      mettreAJourTotaux();
    });

    document.getElementById('modifier-adresse').addEventListener('click', function () {
      afficherPageCommande();
    });

    conteneur.querySelector('[data-etape="adresse"]')?.addEventListener('click', function () {
      afficherPageCommande();
      conteneur.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    conteneur.querySelector('[data-etape="resume"]')?.addEventListener('click', function () {
      conteneur.querySelector('.commande-resume-final')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          livraison: donneesLivraisonCommande(optionChoisie)
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

        // Même en-têtes que la création : le jeton membre accompagne la commande jusqu'au paiement.
        const reponseStripe = await fetch('/08-php/creer-checkout-stripe.php', {
          method: 'POST',
          headers: await entetesCreationCommande(),
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

  // ==========================================================================
  // Livraison : options signées par le serveur, livraison gratuite
  // ==========================================================================

  function formaterMontant(montant) {
    return Number(montant || 0).toFixed(2).replace('.', ',') + ' $';
  }

  function lireOptionsLivraison(resultat) {
    const options = (Array.isArray(resultat.options) ? resultat.options : [])
      .filter(function (o) {
        return o && o.code && o.jeton && Number.isFinite(Number(o.montant));
      })
      .map(function (o) {
        return Object.assign({}, o, {
          service: o.nom || traduireServiceLivraison(o.code),
          montant: Number(o.montant),
          montant_original: Number(o.montant_original)
        });
      });

    if (!options.length) throw new Error('Aucun tarif de livraison disponible pour cette adresse.');

    const optionParDefaut = options.find(function (o) {
      return o.code === resultat.option_par_defaut;
    }) || options[0];

    return {
      options: options,
      optionParDefaut: optionParDefaut,
      seuil: Number(resultat.seuil_livraison_gratuite) || 100
    };
  }

  // Seules ces données partent au serveur : il vérifie la signature et recalcule la gratuité.
  function donneesLivraisonCommande(option) {
    return {
      code: option.code,
      montant_original: option.montant_original,
      expiration: option.expiration,
      jeton: option.jeton
    };
  }

  function texteDelaiLivraison(option) {
    if (option.date_estimee) {
      const date = new Date(option.date_estimee + 'T12:00:00');
      if (!isNaN(date)) {
        return 'Livraison estimée le ' + date.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });
      }
    }
    if (option.delai_jours) {
      return option.delai_jours + ' jour' + (option.delai_jours > 1 ? 's' : '') + ' ouvrable' + (option.delai_jours > 1 ? 's' : '');
    }
    return 'Délai confirmé à l’expédition';
  }

  // Barre d'étapes : les étapes passées et l'étape en cours sont cliquables.
  function etapesCommandeHTML(etapeActive) {
    const etapes = [
      { cle: 'panier', nom: 'Panier', lien: 'panier' },
      { cle: 'adresse', nom: 'Adresse' },
      { cle: 'resume', nom: 'Résumé' },
      { cle: 'paiement', nom: 'Paiement' }
    ];
    const indexActif = etapes.findIndex(e => e.cle === etapeActive);
    const coche = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>';

    const items = etapes.map(function (etape, index) {
      const etat = index < indexActif ? 'is-complete' : (index === indexActif ? 'is-active' : 'is-a-venir');
      const pastille = `<span class="tr-etape-pastille">${index < indexActif ? coche : index + 1}</span>`;
      const indice = index < indexActif ? 'Modifier' : (index === indexActif ? 'En cours' : 'À venir');
      const texte = `<span class="tr-etape-texte"><span class="tr-etape-nom">${etape.nom}</span><small class="tr-etape-indice">${indice}</small></span>`;
      const courant = index === indexActif ? ' aria-current="step"' : '';

      let cible;
      if (index > indexActif) {
        cible = `<span class="tr-etape-cible" aria-disabled="true">${pastille}${texte}</span>`;
      } else if (etape.lien) {
        cible = `<a class="tr-etape-cible" href="${etape.lien}"${courant}>${pastille}${texte}</a>`;
      } else {
        cible = `<button type="button" class="tr-etape-cible" data-etape="${etape.cle}"${courant}>${pastille}${texte}</button>`;
      }
      return `<li class="tr-etape ${etat}">${cible}</li>`;
    }).join('');

    return `<nav class="tr-etapes" aria-label="Étapes de la commande"><ol>${items}</ol></nav>`;
  }

  function barreLivraisonGratuiteHTML(sousTotal, seuil) {
    const iconeCamion = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5h11v9H3z" /><path d="M14 9.5h3.6l3.4 3.4v2.6h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg>';
    const iconeCoche = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>';

    if (sousTotal >= seuil) {
      return `
        <div class="tr-livgratuite is-atteint" role="status">
          <span class="tr-livgratuite-icone">${iconeCoche}</span>
          <div class="tr-livgratuite-corps">
            <p class="tr-livgratuite-message">La livraison standard t’est offerte.</p>
            <div class="tr-livgratuite-piste"><span class="tr-livgratuite-remplissage" style="--progression:100%"></span></div>
          </div>
        </div>
      `;
    }

    const manque = seuil - sousTotal;
    const progression = Math.max(4, Math.min(100, Math.round((sousTotal / seuil) * 100)));
    return `
      <div class="tr-livgratuite">
        <span class="tr-livgratuite-icone">${iconeCamion}</span>
        <div class="tr-livgratuite-corps">
          <p class="tr-livgratuite-message">Plus que <strong>${formaterMontant(manque)}</strong> pour profiter de la livraison standard gratuite.</p>
          <div class="tr-livgratuite-piste" role="progressbar" aria-label="Progression vers la livraison gratuite" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progression}">
            <span class="tr-livgratuite-remplissage" style="--progression:${progression}%"></span>
          </div>
          <div class="tr-livgratuite-pied">
            <span>${formaterMontant(sousTotal)}</span>
            <span>${formaterMontant(seuil)}</span>
          </div>
          <a href="boutique" class="tr-livgratuite-lien">
            Continuer mes achats
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13" /><path d="M13 6l6 6-6 6" /></svg>
          </a>
        </div>
      </div>
    `;
  }

  // Noms des services Postes Canada (reçus en anglais) affichés en français.
  function traduireServiceLivraison(service) {
    const noms = {
      'regular parcel': 'Livraison standard',
      'expedited parcel': 'Livraison accélérée',
      'xpresspost': 'Livraison express',
      'priority': 'Livraison prioritaire',
      'dom.rp': 'Livraison standard',
      'dom.ep': 'Livraison accélérée',
      'dom.xp': 'Livraison express',
      'dom.pc': 'Livraison prioritaire',
      'colis standard': 'Livraison standard',
      'colis accélérés': 'Livraison accélérée',
      'priorité': 'Livraison prioritaire'
    };
    const cle = String(service || '').trim().toLowerCase();
    return noms[cle] || 'Livraison';
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
          service: traduireServiceLivraison(String(service)),
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
            headers: await entetesAvecSessionOptionnelle(),
            cache: 'no-store'
          }
        );

        const resultat = await lireJson(reponse);

        if (reponse.ok && resultat.success === true && resultat.paid === true) {
          // Le panier est vidé UNIQUEMENT après confirmation serveur.
          viderPanier();
          oublierAdresseInvite();
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

  async function traiterRetourSansPaiement(orderId) {
    // Nettoie l'adresse : un rechargement de la page ne relance pas ce traitement.
    window.history.replaceState(null, '', window.location.pathname);

    let etat = '';
    if (orderId && /^[a-f0-9-]{36}$/i.test(orderId)) {
      try {
        const headers = await entetesAvecSessionOptionnelle();
        headers['Content-Type'] = 'application/json';
        const reponse = await fetch('/08-php/liberer-reservation.php', {
          method: 'POST', headers: headers, cache: 'no-store',
          body: JSON.stringify({ order_id: orderId })
        });
        etat = (await lireJson(reponse)).etat || '';
      } catch (erreur) {
        // Sans gravité : l'expiration Stripe ou le cron libéreront le stock.
        console.warn('[TRIÈDRE] Libération de la réservation différée :', erreur);
      }
    }

    // Cas rare : le paiement a abouti juste avant le retour. Rien n'est libéré.
    if (etat === 'payee') {
      afficherToast('Ton paiement est en cours de traitement : tu recevras une confirmation par courriel.', 'succes');
      return;
    }

    if (window.triedreModal && typeof window.triedreModal.alert === 'function') {
      await window.triedreModal.alert({
        eyebrow: 'PAIEMENT',
        title: 'PAIEMENT NON FINALISÉ',
        message: 'Aucun montant n’a été débité. Tes articles ne sont plus réservés, mais ton panier est conservé : ' +
          'valide de nouveau ta commande quand tu es prêt, selon les disponibilités.',
        confirmText: 'Compris'
      });
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
        <button type="button" class="btn btn-primary" id="commande-actualiser-verification">Actualiser</button>
      </div>
    `;

    // Recharge la même URL (avec session_id) pour relancer la vérification,
    // au lieu de revenir au début du parcours de commande.
    document.getElementById('commande-actualiser-verification')
      .addEventListener('click', function () {
        window.location.reload();
      });
  }

  function attendre(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

});
