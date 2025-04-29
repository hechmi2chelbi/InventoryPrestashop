# Module PrestaSync pour PrestaShop

Ce module permet la synchronisation des produits, des stocks et des prix entre votre boutique PrestaShop et le service PrestaSync.

## Compatibilité

- PrestaShop 1.6.x
- PrestaShop 1.7.x
- PrestaShop 8.x

## Installation

1. Téléchargez le module
2. Décompressez l'archive et renommez le dossier en "prestasynch"
3. Téléversez le dossier "prestasynch" dans le répertoire `/modules` de votre installation PrestaShop
4. Dans le back-office de PrestaShop, accédez à la section "Modules > Modules & Services"
5. Recherchez "PrestaSync" et cliquez sur "Installer"

## Configuration

Après l'installation, configurez le module en suivant ces étapes :

1. Accédez à la configuration du module "PrestaSync"
2. Générez une clé API en cochant la case "Générer une nouvelle clé API" et en enregistrant les paramètres
3. Copiez la clé API générée (vous en aurez besoin pour configurer votre compte sur la plateforme PrestaSync)
4. Activez le mode "Live" pour permettre la synchronisation en temps réel

## Fonctionnalités

- Synchronisation automatique des prix lors des mises à jour de produits
- Suivi des modifications de stock
- Historique des synchronisations
- Accès API sécurisé via clé d'authentification

## API

Le module expose une API REST accessible via l'URL : `https://votre-boutique.com/modules/prestasynch/api.php`

### Authentification

Toutes les requêtes API doivent inclure le paramètre `api_key` correspondant à la clé générée dans l'interface d'administration.

### Points d'accès disponibles

#### Récupération de tous les produits

```
GET /modules/prestasynch/api.php?action=getProducts&api_key=VOTRE_CLE_API
```

Exemple de réponse :

```json
[
  {
    "id": 1,
    "name": "Produit exemple",
    "reference": "REF-001",
    "price": "19.99",
    "quantity": 150
  },
  {
    "id": 2,
    "name": "Autre produit",
    "reference": "REF-002",
    "price": "29.99",
    "quantity": 75
  }
]
```

#### Récupération d'un produit spécifique

```
GET /modules/prestasynch/api.php?action=getProduct&id_product=1&api_key=VOTRE_CLE_API
```

Exemple de réponse :

```json
{
  "id": 1,
  "name": "Produit exemple",
  "reference": "REF-001",
  "price": "19.99",
  "quantity": 150
}
```

## Support

Pour toute question ou assistance, veuillez contacter notre équipe support à l'adresse support@prestasynch.com

## Licence

Ce module est distribué sous licence AFL 3.0