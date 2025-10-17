// Gestionnaire du menu d'options
import { i18n } from './i18n.js';
import { gameState } from '../game_logic_yuan/gameState.js';
import { ServerConfig } from '../app/config.js';
import { Auth } from '../app/auth.js';

export class OptionsMenu {
    constructor() {
        this.isOpen = false;
        this.menuElement = null;
        this.overlayElement = null;
        this.baseUrl = ServerConfig.HTTP_BASE;
    }

    // Paramètres du menu d'options
    getMenuParams() {
        return {
            title: i18n.t('options.title'),
            sections: [
                {
                    type: 'dropdown',
                    label: i18n.t('options.language'),
                    id: 'language-select',
                    options: [
                        { value: 'fr', label: i18n.t('options.languages.fr') },
                        { value: 'en', label: i18n.t('options.languages.en') },
                        { value: 'zh', label: i18n.t('options.languages.zh') }
                    ],
                    currentValue: i18n.getLanguage(),
                    onChange: this.handleLanguageChange.bind(this)
                },
                {
                    type: 'button',
                    label: i18n.t('options.abandon_game'),
                    id: 'abandon-game-btn',
                    onClick: this.handleAbandonGame.bind(this),
                    style: 'danger'
                },
                {
                    type: 'button',
                    label: i18n.t('options.return_to_game'),
                    id: 'return-game-btn',
                    onClick: this.close.bind(this),
                    style: 'primary'
                }
            ]
        };
    }

    // Ouvrir le menu d'options
    open() {
        console.log('🔧 Ouverture du menu d\'options');
        
        if (this.isOpen) {
            console.log('⚠️ Le menu d\'options est déjà ouvert');
            return;
        }

        this.isOpen = true;
        this.render();
    }

    // Fermer le menu d'options
    close() {
        console.log('🔧 Fermeture du menu d\'options');
        
        if (!this.isOpen) {
            return;
        }

        this.isOpen = false;
        
        if (this.overlayElement) {
            this.overlayElement.remove();
            this.overlayElement = null;
        }
        
        if (this.menuElement) {
            this.menuElement.remove();
            this.menuElement = null;
        }
    }

    // Rendre le menu d'options
    render() {
        // Créer l'overlay de fond
        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'options-overlay';
        this.overlayElement.addEventListener('click', (e) => {
            if (e.target === this.overlayElement) {
                this.close();
            }
        });

        // Créer le conteneur du menu
        this.menuElement = document.createElement('div');
        this.menuElement.className = 'options-menu';

        const params = this.getMenuParams();

        // Titre du menu
        const title = document.createElement('h2');
        title.className = 'options-menu-title';
        title.textContent = params.title;
        this.menuElement.appendChild(title);

        // Créer les sections
        params.sections.forEach(section => {
            const sectionElement = this.createSection(section);
            this.menuElement.appendChild(sectionElement);
        });

        // Ajouter au DOM
        this.overlayElement.appendChild(this.menuElement);
        document.body.appendChild(this.overlayElement);
    }

    // Créer une section du menu
    createSection(section) {
        const container = document.createElement('div');
        container.className = 'options-section';

        if (section.type === 'dropdown') {
            // Label
            const label = document.createElement('label');
            label.className = 'options-label';
            label.textContent = section.label;
            label.htmlFor = section.id;
            container.appendChild(label);

            // Select
            const select = document.createElement('select');
            select.className = 'options-select';
            select.id = section.id;

            section.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.label;
                if (option.value === section.currentValue) {
                    optionElement.selected = true;
                }
                select.appendChild(optionElement);
            });

            select.addEventListener('change', (e) => {
                section.onChange(e.target.value);
            });

