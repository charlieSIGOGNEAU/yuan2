Yuan – Online Strategy Game (Production)

<video src="yuanVideo.mp4" controls autoplay muted loop width="600"></video>

Pensé et jouable sur smartphone ( portrait et paysage, contraintes d’écran réduites)

Yuan est un jeu de stratégie multijoueur en ligne, basé sur des règles complexes et des interactions simultanées entre joueurs.
Le projet a été mené en autonomie, de la conception des règles jusqu’au déploiement en production.
- Jeu en production : https://yuan-game.com
- Une partie rapide nécessite au moins 3 joueurs connectés simultanément


Contexte

Ce projet est l’adaptation numérique d’un jeu de société de stratégie que j’ai conçu, édité et commercialisé (version physique sortie en 2023).
La version en ligne vise à transposer fidèlement des règles métier denses, avec gestion des conflits, du temps simultané et des états partagés entre joueurs.

L’objectif principal du projet est le raisonnement, la robustesse logique et la synchronisation, plus que la performance graphique ou l’UX.


Architecture générale

Projet full-stack avec séparation claire front / back.

Backend :

 - Ruby on Rails (API only)
 - Base de données : postgreSQL
 - Transactions et verrous utilisés pour gérer :
   - accès concurrents
   - attribution des parties
   - cohérence des états de jeu
 - WebSockets (ActionCable) pour la synchronisation temps réel
 - Authentification (JWT + connexion Google)
 - Conteneurisation Docker

Frontend :

 - JavaScript vanilla (ES modules)
 - SPA avec router personnalisé
 - Rendu 3D temps réel via Three.js
 - Communication API + WebSocket
 - Build et dev server via Vite
 - Internationalisation simple basée sur fichiers JSON (i18n maison)



Ce que le projet démontre (profil raisonnement)

Règles métier complexes
 - Implémentation d’un moteur de règles non trivial (jeu type "diplomacy", phases simultanées, attaques en chaîne)
 - Traduction d’un système de jeu physique complexe en algorithmes robustes
 - Gestion d’états transitoires et dépendants (avant / pendant / après résolution)

Concurrence et synchronisation
 - Système de vérification bidirectionnelle des échanges front ↔ back
 - (accusé de réception + renvoi si absence de réponse)
 - Gestion des joueurs inactifs ou déconnectés
 - Utilisation explicite de transactions et de locks côté backend
 - Tests automatisés de race conditions (multi-threads, verrous, transactions) : [Race condition tests](api/test/models/race_condition_test.rb#L1)


Choix techniques orientés charge et cohérence
 - Timers gérés côté client avec vérification côté API pour limiter la charge serveur
 - Centralisation minimale du back : le serveur valide, le client orchestre
 - Logique métier concentrée là où elle est la plus pertinente

Structuration et lisibilité
 - Séparation claire des responsabilités (phases de jeu, état global, rendu, API)
 - Code commenté aux étapes clés des algorithmes
 - Organisation pensée pour un projet long mené seul


3D et apprentissage multi-outils
 - Modélisation complète des éléments 3D réalisée avec Blender
 - Intégration et optimisation des scènes Three.js
 - Gestion manuelle des animations asynchrones et groupées
 - Choix techniques faits pour rester compatible avec les contraintes temps réel
Ces aspects ne sont pas centraux pour un profil back-end, mais illustrent une capacité à apprendre et utiliser plusieurs outils complexes en parallèle.

Limites assumées
 - Backend volontairement léger : la majorité de la complexité métier est côté client
 - Certains fichiers front sont trop volumineux et pourraient être davantage découpés
 - Stack choisie pour la vitesse d’itération plutôt que pour un cadre industriel strict

---

État du projet

Le projet est fonctionnel, déployé et jouable, mais reste un projet d’auto-formation.
Les évolutions futures sont limitées afin de pouvoir me concentrer sur d’autres apprentissages et sur la recherche d’un poste.


Objectif professionnel

Ce projet vise à démontrer ma capacité à :
 - raisonner sur des systèmes complexes,
 - faire des choix techniques cohérents sans cadre imposé,
 - devenir rapidement opérationnel sur des problématiques back-end, données et synchronisation.

Je recherche aujourd’hui un environnement technique exigeant, orienté backend / architecture / raisonnement, avec un profil volontairement junior mais à fort potentiel de progression.
