/**
 * Utilitaire pour charger les assets de manière compatible avec Vite
 * 
 * IMPORTANT : Ce fichier fonctionne AVANT et APRÈS la migration vers Vite
 * - Sans Vite : utilise fetch() avec chemins relatifs depuis /docs
 * - Avec Vite : utilisera import.meta.glob pour un chargement optimisé
 * 
 * Vite gère les assets de deux façons :
 * 1. Assets dans public/ : accessibles via des chemins absolus (/assets/...)
 * 2. Assets importés : via import.meta.url ou imports statiques
 */

/**
 * Détecte si on est dans un environnement Vite
 * @returns {boolean} true si Vite est disponible
 */
function isViteEnvironment() {
    // import.meta.glob est une fonctionnalité spécifique à Vite
    return typeof import.meta !== 'undefined' && 
           typeof import.meta.glob === 'function';
}

/**
 * Convertit un chemin relatif en URL absolue compatible avec Vite
 * @param {string} path - Chemin relatif (ex: './glb/meeple/ville.glb')
 * @returns {string} URL absolue (ex: '/docs/glb/meeple/ville.glb' sans Vite, '/glb/meeple/ville.glb' avec Vite)
 */
export function getAssetUrl(path) {
    // Si le chemin commence déjà par /, le retourner tel quel
    if (path.startsWith('/')) {
        return path;
    }
    
    // Supprimer le préfixe ./ si présent
    const cleanPath = path.replace(/^\.\//, '');
    
    // Si on est dans un environnement Vite, retourner un chemin depuis la racine
    // Sinon, retourner un chemin depuis /docs (structure actuelle)
    if (isViteEnvironment()) {
        return `/${cleanPath}`;
    } else {
        // Sans Vite, tout est dans /docs
        return `/docs/${cleanPath}`;
    }
}

/**
 * Charge un fichier JSON de traduction
 * Compatible avec Vite (via import.meta.glob) et sans Vite (via fetch)
 * @param {string} language - Code langue (ex: 'fr', 'en')
 * @returns {Promise<Object>} Objet de traductions
 */
export async function loadTranslation(language) {
    try {
        // Le plugin Vite sert les JSON correctement, donc on peut utiliser fetch directement
        // Avec Vite : /locales/... (depuis la racine docs/)
        // Sans Vite : /docs/locales/...
        const url = isViteEnvironment() 
            ? `/locales/${language}.json`
            : `/docs/locales/${language}.json?v=${Date.now()}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Fichier de langue ${language} non trouvé (${response.status})`);
        }
        
        // Vérifier que la réponse est bien du JSON (le plugin Vite devrait le garantir)
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/json')) {
            // Si ce n'est pas du JSON, cloner la réponse pour lire le texte
            const clonedResponse = response.clone();
            const text = await clonedResponse.text();
            console.error(`❌ Réponse non-JSON pour ${language}:`, text.substring(0, 200));
            console.error(`   URL: ${url}`);
            console.error(`   Content-Type: ${contentType}`);
            throw new Error(`Réponse n'est pas du JSON pour ${language}. Type: ${contentType}. URL: ${url}`);
        }
        
        const translations = await response.json();
        return translations;
    } catch (error) {
        console.error(`Erreur lors du chargement de la langue ${language}:`, error);
        throw error;
    }
}

/**
 * Précharge tous les fichiers de traduction disponibles
 * @returns {Promise<Map<string, Object>>} Map des traductions chargées
 */
export async function preloadAllTranslations() {
    const translations = new Map();
    
    // Liste des langues supportées
    const supportedLanguages = ['fr', 'en', 'zh', 'ja', 'ko', 'de', 'es', 'pt', 'ru', 'it'];
    
    if (isViteEnvironment()) {
        // Avec Vite, utiliser import.meta.glob
        const translationModules = import.meta.glob('/locales/*.json', { 
            eager: false 
        });
        
        for (const [path, loader] of Object.entries(translationModules)) {
            const language = path.match(/\/([^/]+)\.json$/)?.[1];
            if (language) {
                try {
                    const module = await loader();
                    translations.set(language, module.default || module);
                } catch (error) {
                    console.warn(`Impossible de charger ${path}:`, error);
                }
            }
        }
    } else {
        // Sans Vite, charger toutes les langues via fetch
        const loadPromises = supportedLanguages.map(async (language) => {
            try {
                const url = `/docs/locales/${language}.json?v=${Date.now()}`;
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    return { language, data };
                }
            } catch (error) {
                console.warn(`Impossible de charger la langue ${language}:`, error);
            }
            return null;
        });
        
        const results = await Promise.all(loadPromises);
        results.forEach(result => {
            if (result) {
                translations.set(result.language, result.data);
            }
        });
    }
    
    return translations;
}

