# PrestaSynch - Module d'intégration PrestaShop

## Présentation

Le module PrestaSynch permet de synchroniser les informations de produits, de prix et de stock entre votre boutique PrestaShop et l'application PrestaSynch. Grâce à cette synchronisation, vous pourrez surveiller l'évolution des prix et recevoir des alertes de stock.

## Compatibilité

Ce module est compatible avec :
- PrestaShop 1.6.x
- PrestaShop 1.7.x
- PrestaShop 8.x

## Installation

1. Téléchargez le module depuis votre espace PrestaSynch en cliquant sur le bouton "Télécharger le module PrestaShop".
2. Connectez-vous à l'administration de votre boutique PrestaShop.
3. Allez dans le menu "Modules" > "Modules et services".
4. Cliquez sur "Ajouter un nouveau module" (en haut de la page).
5. Cliquez sur "Choisir un fichier" et sélectionnez le fichier ZIP du module PrestaSynch que vous avez téléchargé.
6. Cliquez sur "Installer le module".
7. Une fois l'installation terminée, cliquez sur "Configurer" ou allez dans la section "Modules installés" > "PrestaSynch".

## Configuration

1. Dans la page de configuration du module, entrez la clé API fournie dans votre compte PrestaSynch.
   - Cette clé API se trouve dans les détails de votre site sur l'application PrestaSynch.
   - Elle permet d'authentifier les communications entre votre boutique et notre plateforme.

2. Configurez la fréquence de synchronisation :
   - Temps réel : les modifications de produits sont envoyées immédiatement
   - Journalier : une synchronisation complète est effectuée une fois par jour
   - Hebdomadaire : une synchronisation complète est effectuée une fois par semaine

3. Si votre boutique est protégée par une authentification HTTP Basic :
   - Activez l'option "Authentification HTTP Basic"
   - Renseignez le nom d'utilisateur et le mot de passe HTTP
   - Ces informations sont nécessaires pour permettre à notre application de se connecter à votre boutique protégée

4. Cliquez sur "Enregistrer" pour sauvegarder vos paramètres.

5. Lancez une synchronisation manuelle en cliquant sur le bouton "Synchroniser maintenant" pour vérifier que tout fonctionne correctement.

## Fonctionnalités

- Synchronisation automatique des produits (nom, référence, prix, quantité)
- Détection des changements de prix et création d'un historique
- Alertes de stock (rupture, réapprovisionnement)
- Interface d'administration pour suivre l'état de la synchronisation
- Journalisation des erreurs pour un dépannage facile

## Dépannage

Si vous rencontrez des problèmes avec le module :

1. Vérifiez que la clé API est correctement saisie dans la configuration du module.
2. Assurez-vous que votre boutique PrestaShop peut communiquer avec notre serveur (pas de pare-feu bloquant les requêtes sortantes).
3. Si votre boutique est protégée par une authentification HTTP Basic :
   - Vérifiez que les identifiants saisis dans la configuration du module sont corrects
   - Testez manuellement les identifiants en accédant à votre boutique dans un navigateur
   - Assurez-vous que l'option "Authentification HTTP Basic" est bien activée
4. Consultez les journaux d'erreurs de PrestaShop et du module PrestaSynch.
5. Contactez notre support technique si le problème persiste.

## Support

Pour toute question ou assistance concernant ce module, veuillez nous contacter via votre espace utilisateur PrestaSynch ou par email à support@prestasynch.com.