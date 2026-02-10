// Gestionnaire du menu d'options
import { i18n } from './i18n.js';
import { gameState } from '../game_logic_yuan/gameState.js';
import { ServerConfig } from '../app/config.js';
import { Auth } from '../app/auth.js';
import { handleLanguageChange as changeLanguage } from '../app/options.js';
import { handleFPSChange } from '../app/options.js';
import { handleRenderScaleChange } from '../app/options.js';
import { handleShadowRealtimeChange } from '../app/options.js';



export class OptionsMenu {
    constructor() {
        this.isOpen = false;
        this.menuElement = null;
        this.overlayElement = null;
        this.baseUrl = ServerConfig.HTTP_BASE;
        this.text_button_abandon = "";
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
                        { value: 'fr', label: 'Français' },
                        { value: 'en', label: 'English' },
                        { value: 'zh', label: '中文' },
                        { value: 'ja', label: '日本語' },
                        { value: 'ko', label: '한국어' },
                        { value: 'de', label: 'Deutsch' },
                        { value: 'es', label: 'Español' },
                        { value: 'pt', label: 'Português' },
                        { value: 'ru', label: 'Русский' },
                        { value: 'it', label: 'Italiano' }
                    ],
                    currentValue: i18n.getLanguage(),
                    onChange: this.handleLanguageChange.bind(this)
                },
                {
                    type: 'dropdown',
                    label: i18n.t('options.graphics_quality'),
                    id: 'graphics-quality-options-of-game',
                    options: [
                        { value: '20', label: '20' },
                        { value: '30', label: '30' },
                        { value: '60', label: '60' }
                    ],
                    currentValue: String(Auth.options.fps),
                    onChange: this.handleFPSChange.bind(this)
                },
                {
                    type: 'dropdown',
                    label: i18n.t('options.render_quality'),
                    id: 'render-quality-options-of-game',
                    options: [
                        { value: '1', label: i18n.t('options.render_quality_high') },
                        { value: '0.66', label: i18n.t('options.render_quality_medium') },
                        { value: '0.45', label: i18n.t('options.render_quality_low') }
                    ],
                    currentValue: String(Auth.options.resolutionScale || 1),
                    onChange: this.handleRenderScaleChange.bind(this)
                },
                {
                    type: 'dropdown',
                    label: i18n.t('options.shadow_update'),
                    id: 'shadow-realtime-options-of-game',
                    options: [
                        { value: 'true', label: i18n.t('options.shadow_realtime') },
                        { value: 'false', label: i18n.t('options.shadow_every_5s') }
                    ],
                    currentValue: String(Auth.options.shadowRealtime !== false),
                    onChange: this.handleShadowRealtimeChange.bind(this)
                },
                {
                    type: 'button',
                    label: this.text_button_abandon,
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
        let text_button_abandon = ""
        if (gameState.game.game_status === 'installation_phase' || gameState.game.game_status === 'initial_placement' || gameState.game.game_status === 'bidding_phase' || gameState.game.game_status === 'starting_spot_selection' || gameState.game.game_status === 'simultaneous_play') {
            text_button_abandon = i18n.t('options.abandon_game');
        } else {
            text_button_abandon = i18n.t('options.leave_game');
        }
        this.text_button_abandon = text_button_abandon;
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
        // this.overlayElement.appendChild(this.menuElement);
        // document.body.appendChild(this.overlayElement);
        const allContainer = document.getElementById('all');
        this.overlayElement.appendChild(this.menuElement);
        allContainer.appendChild(this.overlayElement);

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

    // Gérer le changement de langue (utilise la fonction partagée depuis options.js)
    async handleLanguageChange(newLanguage) {
        await changeLanguage(newLanguage, {
            onSuccess: () => {
                // Fermer le menu
                this.close();

                // Réouvrir le menu pour mettre à jour les traductions
                setTimeout(() => {
                    this.open();
                }, 100);
            },
            onError: (error) => {
                console.error('❌ Erreur lors du changement de langue:', error);
            }
        });
    }
    async handleFPSChange(newFPS) {
        await handleFPSChange(newFPS, {
            onSuccess: () => {
                // Fermer le menu
                this.close();
            },
        });
    }
    async handleRenderScaleChange(newRenderScale) {
        await handleRenderScaleChange(newRenderScale, {
            onSuccess: () => {
                // Fermer le menu
                this.close();
            },
        });
    }
    async handleShadowRealtimeChange(newShadowRealtime) {
        await handleShadowRealtimeChange(newShadowRealtime, {
            onSuccess: () => {
                // Fermer le menu
                this.close();
            },
        });
    }

    // Gérer l'abandon de la partie
    async handleAbandonGame() {
        console.log('🚪 Demande d\'abandon de partie');
        console.log('🔍 Auth.authToken:', Auth.authToken);
        // Demander confirmation
        if (gameState.game.game_status === 'simultaneous_play') {
            // Demander confirmation
            const confirmation = confirm(i18n.t('options.abandon_confirmation'));
            if (!confirmation) {
                console.log('❌ Abandon annulé');
                return;
            }

            console.log("faire l'action passer son tour");
            const gameapi = await import('../game_logic_yuan/gameApi.js');
            await gameapi.gameApi.sendActionToApi({
                position_q: null,
                position_r: null,
                development_level: 0,
                fortification_level: 0,
                militarisation_level: 0
            }, false);
        }



        try {
            // Récupérer le token d'authentification et l'ID du game_user
            const token = Auth.authToken;
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
            const response = await fetch(`${this.baseUrl}/games/${gameId}/game_users/${gameUserId}/abandon`, {
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
                // Rediriger vers le menu principal après 1.5 secondes
                setTimeout(async () => {
                    const { SessionManager } = await import('../app/sessionManager.js');
                    SessionManager.resetToGameMenu();
                }, 1500);
            } else {
                console.error('❌ Erreur1 lors de l\'abandon de la partie:', data);

            }
        } catch (error) {
            console.error('❌ Erreur2 lors de l\'abandon de la partie:', error);

        }
    }
}

// Instance unique du menu d'options
export const optionsMenu = new OptionsMenu();