            container.appendChild(select);
        } else if (section.type === 'button') {
            // Button
            const button = document.createElement('button');
            button.className = `options-button options-button-${section.style}`;
            button.id = section.id;
            button.textContent = section.label;
            button.addEventListener('click', section.onClick);
            container.appendChild(button);
        }

        return container;
    }

    // Gérer le changement de langue
    async handleLanguageChange(newLanguage) {
        console.log(`🌍 Changement de langue vers: ${newLanguage}`);
        
        const currentLanguage = i18n.getLanguage();
        
        // Ne rien faire si c'est la même langue
        if (newLanguage === currentLanguage) {
            console.log('⚠️ Langue identique, pas de changement');
            return;
        }

        try {
            // Récupérer le token d'authentification
            const token =  Auth.authToken;
            if (!token) {
                console.error('❌ Token non trouvé');
                return;
            }

            // Envoyer la requête au serveur pour mettre à jour la langue de l'utilisateur
            const response = await fetch(`${this.baseUrl}user`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.authToken}`
                },
                body: JSON.stringify({
                    language: newLanguage
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Langue mise à jour sur le serveur');
                
                // Charger la nouvelle langue
                await i18n.loadLanguage(newLanguage);
                i18n.setLanguage(newLanguage);
                
                // Fermer le menu
                this.close();
                
                // Réouvrir le menu pour mettre à jour les traductions
                setTimeout(() => {
                    this.open();
                }, 100);
                
                // Afficher un message de confirmation dans l'info panel
                if (window.uiManager) {
                    window.uiManager.showTemporaryMessage(
                        i18n.t('options.language_updated'),
                        2000
                    );
                }
            } else {
                console.error('❌ Erreur lors de la mise à jour de la langue:', data);
            }
        } catch (error) {
            console.error('❌ Erreur lors du changement de langue:', error);
        }
    }

    // Gérer l'abandon de la partie
    async handleAbandonGame() {
        console.log('🚪 Demande d\'abandon de partie');
        console.log('🔍 Auth.authToken:', Auth.authToken);        
        // Demander confirmation
        const confirmation = confirm(i18n.t('options.abandon_confirmation'));        
        if (!confirmation) {
            console.log('❌ Abandon annulé');
            return;
        }

        if (gameState.game.game_status === 'simultaneous_play') {
            console.log("faire l'action passer son tour");
            const gameapi = await import('../game_logic_yuan/gameApi.js');
            gameapi.gameApi.sendActionToApi({
                position_q: null,
                position_r: null,
                development_level: 0,
                fortification_level: 0,
                militarisation_level: 0
            }, false);
        }



        try {
            // Récupérer le token d'authentification et l'ID du game_user
            const token =  Auth.authToken;
            if (!token) {
                console.error('❌ Token non trouvé');
                return;
            }
            const gameUserId = gameState.myGameUserId;
            const gameId = gameState.game.id;
            
            if (!gameUserId || !gameId) {
                console.error('❌ Informations de jeu non trouvées');
                return;
            }          

            // Envoyer la requête au serveur pour abandonner la partie
            const response = await fetch(`${this.baseUrl}games/${gameId}/game_users/${gameUserId}/abandon`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.authToken}`
                }
            });

            const data = await response.json();

            if (data.success) {
                console.log('✅ Partie abandonnée avec succès');                
                // Fermer le menu
                this.close();                
                // Afficher un message de confirmation
                if (window.uiManager) {
                    window.uiManager.showTemporaryMessage(
                        i18n.t('options.game_abandoned'),
                        3000
                    );
                }                
                // Rediriger vers le menu principal après 3 secondes
                setTimeout(async () => {
                    const { SessionManager } = await import('../app/sessionManager.js');
                    SessionManager.resetToGameMenu();
                }, 3000);
            } else {
                console.error('❌ Erreur lors de l\'abandon de la partie:', data);
                alert('Erreur lors de l\'abandon de la partie');
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'abandon de la partie:', error);
            alert('Erreur lors de l\'abandon de la partie');
        }
    }
}

// Instance unique du menu d'options
export const optionsMenu = new OptionsMenu();

