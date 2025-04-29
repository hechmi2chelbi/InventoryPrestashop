{*
* Onglet de configuration API du module PHSy
*}

<div class="panel-heading">
  <i class="icon icon-key"></i> {l s='Configuration API' mod='prestasynch'}
</div>
<div class="panel-body">
  <div class="alert alert-info">
    <p>
      <i class="icon icon-info-circle"></i> 
      {l s='Entrez ici la clé API fournie par l\'application PHSy pour connecter votre boutique.' mod='prestasynch'}
    </p>
    <p>
      {l s='Cette clé est générée depuis votre compte PHSy et permet une communication sécurisée entre votre boutique et la plateforme.' mod='prestasynch'}
    </p>
  </div>
  
  <div class="form-horizontal">
    <form method="post" action="{$current_index|escape:'html':'UTF-8'}&amp;token={$token|escape:'html':'UTF-8'}&amp;configure=prestasynch">
      <div class="form-group">
        <label class="control-label col-lg-3">
          {l s='Clé API PHSy:' mod='prestasynch'}
        </label>
        <div class="col-lg-6">
          <div class="input-group">
            <span class="input-group-addon"><i class="icon icon-key"></i></span>
            <input type="text" name="PRESTASYNCH_API_KEY" class="form-control" value="{$api_key|escape:'html':'UTF-8'}" placeholder="{l s='Collez ici la clé API fournie par PHSy' mod='prestasynch'}">
          </div>
          <p class="help-block">{l s='Entrez la clé API que vous obtenez depuis votre tableau de bord PHSy.' mod='prestasynch'}</p>
        </div>
      </div>
      
      <div class="form-group">
        <div class="col-lg-9 col-lg-offset-3">
          <button type="submit" name="submitprestasynch" class="btn btn-primary">
            <i class="icon icon-save"></i> {l s='Enregistrer la clé API' mod='prestasynch'}
          </button>
        </div>
      </div>
    </form>
  </div>
  
  {if $api_key}
  <div class="alert alert-success">
    <i class="icon icon-check"></i> {l s='Votre boutique est configurée pour communiquer avec PHSy.' mod='prestasynch'}
  </div>
  
  <div class="panel panel-default">
    <div class="panel-heading">
      <h4 class="panel-title">{l s='Informations de connexion' mod='prestasynch'}</h4>
    </div>
    <div class="panel-body">
      <table class="table">
        <tr>
          <th>{l s='URL de votre API:' mod='prestasynch'}</th>
          <td><code>{$module_url}api.php</code></td>
        </tr>
        <tr>
          <th>{l s='Statut:' mod='prestasynch'}</th>
          <td>
            <span class="badge badge-success">{l s='Prêt à être utilisé' mod='prestasynch'}</span>
          </td>
        </tr>
      </table>
    </div>
  </div>
  {else}
  <div class="alert alert-warning">
    <i class="icon icon-warning"></i> {l s='Aucune clé API n\'est configurée. Veuillez entrer une clé API pour connecter votre boutique à PHSy.' mod='prestasynch'}
  </div>
  {/if}
</div>

