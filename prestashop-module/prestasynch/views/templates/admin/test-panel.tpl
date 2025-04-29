{*
* Module de test pour PrestaSynch
*}

<div class="panel" id="panel-test-phsy" style="margin: 0 auto; width: 50%;">
  <div class="panel-heading">
    <i class="icon icon-bug"></i> Panneau de test PHSy
  </div>
  <div class="panel-body">
    <div class="row">
      <div class="col-lg-12">
        <div class="panel">
          <div class="panel-heading" style="background-color: #4B99D0; color: white;">
            <h4>Endpoints disponibles</h4>
          </div>
          <div class="panel-body">
            <table class="table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Méthode</th>
                  <th>URL</th>
                  <th>Test</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Ping (Test de connexion)</td>
                  <td>GET</td>
                  <td><code>{$module_url}api.php?action=ping</code></td>
                  <td><a href="{$module_url}api.php?action=ping" target="_blank" class="btn btn-default btn-xs">Tester</a></td>
                </tr>
                <tr>
                  <td>Liste des produits</td>
                  <td>GET</td>
                  <td><code>{$module_url}api.php?action=products</code></td>
                  <td><a href="{$module_url}api.php?action=products" target="_blank" class="btn btn-default btn-xs">Tester</a></td>
                </tr>
                <tr>
                  <td>Attributs des produits</td>
                  <td>GET</td>
                  <td><code>{$module_url}api.php?action=attributes</code></td>
                  <td><a href="{$module_url}api.php?action=attributes" target="_blank" class="btn btn-default btn-xs">Tester</a></td>
                </tr>
                <tr>
                  <td>Statistiques</td>
                  <td>GET</td>
                  <td><code>{$module_url}api.php?action=stats</code></td>
                  <td><a href="{$module_url}api.php?action=stats" target="_blank" class="btn btn-default btn-xs">Tester</a></td>
                </tr>
                <tr>
                  <td>Historique des prix</td>
                  <td>GET</td>
                  <td><code>{$module_url}api.php?action=price_history&id=ID_PRODUIT</code></td>
                  <td>
                    <div class="input-group">
                      <input type="text" id="product_id_test" class="form-control input-xs" placeholder="ID produit">
                      <span class="input-group-btn">
                        <button class="btn btn-default btn-xs" onclick="testPriceHistory()">Tester</button>
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-lg-12">
        <div class="panel">
          <div class="panel-heading" style="background-color: #5E6977; color: white;">
            <h4>Synchronisation manuelle</h4>
          </div>
          <div class="panel-body">
            <div class="alert alert-info">
              <p><i class="icon icon-info"></i> La synchronisation manuelle permet de tester la connexion avec l'application PHSy.</p>
            </div>
            <div class="form-group">
              <label for="sync_url">URL de l'application PHSy :</label>
              <input type="text" id="sync_url" class="form-control" value="{$phsy_url|escape:'html':'UTF-8'}" placeholder="https://votre-application-phsy.com">
            </div>
            <div class="form-group">
              <label for="api_key">Clé API :</label>
              <input type="text" id="api_key" class="form-control" value="{$api_key|escape:'html':'UTF-8'}" placeholder="Votre clé API">
            </div>
            <button id="test_sync_btn" class="btn btn-primary">
              <i class="icon icon-refresh"></i> Tester la synchronisation
            </button>
            <div id="sync_result" class="margin-top-1"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-lg-12">
        <div class="panel">
          <div class="panel-heading" style="background-color: #363A41; color: white;">
            <h4>Logs du module</h4>
          </div>
          <div class="panel-body">
            <div class="form-group">
              <button id="refresh_logs_btn" class="btn btn-default">
                <i class="icon icon-refresh"></i> Actualiser les logs
              </button>
              <button id="clear_logs_btn" class="btn btn-danger">
                <i class="icon icon-trash"></i> Effacer les logs
              </button>
            </div>
            <div class="logs-container" style="padding: 10px; background-color: #F5F5F5; max-height: 300px; overflow-y: auto; font-family: monospace; font-size: 12px; border: 1px solid #DDD; border-radius: 3px;">
              <pre id="module_logs">{$module_logs|escape:'html':'UTF-8'}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script type="text/javascript">
