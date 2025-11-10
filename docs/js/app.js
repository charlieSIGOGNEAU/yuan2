// Point d'entree principal avec ES6 modules
console.log('Chargement de l\'application...');

// Importer le router et toutes les pages
import { Router } from './app/router.js';
import { Auth } from './app/auth.js';
import { i18n } from './core/i18n.js';

// Pages d'authentification
import { LandingPage } from './app/landing.js';
import { GoogleLoginPage } from './app/googleLogin.js';
import { EmailLoginPage } from './app/emailLogin.js';
import { SignupPage } from './app/signup.js';

// Pages de jeu
import { GameMenuPage } from './app/gameMenu.js';
import { JoinQuickGamePage } from './app/joinQuickGame.js';
// import { CreateQuickGamePage } from './app/createQuickGame.js';
import { PlayerWaitingPage } from './app/playerWaiting.js';

// Pages d'options
import { OptionsPage } from './app/options.js';
import { ChangeNamePage } from './app/changeName.js';
import { ChangePasswordPage } from './app/changePassword.js';
import { DeleteAccountPage } from './app/deleteAccount.js';

// Enregistrer toutes les pages dans le router
Router.registerPage('landing', LandingPage);
Router.registerPage('google-login', GoogleLoginPage);
Router.registerPage('email-login', EmailLoginPage);
Router.registerPage('signup', SignupPage);
Router.registerPage('game-menu', GameMenuPage);
Router.registerPage('join-quick-game', JoinQuickGamePage);
// Router.registerPage('create-quick-game', CreateQuickGamePage);
Router.registerPage('options', OptionsPage);
Router.registerPage('change-name', ChangeNamePage);
Router.registerPage('change-password', ChangePasswordPage);
Router.registerPage('delete-account', DeleteAccountPage);
Router.registerPage('player-waiting', PlayerWaitingPage);

// Initialiser le router
Router.init();

// DEMARRER L'APPLICATION
console.log('Application chargee ! Demarrage...');

// Initialiser i18n avec la langue du navigateur avant de démarrer l'application
(async () => {
    console.log('🌍 Initialisation de i18n avec la langue du navigateur...');
    await i18n.initializeWithBrowserLanguage();
    console.log('✅ i18n initialisé, démarrage de l\'application...');
    Auth.init();
})(); 

// Fonction pour gérer le plein écran
const allDiv = document.getElementById('all');
const btn = document.getElementById('fullscreen-toggle');
const body = document.body;
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Masquer le bouton sur iOS (pas de fullscreen)
if (isIOS()) {
  btn.style.display = 'none';
} else {
  btn.addEventListener('click', () => {
    const fsElement =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    if (!fsElement) {
      // Entrer en plein écran
      if (allDiv.requestFullscreen) allDiv.requestFullscreen();
      else if (allDiv.webkitRequestFullscreen) allDiv.webkitRequestFullscreen();
      else if (allDiv.mozRequestFullScreen) allDiv.mozRequestFullScreen();
      else if (allDiv.msRequestFullscreen) allDiv.msRequestFullscreen();
      body.style.height = '99dvh';
      body.style.height = '100dvh';
    } else {
      // Sortir du plein écran
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
      body.style.height = '99dvh';
      body.style.height = '100dvh';
    }
  });

  // Mettre à jour le style du bouton quand le plein écran change
  function updateBtn() {
    const fsElement =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;
    btn.textContent = '⛶'; // tu peux changer le symbole si tu veux
    btn.title = fsElement ? 'Quitter le plein écran' : 'Mode plein écran';
  }

  ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(event =>
    document.addEventListener(event, updateBtn)
  );
}