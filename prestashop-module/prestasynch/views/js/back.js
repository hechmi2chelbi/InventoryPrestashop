/**
 * Script JavaScript pour le back-office du module PHSy
 */

// Fonctions utilitaires
const PHSy = {
  /**
   * Affiche une notification
   * @param {string} message - Message à afficher
   * @param {string} type - Type de notification (success, error, warning, info)
   */
  showNotification: function(message, type = 'info') {
    // Si on est dans le contexte PrestaShop
    if (typeof showSuccessMessage !== 'undefined' && typeof showErrorMessage !== 'undefined') {
      if (type === 'success') {
        showSuccessMessage(message);
      } else if (type === 'error') {
        showErrorMessage(message);
      } else {
        // Fallback pour les autres types
        alert(message);
      }
    } else {
      // Fallback si le contexte PrestaShop n'est pas disponible
      alert(message);
    }
  },
  
  /**
   * Formate le JSON pour l'affichage
   * @param {object} json - Objet JSON à formater
   * @returns {string} JSON formaté avec syntaxe colorée
   */
  formatJson: function(json) {
    if (typeof json !== 'string') {
      json = JSON.stringify(json, undefined, 2);
    }
    
    // Colorer la syntaxe
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
      let cls = 'number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'key';
        } else {
          cls = 'string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'boolean';
      } else if (/null/.test(match)) {
        cls = 'null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  },
  
  /**
   * Exécute une requête AJAX
   * @param {string} url - URL de la requête
   * @param {string} method - Méthode HTTP (GET, POST, etc.)
   * @param {object} data - Données à envoyer
   * @param {function} callback - Fonction de rappel en cas de succès
   * @param {function} errorCallback - Fonction de rappel en cas d'erreur
   */
  ajax: function(url, method, data, callback, errorCallback) {
    $.ajax({
      url: url,
      type: method,
      data: data,
      dataType: 'json',
      success: function(response) {
        if (typeof callback === 'function') {
          callback(response);
        }
      },
      error: function(xhr, status, error) {
        if (typeof errorCallback === 'function') {
          errorCallback(xhr, status, error);
        } else {
          PHSy.showNotification('Erreur: ' + error, 'error');
        }
      }
    });
  },
  
  /**
   * Génère une chaîne aléatoire (pour les clés API)
   * @param {number} length - Longueur de la chaîne
   * @returns {string} Chaîne aléatoire
   */
  generateRandomString: function(length = 32) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
};

// Initialisation au chargement de la page
$(document).ready(function() {
  // Initialisation des tooltips
  if (typeof $().tooltip === 'function') {
    $('.tooltip-phsy').tooltip();
  }
  
  // Initialisation des popovers
  if (typeof $().popover === 'function') {
    $('.popover-phsy').popover();
  }
  
  // Gestion des onglets
  $('.phsy-tabs a').on('click', function(e) {
    e.preventDefault();
    $(this).tab('show');
  });
  
  // Gestion du hash pour les onglets
  let hash = window.location.hash;
  if (hash) {
    $('.phsy-tabs a[href="' + hash + '"]').tab('show');
  }
  
  $('.phsy-tabs a').on('shown.bs.tab', function(e) {
    window.location.hash = e.target.hash;
  });
});