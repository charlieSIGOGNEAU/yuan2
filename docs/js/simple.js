// Orchestrateur principal simple

// Fonctions utilitaires
export async function loadPartial(path) {
    // S'assurer que le chemin commence par / pour Vite
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    const response = await fetch(fullPath);
    return await response.text();
}

export function loadCSS(path) {
    // Supprimer l'ancien CSS de page s'il existe
    const oldLink = document.getElementById('page-css');
    if (oldLink) oldLink.remove();
    
    // Charger le nouveau CSS
    const link = document.createElement('link');
    link.id = 'page-css';
    link.rel = 'stylesheet';
    // S'assurer que le chemin commence par / pour Vite
    link.href = path.startsWith('/') ? path : `/${path}`;
    document.head.appendChild(link);
}

// Au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Application démarrée');
    // Auth.init(); // Afficher directement la page de login
}); 