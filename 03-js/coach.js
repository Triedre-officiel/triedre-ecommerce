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

  const etat = {
    user: null,
    membres: []
  };

  initialiser();

  async function initialiser() {
    dateDebut.value = cleDate(obtenirProchainLundi(new Date()));
    construireSeances();

    nbSeances.addEventListener('change', construireSeances);
    dateDebut.addEventListener('change', appliquerDatesSuggerees);
    boutonSubmit.addEventListener('click', creerProgramme);
    boutonRefresh.addEventListener('click', chargerAffectations);

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
      acces.style.display = 'none';
      zone.hidden = false;
      zone.style.display = '';

      await Promise.all([
        chargerMembres(),
        chargerAffectations()
      ]);
    } catch (error) {
      console.error('[TRIÈDRE] Initialisation coach :', error);
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

      const statut = document.createElement('span');
      statut.className = 'coach-status';
      statut.textContent = libelleStatut(item.status);

      carte.appendChild(infos);
      carte.appendChild(statut);
      conteneurAffectations.appendChild(carte);
    });
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

      if (preserver && champ.value) {
        return;
      }

      champ.value = cleDate(
        ajouterJours(dateDepuisCle(dateDebut.value), offsets[index] || index)
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

      await chargerAffectations();

      window.scrollTo({
        top: document.querySelector('.coach-page').offsetTop,
        behavior: 'smooth'
      });
    } catch (error) {
      console.error('[TRIÈDRE] Création programme coach :', error);

      let texte = 'Impossible de créer le programme pour le moment.';

      if (
        error &&
        typeof error.message === 'string' &&
        error.message.includes('member_programs_one_active_per_user')
      ) {
        texte =
          'Ce membre possède déjà un programme actif. Termine ou annule d’abord le programme actuel.';
      }

      afficherMessage(texte, 'error');
    } finally {
      boutonSubmit.disabled = false;
      boutonSubmit.textContent = 'Créer, attribuer et dupliquer';
    }
  }

  function construirePayload() {
    const memberId = membre.value;
    const startDate = dateDebut.value;
    const name = nomProgramme.value.trim();
    const duration = Number(dureeProgramme.value);
    const sessionsPerWeek = Number(nbSeances.value);

    if (!memberId || !startDate || !name) {
      afficherMessage(
        'Choisis un membre, une date de début et un nom de programme.',
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

    const uniques = new Set(dates);

    if (uniques.size !== dates.length) {
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
      member_id: memberId,
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
