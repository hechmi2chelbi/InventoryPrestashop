{*
* Onglet pour tester les endpoints de l'API
*}

<div class="panel-heading">
  <i class="icon icon-flask"></i> {l s='Tester les endpoints' mod='prestasynch'}
</div>
<div class="panel-body">
  <div class="alert alert-info">
    <p>
      <i class="icon icon-info-circle"></i> 
      {l s='Cette section vous permet de tester les différents endpoints de l\'API pour voir les données retournées.' mod='prestasynch'}
    </p>
    <p>
      {l s='Utile pour vérifier le format des données et leur contenu pour le développement de l\'application PHSy.' mod='prestasynch'}
    </p>
  </div>
  
  <div class="row">
    <div class="col-lg-12">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h4 class="panel-title">
            <i class="icon icon-wrench"></i> {l s='Outils de test' mod='prestasynch'}
          </h4>
        </div>
        <div class="panel-body">
          <p>{l s='Cliquez sur les boutons ci-dessous pour tester les différents endpoints:' mod='prestasynch'}</p>
          
          <div class="btn-toolbar">
            <div class="btn-group">
              <button type="button" class="btn btn-default test-endpoint" data-endpoint="products">
                <i class="icon icon-cubes"></i> {l s='Produits' mod='prestasynch'}
              </button>
              <button type="button" class="btn btn-default test-endpoint" data-endpoint="attributes">
                <i class="icon icon-tags"></i> {l s='Attributs' mod='prestasynch'}
              </button>
              <button type="button" class="btn btn-default test-endpoint" data-endpoint="stats">
                <i class="icon icon-bar-chart"></i> {l s='Statistiques' mod='prestasynch'}
              </button>
            </div>
          </div>
          
          <div class="form-group" style="margin-top: 15px;">
            <label>{l s='Test d\'historique des prix' mod='prestasynch'}</label>
            <div class="input-group">
              <span class="input-group-addon">ID Produit</span>
              <input type="number" class="form-control" id="test-product-id" value="1" min="1">
              <span class="input-group-btn">
                <button class="btn btn-default test-price-history" type="button">
                  <i class="icon icon-history"></i> {l s='Tester' mod='prestasynch'}
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div id="api-test-result" style="display: none;">
        <div class="panel panel-default">
          <div class="panel-heading">
            <h4 class="panel-title">
              <i class="icon icon-code"></i> {l s='Résultat du test' mod='prestasynch'}
            </h4>
          </div>
          <div class="panel-body">
            <pre id="api-response-output" style="max-height: 500px; overflow: auto;"></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="row">
    <div class="col-lg-12">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h4 class="panel-title">
            <i class="icon icon-list"></i> {l s='Liste des endpoints disponibles' mod='prestasynch'}
          </h4>
        </div>
        <div class="panel-body">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>{l s='Endpoint' mod='prestasynch'}</th>
                <th>{l s='Méthode' mod='prestasynch'}</th>
                <th>{l s='Description' mod='prestasynch'}</th>
                <th>{l s='Paramètres' mod='prestasynch'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>/api.php</code></td>
                <td><span class="badge badge-info">POST</span></td>
                <td>{l s='Récupère la liste des produits de la boutique' mod='prestasynch'}</td>
                <td><code>action=products</code></td>
              </tr>
              <tr>
                <td><code>/api.php</code></td>
                <td><span class="badge badge-info">POST</span></td>
                <td>{l s='Récupère la liste des attributs/déclinaisons de produits' mod='prestasynch'}</td>
                <td><code>action=attributes</code></td>
              </tr>
              <tr>
                <td><code>/api.php</code></td>
                <td><span class="badge badge-info">POST</span></td>
                <td>{l s='Récupère l\'historique des prix d\'un produit' mod='prestasynch'}</td>
                <td><code>action=product_price_history</code>, <code>id_product</code> (requis)</td>
              </tr>
              <tr>
                <td><code>/api.php</code></td>
                <td><span class="badge badge-info">POST</span></td>
                <td>{l s='Récupère les statistiques générales de la boutique' mod='prestasynch'}</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>

<script type="text/javascript">
$(document).ready(function() {
  // Fonction pour tester un endpoint d'API
  function testEndpoint(endpoint, params) {
    var apiUrl = '{$module_url}api.php';
    var postData = { action: endpoint };
    
    if (params) {
      for (var key in params) {
        postData[key] = params[key];
      }
    }
    
    $('#api-test-result').show();
    $('#api-response-output').html('{l s="Chargement en cours..." mod="prestasynch"}');
    
    $.ajax({
      url: apiUrl,
      type: 'POST',
      data: postData,
      dataType: 'json',
      success: function(response) {
        var formattedResponse = JSON.stringify(response, null, 2);
        $('#api-response-output').html(formattedResponse);
      },
      error: function(xhr, status, error) {
        var errorMessage = '{l s="Erreur lors de la requête API:" mod="prestasynch"} ' + error;
        if (xhr.responseText) {
          try {
            var response = JSON.parse(xhr.responseText);
            if (response.error) {
              errorMessage += '\n' + response.error;
            }
          } catch (e) {
            errorMessage += '\n' + xhr.responseText;
          }
        }
        $('#api-response-output').html(errorMessage);
      }
    });
  }
  
  // Test des endpoints
  $('.test-endpoint').click(function() {
    var endpoint = $(this).data('endpoint');
    testEndpoint(endpoint);
  });
  
  // Test de l'historique des prix
  $('.test-price-history').click(function() {
    var productId = $('#test-product-id').val();
    if (productId) {
      testEndpoint('product_price_history', { id_product: productId });
    } else {
      alert('{l s="Veuillez entrer un ID de produit valide" mod="prestasynch"}');
    }
  });
});
</script>