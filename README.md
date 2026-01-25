# Yuan – Online Strategy Game (Production) 

<video src="yuanVideo.mp4" controls autoplay muted loop width="600"></video>

Pensé et jouable sur smartphone ( portrait et paysage, contraintes d’écran réduites)

Yuan est un jeu de stratégie multijoueur en ligne, basé sur des règles complexes et des interactions simultanées entre joueurs.
Le projet a été mené en autonomie, de la conception des règles jusqu’au déploiement en production.
- Jeu en production : https://yuan-game.com
- Une partie rapide nécessite au moins 3 joueurs connectés simultanément


# Contexte 

Ce projet est l’adaptation numérique d’un jeu de société de stratégie que j’ai conçu (édité et commercialisé par Oka Luda, version physique sortie en 2023).
Avant de coder, j’étais professeur de mathématiques, ce qui a façonné mon approche analytique et structurée pour transposer des règles complexes en algorithmes.
La version en ligne vise à transposer fidèlement des règles métier denses, avec gestion des conflits, du temps simultané et des états partagés entre joueurs.


Architecture générale

Projet full-stack avec séparation claire front / back.

Backend : 
 - Rails API
 - PostgreSQL
 - transactions/locks pour la cohérence
 - WebSockets, JWT/Google Auth
 - Docker

Frontend : JS vanilla
 - SPA + router
 - 3D Three.js
 - API + WebSocket
 - Vite
 - i18n simple


### Ce que le projet démontre (profil raisonnement)

- **Règles complexes** : moteur type “diplomacy”, phases simultanées, attaques en chaîne  
- **Concurrence & synchronisation** : échanges front↔back, gestion déconnexions, transactions/locks, [test race condition multi-threads](api/test/models/race_condition_test.rb#L1) 
- **Choix techniques** : timers côté client, validation serveur, logique concentrée là où pertinent  
- **Structuration** : séparation responsabilités, code commenté, organisation pour projet long mené seul  
- **3D & multi-outils** : Blender + Three.js, animations asynchrones, apprentissage rapide d’outils complexes


Limites assumées
 - Backend volontairement léger : la majorité de la complexité métier est côté client
 - Certains fichiers front sont trop volumineux et pourraient être davantage découpés
 - Stack choisie pour la vitesse d’itération plutôt que pour un cadre industriel strict

---

État du projet

Ce projet a été réalisé après un bootcamp de 3 mois ; je n’avais jamais codé auparavant. Fonctionnel, déployé et jouable, il reste un projet d’auto-formation de 6 mois, avec des évolutions futures limitées afin de me concentrer sur d’autres apprentissages et la recherche d’un poste.


Objectif professionnel

Ce projet vise à démontrer ma capacité à :
 - raisonner sur des systèmes complexes,
 - faire des choix techniques cohérents sans cadre imposé,
 - devenir rapidement opérationnel sur des problématiques back-end, données et synchronisation.

Je recherche aujourd’hui un environnement technique exigeant, orienté backend / architecture / raisonnement, avec un profil volontairement junior mais à fort potentiel de progression.
