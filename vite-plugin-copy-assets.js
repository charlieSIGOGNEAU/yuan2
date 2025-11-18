/**
 * Plugin Vite pour copier les assets statiques lors du build
 * 
 * Copie les dossiers images/, glb/, locales/, police/, svg/ dans le build final
 */

import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Copie récursivement un dossier
 */
function copyDir(src, dest) {
    mkdirSync(dest, { recursive: true });
    const entries = readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            copyFileSync(srcPath, destPath);
        }
    }
}

export function copyAssetsPlugin() {
    return {
        name: 'copy-assets',
        buildStart() {
            // Ne rien faire en mode dev, les fichiers sont servis directement depuis docs/
        },
        writeBundle(options, bundle) {
            // Cette fonction est appelée après que tous les fichiers ont été écrits
            const outDir = options.dir || resolve(__dirname, 'dist');
            const docsDir = resolve(__dirname, 'docs');
            
            // Dossiers à copier
            const assetsDirs = ['images', 'glb', 'locales', 'police', 'svg', 'partials'];
            
            console.log('📦 Copie des assets statiques...');
            
            for (const dir of assetsDirs) {
                const srcPath = join(docsDir, dir);
                const destPath = join(outDir, dir);
                
                try {
                    if (statSync(srcPath).isDirectory()) {
                        copyDir(srcPath, destPath);
                        console.log(`  ✅ ${dir}/ copié`);
                    }
                } catch (error) {
                    // Le dossier n'existe pas, on continue
                    console.warn(`  ⚠️  ${dir}/ non trouvé, ignoré`);
                }
            }
            
            console.log('✅ Assets statiques copiés');
        }
    };
}

