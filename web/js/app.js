// Variables globales
let currentUser = null;
let authToken = null;

// Configuration de l'API
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Application web initialisée');
    
    // Charger le partial du formulaire
    loadLoginForm();
    
    // Vérifier si un token existe déjà
    checkExistingAuth();
});

// Charger le partial du formulaire de connexion
async function loadLoginForm() {
    try {
        const response = await fetch('partials/login-form.html');
        const html = await response.text();
        document.getElementById('login-form-container').innerHTML = html;
        
        console.log('📋 Partial du formulaire chargé');
        
        // Configurer les gestionnaires d'événements après le chargement
        setupEventListeners();
    } catch (error) {
        console.error('❌ Erreur chargement partial:', error);
        // Fallback: créer le formulaire dynamiquement
        createLoginFormFallback();
        setupEventListeners();
    }
}

// Fallback si le partial ne se charge pas
function createLoginFormFallback() {
    const container = document.getElementById('login-form-container');
    container.innerHTML = `
        <div id="login-section">
            <h2>Connexion</h2>
            <form id="login-form">
                <div>
                    <label for="username">Nom d'utilisateur:</label>
                    <input type="text" id="username" name="name" required>
                </div>
                <button type="submit">Se connecter</button>
            </form>
        </div>

        <div id="user-section" style="display: none;">
            <h2>Bienvenue <span id="user-name"></span>!</h2>
            <p>Token JWT généré avec succès.</p>
            <button id="logout-btn">Se déconnecter</button>
        </div>
    `;
}

// Vérifier s'il y a déjà une authentification
function checkExistingAuth() {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
        console.log('🔍 Token trouvé dans localStorage, vérification...');
        authToken = savedToken;
        verifyToken();
    }
}

// Configuration des gestionnaires d'événements
function setupEventListeners() {
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('🎯 Gestionnaire de connexion configuré');
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
        console.log('🎯 Gestionnaire de déconnexion configuré');
    }
}

// Gestion de la connexion
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const name = formData.get('name');
    
    if (!name || name.trim() === '') {
        console.error('❌ Nom d\'utilisateur requis');
        alert('Veuillez entrer un nom d\'utilisateur');
        return;
    }
    
    console.log(`🔐 Tentative de connexion avec: ${name}`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: name.trim() })
        });
        
        const data = await response.json();
        console.log('📡 Réponse du serveur:', data);
        
        if (data.success) {
            console.log('✅ Connexion réussie');
            authToken = data.token;
            currentUser = data.user;
            
            // Sauvegarder le token
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Afficher l'interface utilisateur connecté
            showUserInterface();
        } else {
            console.error('❌ Erreur de connexion:', data.message);
            alert('Erreur de connexion: ' + data.message);
        }
    } catch (error) {
        console.error('❌ Erreur réseau:', error);
        alert('Erreur de connexion au serveur');
    }
}

// Vérifier la validité du token
async function verifyToken() {
    if (!authToken) {
        showLoginInterface();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('🔍 Vérification token:', data);
        
        if (data.success) {
            console.log('✅ Token valide');
            currentUser = data.user;
            showUserInterface();
        } else {
            console.log('❌ Token invalide');
            clearAuth();
            showLoginInterface();
        }
    } catch (error) {
        console.error('❌ Erreur vérification token:', error);
        clearAuth();
        showLoginInterface();
    }
}

// Afficher l'interface de connexion
function showLoginInterface() {
    const loginSection = document.getElementById('login-section');
    const userSection = document.getElementById('user-section');
    
    if (loginSection) loginSection.style.display = 'block';
    if (userSection) userSection.style.display = 'none';
    
    console.log('👋 Interface de connexion affichée');
}

// Afficher l'interface utilisateur connecté
function showUserInterface() {
    const loginSection = document.getElementById('login-section');
    const userSection = document.getElementById('user-section');
    const userNameSpan = document.getElementById('user-name');
    
    if (loginSection) loginSection.style.display = 'none';
    if (userSection) userSection.style.display = 'block';
    if (userNameSpan && currentUser) userNameSpan.textContent = currentUser.name;
    
    console.log(`👤 Interface utilisateur affichée pour: ${currentUser?.name}`);
}

// Gestion de la déconnexion
function handleLogout() {
    console.log('🚪 Déconnexion...');
    clearAuth();
    showLoginInterface();
}

// Nettoyer l'authentification
function clearAuth() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    console.log('🧹 Authentification nettoyée');
} 