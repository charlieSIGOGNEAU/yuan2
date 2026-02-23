# Yuan – Jeu de Stratégie en Ligne (Production)

[![Yuan démo 18 seconde](https://img.youtube.com/vi/vSdPwUxjG74/sddefault.jpg)](https://youtu.be/vSdPwUxjG74)

Cliquez sur l’image pour voir la vidéo du jeu en action (18 secondes). Pensé et jouable sur smartphone (portrait et paysage)

Yuan est un jeu de stratégie multijoueur en ligne, basé sur des règles complexes et des interactions simultanées entre joueurs.
Le projet a été mené en autonomie, de la conception des règles jusqu’au déploiement en production.

[**Jeu en production :**](https://yuan-game.com) Une partie rapide nécessite au moins 3 joueurs connectés simultanément


## Contexte 

Ce projet est l’adaptation numérique d’un jeu de société de stratégie que j’ai conçu (édité et commercialisé par Oka Luda, version physique sortie en 2023).
Ancien professeur de maths, j’ai appliqué une approche analytique pour transposer des règles complexes en algorithmes.
La version en ligne vise à transposer fidèlement des règles métier denses, avec gestion des conflits, du temps simultané et des états partagés entre joueurs.


## Architecture générale

 - **Backend :** Laravel 11 + Reverb (WebSockets), [transactions/locks](APILaravel/app/Actions/Games/LaunchCustomGame.php) pour la cohérence, JWT/Google Auth, [Form Requests](APILaravel/app/Http/Requests/ActionRequest.php) pour l'autorisation
 - **Frontend :** JS vanilla, SPA + router, 3D Three.js, Vite, i18n simple
 - **Évolution :** Après un 1er développement sous Rails, j'ai entièrement porté l'API vers Laravel 11 en 3 semaines (apprentissage php/laravel inclus). Ce second passage a permis d'affiner l'architecture (découpage en Actions, typage) grâce au recul acquis sur le premier développement.


## Ce que le projet démontre

- **Règles complexes** : moteur type “diplomacy”, phases simultanées, attaques en chaîne
- **Concurrence & synchronisation** : gestion déconnexions, [test rails race condition multi-threads](APIRails/test/models/race_condition_test.rb#L1) et [test laravel intégrité du Matchmaking](APILaravel/tests/Feature/Api/V1/Game/QuickGameTest.php#L1) et [protection contre les IDOR/Timing](APILaravel/tests/Feature/Api/V1/Game/StoreActionTest.php)
- **Choix techniques** : timers côté client, validation serveur, logique concentrée là où pertinent
- **Adaptabilité technique** : Apprentissage et portage rapide (Laravel). Logique métier complexe déportée dans le front pour un serveur léger.
- **3D & multi-outils** : Blender + Three.js, animations asynchrones, apprentissage rapide d’outils complexes


## État du projet & Méthode de travail

Ce projet a été réalisé suite à un bootcamp de 3 mois (je n’avais jamais codé auparavant). C'est un projet d’auto-formation de 6 mois, aujourd'hui fonctionnel et déployé. Certaines parties du front-end trahissent ce statut de premier projet (besoin de refactorisation et découpage).

**Architecture :** Choix volontaire d'un serveur léger pour la fluidité. La triche est détectée et signalée, mais non sanctionnée côté backend ; une évolution mise de côté pour privilégier l'apprentissage de nouveaux outils.

**Pour le portage rapide vers Laravel** j'ai utilisé l'IA comme support d'apprentissage pour migrer l'API. Je privilégie la compréhension profonde de chaque ligne intégrée plutôt que la génération automatisée, afin de maîtriser l'évolutivité du système et de pouvoir justifier chaque choix technique.



### Objectif professionnel

Ce projet vise à démontrer ma capacité à :
 - raisonner sur des systèmes complexes,
 - faire des choix techniques cohérents sans cadre imposé,
 - devenir rapidement opérationnel sur des problématiques back-end, données et synchronisation.

Je recherche aujourd’hui un environnement technique exigeant, orienté backend / architecture / raisonnement, avec un profil volontairement junior mais à fort potentiel de progression.