$(document).ready(function() {
  // Test de synchronisation
  $('#test_sync_btn').click(function() {
    var url = $('#sync_url').val();
    var apiKey = $('#api_key').val();
    var resultDiv = $('#sync_result');
    
    resultDiv.html('<div class="alert alert-info">Synchronisation en cours...</div>');
    
    $.ajax({
      url: '{$module_url}api.php?action=manual_sync',
      type: 'POST',
      data: {
        sync_url: url,
        api_key: apiKey
      },
      dataType: 'json',
      success: function(response) {
        if (response.success) {
          resultDiv.html('<div class="alert alert-success">' + response.message + '</div>');
        } else {
          resultDiv.html('<div class="alert alert-danger">' + response.message + '</div>');
        }
      },
      error: function(xhr, status, error) {
        resultDiv.html('<div class="alert alert-danger">Erreur : ' + error + '</div>');
      }
    });
  });
  
  // Rafraîchissement des logs
  $('#refresh_logs_btn').click(function() {
    $.ajax({
      url: '{$module_url}api.php?action=get_logs',
      type: 'GET',
      dataType: 'json',
      success: function(response) {
        $('#module_logs').html(response.logs);
      }
    });
  });
  
  // Nettoyage des logs
  $('#clear_logs_btn').click(function() {
    if (confirm('Êtes-vous sûr de vouloir effacer tous les logs?')) {
      $.ajax({
        url: '{$module_url}api.php?action=clear_logs',
        type: 'POST',
        dataType: 'json',
        success: function(response) {
          if (response.success) {
            $('#module_logs').html('');
            alert('Logs effacés avec succès');
          }
        }
      });
    }
  });
});

function testPriceHistory() {
  var productId = $('#product_id_test').val();
  if (!productId || isNaN(parseInt(productId))) {
    alert('Veuillez entrer un ID de produit valide');
    return;
  }
  window.open('{$module_url}api.php?action=price_history&id=' + productId, '_blank');
}
</script>

<script type="text/javascript">
$(document).ready(function() {
  // Test de synchronisation
  $('#test_sync_btn').click(function() {
    var url = $('#sync_url').val();
    var apiKey = $('#api_key').val();
    var resultDiv = $('#sync_result');
    
    resultDiv.html('<div class="alert alert-info">Synchronisation en cours...</div>');
    
    $.ajax({
      url: '{$module_url}api.php?action=manual_sync',
      type: 'POST',
      data: {
        sync_url: url,
        api_key: apiKey
      },
      dataType: 'json',
      success: function(response) {
        if (response.success) {
          resultDiv.html('<div class="alert alert-success">' + response.message + '</div>');
        } else {
          resultDiv.html('<div class="alert alert-danger">' + response.message + '</div>');
        }
      },
      error: function(xhr, status, error) {
        resultDiv.html('<div class="alert alert-danger">Erreur : ' + error + '</div>');
      }
    });
  });
  
  // Rafraîchissement des logs
  $('#refresh_logs_btn').click(function() {
    $.ajax({
      url: '{$module_url}api.php?action=get_logs',
      type: 'GET',
      dataType: 'json',
      success: function(response) {
        $('#module_logs').html(response.logs);
      }
    });
  });
  
  // Nettoyage des logs
  $('#clear_logs_btn').click(function() {
    if (confirm('Êtes-vous sûr de vouloir effacer tous les logs?')) {
      $.ajax({
        url: '{$module_url}api.php?action=clear_logs',
        type: 'POST',
        dataType: 'json',
        success: function(response) {
          if (response.success) {
            $('#module_logs').html('');
            alert('Logs effacés avec succès');
          }
        }
      });
    }
  });
});

function testPriceHistory() {
  var productId = $('#product_id_test').val();
  if (!productId || isNaN(parseInt(productId))) {
    alert('Veuillez entrer un ID de produit valide');
    return;
  }
  window.open('{$module_url}api.php?action=price_history&id=' + productId, '_blank');
}
</script>