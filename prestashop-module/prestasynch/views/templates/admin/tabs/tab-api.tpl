{*
* Onglet des endpoints API du module PHSy
*}

<div class="panel-heading">
  <i class="icon icon-sitemap"></i> {l s='API Endpoints' mod='prestasynch'}
</div>
<div class="panel-body">
  <div class="alert alert-info">
    <p>
      <i class="icon icon-info-circle"></i> 
      {l s="Les endpoints suivants sont disponibles pour l'intégration avec l'application PHSy." mod='prestasynch'}
    </p>
    <p>
      {l s="Le module expose une API RESTful permettant la récupération des données de votre boutique PrestaShop." mod='prestasynch'}
    </p>
  </div>
  
  <div class="row">
    <div class="col-lg-12">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h4 class="panel-title">
            <i class="icon icon-key"></i> {l s='Authentification' mod='prestasynch'}
          </h4>
        </div>
        <div class="panel-body">
          <p>
            {l s="Pour utiliser l'API, chaque requête doit inclure votre clé API dans l'en-tête HTTP 'X-API-Key'." mod='prestasynch'}
          </p>
          <p>
            <strong>{l s='Exemple:' mod='prestasynch'}</strong>
          </p>
          <pre>X-API-Key: votre_clé_api</pre>
          
          <div class="alert alert-warning">
            <p>
              <i class="icon icon-warning"></i> 
              {l s="Assurez-vous de protéger votre clé API. Ne la partagez pas et ne l'incluez pas dans du code public." mod='prestasynch'}
            </p>
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
            <i class="icon icon-list"></i> {l s='Endpoints disponibles' mod='prestasynch'}
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
                <td><code>/api.php?action=products</code></td>
                <td><span class="label label-primary">GET</span></td>
                <td>{l s='Récupère la liste des produits' mod='prestasynch'}</td>
                <td>-</td>
              </tr>
              <tr>
                <td><code>/api.php?action=attributes</code></td>
                <td><span class="label label-primary">GET</span></td>
                <td>{l s='Récupère la liste des attributs/déclinaisons de produits' mod='prestasynch'}</td>
                <td>-</td>
              </tr>
              <tr>
                <td><code>/api.php?action=product_price_history</code></td>
                <td><span class="label label-primary">GET</span></td>
                <td>{l s='Récupère l\'historique des prix d\'un produit' mod='prestasynch'}</td>
                <td><code>id_product</code> (obligatoire)</td>
              </tr>
              <tr>
                <td><code>/api.php?action=stats</code></td>
                <td><span class="label label-primary">GET</span></td>
                <td>{l s='Récupère les statistiques globales de la boutique' mod='prestasynch'}</td>
                <td>-</td>
              </tr>
              <tr>
                <td><code>/api.php?action=manual_sync</code></td>
                <td><span class="label label-success">POST</span></td>
                <td>{l s='Teste la connexion avec la plateforme PHSy' mod='prestasynch'}</td>
                <td><code>sync_url</code>, <code>api_key</code></td>
              </tr>
              <tr>
                <td><code>/api.php?action=get_logs</code></td>
                <td><span class="label label-primary">GET</span></td>
                <td>{l s='Récupère les logs du module' mod='prestasynch'}</td>
                <td>-</td>
              </tr>
              <tr>
                <td><code>/api.php?action=clear_logs</code></td>
                <td><span class="label label-success">POST</span></td>
                <td>{l s='Efface les logs du module' mod='prestasynch'}</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  
  <div class="row">
    <div class="col-lg-12">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h4 class="panel-title">
            <i class="icon icon-code"></i> {l s='Exemple de réponse' mod='prestasynch'}
          </h4>
        </div>
        <div class="panel-body">
          <div class="tabbable">
            <ul class="nav nav-tabs">
              <li class="active"><a href="#tab-products" data-toggle="tab">{l s='Produits' mod='prestasynch'}</a></li>
              <li><a href="#tab-attributes" data-toggle="tab">{l s='Attributs' mod='prestasynch'}</a></li>
              <li><a href="#tab-price-history" data-toggle="tab">{l s='Historique des prix' mod='prestasynch'}</a></li>
              <li><a href="#tab-stats" data-toggle="tab">{l s='Statistiques' mod='prestasynch'}</a></li>
            </ul>
            <div class="tab-content panel">
              <div class="tab-pane active" id="tab-products">
                <pre><code>{
  "products": [
    {
      "id": 1,
      "name": "Laptop Dell XPS 13",
      "reference": "DELL-XPS13",
      "price": "1299.99",
      "quantity": 15,
      "id_product_attribute": 0
    },
    {
      "id": 2,
      "name": "Smartphone Google Pixel 7",
      "reference": "GP7-128GB",
      "price": "699.99",
      "quantity": 8,
      "id_product_attribute": 0
    }
  ]
}</code></pre>
              </div>
              <div class="tab-pane" id="tab-attributes">
                <pre><code>{
  "attributes": [
    {
      "id_product": 1,
      "id_product_attribute": 1,
      "reference": "DELL-XPS13-8GB",
      "name": "Laptop Dell XPS 13",
      "declinaisons": "(RAM: 8 Go, Stockage: 256 Go)",
      "price": "1199.99",
      "quantity": 5
    },
    {
      "id_product": 1,
      "id_product_attribute": 2,
      "reference": "DELL-XPS13-16GB",
      "name": "Laptop Dell XPS 13",
      "declinaisons": "(RAM: 16 Go, Stockage: 512 Go)",
      "price": "1399.99",
      "quantity": 3
    }
  ]
}</code></pre>
              </div>
              <div class="tab-pane" id="tab-price-history">
                <pre><code>{
  "product": {
    "id": 1,
    "name": "Laptop Dell XPS 13",
    "reference": "DELL-XPS13",
    "current_price": 1299.99,
    "date_add": "2023-09-15 10:30:45",
    "date_upd": "2023-12-05 14:22:10"
  },
  "history": {
    "current": {
      "price": 1299.99,
      "date": "2023-12-05 14:22:10"
    },
    "price_changes": [
      {
        "old_price": 1399.99,
        "new_price": 1299.99,
        "change": -100,
        "percent_change": -7.14,
        "date": "2023-12-05 14:22:10",
        "type": "regular"
      },
      {
        "old_price": 1349.99,
        "new_price": 1399.99,
        "change": 50,
        "percent_change": 3.7,
        "date": "2023-11-02 09:15:30",
        "type": "regular"
      }
    ]
  }
}</code></pre>
              </div>
              <div class="tab-pane" id="tab-stats">
                <pre><code>{
  "stats": {
    "total_customers": 256,
    "total_orders": 1203,
    "total_revenue": "125456.78",
    "total_products": 342,
    "total_categories": 28
  }
}</code></pre>
              </div>
            </div>
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
            <i class="icon icon-wrench"></i> {l s='Outils de test' mod='prestasynch'}
          </h4>
        </div>
        <div class="panel-body">
          <p>{l s='Vous pouvez tester directement les endpoints en cliquant sur les boutons ci-dessous:' mod='prestasynch'}</p>
          
          <div class="btn-toolbar">
            <div class="btn-group">
              <button type="button" class="btn btn-default test-endpoint" data-endpoint="products">
                <i class="icon icon-cubes"></i> {l s='Tester Products' mod='prestasynch'}
              </button>
              <button type="button" class="btn btn-default test-endpoint" data-endpoint="attributes">
                <i class="icon icon-tags"></i> {l s='Tester Attributes' mod='prestasynch'}
              </button>
              <button type="button" class="btn btn-default test-endpoint" data-endpoint="stats">
                <i class="icon icon-bar-chart"></i> {l s='Tester Stats' mod='prestasynch'}
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
          
          <div id="api-test-result" style="margin-top: 15px; display: none;">
            <div class="panel panel-default">
              <div class="panel-heading">
                <h4 class="panel-title">
                  <i class="icon icon-terminal"></i> {l s='Résultat du test' mod='prestasynch'}
                </h4>
              </div>
              <div class="panel-body">
                <pre id="api-response-output" style="max-height: 300px; overflow: auto;"></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script type="text/javascript">
