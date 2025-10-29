// Système de gestion d'aide avec mots cliquables
export class HelpSystem {
    constructor(i18n, uiManager) {
        this.i18n = i18n;
        this.uiManager = uiManager;
        this.helpKeywords = new Map(); // Map des mots-clés vers leurs clés i18n
        this.isActive = false; // État du système d'aide
        
    }

  

    // Transformer un texte en ajoutant des liens cliquables sur les mots-clés
    processText(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }

        let processedText = text;

        // Étape 1 : Remplacer les tableaux dynamiques {{tableau:type}}
        processedText = this.replaceDynamicTables(processedText);

        // Étape 2 : Remplacer les balises d'aide {{aide:key:texte}}
        processedText = this.replaceHelpLinks(processedText);

        return processedText;
    }

    // Remplacer les balises d'aide {{aide:key:texte}} par des liens cliquables
    replaceHelpLinks(text) {
        // Pattern: {{aide:cle_i18n:texte_affiche}}
        const helpPattern = /\{\{aide:([^:]+):([^}]+)\}\}/g;
        
        return text.replace(helpPattern, (match, helpKey, displayText) => {
            // Créer un span cliquable
            return `<span class="help-keyword" data-help-key="game.help.${helpKey}">${displayText}</span>`;
        });
    }

    // Remplacer les marqueurs de tableaux dynamiques par le HTML généré
    replaceDynamicTables(text) {
        // Chercher les patterns {{tableau:type}}
        const tablePattern = /\{\{tableau:(\w+)\}\}/g;
        
        return text.replace(tablePattern, (match, tableType) => {
            switch (tableType) {
                case 'honneur':
                    return this.generateHonourTable();
                default:
                    console.warn(`⚠️ Type de tableau inconnu: ${tableType}`);
                    return match;
            }
        });
    }

    // Générer le tableau d'honneur des clans
    generateHonourTable() {
        // Récupérer les clans depuis gameState
        if (!window.gameState || !window.gameState.game || !window.gameState.game.clans) {
            return '<p style="color: #999; font-style: italic;">Tableau non disponible (partie non démarrée)</p>';
        }

        const clans = window.gameState.game.clans;
        
        // Trier les clans par honneur (décroissant)
        const sortedClans = [...clans].sort((a, b) => b.honneur - a.honneur);

        // Générer le HTML du tableau
        let tableHTML = `
            <table class="help-table honour-table">
                <thead>
                    <tr>
                        <th>Clan</th>
                        <th>Honneur</th>
                    </tr>
                </thead>
                <tbody>
        `;

        sortedClans.forEach(clan => {
            // Traduire le nom de la couleur
            const colorName = this.i18n.t(`colors.${clan.color_name}`);
            
            tableHTML += `
                <tr>
                    <td>
                    
                        <span class="clan-circle" style="background-color: ${clan.color}; display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 5px;"></span>
                        ${colorName}
                    </td>
                    <td class="honour-value">${clan.honneur}</td>
                </tr>
            `;
        });

        tableHTML += `
                </tbody>
            </table>
        `;

        return tableHTML;
    }

    // Activer le système d'aide (ajouter les event listeners)
    activate() {
        if (this.isActive) return;
        
        // Ajouter un event listener global pour les clics sur les mots-clés d'aide
        document.addEventListener('click', this.handleHelpClick.bind(this));
        this.isActive = true;
        
        console.log('📚 Système d\'aide activé');
    }

    // Désactiver le système d'aide
    deactivate() {
        if (!this.isActive) return;
        
        document.removeEventListener('click', this.handleHelpClick.bind(this));
        this.isActive = false;
        
        console.log('📚 Système d\'aide désactivé');
    }

    // Gérer les clics sur les mots-clés d'aide
    handleHelpClick(event) {
        // Vérifier si l'élément cliqué est un mot-clé d'aide
        const target = event.target;
        
        if (target.classList && target.classList.contains('help-keyword')) {
            event.preventDefault();
            event.stopPropagation();
            
            const helpKey = target.dataset.helpKey;
            
            if (helpKey) {
                console.log(`📚 Affichage de l'aide pour: ${helpKey}`);
                this.showHelp(helpKey);
            }
        }
    }

    // Afficher l'aide pour une clé donnée
    showHelp(helpKey) {
        // Récupérer le texte d'aide traduit
        const helpText = this.i18n.t(helpKey);
        
        if (helpText && helpText !== helpKey) {
            // Traiter le texte pour ajouter des liens sur les mots-clés
            const processedText = this.processText(helpText);
            
            // Afficher dans le panneau d'informations
            this.uiManager.updateInfoPanel(processedText);
        } else {
            console.warn(`⚠️ Aide non trouvée pour la clé: ${helpKey}`);
        }
    }

    // Ajouter un nouveau mot-clé d'aide
    addKeyword(keyword, helpKey) {
        this.helpKeywords.set(keyword.toLowerCase(), helpKey);
        console.log(`📚 Mot-clé ajouté: ${keyword} -> ${helpKey}`);
    }

    // Supprimer un mot-clé d'aide
    removeKeyword(keyword) {
        this.helpKeywords.delete(keyword.toLowerCase());
        console.log(`📚 Mot-clé supprimé: ${keyword}`);
    }

    // Afficher un message avec des mots-clés cliquables
    displayMessage(text) {
        const processedText = this.processText(text);
        this.uiManager.updateInfoPanel(processedText);
    }

    // Afficher un message i18n avec des mots-clés cliquables
    displayI18nMessage(key, params = {}) {
        const text = this.i18n.t(key, params);
        this.displayMessage(text);
    }
}

// Instance unique (sera initialisée après i18n et uiManager)
export let helpSystem = null;

// Fonction d'initialisation
export function initializeHelpSystem(i18n, uiManager) {
    helpSystem = new HelpSystem(i18n, uiManager);
    helpSystem.activate();
    return helpSystem;
}

