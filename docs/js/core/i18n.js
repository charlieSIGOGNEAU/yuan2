// Gestionnaire de traductions (i18n)
export class I18nManager {
    constructor() {
        this.currentLanguage = 'fr'; // Langue par défaut
        this.translations = {}; // Cache des traductions chargées
        this.loadedLanguages = new Set(); // Langues déjà chargées
    }

    // Définir la langue courante de l'utilisateur
    setLanguage(language) {
        this.currentLanguage = language;
        console.log(`🌍 Langue définie: ${language}`);
    }

    // Récupérer la langue courante
    getLanguage() {
        return this.currentLanguage;
    }

    // Charger les traductions pour une langue donnée
    async loadLanguage(language) {
        if (this.loadedLanguages.has(language)) {
            console.log(`🌍 Langue ${language} déjà chargée`);
            return;
        }

        try {
            console.log(`🌍 Chargement des traductions pour: ${language}`);
            const response = await fetch(`./locales/${language}.json?v=${Date.now()}`);
            
            if (!response.ok) {
                throw new Error(`Fichier de langue ${language} non trouvé`);
            }
            
            const translations = await response.json();
            this.translations[language] = translations;
            this.loadedLanguages.add(language);
            
            console.log(`✅ Traductions ${language} chargées:`, Object.keys(translations).length, 'clés');
            
        } catch (error) {
            console.error(`❌ Erreur lors du chargement de la langue ${language}:`, error);
            
            // Fallback vers le français si une langue échoue
            if (language !== 'fr') {
                console.log('🔄 Fallback vers le français');
                await this.loadLanguage('fr');
            }
        }
    }

    // Récupérer une traduction par sa clé
    t(key, params = {}) {
        const language = this.currentLanguage;
        
        // Vérifier si la langue est chargée
        if (!this.loadedLanguages.has(language)) {
            console.warn(`⚠️ Langue ${language} non chargée, clé: ${key}`);
            return key; // Retourner la clé si la langue n'est pas chargée
        }

        // Naviguer dans l'objet de traductions avec des clés séparées par des points
        const keys = key.split('.');
        let translation = this.translations[language];
        
        for (const k of keys) {
            if (translation && typeof translation === 'object' && k in translation) {
                translation = translation[k];
            } else {
                console.warn(`⚠️ Traduction non trouvée pour "${key}" en ${language}`);
                return key; // Retourner la clé si la traduction n'existe pas
            }
        }

        // Remplacer les paramètres dans la traduction si c'est une chaîne
        if (typeof translation === 'string') {
            return this.interpolate(translation, params);
        }

        console.warn(`⚠️ Traduction non valide pour "${key}" en ${language}`);
        return key;
    }

    // Remplacer les paramètres dans une chaîne de traduction
    interpolate(text, params) {
        return text.replace(/\{\{(\w+)\}\}/g, (match, param) => {
            return params[param] !== undefined ? params[param] : match;
        });
    }

    // Initialiser le système de traductions avec une langue
    async initialize(language = 'fr') {
        this.setLanguage(language);
        await this.loadLanguage(language);
    }

    // Détecter la langue du navigateur et fallback sur les langues supportées
    detectBrowserLanguage() {
        const supportedLanguages = ['fr', 'en', 'zh', 'ja', 'ko', 'de', 'es', 'pt', 'ru', 'it'];
        
        // Récupérer la langue du navigateur
        const browserLang = navigator.language || navigator.userLanguage;
        console.log('🌍 Langue du navigateur détectée:', browserLang);
        
        // Extraire le code langue (ex: "fr-FR" -> "fr")
        const langCode = browserLang.split('-')[0].toLowerCase();
        
        // Vérifier si la langue est supportée
        if (supportedLanguages.includes(langCode)) {
            console.log('✅ Langue supportée:', langCode);
            return langCode;
        }
        
        // Fallback sur l'anglais
        console.log('🔄 Langue non supportée, fallback vers anglais');
        return 'en';
    }

    // Initialiser avec la langue du navigateur (pour les pages d'authentification)
    async initializeWithBrowserLanguage() {
        const language = this.detectBrowserLanguage();
        console.log('🚀 Initialisation i18n avec la langue du navigateur:', language);
        await this.initialize(language);
    }
}

// Instance unique du gestionnaire de traductions
export const i18n = new I18nManager(); 