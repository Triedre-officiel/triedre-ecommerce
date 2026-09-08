
// ==========================================================================
// TRIÈDRE — Espace Membre — Auth Supabase — parcours email-first V3
// ==========================================================================

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const supabase = window.triedreSupabase;
  const membrePage = document.querySelector('.membre-page');
  const navigationMembre = document.getElementById('membre-navigation-connectee');
  const boutonAccueilMembre = document.getElementById('membre-retour-accueil');

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
  const boutonAnnulerInformations = document.getElementById('annuler-mes-informations');

  const boutonOuvrirMotDePasse = document.getElementById('modifier-mot-de-passe');
  const zoneMotDePasse = document.getElementById('zone-modification-mot-de-passe');
  const champMotDePasseActuel = document.getElementById('mot-de-passe-actuel');
  const champNouveauMotDePasse = document.getElementById('nouveau-mot-de-passe');
  const champConfirmationMotDePasse = document.getElementById('confirmation-mot-de-passe');
  const boutonAnnulerMotDePasse = document.getElementById('annuler-mot-de-passe');
  const boutonSauvegarderMotDePasse = document.getElementById('sauvegarder-mot-de-passe');
  const erreurMotDePasse = document.getElementById('mot-de-passe-erreur');

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

  const etatProgrammesV11 = {
    userId: null,
    programmes: [],
    programmeActif: null,
    seances: [],
    mesures: [],
    debutSemaine: obtenirDebutSemaine(new Date()),
    dateSelectionnee: normaliserDate(new Date()),
    seanceSelectionnee: null,
    chargement: false
  };

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
  initialiserMesProgrammesV10();
  activerCommunaute();
  activerMesFavoris();
  activerMesCommandes();
  activerMesInformations();
  activerMesPreferences();
  activerMesAdresses();
  activerSuppressionCompte();
  activerDeconnexion();
  activerReset();
  initialiserNavigationMembrePremium();
  initialiserSession();

  function masquerToutesZonesMembre() {
    ['membre-connecte','membre-abonnements','membre-programmes','membre-communaute','membre-favoris','membre-commandes','membre-informations','membre-preferences','membre-adresses','membre-reset'].forEach(function (id) { const zone = document.getElementById(id); if (zone) zone.hidden = true; });
  }

  function fermerMenusNavigationMembre() {
    if (!navigationMembre) return;
    navigationMembre.querySelectorAll('details[open]').forEach(function (details) { details.removeAttribute('open'); });
  }

  function afficherAccueilMembrePremium() {
    masquerToutesZonesMembre();
    zoneConnectee.hidden = false;
    fermerMenusNavigationMembre();
    window.scrollTo({ top: membrePage ? membrePage.offsetTop : 0, behavior: 'smooth' });
  }

  function initialiserNavigationMembrePremium() {
    if (!navigationMembre) return;
    if (boutonAccueilMembre) boutonAccueilMembre.addEventListener('click', afficherAccueilMembrePremium);
    navigationMembre.addEventListener('click', function (event) {
      const bouton = event.target.closest('button');
      if (!bouton) return;
      const estNavigation = bouton.id && bouton.id.indexOf('ouvrir-') === 0;
      if (estNavigation) masquerToutesZonesMembre();
      window.setTimeout(fermerMenusNavigationMembre, 0);
    }, true);
    const raccourcis = { commandes: 'ouvrir-mes-commandes', favoris: 'ouvrir-mes-favoris', programmes: 'ouvrir-mes-programmes', informations: 'ouvrir-mes-informations' };
    document.querySelectorAll('[data-membre-raccourci]').forEach(function (bouton) {
      bouton.addEventListener('click', function () { const idCible = raccourcis[bouton.getAttribute('data-membre-raccourci')]; const cible = idCible ? document.getElementById(idCible) : null; if (cible) cible.click(); });
    });
    document.addEventListener('click', function (event) { if (!navigationMembre.contains(event.target)) fermerMenusNavigationMembre(); });
  }

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
      await orienterApresConnexion(data.user);
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
    masquerToutesZonesMembre();
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
    if (!boutonMesProgrammes || !zoneProgrammes || !boutonRetourProgrammes) {
      return;
    }

    boutonMesProgrammes.addEventListener('click', ouvrirMesProgrammesV11);

    boutonRetourProgrammes.addEventListener('click', function () {
      zoneProgrammes.hidden = true;
      zoneConnectee.hidden = false;
    });
  }

  function initialiserMesProgrammesV10() {
    const precedent = document.getElementById('programme-semaine-precedente');
    const suivant = document.getElementById('programme-semaine-suivante');
    const actuelle = document.getElementById('programme-semaine-actuelle');
    const boutonPoids = document.getElementById('programme-ajouter-poids');
    const boutonSeance = document.getElementById('programme-commencer-seance');

    if (precedent) {
      precedent.addEventListener('click', function () {
        etatProgrammesV11.debutSemaine =
          ajouterJours(etatProgrammesV11.debutSemaine, -7);
        etatProgrammesV11.dateSelectionnee =
          normaliserDate(etatProgrammesV11.debutSemaine);
        rendreCalendrierProgrammesV11();
      });
    }

    if (suivant) {
      suivant.addEventListener('click', function () {
        etatProgrammesV11.debutSemaine =
          ajouterJours(etatProgrammesV11.debutSemaine, 7);
        etatProgrammesV11.dateSelectionnee =
          normaliserDate(etatProgrammesV11.debutSemaine);
        rendreCalendrierProgrammesV11();
      });
    }

    if (actuelle) {
      actuelle.addEventListener('click', function () {
        etatProgrammesV11.debutSemaine = obtenirDebutSemaine(new Date());
        etatProgrammesV11.dateSelectionnee = normaliserDate(new Date());
        rendreCalendrierProgrammesV11();
      });
    }

    if (boutonPoids) {
      boutonPoids.addEventListener('click', ouvrirModalPoidsV11);
    }

    if (boutonSeance) {
      boutonSeance.addEventListener('click', gererActionSeanceV11);
    }

    rendreCalendrierProgrammesV11();
    rendreCourbePoidsV10([]);
  }

  async function ouvrirMesProgrammesV11() {
    if (etatProgrammesV11.chargement) {
      return;
    }

    etatProgrammesV11.chargement = true;
    boutonMesProgrammes.disabled = true;

    try {
      const {
        data: { user },
        error: erreurUtilisateur
      } = await supabase.auth.getUser();

      if (erreurUtilisateur || !user) {
        throw erreurUtilisateur || new Error('SESSION_INVALIDE');
      }

      etatProgrammesV11.userId = user.id;

      await chargerDonneesProgrammesV11();

      zoneConnectee.hidden = true;
      zoneProgrammes.hidden = false;
    } catch (error) {
      console.error('[TRIÈDRE] Chargement des programmes :', error);
      afficherToast(
        'Impossible de charger tes programmes pour le moment.',
        'erreur'
      );
    } finally {
      etatProgrammesV11.chargement = false;
      boutonMesProgrammes.disabled = false;
    }
  }

  async function chargerDonneesProgrammesV11() {
    const { data: affectations, error: erreurAffectations } = await supabase
      .from('member_programs')
      .select(`
        id,
        program_id,
        coach_id,
        start_date,
        end_date,
        status,
        created_at
      `)
      .eq('user_id', etatProgrammesV11.userId)
      .order('start_date', { ascending: false });

    if (erreurAffectations) {
      throw erreurAffectations;
    }

    const idsProgrammes = Array.from(
      new Set((affectations || []).map(function (item) {
        return item.program_id;
      }).filter(Boolean))
    );

    let catalogues = [];

    if (idsProgrammes.length) {
      const { data, error } = await supabase
        .from('training_programs')
        .select(`
          id,
          name,
          goal,
          level,
          duration_weeks,
          sessions_per_week,
          description,
          active
        `)
        .in('id', idsProgrammes);

      if (error) {
        throw error;
      }

      catalogues = data || [];
    }

    const catalogueParId = new Map(
      catalogues.map(function (programme) {
        return [programme.id, programme];
      })
    );

    etatProgrammesV11.programmes = (affectations || []).map(function (affectation) {
      return Object.assign({}, affectation, {
        programme: catalogueParId.get(affectation.program_id) || null
      });
    });

    etatProgrammesV11.programmeActif =
      etatProgrammesV11.programmes.find(function (item) {
        return item.status === 'active';
      }) || null;

    etatProgrammesV11.seances = [];
    etatProgrammesV11.mesures = [];

    if (etatProgrammesV11.programmeActif) {
      await chargerSeancesProgrammeActifV11();
      await chargerMesuresPoidsV11();
    } else {
      // Le poids reste personnel : si aucun programme n'est actif,
      // on garde les dernières mesures disponibles pour ne rien perdre.
      await chargerMesuresPoidsV11();
    }

    rendreMesProgrammesV11();
    rendreCalendrierProgrammesV11();
    rendreIndicateursProgrammesV11();
    rendreCourbePoidsV10(
      etatProgrammesV11.mesures.map(function (mesure) {
        return {
          poids: mesure.weight_kg,
          date: mesure.measured_on
        };
      })
    );
  }

  async function chargerSeancesProgrammeActifV11() {
    const affectation = etatProgrammesV11.programmeActif;

    const { data: seances, error: erreurSeances } = await supabase
      .from('training_sessions')
      .select(`
        id,
        member_program_id,
        scheduled_date,
        week_number,
        session_number,
        title,
        description,
        duration_minutes,
        level,
        objective,
        started_at,
        completed_at
      `)
      .eq('member_program_id', affectation.id)
      .order('scheduled_date', { ascending: true });

    if (erreurSeances) {
      throw erreurSeances;
    }

    const idsSeances = (seances || []).map(function (seance) {
      return seance.id;
    });

    let exercices = [];

    if (idsSeances.length) {
      const { data, error } = await supabase
        .from('training_exercises')
        .select(`
          id,
          session_id,
          position,
          name,
          sets,
          reps,
          rest_seconds,
          duration_seconds,
          notes
        `)
        .in('session_id', idsSeances)
        .order('position', { ascending: true });

      if (error) {
        throw error;
      }

      exercices = data || [];
    }

    const exercicesParSeance = new Map();

    exercices.forEach(function (exercice) {
      if (!exercicesParSeance.has(exercice.session_id)) {
        exercicesParSeance.set(exercice.session_id, []);
      }

      exercicesParSeance.get(exercice.session_id).push(exercice);
    });

    etatProgrammesV11.seances = (seances || []).map(function (seance) {
      return {
        id: seance.id,
        date: seance.scheduled_date,
        weekNumber: seance.week_number,
        sessionNumber: seance.session_number,
        titre: seance.title,
        description: seance.description,
        dureeMinutes: seance.duration_minutes,
        niveau: seance.level,
        objectif: seance.objective,
        startedAt: seance.started_at,
        completedAt: seance.completed_at,
        exercices: exercicesParSeance.get(seance.id) || []
      };
    });
  }

  async function chargerMesuresPoidsV11() {
    let requete = supabase
      .from('weight_entries')
      .select('id, measured_on, weight_kg, created_at')
      .eq('user_id', etatProgrammesV11.userId)
      .order('measured_on', { ascending: true })
      .limit(100);

    if (
      etatProgrammesV11.programmeActif &&
      etatProgrammesV11.programmeActif.start_date
    ) {
      requete = requete.gte(
        'measured_on',
        etatProgrammesV11.programmeActif.start_date
      );
    }

    const { data, error } = await requete;

    if (error) {
      throw error;
    }

    etatProgrammesV11.mesures = data || [];
  }

  function rendreCalendrierProgrammesV11() {
    const listeJours = document.getElementById('programme-jours');
    const periode = document.getElementById('programme-periode');

    if (!listeJours || !periode) {
      return;
    }

    const jours = construireSemaine(etatProgrammesV11.debutSemaine);
    listeJours.innerHTML = '';

    periode.textContent =
      formaterDateCourte(jours[0]) +
      ' — ' +
      formaterDateCourte(jours[6]);

    jours.forEach(function (date) {
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'programme-jour';
      bouton.setAttribute('role', 'listitem');

      const cle = cleDate(date);
      const selectionnee =
        cle === cleDate(etatProgrammesV11.dateSelectionnee);
      const aujourdHui = cle === cleDate(new Date());

      const seance = etatProgrammesV11.seances.find(function (item) {
        return item.date === cle;
      });

      if (selectionnee) {
        bouton.classList.add('is-selected');
      }

      if (aujourdHui) {
        bouton.classList.add('is-aujourdhui');
      }

      if (seance) {
        bouton.classList.add('has-seance');

        if (seance.completedAt) {
          bouton.classList.add('is-completed');
          bouton.setAttribute('title', 'Séance terminée');
        } else {
          bouton.setAttribute('title', seance.titre || 'Séance prévue');
        }
      }

      const nom = document.createElement('span');
      nom.className = 'programme-jour-nom';
      nom.textContent = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'][
        (date.getDay() + 6) % 7
      ];

      const nombre = document.createElement('span');
      nombre.className = 'programme-jour-date';
      nombre.textContent = String(date.getDate());

      bouton.appendChild(nom);
      bouton.appendChild(nombre);

      bouton.addEventListener('click', function () {
        etatProgrammesV11.dateSelectionnee = normaliserDate(date);
        rendreCalendrierProgrammesV11();
      });

      listeJours.appendChild(bouton);
    });

    afficherSeanceProgrammeV10(etatProgrammesV11);
  }

  function afficherSeanceProgrammeV10(etat) {
    const label = document.getElementById('programme-jour-selectionne-label');
    const titre = document.getElementById('programme-seance-titre');
    const description = document.getElementById('programme-seance-description');
    const details = document.getElementById('programme-seance-details');
    const duree = document.getElementById('programme-seance-duree');
    const niveau = document.getElementById('programme-seance-niveau');
    const objectif = document.getElementById('programme-seance-objectif');
    const exercices = document.getElementById('programme-exercices');
    const bouton = document.getElementById('programme-commencer-seance');

    if (!label || !titre || !description || !details) {
      return;
    }

    const date = etat.dateSelectionnee;
    const cle = cleDate(date);

    const seance = etat.seances.find(function (item) {
      return item.date === cle;
    }) || null;

    etatProgrammesV11.seanceSelectionnee = seance;

    label.textContent =
      'Séance — ' +
      date.toLocaleDateString('fr-CA', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });

    if (!seance) {
      titre.textContent = 'Aucune séance prévue.';
      description.textContent =
        'Lorsqu’un coach TRIÈDRE t’assignera une séance pour cette date, elle apparaîtra ici.';
      details.hidden = true;
      return;
    }

    titre.textContent = seance.titre || 'Séance TRIÈDRE';
    description.textContent = seance.description || '';
    duree.textContent = seance.dureeMinutes
      ? seance.dureeMinutes + ' min'
      : '—';
    niveau.textContent = seance.niveau || '—';
    objectif.textContent = seance.objectif || '—';
    exercices.innerHTML = '';

    (seance.exercices || []).forEach(function (exercice) {
      const ligne = document.createElement('div');
      ligne.className = 'programme-exercice';

      const info = document.createElement('div');

      const nom = document.createElement('strong');
      nom.textContent = exercice.name || 'Exercice';

      const consigne = document.createElement('small');
      const morceauxConsigne = [];

      if (exercice.notes) {
        morceauxConsigne.push(exercice.notes);
      }

      if (Number(exercice.rest_seconds) > 0) {
        morceauxConsigne.push(
          'Repos : ' + formaterDureeSecondesV11(exercice.rest_seconds)
        );
      }

      consigne.textContent = morceauxConsigne.join(' · ');

      info.appendChild(nom);
      info.appendChild(consigne);

      const prescription = document.createElement('span');
      prescription.textContent = construirePrescriptionExerciceV11(exercice);

      ligne.appendChild(info);
      ligne.appendChild(prescription);
      exercices.appendChild(ligne);
    });

    if (bouton) {
      bouton.disabled = false;

      if (seance.completedAt) {
        bouton.textContent = 'Séance terminée ✓';
        bouton.disabled = true;
      } else if (seance.startedAt) {
        bouton.textContent = 'Terminer la séance';
      } else {
        bouton.textContent = 'Commencer la séance';
      }
    }

    details.hidden = false;
  }

  function construirePrescriptionExerciceV11(exercice) {
    if (Number(exercice.duration_seconds) > 0) {
      return formaterDureeSecondesV11(exercice.duration_seconds);
    }

    const series = Number(exercice.sets);
    const repetitions = (exercice.reps || '').trim();

    if (series > 0 && repetitions) {
      return series + ' × ' + repetitions;
    }

    if (series > 0) {
      return series + (series > 1 ? ' séries' : ' série');
    }

    return repetitions || '—';
  }

  function formaterDureeSecondesV11(secondes) {
    const total = Number(secondes) || 0;

    if (total >= 60 && total % 60 === 0) {
      return (total / 60) + ' min';
    }

    if (total >= 60) {
      const minutes = Math.floor(total / 60);
      const reste = total % 60;
      return minutes + ' min ' + reste + ' s';
    }

    return total + ' s';
  }

  async function gererActionSeanceV11() {
    const seance = etatProgrammesV11.seanceSelectionnee;

    if (!seance) {
      afficherToast('Aucune séance n’est prévue pour cette date.', 'info');
      return;
    }

    const bouton = document.getElementById('programme-commencer-seance');

    if (bouton) {
      bouton.disabled = true;
    }

    try {
      if (!seance.startedAt) {
        const { data, error } = await supabase.rpc(
          'start_own_training_session',
          { target_session_id: seance.id }
        );

        if (error) {
          throw error;
        }

        const resultat = Array.isArray(data) ? data[0] : data;

        seance.startedAt =
          (resultat && resultat.started_at) || new Date().toISOString();

        afficherToast('Séance commencée. Bon entraînement 💪', 'succes');
      } else if (!seance.completedAt) {
        const { data, error } = await supabase.rpc(
          'complete_own_training_session',
          { target_session_id: seance.id }
        );

        if (error) {
          throw error;
        }

        const resultat = Array.isArray(data) ? data[0] : data;

        seance.completedAt =
          (resultat && resultat.completed_at) || new Date().toISOString();

        afficherToast('Séance terminée. Progression enregistrée.', 'succes');
      }

      afficherSeanceProgrammeV10(etatProgrammesV11);
      rendreCalendrierProgrammesV11();
      rendreIndicateursProgrammesV11();
    } catch (error) {
      console.error('[TRIÈDRE] Action séance :', error);
      afficherToast(
        'Impossible d’enregistrer cette séance pour le moment.',
        'erreur'
      );
    } finally {
      if (bouton && !seance.completedAt) {
        bouton.disabled = false;
      }
    }
  }

  function rendreMesProgrammesV11() {
    const conteneur = document.querySelector(
      '#membre-programmes .programme-etat-vide'
    );

    if (!conteneur) {
      return;
    }

    conteneur.innerHTML = '';

    if (!etatProgrammesV11.programmes.length) {
      const titre = document.createElement('strong');
      titre.textContent = 'Aucun programme attribué pour le moment.';

      const texte = document.createElement('p');
      texte.textContent =
        'Les programmes commencés, à venir ou terminés apparaîtront ici.';

      conteneur.appendChild(titre);
      conteneur.appendChild(texte);
      conteneur.classList.remove('has-programmes');
      return;
    }

    conteneur.classList.add('has-programmes');

    etatProgrammesV11.programmes.forEach(function (affectation) {
      const carte = document.createElement('article');
      carte.className = 'programme-attribue-carte';

      if (affectation.status === 'active') {
        carte.classList.add('is-active');
      }

      const entete = document.createElement('div');
      entete.className = 'programme-attribue-entete';

      const nom = document.createElement('strong');
      nom.textContent =
        (affectation.programme && affectation.programme.name) ||
        'Programme TRIÈDRE';

      const statut = document.createElement('span');
      statut.className = 'programme-attribue-statut';
      statut.textContent = libelleStatutProgrammeV11(affectation.status);

      entete.appendChild(nom);
      entete.appendChild(statut);

      const details = document.createElement('p');
      const morceaux = [];

      if (affectation.programme && affectation.programme.level) {
        morceaux.push(affectation.programme.level);
      }

      if (
        affectation.programme &&
        Number(affectation.programme.duration_weeks) > 0
      ) {
        morceaux.push(
          affectation.programme.duration_weeks + ' semaines'
        );
      }

      if (
        affectation.programme &&
        Number(affectation.programme.sessions_per_week) > 0
      ) {
        morceaux.push(
          affectation.programme.sessions_per_week + ' séances / semaine'
        );
      }

      details.textContent = morceaux.join(' · ');

      carte.appendChild(entete);
      carte.appendChild(details);
      conteneur.appendChild(carte);
    });
  }

  function libelleStatutProgrammeV11(statut) {
    const libelles = {
      scheduled: 'À venir',
      active: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };

    return libelles[statut] || 'Programme';
  }

  function rendreIndicateursProgrammesV11() {
    const seancesSemaineElement = document.getElementById('programme-seances-semaine');
    const pourcentageElement = document.getElementById('programme-entrainements-pourcentage');
    const dureeProgrammeElement = document.getElementById('programme-duree-programme');
    const seriesTotalesElement = document.getElementById('programme-series-totales');
    const seriesComparaisonElement = document.getElementById('programme-series-comparaison');
    const constanceValeurElement = document.getElementById('programme-constance-valeur');
    const constanceLibelleElement = document.getElementById('programme-constance-libelle');
    const constanceCercle = document.getElementById('programme-constance-progression');

    const actif = etatProgrammesV11.programmeActif;
    const seances = etatProgrammesV11.seances || [];

    if (!actif || !actif.programme) {
      if (seancesSemaineElement) seancesSemaineElement.textContent = '—';
      if (pourcentageElement) pourcentageElement.textContent = '—';
      if (dureeProgrammeElement) dureeProgrammeElement.textContent = '—';
      if (seriesTotalesElement) seriesTotalesElement.textContent = '—';
      if (seriesComparaisonElement) seriesComparaisonElement.textContent = '—';
      if (constanceValeurElement) constanceValeurElement.textContent = '—';
      if (constanceLibelleElement) constanceLibelleElement.textContent = '—';

      mettreAJourAnneauConstanceV12(constanceCercle, 0);
      mettreAJourBarresEntrainementsV12([]);
      rendreEvolutionSeriesV12([]);
      return;
    }

    const aujourdHui = normaliserDate(new Date());

    /* 1. ENTRAÎNEMENTS — SEMAINE ACTUELLE */
    const debutSemaine = obtenirDebutSemaine(aujourdHui);
    const finSemaine = ajouterJours(debutSemaine, 6);
    const debutCle = cleDate(debutSemaine);
    const finCle = cleDate(finSemaine);

    const seancesSemaine = seances.filter(function (seance) {
      return seance.date >= debutCle && seance.date <= finCle;
    });

    const seancesTermineesSemaine = seancesSemaine.filter(function (seance) {
      return Boolean(seance.completedAt);
    });

    const totalSemaine = seancesSemaine.length;
    const termineesSemaine = seancesTermineesSemaine.length;
    const tauxSemaine = totalSemaine
      ? Math.round((termineesSemaine / totalSemaine) * 100)
      : 0;

    if (seancesSemaineElement) {
      seancesSemaineElement.textContent = totalSemaine
        ? termineesSemaine + ' / ' + totalSemaine
        : '—';
    }

    if (pourcentageElement) {
      pourcentageElement.textContent = totalSemaine
        ? tauxSemaine + '%'
        : '—';
    }

    mettreAJourBarresEntrainementsV12(seancesSemaine);

    /* 2. SÉRIES TOTALES — SEMAINE ACTUELLE */
    const seriesParJour = Array(7).fill(0);

    seancesTermineesSemaine.forEach(function (seance) {
      const date = normaliserDate(seance.date + 'T12:00:00');
      const indexJour = (date.getDay() + 6) % 7;
      seriesParJour[indexJour] += compterSeriesSeanceV12(seance);
    });

    const seriesSemaine = seriesParJour.reduce(function (total, valeur) {
      return total + valeur;
    }, 0);

    if (seriesTotalesElement) {
      seriesTotalesElement.textContent = String(seriesSemaine);
    }

    rendreEvolutionSeriesV12(seriesParJour);

    const debutSemainePrecedente = ajouterJours(debutSemaine, -7);
    const finSemainePrecedente = ajouterJours(debutSemaine, -1);
    const debutPrecedentCle = cleDate(debutSemainePrecedente);
    const finPrecedentCle = cleDate(finSemainePrecedente);

    const seancesPrecedentesTerminees = seances.filter(function (seance) {
      return (
        seance.date >= debutPrecedentCle &&
        seance.date <= finPrecedentCle &&
        Boolean(seance.completedAt)
      );
    });

    const seriesPrecedentes = seancesPrecedentesTerminees.reduce(function (total, seance) {
      return total + compterSeriesSeanceV12(seance);
    }, 0);

    if (seriesComparaisonElement) {
      if (seriesPrecedentes > 0) {
        const variation = ((seriesSemaine - seriesPrecedentes) / seriesPrecedentes) * 100;
        const variationArrondie = Math.round(variation);

        if (variationArrondie > 0) {
          seriesComparaisonElement.textContent = '+' + variationArrondie + '% vs semaine dernière';
        } else if (variationArrondie < 0) {
          seriesComparaisonElement.textContent =
            '−' + Math.abs(variationArrondie) + '% vs semaine dernière';
        } else {
          seriesComparaisonElement.textContent = 'Stable vs semaine dernière';
        }
      } else if (seriesSemaine > 0) {
        seriesComparaisonElement.textContent = 'Première semaine suivie';
      } else {
        seriesComparaisonElement.textContent = 'Aucune série terminée cette semaine';
      }
    }

    /* 3. CONSTANCE — SÉANCES ÉCHUES */
    const aujourdHuiCle = cleDate(aujourdHui);

    const seancesEchues = seances.filter(function (seance) {
      return seance.date <= aujourdHuiCle;
    });

    const seancesEchuesTerminees = seancesEchues.filter(function (seance) {
      return Boolean(seance.completedAt);
    });

    const tauxConstance = seancesEchues.length
      ? Math.round((seancesEchuesTerminees.length / seancesEchues.length) * 100)
      : 0;

    if (constanceValeurElement) {
      constanceValeurElement.textContent = seancesEchues.length
        ? tauxConstance + '%'
        : '—';
    }

    if (constanceLibelleElement) {
      constanceLibelleElement.textContent =
        libelleConstanceV12(tauxConstance, seancesEchues.length);
    }

    mettreAJourAnneauConstanceV12(
      constanceCercle,
      seancesEchues.length ? tauxConstance : 0
    );

    /* 4. PROGRESSION GLOBALE DU PROGRAMME */
    const totalSeancesProgramme = seances.length;
    const totalSeancesTerminees = seances.filter(function (seance) {
      return Boolean(seance.completedAt);
    }).length;

    if (dureeProgrammeElement) {
      if (!totalSeancesProgramme) {
        dureeProgrammeElement.textContent = '—';
      } else {
        const progressionProgramme = Math.round(
          (totalSeancesTerminees / totalSeancesProgramme) * 100
        );

        dureeProgrammeElement.textContent =
          progressionProgramme +
          '% · ' +
          totalSeancesTerminees +
          ' / ' +
          totalSeancesProgramme +
          ' séances';
      }
    }
  }

  function compterSeriesSeanceV12(seance) {
    return (seance.exercices || []).reduce(function (total, exercice) {
      const series = Number(exercice.sets);
      return total + (Number.isFinite(series) && series > 0 ? series : 0);
    }, 0);
  }

  function mettreAJourBarresEntrainementsV12(seancesSemaine) {
    const jours = document.querySelectorAll(
      '#programme-entrainements-graphique .programme-entrainement-jour'
    );

    const debutSemaine = obtenirDebutSemaine(new Date());

    jours.forEach(function (element, index) {
      element.classList.remove('is-planifie', 'is-started', 'is-completed');

      const dateJour = ajouterJours(debutSemaine, index);
      const cleJour = cleDate(dateJour);

      const seance = seancesSemaine.find(function (item) {
        return item.date === cleJour;
      });

      const barre = element.querySelector('.programme-entrainement-barre');

      if (!barre) return;

      if (!seance) {
        barre.style.height = '14%';
        barre.style.opacity = '.28';
        return;
      }

      element.classList.add('is-planifie');
      barre.style.opacity = '1';

      if (seance.completedAt) {
        element.classList.add('is-completed');
        barre.style.height = '100%';
      } else if (seance.startedAt) {
        element.classList.add('is-started');
        barre.style.height = '72%';
      } else {
        barre.style.height = '48%';
      }
    });
  }

  function mettreAJourAnneauConstanceV12(cercle, pourcentage) {
    if (!cercle) return;

    const rayon = 54;
    const circonference = 2 * Math.PI * rayon;
    const valeur = Math.max(0, Math.min(100, Number(pourcentage) || 0));
    const decalage = circonference - (valeur / 100) * circonference;

    cercle.style.strokeDasharray = circonference.toFixed(3);
    cercle.style.strokeDashoffset = decalage.toFixed(3);
  }

  function libelleConstanceV12(pourcentage, totalEchu) {
    if (!totalEchu) return 'Le suivi commencera avec ta première séance.';
    if (pourcentage >= 90) return 'Excellente constance';
    if (pourcentage >= 75) return 'Très bonne constance';
    if (pourcentage >= 60) return 'Bonne dynamique';
    if (pourcentage >= 40) return 'Continue à construire ta régularité';
    return 'Chaque séance compte';
  }

  function rendreEvolutionSeriesV12(valeurs) {
    const ligne = document.getElementById('programme-series-ligne');
    const groupePoints = document.getElementById('programme-series-points');

    if (!ligne || !groupePoints) return;

    ligne.setAttribute('points', '');
    ligne.hidden = true;
    groupePoints.innerHTML = '';

    if (!Array.isArray(valeurs) || !valeurs.length) return;

    const max = Math.max.apply(null, valeurs);
    if (max <= 0) return;

    const largeur = 200;
    const hauteur = 48;
    const margeX = 10;
    const margeY = 10;

    const coords = valeurs.map(function (valeur, index) {
      const x = margeX + (index * largeur) / Math.max(valeurs.length - 1, 1);
      const y = margeY + hauteur - (Number(valeur || 0) / max) * hauteur;

      return {
        x: x,
        y: y,
        valeur: Number(valeur || 0)
      };
    });

    ligne.setAttribute(
      'points',
      coords.map(function (point) {
        return point.x.toFixed(1) + ',' + point.y.toFixed(1);
      }).join(' ')
    );

    ligne.hidden = false;

    coords.forEach(function (point) {
      if (point.valeur <= 0) return;

      const cercle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );

      cercle.setAttribute('cx', point.x.toFixed(1));
      cercle.setAttribute('cy', point.y.toFixed(1));
      cercle.setAttribute('r', '3');
      cercle.setAttribute('class', 'programme-series-point');

      groupePoints.appendChild(cercle);
    });
  }

  function ouvrirModalPoidsV11(mesureAEditer) {
    if (!etatProgrammesV11.userId) {
      afficherToast('Connecte-toi pour enregistrer ton poids.', 'info');
      return;
    }

    let modal = document.getElementById('programme-poids-modal-v11');

    if (!modal) {
      modal = creerModalPoidsV11();
      document.body.appendChild(modal);
    }

    const date = modal.querySelector('#programme-poids-date-v11');
    const poids = modal.querySelector('#programme-poids-valeur-v11');
    const erreur = modal.querySelector('#programme-poids-erreur-v11');
    const titre = modal.querySelector('#programme-poids-modal-titre-v11');
    const bouton = modal.querySelector('button[type="submit"]');

    const estEdition =
      mesureAEditer &&
      mesureAEditer.date &&
      Number.isFinite(Number(mesureAEditer.poids));

    modal.dataset.mode = estEdition ? 'edition' : 'ajout';
    modal.dataset.dateOriginale = estEdition ? mesureAEditer.date : '';

    date.value = estEdition ? mesureAEditer.date : cleDate(new Date());
    poids.value = estEdition ? String(mesureAEditer.poids) : '';
    erreur.textContent = '';
    erreur.hidden = true;

    if (titre) {
      titre.textContent = estEdition ? 'Modifier ma pesée' : 'Ajouter mon poids';
    }

    if (bouton) {
      bouton.textContent = estEdition ? 'Enregistrer la modification' : 'Enregistrer';
    }

    modal.hidden = false;
    document.body.classList.add('programme-modal-ouvert');

    window.setTimeout(function () {
      poids.focus();
      poids.select();
    }, 0);
  }

  function creerModalPoidsV11() {
    const modal = document.createElement('div');
    modal.id = 'programme-poids-modal-v11';
    modal.className = 'programme-poids-modal';
    modal.hidden = true;

    modal.innerHTML = `
      <div class="programme-poids-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="programme-poids-modal-titre-v11">
        <button type="button" class="programme-poids-modal-fermer" aria-label="Fermer">×</button>
        <p class="section-eyebrow">Résultats</p>
        <h3 id="programme-poids-modal-titre-v11">Ajouter mon poids</h3>
        <p class="programme-poids-modal-intro">
          Cette mesure reste privée dans ton espace membre.
        </p>

        <form id="programme-poids-form-v11">
          <label>
            Date
            <input id="programme-poids-date-v11" type="date" required>
          </label>

          <label>
            Poids (kg)
            <input id="programme-poids-valeur-v11" type="number" min="20" max="350" step="0.1" inputmode="decimal" required>
          </label>

          <p id="programme-poids-erreur-v11" class="programme-poids-erreur" hidden></p>

          <button type="submit" class="btn btn-primary">Enregistrer</button>
        </form>
      </div>
    `;

    const fermer = function () {
      modal.hidden = true;
      document.body.classList.remove('programme-modal-ouvert');
    };

    modal.querySelector('.programme-poids-modal-fermer')
      .addEventListener('click', fermer);

    modal.addEventListener('click', function (event) {
      if (event.target === modal) {
        fermer();
      }
    });

    modal.querySelector('#programme-poids-form-v11')
      .addEventListener('submit', async function (event) {
        event.preventDefault();

        const date = modal.querySelector('#programme-poids-date-v11');
        const poids = modal.querySelector('#programme-poids-valeur-v11');
        const erreur = modal.querySelector('#programme-poids-erreur-v11');
        const bouton = modal.querySelector('button[type="submit"]');

        const valeur = Number(poids.value);

        if (!date.value || !Number.isFinite(valeur) || valeur < 20 || valeur > 350) {
          erreur.textContent = 'Entre une date et un poids valides.';
          erreur.hidden = false;
          return;
        }

        bouton.disabled = true;
        erreur.hidden = true;

        try {
          const estEdition = modal.dataset.mode === 'edition';
          const dateOriginale = modal.dataset.dateOriginale;

          let requete;

          if (estEdition && dateOriginale) {
            requete = supabase
              .from('weight_entries')
              .update({
                measured_on: date.value,
                weight_kg: valeur
              })
              .eq('user_id', etatProgrammesV11.userId)
              .eq('measured_on', dateOriginale);
          } else {
            requete = supabase
              .from('weight_entries')
              .upsert(
                {
                  user_id: etatProgrammesV11.userId,
                  measured_on: date.value,
                  weight_kg: valeur
                },
                {
                  onConflict: 'user_id,measured_on'
                }
              );
          }

          const { error } = await requete;

          if (error) {
            throw error;
          }

          await chargerMesuresPoidsV11();

          rendreCourbePoidsV10(
            etatProgrammesV11.mesures.map(function (mesure) {
              return {
                poids: mesure.weight_kg,
                date: mesure.measured_on
              };
            })
          );

          fermer();
          afficherToast(
            estEdition ? 'Pesée modifiée.' : 'Poids enregistré.',
            'succes'
          );
        } catch (error) {
          console.error('[TRIÈDRE] Enregistrement du poids :', error);
          erreur.textContent =
            'Impossible d’enregistrer cette mesure pour le moment.';
          erreur.hidden = false;
        } finally {
          bouton.disabled = false;
        }
      });

    return modal;
  }

  function rendreCourbePoidsV10(mesures) {
    let ligne = document.getElementById('programme-courbe-ligne');
    const groupePoints = document.getElementById('programme-courbe-points');
    const groupeGrille = document.getElementById('programme-courbe-grille');
    const axeY = document.getElementById('programme-courbe-axe-y');
    const axeX = document.getElementById('programme-courbe-axe-x');
    const vide = document.getElementById('programme-courbe-vide');
    const poidsActuel = document.getElementById('programme-poids-actuel');
    const evolution = document.getElementById('programme-poids-evolution');
    const conteneur = document.getElementById('programme-courbe-poids');

    if (
      !ligne ||
      !groupePoints ||
      !vide ||
      !poidsActuel ||
      !evolution ||
      !conteneur
    ) {
      return;
    }

    if (ligne.tagName && ligne.tagName.toLowerCase() !== 'path') {
      const nouveauChemin = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'path'
      );

      nouveauChemin.setAttribute('id', 'programme-courbe-ligne');
      ligne.parentNode.replaceChild(nouveauChemin, ligne);
      ligne = nouveauChemin;
    }

    const mesuresValides = (Array.isArray(mesures) ? mesures : [])
      .map(function (mesure) {
        const poidsBrut =
          mesure.weight_kg !== undefined
            ? mesure.weight_kg
            : mesure.poids;

        const dateBrute =
          mesure.measured_on !== undefined
            ? mesure.measured_on
            : mesure.date;

        const poids = Number(poidsBrut);
        const date = dateBrute
          ? normaliserDate(dateBrute + 'T12:00:00')
          : null;

        if (!Number.isFinite(poids) || !date || Number.isNaN(date.getTime())) {
          return null;
        }

        return {
          poids: poids,
          date: date,
          cle: dateBrute
        };
      })
      .filter(Boolean)
      .sort(function (a, b) {
        return a.date - b.date;
      });

    ligne.setAttribute('d', '');
    ligne.setAttribute('fill', 'none');
    ligne.setAttribute('stroke', '#d4af37');
    ligne.setAttribute('stroke-width', '4');
    ligne.setAttribute('stroke-linecap', 'round');
    ligne.setAttribute('stroke-linejoin', 'round');
    ligne.setAttribute('vector-effect', 'non-scaling-stroke');
    ligne.setAttribute('pointer-events', 'none');
    ligne.setAttribute('visibility', 'visible');
    ligne.removeAttribute('hidden');

    groupePoints.innerHTML = '';
    if (groupeGrille) groupeGrille.innerHTML = '';
    if (axeY) axeY.innerHTML = '';
    if (axeX) axeX.innerHTML = '';

    const ancienneBulle = conteneur.querySelector('.programme-poids-bulle-v13');
    if (ancienneBulle) ancienneBulle.remove();

    if (!mesuresValides.length) {
      ligne.setAttribute('d', '');
      ligne.setAttribute('visibility', 'hidden');
      poidsActuel.textContent = '— kg';
      evolution.textContent = 'Évolution du poids';
      vide.hidden = false;
      return;
    }

    vide.hidden = true;

    const premiere = mesuresValides[0];
    const derniere = mesuresValides[mesuresValides.length - 1];

    poidsActuel.textContent =
      derniere.poids.toLocaleString('fr-FR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }) + ' kg';

    const delta = derniere.poids - premiere.poids;
    const signe = delta > 0 ? '+' : delta < 0 ? '−' : '±';

    evolution.textContent =
      signe +
      ' ' +
      Math.abs(delta).toLocaleString('fr-FR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }) +
      ' kg depuis le début';

    const largeurSvg = 620;
    const hauteurSvg = 220;
    const margeGauche = 58;
    const margeDroite = 18;
    const margeHaut = 18;
    const margeBas = 42;

    const largeurTrace = largeurSvg - margeGauche - margeDroite;
    const hauteurTrace = hauteurSvg - margeHaut - margeBas;

    const poidsMin = Math.min.apply(
      null,
      mesuresValides.map(function (item) {
        return item.poids;
      })
    );

    const poidsMax = Math.max.apply(
      null,
      mesuresValides.map(function (item) {
        return item.poids;
      })
    );

    let yMin = Math.floor((poidsMin - 5) / 5) * 5;
    let yMax = Math.ceil((poidsMax + 5) / 5) * 5;

    if (yMin === yMax) {
      yMin -= 5;
      yMax += 5;
    }

    while (yMax - yMin < 15) {
      yMin -= 5;
      yMax += 5;
    }

    yMin = Math.max(0, yMin);

    const plageY = Math.max(yMax - yMin, 5);

    const versY = function (poids) {
      return margeHaut + ((yMax - poids) / plageY) * hauteurTrace;
    };

    for (let valeur = yMin; valeur <= yMax; valeur += 5) {
      const y = versY(valeur);

      if (groupeGrille) {
        const grille = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        );

        grille.setAttribute('x1', String(margeGauche));
        grille.setAttribute('x2', String(margeGauche + largeurTrace));
        grille.setAttribute('y1', y.toFixed(1));
        grille.setAttribute('y2', y.toFixed(1));
        grille.setAttribute(
          'class',
          'programme-courbe-grille-ligne programme-courbe-grille-h'
        );

        groupeGrille.appendChild(grille);
      }

      if (axeY) {
        const texte = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text'
        );

        texte.setAttribute('x', String(margeGauche - 10));
        texte.setAttribute('y', (y + 4).toFixed(1));
        texte.setAttribute('text-anchor', 'end');
        texte.textContent = valeur + ' kg';
        axeY.appendChild(texte);
      }
    }

    const tempsMin = premiere.date.getTime();
    const tempsMax = derniere.date.getTime();
    const plageTemps = Math.max(tempsMax - tempsMin, 1);

    const versX = function (date) {
      if (mesuresValides.length === 1) {
        return margeGauche + largeurTrace / 2;
      }

      return (
        margeGauche +
        ((date.getTime() - tempsMin) / plageTemps) * largeurTrace
      );
    };

    const moisCourts = [
      'JAN', 'FÉV', 'MAR', 'AVR', 'MAI', 'JUIN',
      'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'
    ];

    const coordonnees = mesuresValides.map(function (item, index) {
      const x = versX(item.date);
      const y = versY(item.poids);

      if (groupeGrille) {
        const verticale = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'line'
        );

        verticale.setAttribute('x1', x.toFixed(1));
        verticale.setAttribute('x2', x.toFixed(1));
        verticale.setAttribute('y1', String(margeHaut));
        verticale.setAttribute('y2', String(margeHaut + hauteurTrace));
        verticale.setAttribute(
          'class',
          'programme-courbe-grille-ligne programme-courbe-grille-v'
        );

        groupeGrille.appendChild(verticale);
      }

      if (axeX) {
        const texte = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text'
        );

        texte.setAttribute('x', x.toFixed(1));
        texte.setAttribute('y', String(hauteurSvg - 12));
        texte.setAttribute('text-anchor', 'middle');
        texte.textContent =
          String(item.date.getDate()).padStart(2, '0') +
          ' ' +
          moisCourts[item.date.getMonth()];

        axeX.appendChild(texte);
      }

      return {
        x: x,
        y: y,
        poids: item.poids,
        date: item.cle,
        dateObjet: item.date,
        index: index
      };
    });

    const construireCheminLisse = function (points) {
      if (points.length < 2) {
        return '';
      }

      if (points.length === 2) {
        return (
          'M ' +
          points[0].x.toFixed(1) +
          ' ' +
          points[0].y.toFixed(1) +
          ' L ' +
          points[1].x.toFixed(1) +
          ' ' +
          points[1].y.toFixed(1)
        );
      }

      const tension = 0.18;
      let d = 'M ' + points[0].x.toFixed(1) + ' ' + points[0].y.toFixed(1);

      for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;

        const cp1x = p1.x + (p2.x - p0.x) * tension;
        const cp1y = p1.y + (p2.y - p0.y) * tension;
        const cp2x = p2.x - (p3.x - p1.x) * tension;
        const cp2y = p2.y - (p3.y - p1.y) * tension;

        d +=
          ' C ' +
          cp1x.toFixed(1) +
          ' ' +
          cp1y.toFixed(1) +
          ', ' +
          cp2x.toFixed(1) +
          ' ' +
          cp2y.toFixed(1) +
          ', ' +
          p2.x.toFixed(1) +
          ' ' +
          p2.y.toFixed(1);
      }

      return d;
    };

    if (coordonnees.length >= 2) {
      ligne.setAttribute('d', construireCheminLisse(coordonnees));
      ligne.setAttribute('visibility', 'visible');
    } else {
      ligne.setAttribute('d', '');
      ligne.setAttribute('visibility', 'hidden');
    }

    const fermerBulle = function () {
      const bulle = conteneur.querySelector('.programme-poids-bulle-v13');
      if (bulle) bulle.remove();
    };

    const afficherBulle = function (point) {
      fermerBulle();

      const bulle = document.createElement('div');
      bulle.className = 'programme-poids-bulle-v13';

      const dateLisible = point.dateObjet.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      const poidsLisible = point.poids.toLocaleString('fr-FR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      }) + ' kg';

      const precedent =
        point.index > 0 ? coordonnees[point.index - 1] : null;

      let variationHtml = '<small>Première pesée</small>';

      if (precedent) {
        const ecart = point.poids - precedent.poids;
        const signeEcart = ecart > 0 ? '+' : ecart < 0 ? '−' : '±';

        variationHtml =
          '<small>' +
          signeEcart +
          ' ' +
          Math.abs(ecart).toLocaleString('fr-FR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
          }) +
          ' kg vs la pesée précédente</small>';
      }

      bulle.innerHTML = `
        <div class="programme-poids-bulle-contenu">
          <div class="programme-poids-bulle-infos">
            <strong>${dateLisible}</strong>
            <span>${poidsLisible}</span>
            ${variationHtml}
          </div>

          <div class="programme-poids-bulle-actions">
            <button type="button" data-action="modifier" aria-label="Modifier cette pesée">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15.5V20h4.5L19 9.5 14.5 5 4 15.5Zm12.8-11.3 2.5 2.5c.4.4.4 1 0 1.4l-1.3 1.3-3.9-3.9 1.3-1.3c.4-.4 1-.4 1.4 0Z"/></svg>
            </button>
            <button type="button" data-action="supprimer" aria-label="Supprimer cette pesée">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Zm-1 10h12l1-12H5l1 12Z"/></svg>
            </button>
          </div>
        </div>
      `;

      const rectSvg = conteneur.querySelector('svg').getBoundingClientRect();
      const rectConteneur = conteneur.getBoundingClientRect();

      const xPixels =
        ((point.x / largeurSvg) * rectSvg.width) +
        (rectSvg.left - rectConteneur.left);

      const yPixels =
        ((point.y / hauteurSvg) * rectSvg.height) +
        (rectSvg.top - rectConteneur.top);

      bulle.style.left = xPixels + 'px';
      bulle.style.top = yPixels + 'px';

      bulle.querySelector('[data-action="modifier"]')
        .addEventListener('click', function () {
          fermerBulle();
          ouvrirModalPoidsV11({
            date: point.date,
            poids: point.poids
          });
        });

      bulle.querySelector('[data-action="supprimer"]')
        .addEventListener('click', async function () {
          const confirmation = window.confirm(
            'Supprimer la pesée du ' + dateLisible + ' ?'
          );

          if (!confirmation) return;

          try {
            const { error } = await supabase
              .from('weight_entries')
              .delete()
              .eq('user_id', etatProgrammesV11.userId)
              .eq('measured_on', point.date);

            if (error) throw error;

            await chargerMesuresPoidsV11();

            rendreCourbePoidsV10(
              etatProgrammesV11.mesures.map(function (mesure) {
                return {
                  poids: mesure.weight_kg,
                  date: mesure.measured_on
                };
              })
            );

            afficherToast('Pesée supprimée.', 'succes');
          } catch (error) {
            console.error('[TRIÈDRE] Suppression de la pesée :', error);
            afficherToast(
              'Impossible de supprimer cette pesée pour le moment.',
              'erreur'
            );
          }
        });

      conteneur.appendChild(bulle);

      window.requestAnimationFrame(function () {
        const largeurBulle = bulle.offsetWidth;
        const demi = largeurBulle / 2;
        const marge = 10;
        let left = xPixels;

        if (left - demi < marge) {
          left = demi + marge;
        }

        if (left + demi > conteneur.clientWidth - marge) {
          left = conteneur.clientWidth - demi - marge;
        }

        bulle.style.left = left + 'px';
      });
    };

    coordonnees.forEach(function (point, index) {
      const estDernierPoint = index === coordonnees.length - 1;

      const halo = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );

      halo.setAttribute('cx', point.x.toFixed(1));
      halo.setAttribute('cy', point.y.toFixed(1));
      halo.setAttribute('r', estDernierPoint ? '10' : '8');
      halo.setAttribute(
        'class',
        estDernierPoint
          ? 'programme-courbe-point-halo programme-courbe-point-halo--current'
          : 'programme-courbe-point-halo'
      );
      groupePoints.appendChild(halo);

      const cercle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );

      cercle.setAttribute('cx', point.x.toFixed(1));
      cercle.setAttribute('cy', point.y.toFixed(1));
      cercle.setAttribute('r', estDernierPoint ? '6.5' : '5.5');
      cercle.setAttribute(
        'class',
        estDernierPoint
          ? 'programme-courbe-point programme-courbe-point--current'
          : 'programme-courbe-point'
      );
      cercle.setAttribute('tabindex', '0');
      cercle.setAttribute('role', 'button');
      cercle.setAttribute('data-poids-point', 'true');
      cercle.setAttribute(
        'aria-label',
        point.poids.toLocaleString('fr-FR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }) +
        ' kg le ' +
        point.dateObjet.toLocaleDateString('fr-FR')
      );

      cercle.addEventListener('click', function (event) {
        event.stopPropagation();
        afficherBulle(point);
      });

      cercle.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          afficherBulle(point);
        }
      });

      groupePoints.appendChild(cercle);
    });

    conteneur.onclick = function (event) {
      if (
        !event.target.closest('.programme-poids-bulle-v13') &&
        !event.target.closest('[data-poids-point="true"]')
      ) {
        fermerBulle();
      }
    };
  }

  function obtenirDebutSemaine(date) {
    const copie = normaliserDate(date);
    const jour = copie.getDay();
    const decalage = jour === 0 ? -6 : 1 - jour;
    return ajouterJours(copie, decalage);
  }

  function construireSemaine(debut) {
    return Array.from({ length: 7 }, function (_, index) {
      return ajouterJours(debut, index);
    });
  }

  function ajouterJours(date, nombre) {
    const copie = normaliserDate(date);
    copie.setDate(copie.getDate() + nombre);
    return copie;
  }

  function normaliserDate(date) {
    const copie = new Date(date);
    copie.setHours(12, 0, 0, 0);
    return copie;
  }

  function cleDate(date) {
    const d = normaliserDate(date);

    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0')
    ].join('-');
  }

  function formaterDateCourte(date) {
    return date.toLocaleDateString('fr-CA', {
      day: 'numeric',
      month: 'short'
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

    const variante = produit.variantes.find(function (item) {
      return item.sku === favori.sku;
    });

    if (variante && variante.photoFace) {
      return '../05-images/produits/' + variante.photoFace;
    }

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
      retournerTableauMembre();
    });

    if (boutonAnnulerInformations) {
      boutonAnnulerInformations.addEventListener('click', function () {
        retournerTableauMembre();
      });
    }

    if (boutonOuvrirMotDePasse && zoneMotDePasse) {
      boutonOuvrirMotDePasse.addEventListener('click', function () {
        zoneMotDePasse.hidden = false;
        boutonOuvrirMotDePasse.setAttribute('aria-expanded', 'true');

        if (boutonSauvegarderMotDePasse) {
          boutonSauvegarderMotDePasse.hidden = false;
        }

        if (boutonAnnulerMotDePasse) {
          boutonAnnulerMotDePasse.hidden = false;
        }

        reinitialiserMotDePasse();

        window.setTimeout(function () {
          if (champMotDePasseActuel) champMotDePasseActuel.focus();
        }, 50);
      });
    }

    if (boutonAnnulerMotDePasse) {
      boutonAnnulerMotDePasse.addEventListener('click', function () {
        fermerModificationMotDePasse();
      });
    }

    document.querySelectorAll('[data-toggle-password]').forEach(function (bouton) {
      bouton.addEventListener('click', function () {
        const idChamp = bouton.getAttribute('data-toggle-password');
        const champ = document.getElementById(idChamp);

        if (!champ) return;

        const afficher = champ.type === 'password';

        champ.type = afficher ? 'text' : 'password';
        bouton.classList.toggle('mot-de-passe-visible', afficher);
        bouton.setAttribute('aria-pressed', afficher ? 'true' : 'false');
        bouton.setAttribute(
          'aria-label',
          afficher ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
        );
        bouton.setAttribute(
          'title',
          afficher ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
        );
      });
    });

    if (boutonSauvegarderMotDePasse) {
      boutonSauvegarderMotDePasse.addEventListener('click', async function () {
        await modifierMotDePasse();
      });
    }

    formulaireMesInformations.addEventListener('submit', async function (event) {
      event.preventDefault();
      reinitialiserMessagesInformations();

      const prenom = champProfilPrenom.value.trim();
      const nom = champProfilNom.value.trim();
      const sexe = obtenirSexeSelectionne();
      const dateNaissance = champProfilDateNaissance.value;
      const telephone = champProfilTelephone.value.trim();
      const email = champProfilEmail.value.trim();
      const nomComplet = composerNomComplet(prenom, nom);

      if (prenom.length < 2) {
        afficherErreurInformations('Entre un prénom valide.', champProfilPrenom);
        return;
      }

      if (nom.length < 2) {
        afficherErreurInformations('Entre un nom valide.', champProfilNom);
        return;
      }

      if (!dateNaissance) {
        afficherErreurInformations(
          'Indique ta date de naissance.',
          champProfilDateNaissance
        );
        return;
      }

      if (!telephone) {
        afficherErreurInformations(
          'Indique ton numéro de téléphone.',
          champProfilTelephone
        );
        return;
      }

      if (!email) {
        afficherErreurInformations(
          'Ton adresse e-mail est requise.',
          champProfilEmail
        );
        return;
      }

      boutonEnregistrerInformations.disabled = true;

      try {
        const {
          data: { user },
          error: erreurUtilisateur
        } = await supabase.auth.getUser();

        if (erreurUtilisateur || !user) {
          throw erreurUtilisateur || new Error('SESSION_INVALIDE');
        }

        const donneesProfil = {
          full_name: nomComplet,
          first_name: prenom,
          last_name: nom,
          gender: sexe || null,
          birth_date: dateNaissance,
          phone: telephone
        };

        const { error: erreurProfil } = await supabase
          .from('profiles')
          .update(donneesProfil)
          .eq('id', user.id);

        if (erreurProfil) throw erreurProfil;

        const { error: erreurMetadata } = await supabase.auth.updateUser({
          data: donneesProfil
        });

        if (erreurMetadata) {
          console.warn(
            '[TRIÈDRE] Métadonnées Auth non synchronisées :',
            erreurMetadata
          );
        }

        majEnteteCompte({
          email: user.email || '',
          prenom: prenom,
          nomComplet: nomComplet
        });

        retournerTableauMembre();
        afficherToast('Tes informations ont été sauvegardées.', 'succes');
      } catch (error) {
        console.error('[TRIÈDRE] Mise à jour du profil :', error);
        erreurMesInformations.textContent =
          'Impossible de sauvegarder tes modifications pour le moment.';
        erreurMesInformations.hidden = false;
      } finally {
        boutonEnregistrerInformations.disabled = false;
      }
    });
  }

  function retournerTableauMembre() {
    fermerModificationMotDePasse();
    zoneInformations.hidden = true;
    zoneConnectee.hidden = false;
    reinitialiserMessagesInformations();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function fermerModificationMotDePasse() {
    if (!zoneMotDePasse) return;

    zoneMotDePasse.hidden = true;

    if (boutonOuvrirMotDePasse) {
      boutonOuvrirMotDePasse.setAttribute('aria-expanded', 'false');
    }

    if (boutonSauvegarderMotDePasse) {
      boutonSauvegarderMotDePasse.hidden = true;
    }

    if (boutonAnnulerMotDePasse) {
      boutonAnnulerMotDePasse.hidden = true;
    }

    reinitialiserMotDePasse();
  }

  function reinitialiserMotDePasse() {
    if (champMotDePasseActuel) {
      champMotDePasseActuel.value = '';
      champMotDePasseActuel.type = 'password';
    }

    if (champNouveauMotDePasse) {
      champNouveauMotDePasse.value = '';
      champNouveauMotDePasse.type = 'password';
    }

    if (champConfirmationMotDePasse) {
      champConfirmationMotDePasse.value = '';
      champConfirmationMotDePasse.type = 'password';
    }

    document.querySelectorAll('[data-toggle-password]').forEach(function (bouton) {
      bouton.classList.remove('mot-de-passe-visible');
      bouton.setAttribute('aria-pressed', 'false');
      bouton.setAttribute('aria-label', 'Afficher le mot de passe');
      bouton.setAttribute('title', 'Afficher le mot de passe');
    });

    if (erreurMotDePasse) {
      erreurMotDePasse.hidden = true;
      erreurMotDePasse.textContent = '';
    }
  }

  async function modifierMotDePasse() {
    if (
      !champMotDePasseActuel ||
      !champNouveauMotDePasse ||
      !champConfirmationMotDePasse ||
      !boutonSauvegarderMotDePasse
    ) {
      return;
    }

    const actuel = champMotDePasseActuel.value;
    const nouveau = champNouveauMotDePasse.value;
    const confirmation = champConfirmationMotDePasse.value;

    if (!actuel) {
      afficherErreurMotDePasse(
        'Entre ton mot de passe actuel.',
        champMotDePasseActuel
      );
      return;
    }

    if (nouveau.length < 8) {
      afficherErreurMotDePasse(
        'Le nouveau mot de passe doit contenir au moins 8 caractères.',
        champNouveauMotDePasse
      );
      return;
    }

    if (nouveau !== confirmation) {
      afficherErreurMotDePasse(
        'Les deux nouveaux mots de passe ne correspondent pas.',
        champConfirmationMotDePasse
      );
      return;
    }

    boutonSauvegarderMotDePasse.disabled = true;

    try {
      const {
        data: { user },
        error: erreurUtilisateur
      } = await supabase.auth.getUser();

      if (erreurUtilisateur || !user || !user.email) {
        throw erreurUtilisateur || new Error('SESSION_INVALIDE');
      }

      const { error: erreurConnexion } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: actuel
        });

      if (erreurConnexion) {
        afficherErreurMotDePasse(
          'Le mot de passe actuel est incorrect.',
          champMotDePasseActuel
        );
        return;
      }

      const { error: erreurMiseAJour } = await supabase.auth.updateUser({
        password: nouveau
      });

      if (erreurMiseAJour) throw erreurMiseAJour;

      fermerModificationMotDePasse();
      retournerTableauMembre();
      afficherToast('Ton mot de passe a été modifié.', 'succes');
    } catch (error) {
      console.error('[TRIÈDRE] Modification du mot de passe :', error);
      afficherErreurMotDePasse(
        'Impossible de modifier ton mot de passe pour le moment.'
      );
    } finally {
      boutonSauvegarderMotDePasse.disabled = false;
    }
  }

  function afficherErreurMotDePasse(texte, champ) {
    if (!erreurMotDePasse) return;

    erreurMotDePasse.textContent = texte;
    erreurMotDePasse.hidden = false;

    if (champ) champ.focus();
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

  async function orienterApresConnexion(user) {
    try {
      const { data: contexte, error } = await supabase.rpc(
        'get_my_access_context'
      );

      if (error) {
        console.error('[TRIÈDRE] Résolution de l’espace après connexion :', error);
        afficherConnecte(user);
        return;
      }

      const acces = Array.isArray(contexte) ? contexte[0] : contexte;
      const role = acces && acces.role ? acces.role : 'member';

      if (role === 'admin') {
        window.location.assign('/admin');
        return;
      }

      if (role === 'coach') {
        window.location.assign('/coach');
        return;
      }

      afficherConnecte(user);
    } catch (error) {
      console.error('[TRIÈDRE] Orientation après connexion :', error);
      afficherConnecte(user);
    }
  }


  function appliquerNavigationAdmin() {
    const liste = document.querySelector('.main-nav ul');

    if (!liste) {
      return;
    }

    const chemin = window.location.pathname.replace(/\/+$/, '') || '/';

    const liens = [
      { href: '/', label: 'Accueil', path: '/' },
      { href: '/membre', label: 'Espace membre', path: '/membre' },
      { href: '/coach', label: 'Tableau Coach', path: '/coach' },
      { href: '/admin', label: 'Admin', path: '/admin' }
    ];

    liste.innerHTML = '';

    liens.forEach(function (item) {
      const li = document.createElement('li');
      const a = document.createElement('a');

      a.href = item.href;
      a.textContent = item.label;

      if (chemin === item.path) {
        a.classList.add('active');
      }

      li.appendChild(a);
      liste.appendChild(li);
    });
  }

  async function afficherAccesEspaceStaff() {
    if (!btnDeconnexion) {
      return;
    }

    const ancienLien = document.getElementById('membre-acces-staff');
    if (ancienLien) {
      ancienLien.remove();
    }

    try {
      const { data: contexte, error } = await supabase.rpc(
        'get_my_access_context'
      );

      if (error) {
        console.error('[TRIÈDRE] Accès espace staff :', error);
        return;
      }

      const acces = Array.isArray(contexte) ? contexte[0] : contexte;
      const role = acces && acces.role ? acces.role : 'member';

      if (role === 'admin') {
        appliquerNavigationAdmin();
      }

      if (role !== 'coach' && role !== 'admin') {
        return;
      }

      const lien = document.createElement('a');
      lien.id = 'membre-acces-staff';
      lien.className = 'membre-acces-staff';
      lien.href = role === 'admin' ? '/admin' : '/coach';
      lien.textContent = role === 'admin' ? 'Espace Admin' : 'Espace Coach';

      const titreBienvenue = document.getElementById('membre-prenom');

      if (titreBienvenue && titreBienvenue.parentElement) {
        titreBienvenue.parentElement.insertAdjacentElement('afterend', lien);
      } else {
        btnDeconnexion.insertAdjacentElement('beforebegin', lien);
      }
    } catch (error) {
      console.error('[TRIÈDRE] Création accès staff :', error);
    }
  }

  function retirerAccesEspaceStaff() {
    const lien = document.getElementById('membre-acces-staff');
    if (lien) {
      lien.remove();
    }
  }

  function afficherConnecte(user) {
    authZone.hidden = true;
    if (navigationMembre) navigationMembre.hidden = false;
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
    afficherAccesEspaceStaff();
  }

  function afficherDeconnecte(effacerEmail) {
    retirerAccesEspaceStaff();
    if (navigationMembre) navigationMembre.hidden = true;
    fermerMenusNavigationMembre();
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
    if (navigationMembre) navigationMembre.hidden = true;
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
