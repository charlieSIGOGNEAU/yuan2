// Point d'entree principal avec ES6 modules
console.log('Chargement de l\'application...');

// Importer le router et toutes les pages
import { Router } from './app/router.js';
import { Auth } from './app/auth.js';
import { WebSocketClient } from './app/websocket.js';

// Pages d'authentification
import { LandingPage } from './app/landing.js';
import { GoogleLoginPage } from './app/googleLogin.js';
import { EmailLoginPage } from './app/emailLogin.js';
import { SignupPage } from './app/signup.js';

// Pages de jeu
import { GameMenuPage } from './app/gameMenu.js';
import { JoinQuickGamePage } from './app/joinQuickGame.js';
import { CreateQuickGamePage } from './app/createQuickGame.js';

// Pages d'options
import { OptionsPage } from './app/options.js';
import { ChangeNamePage } from './app/changeName.js';
import { DeleteAccountPage } from './app/deleteAccount.js';

// Enregistrer toutes les pages dans le router
Router.registerPage('landing', LandingPage);
Router.registerPage('google-login', GoogleLoginPage);
Router.registerPage('email-login', EmailLoginPage);
Router.registerPage('signup', SignupPage);
Router.registerPage('game-menu', GameMenuPage);
Router.registerPage('join-quick-game', JoinQuickGamePage);
Router.registerPage('create-quick-game', CreateQuickGamePage);
Router.registerPage('options', OptionsPage);
Router.registerPage('change-name', ChangeNamePage);
Router.registerPage('delete-account', DeleteAccountPage);

// Initialiser le router
Router.init();

// DEMARRER L'APPLICATION
console.log('Application chargee ! Demarrage...');
Auth.init(); 