import { loadCSS } from '../simple.js';
import { Router } from './router.js';
import { Auth } from './auth.js';
import { ServerConfig } from './config.js';
import { i18n } from '../core/i18n.js';

// Fonction pour changer la langue (utilisée aussi par OptionsMenu.js)
export async function handleLanguageChange(newLanguage, callbacks = {}) {
    console.log(`🌍 Changement de langue vers: ${newLanguage}`);
    
    const currentLanguage = i18n.getLanguage();
    
    // Ne rien faire si c'est la même langue
    if (newLanguage === currentLanguage) {
        console.log('⚠️ Langue identique, pas de changement');
        return;
    }

    try {
        // Récupérer le token d'authentification
        const token = Auth.authToken;
        if (!token) {
            console.error('❌ Token non trouvé');
            if (callbacks.onError) callbacks.onError('Token non trouvé');
            return;
        }

        // Envoyer la requête au serveur pour mettre à jour la langue de l'utilisateur
        const response = await fetch(`${ServerConfig.HTTP_BASE}user`, {
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
            
            // Mettre à jour la langue dans l'objet utilisateur
            if (Auth.currentUser) {
                Auth.currentUser.language = newLanguage;
            }
            
            // Callback de succès
            if (callbacks.onSuccess) {
                callbacks.onSuccess(newLanguage);
            }
            
            // Afficher un message de confirmation
            if (window.uiManager) {
                window.uiManager.showTemporaryMessage(
                    i18n.t('options.language_updated'),
                    2000
                );
            }
        } else {
            console.error('❌ Erreur lors de la mise à jour de la langue:', data);
            if (callbacks.onError) callbacks.onError(data.message);
        }
    } catch (error) {
        console.error('❌ Erreur lors du changement de langue:', error);
        if (callbacks.onError) callbacks.onError(error.message);
    }
}

export async function handleFPSChange(fps) {
    const response = await fetch(`${ServerConfig.HTTP_BASE}user`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Auth.authToken}`
        },
        body: JSON.stringify({
            fps: fps
        })
    });
    const data = await response.json();
    if (data.success) {
        Auth.options.fps = fps;
        if (window.gameBoard) {
            window.gameBoard.setFPS(fps);
        } else {
            console.error('❌ GameBoard3D non trouvé');
        }
        console.log('✅ Qualité graphique mise à jour sur le serveur');
    } else {
        console.error('❌ Erreur lors de la mise à jour de la qualité graphique:', data);
    }
}

export async function handleRenderScaleChange(renderScale) {
    const response = await fetch(`${ServerConfig.HTTP_BASE}user`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Auth.authToken}`
        },
        body: JSON.stringify({
            render_scale: renderScale
        })
    });
    const data = await response.json();
    if (data.success) {
        Auth.options.resolutionScale = parseFloat(renderScale);
        
        if (window.gameBoard) {
            window.gameBoard.setResolutionScale(parseFloat(renderScale));
        } else {
            console.error('❌ GameBoard3D non trouvé');
        }
        console.log('✅ Qualité de rendu mise à jour sur le serveur');
    } else {
        console.error('❌ Erreur lors de la mise à jour de la qualité de rendu:', data);
    }
}

