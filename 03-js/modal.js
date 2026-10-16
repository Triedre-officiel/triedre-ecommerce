// ==========================================================================
// TRIÈDRE — Modal globale
// ==========================================================================
// Usage :
// const ok = await window.triedreModal.confirm({
//   eyebrow: 'Sécurité',
//   title: 'CONFIRMER L’ACTION',
//   message: '...',
//   confirmText: 'Confirmer',
//   cancelText: 'Annuler'
// });
//
// Message simple (un seul bouton) :
// await window.triedreModal.alert({ eyebrow: 'Studio', title: 'ENREGISTRÉ', message: '...' });
// ==========================================================================

(function () {
  'use strict';

  let clavierActif = null;

  function fermerModal(overlay, valeur, resolve) {
    if (clavierActif) {
      document.removeEventListener('keydown', clavierActif);
      clavierActif = null;
    }
    overlay.remove();
    document.body.classList.remove('triedre-modal-open');
    resolve(valeur);
  }

  function confirm(options = {}) {
    return new Promise(function (resolve) {
      const ancien = document.getElementById('triedre-modal-overlay');

      if (ancien) {
        ancien.remove();
      }

      if (clavierActif) {
        document.removeEventListener('keydown', clavierActif);
        clavierActif = null;
      }

      const avecAnnuler = options.cancelText !== null;

      const overlay = document.createElement('div');
      overlay.id = 'triedre-modal-overlay';
      overlay.className = 'triedre-modal-overlay';

      const dialogue = document.createElement('div');
      dialogue.className = 'triedre-modal';
      dialogue.setAttribute('role', 'dialog');
      dialogue.setAttribute('aria-modal', 'true');
      dialogue.setAttribute('aria-labelledby', 'triedre-modal-title');

      const eyebrow = document.createElement('p');
      eyebrow.className = 'section-eyebrow';
      eyebrow.textContent = options.eyebrow || 'TRIÈDRE';

      const titre = document.createElement('h2');
      titre.id = 'triedre-modal-title';
      titre.textContent = options.title || 'CONFIRMER L’ACTION';

      const message = document.createElement('p');
      message.className = 'triedre-modal-message';
      message.textContent =
        options.message || 'Veux-tu vraiment continuer ?';

      const actions = document.createElement('div');
      actions.className = 'triedre-modal-actions';

      const annuler = document.createElement('button');
      annuler.type = 'button';
      annuler.className = 'btn btn-secondaire';
      annuler.textContent = options.cancelText || 'Annuler';

      const confirmer = document.createElement('button');
      confirmer.type = 'button';
      confirmer.className = 'btn btn-primary';
      confirmer.textContent = options.confirmText || 'Confirmer';

      if (avecAnnuler) {
        actions.appendChild(annuler);
      }
      actions.appendChild(confirmer);

      dialogue.appendChild(eyebrow);
      dialogue.appendChild(titre);
      dialogue.appendChild(message);
      dialogue.appendChild(actions);
      overlay.appendChild(dialogue);
      document.body.appendChild(overlay);
      document.body.classList.add('triedre-modal-open');

      window.setTimeout(function () {
        confirmer.focus();
      }, 0);

      annuler.addEventListener('click', function () {
        fermerModal(overlay, false, resolve);
      });

      confirmer.addEventListener('click', function () {
        fermerModal(overlay, true, resolve);
      });

      overlay.addEventListener('click', function (event) {
        if (event.target === overlay) {
          fermerModal(overlay, !avecAnnuler, resolve);
        }
      });

      function clavier(event) {
        if (event.key === 'Escape') {
          fermerModal(overlay, !avecAnnuler, resolve);
        }
      }

      clavierActif = clavier;
      document.addEventListener('keydown', clavier);
    });
  }

  function alert(options = {}) {
    return confirm({
      eyebrow: options.eyebrow,
      title: options.title || 'INFORMATION',
      message: options.message || '',
      confirmText: options.confirmText || 'Compris',
      cancelText: null
    });
  }

  window.triedreModal = {
    confirm: confirm,
    alert: alert
  };
})();
