{*
* Onglet pour la configuration de la Clé API
*}

<div class="panel-heading">
  <i class="icon icon-key"></i> {l s='Clé API' mod='prestasynch'}
</div>
<div class="panel-body">
  <div class="alert alert-info">
    <p>
      <i class="icon icon-info-circle"></i> 
      {l s='Pour connecter votre boutique à la plateforme PHSy, entrez ci-dessous la clé API fournie par PHSy.' mod='prestasynch'}
    </p>
    <p>
      {l s='Cette clé API est générée pour votre site dans votre compte PHSy et permet l\'authentification de votre boutique.' mod='prestasynch'}
    </p>
  </div>
  
  <div class="api-key-container" style="margin: 30px 0;">
    <form method="post" action="{$current_index|escape:'html':'UTF-8'}&amp;token={$token|escape:'html':'UTF-8'}&amp;configure=prestasynch">
      <div class="row">
        <div class="col-xs-12">
          <div class="input-group" style="margin-bottom: 15px;">
            <span class="input-group-addon"><i class="icon icon-key"></i></span>
            <input type="text" name="PRESTASYNCH_API_KEY" class="form-control" value="{$api_key|escape:'html':'UTF-8'}" placeholder="{l s='Entrez votre clé API PHSy' mod='prestasynch'}">
          </div>
          <p class="help-block">{l s='Collez ici la clé API que vous avez générée dans votre compte PHSy.' mod='prestasynch'}</p>
        </div>
      </div>
      
      <div class="row">
        <div class="col-xs-12 text-center" style="margin-top: 15px;">
          <button type="submit" name="submitprestasynch" class="btn btn-primary btn-lg">
            <i class="icon icon-save"></i> {l s='Enregistrer' mod='prestasynch'}
          </button>
        </div>
      </div>
    </form>
  </div>
  
  {if $api_key}
    <div class="alert alert-success">
      <i class="icon icon-check"></i> {l s='Votre boutique est configurée avec une clé API PHSy.' mod='prestasynch'}
    </div>
    
    <div class="panel panel-default">
      <div class="panel-heading">
        <h4 class="panel-title">{l s='Informations de connexion' mod='prestasynch'}</h4>
      </div>
      <div class="panel-body">
        <table class="table">
          <tr>
            <th>{l s='URL de l\'API:' mod='prestasynch'}</th>
            <td><code>{$module_url}api.php</code></td>
          </tr>
          <tr>
            <th>{l s='Statut:' mod='prestasynch'}</th>
            <td><span class="badge badge-success">{l s='Prêt' mod='prestasynch'}</span></td>
          </tr>
        </table>
      </div>
    </div>
  {else}
    <div class="alert alert-warning">
      <i class="icon icon-warning"></i> {l s='Aucune clé API n\'est configurée. Veuillez en saisir une pour permettre la connexion avec PHSy.' mod='prestasynch'}
    </div>
  {/if}
</div>