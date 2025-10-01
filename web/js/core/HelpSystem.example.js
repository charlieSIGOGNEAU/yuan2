// Exemples d'utilisation du HelpSystem

// ===== EXEMPLE 1 : Usage basique =====
// Dans simultaneous-play-phase.js ou developpement.js

// Avant (sans mots cliquables) :
uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.free_urbanization'));

// Après (avec mots cliquables automatiques) :
uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.free_urbanization'));
// → Les mots "colonisation", "urbanisation" sont automatiquement cliquables !

// ===== EXEMPLE 2 : Tester un mot-clé spécifique =====
// Afficher directement une aide
uiManager.helpSystem.showHelp('game.help.Colonisation');

// ===== EXEMPLE 3 : Message personnalisé =====
const customMessage = "Pour effectuer une colonisation, vous devez avoir assez de chao.";
uiManager.helpSystem.displayMessage(customMessage);
// → "colonisation" et "chao" seront cliquables

// ===== EXEMPLE 4 : Ajouter temporairement un mot-clé =====
// Ajouter un nouveau mot-clé pour cette session
uiManager.helpSystem.addKeyword('province', 'game.help.Province');
uiManager.helpSystem.addKeyword('armée', 'game.help.Armee');

// Maintenant "province" et "armée" sont aussi cliquables
uiManager.updateInfoPanel("Déplacez votre armée vers une province adjacente");

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

