{*
* Onglet des logs du module PHSy
*}

<div class="panel-heading">
  <i class="icon icon-list-alt"></i> {l s='Logs du module' mod='prestasynch'}
</div>
<div class="panel-body">
  <div class="alert alert-info">
    <p>
      <i class="icon icon-info-circle"></i> 
      {l s='Cette page affiche les logs d\'activité du module PHSy, vous permettant de suivre les opérations et de diagnostiquer les problèmes.' mod='prestasynch'}
    </p>
  </div>
  
  <div class="form-group">
    <div class="btn-toolbar">
      <div class="btn-group">
        <button id="refresh_logs_btn" class="btn btn-default">
          <i class="icon icon-refresh"></i> {l s='Actualiser' mod='prestasynch'}
        </button>
        <button id="clear_logs_btn" class="btn btn-danger">
          <i class="icon icon-trash"></i> {l s='Effacer les logs' mod='prestasynch'}
        </button>
      </div>
      
      <div class="btn-group pull-right">
        <button id="download_logs_btn" class="btn btn-info">
          <i class="icon icon-download"></i> {l s='Télécharger les logs' mod='prestasynch'}
        </button>
      </div>
    </div>
  </div>
  
  <div class="row">
    <div class="col-lg-12">
      <div class="panel panel-default">
        <div class="panel-heading">
          <ul class="nav nav-pills log-filters">
            <li class="active"><a href="#" data-filter="all">{l s='Tous' mod='prestasynch'}</a></li>
            <li><a href="#" data-filter="info">{l s='Info' mod='prestasynch'}</a></li>
            <li><a href="#" data-filter="success">{l s='Succès' mod='prestasynch'}</a></li>
            <li><a href="#" data-filter="warning">{l s='Avertissements' mod='prestasynch'}</a></li>
            <li><a href="#" data-filter="error">{l s='Erreurs' mod='prestasynch'}</a></li>
            <li class="pull-right">
              <div class="input-group input-group-sm">
                <input type="text" id="log_search" class="form-control" placeholder="{l s='Rechercher...' mod='prestasynch'}">
                <span class="input-group-btn">
                  <button class="btn btn-default" type="button" id="clear_search">
                    <i class="icon icon-times"></i>
                  </button>
                </span>
              </div>
            </li>
          </ul>
        </div>
        <div class="panel-body">
          <div class="log-container" style="background-color: #f5f5f5; border: 1px solid #ddd; padding: 10px; border-radius: 3px; max-height: 500px; overflow-y: auto; font-family: monospace; font-size: 12px;">
            <pre id="module_logs">{$module_logs|escape:'html':'UTF-8'}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="row">
    <div class="col-md-6">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h4 class="panel-title">
            <i class="icon icon-bar-chart"></i> {l s='Résumé des logs' mod='prestasynch'}
          </h4>
        </div>
        <div class="panel-body">
          <table class="table table-bordered">
            <tr>
              <th>{l s='Type de log' mod='prestasynch'}</th>
              <th>{l s='Nombre' mod='prestasynch'}</th>
            </tr>
            <tr>
              <td><span class="label label-info">{l s='Info' mod='prestasynch'}</span></td>
              <td id="log-count-info">-</td>
            </tr>
            <tr>
              <td><span class="label label-success">{l s='Succès' mod='prestasynch'}</span></td>
              <td id="log-count-success">-</td>
            </tr>
            <tr>
              <td><span class="label label-warning">{l s='Avertissement' mod='prestasynch'}</span></td>
              <td id="log-count-warning">-</td>
            </tr>
            <tr>
              <td><span class="label label-danger">{l s='Erreur' mod='prestasynch'}</span></td>
              <td id="log-count-error">-</td>
            </tr>
            <tr>
              <td><strong>{l s='Total' mod='prestasynch'}</strong></td>
              <td id="log-count-total">-</td>
            </tr>
          </table>
        </div>
      </div>
    </div>
    
    <div class="col-md-6">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h4 class="panel-title">
            <i class="icon icon-wrench"></i> {l s='Configuration des logs' mod='prestasynch'}
          </h4>
        </div>
        <div class="panel-body">
          <form class="form-horizontal">
            <div class="form-group">
              <label class="col-sm-6 control-label">{l s='Niveau de log:' mod='prestasynch'}</label>
              <div class="col-sm-6">
                <select class="form-control" id="log_level">
                  <option value="all">{l s='Tous' mod='prestasynch'}</option>
                  <option value="info">{l s='Info et plus' mod='prestasynch'}</option>
                  <option value="warning">{l s='Avertissements et erreurs' mod='prestasynch'}</option>
                  <option value="error">{l s='Erreurs uniquement' mod='prestasynch'}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="col-sm-6 control-label">{l s='Rotation automatique des logs:' mod='prestasynch'}</label>
              <div class="col-sm-6">
                <div class="switch prestashop-switch fixed-width-lg">
                  <input type="radio" name="log_rotation" id="log_rotation_on" value="1" checked>
                  <label for="log_rotation_on">{l s='Oui' mod='prestasynch'}</label>
                  <input type="radio" name="log_rotation" id="log_rotation_off" value="0">
                  <label for="log_rotation_off">{l s='Non' mod='prestasynch'}</label>
                  <a class="slide-button btn"></a>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label class="col-sm-6 control-label">{l s='Taille maximale du fichier log:' mod='prestasynch'}</label>
              <div class="col-sm-6">
                <div class="input-group">
                  <input type="number" class="form-control" id="log_file_size" value="1" min="0.1" max="10" step="0.1">
                  <span class="input-group-addon">MB</span>
                </div>
              </div>
            </div>
            <div class="form-group">
              <div class="col-sm-12 text-right">
                <button type="button" class="btn btn-primary" id="save_log_settings">
                  <i class="icon icon-save"></i> {l s='Enregistrer' mod='prestasynch'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>

<script type="text/javascript">
$(document).ready(function() {
  // Variables
  var logContent = $('#module_logs').text();
  
  // Fonction pour formater les logs avec coloration
  function formatLogs() {
    if (!$('#module_logs').length || !$('#module_logs').text().trim()) {
      return;
    }
    
    var logText = $('#module_logs').text();
    var formattedHtml = logText
      .replace(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/g, '<span class="log-timestamp">[$1]</span>')
      .replace(/\[(api|hook|sync|stock|system)\]/gi, '<span class="log-category">[$1]</span>')
      .replace(/\[info\]/gi, '<span class="log-level log-info">[INFO]</span>')
      .replace(/\[success\]/gi, '<span class="log-level log-success">[SUCCESS]</span>')
      .replace(/\[warning\]/gi, '<span class="log-level log-warning">[WARNING]</span>')
      .replace(/\[error\]/gi, '<span class="log-level log-error">[ERROR]</span>');
    
    $('#module_logs').html(formattedHtml);
  }
  
  // Rafraîchissement des logs
  $('#refresh_logs_btn').click(function() {
    $.ajax({
      url: '{$module_url}api.php?action=get_logs',
      type: 'GET',
      dataType: 'json',
      success: function(response) {
        if (response && response.logs) {
          $('#module_logs').html(response.logs);
          formatLogs();
          updateLogStats();
        }
      }
    });
  });
  
  // Effacer les logs
  $('#clear_logs_btn').click(function() {
    if (confirm('{l s="Êtes-vous sûr de vouloir effacer tous les logs du module ?" mod="prestasynch"}')) {
      $.ajax({
        url: '{$module_url}api.php?action=clear_logs',
        type: 'POST',
        dataType: 'json',
        success: function(response) {
          if (response && response.success) {
            $('#module_logs').html('');
            updateLogStats();
          }
        }
      });
    }
  });
  
  // Télécharger les logs
  $('#download_logs_btn').click(function() {
    var logText = $('#module_logs').text();
    var blob = new Blob([logText], { type: 'text/plain' });
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'phsy_logs_' + formatDate(new Date()) + '.txt';
    link.click();
  });
  
  // Filtres de logs
  $('.log-filters a').click(function(e) {
    e.preventDefault();
    
    // Mettre à jour l'élément actif
    $('.log-filters li').removeClass('active');
    $(this).parent().addClass('active');
    
    var filter = $(this).data('filter');
    if (filter === 'all') {
      $('.log-container pre span').parent().show();
    } else {
      $('.log-container pre span').parent().hide();
      $('.log-container pre .log-' + filter).parent().show();
    }
  });
  
  // Recherche dans les logs
  $('#log_search').on('keyup', function() {
    var searchText = $(this).val().toLowerCase();
    
    if (searchText.length > 0) {
      $('.log-container pre').contents().each(function() {
        var line = $(this).text().toLowerCase();
        if (line.indexOf(searchText) > -1) {
          $(this).show();
        } else {
          $(this).hide();
        }
      });
    } else {
      $('.log-container pre').contents().show();
      
      // Réappliquer le filtre actif
      var activeFilter = $('.log-filters li.active a').data('filter');
      if (activeFilter !== 'all') {
        $('.log-container pre').contents().hide();
        $('.log-container pre .log-' + activeFilter).parent().show();
      }
    }
  });
  
  // Effacer la recherche
  $('#clear_search').click(function() {
    $('#log_search').val('');
    $('.log-container pre').contents().show();
    
    // Réappliquer le filtre actif
    var activeFilter = $('.log-filters li.active a').data('filter');
    if (activeFilter !== 'all') {
      $('.log-container pre').contents().hide();
      $('.log-container pre .log-' + activeFilter).parent().show();
    }
  });
  
  // Enregistrer les paramètres de log
  $('#save_log_settings').click(function() {
    var logLevel = $('#log_level').val();
    var logRotation = $('input[name="log_rotation"]:checked').val();
    var logFileSize = $('#log_file_size').val();
    
    $.ajax({
      url: '{$current_index}&configure={$module_name}&token={$token}&ajax=1&action=saveLogSettings',
      type: 'POST',
      data: {
        log_level: logLevel,
        log_rotation: logRotation,
        log_file_size: logFileSize
      },
      dataType: 'json',
      success: function(response) {
        if (response && response.success) {
          alert('{l s="Paramètres de log enregistrés avec succès" mod="prestasynch"}');
        } else {
          alert('{l s="Erreur lors de l\'enregistrement des paramètres de log" mod="prestasynch"}');
        }
      }
    });
  });
  
  // Fonction pour mettre à jour les statistiques de logs
  function updateLogStats() {
    var logText = $('#module_logs').text();
    
    // Compter les différents types de logs
    var infoCount = (logText.match(/\[info\]/gi) || []).length;
    var successCount = (logText.match(/\[success\]/gi) || []).length;
    var warningCount = (logText.match(/\[warning\]/gi) || []).length;
    var errorCount = (logText.match(/\[error\]/gi) || []).length;
    var totalCount = infoCount + successCount + warningCount + errorCount;
    
    // Mettre à jour les compteurs
    $('#log-count-info').text(infoCount);
    $('#log-count-success').text(successCount);
    $('#log-count-warning').text(warningCount);
    $('#log-count-error').text(errorCount);
    $('#log-count-total').text(totalCount);
  }
  
  // Fonction pour formater la date
  function formatDate(date) {
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    var hours = ('0' + date.getHours()).slice(-2);
    var minutes = ('0' + date.getMinutes()).slice(-2);
    var seconds = ('0' + date.getSeconds()).slice(-2);
    
    return year + '-' + month + '-' + day + '_' + hours + '-' + minutes + '-' + seconds;
  }
  
  // Initialiser la page
  formatLogs();
  updateLogStats();
});
</script>

<style>
/* Styles pour les logs */
.log-container {
  line-height: 1.5;
}

.log-timestamp {
  color: #666;
  font-weight: bold;
}

.log-category {
  color: #5b9bd5;
  font-weight: bold;
}

.log-level {
  font-weight: bold;
}

.log-info {
  color: #31708f;
}

.log-success {
  color: #3c763d;
}

.log-warning {
  color: #8a6d3b;
}

.log-error {
  color: #a94442;
}

/* Styles pour les filtres */
.log-filters {
  margin-bottom: 0;
}

.log-filters .input-group {
  width: 200px;
}
</style>