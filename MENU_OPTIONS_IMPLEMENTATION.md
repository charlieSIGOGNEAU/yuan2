# Implémentation du Menu d'Options

## Vue d'ensemble
Le menu d'options a été implémenté avec succès. Il est accessible depuis tous les boutons "Settings" (roue crantée) des différentes barres d'action.

## Fonctionnalités implémentées

### 1. **Changement de langue**
- Menu déroulant avec 3 langues disponibles :
  - 🇫🇷 Français
  - 🇬🇧 English  
  - 🇨🇳 中文 (Chinois)
- Les noms des langues sont affichés dans leur langue respective
- Lors du changement :
  - Une requête `PATCH /api/v1/user` est envoyée au backend
  - La langue est mise à jour dans la table `users`
  - Le fichier de langue est téléchargé si nécessaire (via i18n.js)
  - Le menu se recharge pour afficher les traductions mises à jour
  - Un message de confirmation s'affiche brièvement

### 2. **Abandon de partie**
- Bouton rouge "Abandonner la partie"
- Demande de confirmation avec un message rappelant que ce n'est pas sympa pour les autres joueurs
- Si confirmé :
  - Envoie une requête `POST /api/v1/games/:game_id/game_users/:id/abandon`
  - Met à jour la colonne `abandoned` dans la table `game_users` à `true`
  - Affiche un message de confirmation
  - Redirige vers le menu principal après 3 secondes

### 3. **Retour à la partie**
- Bouton bleu "Revenir à la partie"
- Ferme simplement le menu d'options

## Fichiers créés/modifiés

### Frontend (web/)

#### Nouveaux fichiers
- `web/js/core/OptionsMenu.js` - Composant principal du menu d'options
- `web/css/options-menu.css` - Styles du menu d'options
- `web/locales/zh.json` - Traductions chinoises

#### Fichiers modifiés
- `web/js/game_logic_yuan/ui/UIManager.js`
  - Import du module OptionsMenu
  - Implémentation de `handleSettingsClick()`
  - Chargement du CSS du menu d'options
  - Exposition globale de `uiManager`

- `web/locales/fr.json` - Ajout des traductions pour le menu d'options
- `web/locales/en.json` - Ajout des traductions pour le menu d'options

### Backend (api/)

#### Nouveaux fichiers
- `api/app/controllers/api/v1/users_controller.rb` - Gestion de la mise à jour de la langue
- `api/app/controllers/api/v1/game_users_controller.rb` - Gestion de l'abandon de partie
- `api/db/migrate/20251001173149_add_abandoned_to_game_users.rb` - Migration pour la colonne `abandoned`

#### Fichiers modifiés
- `api/config/routes.rb` - Ajout des routes :
  - `PATCH /api/v1/user` - Mise à jour de la langue utilisateur
  - `POST /api/v1/games/:game_id/game_users/:id/abandon` - Abandon de partie

## Base de données

### Modifications
1. **Table `users`**
   - Colonne `language` déjà existante (valeur par défaut: 'fr')

2. **Table `game_users`**
   - Nouvelle colonne `abandoned` (boolean, default: false, null: false)

## Architecture du menu

Le menu est structuré via un objet `params` dans la méthode `getMenuParams()` qui définit :
- Le titre
- Les sections (dropdown, button)
- Les callbacks pour chaque action

```javascript
{
    title: 'Options',
    sections: [
        {
            type: 'dropdown',
            label: 'Langue',
            options: [...],
            onChange: function
        },
        {
            type: 'button',
            label: 'Abandonner',
            onClick: function,
            style: 'danger'
        },
        // ...
    ]
}
```

## Style visuel

Le menu respecte le style de l'`info-panel` avec :
- Fond noir semi-transparent (rgba(0, 0, 0, 0.95))
- Bordure blanche
- Overlay avec effet de flou
- Animations d'ouverture/fermeture
- Design responsive (smartphone et desktop)

## Utilisation

1. **Ouvrir le menu** : Cliquer sur l'icône de roue crantée (⚙️) dans n'importe quelle barre d'action
2. **Changer la langue** : Sélectionner une langue dans le menu déroulant
3. **Abandonner** : Cliquer sur "Abandonner la partie" puis confirmer
4. **Fermer** : Cliquer sur "Revenir à la partie" ou cliquer en dehors du menu

## Console logs

Le menu affiche des logs détaillés dans la console :
- `⚙️ Clic sur le bouton options` - Lors du clic sur le bouton settings
- `🔧 Ouverture du menu d'options` - À l'ouverture
- `🌍 Changement de langue vers: XX` - Lors du changement de langue
- `🚪 Demande d'abandon de partie` - Lors du clic sur abandonner

## Tests recommandés

1. Ouvrir le menu depuis différentes barres d'action
2. Changer de langue et vérifier que les traductions sont appliquées
3. Tester l'abandon de partie avec confirmation
4. Vérifier la responsivité sur mobile/desktop
5. Tester la fermeture en cliquant en dehors du menu

## Notes techniques

- Le menu utilise un z-index de 20000 pour être au-dessus de tous les autres éléments
- Les requêtes API utilisent le token JWT stocké dans localStorage
- Le système i18n charge automatiquement les fichiers de langue manquants
- La colonne `language` de la table `users` était déjà présente dans le schéma

