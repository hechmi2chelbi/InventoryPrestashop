{*
* Module PHSy - Vue principale de configuration
*}

<div class="panel-phsy-header">
  <h2><i class="module-phsy-icon icon icon-exchange"></i> {l s='PHSy - Gestion de produits et synchronisation' mod='prestasynch'}</h2>
  <p>{l s='Connectez votre boutique PrestaShop à la plateforme PHSy pour un suivi avancé de vos produits.' mod='prestasynch'}</p>
</div>

{if isset($confirmation_message)}
  <div class="alert alert-success">
    {$confirmation_message}
  </div>
{/if}

<div class="panel">
  <div class="row">
    {* Navigation par onglets (colonne de gauche) *}
    <div class="col-md-3">
      <div class="list-group phsy-tabs" role="tablist">
        <a href="#tab-api-key" class="list-group-item active" data-toggle="tab" role="tab">
          <i class="icon icon-key"></i> {l s='Clé API' mod='prestasynch'}
        </a>
        <a href="#tab-test" class="list-group-item" data-toggle="tab" role="tab">
          <i class="icon icon-flask"></i> {l s='Tester les endpoints' mod='prestasynch'}
        </a>
        <a href="#tab-about" class="list-group-item" data-toggle="tab" role="tab">
          <i class="icon icon-info-circle"></i> {l s='À propos' mod='prestasynch'}
        </a>
      </div>
      
      <div class="panel mt-3">
        <div class="panel-heading">
          <i class="icon icon-life-ring"></i> {l s='Aide' mod='prestasynch'}
        </div>
        <div class="panel-body">
          <p>{l s='Besoin d\'aide avec le module PHSy?' mod='prestasynch'}</p>
          <ul>
            <li><a href="https://phsy.fr/docs" target="_blank">{l s='Documentation' mod='prestasynch'}</a></li>
            <li><a href="https://phsy.fr/support" target="_blank">{l s='Support technique' mod='prestasynch'}</a></li>
            <li><a href="mailto:contact@phsy.fr">{l s='Contact' mod='prestasynch'}</a></li>
          </ul>
        </div>
      </div>
    </div>
    
    {* Contenu des onglets (colonne de droite) *}
    <div class="col-md-9">
      <div class="tab-content panel">
      
        {* Onglet Clé API *}
        <div role="tabpanel" class="tab-pane active" id="tab-api-key">
          {include file="./tabs/tab-api-key.tpl"}
        </div>
        
        {* Onglet Test des endpoints *}
        <div role="tabpanel" class="tab-pane" id="tab-test">
          {include file="./tabs/tab-test.tpl"}
        </div>
        
        {* Onglet À propos *}
        <div role="tabpanel" class="tab-pane" id="tab-about">
          <div class="panel-heading">
            <i class="icon icon-info-circle"></i> {l s='À propos du module PHSy' mod='prestasynch'}
          </div>
          <div class="panel-body">
            <div class="row">
              <div class="col-md-6">
                <div class="panel panel-default">
                  <div class="panel-heading">
                    <h4 class="panel-title">{l s='Informations du module' mod='prestasynch'}</h4>
                  </div>
                  <div class="panel-body">
                    <table class="table">
                      <tr>
                        <th>{l s='Version:' mod='prestasynch'}</th>
                        <td>{$module_version|escape:'html':'UTF-8'}</td>
                      </tr>
                      <tr>
                        <th>{l s='Date d\'installation:' mod='prestasynch'}</th>
                        <td>{if isset($install_date)}{$install_date|date_format:'%d/%m/%Y'}{else}-{/if}</td>
                      </tr>
                      <tr>
                        <th>{l s='Dernière mise à jour:' mod='prestasynch'}</th>
                        <td>{if isset($update_date)}{$update_date|date_format:'%d/%m/%Y'}{else}-{/if}</td>
                      </tr>
                    </table>
                  </div>
                </div>
              </div>
              
              <div class="col-md-6">
                <div class="panel panel-default">
                  <div class="panel-heading">
                    <h4 class="panel-title">{l s='Environnement' mod='prestasynch'}</h4>
                  </div>
                  <div class="panel-body">
                    <table class="table">
                      <tr>
                        <th>{l s='Version PrestaShop:' mod='prestasynch'}</th>
                        <td>{$ps_version|escape:'html':'UTF-8'}</td>
                      </tr>
                      <tr>
                        <th>{l s='Version PHP:' mod='prestasynch'}</th>
                        <td>{$php_version|escape:'html':'UTF-8'}</td>
                      </tr>
                      <tr>
                        <th>{l s='Environnement:' mod='prestasynch'}</th>
                        <td>{if $is_dev_mode}
                          <span class="badge badge-warning">{l s='Développement' mod='prestasynch'}</span>
                        {else}
                          <span class="badge badge-success">{l s='Production' mod='prestasynch'}</span>
                        {/if}</td>
                      </tr>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="panel panel-default">
              <div class="panel-heading">
                <h4 class="panel-title">{l s='Description' mod='prestasynch'}</h4>
              </div>
              <div class="panel-body">
                <p>
                  {l s='PHSy est une solution complète pour la gestion et la surveillance de vos produits PrestaShop.' mod='prestasynch'}
                </p>
                <p>
                  {l s='Fonctionnalités principales:' mod='prestasynch'}
                </p>
                <ul>
                  <li>{l s='Synchronisation automatique de vos produits avec la plateforme PHSy' mod='prestasynch'}</li>
                  <li>{l s='Suivi des modifications de prix et de stock' mod='prestasynch'}</li>
                  <li>{l s='Historique détaillé des changements de prix' mod='prestasynch'}</li>
                  <li>{l s='Gestion avancée des déclinaisons de produits' mod='prestasynch'}</li>
                  <li>{l s='Alertes de stock configurables' mod='prestasynch'}</li>
                  <li>{l s='Tableau de bord des statistiques de produits' mod='prestasynch'}</li>
                </ul>
              </div>
            </div>
            
            <div class="row">
              <div class="col-md-12 text-center">
                <p>
                  <strong>{l s='Besoin de plus de fonctionnalités?' mod='prestasynch'}</strong>
                </p>
                <p>
                  <a href="https://phsy.fr" target="_blank" class="btn btn-primary">
                    <i class="icon icon-external-link"></i> {l s='Découvrez notre plateforme complète' mod='prestasynch'}
                  </a>
                </p>
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
  // Gestion des onglets avec jQuery
  $('.phsy-tabs a').click(function(e) {
    e.preventDefault();
    $(this).tab('show');
  });
  
  // Récupérer l'onglet actif depuis l'URL si présent
  var hash = window.location.hash;
  if (hash) {
    $('.phsy-tabs a[href="' + hash + '"]').tab('show');
  }
  
  // Mettre à jour l'URL quand on change d'onglet
  $('.phsy-tabs a').on('shown.bs.tab', function(e) {
    window.location.hash = e.target.hash;
  });
});
</script>