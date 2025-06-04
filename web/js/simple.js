// Orchestrateur principal simple

// Fonctions utilitaires
async function loadPartial(path) {
    const response = await fetch(path);
    return await response.text();
}

function loadCSS(path) {
    // Supprimer l'ancien CSS de page s'il existe
    const oldLink = document.getElementById('page-css');
    if (oldLink) oldLink.remove();
    
    // Charger le nouveau CSS
    const link = document.createElement('link');
    link.id = 'page-css';
    link.rel = 'stylesheet';
    link.href = path;
    document.head.appendChild(link);
}

// Au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Application démarrée');
    Auth.init(); // Afficher directement la page de login
}); 