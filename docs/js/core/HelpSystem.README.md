# Système d'Aide Interactif (HelpSystem)

## Description

Le `HelpSystem` permet de rendre automatiquement certains mots cliquables dans les messages affichés. Quand un utilisateur clique sur un mot-clé, l'aide correspondante s'affiche.

## Fonctionnalités

- ✅ Détection automatique des mots-clés dans les textes
- ✅ Transformation en liens cliquables stylisés
- ✅ Affichage de l'aide correspondante au clic
- ✅ Support de l'internationalisation (i18n)
- ✅ Navigation récursive (les aides peuvent contenir d'autres mots-clés)
- ✅ Tableaux dynamiques générés automatiquement avec `{{tableau:type}}`

## Utilisation

### Affichage de messages avec mots-clés cliquables

```javascript
// Méthode 1 : Utiliser updateInfoPanel normalement (processHelp = true par défaut)
uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.free_urbanization'));
// Les mots comme "colonisation", "expansion", "temple" deviennent automatiquement cliquables

// Méthode 2 : Désactiver le traitement si besoin
uiManager.updateInfoPanel("Texte brut sans liens", false);

// Méthode 3 : Utiliser directement le HelpSystem
uiManager.helpSystem.displayMessage("Une colonisation est en cours");
uiManager.helpSystem.displayI18nMessage('game.phases.simultaneous_play.colonization_targets');
```

### Ajouter de nouveaux mots-clés

```javascript
// Ajouter un nouveau mot-clé
uiManager.helpSystem.addKeyword('province', 'game.help.Province');
uiManager.helpSystem.addKeyword('honneur', 'game.help.Honneur');

// Supprimer un mot-clé
uiManager.helpSystem.removeKeyword('province');
```

## Système de balises

Le système utilise des balises pour créer des liens cliquables, ce qui permet un support complet de toutes les langues.

### Balise d'aide : `{{aide:key:texte}}`

**Syntaxe :** `{{aide:CléAide:TexteAffiché}}`

**Exemple :**
```
"Developpement": "... faire une {{aide:Colonisation:colonisation}} ..."
```

**Résultat :** Le mot "colonisation" devient cliquable et ouvre `game.help.Colonisation`

### Avantages des balises :
- ✅ Support multilingue automatique
- ✅ Contrôle total sur le texte affiché
- ✅ Pas besoin de maintenir une liste de mots-clés
- ✅ Fonctionne avec n'importe quelle langue (français, anglais, chinois, etc.)

## Structure des fichiers de traduction

Dans `fr.json`, organisez vos aides sous `game.help` :

```json
{
  "game": {
    "help": {
      "Colonisation": "Explication de la {{aide:Expansion:colonisation}}...",
      "Expansion": "Explication de l'expansion... coûte 4 {{aide:Chao:chao}}",
      "Developpement": "Développement se sépare en 2 types :<br><br>{{aide:Colonisation:Colonisation}} : ...<br><br>{{aide:Expansion:Expansion}} : ...<br><br>{{tableau:honneur}}",
      ...
    }
  }
}
```

### Tableaux dynamiques

Utilisez `{{tableau:type}}` dans vos textes pour insérer un tableau généré dynamiquement :

**Types de tableaux disponibles :**

- `{{tableau:honneur}}` : Affiche un tableau des clans triés par honneur avec leurs couleurs

**Exemple dans fr.json :**
```json
"Developpement": "... le clan avec le plus d'honneur cède.<br><br>{{tableau:honneur}}"
```

**Résultat :** Un tableau stylisé s'affiche automatiquement avec :
- Colonne 1 : Nom du clan avec cercle coloré
- Colonne 2 : Valeur d'honneur
- Tri automatique par honneur décroissant

## Style CSS

Les mots-clés cliquables sont stylisés avec la classe `.help-keyword` :

- Couleur bleue avec soulignement en pointillés
- Curseur "help" (point d'interrogation)
- Effet au survol avec fond coloré
- Animation au clic

## Architecture technique

### Fichiers

- **HelpSystem.js** : Classe principale du système d'aide
- **game-ui.css** : Styles pour `.help-keyword`
- **UIManager.js** : Intégration dans `updateInfoPanel()`
- **gameApi.js** : Initialisation du système après i18n

### Workflow

1. **Initialisation** : `uiManager.initializeHelpSystem(i18n)` dans `gameApi.js`
2. **Traitement** : `updateInfoPanel()` appelle `helpSystem.processText()`
3. **Détection** : Regex cherche les mots-clés et les entoure de `<span class="help-keyword">`
4. **Interaction** : Event listener global détecte les clics sur `.help-keyword`
5. **Affichage** : Récupère le texte i18n et l'affiche (récursif)

## Exemple complet

```javascript
// Dans simultaneous-play-phase.js
uiManager.updateInfoPanel(
  i18n.t('game.phases.simultaneous_play.free_urbanization')
);
// Message : "Suite à une colonisation, une urbanisation gratuite va être effectuée"
// → "colonisation" et "urbanisation" deviennent cliquables

// L'utilisateur clique sur "colonisation"
// → Affiche game.help.Colonisation
// → Ce texte peut lui-même contenir "expansion", "temple", etc. qui sont cliquables
```

## Avantages

1. **Automatique** : Pas besoin de modifier les messages existants
2. **Centralisé** : Un seul fichier gère tous les mots-clés
3. **Récursif** : Navigation naturelle entre les aides
4. **i18n compatible** : Fonctionne avec les traductions
5. **Maintenable** : Facile d'ajouter/modifier des mots-clés

