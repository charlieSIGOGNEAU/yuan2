// Point d'entree principal avec ES6 modules
console.log('Chargement de l\'application...');

// ne pas suprimer, permet de gerer les dependances circulaires
import { WebSocketClient } from './app/websocket.js';
import { Auth } from './app/auth.js';


// DEMARRER L'APPLICATION
console.log('Application chargee ! Demarrage...');
Auth.init(); 