export async function handleShadowRealtimeChange(shadowRealtime) {
    const shadowRealtimeBool = shadowRealtime === 'true';
    const response = await fetch(`${ServerConfig.HTTP_BASE}user`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Auth.authToken}`
        },
        body: JSON.stringify({
            shadow_realtime: shadowRealtimeBool
        })
    });
    const data = await response.json();
    if (data.success) {
        Auth.options.shadowRealtime = shadowRealtimeBool;
        
        if (window.gameBoard && window.gameBoard.shadowManager) {
            window.gameBoard.shadowManager.setShadowRealtime(shadowRealtimeBool);
        } else {
            console.error('❌ GameBoard3D ou ShadowManager non trouvé');
        }
        console.log('✅ Mise à jour des ombres modifiée sur le serveur');
    } else {
        console.error('❌ Erreur lors de la modification de la mise à jour des ombres:', data);
    }
}

// Page des options
export const OptionsPage = {
    // Afficher la page
    async show(data = {}) {
        const html = this.renderHTML();
        document.getElementById('app').innerHTML = html;
        loadCSS('css/options.css');
        this.setupEvents();
        this.loadCurrentSettings();
        this.loadCurrentFPS();
    },

    // Générer le HTML avec les traductions
    renderHTML() {
        return `
            <div class="options-page">
                <h2 id="options-title">${i18n.t('options.title')}</h2>
                
                <div class="options-list">
                    <div class="option-item">
                        <label for="language-select">${i18n.t('options.language')}</label>
                        <select id="language-select" class="option-select">
                            <option value="fr">Français</option>
                            <option value="en">English</option>
                            <option value="zh">中文</option>
                            <option value="ja">日本語</option>
                            <option value="ko">한국어</option>
                            <option value="de">Deutsch</option>
                            <option value="es">Español</option>
                            <option value="pt">Português</option>
                            <option value="ru">Русский</option>
                            <option value="it">Italiano</option>
                        </select>
                    </div>
                    
                    <div class="option-item">
                        <label for="graphics-quality">${i18n.t('options.graphics_quality')}</label>
                        <select id="graphics-quality" class="option-select">
                            <option value="20">20</option>
                            <option value="30">30</option>
                            <option value="60">60</option>
                        </select>
                    </div>
                    
                    <div class="option-item">
                        <label for="render-quality">${i18n.t('options.render_quality')}</label>
                        <select id="render-quality" class="option-select">
                            <option value="1">${i18n.t('options.render_quality_high')}</option>
                            <option value="0.66">${i18n.t('options.render_quality_medium')}</option>
                            <option value="0.45">${i18n.t('options.render_quality_low')}</option>
                        </select>
                    </div>
                    
                    <div class="option-item">
                        <label for="shadow-realtime">${i18n.t('options.shadow_update')}</label>
                        <select id="shadow-realtime" class="option-select">
                            <option value="true">${i18n.t('options.shadow_realtime')}</option>
                            <option value="false">${i18n.t('options.shadow_every_5s')}</option>
                        </select>
                    </div>
                    
                    <button id="change-name-btn" class="option-btn btn">${i18n.t('options.change_name')}</button>
                    
                    <button id="change-password-btn" class="option-btn btn">${i18n.t('options.change_password')}</button>
                    
                    <button id="logout-btn" class="option-btn logout-btn btn">${i18n.t('options.logout')}</button>
                    
                    <button id="delete-account-btn" class="option-btn delete-account-btn btn">${i18n.t('options.delete_account')}</button>
                </div>
                
                <button id="back-to-game-menu" class="back-btn btn">${i18n.t('common.previous')}</button>
            </div>
        `;
    },

    

    // Configurer les événements
    setupEvents() {
        // Changement de langue
        document.getElementById('language-select')?.addEventListener('change', async (e) => {
            const newLanguage = e.target.value;
            await handleLanguageChange(newLanguage, {
                onSuccess: () => {
                    // Recharger la page des options pour mettre à jour les traductions
                    this.show();
                },
                onError: (error) => {
                    alert(`❌ Erreur lors du changement de langue: ${error}`);
                }
            });
        });

        // Changer de nom
        document.getElementById('change-name-btn')?.addEventListener('click', () => {
            Router.navigateTo('change-name');
        });

        // Changer de mot de passe
        document.getElementById('change-password-btn')?.addEventListener('click', () => {
            Router.navigateTo('change-password');
        });

        // Changement de qualité graphique
        document.getElementById('graphics-quality')?.addEventListener('change', async (e) => {
            // Envoyer la requête au serveur pour mettre à jour la qualité graphique de l'utilisateur
            await handleFPSChange(e.target.value)
        });

        // Changement de qualité de rendu
        document.getElementById('render-quality')?.addEventListener('change', async (e) => {
            // Envoyer la requête au serveur pour mettre à jour la qualité de rendu de l'utilisateur
            await handleRenderScaleChange(e.target.value)
        });

        // Changement de mise à jour des ombres
        document.getElementById('shadow-realtime')?.addEventListener('change', async (e) => {
            // Envoyer la requête au serveur pour mettre à jour la mise à jour des ombres
            await handleShadowRealtimeChange(e.target.value)
        });



        // Activation des ombres
        document.getElementById('enable-shadows')?.addEventListener('change', (e) => {
            console.log('💡 Ombres:', e.target.checked ? 'activées' : 'désactivées');
            // TODO: Implémenter l'activation des ombres
        });

        // Déconnexion
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (confirm(i18n.t('auth.logout_confirm'))) {
                Auth.logout();
            }
        });

        // Supprimer le compte
        document.getElementById('delete-account-btn')?.addEventListener('click', () => {
            Router.navigateTo('delete-account');
        });

        // Bouton précédent
        document.getElementById('back-to-game-menu')?.addEventListener('click', () => {
            Router.goBack();
        });
    },

    // Charger les paramètres actuels
    loadCurrentSettings() {
        console.log('📥 Chargement des paramètres');
        
        // Charger la langue actuelle
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            const currentLanguage = i18n.getLanguage();
            languageSelect.value = currentLanguage;
            console.log(`🌍 Langue actuelle: ${currentLanguage}`);
        }
    },

    // Charger la qualité graphique actuelle
    loadCurrentFPS() {
        const fpsSelect = document.getElementById('graphics-quality');
        if (fpsSelect) {
            fpsSelect.value = String(Auth.options.fps);
            console.log('🎨 Qualité graphique actuelle:', Auth.options.fps);
        }
        
        const renderScaleSelect = document.getElementById('render-quality');
        if (renderScaleSelect) {
            const currentValue = Auth.options.resolutionScale || 1;
            // Normaliser la valeur pour correspondre aux options du select
            const normalizedValue = parseFloat(currentValue).toString();

            renderScaleSelect.value = normalizedValue;

        }
        
        const shadowRealtimeSelect = document.getElementById('shadow-realtime');
        if (shadowRealtimeSelect) {
            shadowRealtimeSelect.value = String(Auth.options.shadowRealtime !== false);
            console.log('🎨 Mise à jour des ombres actuelle:', Auth.options.shadowRealtime);
        }
    }
};

