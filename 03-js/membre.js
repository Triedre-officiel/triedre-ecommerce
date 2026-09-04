
// ==========================================================================
// TRIÈDRE — Espace Membre — Auth Supabase — parcours email-first V3
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const supabase = window.triedreSupabase;
  const membrePage = document.querySelector('.membre-page');

  const authZone = document.getElementById('membre-auth-zone');
  const etapeEmail = document.getElementById('auth-etape-email');
  const formulaireEmail = document.getElementById('formulaire-email-first');
  const champEmailInitial = document.getElementById('auth-email');
  const btnEmailContinuer = document.getElementById('auth-email-continuer');

  const connexion = document.getElementById('connexion');
  const champConnexionEmail = document.getElementById('connexion-email');
  const texteConnexionEmail = document.getElementById('connexion-email-affiche');
  const champConnexionMdp = document.getElementById('connexion-mdp');
  const btnConnexion = document.getElementById('connexion-submit');
  const btnOuvrirInscription = document.getElementById('ouvrir-inscription');
  const oubli = document.getElementById('mdp-oublie');

  const inscription = document.getElementById('inscription');
  const champInscriptionEmail = document.getElementById('inscription-email');
  const texteInscriptionEmail = document.getElementById('inscription-email-affiche');
  const champInscriptionNom = document.getElementById('inscription-nom');
  const champInscriptionMdp = document.getElementById('inscription-mdp');
  const btnInscription = document.getElementById('inscription-submit');
  const btnRetourConnexion = document.getElementById('retour-connexion');
  const caseMarketing = document.getElementById('marketing-consent');

  const zoneConnectee = document.getElementById('membre-connecte');
  const zoneInformations = document.getElementById('membre-informations');
  const zoneReset = document.getElementById('membre-reset');
  const resetForm = document.getElementById('formulaire-reset-mdp');
  const btnDeconnexion = document.getElementById('membre-deconnexion');
  const message = document.getElementById('membre-message');

  const boutonMesAbonnements = document.getElementById('ouvrir-mes-abonnements');
  const zoneAbonnements = document.getElementById('membre-abonnements');
  const boutonRetourAbonnements = document.getElementById('retour-abonnements-tableau-de-bord');

  const boutonMesProgrammes = document.getElementById('ouvrir-mes-programmes');
  const zoneProgrammes = document.getElementById('membre-programmes');
  const boutonRetourProgrammes = document.getElementById('retour-programmes-tableau-de-bord');

  const boutonCommunaute = document.getElementById('ouvrir-communaute');
  const zoneCommunaute = document.getElementById('membre-communaute');
  const boutonRetourCommunaute = document.getElementById('retour-communaute-tableau-de-bord');

  const boutonMesFavoris = document.getElementById('ouvrir-mes-favoris');
  const zoneFavoris = document.getElementById('membre-favoris');
  const boutonRetourFavoris = document.getElementById('retour-favoris-tableau-de-bord');
  const listeFavoris = document.getElementById('liste-favoris');
  const aucunFavori = document.getElementById('aucun-favori');
  const favorisErreur = document.getElementById('favoris-erreur');

  const boutonMesCommandes = document.getElementById('ouvrir-mes-commandes');
  const zoneCommandes = document.getElementById('membre-commandes');
  const boutonRetourCommandes = document.getElementById('retour-commandes-tableau-de-bord');
  const listeCommandes = document.getElementById('liste-commandes');
  const aucuneCommande = document.getElementById('aucune-commande');
  const commandesErreur = document.getElementById('commandes-erreur');

  const boutonMesInformations = document.getElementById('ouvrir-mes-informations');
  const boutonRetourDashboard = document.getElementById('retour-tableau-de-bord');
  const formulaireMesInformations = document.getElementById('formulaire-mes-informations');
  const champProfilPrenom = document.getElementById('profil-prenom');
  const champProfilNom = document.getElementById('profil-nom');
  const champsProfilSexe = document.querySelectorAll('input[name="profil-sexe"]');
  const champProfilDateNaissance = document.getElementById('profil-date-naissance');
  const champProfilEmail = document.getElementById('profil-email');
  const champProfilTelephone = document.getElementById('profil-telephone');
  const erreurMesInformations = document.getElementById('mes-informations-erreur');
  const succesMesInformations = document.getElementById('mes-informations-succes');
  const boutonEnregistrerInformations = document.getElementById('enregistrer-mes-informations');

  const boutonMesPreferences = document.getElementById('ouvrir-mes-preferences');
  const zonePreferences = document.getElementById('membre-preferences');
  const boutonRetourPreferences = document.getElementById('retour-preferences-tableau-de-bord');
  const formulaireMesPreferences = document.getElementById('formulaire-mes-preferences');
  const preferenceMarketing = document.getElementById('preference-marketing');
  const preferencesLangue = document.querySelectorAll('input[name="preference-langue"]');
  const erreurMesPreferences = document.getElementById('mes-preferences-erreur');
  const succesMesPreferences = document.getElementById('mes-preferences-succes');
  const boutonEnregistrerPreferences = document.getElementById('enregistrer-mes-preferences');


  const boutonMesAdresses = document.getElementById('ouvrir-mes-adresses');
  const zoneAdresses = document.getElementById('membre-adresses');
  const boutonRetourAdresses = document.getElementById('retour-adresses-tableau-de-bord');
  const boutonAjouterAdresse = document.getElementById('ajouter-adresse');
  const listeAdresses = document.getElementById('liste-adresses');
  const aucuneAdresse = document.getElementById('aucune-adresse');
  const formulaireAdresse = document.getElementById('formulaire-adresse');
  const boutonAnnulerAdresse = document.getElementById('annuler-adresse');
  const boutonAnnulerAdresseHaut = document.getElementById('annuler-adresse-haut');
  const boutonEnregistrerAdresse = document.getElementById('enregistrer-adresse');
  const adresseModeLabel = document.getElementById('adresse-mode-label');
  const adresseFormTitre = document.getElementById('adresse-form-titre');
  const champAdresseId = document.getElementById('adresse-id');
  const champAdresseLibelle = document.getElementById('adresse-libelle');
  const champAdressePays = document.getElementById('adresse-pays');
  const champAdressePrenom = document.getElementById('adresse-prenom');
  const champAdresseNom = document.getElementById('adresse-nom');
  const champAdresseLigne1 = document.getElementById('adresse-ligne1');
  const champAdresseLigne2 = document.getElementById('adresse-ligne2');
  const champAdresseVille = document.getElementById('adresse-ville');
  const groupeAdresseRegion = document.getElementById('adresse-region-groupe');
  const labelAdresseCodePostal = document.getElementById('adresse-code-postal-label');
  const champAdresseCodePostal = document.getElementById('adresse-code-postal');
  const champAdresseTelephone = document.getElementById('adresse-telephone');
  const champAdresseDefaut = document.getElementById('adresse-par-defaut');
  const adresseErreur = document.getElementById('adresse-erreur');
  const adresseSucces = document.getElementById('adresse-succes');


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

  const boutonSuppressionCompte = document.getElementById('ouvrir-suppression-compte');
  const modalSuppressionCompte = document.getElementById('modal-suppression-compte');
  const formulaireSuppressionCompte = document.getElementById('formulaire-suppression-compte');
  const champSuppressionMdp = document.getElementById('suppression-mdp');
  const erreurSuppressionCompte = document.getElementById('suppression-compte-erreur');
  const boutonConfirmerSuppression = document.getElementById('confirmer-suppression-compte');

  let ignorerConnexionAutomatique = false;
  let emailRetourApresReset = '';

  activerAffichageMotDePasse();
  activerParcoursEmailFirst();

  if (!supabase) {
    afficherMessage('La connexion à l’espace membre est momentanément indisponible.', 'erreur');
    desactiverFormulaires();
    return;
  }

  activerConnexion();
  activerInscription();
  activerOubli();
  activerDashboard();
  activerMesAbonnements();
  activerMesProgrammes();
  activerCommunaute();
  activerMesFavoris();
  activerMesCommandes();
  activerMesInformations();
  activerMesPreferences();
  activerMesAdresses();
  activerSuppressionCompte();
  activerDeconnexion();
  activerReset();
  initialiserSession();

  function activerParcoursEmailFirst() {
    formulaireEmail.addEventListener('submit', async function (event) {
      event.preventDefault();

      if (!formulaireEmail.checkValidity()) {
        formulaireEmail.reportValidity();
        return;
      }

      const email = champEmailInitial.value.trim().toLowerCase();
      nettoyerChampsConnexion();
      nettoyerChampsInscription(false);
      etatBouton(btnEmailContinuer, true, 'Vérification...');
      masquerMessage();

      try {
        const compteExiste = await verifierExistenceCompte(email);

        if (compteExiste) {
          afficherFormulaireConnexion(email);
        } else {
          afficherMessage('Aucun compte avec cette adresse courriel. Crée ton compte TRIÈDRE pour continuer.', 'avertissement');
          afficherFormulaireInscription(email);
        }
      } catch (error) {
        console.error('[TRIÈDRE] Vérification de l’adresse :', error);
        afficherMessage('Impossible de vérifier cette adresse pour le moment.', 'erreur');
      } finally {
        etatBouton(btnEmailContinuer, false, 'Continuer');
      }
    });

    btnOuvrirInscription.addEventListener('click', function () {
      const email = champConnexionEmail.value || champEmailInitial.value || '';
      nettoyerChampsConnexion();
      nettoyerChampsInscription(false);
      afficherFormulaireInscription(email);
      masquerMessage();
      champInscriptionNom.focus();
    });

    btnRetourConnexion.addEventListener('click', function () {
      const email = champInscriptionEmail.value || champEmailInitial.value || '';
      nettoyerChampsInscription(false);
      nettoyerChampsConnexion();
      afficherFormulaireConnexion(email);
      masquerMessage();
      champConnexionMdp.focus();
    });
  }

  function activerAffichageMotDePasse() {
    document.querySelectorAll('[data-password-toggle]').forEach(function (bouton) {
      bouton.addEventListener('click', function () {
        const champ = document.getElementById(bouton.getAttribute('data-password-toggle'));
        if (!champ) return;

        const visible = champ.type === 'text';
        champ.type = visible ? 'password' : 'text';
        bouton.setAttribute('aria-pressed', visible ? 'false' : 'true');
        bouton.setAttribute('aria-label', visible ? 'Afficher le mot de passe' : 'Masquer le mot de passe');
        champ.focus();
      });
    });
  }

  async function verifierExistenceCompte(email) {
    const { data, error } = await supabase.rpc('member_email_exists', { target_email: email });
    if (error) throw error;
    return Boolean(data);
  }

  async function initialiserSession() {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[TRIÈDRE] Session :', error);
      afficherMessage('Impossible de vérifier ta session pour le moment.', 'erreur');
      return;
    }

    if (data.session && data.session.user) {
      afficherConnecte(data.session.user);
    } else {
      afficherDeconnecte(false);
    }

    supabase.auth.onAuthStateChange(function (event, session) {
      if (event === 'PASSWORD_RECOVERY') {
        afficherReset();
        return;
      }

      if (event === 'SIGNED_IN' && session && session.user) {
        if (!ignorerConnexionAutomatique) afficherConnecte(session.user);
        return;
      }

      if (event === 'SIGNED_OUT') {
        if (emailRetourApresReset) {
          const email = emailRetourApresReset;
          emailRetourApresReset = '';
          afficherDeconnecte(false);
          afficherFormulaireConnexion(email);
          return;
        }

        afficherDeconnecte(true);
      }
    });
  }

  function activerConnexion() {
    connexion.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!connexion.checkValidity()) { connexion.reportValidity(); return; }

      const email = champConnexionEmail.value.trim().toLowerCase();
      const password = champConnexionMdp.value;
      etatBouton(btnConnexion, true, 'Connexion...');

      const { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });
      etatBouton(btnConnexion, false, 'Se connecter');
      champConnexionMdp.value = '';

      if (error) {
        console.error('[TRIÈDRE] Connexion :', error);
        if (String(error.message).toLowerCase().includes('email not confirmed')) {
          afficherMessage('Confirme d’abord ton adresse courriel avant de te connecter.', 'avertissement');
        } else {
          afficherMessage('Adresse courriel ou mot de passe incorrect.', 'erreur');
        }
        return;
      }

      afficherMessage('Connexion réussie.', 'succes');
      afficherConnecte(data.user);
      window.setTimeout(function () {
        if (message.textContent === 'Connexion réussie.') masquerMessage();
      }, 3000);
    });
  }

  function activerInscription() {
    inscription.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!inscription.checkValidity()) { inscription.reportValidity(); return; }

      const nomComplet = champInscriptionNom.value.trim();
      const email = champInscriptionEmail.value.trim().toLowerCase();
      const password = champInscriptionMdp.value;
      const consentement = Boolean(caseMarketing && caseMarketing.checked);
      const nomDecoupe = decouperNomComplet(nomComplet);

      ignorerConnexionAutomatique = true;
      etatBouton(btnInscription, true, 'Création...');

      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          emailRedirectTo: urlMembre(),
          data: {
            full_name: nomComplet,
            first_name: nomDecoupe.prenom,
            last_name: nomDecoupe.nom,
            marketing_consent: consentement,
            marketing_consent_updated_at: consentement ? new Date().toISOString() : null
          }
        }
      });

      etatBouton(btnInscription, false, 'Créer mon compte');

      if (error) {
        ignorerConnexionAutomatique = false;
        champInscriptionMdp.value = '';
        console.error('[TRIÈDRE] Inscription :', error);
        afficherMessage('Impossible de créer le compte avec ces informations.', 'erreur');
        return;
      }

      if (data.session) {
        await supabase.auth.signOut({ scope: 'local' }).catch(function () {});
      }

      nettoyerChampsInscription(true);
      nettoyerChampsConnexion();
      afficherFormulaireConnexion(email);
      afficherMessage('Compte créé. Vérifie maintenant ton courriel pour confirmer ton adresse. Ensuite, connecte-toi avec ton mot de passe.', 'succes');
      ignorerConnexionAutomatique = false;
    });
  }

  function activerOubli() {
    oubli.addEventListener('click', async function (event) {
      event.preventDefault();
      const email = champConnexionEmail.value.trim();

      if (!email) {
        afficherMessage('Entre d’abord ton adresse courriel.', 'avertissement');
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: urlMembre() });
      champConnexionMdp.value = '';

      if (error) {
        console.error('[TRIÈDRE] Mot de passe oublié :', error);
        afficherMessage('Impossible d’envoyer le courriel de réinitialisation.', 'erreur');
        return;
      }

      afficherMessage('Si un compte correspond à cette adresse, un courriel de réinitialisation vient d’être envoyé.', 'succes');
    });
  }

  function activerReset() {
    resetForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!resetForm.checkValidity()) { resetForm.reportValidity(); return; }

      const mdp = document.getElementById('nouveau-mdp').value;
      const confirmation = document.getElementById('nouveau-mdp-confirmation').value;

      if (mdp !== confirmation) {
        resetForm.reset();
        afficherMessage('Les deux mots de passe ne correspondent pas.', 'avertissement');
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const email = userData && userData.user ? (userData.user.email || '') : '';
      const { error } = await supabase.auth.updateUser({ password: mdp });
      resetForm.reset();

      if (error) {
        console.error('[TRIÈDRE] Nouveau mot de passe :', error);
        afficherMessage('Impossible de modifier le mot de passe pour le moment.', 'erreur');
        return;
      }

      emailRetourApresReset = email;
      await supabase.auth.signOut();
      afficherDeconnecte(false);
      afficherFormulaireConnexion(email);
      afficherMessage('Ton mot de passe a été mis à jour. Connecte-toi maintenant avec ton nouveau mot de passe.', 'succes');
    });
  }

  function activerDashboard() {
    document.querySelectorAll('[data-fonction-future]').forEach(function (element) {
      element.addEventListener('click', function () { afficherToast('Fonction à venir.', 'info'); });
    });

    document.querySelectorAll('[data-dashboard-action]').forEach(function (element) {
      element.addEventListener('click', function () {
        const action = element.getAttribute('data-dashboard-action');
      });
    });
  }

  function masquerSousPagesV9() {
    [zoneAbonnements, zoneProgrammes, zoneCommunaute].forEach(function (zone) {
      if (zone) zone.hidden = true;
    });
  }

  function activerMesAbonnements() {
    if (!boutonMesAbonnements || !zoneAbonnements || !boutonRetourAbonnements) return;

    boutonMesAbonnements.addEventListener('click', function () {
      masquerSousPagesV9();
      zoneConnectee.hidden = true;
      zoneAbonnements.hidden = false;
    });

    boutonRetourAbonnements.addEventListener('click', function () {
      zoneAbonnements.hidden = true;
      zoneConnectee.hidden = false;
    });
  }

  function activerMesProgrammes() {
    if (!boutonMesProgrammes || !zoneProgrammes || !boutonRetourProgrammes) return;

    boutonMesProgrammes.addEventListener('click', function () {
      masquerSousPagesV9();
      zoneConnectee.hidden = true;
      zoneProgrammes.hidden = false;
    });

    boutonRetourProgrammes.addEventListener('click', function () {
      zoneProgrammes.hidden = true;
      zoneConnectee.hidden = false;
    });
  }

  function activerCommunaute() {
    if (!boutonCommunaute || !zoneCommunaute || !boutonRetourCommunaute) return;

    boutonCommunaute.addEventListener('click', function () {
      masquerSousPagesV9();
      zoneConnectee.hidden = true;
      zoneCommunaute.hidden = false;
    });

    boutonRetourCommunaute.addEventListener('click', function () {
      zoneCommunaute.hidden = true;
      zoneConnectee.hidden = false;
    });

    const boutonsVues = zoneCommunaute.querySelectorAll('[data-communaute-vue]');
    const panneaux = zoneCommunaute.querySelectorAll('[data-communaute-panel]');

    boutonsVues.forEach(function (bouton) {
      bouton.addEventListener('click', function () {
        const cible = bouton.getAttribute('data-communaute-vue');

        boutonsVues.forEach(function (autre) {
          autre.classList.toggle('is-active', autre === bouton);
        });

        panneaux.forEach(function (panneau) {
          const actif = panneau.getAttribute('data-communaute-panel') === cible;
          panneau.hidden = !actif;
          panneau.classList.toggle('is-active', actif);
        });
      });
    });

    zoneCommunaute.querySelectorAll('[data-communaute-futur]').forEach(function (bouton) {
      bouton.addEventListener('click', function () {
        afficherToast(
          'La publication communautaire sera activée dans une prochaine étape.',
          'info'
        );
      });
    });
  }

  function activerMesFavoris() {
    if (!boutonMesFavoris || !zoneFavoris || !boutonRetourFavoris) {
      return;
    }

    boutonMesFavoris.addEventListener('click', ouvrirMesFavoris);

    boutonRetourFavoris.addEventListener('click', function () {
      zoneFavoris.hidden = true;
      zoneConnectee.hidden = false;
      favorisErreur.hidden = true;
      favorisErreur.textContent = '';
    });
  }

  async function ouvrirMesFavoris() {
    boutonMesFavoris.disabled = true;
    favorisErreur.hidden = true;
    favorisErreur.textContent = '';
    listeFavoris.innerHTML = '';
    aucunFavori.hidden = true;

    try {
      const {
        data: { user },
        error: erreurUtilisateur
      } = await supabase.auth.getUser();

      if (erreurUtilisateur || !user) {
        throw erreurUtilisateur || new Error('SESSION_INVALIDE');
      }

      const { data: favoris, error: erreurFavoris } = await supabase
        .from('favorites')
        .select(`
          id,
          product_id,
          variant_id,
          sku,
          product_name,
          color,
          size,
          product_url,
          image_url,
          price,
          currency,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (erreurFavoris) {
        throw erreurFavoris;
      }

      const liste = favoris || [];
      const skus = liste
        .map(function (favori) { return favori.sku; })
        .filter(Boolean);

      let stockParSku = new Map();

      if (skus.length) {
        const { data: variantes, error: erreurStock } = await supabase
          .from('product_variants')
          .select('sku, stock, active')
          .in('sku', skus);

        if (!erreurStock && Array.isArray(variantes)) {
          variantes.forEach(function (variante) {
            stockParSku.set(variante.sku, variante);
          });
        }
      }

      const catalogueProduits = await chargerCatalogueFavoris();

      afficherFavoris(liste, stockParSku, catalogueProduits);
      zoneConnectee.hidden = true;
      zoneFavoris.hidden = false;
    } catch (error) {
      console.error('[TRIÈDRE] Chargement des favoris :', error);
      favorisErreur.textContent =
        'Impossible de charger tes favoris pour le moment.';
      favorisErreur.hidden = false;
      zoneConnectee.hidden = true;
      zoneFavoris.hidden = false;
    } finally {
      boutonMesFavoris.disabled = false;
    }
  }

  function afficherFavoris(favoris, stockParSku, catalogueProduits) {
    listeFavoris.innerHTML = '';

    if (!favoris.length) {
      aucunFavori.hidden = false;
      return;
    }

    aucunFavori.hidden = true;

    favoris.forEach(function (favori) {
      const carte = document.createElement('article');
      carte.className = 'membre-favori-carte';

      let visuel;
      const imageCatalogue = trouverImageFavoriDepuisCatalogue(
        favori,
        catalogueProduits
      );

      if (imageCatalogue) {
        visuel = document.createElement('img');
        visuel.className = 'membre-favori-image';
        visuel.src = imageCatalogue;
        visuel.alt = favori.product_name || 'Produit TRIÈDRE';
        visuel.loading = 'lazy';
      } else {
        visuel = document.createElement('div');
        visuel.className = 'membre-favori-image-placeholder';
        visuel.textContent = 'TRIÈDRE';
      }

      const contenu = document.createElement('div');
      contenu.className = 'membre-favori-contenu';

      const nom = document.createElement('h3');
      nom.className = 'membre-favori-nom';
      nom.textContent = favori.product_name || 'Produit TRIÈDRE';

      contenu.appendChild(nom);

      const varianteDetails = document.createElement('p');
      varianteDetails.className = 'membre-favori-variante';

      const details = [];
      if (favori.color) details.push(favori.color);
      if (favori.size) details.push(favori.size);
      if (favori.sku) details.push(favori.sku);

      varianteDetails.textContent = details.join(' — ');
      contenu.appendChild(varianteDetails);

      const stockActuel = favori.sku && stockParSku
        ? stockParSku.get(favori.sku)
        : null;

      const disponibilite = document.createElement('p');
      disponibilite.className = 'membre-favori-disponibilite';

      if (
        stockActuel &&
        stockActuel.active !== false &&
        Number(stockActuel.stock) > 0
      ) {
        disponibilite.textContent = 'Disponible';
        disponibilite.classList.add('is-disponible');
      } else {
        disponibilite.textContent = 'Indisponible';
        disponibilite.classList.add('is-indisponible');
      }

      contenu.appendChild(disponibilite);

      if (favori.price != null) {
        const prix = document.createElement('p');
        prix.className = 'membre-favori-prix';
        prix.textContent = formaterMontant(
          favori.price,
          favori.currency || 'CAD'
        );
        contenu.appendChild(prix);
      }

      const actions = document.createElement('div');
      actions.className = 'membre-favori-actions';

      if (favori.product_id) {
        const lien = document.createElement('a');
        lien.className = 'membre-favori-lien';

        const parametresProduit = new URLSearchParams();
        parametresProduit.set('id', favori.product_id);

        if (favori.sku) {
          parametresProduit.set('sku', favori.sku);
        }

        if (favori.color) {
          parametresProduit.set('couleur', favori.color);
        }

        if (favori.size) {
          parametresProduit.set('taille', favori.size);
        }

        lien.href = 'produit?' + parametresProduit.toString();
        lien.textContent = 'Voir le produit';
        actions.appendChild(lien);
      }

      const supprimer = document.createElement('button');
      supprimer.type = 'button';
      supprimer.className = 'membre-favori-supprimer';
      supprimer.textContent = 'Retirer';
      supprimer.addEventListener('click', function () {
        retirerFavori(favori.id, carte);
      });

      actions.appendChild(supprimer);
      contenu.appendChild(actions);

      carte.appendChild(visuel);
      carte.appendChild(contenu);
      listeFavoris.appendChild(carte);
    });
  }

  async function chargerCatalogueFavoris() {
    try {
      const response = await fetch('../04-data/produits.json');

      if (!response.ok) {
        throw new Error('Impossible de charger produits.json');
      }

      const donnees = await response.json();
      return Array.isArray(donnees.produits) ? donnees.produits : [];
    } catch (error) {
      console.warn('[TRIÈDRE] Catalogue favoris :', error);
      return [];
    }
  }

  function trouverImageFavoriDepuisCatalogue(favori, catalogueProduits) {
    if (!favori || !favori.product_id || !Array.isArray(catalogueProduits)) {
      return '';
    }

    const produit = catalogueProduits.find(function (item) {
      return item.id === favori.product_id;
    });

    if (!produit || !Array.isArray(produit.variantes)) {
      return '';
    }

    // Le SKU est la source de vérité : il identifie exactement
    // le produit + la couleur + la taille du favori.
    const variante = produit.variantes.find(function (item) {
      return item.sku === favori.sku;
    });

    if (variante && variante.photoFace) {
      return '../05-images/produits/' + variante.photoFace;
    }

    // Secours uniquement si le SKU n'est pas retrouvé :
    // on tente couleur + taille, qui correspondent aussi à une variante précise.
    const varianteSecours = produit.variantes.find(function (item) {
      return (
        item.couleur === favori.color &&
        item.taille === favori.size
      );
    });

    if (varianteSecours && varianteSecours.photoFace) {
      return '../05-images/produits/' + varianteSecours.photoFace;
    }

    return '';
  }

  async function retirerFavori(favoriId, carte) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriId);

    if (error) {
      console.error('[TRIÈDRE] Suppression favori :', error);
      afficherToast(
        'Impossible de retirer ce favori pour le moment.',
        'erreur'
      );
      return;
    }

    carte.remove();

    if (!listeFavoris.children.length) {
      aucunFavori.hidden = false;
    }

    afficherToast('Produit retiré de tes favoris.', 'succes');
  }

  function activerMesCommandes() {
    if (!boutonMesCommandes || !zoneCommandes || !boutonRetourCommandes) {
      return;
    }

    boutonMesCommandes.addEventListener('click', ouvrirMesCommandes);

    boutonRetourCommandes.addEventListener('click', function () {
      zoneCommandes.hidden = true;
      zoneConnectee.hidden = false;
      commandesErreur.hidden = true;
      commandesErreur.textContent = '';
    });
  }

  async function ouvrirMesCommandes() {
    boutonMesCommandes.disabled = true;
    commandesErreur.hidden = true;
    commandesErreur.textContent = '';
    listeCommandes.innerHTML = '';
    aucuneCommande.hidden = true;

    try {
      const {
        data: { user },
        error: erreurUtilisateur
      } = await supabase.auth.getUser();

      if (erreurUtilisateur || !user) {
        throw erreurUtilisateur || new Error('SESSION_INVALIDE');
      }

      const { data: commandes, error: erreurCommandes } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          currency,
          subtotal,
          shipping_amount,
          tax_amount,
          total_amount,
          created_at,
          order_items (
            id,
            sku,
            product_name,
            color,
            size,
            quantity,
            unit_price,
            line_total
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (erreurCommandes) {
        throw erreurCommandes;
      }

      afficherCommandes(commandes || []);
      zoneConnectee.hidden = true;
      zoneCommandes.hidden = false;
    } catch (error) {
      console.error('[TRIÈDRE] Chargement des commandes :', error);
      commandesErreur.textContent =
        'Impossible de charger tes commandes pour le moment.';
      commandesErreur.hidden = false;
      zoneConnectee.hidden = true;
      zoneCommandes.hidden = false;
    } finally {
      boutonMesCommandes.disabled = false;
    }
  }

  function afficherCommandes(commandes) {
    listeCommandes.innerHTML = '';

    if (!commandes.length) {
      aucuneCommande.hidden = false;
      return;
    }

    aucuneCommande.hidden = true;

    commandes.forEach(function (commande) {
      const carte = document.createElement('article');
      carte.className = 'membre-commande-carte';

      const entete = document.createElement('div');
      entete.className = 'membre-commande-entete';

      const blocTitre = document.createElement('div');

      const numero = document.createElement('h3');
      numero.className = 'membre-commande-numero';
      numero.textContent = 'Commande ' + (commande.order_number || '');

      const date = document.createElement('p');
      date.className = 'membre-commande-date';
      date.textContent = formaterDateCommande(commande.created_at);

      blocTitre.appendChild(numero);
      blocTitre.appendChild(date);

      const statut = document.createElement('span');
      statut.className = 'membre-commande-statut';
      statut.textContent = libelleStatutCommande(commande.status);

      entete.appendChild(blocTitre);
      entete.appendChild(statut);
      carte.appendChild(entete);

      const articles = document.createElement('div');
      articles.className = 'membre-commande-articles';

      (commande.order_items || []).forEach(function (article) {
        const ligne = document.createElement('div');
        ligne.className = 'membre-commande-article';

        const infos = document.createElement('div');
        infos.className = 'membre-commande-article-infos';

        const nom = document.createElement('span');
        nom.className = 'membre-commande-article-nom';
        nom.textContent = article.product_name || article.sku || 'Article TRIÈDRE';

        const details = document.createElement('span');
        details.className = 'membre-commande-article-details';

        const morceaux = [];
        if (article.color) morceaux.push(article.color);
        if (article.size) morceaux.push(article.size);
        morceaux.push('Qté ' + Number(article.quantity || 1));

        details.textContent = morceaux.join(' — ');

        infos.appendChild(nom);
        infos.appendChild(details);

        const prix = document.createElement('span');
        prix.className = 'membre-commande-article-prix';
        prix.textContent = formaterMontant(
          article.line_total != null
            ? article.line_total
            : Number(article.unit_price || 0) * Number(article.quantity || 1),
          commande.currency
        );

        ligne.appendChild(infos);
        ligne.appendChild(prix);
        articles.appendChild(ligne);
      });

      if (!(commande.order_items || []).length) {
        const videArticles = document.createElement('p');
        videArticles.className = 'membre-commande-date';
        videArticles.textContent = 'Détail des articles indisponible.';
        articles.appendChild(videArticles);
      }

      carte.appendChild(articles);

      const pied = document.createElement('div');
      pied.className = 'membre-commande-pied';

      const etiquette = document.createElement('span');
      etiquette.textContent = 'Total';

      const total = document.createElement('strong');
      total.className = 'membre-commande-total';
      total.textContent = formaterMontant(commande.total_amount, commande.currency);

      pied.appendChild(etiquette);
      pied.appendChild(total);
      carte.appendChild(pied);

      listeCommandes.appendChild(carte);
    });
  }

  function libelleStatutCommande(statut) {
    const statuts = {
      pending: 'En attente',
      paid: 'Payée',
      processing: 'En préparation',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
      refunded: 'Remboursée'
    };

    return statuts[statut] || 'En traitement';
  }

  function formaterDateCommande(dateIso) {
    if (!dateIso) {
      return '';
    }

    try {
      return new Intl.DateTimeFormat('fr-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(new Date(dateIso));
    } catch (error) {
      return '';
    }
  }

  function formaterMontant(montant, devise) {
    const valeur = Number(montant || 0);
    const currency = devise || 'CAD';

    try {
      return new Intl.NumberFormat('fr-CA', {
        style: 'currency',
        currency: currency
      }).format(valeur);
    } catch (error) {
      return valeur.toFixed(2) + ' ' + currency;
    }
  }

  function activerMesInformations() {
    if (!boutonMesInformations || !zoneInformations || !formulaireMesInformations) return;

    boutonMesInformations.addEventListener('click', ouvrirInformations);
    boutonRetourDashboard.addEventListener('click', function () {
      zoneInformations.hidden = true;
      zoneConnectee.hidden = false;
      reinitialiserMessagesInformations();
    });

    formulaireMesInformations.addEventListener('submit', async function (event) {
      event.preventDefault();
      reinitialiserMessagesInformations();

      const prenom = champProfilPrenom.value.trim();
      const nom = champProfilNom.value.trim();
      const sexe = obtenirSexeSelectionne();
      const dateNaissance = champProfilDateNaissance.value || null;
      const telephone = champProfilTelephone.value.trim();
      const nomComplet = composerNomComplet(prenom, nom);

      if (prenom.length < 2) { afficherErreurInformations('Entre un prénom valide.', champProfilPrenom); return; }
      if (nom.length < 2) { afficherErreurInformations('Entre un nom valide.', champProfilNom); return; }

      boutonEnregistrerInformations.disabled = true;

      try {
        const { data: { user }, error: erreurUtilisateur } = await supabase.auth.getUser();
        if (erreurUtilisateur || !user) throw erreurUtilisateur || new Error('SESSION_INVALIDE');

        const donneesProfil = {
          full_name: nomComplet,
          first_name: prenom,
          last_name: nom,
          gender: sexe || null,
          birth_date: dateNaissance,
          phone: telephone || null
        };

        const { error: erreurProfil } = await supabase.from('profiles').update(donneesProfil).eq('id', user.id);
        if (erreurProfil) throw erreurProfil;

        const { error: erreurMetadata } = await supabase.auth.updateUser({ data: donneesProfil });
        if (erreurMetadata) console.warn('[TRIÈDRE] Métadonnées Auth non synchronisées :', erreurMetadata);

        majEnteteCompte({ email: user.email || '', prenom: prenom, nomComplet: nomComplet });
        succesMesInformations.textContent = 'Tes informations ont été mises à jour.';
        succesMesInformations.hidden = false;
      } catch (error) {
        console.error('[TRIÈDRE] Mise à jour du profil :', error);
        erreurMesInformations.textContent = 'Impossible d’enregistrer tes modifications pour le moment.';
        erreurMesInformations.hidden = false;
      } finally {
        boutonEnregistrerInformations.disabled = false;
      }
    });
  }

  async function ouvrirInformations() {
    reinitialiserMessagesInformations();
    boutonMesInformations.disabled = true;

    try {
      const { data: { user }, error: erreurUtilisateur } = await supabase.auth.getUser();
      if (erreurUtilisateur || !user) throw erreurUtilisateur || new Error('SESSION_INVALIDE');

      const { data: profil, error: erreurProfil } = await supabase
        .from('profiles')
        .select('full_name, first_name, last_name, gender, birth_date, phone')
        .eq('id', user.id)
        .maybeSingle();

      if (erreurProfil) throw erreurProfil;

      const nomParDefaut = (profil && profil.full_name) || (user.user_metadata && user.user_metadata.full_name) || '';
      const nomDecoupe = decouperNomComplet(nomParDefaut);

      champProfilPrenom.value = (profil && profil.first_name) || (user.user_metadata && user.user_metadata.first_name) || nomDecoupe.prenom || '';
      champProfilNom.value = (profil && profil.last_name) || (user.user_metadata && user.user_metadata.last_name) || nomDecoupe.nom || '';
      selectionnerSexe((profil && profil.gender) || (user.user_metadata && user.user_metadata.gender) || '');
      champProfilDateNaissance.value = (profil && profil.birth_date) || (user.user_metadata && user.user_metadata.birth_date) || '';
      champProfilEmail.value = user.email || '';
      champProfilTelephone.value = (profil && profil.phone) || (user.user_metadata && user.user_metadata.phone) || '';

      zoneConnectee.hidden = true;
      zoneInformations.hidden = false;
      window.setTimeout(function () { champProfilPrenom.focus(); }, 50);
    } catch (error) {
      console.error('[TRIÈDRE] Chargement du profil :', error);
      afficherToast('Impossible de charger tes informations pour le moment.', 'erreur');
    } finally {
      boutonMesInformations.disabled = false;
    }
  }

  function obtenirSexeSelectionne() {
    const selection = Array.from(champsProfilSexe).find(function (champ) { return champ.checked; });
    return selection ? selection.value : '';
  }

  function selectionnerSexe(valeur) {
    champsProfilSexe.forEach(function (champ) { champ.checked = champ.value === valeur; });
  }

  function reinitialiserMessagesInformations() {
    erreurMesInformations.hidden = true;
    erreurMesInformations.textContent = '';
    succesMesInformations.hidden = true;
    succesMesInformations.textContent = '';
  }

  function afficherErreurInformations(texte, champ) {
    erreurMesInformations.textContent = texte;
    erreurMesInformations.hidden = false;
    if (champ) champ.focus();
  }

  function activerMesPreferences() {
    if (!boutonMesPreferences || !zonePreferences || !formulaireMesPreferences) return;

    boutonMesPreferences.addEventListener('click', ouvrirPreferences);

    boutonRetourPreferences.addEventListener('click', function () {
      zonePreferences.hidden = true;
      zoneConnectee.hidden = false;
      reinitialiserMessagesPreferences();
    });

    formulaireMesPreferences.addEventListener('submit', async function (event) {
      event.preventDefault();
      reinitialiserMessagesPreferences();

      const langue = obtenirLangueSelectionnee();

      if (!langue) {
        erreurMesPreferences.textContent = 'Choisis une langue de communication.';
        erreurMesPreferences.hidden = false;
        return;
      }

      boutonEnregistrerPreferences.disabled = true;

      try {
        const { data: { user }, error: erreurUtilisateur } = await supabase.auth.getUser();
        if (erreurUtilisateur || !user) throw erreurUtilisateur || new Error('SESSION_INVALIDE');

        const maintenant = new Date().toISOString();
        const donneesPreferences = {
          marketing_consent: preferenceMarketing.checked,
          marketing_consent_updated_at: maintenant,
          preferred_language: langue
        };

        const { error: erreurProfil } = await supabase
          .from('profiles')
          .update(donneesPreferences)
          .eq('id', user.id);

        if (erreurProfil) throw erreurProfil;

        const { error: erreurMetadata } = await supabase.auth.updateUser({
          data: {
            marketing_consent: preferenceMarketing.checked,
            marketing_consent_updated_at: maintenant,
            preferred_language: langue
          }
        });

        if (erreurMetadata) {
          console.warn('[TRIÈDRE] Préférences Auth non synchronisées :', erreurMetadata);
        }

        succesMesPreferences.textContent = 'Tes préférences ont été mises à jour.';
        succesMesPreferences.hidden = false;
      } catch (error) {
        console.error('[TRIÈDRE] Mise à jour des préférences :', error);
        erreurMesPreferences.textContent = 'Impossible d’enregistrer tes préférences pour le moment.';
        erreurMesPreferences.hidden = false;
      } finally {
        boutonEnregistrerPreferences.disabled = false;
      }
    });
  }

  async function ouvrirPreferences() {
    reinitialiserMessagesPreferences();
    boutonMesPreferences.disabled = true;

    try {
      const { data: { user }, error: erreurUtilisateur } = await supabase.auth.getUser();
      if (erreurUtilisateur || !user) throw erreurUtilisateur || new Error('SESSION_INVALIDE');

      const { data: profil, error: erreurProfil } = await supabase
        .from('profiles')
        .select('marketing_consent, preferred_language')
        .eq('id', user.id)
        .maybeSingle();

      if (erreurProfil) throw erreurProfil;

      preferenceMarketing.checked = Boolean(
        profil && typeof profil.marketing_consent === 'boolean'
          ? profil.marketing_consent
          : user.user_metadata && user.user_metadata.marketing_consent
      );

      selectionnerLangue(
        (profil && profil.preferred_language) ||
        (user.user_metadata && user.user_metadata.preferred_language) ||
        'fr'
      );

      zoneConnectee.hidden = true;
      zonePreferences.hidden = false;
    } catch (error) {
      console.error('[TRIÈDRE] Chargement des préférences :', error);
      afficherToast('Impossible de charger tes préférences pour le moment.', 'erreur');
    } finally {
      boutonMesPreferences.disabled = false;
    }
  }

  function obtenirLangueSelectionnee() {
    const selection = Array.from(preferencesLangue).find(function (champ) {
      return champ.checked;
    });
    return selection ? selection.value : '';
  }

  function selectionnerLangue(valeur) {
    preferencesLangue.forEach(function (champ) {
      champ.checked = champ.value === valeur;
    });
  }

  function reinitialiserMessagesPreferences() {
    erreurMesPreferences.hidden = true;
    erreurMesPreferences.textContent = '';
    succesMesPreferences.hidden = true;
    succesMesPreferences.textContent = '';
  }


  function activerMesAdresses() {
    if (!boutonMesAdresses || !zoneAdresses || !formulaireAdresse) return;

    boutonMesAdresses.addEventListener('click', ouvrirAdresses);

    boutonRetourAdresses.addEventListener('click', function () {
      fermerFormulaireAdresse();
      zoneAdresses.hidden = true;
      zoneConnectee.hidden = false;
    });

    boutonAjouterAdresse.addEventListener('click', async function () {
      await preparerNouvelleAdresse();
    });

    boutonAnnulerAdresse.addEventListener('click', fermerFormulaireAdresse);
    boutonAnnulerAdresseHaut.addEventListener('click', fermerFormulaireAdresse);

    mettreAJourRegionAdresse();

    champAdressePays.addEventListener('change', function () {
      mettreAJourRegionAdresse();
      champAdresseCodePostal.value = '';
    });

    champAdresseCodePostal.addEventListener('input', function () {
      champAdresseCodePostal.value = normaliserCodePostalAdresse(
        champAdresseCodePostal.value,
        champAdressePays.value
      );
    });

    listeAdresses.addEventListener('click', async function (event) {
      const bouton = event.target.closest('[data-adresse-action]');
      if (!bouton) return;

      const action = bouton.getAttribute('data-adresse-action');
      const id = bouton.getAttribute('data-adresse-id');
      if (!id) return;

      if (action === 'modifier') {
        await modifierAdresse(id);
        return;
      }

      if (action === 'defaut') {
        await definirAdresseParDefaut(id);
        return;
      }

      if (action === 'supprimer') {
        await supprimerAdresse(id);
      }
    });

    formulaireAdresse.addEventListener('submit', async function (event) {
      event.preventDefault();
      reinitialiserMessagesAdresse();

      const prenom = champAdressePrenom.value.trim();
      const nom = champAdresseNom.value.trim();
      const adresseLigne1 = champAdresseLigne1.value.trim();
      const ville = champAdresseVille.value.trim();
      const champRegion = document.getElementById('adresse-region');
      const region = champRegion ? champRegion.value.trim() : '';
      const pays = champAdressePays.value;
      const telephone = champAdresseTelephone.value.trim();
      const codePostal = normaliserCodePostalAdresse(champAdresseCodePostal.value, pays);

      if (!pays) {
        afficherErreurAdresse('Sélectionne un pays ou une région.', champAdressePays);
        return;
      }

      if (prenom.length < 2) {
        afficherErreurAdresse('Entre un prénom valide.', champAdressePrenom);
        return;
      }

      if (nom.length < 2) {
        afficherErreurAdresse('Entre un nom valide.', champAdresseNom);
        return;
      }

      if (adresseLigne1.length < 5) {
        afficherErreurAdresse('Entre une adresse complète avec le numéro et le nom de rue.', champAdresseLigne1);
        return;
      }

      if (ville.length < 2) {
        afficherErreurAdresse('Entre une ville valide.', champAdresseVille);
        return;
      }

      if (!region) {
        let messageRegion = 'Indique ton État, ta province ou ta région.';

        if (pays === 'CA') {
          messageRegion = 'Sélectionne ta province ou ton territoire.';
        } else if (pays === 'US') {
          messageRegion = 'Sélectionne ton État.';
        }

        afficherErreurAdresse(messageRegion, champRegion);
        return;
      }

      if (!estCodePostalAdresseValide(codePostal, pays)) {
        afficherErreurAdresse(messageCodePostalAdresse(pays), champAdresseCodePostal);
        return;
      }

      if (!estTelephoneAdresseValide(telephone, pays)) {
        afficherErreurAdresse(messageTelephoneAdresse(pays), champAdresseTelephone);
        return;
      }

      boutonEnregistrerAdresse.disabled = true;

      try {
        const { data: { user }, error: erreurUtilisateur } = await supabase.auth.getUser();
        if (erreurUtilisateur || !user) throw erreurUtilisateur || new Error('SESSION_INVALIDE');

        const id = champAdresseId.value || null;
        const veutDefaut = champAdresseDefaut.checked;

        const { count, error: erreurCompteur } = await supabase
          .from('member_addresses')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (erreurCompteur) throw erreurCompteur;

        const adresseParDefaut = veutDefaut || (!id && Number(count || 0) === 0);

        if (adresseParDefaut) {
          const { error: erreurResetDefaut } = await supabase
            .from('member_addresses')
            .update({ is_default: false })
            .eq('user_id', user.id);
          if (erreurResetDefaut) throw erreurResetDefaut;
        }

        const donnees = {
          user_id: user.id,
          label: champAdresseLibelle.value.trim() || null,
          first_name: prenom,
          last_name: nom,
          address_line1: adresseLigne1,
          address_line2: champAdresseLigne2.value.trim() || null,
          city: ville,
          province: region,
          postal_code: codePostal,
          country_code: pays,
          phone: telephone,
          is_default: adresseParDefaut
        };

        let erreurSauvegarde = null;

        if (id) {
          const { error } = await supabase
            .from('member_addresses')
            .update(donnees)
            .eq('id', id)
            .eq('user_id', user.id);
          erreurSauvegarde = error;
        } else {
          const { error } = await supabase
            .from('member_addresses')
            .insert(donnees);
          erreurSauvegarde = error;
        }

        if (erreurSauvegarde) throw erreurSauvegarde;

        adresseSucces.textContent = id ? 'Ton adresse a été mise à jour.' : 'Ton adresse a été enregistrée.';
        adresseSucces.hidden = false;
        await chargerAdresses();

        window.setTimeout(function () {
          fermerFormulaireAdresse();
        }, 900);
      } catch (error) {
        console.error('[TRIÈDRE] Enregistrement adresse :', error);
        adresseErreur.textContent = 'Impossible d’enregistrer cette adresse pour le moment.';
        adresseErreur.hidden = false;
      } finally {
        boutonEnregistrerAdresse.disabled = false;
      }
    });
  }

  async function ouvrirAdresses() {
    boutonMesAdresses.disabled = true;

    try {
      zoneConnectee.hidden = true;
      zoneInformations.hidden = true;
      zonePreferences.hidden = true;
      zoneAdresses.hidden = false;
      fermerFormulaireAdresse();
      await chargerAdresses();
    } catch (error) {
      console.error('[TRIÈDRE] Chargement adresses :', error);
      afficherToast('Impossible de charger tes adresses pour le moment.', 'erreur');
      zoneAdresses.hidden = true;
      zoneConnectee.hidden = false;
    } finally {
      boutonMesAdresses.disabled = false;
    }
  }

  async function chargerAdresses() {
    const { data: { user }, error: erreurUtilisateur } = await supabase.auth.getUser();
    if (erreurUtilisateur || !user) throw erreurUtilisateur || new Error('SESSION_INVALIDE');

    const { data, error } = await supabase
      .from('member_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;

    rendreAdresses(data || []);
  }

  function rendreAdresses(adresses) {
    listeAdresses.innerHTML = '';
    aucuneAdresse.hidden = adresses.length !== 0;

    adresses.forEach(function (adresse) {
      const article = document.createElement('article');
      article.className = 'membre-adresse-carte';

      const libelle = echapperHtml(adresse.label || 'Adresse');
      const nomComplet = echapperHtml([adresse.first_name, adresse.last_name].filter(Boolean).join(' '));
      const ligne1 = echapperHtml(adresse.address_line1 || '');
      const ligne2 = adresse.address_line2 ? '<p>' + echapperHtml(adresse.address_line2) + '</p>' : '';
      const ville = echapperHtml(adresse.city || '');
      const province = echapperHtml(adresse.province || '');
      const codePostal = echapperHtml(adresse.postal_code || '');
      const telephone = echapperHtml(adresse.phone || '');
      const pays = echapperHtml(nomPaysAdresse(adresse.country_code));
      const badge = adresse.is_default ? '<span class="membre-adresse-badge">Par défaut</span>' : '';
      const boutonDefaut = adresse.is_default ? '' : '<button type="button" class="membre-adresse-action" data-adresse-action="defaut" data-adresse-id="' + adresse.id + '">Définir par défaut</button>';

      article.innerHTML =
        '<div class="membre-adresse-carte-entete">' +
          '<div class="membre-adresse-carte-titre"><h3>' + libelle + '</h3>' + badge + '</div>' +
        '</div>' +
        '<p><strong>' + nomComplet + '</strong></p>' +
        '<p>' + ligne1 + '</p>' +
        ligne2 +
        '<p>' + ville + ', ' + province + ' ' + codePostal + '</p>' +
        '<p>' + pays + '</p>' +
        '<p>' + telephone + '</p>' +
        '<div class="membre-adresse-carte-actions">' +
          '<button type="button" class="membre-adresse-action" data-adresse-action="modifier" data-adresse-id="' + adresse.id + '">Modifier</button>' +
          boutonDefaut +
          '<button type="button" class="membre-adresse-action membre-adresse-action-supprimer" data-adresse-action="supprimer" data-adresse-id="' + adresse.id + '">Supprimer</button>' +
        '</div>';

      listeAdresses.appendChild(article);
    });
  }

  async function preparerNouvelleAdresse() {
    reinitialiserFormulaireAdresse();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profil } = await supabase
          .from('profiles')
          .select('first_name, last_name, phone')
          .eq('id', user.id)
          .maybeSingle();

        if (profil) {
          champAdressePrenom.value = profil.first_name || '';
          champAdresseNom.value = profil.last_name || '';
          champAdresseTelephone.value = profil.phone || '';
        }
      }
    } catch (error) {
      console.warn('[TRIÈDRE] Préremplissage adresse :', error);
    }

    adresseModeLabel.textContent = 'Nouvelle adresse';
    adresseFormTitre.textContent = 'Ajouter une adresse';
    boutonEnregistrerAdresse.textContent = 'Enregistrer l’adresse';
    formulaireAdresse.hidden = false;
    window.setTimeout(function () { champAdresseLibelle.focus(); }, 50);
  }

  async function modifierAdresse(id) {
    reinitialiserMessagesAdresse();

    try {
      const { data: { user }, error: erreurUtilisateur } = await supabase.auth.getUser();
      if (erreurUtilisateur || !user) throw erreurUtilisateur || new Error('SESSION_INVALIDE');

      const { data: adresse, error } = await supabase
        .from('member_addresses')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      if (error) throw error;

      champAdresseId.value = adresse.id;
      champAdresseLibelle.value = adresse.label || '';
      champAdressePays.value = adresse.country_code || 'CA';
      mettreAJourRegionAdresse(adresse.province || '');
      champAdressePrenom.value = adresse.first_name || '';
      champAdresseNom.value = adresse.last_name || '';
      champAdresseLigne1.value = adresse.address_line1 || '';
      champAdresseLigne2.value = adresse.address_line2 || '';
      champAdresseVille.value = adresse.city || '';
      champAdresseCodePostal.value = adresse.postal_code || '';
      champAdresseTelephone.value = adresse.phone || '';
      champAdresseDefaut.checked = Boolean(adresse.is_default);

      adresseModeLabel.textContent = 'Adresse enregistrée';
      adresseFormTitre.textContent = 'Modifier l’adresse';
      boutonEnregistrerAdresse.textContent = 'Enregistrer les modifications';
      formulaireAdresse.hidden = false;
      window.setTimeout(function () { champAdresseLibelle.focus(); }, 50);
    } catch (error) {
      console.error('[TRIÈDRE] Modification adresse :', error);
      afficherToast('Impossible de charger cette adresse.', 'erreur');
    }
  }

  async function definirAdresseParDefaut(id) {
    try {
      const { data: { user }, error: erreurUtilisateur } = await supabase.auth.getUser();
      if (erreurUtilisateur || !user) throw erreurUtilisateur || new Error('SESSION_INVALIDE');

      const { error: erreurReset } = await supabase
        .from('member_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);
      if (erreurReset) throw erreurReset;

      const { error } = await supabase
        .from('member_addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;

      await chargerAdresses();
      afficherToast('Adresse par défaut mise à jour.', 'succes');
    } catch (error) {
      console.error('[TRIÈDRE] Adresse par défaut :', error);
      afficherToast('Impossible de modifier l’adresse par défaut.', 'erreur');
    }
  }

  async function supprimerAdresse(id) {
    const confirmation = window.confirm('Supprimer cette adresse enregistrée ?');
    if (!confirmation) return;

    try {
      const { data: { user }, error: erreurUtilisateur } = await supabase.auth.getUser();
      if (erreurUtilisateur || !user) throw erreurUtilisateur || new Error('SESSION_INVALIDE');

      const { data: adresse, error: erreurLecture } = await supabase
        .from('member_addresses')
        .select('is_default')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      if (erreurLecture) throw erreurLecture;

      const { error } = await supabase
        .from('member_addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;

      if (adresse && adresse.is_default) {
        const { data: restantes, error: erreurRestantes } = await supabase
          .from('member_addresses')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1);
        if (erreurRestantes) throw erreurRestantes;

        if (restantes && restantes.length) {
          const { error: erreurNouveauDefaut } = await supabase
            .from('member_addresses')
            .update({ is_default: true })
            .eq('id', restantes[0].id)
            .eq('user_id', user.id);
          if (erreurNouveauDefaut) throw erreurNouveauDefaut;
        }
      }

      fermerFormulaireAdresse();
      await chargerAdresses();
      afficherToast('Adresse supprimée.', 'succes');
    } catch (error) {
      console.error('[TRIÈDRE] Suppression adresse :', error);
      afficherToast('Impossible de supprimer cette adresse.', 'erreur');
    }
  }

  function fermerFormulaireAdresse() {
    formulaireAdresse.hidden = true;
    reinitialiserFormulaireAdresse();
  }

  function reinitialiserFormulaireAdresse() {
    formulaireAdresse.reset();
    champAdresseId.value = '';
    champAdressePays.value = 'CA';
    mettreAJourRegionAdresse();
    champAdresseDefaut.checked = false;
    adresseModeLabel.textContent = 'Nouvelle adresse';
    adresseFormTitre.textContent = 'Ajouter une adresse';
    boutonEnregistrerAdresse.textContent = 'Enregistrer l’adresse';
    reinitialiserMessagesAdresse();
  }

  function reinitialiserMessagesAdresse() {
    adresseErreur.hidden = true;
    adresseErreur.textContent = '';
    adresseSucces.hidden = true;
    adresseSucces.textContent = '';
  }

  function afficherErreurAdresse(texte, champ) {
    adresseErreur.textContent = texte;
    adresseErreur.hidden = false;
    if (champ) champ.focus();
  }

  function mettreAJourRegionAdresse(selection) {
    const pays = champAdressePays.value;
    const valeur = selection || '';

    if (pays === 'CA') {
      groupeAdresseRegion.innerHTML =
        '<label for="adresse-region">Province / Territoire <span class="membre-obligatoire" aria-hidden="true">*</span></label>' +
        '<select id="adresse-region" autocomplete="address-level1" required aria-required="true">' +
          '<option value="">Sélectionner</option>' +
          optionsAdresseDepuisListe(provincesCanada, valeur) +
        '</select>';

      labelAdresseCodePostal.innerHTML = 'Code postal <span class="membre-obligatoire" aria-hidden="true">*</span>';
      champAdresseCodePostal.placeholder = 'H2X 1Y4';
      champAdresseTelephone.placeholder = '+1 514 000 0000';
      return;
    }

    if (pays === 'US') {
      groupeAdresseRegion.innerHTML =
        '<label for="adresse-region">État <span class="membre-obligatoire" aria-hidden="true">*</span></label>' +
        '<select id="adresse-region" autocomplete="address-level1" required aria-required="true">' +
          '<option value="">Sélectionner</option>' +
          optionsAdresseDepuisListe(etatsUnis, valeur) +
        '</select>';

      labelAdresseCodePostal.innerHTML = 'Code ZIP <span class="membre-obligatoire" aria-hidden="true">*</span>';
      champAdresseCodePostal.placeholder = '10001';
      champAdresseTelephone.placeholder = '+1 212 555 0123';
      return;
    }

    if (pays === 'MX') {
      groupeAdresseRegion.innerHTML =
        '<label for="adresse-region">État <span class="membre-obligatoire" aria-hidden="true">*</span></label>' +
        '<select id="adresse-region" autocomplete="address-level1" required aria-required="true">' +
          '<option value="">Sélectionner</option>' +
          optionsAdresseDepuisListe(etatsMexique, valeur) +
        '</select>';

      labelAdresseCodePostal.innerHTML = 'Code postal <span class="membre-obligatoire" aria-hidden="true">*</span>';
      champAdresseCodePostal.placeholder = '01234';
      champAdresseTelephone.placeholder = '+52 55 1234 5678';
      return;
    }

    groupeAdresseRegion.innerHTML =
      '<label for="adresse-region">État, province ou région <span class="membre-obligatoire" aria-hidden="true">*</span></label>' +
      '<input type="text" id="adresse-region" autocomplete="address-level1" required aria-required="true" value="' +
      echapperHtml(valeur) + '">';

    labelAdresseCodePostal.innerHTML = 'Code postal <span class="membre-obligatoire" aria-hidden="true">*</span>';

    champAdresseCodePostal.placeholder = '';
    champAdresseTelephone.placeholder = '+ indicatif international';
  }

  function optionsAdresseDepuisListe(liste, selection) {
    return liste.map(function (element) {
      const selected = element === selection ? ' selected' : '';
      return '<option value="' + echapperHtml(element) + '"' + selected + '>' +
        echapperHtml(element) + '</option>';
    }).join('');
  }

  function normaliserCodePostalAdresse(valeur, pays) {
    const texte = String(valeur || '').toUpperCase();

    if (pays === 'CA') {
      const brut = texte.replace(/[^A-Z0-9]/g, '').slice(0, 6);
      return brut.length > 3 ? brut.slice(0, 3) + ' ' + brut.slice(3) : brut;
    }

    if (pays === 'US') {
      const brut = texte.replace(/[^0-9]/g, '').slice(0, 9);
      return brut.length > 5 ? brut.slice(0, 5) + '-' + brut.slice(5) : brut;
    }

    if (pays === 'MX') {
      return texte.replace(/[^0-9]/g, '').slice(0, 5);
    }

    return texte.replace(/[^A-Z0-9 -]/g, '').slice(0, 12);
  }

  function estCodePostalAdresseValide(valeur, pays) {
    const code = String(valeur || '').trim();

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

  function messageCodePostalAdresse(pays) {
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

  function estTelephoneAdresseValide(valeur, pays) {
    const chiffres = String(valeur || '').trim().replace(/\D/g, '');

    if (!chiffres) return false;

    if (pays === 'CA' || pays === 'US') {
      const sansIndicatif = chiffres.length === 11 && chiffres.startsWith('1')
        ? chiffres.slice(1)
        : chiffres;

      return sansIndicatif.length === 10 && /^[2-9]\d{2}[2-9]\d{6}$/.test(sansIndicatif);
    }

    if (pays === 'MX') {
      const sansIndicatif = chiffres.length === 12 && chiffres.startsWith('52')
        ? chiffres.slice(2)
        : chiffres;

      return sansIndicatif.length === 10 && /^\d{10}$/.test(sansIndicatif);
    }

    return /^\d{10,15}$/.test(chiffres);
  }

  function messageTelephoneAdresse(pays) {
    if (pays === 'CA' || pays === 'US') {
      return 'Entre un numéro de téléphone nord-américain valide à 10 chiffres.';
    }

    if (pays === 'MX') {
      return 'Entre un numéro de téléphone mexicain valide à 10 chiffres.';
    }

    return 'Entre un numéro de téléphone valide de 10 à 15 chiffres, avec indicatif international si nécessaire.';
  }

  function nomPaysAdresse(code) {
    if (code === 'US') return 'États-Unis';
    if (code === 'MX') return 'Mexique';
    if (code === 'OTHER') return 'Autre pays';
    return 'Canada';
  }

  function echapperHtml(valeur) {
    return String(valeur == null ? '' : valeur)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function activerSuppressionCompte() {
    if (!boutonSuppressionCompte || !modalSuppressionCompte || !formulaireSuppressionCompte) return;

    function ouvrirModal() {
      erreurSuppressionCompte.hidden = true;
      erreurSuppressionCompte.textContent = '';
      champSuppressionMdp.value = '';
      modalSuppressionCompte.hidden = false;
      document.body.classList.add('membre-modal-ouverte');
      window.setTimeout(function () { champSuppressionMdp.focus(); }, 50);
    }

    function fermerModal() {
      modalSuppressionCompte.hidden = true;
      document.body.classList.remove('membre-modal-ouverte');
      champSuppressionMdp.value = '';
      erreurSuppressionCompte.hidden = true;
      erreurSuppressionCompte.textContent = '';
    }

    boutonSuppressionCompte.addEventListener('click', ouvrirModal);
    document.querySelectorAll('[data-fermer-suppression]').forEach(function (element) { element.addEventListener('click', fermerModal); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && !modalSuppressionCompte.hidden) fermerModal(); });

    formulaireSuppressionCompte.addEventListener('submit', async function (event) {
      event.preventDefault();
      const motDePasse = champSuppressionMdp.value;

      if (!motDePasse) {
        erreurSuppressionCompte.textContent = 'Entre ton mot de passe pour continuer.';
        erreurSuppressionCompte.hidden = false;
        champSuppressionMdp.focus();
        return;
      }

      boutonConfirmerSuppression.disabled = true;
      erreurSuppressionCompte.hidden = true;
      erreurSuppressionCompte.textContent = '';

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) throw new Error('SESSION_INVALIDE');

        const { error: erreurReauth } = await supabase.auth.signInWithPassword({ email: user.email, password: motDePasse });
        champSuppressionMdp.value = '';

        if (erreurReauth) {
          erreurSuppressionCompte.textContent = 'Mot de passe incorrect.';
          erreurSuppressionCompte.hidden = false;
          return;
        }

        const { error: erreurSuppression } = await supabase.rpc('delete_own_account');
        if (erreurSuppression) throw erreurSuppression;

        await supabase.auth.signOut({ scope: 'local' }).catch(function () {});
        fermerModal();
        afficherDeconnecte(true);
        afficherMessage('Ton compte TRIÈDRE a été supprimé.', 'succes');
      } catch (error) {
        console.error('[TRIÈDRE] Suppression du compte :', error);
        erreurSuppressionCompte.textContent = 'Impossible de supprimer ton compte pour le moment.';
        erreurSuppressionCompte.hidden = false;
      } finally {
        boutonConfirmerSuppression.disabled = false;
      }
    });
  }

  function activerDeconnexion() {
    btnDeconnexion.addEventListener('click', async function () {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[TRIÈDRE] Déconnexion :', error);
        afficherMessage('Impossible de te déconnecter pour le moment.', 'erreur');
        return;
      }
      afficherDeconnecte(true);
      afficherMessage('Tu es maintenant déconnecté.', 'succes');
    });
  }

  function afficherConnecte(user) {
    authZone.hidden = true;
    zoneReset.hidden = true;
    zoneInformations.hidden = true;
    zoneConnectee.hidden = false;
    zoneInformations.hidden = true;
    zonePreferences.hidden = true;
    zoneAdresses.hidden = true;
    if (membrePage) membrePage.classList.add('membre-page-connectee');

    const nomMetadata = user.user_metadata && user.user_metadata.full_name ? user.user_metadata.full_name : '';
    const prenomMetadata = user.user_metadata && user.user_metadata.first_name ? user.user_metadata.first_name : '';
    majEnteteCompte({ email: user.email || '', prenom: prenomMetadata || decouperNomComplet(nomMetadata).prenom, nomComplet: nomMetadata });
  }

  function afficherDeconnecte(effacerEmail) {
    zoneConnectee.hidden = true;
    zoneInformations.hidden = true;
    zonePreferences.hidden = true;
    zoneAdresses.hidden = true;
    zoneInformations.hidden = true;
    zoneReset.hidden = true;
    authZone.hidden = false;
    if (membrePage) membrePage.classList.remove('membre-page-connectee');

    connexion.hidden = true;
    inscription.hidden = true;
    etapeEmail.hidden = false;
    nettoyerChampsConnexion();
    nettoyerChampsInscription(false);

    if (effacerEmail) {
      champEmailInitial.value = '';
      renseignerEmail('');
    }
  }

  function afficherReset() {
    authZone.hidden = true;
    zoneConnectee.hidden = true;
    zoneInformations.hidden = true;
    zonePreferences.hidden = true;
    zoneAdresses.hidden = true;
    zoneReset.hidden = false;
    if (membrePage) membrePage.classList.remove('membre-page-connectee');
    resetForm.reset();
    afficherMessage('Tu peux maintenant choisir un nouveau mot de passe.', 'succes');
    document.getElementById('nouveau-mdp').focus();
  }

  function afficherFormulaireConnexion(email) {
    renseignerEmail(email);
    etapeEmail.hidden = true;
    inscription.hidden = true;
    connexion.hidden = false;
  }

  function afficherFormulaireInscription(email) {
    renseignerEmail(email);
    etapeEmail.hidden = true;
    connexion.hidden = true;
    inscription.hidden = false;
  }

  function renseignerEmail(email) {
    const valeur = (email || '').trim().toLowerCase();
    champConnexionEmail.value = valeur;
    texteConnexionEmail.textContent = valeur;
    champInscriptionEmail.value = valeur;
    texteInscriptionEmail.textContent = valeur;
  }

  function nettoyerChampsConnexion() {
    champConnexionMdp.value = '';
  }

  function nettoyerChampsInscription(effacerNom) {
    champInscriptionMdp.value = '';
    if (caseMarketing) caseMarketing.checked = false;
    if (effacerNom) champInscriptionNom.value = '';
  }

  function majEnteteCompte(donnees) {
    const prenom = donnees.prenom || decouperNomComplet(donnees.nomComplet || '').prenom || '';
    const elementPrenom = document.getElementById('membre-prenom');
    const elementEmail = document.getElementById('membre-email');
    if (elementPrenom) elementPrenom.textContent = prenom || 'chez TRIÈDRE';
    if (elementEmail) elementEmail.textContent = donnees.email || '';
  }

  function decouperNomComplet(nomComplet) {
    const propre = String(nomComplet || '').trim().replace(/\s+/g, ' ');
    if (!propre) return { prenom: '', nom: '' };
    const morceaux = propre.split(' ');
    const prenom = morceaux.shift() || '';
    return { prenom: prenom, nom: morceaux.join(' ') };
  }

  function composerNomComplet(prenom, nom) {
    return [prenom, nom].filter(Boolean).join(' ').trim();
  }

  function urlMembre() { return window.location.origin + '/membre'; }

  function etatBouton(bouton, charge, texte) {
    if (!bouton) return;
    bouton.disabled = charge;
    bouton.textContent = texte;
  }

  function afficherMessage(texte, type) {
    if (!message) return;
    message.hidden = false;
    message.textContent = texte;
    message.className = 'membre-message membre-message-' + type;
  }

  function masquerMessage() {
    if (!message) return;
    message.hidden = true;
    message.textContent = '';
    message.className = 'membre-message';
  }

  function desactiverFormulaires() {
    document.querySelectorAll('.membre-formulaires input, .membre-formulaires button, .membre-formulaires select').forEach(function (element) { element.disabled = true; });
  }
});
