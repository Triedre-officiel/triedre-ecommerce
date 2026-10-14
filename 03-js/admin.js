document.addEventListener('DOMContentLoaded', async function () {
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

  const acces = document.getElementById('admin-acces');
  const zone = document.getElementById('admin-zone');
  const message = document.getElementById('admin-message');

  const formCoach = document.getElementById('admin-form-coach');
  const emailCoach = document.getElementById('admin-coach-email');

  const listeCoachs = document.getElementById('admin-coachs');
  const listeMembres = document.getElementById('admin-membres');
  const listeHistorique = document.getElementById('admin-historique');

  const rechercheMembre = document.getElementById('admin-member-search');
  const boutonRefresh = document.getElementById('admin-refresh');

  const kpiCoachs = document.getElementById('admin-kpi-coachs');
  const kpiMembres = document.getElementById('admin-kpi-membres');
  const kpiTemporaires = document.getElementById('admin-kpi-temporaires');

  const etat = {
    user: null,
    coachs: [],
    membres: [],
    historique: [],
    derniereSuppression: null
  };

  if (!supabase) {
    acces.textContent = 'Connexion Supabase indisponible.';
    return;
  }

  formCoach.addEventListener('submit', activerCoach);
  boutonRefresh.addEventListener('click', chargerTout);
  rechercheMembre.addEventListener('input', afficherMembres);

  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      acces.textContent =
        'Connecte-toi d’abord à ton compte TRIÈDRE pour accéder à l’administration.';
      return;
    }

    etat.user = user;

    const { data: contexte, error } = await supabase.rpc(
      'get_my_access_context'
    );

    if (error) throw error;

    const valeur = Array.isArray(contexte) ? contexte[0] : contexte;

    if (!valeur || valeur.role !== 'admin') {
      acces.innerHTML =
        '<p class="section-eyebrow">Accès restreint</p>' +
        '<h2>ADMINISTRATION TRIÈDRE</h2>' +
        '<p>Ce compte ne possède pas les droits administrateur.</p>';
      return;
    }

    acces.hidden = true;
    acces.style.display = 'none';
    zone.hidden = false;

    appliquerNavigationAdmin();
    await chargerTout();
  } catch (error) {
    console.error('[TRIÈDRE] Initialisation admin :', error);
    acces.textContent =
      'Impossible de vérifier l’accès administrateur pour le moment.';
  }

  async function chargerTout() {
    masquerMessage();

    try {
      const [coachs, membres, historique, suppression] = await Promise.all([
        supabase.rpc('admin_coach_directory'),
        supabase.rpc('admin_member_assignment_directory'),
        supabase.rpc('admin_recent_assignment_history', { result_limit: 30 }),
        supabase.rpc('admin_last_history_deletion')
      ]);

      if (coachs.error) throw coachs.error;
      if (membres.error) throw membres.error;
      if (historique.error) throw historique.error;
      if (suppression.error) throw suppression.error;

      etat.coachs = coachs.data || [];
      etat.membres = membres.data || [];
      etat.historique = historique.data || [];
      etat.derniereSuppression =
        Array.isArray(suppression.data) && suppression.data.length
          ? suppression.data[0]
          : null;

      afficherCoachs();
      afficherMembres();
      afficherHistorique();
      afficherKpis();
    } catch (error) {
      console.error('[TRIÈDRE] Chargement admin :', error);
      afficherMessage(
        'Impossible de charger les données administratives pour le moment.',
        'error'
      );
    }
  }

  async function activerCoach(event) {
    event.preventDefault();

    const email = emailCoach.value.trim();

    if (!email) {
      afficherMessage('Entre l’adresse courriel du compte à promouvoir.', 'error');
      return;
    }

    const bouton = formCoach.querySelector('button[type="submit"]');
    bouton.disabled = true;
    bouton.textContent = 'Activation…';

    try {
      const { error } = await supabase.rpc(
        'admin_promote_coach_by_email',
        { target_email: email }
      );

      if (error) throw error;

      emailCoach.value = '';
      afficherMessage('Le compte a été activé comme coach.', 'success');
      await chargerTout();
    } catch (error) {
      console.error('[TRIÈDRE] Activation coach :', error);

      let texte = 'Impossible d’activer ce compte comme coach.';

      if (error.message && error.message.includes('USER_NOT_FOUND')) {
        texte = 'Aucun compte TRIÈDRE ne correspond à cette adresse courriel.';
      }

      if (error.message && error.message.includes('ADMIN_CANNOT_BECOME_COACH')) {
        texte = 'Un compte administrateur ne peut pas être converti en coach.';
      }

      afficherMessage(texte, 'error');
    } finally {
      bouton.disabled = false;
      bouton.textContent = 'Activer comme coach';
    }
  }

  function afficherCoachs() {
    listeCoachs.innerHTML = '';

    if (!etat.coachs.length) {
      listeCoachs.innerHTML =
        '<p class="admin-empty">Aucun coach TRIÈDRE n’est encore actif.</p>';
      return;
    }

    etat.coachs.forEach(function (coach) {
      const carte = document.createElement('article');
      carte.className = 'admin-coach';

      const principal = document.createElement('div');
      principal.className = 'admin-coach-main';

      const nom = document.createElement('strong');
      nom.textContent = coach.full_name || coach.email || 'Coach TRIÈDRE';

      const email = document.createElement('small');
      email.textContent = coach.email || '';

      const stats = document.createElement('div');
      stats.className = 'admin-coach-stats';

      stats.appendChild(
        creerChip(
          (coach.primary_members_count || 0) + ' membre(s) principal(aux)',
          coach.active
        )
      );

      if (Number(coach.temporary_members_count || 0) > 0) {
        stats.appendChild(
          creerChip(
            (coach.temporary_members_count || 0) + ' couverture(s) temporaire(s)',
            true
          )
        );
      }

      principal.appendChild(nom);
      principal.appendChild(email);
      principal.appendChild(stats);

      const actions = document.createElement('div');
      actions.className = 'admin-actions-row';

      const statut = creerChip(coach.active ? 'Actif' : 'Suspendu', coach.active);
      actions.appendChild(statut);

      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.className = 'btn btn-secondaire';
      bouton.textContent = coach.active ? 'Suspendre' : 'Réactiver';

      bouton.addEventListener('click', async function () {
        await changerEtatCoach(coach.user_id, !coach.active);
      });

      actions.appendChild(bouton);

      carte.appendChild(principal);
      carte.appendChild(actions);
      listeCoachs.appendChild(carte);
    });
  }

  function afficherMembres() {
    const recherche = rechercheMembre.value.trim().toLowerCase();

    const membres = etat.membres.filter(function (membre) {
      if (!recherche) return true;

      return [
        membre.full_name || '',
        membre.email || '',
        membre.primary_coach_name || '',
        membre.temporary_coach_name || ''
      ].join(' ').toLowerCase().includes(recherche);
    });

    listeMembres.innerHTML = '';

    if (!membres.length) {
      listeMembres.innerHTML =
        '<p class="admin-empty">Aucun membre ne correspond à cette recherche.</p>';
      return;
    }

    membres.forEach(function (membre) {
      listeMembres.appendChild(creerCarteMembre(membre));
    });
  }

  function creerCarteMembre(membre) {
    const carte = document.createElement('article');
    carte.className = 'admin-member';

    const top = document.createElement('div');
    top.className = 'admin-member-top';

    const principal = document.createElement('div');
    principal.className = 'admin-member-main';

    const nom = document.createElement('strong');
    nom.textContent = membre.full_name || membre.email || 'Membre TRIÈDRE';

    const email = document.createElement('small');
    email.textContent = membre.email || '';

    principal.appendChild(nom);
    principal.appendChild(email);

    const statut = document.createElement('div');
    statut.className = 'admin-member-status';

    const coachPrincipal = membre.primary_coach_name || 'Non attribué';
    const principalTexte = document.createElement('strong');
    principalTexte.textContent = 'Coach : ' + coachPrincipal;

    statut.appendChild(principalTexte);

    if (membre.temporary_coach_name) {
      const temporaire = document.createElement('small');
      temporaire.textContent =
        'Couverture : ' +
        membre.temporary_coach_name +
        (membre.temporary_until
          ? ' jusqu’au ' + formaterDate(membre.temporary_until)
          : '');
      statut.appendChild(temporaire);
    }

    top.appendChild(principal);
    top.appendChild(statut);

    const actions = document.createElement('div');
    actions.className = 'admin-member-actions';

    const labelPrincipal = document.createElement('label');
    labelPrincipal.innerHTML = '<span>Coach principal</span>';

    const selectPrincipal = creerSelectCoachs(
      membre.primary_coach_id,
      false
    );
    labelPrincipal.appendChild(selectPrincipal);

    const boutonPrincipal = document.createElement('button');
    boutonPrincipal.type = 'button';
    boutonPrincipal.className = 'btn btn-secondaire';
    boutonPrincipal.textContent = 'Attribuer';

    boutonPrincipal.addEventListener('click', async function () {
      if (!selectPrincipal.value) {
        afficherMessage('Choisis un coach principal.', 'error');
        return;
      }

      await attribuerCoachPrincipal(
        membre.user_id,
        selectPrincipal.value
      );
    });

    const labelTemp = document.createElement('label');
    labelTemp.innerHTML = '<span>Couverture temporaire</span>';

    const selectTemp = creerSelectCoachs(
      membre.temporary_coach_id,
      true
    );
    labelTemp.appendChild(selectTemp);

    const labelDate = document.createElement('label');
    labelDate.innerHTML = '<span>Jusqu’au</span>';

    const dateFin = document.createElement('input');
    dateFin.type = 'date';
    if (membre.temporary_until) {
      dateFin.value = membre.temporary_until;
    }
    labelDate.appendChild(dateFin);

    const ligneTemp = document.createElement('div');
    ligneTemp.className = 'admin-actions-row admin-action-wide';

    const boutonTemp = document.createElement('button');
    boutonTemp.type = 'button';
    boutonTemp.className = 'btn btn-secondaire';
    boutonTemp.textContent = 'Activer la couverture';

    boutonTemp.addEventListener('click', async function () {
      if (!selectTemp.value) {
        afficherMessage('Choisis un coach pour la couverture temporaire.', 'error');
        return;
      }

      await attribuerCouverture(
        membre.user_id,
        selectTemp.value,
        dateFin.value || null
      );
    });

    const boutonMoi = document.createElement('button');
    boutonMoi.type = 'button';
    boutonMoi.className = 'btn btn-secondaire';
    boutonMoi.textContent = 'Je prends le suivi';

    boutonMoi.addEventListener('click', async function () {
      await prendreEnCharge(
        membre.user_id,
        dateFin.value || null
      );
    });

    ligneTemp.appendChild(boutonTemp);
    ligneTemp.appendChild(boutonMoi);

    if (membre.temporary_coach_id) {
      const boutonFin = document.createElement('button');
      boutonFin.type = 'button';
      boutonFin.className = 'btn btn-secondaire';
      boutonFin.textContent = 'Terminer la couverture';

      boutonFin.addEventListener('click', async function () {
        await terminerCouverture(membre.user_id);
      });

      ligneTemp.appendChild(boutonFin);
    }

    actions.appendChild(labelPrincipal);
    actions.appendChild(boutonPrincipal);
    actions.appendChild(labelTemp);
    actions.appendChild(labelDate);
    actions.appendChild(ligneTemp);

    carte.appendChild(top);
    carte.appendChild(actions);

    return carte;
  }

  function creerSelectCoachs(selection, autoriserAdmin) {
    const select = document.createElement('select');

    const vide = document.createElement('option');
    vide.value = '';
    vide.textContent = 'Choisir un coach';
    select.appendChild(vide);

    etat.coachs
      .filter(function (coach) {
        return coach.active;
      })
      .forEach(function (coach) {
        const option = document.createElement('option');
        option.value = coach.user_id;
        option.textContent = coach.full_name || coach.email || 'Coach TRIÈDRE';
        option.selected = selection === coach.user_id;
        select.appendChild(option);
      });

    return select;
  }

  async function changerEtatCoach(coachId, actif) {
    try {
      const { error } = await supabase.rpc(
        'admin_set_coach_active',
        {
          target_coach_id: coachId,
          new_active: actif
        }
      );

      if (error) throw error;

      afficherMessage(
        actif ? 'Le coach a été réactivé.' : 'Le coach a été suspendu.',
        'success'
      );

      await chargerTout();
    } catch (error) {
      console.error('[TRIÈDRE] État coach :', error);

      let texte = 'Impossible de modifier l’état de ce coach.';

      if (error.message && error.message.includes('COACH_HAS_ACTIVE_MEMBERS')) {
        texte =
          'Ce coach possède encore des membres actifs. Réaffecte-les ou utilise une couverture temporaire avant de le suspendre.';
      }

      afficherMessage(texte, 'error');
    }
  }

  async function attribuerCoachPrincipal(memberId, coachId) {
    try {
      const { error } = await supabase.rpc(
        'admin_assign_primary_coach',
        {
          target_member_id: memberId,
          target_coach_id: coachId,
          assignment_reason: 'Affectation depuis l’espace admin'
        }
      );

      if (error) throw error;

      afficherMessage('Le coach principal a été mis à jour.', 'success');
      await chargerTout();
    } catch (error) {
      console.error('[TRIÈDRE] Affectation principale :', error);

      if (
        error.message &&
        error.message.includes('PRIMARY_COACH_ALREADY_ASSIGNED')
      ) {
        afficherMessage('Ce coach est déjà attribué à ce membre.', 'success');
        return;
      }

      afficherMessage('Impossible de modifier le coach principal.', 'error');
    }
  }

  async function attribuerCouverture(memberId, coachId, untilDate) {
    try {
      const { error } = await supabase.rpc(
        'admin_assign_temporary_coach',
        {
          target_member_id: memberId,
          target_coach_id: coachId,
          temporary_until: untilDate,
          assignment_reason: 'Couverture temporaire depuis l’espace admin'
        }
      );

      if (error) throw error;

      afficherMessage('La couverture temporaire est active.', 'success');
      await chargerTout();
    } catch (error) {
      console.error('[TRIÈDRE] Couverture temporaire :', error);

      if (
        error.message &&
        error.message.includes('TEMPORARY_ASSIGNMENT_ALREADY_ACTIVE')
      ) {
        afficherMessage(
          'Cette couverture temporaire est déjà active avec ce coach et cette date.',
          'success'
        );
        return;
      }

      afficherMessage('Impossible d’activer cette couverture temporaire.', 'error');
    }
  }

  async function prendreEnCharge(memberId, untilDate) {
    try {
      const { error } = await supabase.rpc(
        'admin_take_over_member_temporarily',
        {
          target_member_id: memberId,
          temporary_until: untilDate,
          assignment_reason: 'Prise en charge temporaire par un administrateur'
        }
      );

      if (error) throw error;

      afficherMessage('Tu assures maintenant temporairement le suivi de ce membre.', 'success');
      await chargerTout();
    } catch (error) {
      console.error('[TRIÈDRE] Prise en charge admin :', error);
      afficherMessage('Impossible de prendre temporairement ce suivi.', 'error');
    }
  }

  async function terminerCouverture(memberId) {
    try {
      const { error } = await supabase.rpc(
        'admin_end_temporary_assignment',
        {
          target_member_id: memberId,
          assignment_reason: 'Fin de couverture depuis l’espace admin'
        }
      );

      if (error) throw error;

      afficherMessage('La couverture temporaire est terminée.', 'success');
      await chargerTout();
    } catch (error) {
      console.error('[TRIÈDRE] Fin couverture :', error);
      afficherMessage('Impossible de terminer cette couverture.', 'error');
    }
  }

  function afficherHistorique() {
    listeHistorique.innerHTML = '';

    afficherDerniereSuppression();

    if (!etat.historique.length) {
      const vide = document.createElement('p');
      vide.className = 'admin-empty';
      vide.textContent = 'Aucune affectation terminée enregistrée.';
      listeHistorique.appendChild(vide);
      return;
    }

    etat.historique.forEach(function (item) {
      const carte = document.createElement('article');
      carte.className = 'admin-history-item';

      const texte = document.createElement('div');
      const titre = document.createElement('strong');
      titre.textContent =
        (item.member_name || item.member_email || 'Membre TRIÈDRE') +
        ' → ' +
        (item.coach_name || item.coach_email || 'Staff TRIÈDRE');

      const details = document.createElement('small');
      details.textContent =
        libelleType(item.assignment_kind) +
        ' · ' +
        formaterDateHeure(item.started_at) +
        (item.ended_at ? ' → ' + formaterDateHeure(item.ended_at) : '');

      texte.appendChild(titre);
      texte.appendChild(details);

      const actions = document.createElement('div');
      actions.className = 'admin-history-actions';

      const type = document.createElement('span');
      type.className = 'admin-history-kind';
      type.textContent = 'Historique';

      const supprimer = document.createElement('button');
      supprimer.type = 'button';
      supprimer.className = 'admin-history-delete';
      supprimer.textContent = 'Supprimer';

      supprimer.addEventListener('click', async function () {
        await supprimerHistorique(item);
      });

      actions.appendChild(type);
      actions.appendChild(supprimer);

      carte.appendChild(texte);
      carte.appendChild(actions);
      listeHistorique.appendChild(carte);
    });
  }

  function afficherDerniereSuppression() {
    const existant = document.getElementById('admin-derniere-suppression');

    if (existant) {
      existant.remove();
    }

    if (!etat.derniereSuppression) {
      return;
    }

    const info = etat.derniereSuppression;
    const bandeau = document.createElement('div');
    bandeau.id = 'admin-derniere-suppression';
    bandeau.className = 'admin-last-deletion';

    const acteur =
      info.deleted_by_name ||
      info.deleted_by_email ||
      'Administrateur TRIÈDRE';

    const label = document.createElement('span');
    label.textContent = 'Dernière suppression';

    const nom = document.createElement('strong');
    nom.textContent = acteur;

    const date = document.createElement('small');
    date.textContent = formaterDateHeure(info.deleted_at);

    bandeau.appendChild(label);
    bandeau.appendChild(nom);
    bandeau.appendChild(date);

    listeHistorique.parentElement.insertBefore(bandeau, listeHistorique);
  }

  async function supprimerHistorique(item) {
    if (
      !window.triedreModal ||
      typeof window.triedreModal.confirm !== 'function'
    ) {
      console.error('[TRIÈDRE] Modal globale indisponible.');
      afficherMessage(
        'Impossible d’ouvrir la confirmation pour le moment.',
        'error'
      );
      return;
    }

    const confirmation = await window.triedreModal.confirm({
      eyebrow: 'Sécurité',
      title: 'SUPPRIMER CET HISTORIQUE ?',
      message:
        'Cette entrée disparaîtra de l’historique visible. ' +
        'La suppression restera enregistrée dans le journal d’administration.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    });

    if (!confirmation) {
      return;
    }

    const authentifie = await demanderReauthentification();

    if (!authentifie) {
      return;
    }

    try {
      const { error } = await supabase.rpc(
        'admin_delete_assignment_history',
        { target_assignment_id: item.assignment_id }
      );

      if (error) throw error;

      afficherMessage(
        'L’entrée a été supprimée. La suppression a été enregistrée.',
        'success'
      );

      await chargerTout();
    } catch (error) {
      console.error('[TRIÈDRE] Suppression historique :', error);

      let texte = 'Impossible de supprimer cette entrée de l’historique.';

      if (
        error.message &&
        error.message.includes('ACTIVE_ASSIGNMENT_CANNOT_BE_DELETED')
      ) {
        texte = 'Une affectation encore active ne peut pas être supprimée.';
      }

      afficherMessage(texte, 'error');
    }
  }

  function demanderReauthentification() {
    return new Promise(function (resolve) {
      const ancien = document.getElementById('admin-reauth-overlay');

      if (ancien) {
        ancien.remove();
      }

      const overlay = document.createElement('div');
      overlay.id = 'admin-reauth-overlay';
      overlay.className = 'admin-reauth-overlay';

      const dialogue = document.createElement('div');
      dialogue.className = 'admin-reauth-dialog';
      dialogue.setAttribute('role', 'dialog');
      dialogue.setAttribute('aria-modal', 'true');
      dialogue.setAttribute('aria-labelledby', 'admin-reauth-title');

      dialogue.innerHTML =
        '<p class="section-eyebrow">Sécurité</p>' +
        '<h2 id="admin-reauth-title">CONFIRMER TON IDENTITÉ</h2>' +
        '<p>Entre le mot de passe de ton compte administrateur pour continuer.</p>' +
        '<label class="admin-field">' +
          '<span>Mot de passe</span>' +
          '<input id="admin-reauth-password" type="password" autocomplete="current-password">' +
        '</label>' +
        '<p id="admin-reauth-error" class="admin-reauth-error" hidden></p>' +
        '<div class="admin-reauth-actions">' +
          '<button type="button" class="btn btn-secondaire" id="admin-reauth-cancel">Annuler</button>' +
          '<button type="button" class="btn btn-primary" id="admin-reauth-confirm">Confirmer</button>' +
        '</div>';

      overlay.appendChild(dialogue);
      document.body.appendChild(overlay);

      const input = document.getElementById('admin-reauth-password');
      const erreur = document.getElementById('admin-reauth-error');
      const confirmer = document.getElementById('admin-reauth-confirm');
      const annuler = document.getElementById('admin-reauth-cancel');

      window.setTimeout(function () {
        input.focus();
      }, 0);

      annuler.addEventListener('click', function () {
        overlay.remove();
        resolve(false);
      });

      overlay.addEventListener('click', function (event) {
        if (event.target === overlay) {
          overlay.remove();
          resolve(false);
        }
      });

      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          confirmer.click();
        }
      });

      confirmer.addEventListener('click', async function () {
        const password = input.value;

        if (!password) {
          erreur.textContent = 'Entre ton mot de passe.';
          erreur.hidden = false;
          return;
        }

        confirmer.disabled = true;
        confirmer.textContent = 'Vérification…';
        erreur.hidden = true;

        try {
          const { error } = await supabase.auth.signInWithPassword({
            email: etat.user.email,
            password: password
          });

          if (error) {
            erreur.textContent = 'Mot de passe incorrect.';
            erreur.hidden = false;
            confirmer.disabled = false;
            confirmer.textContent = 'Confirmer';
            return;
          }

          overlay.remove();
          resolve(true);
        } catch (error) {
          console.error('[TRIÈDRE] Réauthentification :', error);
          erreur.textContent = 'Impossible de vérifier ton identité.';
          erreur.hidden = false;
          confirmer.disabled = false;
          confirmer.textContent = 'Confirmer';
        }
      });
    });
  }

  function afficherKpis() {
    kpiCoachs.textContent = String(
      etat.coachs.filter(function (coach) {
        return coach.active;
      }).length
    );

    kpiMembres.textContent = String(
      etat.membres.filter(function (membre) {
        return Boolean(membre.primary_coach_id);
      }).length
    );

    kpiTemporaires.textContent = String(
      etat.membres.filter(function (membre) {
        return Boolean(membre.temporary_coach_id);
      }).length
    );
  }

  function creerChip(texte, actif) {
    const chip = document.createElement('span');
    chip.className = 'admin-chip' + (actif ? ' is-active' : '');
    chip.textContent = texte;
    return chip;
  }

  function libelleType(type) {
    return type === 'temporary'
      ? 'Couverture temporaire'
      : 'Coach principal';
  }

  function formaterDate(valeur) {
    if (!valeur) return '';

    return new Date(valeur + 'T12:00:00').toLocaleDateString('fr-CA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  function formaterDateHeure(valeur) {
    if (!valeur) return '';

    return new Date(valeur).toLocaleString('fr-CA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function afficherMessage(texte, type) {
    message.textContent = texte;
    message.hidden = false;
    message.className =
      'admin-message ' +
      (type === 'success' ? 'is-success' : 'is-error');
  }

  function masquerMessage() {
    message.hidden = true;
    message.textContent = '';
    message.className = 'admin-message';
  }
});
