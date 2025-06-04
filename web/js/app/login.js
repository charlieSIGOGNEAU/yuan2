// Gestion page de connexion
const LoginPage = {
    // Afficher la page
    async show() {
        const html = await loadPartial('partials/login.html');
        document.getElementById('app').innerHTML = html;
        loadCSS('css/login.css');
        this.setupEvents();
    },

    // Configurer les événements
    setupEvents() {
        const form = document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', this.handleSubmit);
        }
    },

    // Gestion de la soumission
    async handleSubmit(e) {
        e.preventDefault();
        const name = e.target.name.value.trim();
        if (name) {
            await Auth.login(name);
        }
    }
}; 