$(document).ready(function() {
  // Fonction pour tester un endpoint API
  function testEndpoint(endpoint, params) {
    var apiUrl = '{$module_url}api.php?action=' + endpoint;
    
    if (params) {
      for (var key in params) {
        apiUrl += '&' + key + '=' + params[key];
      }
    }
    
    $('#api-test-result').show();
    $('#api-response-output').html('{l s="Chargement..." mod="prestasynch"}');
    
    $.ajax({
      url: apiUrl,
      type: 'GET',
      dataType: 'json',
      success: function(response) {
        // Formater la réponse JSON
        var formattedResponse = JSON.stringify(response, null, 2);
        
        // Colorer le JSON
        formattedResponse = formattedResponse
          .replace(/"([^"]+)":/g, '<span class="key">"$1":</span>')
          .replace(/"([^"]+)"/g, '<span class="string">"$1"</span>')
          .replace(/\b(true|false)\b/g, '<span class="boolean">$1</span>')
          .replace(/\b(null)\b/g, '<span class="null">$1</span>')
          .replace(/\b(\d+(\.\d+)?)\b/g, '<span class="number">$1</span>');
        
        $('#api-response-output').html(formattedResponse);
      },
      error: function(xhr, status, error) {
        var errorMessage = '{l s="Erreur lors de la requête API:" mod="prestasynch"} ' + error;
        if (xhr.responseText) {
          try {
            var response = JSON.parse(xhr.responseText);
            if (response.error) {
              errorMessage += '<br>' + response.error;
            }
          } catch (e) {
            errorMessage += '<br>' + xhr.responseText;
          }
        }
        $('#api-response-output').html('<div class="alert alert-danger">' + errorMessage + '</div>');
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