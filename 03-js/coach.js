document.addEventListener('DOMContentLoaded', function () {
  'use strict';

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


  const supabase = window.triedreSupabase;

  if (!supabase) {
    console.error(
      '[TRIÈDRE] Client Supabase indisponible dans le tableau coach.'
    );
    return;
  }

  const acces = document.getElementById('coach-acces');
  const zone = document.getElementById('coach-zone');
  const message = document.getElementById('coach-message');
  const membre = document.getElementById('coach-member');
  const dateDebut = document.getElementById('coach-start-date');
  const nomProgramme = document.getElementById('coach-program-name');
  const objectifProgramme = document.getElementById('coach-goal');
  const niveauProgramme = document.getElementById('coach-level');
  const dureeProgramme = document.getElementById('coach-duration');
  const nbSeances = document.getElementById('coach-sessions-count');
  const descriptionProgramme = document.getElementById('coach-program-description');
  const conteneurSeances = document.getElementById('coach-sessions');
  const boutonSubmit = document.getElementById('coach-submit');
  const boutonRefresh = document.getElementById('coach-refresh');
  const conteneurAffectations = document.getElementById('coach-assignments');
  const selectModele = document.getElementById('coach-template-select');
  const boutonChargerModele = document.getElementById('coach-template-load');
  const boutonSupprimerModele = document.getElementById('coach-template-delete');
  const boutonEnregistrerModele = document.getElementById('coach-template-save');
  const bandeauBrouillon = document.getElementById('coach-draft');
  const texteBrouillon = document.getElementById('coach-draft-text');
  const boutonEffacerBrouillon = document.getElementById('coach-draft-clear');

  const editeur = document.getElementById('coach-editor');
  const editeurTitre = document.getElementById('coach-editor-title');
  const editeurSousTitre = document.getElementById('coach-editor-subtitle');
  const editeurMessage = document.getElementById('coach-editor-message');
  const editeurListe = document.getElementById('coach-editor-list');
  const editeurSemaines = document.getElementById('coach-editor-weeks');
  const editeurReprise = document.getElementById('coach-editor-resume');
  const boutonFermerEditeur = document.getElementById('coach-editor-close');
  const boutonRedimensionner = document.getElementById('coach-editor-resize');
  const boutonDecaler = document.getElementById('coach-editor-reschedule');

  const conteneurSuivi = document.getElementById('coach-followup');
  const resumeSuivi = document.getElementById('coach-followup-summary');
  const boutonActualiserSuivi = document.getElementById('coach-followup-refresh');

  const VERSION_BROUILLON = 1;

  const etat = {
    user: null,
    membres: [],
    modeles: [],
    brouillonPret: false,
    minuterieBrouillon: null,
    editeur: null
  };

  initialiser();

  async function initialiser() {
    dateDebut.value = cleDate(obtenirProchainLundi(new Date()));
    construireSeances();

    nbSeances.addEventListener('change', construireSeances);

    // Nouvelle date de début : on recalcule TOUTES les dates de séance.
    // (Ne pas passer la fonction directement : l'objet Event serait reçu
    // comme « preserver » et bloquerait la mise à jour.)
    dateDebut.addEventListener('change', function () {
      appliquerDatesSuggerees(false);
    });

    boutonSubmit.addEventListener('click', creerProgramme);
    boutonRefresh.addEventListener('click', chargerAffectations);
    boutonActualiserSuivi.addEventListener('click', chargerSuivi);

    // Modèles
    selectModele.addEventListener('change', mettreAJourBoutonsModele);
    boutonChargerModele.addEventListener('click', chargerModeleSelectionne);
    boutonEnregistrerModele.addEventListener('click', enregistrerModele);
    armerConfirmation(
      boutonSupprimerModele,
      'Confirmer la suppression',
      supprimerModeleSelectionne
    );

    // Éditeur de programme attribué
    boutonFermerEditeur.addEventListener('click', fermerEditeur);
    armerConfirmation(boutonRedimensionner, 'Confirmer la durée', redimensionnerProgramme);
    armerConfirmation(boutonDecaler, 'Confirmer le décalage', decalerProgramme);

    // Brouillon : toute saisie dans le formulaire est sauvegardée.
    ['input', 'change', 'click'].forEach(function (type) {
      zone.addEventListener(type, planifierSauvegardeBrouillon);
    });

    armerConfirmation(
      boutonEffacerBrouillon,
      'Confirmer l’effacement',
      function () {
        supprimerBrouillon();
        reinitialiserFormulaire();
        afficherMessage('Brouillon effacé.', 'success');
      }
    );

    try {
      const {
        data: { user },
        error: erreurUtilisateur
      } = await supabase.auth.getUser();

      if (erreurUtilisateur || !user) {
        acces.innerHTML =
          '<p>Connecte-toi d’abord à ton compte TRIÈDRE pour accéder au tableau coach.</p>';
        return;
      }

      etat.user = user;

      const { data: contexteAcces, error: erreurContexte } = await supabase.rpc(
        'get_my_access_context'
      );

      if (erreurContexte) {
        throw erreurContexte;
      }

      const accesCompte = Array.isArray(contexteAcces)
        ? contexteAcces[0]
        : contexteAcces;

      const roleCompte =
        accesCompte && accesCompte.role ? accesCompte.role : 'member';

      if (roleCompte === 'admin') {
        appliquerNavigationAdmin();
      }

      const estStaff = roleCompte === 'coach' || roleCompte === 'admin';

      if (!estStaff) {
        acces.innerHTML =
          '<div><p class="section-eyebrow">Accès restreint</p><h2>ESPACE COACH</h2><p>Ce compte n’a pas les droits coach TRIÈDRE.</p></div>';
        return;
      }

      acces.hidden = true;
      zone.hidden = false;

      await Promise.all([
        chargerMembres(),
        chargerAffectations(),
        chargerModeles()
      ]);

      // Le brouillon est restauré une fois la liste des membres chargée,
      // pour pouvoir resélectionner le membre.
      restaurerBrouillon();
      etat.brouillonPret = true;
    } catch (error) {
      console.error('[TRIÈDRE] Initialisation coach :', error);
      acces.hidden = false;
      zone.hidden = true;
      acces.innerHTML =
        '<p>Impossible de vérifier l’accès coach pour le moment.</p>';
    }
  }

  async function chargerMembres() {
    const { data, error } = await supabase.rpc('coach_member_directory');

    if (error) {
      throw error;
    }

    etat.membres = data || [];

    membre.innerHTML = '<option value="">Choisir un membre</option>';

    etat.membres.forEach(function (item) {
      const option = document.createElement('option');
      option.value = item.user_id;

      const nom =
        (item.full_name || '').trim() ||
        (item.email || '').trim() ||
        'Membre TRIÈDRE';

      option.textContent = item.email
        ? nom + ' — ' + item.email
        : nom;

      membre.appendChild(option);
    });
  }

  async function chargerAffectations() {
    chargerSuivi();

    conteneurAffectations.innerHTML =
      '<p class="coach-empty">Chargement…</p>';

    const { data, error } = await supabase.rpc(
      'coach_recent_program_assignments',
      { result_limit: 20 }
    );

    if (error) {
      console.error('[TRIÈDRE] Affectations coach :', error);
      conteneurAffectations.innerHTML =
        '<p class="coach-empty">Impossible de charger les programmes attribués.</p>';
      return;
    }

    const lignes = data || [];

    if (!lignes.length) {
      conteneurAffectations.innerHTML =
        '<p class="coach-empty">Aucun programme attribué.</p>';
      return;
    }

    conteneurAffectations.innerHTML = '';

    lignes.forEach(function (item) {
      const carte = document.createElement('article');
      carte.className = 'coach-assignment';

      const infos = document.createElement('div');
      const titre = document.createElement('strong');
      titre.textContent = item.program_name || 'Programme TRIÈDRE';

      const details = document.createElement('small');
      const membreNom =
        item.member_name || item.member_email || 'Membre TRIÈDRE';

      details.textContent =
        membreNom +
        ' · ' +
        formaterDate(item.start_date) +
        ' · ' +
        (item.duration_weeks || '—') +
        ' semaines';

      infos.appendChild(titre);
      infos.appendChild(details);

      const cote = document.createElement('div');
      cote.className = 'coach-assignment-side';

      const statut = document.createElement('span');
      statut.className = 'coach-status';
      statut.textContent = libelleStatut(item.status);
      cote.appendChild(statut);

      const actions = creerActionsFin(item);

      if (actions) {
        cote.appendChild(actions);
      }

      carte.appendChild(infos);
      carte.appendChild(cote);
      conteneurAffectations.appendChild(carte);
    });
  }

  // Boutons « Terminer » / « Annuler » d'un programme attribué.
  // Un programme actif peut être terminé ou annulé ;
  // un programme à venir peut seulement être annulé.
  function creerActionsFin(item) {
    if (item.status !== 'active' && item.status !== 'scheduled') {
      return null;
    }

    const actions = document.createElement('div');
    actions.className = 'coach-assignment-actions';

    const modifier = document.createElement('button');
    modifier.type = 'button';
    modifier.className = 'coach-action-btn is-primary';
    modifier.textContent = 'Modifier';
    modifier.addEventListener('click', function () {
      ouvrirEditeur(item.member_program_id);
    });
    actions.appendChild(modifier);

    if (item.status === 'active') {
      actions.appendChild(
        creerBoutonFin(item, 'completed', 'Terminer', 'Confirmer la fin')
      );
    }

    actions.appendChild(
      creerBoutonFin(item, 'cancelled', 'Annuler', 'Confirmer l’annulation')
    );

    return actions;
  }

  // Confirmation en deux clics : le 1er arme le bouton, le 2e exécute.
  // Sans 2e clic dans les 4 secondes, le bouton revient à l'état normal.
  function creerBoutonFin(item, statutFinal, libelle, libelleConfirmation) {
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'coach-action-btn';
    bouton.textContent = libelle;

    if (statutFinal === 'cancelled') {
      bouton.classList.add('is-danger');
    }

    let minuterie = null;

    bouton.addEventListener('click', async function () {
      if (!bouton.classList.contains('is-confirming')) {
        bouton.classList.add('is-confirming');
        bouton.textContent = libelleConfirmation;

        minuterie = window.setTimeout(function () {
          bouton.classList.remove('is-confirming');
          bouton.textContent = libelle;
        }, 4000);

        return;
      }

      window.clearTimeout(minuterie);
      bouton.disabled = true;
      bouton.textContent = '…';

      await terminerProgramme(item, statutFinal);
    });

    return bouton;
  }

  async function terminerProgramme(item, statutFinal) {
    effacerMessage();

    const { error } = await supabase.rpc('coach_end_member_program', {
      target_member_program_id: item.member_program_id,
      final_status: statutFinal
    });

    if (error) {
      console.error('[TRIÈDRE] Fin de programme :', error);
      afficherMessage(traduireErreurFin(error), 'error');
      await chargerAffectations();
      return;
    }

    const membreNom =
      item.member_name || item.member_email || 'ce membre';

    afficherMessage(
      statutFinal === 'completed'
        ? 'Programme terminé pour ' + membreNom + '.'
        : 'Programme annulé pour ' + membreNom + '.',
      'success'
    );

    await chargerAffectations();
  }

  function traduireErreurFin(error) {
    const brut =
      error && typeof error.message === 'string' ? error.message : '';

    const messages = {
      PROGRAM_ALREADY_CLOSED:
        'Ce programme est déjà terminé ou annulé.',
      PROGRAM_NOT_STARTED:
        'Ce programme n’a pas encore commencé : tu peux seulement l’annuler.',
      MEMBER_ACCESS_DENIED:
        'Ce membre ne t’est pas assigné.',
      STAFF_ACCESS_REQUIRED:
        'Ton compte n’a plus les droits coach.',
      MEMBER_PROGRAM_NOT_FOUND:
        'Programme introuvable. Actualise la liste.'
    };

    const code = Object.keys(messages).find(function (cle) {
      return brut.includes(cle);
    });

    return code
      ? messages[code]
      : 'Impossible de modifier ce programme pour le moment.';
  }

  function construireSeances() {
    const total = Number(nbSeances.value) || 3;
    const anciennes = lireSeancesFormulaire(false);

    conteneurSeances.innerHTML = '';

    for (let index = 0; index < total; index += 1) {
      conteneurSeances.appendChild(
        creerBlocSeance(index, anciennes[index] || null)
      );
    }

    appliquerDatesSuggerees(true);
  }

  function creerBlocSeance(index, ancienne) {
    const bloc = document.createElement('article');
    bloc.className = 'coach-session';
    bloc.dataset.sessionIndex = String(index);

    const header = document.createElement('div');
    header.className = 'coach-session-header';

    const titreIndex = document.createElement('span');
    titreIndex.className = 'coach-session-index';
    titreIndex.textContent = 'Séance ' + (index + 1);

    header.appendChild(titreIndex);

    const grid = document.createElement('div');
    grid.className = 'coach-session-grid';

    grid.innerHTML = `
      <label class="coach-field">
        <span>Titre</span>
        <input type="text" data-field="title" placeholder="Ex. Bas du corps" required>
      </label>

      <label class="coach-field">
        <span>Date</span>
        <input type="date" data-field="date" required>
      </label>

      <label class="coach-field">
        <span>Durée (min)</span>
        <input type="number" data-field="duration" min="10" max="240" step="5" value="60">
      </label>

      <label class="coach-field">
        <span>Objectif</span>
        <input type="text" data-field="objective" placeholder="Ex. Force">
      </label>

      <label class="coach-field">
        <span>Niveau</span>
        <input type="text" data-field="level" value="${echapperHtml(niveauProgramme.value || 'Intermédiaire')}">
      </label>

      <label class="coach-field coach-field-description">
        <span>Description</span>
        <input type="text" data-field="description" placeholder="Intention de la séance…">
      </label>
    `;

    const exercices = document.createElement('div');
    exercices.className = 'coach-exercises';

    const exercicesHeading = document.createElement('div');
    exercicesHeading.className = 'coach-exercises-heading';

    const label = document.createElement('strong');
    label.textContent = 'Exercices';

    const ajouter = document.createElement('button');
    ajouter.type = 'button';
    ajouter.className = 'btn btn-secondaire';
    ajouter.textContent = '+ Ajouter un exercice';

    exercicesHeading.appendChild(label);
    exercicesHeading.appendChild(ajouter);

    const liste = document.createElement('div');
    liste.className = 'coach-exercises-list';

    ajouter.addEventListener('click', function () {
      liste.appendChild(creerLigneExercice());
    });

    exercices.appendChild(exercicesHeading);
    exercices.appendChild(liste);

    bloc.appendChild(header);
    bloc.appendChild(grid);
    bloc.appendChild(exercices);

    if (ancienne) {
      appliquerValeur(bloc, 'title', ancienne.title);
      appliquerValeur(bloc, 'date', ancienne.scheduled_date);
      appliquerValeur(bloc, 'duration', ancienne.duration_minutes);
      appliquerValeur(bloc, 'objective', ancienne.objective);
      appliquerValeur(bloc, 'level', ancienne.level);
      appliquerValeur(bloc, 'description', ancienne.description);

      (ancienne.exercises || []).forEach(function (exercice) {
        liste.appendChild(creerLigneExercice(exercice));
      });

      if (!liste.children.length) {
        liste.appendChild(creerLigneExercice());
      }
    } else {
      liste.appendChild(creerLigneExercice());
      liste.appendChild(creerLigneExercice());
      liste.appendChild(creerLigneExercice());
    }

    return bloc;
  }

  function creerLigneExercice(valeur) {
    const ligne = document.createElement('div');
    ligne.className = 'coach-exercise-row';

    ligne.innerHTML = `
      <label>
        <span>Exercice</span>
        <input type="text" data-exercise="name" placeholder="Ex. Squat">
      </label>

      <label>
        <span>Séries</span>
        <input type="number" data-exercise="sets" min="1" max="20" placeholder="3">
      </label>

      <label>
        <span>Répétitions</span>
        <input type="text" data-exercise="reps" placeholder="8-12">
      </label>

      <label>
        <span>Charge</span>
        <input type="text" data-exercise="load" maxlength="60" placeholder="60 kg, RPE 8…">
      </label>

      <label>
        <span>Repos (s)</span>
        <input type="number" data-exercise="rest" min="0" max="900" step="15" placeholder="90">
      </label>

      <label>
        <span>Note</span>
        <input type="text" data-exercise="notes" placeholder="Tempo, consigne…">
      </label>

      <button type="button" class="coach-remove-exercise" aria-label="Retirer l’exercice">×</button>
    `;

    ligne.querySelector('.coach-remove-exercise')
      .addEventListener('click', function () {
        ligne.remove();
      });

    if (valeur) {
      appliquerValeurExercice(ligne, 'name', valeur.name);
      appliquerValeurExercice(ligne, 'sets', valeur.sets);
      appliquerValeurExercice(ligne, 'reps', valeur.reps);
      appliquerValeurExercice(ligne, 'load', valeur.load);
      appliquerValeurExercice(ligne, 'rest', valeur.rest_seconds);
      appliquerValeurExercice(ligne, 'notes', valeur.notes);
    }

    return ligne;
  }

  function appliquerDatesSuggerees(preserver) {
    if (!dateDebut.value) {
      return;
    }

    const blocs = Array.from(
      conteneurSeances.querySelectorAll('.coach-session')
    );

    const offsets = suggererOffsets(blocs.length);

    blocs.forEach(function (bloc, index) {
      const champ = bloc.querySelector('[data-field="date"]');

      if (preserver === true && champ.value) {
        return;
      }

      champ.value = cleDate(
        ajouterJours(dateDepuisCle(dateDebut.value), offsets[index] ?? index)
      );
    });
  }

  function suggererOffsets(total) {
    const presets = {
      2: [0, 3],
      3: [0, 2, 4],
      4: [0, 1, 3, 4],
      5: [0, 1, 2, 3, 4],
      6: [0, 1, 2, 3, 4, 5]
    };

    return presets[total] || Array.from({ length: total }, function (_, i) {
      return i;
    });
  }

  async function creerProgramme() {
    effacerMessage();

    const payload = construirePayload();

    if (!payload) {
      return;
    }

    boutonSubmit.disabled = true;
    boutonSubmit.textContent = 'Création en cours…';

    try {
      const { data, error } = await supabase.rpc(
        'coach_create_assigned_program',
        { configuration: payload }
      );

      if (error) {
        throw error;
      }

      const resultat = Array.isArray(data) ? data[0] : data;

      afficherMessage(
        'Programme attribué avec succès. ' +
        (resultat && resultat.sessions_created
          ? resultat.sessions_created + ' séances ont été créées.'
          : ''),
        'success'
      );

      supprimerBrouillon();
      reinitialiserFormulaire();
      await chargerAffectations();

      window.scrollTo({
        top: document.querySelector('.coach-page').offsetTop,
        behavior: 'smooth'
      });
    } catch (error) {
      console.error('[TRIÈDRE] Création programme coach :', error);

      afficherMessage(traduireErreurCreation(error), 'error');
    } finally {
      boutonSubmit.disabled = false;
      boutonSubmit.textContent = 'Créer, attribuer et dupliquer';
    }
  }

  // Traduit les codes levés par coach_create_assigned_program (SQL)
  // en messages lisibles pour le coach.
  function traduireErreurCreation(error) {
    const brut =
      error && typeof error.message === 'string' ? error.message : '';

    const messages = {
      MEMBER_ALREADY_HAS_ACTIVE_PROGRAM:
        'Ce membre possède déjà un programme actif. Termine ou annule d’abord le programme actuel.',
      member_programs_one_active_per_user:
        'Ce membre possède déjà un programme actif. Termine ou annule d’abord le programme actuel.',
      MEMBER_PROGRAM_OVERLAP:
        'Ce membre a déjà un programme prévu ou en cours sur ces dates. Choisis une date de début après la fin du programme actuel.',
      MEMBER_ACCESS_DENIED:
        'Ce membre ne t’est pas assigné. Demande à un administrateur de te l’attribuer.',
      STAFF_ACCESS_REQUIRED:
        'Ton compte n’a plus les droits coach. Reconnecte-toi ou contacte un administrateur.',
      MEMBER_NOT_FOUND:
        'Ce membre est introuvable. Actualise la page et réessaie.',
      SESSION_OUTSIDE_FIRST_WEEK:
        'Toutes les séances doivent être dans les 7 premiers jours du programme.',
      SESSIONS_COUNT_MISMATCH:
        'Le nombre de séances ne correspond pas au nombre choisi par semaine.',
      INVALID_DURATION:
        'La durée du programme est invalide.'
    };

    const code = Object.keys(messages).find(function (cle) {
      return brut.includes(cle);
    });

    return code
      ? messages[code]
      : 'Impossible de créer le programme pour le moment.';
  }

  function construirePayload() {
    const programme = lireProgrammeFormulaire(true);

    if (!programme) {
      return null;
    }

    return Object.assign({ member_id: membre.value }, programme);
  }

  // Lit et valide le programme et sa semaine 1.
  // exigerMembre = false pour l'enregistrement d'un modèle.
  function lireProgrammeFormulaire(exigerMembre) {
    const startDate = dateDebut.value;
    const name = nomProgramme.value.trim();
    const duration = Number(dureeProgramme.value);
    const sessionsPerWeek = Number(nbSeances.value);

    if ((exigerMembre && !membre.value) || !startDate || !name) {
      afficherMessage(
        exigerMembre
          ? 'Choisis un membre, une date de début et un nom de programme.'
          : 'Indique au moins une date de début et un nom de programme.',
        'error'
      );
      return null;
    }

    const sessions = lireSeancesFormulaire(true);

    if (!sessions) {
      return null;
    }

    if (sessions.length !== sessionsPerWeek) {
      afficherMessage(
        'Le nombre de séances de la semaine 1 est incohérent.',
        'error'
      );
      return null;
    }

    const dates = sessions.map(function (session) {
      return session.scheduled_date;
    });

    if (new Set(dates).size !== dates.length) {
      afficherMessage(
        'Deux séances ne peuvent pas être prévues le même jour dans cette V1.',
        'error'
      );
      return null;
    }

    const debut = dateDepuisCle(startDate);
    const finSemaine = ajouterJours(debut, 6);

    const horsSemaine = sessions.some(function (session) {
      const d = dateDepuisCle(session.scheduled_date);
      return d < debut || d > finSemaine;
    });

    if (horsSemaine) {
      afficherMessage(
        'Toutes les séances de la semaine 1 doivent être comprises entre la date de début et les 6 jours suivants.',
        'error'
      );
      return null;
    }

    return {
      name: name,
      goal: objectifProgramme.value.trim() || null,
      level: niveauProgramme.value || null,
      duration_weeks: duration,
      sessions_per_week: sessionsPerWeek,
      description: descriptionProgramme.value.trim() || null,
      start_date: startDate,
      sessions: sessions
    };
  }

  function lireSeancesFormulaire(valider) {
    const blocs = Array.from(
      conteneurSeances.querySelectorAll('.coach-session')
    );

    const sessions = [];

    for (let index = 0; index < blocs.length; index += 1) {
      const bloc = blocs[index];

      const title = lireValeur(bloc, 'title').trim();
      const scheduledDate = lireValeur(bloc, 'date');
      const duration = Number(lireValeur(bloc, 'duration')) || null;
      const objective = lireValeur(bloc, 'objective').trim() || null;
      const level = lireValeur(bloc, 'level').trim() || null;
      const description = lireValeur(bloc, 'description').trim() || null;

      if (valider && (!title || !scheduledDate)) {
        afficherMessage(
          'Complète le titre et la date de chaque séance.',
          'error'
        );
        return null;
      }

      const lignes = Array.from(
        bloc.querySelectorAll('.coach-exercise-row')
      );

      const exercises = lignes.map(function (ligne) {
        return {
          name: lireValeurExercice(ligne, 'name').trim(),
          sets: entierOuNull(lireValeurExercice(ligne, 'sets')),
          reps: lireValeurExercice(ligne, 'reps').trim() || null,
          load: lireValeurExercice(ligne, 'load').trim() || null,
          rest_seconds: entierOuNull(lireValeurExercice(ligne, 'rest')),
          notes: lireValeurExercice(ligne, 'notes').trim() || null
        };
      }).filter(function (exercice) {
        return exercice.name;
      });

      if (valider && !exercises.length) {
        afficherMessage(
          'Ajoute au moins un exercice à chaque séance.',
          'error'
        );
        return null;
      }

      sessions.push({
        scheduled_date: scheduledDate,
        session_number: index + 1,
        title: title,
        description: description,
        duration_minutes: duration,
        level: level,
        objective: objective,
        exercises: exercises
      });
    }

    return sessions;
  }

  // ========================================================================
  // Formulaire : remplissage et remise à zéro
  // ========================================================================

  // Reconstruit la semaine 1 à partir de séances déjà connues
  // (modèle ou brouillon), sans recalculer les dates.
  function remplirSeances(sessions) {
    conteneurSeances.innerHTML = '';

    sessions.forEach(function (session, index) {
      conteneurSeances.appendChild(creerBlocSeance(index, session));
    });
  }

  function assurerOption(select, valeur, libelle) {
    const existe = Array.from(select.options).some(function (option) {
      return option.value === valeur;
    });

    if (!existe) {
      const option = document.createElement('option');
      option.value = valeur;
      option.textContent = libelle;
      select.appendChild(option);
    }

    select.value = valeur;
  }

  function reinitialiserFormulaire() {
    membre.value = '';
    nomProgramme.value = '';
    objectifProgramme.value = '';
    niveauProgramme.value = 'Intermédiaire';
    dureeProgramme.value = '8';
    nbSeances.value = '3';
    descriptionProgramme.value = '';
    dateDebut.value = cleDate(obtenirProchainLundi(new Date()));

    conteneurSeances.innerHTML = '';
    construireSeances();

    selectModele.value = '';
    mettreAJourBoutonsModele();
  }

  // Confirmation en deux clics, réutilisable.
  function armerConfirmation(bouton, libelleConfirmation, action) {
    let minuterie = null;
    let libelleOriginal = '';

    function desarmer() {
      window.clearTimeout(minuterie);
      bouton.classList.remove('is-confirming');

      if (libelleOriginal) {
        bouton.textContent = libelleOriginal;
      }

      libelleOriginal = '';
    }

    bouton.addEventListener('click', async function () {
      if (!bouton.classList.contains('is-confirming')) {
        libelleOriginal = bouton.textContent;
        bouton.classList.add('is-confirming');
        bouton.textContent = libelleConfirmation;
        minuterie = window.setTimeout(desarmer, 4000);
        return;
      }

      desarmer();
      bouton.disabled = true;

      try {
        await action();
      } finally {
        bouton.disabled = false;
      }
    });
  }

  // ========================================================================
  // Modèles de programmes (bibliothèque partagée entre coachs)
  // ========================================================================

  async function chargerModeles(idASelectionner) {
    const { data, error } = await supabase.rpc('coach_list_program_templates');

    if (error) {
      console.error('[TRIÈDRE] Modèles :', error);
      etat.modeles = [];
      remplirSelectModeles('');
      return;
    }

    etat.modeles = data || [];
    remplirSelectModeles(idASelectionner || '');
  }

  function remplirSelectModeles(idASelectionner) {
    selectModele.innerHTML = '<option value="">Nouveau programme</option>';

    etat.modeles.forEach(function (modele) {
      const option = document.createElement('option');
      option.value = modele.id;
      option.textContent =
        modele.name +
        ' — ' + modele.duration_weeks + ' sem. · ' +
        modele.sessions_per_week + ' séances/sem. · ' +
        (modele.author_name || 'Coach TRIÈDRE');
      selectModele.appendChild(option);
    });

    selectModele.value = trouverModele(idASelectionner) ? idASelectionner : '';
    mettreAJourBoutonsModele();
  }

  function trouverModele(id) {
    return etat.modeles.find(function (modele) {
      return modele.id === id;
    }) || null;
  }

  function mettreAJourBoutonsModele() {
    const modele = trouverModele(selectModele.value);

    boutonChargerModele.disabled = !modele;
    boutonSupprimerModele.hidden = !(modele && modele.can_delete);
  }

  function chargerModeleSelectionne() {
    const modele = trouverModele(selectModele.value);

    if (!modele) {
      return;
    }

    effacerMessage();
    appliquerModele(modele);
    sauvegarderBrouillon();

    afficherMessage(
      'Modèle « ' + modele.name + ' » chargé. Choisis le membre, vérifie la date de début et ajuste au besoin.',
      'success'
    );
  }

  // Le modèle garde des jours relatifs (0 = jour de début) :
  // les dates sont recalculées depuis la date de début choisie.
  function appliquerModele(modele) {
    if (!dateDebut.value) {
      dateDebut.value = cleDate(obtenirProchainLundi(new Date()));
    }

    const debut = dateDepuisCle(dateDebut.value);

    nomProgramme.value = modele.name || '';
    objectifProgramme.value = modele.goal || '';
    descriptionProgramme.value = modele.description || '';

    if (modele.level) {
      assurerOption(niveauProgramme, modele.level, modele.level);
    }

    assurerOption(
      dureeProgramme,
      String(modele.duration_weeks),
      modele.duration_weeks + ' semaines'
    );

    assurerOption(
      nbSeances,
      String(modele.sessions_per_week),
      String(modele.sessions_per_week)
    );

    const sessions = (modele.sessions || []).map(function (session) {
      return Object.assign({}, session, {
        scheduled_date: cleDate(
          ajouterJours(debut, Number(session.day_offset) || 0)
        )
      });
    });

    remplirSeances(sessions);
  }

  async function enregistrerModele() {
    effacerMessage();

    const programme = lireProgrammeFormulaire(false);

    if (!programme) {
      return;
    }

    const debut = dateDepuisCle(programme.start_date);

    const configuration = {
      name: programme.name,
      goal: programme.goal,
      level: programme.level,
      duration_weeks: programme.duration_weeks,
      sessions_per_week: programme.sessions_per_week,
      description: programme.description,
      sessions: programme.sessions.map(function (session) {
        return {
          day_offset: Math.round(
            (dateDepuisCle(session.scheduled_date) - debut) / 86400000
          ),
          session_number: session.session_number,
          title: session.title,
          description: session.description,
          duration_minutes: session.duration_minutes,
          level: session.level,
          objective: session.objective,
          exercises: session.exercises
        };
      })
    };

    boutonEnregistrerModele.disabled = true;
    boutonEnregistrerModele.textContent = 'Enregistrement…';

    try {
      const { data, error } = await supabase.rpc(
        'coach_save_program_template',
        { configuration: configuration }
      );

      if (error) {
        throw error;
      }

      await chargerModeles(data);

      afficherMessage(
        'Modèle « ' + programme.name + ' » enregistré dans la bibliothèque. ' +
        'S’il existait déjà sous ce nom, il a été mis à jour.',
        'success'
      );
    } catch (error) {
      console.error('[TRIÈDRE] Enregistrement modèle :', error);
      afficherMessage(traduireErreurModele(error), 'error');
    } finally {
      boutonEnregistrerModele.disabled = false;
      boutonEnregistrerModele.textContent = 'Enregistrer comme modèle';
    }
  }

  async function supprimerModeleSelectionne() {
    const modele = trouverModele(selectModele.value);

    if (!modele) {
      return;
    }

    effacerMessage();

    const { error } = await supabase.rpc('coach_delete_program_template', {
      target_template_id: modele.id
    });

    if (error) {
      console.error('[TRIÈDRE] Suppression modèle :', error);
      afficherMessage(traduireErreurModele(error), 'error');
      return;
    }

    await chargerModeles();
    afficherMessage('Modèle « ' + modele.name + ' » supprimé.', 'success');
  }

  function traduireErreurModele(error) {
    const brut =
      error && typeof error.message === 'string' ? error.message : '';

    const messages = {
      TEMPLATE_NOT_FOUND_OR_FORBIDDEN:
        'Tu peux seulement supprimer tes propres modèles.',
      TEMPLATE_TOO_LARGE:
        'Ce modèle est trop volumineux pour être enregistré.',
      PROGRAM_NAME_REQUIRED:
        'Donne un nom au programme avant de l’enregistrer comme modèle.',
      SESSION_TITLE_REQUIRED:
        'Complète le titre de chaque séance.',
      SESSION_OUTSIDE_FIRST_WEEK:
        'Chaque séance doit tomber sur un jour différent de la première semaine.',
      SESSIONS_COUNT_MISMATCH:
        'Le nombre de séances ne correspond pas au nombre choisi par semaine.',
      STAFF_ACCESS_REQUIRED:
        'Ton compte n’a plus les droits coach.'
    };

    const code = Object.keys(messages).find(function (cle) {
      return brut.includes(cle);
    });

    return code
      ? messages[code]
      : 'Impossible d’enregistrer le modèle pour le moment.';
  }

  // ========================================================================
  // Brouillon automatique (navigateur du coach uniquement)
  // Contient l'identifiant du membre choisi, jamais son nom ni son courriel.
  // ========================================================================

  function cleBrouillon() {
    return etat.user ? 'triedre-coach-brouillon-' + etat.user.id : null;
  }

  function planifierSauvegardeBrouillon() {
    if (!etat.brouillonPret) {
      return;
    }

    window.clearTimeout(etat.minuterieBrouillon);
    etat.minuterieBrouillon = window.setTimeout(sauvegarderBrouillon, 600);
  }

  function lireEtatFormulaire() {
    return {
      memberId: membre.value,
      startDate: dateDebut.value,
      name: nomProgramme.value,
      goal: objectifProgramme.value,
      level: niveauProgramme.value,
      duration: dureeProgramme.value,
      sessionsCount: nbSeances.value,
      description: descriptionProgramme.value,
      sessions: lireSeancesFormulaire(false)
    };
  }

  function formulaireAContenu(donnees) {
    return Boolean(
      donnees.name.trim() ||
      donnees.goal.trim() ||
      donnees.description.trim() ||
      donnees.sessions.some(function (session) {
        return session.title ||
          session.description ||
          session.objective ||
          session.exercises.length;
      })
    );
  }

  function sauvegarderBrouillon() {
    const cle = cleBrouillon();

    if (!cle || !etat.brouillonPret) {
      return;
    }

    const donnees = lireEtatFormulaire();

    if (!formulaireAContenu(donnees)) {
      supprimerBrouillon();
      return;
    }

    try {
      window.localStorage.setItem(cle, JSON.stringify({
        v: VERSION_BROUILLON,
        savedAt: new Date().toISOString(),
        data: donnees
      }));
    } catch (error) {
      // Stockage indisponible (navigation privée…) : on continue sans.
    }
  }

  function restaurerBrouillon() {
    const cle = cleBrouillon();

    if (!cle) {
      return;
    }

    let brouillon = null;

    try {
      brouillon = JSON.parse(window.localStorage.getItem(cle) || 'null');
    } catch (error) {
      brouillon = null;
    }

    if (!brouillon || brouillon.v !== VERSION_BROUILLON || !brouillon.data) {
      return;
    }

    const d = brouillon.data;

    dateDebut.value = d.startDate || dateDebut.value;
    nomProgramme.value = d.name || '';
    objectifProgramme.value = d.goal || '';
    descriptionProgramme.value = d.description || '';

    if (d.level) {
      assurerOption(niveauProgramme, d.level, d.level);
    }

    if (d.duration) {
      assurerOption(dureeProgramme, String(d.duration), d.duration + ' semaines');
    }

    const sessions = Array.isArray(d.sessions) ? d.sessions : [];

    if (sessions.length) {
      assurerOption(nbSeances, String(sessions.length), String(sessions.length));
      remplirSeances(sessions);
    }

    const membreExiste = Array.from(membre.options).some(function (option) {
      return option.value === d.memberId;
    });

    membre.value = membreExiste ? d.memberId : '';

    const date = new Date(brouillon.savedAt);

    texteBrouillon.textContent = isNaN(date)
      ? 'Brouillon restauré.'
      : 'Brouillon restauré, enregistré le ' +
        date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' }) +
        ' à ' +
        date.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }) +
        '.';

    bandeauBrouillon.hidden = false;
  }

  function supprimerBrouillon() {
    const cle = cleBrouillon();

    window.clearTimeout(etat.minuterieBrouillon);
    bandeauBrouillon.hidden = true;

    if (!cle) {
      return;
    }

    try {
      window.localStorage.removeItem(cle);
    } catch (error) {
      // Rien à faire.
    }
  }

  // ========================================================================
  // Éditeur d'un programme attribué (en cours ou à venir)
  // ========================================================================

  async function ouvrirEditeur(memberProgramId) {
    effacerMessageEditeur();
    editeur.hidden = false;
    editeurListe.innerHTML = '<p class="coach-empty">Chargement du programme…</p>';
    editeur.scrollIntoView({ behavior: 'smooth', block: 'start' });

    await chargerEditeur(memberProgramId);
  }

  async function chargerEditeur(memberProgramId) {
    const { data, error } = await supabase.rpc('coach_get_member_program', {
      target_member_program_id: memberProgramId
    });

    if (error || !data) {
      console.error('[TRIÈDRE] Lecture programme :', error);
      editeurListe.innerHTML = '';
      afficherMessageEditeur(traduireErreurEditeur(error), 'error');
      return;
    }

    etat.editeur = { id: memberProgramId, donnees: data };
    rendreEditeur();
  }

  function fermerEditeur() {
    etat.editeur = null;
    editeur.hidden = true;
    editeurListe.innerHTML = '';
    effacerMessageEditeur();
  }

  function rendreEditeur() {
    const d = etat.editeur.donnees;
    const programme = d.program || {};
    const seances = d.sessions || [];
    const faites = seances.filter(function (s) { return s.completed_at; }).length;
    const restantes = seances.filter(function (s) { return !s.completed_at; });
    const modifiable = d.status === 'active' || d.status === 'scheduled';

    editeurTitre.textContent = (programme.name || 'Programme TRIÈDRE').toUpperCase();
    editeurSousTitre.textContent =
      (d.member_name || 'Membre TRIÈDRE') + ' · ' +
      libelleStatut(d.status) + ' · ' +
      faites + ' / ' + seances.length + ' séances faites';

    // Durée : de la dernière semaine contenant une séance faite jusqu'à 52.
    const semaineMinimale = seances.reduce(function (max, s) {
      return s.completed_at ? Math.max(max, Number(s.week_number) || 1) : max;
    }, 1);
    const semaineActuelle = seances.reduce(function (max, s) {
      return Math.max(max, Number(s.week_number) || 1);
    }, 1);

    editeurSemaines.innerHTML = '';

    for (let n = semaineMinimale; n <= 52; n += 1) {
      const option = document.createElement('option');
      option.value = String(n);
      option.textContent = n + (n > 1 ? ' semaines' : ' semaine');
      editeurSemaines.appendChild(option);
    }

    editeurSemaines.value = String(semaineActuelle);

    const aujourdhui = cleDate(new Date());
    editeurReprise.min = aujourdhui;
    editeurReprise.value = restantes.length
      ? (restantes[0].scheduled_date < aujourdhui ? aujourdhui : restantes[0].scheduled_date)
      : aujourdhui;

    [editeurSemaines, editeurReprise, boutonRedimensionner].forEach(function (el) {
      el.disabled = !modifiable;
    });
    boutonDecaler.disabled = !modifiable || !restantes.length;

    // Séances groupées par semaine
    editeurListe.innerHTML = '';

    const parSemaine = new Map();
    seances.forEach(function (seance) {
      const n = Number(seance.week_number) || 1;
      if (!parSemaine.has(n)) parSemaine.set(n, []);
      parSemaine.get(n).push(seance);
    });

    Array.from(parSemaine.keys()).sort(function (a, b) { return a - b; })
      .forEach(function (numero) {
        const groupe = document.createElement('div');
        groupe.className = 'coach-editor-week';

        const titre = document.createElement('p');
        titre.className = 'coach-editor-week-title';
        titre.textContent = 'Semaine ' + numero;
        groupe.appendChild(titre);

        parSemaine.get(numero).forEach(function (seance) {
          groupe.appendChild(creerLigneSeanceEditeur(seance, modifiable));
        });

        editeurListe.appendChild(groupe);
      });
  }

  function etatSeance(seance) {
    if (seance.completed_at) return { cle: 'done', libelle: 'Faite 🔒' };
    if (Number(seance.sets_logged) > 0) return { cle: 'started', libelle: 'En cours 🔒' };
    if (seance.started_at) return { cle: 'started', libelle: 'Commencée' };
    if (seance.scheduled_date < cleDate(new Date())) return { cle: 'missed', libelle: 'Manquée' };
    return { cle: 'planned', libelle: 'À venir' };
  }

  function creerLigneSeanceEditeur(seance, modifiable) {
    const ligne = document.createElement('div');
    ligne.className = 'coach-editor-session';
    ligne.dataset.id = seance.id;

    const statut = etatSeance(seance);
    ligne.classList.add('is-' + statut.cle);

    const infos = document.createElement('div');
    infos.className = 'coach-editor-session-infos';

    const titre = document.createElement('strong');
    titre.textContent =
      'Séance ' + (seance.session_number || '—') + ' · ' + (seance.title || 'Séance');

    const details = document.createElement('small');
    const nbExercices = (seance.exercises || []).length;
    const ressenti = seance.feedback || null;
    details.textContent =
      formaterDateCourte(seance.scheduled_date) + ' · ' +
      nbExercices + ' exercice' + (nbExercices > 1 ? 's' : '') +
      (ressenti ? ' · effort ' + ressenti.effort + '/10' : '');

    if (ressenti && ressenti.pain) {
      ligne.classList.add('has-pain');
    }

    infos.appendChild(titre);
    infos.appendChild(details);

    const cote = document.createElement('div');
    cote.className = 'coach-editor-session-side';

    const badge = document.createElement('span');
    badge.className = 'coach-editor-badge';
    badge.textContent = statut.libelle;
    cote.appendChild(badge);

    const aDuCarnet = seance.completed_at || Number(seance.sets_logged) > 0;

    if (aDuCarnet) {
      const voirCarnet = document.createElement('button');
      voirCarnet.type = 'button';
      voirCarnet.className = 'coach-action-btn';
      voirCarnet.textContent = 'Voir le carnet';
      voirCarnet.setAttribute('aria-expanded', 'false');
      voirCarnet.addEventListener('click', function () {
        const ouvert = ligne.nextElementSibling &&
          ligne.nextElementSibling.classList.contains('coach-editor-carnet');

        if (ouvert) {
          ligne.nextElementSibling.remove();
          voirCarnet.setAttribute('aria-expanded', 'false');
          voirCarnet.textContent = 'Voir le carnet';
        } else {
          ligne.after(creerDetailCarnet(seance));
          voirCarnet.setAttribute('aria-expanded', 'true');
          voirCarnet.textContent = 'Masquer le carnet';
        }
      });
      cote.appendChild(voirCarnet);
    }

    if (modifiable && !seance.completed_at && !(Number(seance.sets_logged) > 0)) {
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'coach-action-btn';
      bouton.textContent = 'Modifier';
      bouton.addEventListener('click', function () {
        ouvrirFormulaireSeance(ligne, seance);
      });
      cote.appendChild(bouton);
    }

    ligne.appendChild(infos);
    ligne.appendChild(cote);
    return ligne;
  }

  // Formulaire de modification d'une séance, ouvert à la place de sa ligne.
  function ouvrirFormulaireSeance(ligne, seance) {
    const ouvert = editeurListe.querySelector('.coach-editor-form');
    if (ouvert) {
      rendreEditeur();
      ligne = Array.from(editeurListe.querySelectorAll('.coach-editor-session'))
        .find(function (el) { return el.dataset.id === seance.id; }) || null;
    }

    const formulaire = document.createElement('div');
    formulaire.className = 'coach-editor-form';

    const bloc = creerBlocSeance((seance.session_number || 1) - 1, seance);
    bloc.querySelector('.coach-session-index').textContent =
      'Séance ' + (seance.session_number || '—') + ' · Semaine ' + seance.week_number;
    formulaire.appendChild(bloc);

    const portee = document.createElement('fieldset');
    portee.className = 'coach-editor-scope';
    portee.innerHTML = `
      <legend>Appliquer la modification à</legend>
      <label><input type="radio" name="coach-scope" value="one" checked> Cette séance seulement</label>
      <label><input type="radio" name="coach-scope" value="following"> Cette séance et toutes les suivantes « Séance ${Number(seance.session_number) || 1} » (non faites)</label>
    `;
    formulaire.appendChild(portee);

    // La date ne se change que pour une séance seule.
    const champDate = bloc.querySelector('[data-field="date"]');
    portee.addEventListener('change', function () {
      const suivantes = portee.querySelector('input:checked').value === 'following';
      champDate.disabled = suivantes;
      if (suivantes) champDate.value = seance.scheduled_date;
    });

    const actions = document.createElement('div');
    actions.className = 'coach-editor-form-actions';

    const annuler = document.createElement('button');
    annuler.type = 'button';
    annuler.className = 'coach-action-btn';
    annuler.textContent = 'Annuler';
    annuler.addEventListener('click', rendreEditeur);

    const enregistrer = document.createElement('button');
    enregistrer.type = 'button';
    enregistrer.className = 'btn btn-primary';
    enregistrer.textContent = 'Enregistrer';
    enregistrer.addEventListener('click', function () {
      enregistrerSeance(formulaire, bloc, seance, enregistrer);
    });

    actions.appendChild(annuler);
    actions.appendChild(enregistrer);
    formulaire.appendChild(actions);

    if (ligne && ligne.parentNode) {
      ligne.replaceWith(formulaire);
    } else {
      editeurListe.prepend(formulaire);
    }

    formulaire.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function enregistrerSeance(formulaire, bloc, seance, bouton) {
    effacerMessageEditeur();

    const scope = formulaire.querySelector('input[name="coach-scope"]:checked').value;
    const titre = lireValeur(bloc, 'title').trim();

    const exercises = Array.from(bloc.querySelectorAll('.coach-exercise-row'))
      .map(function (ligne) {
        return {
          name: lireValeurExercice(ligne, 'name').trim(),
          sets: entierOuNull(lireValeurExercice(ligne, 'sets')),
          reps: lireValeurExercice(ligne, 'reps').trim() || null,
          load: lireValeurExercice(ligne, 'load').trim() || null,
          rest_seconds: entierOuNull(lireValeurExercice(ligne, 'rest')),
          notes: lireValeurExercice(ligne, 'notes').trim() || null
        };
      })
      .filter(function (exercice) { return exercice.name; });

    if (!titre || !exercises.length) {
      afficherMessageEditeur('Indique un titre et au moins un exercice.', 'error');
      return;
    }

    const configuration = {
      session_id: seance.id,
      scope: scope,
      title: titre,
      description: lireValeur(bloc, 'description').trim() || null,
      duration_minutes: entierOuNull(lireValeur(bloc, 'duration')),
      level: lireValeur(bloc, 'level').trim() || null,
      objective: lireValeur(bloc, 'objective').trim() || null,
      scheduled_date: scope === 'one' ? lireValeur(bloc, 'date') : null,
      exercises: exercises
    };

    bouton.disabled = true;
    bouton.textContent = 'Enregistrement…';

    const { data, error } = await supabase.rpc('coach_update_training_session', {
      configuration: configuration
    });

    if (error) {
      console.error('[TRIÈDRE] Modification séance :', error);
      afficherMessageEditeur(traduireErreurEditeur(error), 'error');
      bouton.disabled = false;
      bouton.textContent = 'Enregistrer';
      return;
    }

    await chargerEditeur(etat.editeur.id);
    await chargerAffectations();

    afficherMessageEditeur(
      Number(data) > 1
        ? data + ' séances mises à jour.'
        : 'Séance mise à jour.',
      'success'
    );
  }

  async function redimensionnerProgramme() {
    if (!etat.editeur) return;
    effacerMessageEditeur();

    const semaines = Number(editeurSemaines.value);

    const { data, error } = await supabase.rpc('coach_resize_member_program', {
      target_member_program_id: etat.editeur.id,
      new_total_weeks: semaines
    });

    if (error) {
      console.error('[TRIÈDRE] Durée programme :', error);
      afficherMessageEditeur(traduireErreurEditeur(error), 'error');
      return;
    }

    await chargerEditeur(etat.editeur.id);
    await chargerAffectations();

    afficherMessageEditeur(
      'Durée mise à jour : ' + semaines + ' semaine' + (semaines > 1 ? 's' : '') +
      ', ' + data + ' séances au total.',
      'success'
    );
  }

  async function decalerProgramme() {
    if (!etat.editeur) return;
    effacerMessageEditeur();

    if (!editeurReprise.value) {
      afficherMessageEditeur('Choisis une date de reprise.', 'error');
      return;
    }

    const { data, error } = await supabase.rpc('coach_reschedule_member_program', {
      target_member_program_id: etat.editeur.id,
      resume_date: editeurReprise.value
    });

    if (error) {
      console.error('[TRIÈDRE] Décalage programme :', error);
      afficherMessageEditeur(traduireErreurEditeur(error), 'error');
      return;
    }

    await chargerEditeur(etat.editeur.id);
    await chargerAffectations();

    afficherMessageEditeur(
      Number(data) > 0
        ? data + ' séance' + (data > 1 ? 's' : '') + ' décalée' + (data > 1 ? 's' : '') +
          ' : reprise le ' + formaterDateCourte(editeurReprise.value).replace(/\.$/, '') + '.'
        : 'Les séances restantes commencent déjà à cette date.',
      'success'
    );
  }

  function traduireErreurEditeur(error) {
    const brut =
      error && typeof error.message === 'string' ? error.message : '';

    const messages = {
      SESSION_LOCKED: 'Cette séance est déjà faite : elle est verrouillée.',
      SESSION_IN_PROGRESS: 'Le membre a déjà commencé cette séance (séries cochées) : elle est verrouillée.',
      SESSION_DATE_TAKEN: 'Une autre séance de ce programme est déjà prévue ce jour-là.',
      SESSION_TITLE_REQUIRED: 'Indique un titre pour la séance.',
      EXERCISES_REQUIRED: 'Ajoute au moins un exercice à la séance.',
      RESUME_DATE_IN_PAST: 'La date de reprise ne peut pas être dans le passé.',
      NOTHING_TO_RESCHEDULE: 'Toutes les séances sont déjà faites : rien à décaler.',
      SCHEDULE_CONFLICT: 'Ce décalage placerait une séance le même jour qu’une séance déjà faite.',
      WEEKS_ALREADY_DONE: 'Impossible de retirer des semaines qui contiennent des séances faites ou commencées.',
      MEMBER_PROGRAM_OVERLAP: 'Ce changement chevaucherait le programme suivant du membre. Décale ou ajuste d’abord celui-ci.',
      PROGRAM_NOT_EDITABLE: 'Ce programme est terminé ou annulé : il n’est plus modifiable.',
      INVALID_DURATION: 'La durée doit être comprise entre 1 et 52 semaines.',
      MEMBER_ACCESS_DENIED: 'Ce membre ne t’est pas assigné.',
      STAFF_ACCESS_REQUIRED: 'Ton compte n’a plus les droits coach.',
      MEMBER_PROGRAM_NOT_FOUND: 'Programme introuvable. Actualise la liste.'
    };

    const code = Object.keys(messages).find(function (cle) {
      return brut.includes(cle);
    });

    return code
      ? messages[code]
      : 'Impossible d’enregistrer cette modification pour le moment.';
  }

  function afficherMessageEditeur(texte, type) {
    editeurMessage.textContent = texte;
    editeurMessage.hidden = false;
    editeurMessage.className =
      'coach-message ' + (type === 'success' ? 'is-success' : 'is-error');
  }

  function effacerMessageEditeur() {
    editeurMessage.textContent = '';
    editeurMessage.hidden = true;
    editeurMessage.className = 'coach-message';
  }

  function formaterDateCourte(valeur) {
    if (!valeur) return '—';

    return dateDepuisCle(valeur).toLocaleDateString('fr-CA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  }

  // ========================================================================
  // Suivi des membres (données d'entraînement uniquement)
  // ========================================================================

  let suiviEnCours = null;

  function chargerSuivi() {
    // Évite deux chargements simultanés (plusieurs déclencheurs possibles).
    if (suiviEnCours) return suiviEnCours;

    suiviEnCours = (async function () {
      const { data, error } = await supabase.rpc('coach_member_followup');

      if (error) {
        console.error('[TRIÈDRE] Suivi des membres :', error);
        conteneurSuivi.innerHTML =
          '<p class="coach-empty">Impossible de charger le suivi pour le moment.</p>';
        resumeSuivi.textContent = '';
        return;
      }

      rendreSuivi(data || []);
    })().finally(function () {
      suiviEnCours = null;
    });

    return suiviEnCours;
  }

  function joursDepuis(horodatage) {
    if (!horodatage) return null;
    const date = new Date(horodatage);
    if (Number.isNaN(date.getTime())) return null;

    const aujourdhui = dateDepuisCle(cleDate(new Date()));
    const jour = dateDepuisCle(cleDate(date));
    return Math.max(0, Math.round((aujourdhui - jour) / 86400000));
  }

  // Niveau d'alerte : on repère vite qui décroche.
  function niveauSuivi(item) {
    if (item.status === 'scheduled') return 'avenir';

    const jours = joursDepuis(item.last_activity_at);
    const manquees = Number(item.missed_last_14_days) || 0;
    const echues = Number(item.sessions_due) || 0;

    if (manquees >= 2 || (jours !== null && jours >= 10) || (jours === null && echues >= 2)) {
      return 'relancer';
    }

    if (manquees === 1 || (jours !== null && jours >= 5) || (jours === null && echues === 1) ||
        item.recent_pain === true) {
      return 'surveiller';
    }

    return 'ok';
  }

  const LIBELLES_SUIVI = {
    relancer: 'À relancer',
    surveiller: 'À surveiller',
    ok: 'Sur la bonne voie',
    avenir: 'À venir'
  };

  function rendreSuivi(lignes) {
    conteneurSuivi.innerHTML = '';

    if (!lignes.length) {
      resumeSuivi.textContent = '';
      conteneurSuivi.innerHTML =
        '<p class="coach-empty">Aucun membre avec un programme en cours ou à venir.</p>';
      return;
    }

    const ordre = { relancer: 0, surveiller: 1, ok: 2, avenir: 3 };

    const items = lignes
      .map(function (item) { return Object.assign({ niveau: niveauSuivi(item) }, item); })
      .sort(function (a, b) {
        return ordre[a.niveau] - ordre[b.niveau] ||
          String(a.member_name).localeCompare(String(b.member_name), 'fr');
      });

    const compte = function (niveau) {
      return items.filter(function (item) { return item.niveau === niveau; }).length;
    };

    const morceaux = [];
    if (compte('relancer')) morceaux.push(compte('relancer') + ' à relancer');
    if (compte('surveiller')) morceaux.push(compte('surveiller') + ' à surveiller');
    if (compte('ok')) morceaux.push(compte('ok') + ' sur la bonne voie');
    if (compte('avenir')) morceaux.push(compte('avenir') + ' à venir');
    resumeSuivi.textContent = morceaux.join(' · ');

    items.forEach(function (item) {
      conteneurSuivi.appendChild(creerLigneSuivi(item));
    });
  }

  function creerLigneSuivi(item) {
    const ligne = document.createElement('article');
    ligne.className = 'coach-followup-row is-' + item.niveau;

    const entete = document.createElement('div');
    entete.className = 'coach-followup-head';

    const identite = document.createElement('div');
    const nom = document.createElement('strong');
    nom.textContent = item.member_name || 'Membre TRIÈDRE';
    const programme = document.createElement('small');
    programme.textContent = item.program_name || 'Programme TRIÈDRE';
    identite.appendChild(nom);
    identite.appendChild(programme);

    const badge = document.createElement('span');
    badge.className = 'coach-followup-badge';
    badge.textContent = LIBELLES_SUIVI[item.niveau];

    const badges = document.createElement('div');
    badges.className = 'coach-followup-badges';

    if (item.recent_pain === true) {
      const douleur = document.createElement('span');
      douleur.className = 'coach-followup-badge is-pain';
      douleur.textContent = '⚠ Douleur signalée';
      badges.appendChild(douleur);
    }

    badges.appendChild(badge);

    entete.appendChild(identite);
    entete.appendChild(badges);

    const total = Number(item.sessions_total) || 0;
    const faites = Number(item.sessions_done) || 0;
    const echues = Number(item.sessions_due) || 0;
    const progression = total ? Math.round((faites / total) * 100) : 0;

    const jauge = document.createElement('div');
    jauge.className = 'coach-followup-gauge';
    jauge.style.setProperty('--progression', progression + '%');
    jauge.setAttribute('aria-label', 'Progression : ' + progression + ' %');

    const metriques = document.createElement('div');
    metriques.className = 'coach-followup-metrics';

    const ajouterMetrique = function (libelle, valeur) {
      const bloc = document.createElement('span');
      const titre = document.createElement('small');
      titre.textContent = libelle;
      const texte = document.createElement('b');
      texte.textContent = valeur;
      bloc.appendChild(titre);
      bloc.appendChild(texte);
      metriques.appendChild(bloc);
    };

    if (item.status === 'scheduled') {
      ajouterMetrique('Démarre le', formaterDateCourte(item.start_date));
      ajouterMetrique('Séances prévues', String(total));
    } else {
      ajouterMetrique('Séances', faites + ' / ' + total);
      ajouterMetrique('Constance', echues ? Math.round((faites / echues) * 100) + ' %' : '—');
      ajouterMetrique('Dernière activité', libelleJours(joursDepuis(item.last_activity_at)));
      ajouterMetrique(
        'Manquées (14 j)',
        String(Number(item.missed_last_14_days) || 0)
      );
      ajouterMetrique(
        'Prochaine séance',
        item.next_session_date ? formaterDateCourte(item.next_session_date) : '—'
      );
      ajouterMetrique(
        'Effort moyen',
        item.recent_effort !== null && item.recent_effort !== undefined
          ? String(item.recent_effort).replace('.', ',') + ' / 10'
          : '—'
      );
    }

    const voir = document.createElement('button');
    voir.type = 'button';
    voir.className = 'coach-action-btn is-primary';
    voir.textContent = 'Voir le programme';
    voir.addEventListener('click', function () {
      ouvrirEditeur(item.member_program_id);
    });

    ligne.appendChild(entete);
    if (item.status !== 'scheduled') ligne.appendChild(jauge);
    ligne.appendChild(metriques);
    ligne.appendChild(voir);
    return ligne;
  }

  function libelleJours(jours) {
    if (jours === null) return 'Aucune';
    if (jours === 0) return 'Aujourd’hui';
    if (jours === 1) return 'Hier';
    return 'Il y a ' + jours + ' j';
  }

  // Détail du carnet d'une séance (dans l'éditeur) : prescrit vs réalisé.
  function creerDetailCarnet(seance) {
    const detail = document.createElement('div');
    detail.className = 'coach-editor-carnet';

    (seance.exercises || []).forEach(function (exercice) {
      const ligne = document.createElement('div');
      ligne.className = 'coach-editor-carnet-row';

      const nom = document.createElement('strong');
      nom.textContent = exercice.name || 'Exercice';

      const logs = exercice.logs || [];
      const prevues = Math.max(1, Number(exercice.sets) || 1);
      const texte = document.createElement('span');

      if (logs.length) {
        const charges = Array.from(new Set(
          logs.map(function (l) { return (l.load_done || '').trim(); }).filter(Boolean)
        ));

        texte.textContent =
          logs.length + ' / ' + prevues + ' séries' +
          (charges.length ? ' · ' + charges.join(' / ') : '') +
          (exercice.load ? ' (prévu : ' + exercice.load + ')' : '');
        ligne.classList.add(logs.length >= prevues ? 'is-full' : 'is-partial');
      } else if (exercice.completed_at) {
        texte.textContent = 'Passé par le membre';
        ligne.classList.add('is-skipped');
      } else {
        texte.textContent = seance.completed_at ? 'Aucune série notée' : 'Pas encore fait';
        ligne.classList.add('is-empty');
      }

      ligne.appendChild(nom);
      ligne.appendChild(texte);
      detail.appendChild(ligne);
    });

    const ressenti = seance.feedback;

    if (ressenti) {
      const bloc = document.createElement('div');
      bloc.className = 'coach-editor-feedback';

      const effort = document.createElement('p');
      effort.innerHTML = '';
      const titre = document.createElement('strong');
      titre.textContent = 'Ressenti du membre : ';
      effort.appendChild(titre);
      effort.appendChild(document.createTextNode('effort ' + ressenti.effort + '/10'));
      bloc.appendChild(effort);

      if (ressenti.shared) {
        const douleur = document.createElement('p');
        douleur.className = ressenti.pain ? 'is-pain' : '';
        douleur.textContent = ressenti.pain
          ? '⚠ Douleur signalée' + (ressenti.pain_area ? ' : ' + ressenti.pain_area : '')
          : 'Aucune douleur signalée';
        bloc.appendChild(douleur);

        if (ressenti.comment) {
          const commentaire = document.createElement('p');
          commentaire.className = 'coach-editor-feedback-comment';
          commentaire.textContent = '« ' + ressenti.comment + ' »';
          bloc.appendChild(commentaire);
        }
      } else {
        const prive = document.createElement('p');
        prive.className = 'coach-editor-feedback-private';
        prive.textContent = 'Douleur et commentaire non partagés par le membre.';
        bloc.appendChild(prive);
      }

      detail.appendChild(bloc);
    } else if (seance.completed_at) {
      const aucun = document.createElement('p');
      aucun.className = 'coach-editor-feedback-private';
      aucun.textContent = 'Le membre n’a pas encore donné son ressenti.';
      detail.appendChild(aucun);
    }

    return detail;
  }

  function afficherMessage(texte, type) {
    message.textContent = texte;
    message.hidden = false;
    message.className =
      'coach-message ' +
      (type === 'success' ? 'is-success' : 'is-error');
  }

  function effacerMessage() {
    message.textContent = '';
    message.hidden = true;
    message.className = 'coach-message';
  }

  function lireValeur(bloc, champ) {
    const element = bloc.querySelector('[data-field="' + champ + '"]');
    return element ? element.value : '';
  }

  function appliquerValeur(bloc, champ, valeur) {
    const element = bloc.querySelector('[data-field="' + champ + '"]');

    if (element && valeur !== null && valeur !== undefined) {
      element.value = valeur;
    }
  }

  function lireValeurExercice(ligne, champ) {
    const element = ligne.querySelector(
      '[data-exercise="' + champ + '"]'
    );

    return element ? element.value : '';
  }

  function appliquerValeurExercice(ligne, champ, valeur) {
    const element = ligne.querySelector(
      '[data-exercise="' + champ + '"]'
    );

    if (element && valeur !== null && valeur !== undefined) {
      element.value = valeur;
    }
  }

  function entierOuNull(valeur) {
    const n = Number(valeur);
    return Number.isFinite(n) && valeur !== '' ? Math.trunc(n) : null;
  }

  function libelleStatut(statut) {
    const labels = {
      scheduled: 'À venir',
      active: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé'
    };

    return labels[statut] || statut || 'Programme';
  }

  function formaterDate(valeur) {
    if (!valeur) {
      return '—';
    }

    return dateDepuisCle(valeur).toLocaleDateString('fr-CA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function obtenirProchainLundi(date) {
    const copie = new Date(date);
    copie.setHours(12, 0, 0, 0);

    const jour = copie.getDay();
    const ecart = jour === 1 ? 0 : ((8 - jour) % 7);

    copie.setDate(copie.getDate() + ecart);
    return copie;
  }

  function ajouterJours(date, nombre) {
    const copie = new Date(date);
    copie.setHours(12, 0, 0, 0);
    copie.setDate(copie.getDate() + nombre);
    return copie;
  }

  function dateDepuisCle(cle) {
    return new Date(cle + 'T12:00:00');
  }

  function cleDate(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  function echapperHtml(texte) {
    return String(texte)
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }
});
