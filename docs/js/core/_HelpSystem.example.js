// Exemples d'utilisation du HelpSystem avec balises

// ===== EXEMPLE 1 : Utiliser les balises dans fr.json =====

// Dans fr.json :
/*
{
  "game": {
    "help": {
      "Developpement": "Faire une {{aide:Colonisation:colonisation}} coûte des {{aide:Chao:chao}}",
      "Colonisation": "La colonisation permet de...",
      "Chao": "Les chao sont la monnaie du jeu..."
    }
  }
}
*/

// Dans votre code JS :
uiManager.updateInfoPanel(i18n.t('game.help.Developpement'));
// → Affiche : "Faire une colonisation coûte des chao"
// → "colonisation" et "chao" sont cliquables automatiquement !

// ===== EXEMPLE 2 : Tester un mot-clé spécifique =====
// Afficher directement une aide
uiManager.helpSystem.showHelp('game.help.Colonisation');

// ===== EXEMPLE 3 : Message personnalisé =====
const customMessage = "Pour effectuer une colonisation, vous devez avoir assez de chao.";
uiManager.helpSystem.displayMessage(customMessage);
// → "colonisation" et "chao" seront cliquables

// ===== EXEMPLE 4 : Syntaxe des balises avec différentes casses =====
// Dans fr.json, vous pouvez contrôler exactement le texte affiché :

/*
{
  "help": {
    "Message1": "Effectuer une {{aide:Colonisation:colonisation}}",  // minuscule
    "Message2": "Action : {{aide:Colonisation:Colonisation}}",       // majuscule
    "Message3": "2 {{aide:Chao:chao}} ou 5 {{aide:Chao:Chao}}",     // les deux !
  }
}
*/

// Le deuxième paramètre de la balise contrôle ce qui est affiché
// Le premier paramètre (la clé) reste toujours le même

// ===== EXEMPLE 5 : Désactiver le traitement sur un message spécifique =====
// Si vous voulez afficher du texte SANS transformer les mots-clés
uiManager.updateInfoPanel("Message sans liens cliquables", false);

// ===== EXEMPLE 6 : Tester depuis la console du navigateur =====
/*
// Ouvrir la console (F12) et taper :

// Voir tous les mots-clés enregistrés
console.log(window.uiManager.helpSystem.helpKeywords);

// Tester un mot-clé
window.uiManager.helpSystem.showHelp('game.help.Temple');

// Afficher un message de test
window.uiManager.helpSystem.displayMessage("Test colonisation et expansion");

// Ajouter un mot-clé temporaire
window.uiManager.helpSystem.addKeyword('test', 'game.help.Developpement');
window.uiManager.updateInfoPanel("Ceci est un test");
*/

// ===== EXEMPLE 7 : Intégration dans une phase de jeu =====
class ExamplePhase {
    async start() {
        // Message de bienvenue avec mots cliquables
        uiManager.helpSystem.displayI18nMessage(
            'game.phases.simultaneous_play.welcome_message',
            { playerName: 'Joueur1', colorHex: '#ff0000' }
        );
        
        // Plus tard, afficher une info
        uiManager.updateInfoPanel(
            "Votre colonisation a échoué à cause d'un conflit d'honneur"
        );
        // → "colonisation" et "honneur" sont cliquables
    }
}

// ===== EXEMPLE 8 : Messages avec interpolation =====
// Dans fr.json, vous pouvez avoir :
// "conflict_message": "Le clan {{clanName}} veut faire une colonisation"

// Utilisation :
uiManager.helpSystem.displayI18nMessage(
    'game.phases.simultaneous_play.conflict_message',
    { clanName: 'Rouge' }
);
// → "colonisation" sera cliquable, mais "Rouge" non (car pas dans les keywords)

// ===== EXEMPLE 9 : Tableaux dynamiques =====
// Dans fr.json :
// "Developpement": "... le clan avec le plus d'honneur cède.<br><br>{{tableau:honneur}}"

// Utilisation :
uiManager.updateInfoPanel(i18n.t('game.help.Developpement'));
// → Affiche le texte + un tableau des clans avec leur honneur, trié automatiquement

// ===== EXEMPLE 10 : Ajouter un nouveau type de tableau =====
/*
// Dans HelpSystem.js, ajouter dans replaceDynamicTables() :

case 'ressources':
    return this.generateResourcesTable();

// Puis créer la méthode :

generateResourcesTable() {
    if (!window.gameState?.game?.clans) {
        return '<p>Tableau non disponible</p>';
    }
    
    let tableHTML = `
        <table class="help-table">
            <thead>
                <tr>
                    <th>Clan</th>
                    <th>Chao</th>
                    <th>Territoires</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    window.gameState.game.clans.forEach(clan => {
        const colorName = this.i18n.t(`colors.${clan.color_name}`);
        const territoryCount = clan.getTerritories().length;
        
        tableHTML += `
            <tr>
                <td>${colorName}</td>
                <td>${clan.available_chao}</td>
                <td>${territoryCount}</td>
            </tr>
        `;
    });
    
    tableHTML += '</tbody></table>';
    return tableHTML;
}

// Utilisation dans fr.json :
// "Chao": "Coût des actions : ...<br><br>{{tableau:ressources}}"
*/

