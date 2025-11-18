/**
 * Plugin Vite pour servir les fichiers JSON depuis /locales/
 * 
 * Ce plugin intercepte les requêtes vers /locales/*.json AVANT que Vite
 * ne les traite comme des routes SPA (ce qui retournerait index.html)
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obtenir __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function jsonServerPlugin() {
    return {
        name: 'json-server',
        // S'exécuter en premier pour intercepter les JSON avant le middleware SPA
        enforce: 'pre',
        configureServer(server) {
            // Intercepter les requêtes vers /locales/*.json
            // On utilise un middleware qui s'exécute AVANT le middleware SPA de Vite
            return () => {
                server.middlewares.use((req, res, next) => {
                    // Si c'est une requête vers un fichier JSON dans locales/
                    if (req.url && req.url.startsWith('/locales/') && req.url.endsWith('.json')) {
                        try {
                            // Lire le fichier depuis le système de fichiers
                            // req.url commence par /locales/, donc on l'utilise directement
                            const filePath = resolve(__dirname, 'docs', req.url);
                            
                            if (!existsSync(filePath)) {
                                console.error(`❌ Fichier JSON non trouvé: ${filePath}`);
                                res.statusCode = 404;
                                res.end(JSON.stringify({ error: 'File not found' }));
                                return;
                            }
                            
                            const fileContent = readFileSync(filePath, 'utf-8');
                            
                            // Servir le fichier avec le bon content-type
                            res.setHeader('Content-Type', 'application/json; charset=utf-8');
                            res.setHeader('Cache-Control', 'no-cache');
                            res.end(fileContent);
                            return; // Ne pas appeler next() - on a déjà répondu
                        } catch (error) {
                            console.error(`❌ Erreur lors de la lecture de ${req.url}:`, error);
                            res.statusCode = 500;
                            res.end(JSON.stringify({ error: 'Internal server error' }));
                            return;
                        }
                    }
                    next(); // Continuer pour les autres requêtes
                });
            };
        }
    };
}