<script type="text/javascript">
$(document).ready(function() {
  // Test de connexion
  $('#test_sync_btn').click(function() {
    var url = $('#sync_url').val();
    var apiKey = $('#sync_api_key').val();
    var resultDiv = $('#sync_result');
    
    if (!url || !apiKey) {
      resultDiv.html('<div class="alert alert-warning"><i class="icon icon-warning"></i> {l s="Veuillez remplir l\'URL et la clé API" mod="prestasynch"}</div>');
      return;
    }
    
    // Afficher un indicateur de chargement
    resultDiv.html('<div class="alert alert-info"><i class="icon icon-refresh icon-spin"></i> {l s="Test de connexion en cours..." mod="prestasynch"}</div>');
    
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
          resultDiv.html('<div class="alert alert-success"><i class="icon icon-check"></i> ' + response.message + '</div>');
          
          // Mettre à jour le statut de synchronisation
          $('#sync_status').html('<span class="badge badge-success">{l s="Connecté" mod="prestasynch"}</span>');
          $('#last_sync_date').text(new Date().toLocaleString());
        } else {
          resultDiv.html('<div class="alert alert-danger"><i class="icon icon-warning"></i> ' + response.message + '</div>');
          $('#sync_status').html('<span class="badge badge-danger">{l s="Déconnecté" mod="prestasynch"}</span>');
        }
      },
      error: function(xhr, status, error) {
        resultDiv.html('<div class="alert alert-danger"><i class="icon icon-warning"></i> {l s="Erreur lors du test de connexion:" mod="prestasynch"} ' + error + '</div>');
        $('#sync_status').html('<span class="badge badge-danger">{l s="Erreur" mod="prestasynch"}</span>');
      }
    });
  });
  
  // Générer une nouvelle clé API
  $('#generate_api_key').click(function() {
    var length = 32;
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var result = '';
    for (var i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    $('#sync_api_key').val(result);
  });
  
  // Enregistrer les paramètres
  $('#save_sync_settings').click(function() {
    var url = $('#sync_url').val();
    var apiKey = $('#sync_api_key').val();
    var resultDiv = $('#sync_result');
    
    if (!url || !apiKey) {
      resultDiv.html('<div class="alert alert-warning"><i class="icon icon-warning"></i> {l s="Veuillez remplir l\'URL et la clé API" mod="prestasynch"}</div>');
      return;
    }
    
    // Afficher un indicateur de chargement
    resultDiv.html('<div class="alert alert-info"><i class="icon icon-refresh icon-spin"></i> {l s="Enregistrement des paramètres..." mod="prestasynch"}</div>');
    
    $.ajax({
      url: '{$current_index}&configure={$module_name}&token={$token}&ajax=1&action=saveSync',
      type: 'POST',
      data: {
        sync_url: url,
        api_key: apiKey
      },
      dataType: 'json',
      success: function(response) {
        if (response.success) {
          resultDiv.html('<div class="alert alert-success"><i class="icon icon-check"></i> ' + response.message + '</div>');
        } else {
          resultDiv.html('<div class="alert alert-danger"><i class="icon icon-warning"></i> ' + response.message + '</div>');
        }
      },
      error: function(xhr, status, error) {
        resultDiv.html('<div class="alert alert-danger"><i class="icon icon-warning"></i> {l s="Erreur lors de l\'enregistrement:" mod="prestasynch"} ' + error + '</div>');
      }
    });
  });
  
  // Synchroniser les produits
  $('#sync_products_btn').click(function() {
    var resultDiv = $('#sync_result');
    resultDiv.html('<div class="alert alert-info"><i class="icon icon-refresh icon-spin"></i> {l s="Synchronisation des produits en cours..." mod="prestasynch"}</div>');
    
    $.ajax({
      url: '{$module_url}api.php?action=products',
      type: 'GET',
      dataType: 'json',
      success: function(response) {
        if (response && response.products) {
          resultDiv.html('<div class="alert alert-success"><i class="icon icon-check"></i> {l s="Synchronisation réussie. Nombre de produits:" mod="prestasynch"} ' + response.products.length + '</div>');
          $('#last_sync_date').text(new Date().toLocaleString());
        } else {
          resultDiv.html('<div class="alert alert-warning"><i class="icon icon-warning"></i> {l s="Aucun produit trouvé ou format de réponse incorrect" mod="prestasynch"}</div>');
        }
      },
      error: function(xhr, status, error) {
        resultDiv.html('<div class="alert alert-danger"><i class="icon icon-warning"></i> {l s="Erreur lors de la synchronisation des produits:" mod="prestasynch"} ' + error + '</div>');
      }
    });
  });
  
  // Synchroniser les attributs
  $('#sync_attributes_btn').click(function() {
    var resultDiv = $('#sync_result');
    resultDiv.html('<div class="alert alert-info"><i class="icon icon-refresh icon-spin"></i> {l s="Synchronisation des attributs en cours..." mod="prestasynch"}</div>');
    
    $.ajax({
      url: '{$module_url}api.php?action=attributes',
      type: 'GET',
      dataType: 'json',
      success: function(response) {
        if (response && response.attributes) {
          resultDiv.html('<div class="alert alert-success"><i class="icon icon-check"></i> {l s="Synchronisation réussie. Nombre d\'attributs:" mod="prestasynch"} ' + response.attributes.length + '</div>');
          $('#last_sync_date').text(new Date().toLocaleString());
        } else {
          resultDiv.html('<div class="alert alert-warning"><i class="icon icon-warning"></i> {l s="Aucun attribut trouvé ou format de réponse incorrect" mod="prestasynch"}</div>');
        }
      },
      error: function(xhr, status, error) {
        resultDiv.html('<div class="alert alert-danger"><i class="icon icon-warning"></i> {l s="Erreur lors de la synchronisation des attributs:" mod="prestasynch"} ' + error + '</div>');
      }
    });
  });
});
</script>