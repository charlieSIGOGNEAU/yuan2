import { uiManager } from '../ui/UIManager.js';
import { gameState } from '../gameState.js';
import { biddingPhase } from './biddingPhase.js';
import * as THREE from 'three';

export const simultaneousPlayPhase = {
    // Stockage du cercle actuel (un seul à la fois)
    currentCircle: null, // { circle: THREE.Mesh, territory: Territory }
    
    simultaneousPlayPhase(gameBoard) {
        console.log('🎯 Exécution de la phase de simultaneous_play');

        // Récupérer le clan du joueur actuel
        gameState.game.setMyClanFromVictoryBidding(gameState.myGameUserId);
        
        // Afficher la barre d'information spécifique à cette phase
        uiManager.showSimultaneousPlayInfoBar();
        
        // Afficher la barre d'action à 6 cases
        uiManager.showPlayerActionBar();
        
        // Activer la détection de clic sur les territoires
        this.setupTerritoryClickDetection(gameBoard);
        
        // Vérifier s'il n'y a pas d'actions
        if (!gameState.game.actions || gameState.game.actions.length === 0) {
            console.log('🎯 Aucune action trouvée, traitement des biddings victorieux');
            this.processVictoryBiddings(gameBoard);
        }
    },

    // Configuration de la détection de clic sur les territoires
    setupTerritoryClickDetection(gameBoard) {
        console.log('🎯 Configuration de la détection de clic sur les territoires');
        
        // Définir le callback pour les clics
        const handleTerritoryClick = (hexCoords, worldPoint) => {
            console.log(`🎯 Clic détecté à (${hexCoords.q}, ${hexCoords.r})`);
            
            // Trouver le territoire à cette position
            const territory = gameState.game.territories.find(t => 
                t.position.q === hexCoords.q && t.position.r === hexCoords.r
            );
            
            if (!territory) {
                console.log('⚠️ Aucun territoire trouvé à cette position');
                return;
            }
            
            console.log(`📍 Territoire trouvé: type=${territory.type}, clan_id=${territory.clan_id}`);
            
            // Vérifier si le territoire est du bon type
            const validTypes = ['rice', 'plain', 'mine', 'forest'];
            
            if (validTypes.includes(territory.type)) {
                console.log(`✅ Territoire valide: ${territory.type}`);
                
                // Supprimer l'ancien cercle s'il existe
                if (this.currentCircle) {
                    console.log('🗑️ Suppression de l\'ancien cercle');
                    this.removeCurrentCircle(gameBoard);
                }
                
                // Créer le nouveau cercle
                console.log('🔵 Création d\'un nouveau cercle');
                this.createTerritoryCircle(gameBoard, territory);
                
            } else {
                console.log(`❌ Territoire invalide: type=${territory.type}`);
            }
        };

        // Utiliser le système de callback de GameBoard3D
        gameBoard.detectClickOnly(handleTerritoryClick);
        
        // Stocker la référence pour pouvoir la supprimer plus tard
        this.clickHandler = handleTerritoryClick;
        this.currentGameBoard = gameBoard;
        
        console.log('✅ Détection de clic sur les territoires activée');
    },

    // Créer un cercle sur un territoire
    createTerritoryCircle(gameBoard, territory) {
        if (!gameBoard) return;
        
        console.log(`🔵 Création d'un cercle pour le territoire ${territory.type} à (${territory.position.q}, ${territory.position.r})`);
        
        const circle = this.createCircle(gameBoard, territory.position);
        
        // Stocker le cercle avec son territoire associé
        this.currentCircle = {
            circle: circle,
            territory: territory
        };
        
        console.log(`✅ Cercle créé pour le territoire ${territory.type}`);
    },

    // Créer un cercle sur une position donnée (réutilisé de biddingPhase)
    createCircle(gameBoard, position) {
        const textureLoader = new THREE.TextureLoader();
        const geometry = new THREE.PlaneGeometry(1, 1);
        
        // Matériau avec transparence
        const material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            color: 0xffffff
        });
        
        const circle = new THREE.Mesh(geometry, material);
        
        // Charger la texture cercle
        textureLoader.load(
            './images/cercle.webp',
            (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                material.map = texture;
                material.needsUpdate = true;
            },
            undefined,
            (error) => console.warn('⚠️ Erreur chargement texture cercle:', error)
        );
        
        // Convertir position hexagonale en cartésienne
        const pos = gameBoard.hexToCartesian(position);
        circle.position.set(pos.x, 0.1, pos.z);
        circle.rotation.x = -Math.PI / 2; // Plat sur le sol
        
        // Ajouter au workplane
        gameBoard.workplane.add(circle);
        
        console.log(`🔵 Cercle créé à (${position.q}, ${position.r})`);
        return circle;
    },

    // Supprimer le cercle actuel
    removeCurrentCircle(gameBoard) {
        if (!gameBoard || !this.currentCircle) return;
        
        gameBoard.workplane.remove(this.currentCircle.circle);
        
        // Libérer les ressources
        if (this.currentCircle.circle.geometry) this.currentCircle.circle.geometry.dispose();
        if (this.currentCircle.circle.material) this.currentCircle.circle.material.dispose();
        
        console.log(`🗑️ Cercle supprimé pour le territoire ${this.currentCircle.territory.type}`);
        
        this.currentCircle = null;
    },

    // Obtenir le territoire du cercle actuel
    getCurrentTerritory() {
        return this.currentCircle ? this.currentCircle.territory : null;
    },

    // Nettoyer les ressources de la phase
    cleanupPhase() {
        if (this.currentGameBoard) {
            this.currentGameBoard.disableClickCallback();
            this.currentGameBoard = null;
        }
        this.clickHandler = null;
        
        // Supprimer le cercle actuel
        if (this.currentCircle) {
            this.removeCurrentCircle(this.currentGameBoard);
        }
    },

    async processVictoryBiddings(gameBoard) {
        console.log('🏆 Traitement des biddings victorieux');
        
        // 1. Supprimer les cercles de bidding
        biddingPhase.removeAllCircles(gameBoard);
        
        // 2. Récupérer tous les biddings victorieux
        const victoryBiddings = gameState.game.biddings.filter(bidding => bidding.victory === true);
        console.log(`🏆 ${victoryBiddings.length} biddings victorieux trouvés`);
        
        for (const bidding of victoryBiddings) {
            console.log(`🏆 Traitement du bidding victorieux: clan_id=${bidding.clan_id}, game_user_id=${bidding.game_user_id}`);
            
            // 3. Récupérer le clan correspondant
            const clan = gameState.game.clans.find(c => c.id === bidding.clan_id);
            if (!clan) {
                console.warn(`⚠️ Clan non trouvé pour clan_id=${bidding.clan_id}`);
                continue;
            }
            
            console.log(`🎨 Clan trouvé: ${clan.name} avec couleur ${clan.color}`);
            
            // 4. Mettre à jour available_chao du clan
            clan.available_chao = 6 - bidding.chao;
            console.log(`💰 Clan ${clan.name}: available_chao mis à jour à ${clan.available_chao} (6 - ${bidding.chao})`);
            
            // 5. Récupérer le territoire correspondant à la position du clan
            const territory = gameState.game.territories.find(t => 
                t.position.q === clan.start_q && 
                t.position.r === clan.start_r
            );
            
            if (!territory) {
                console.warn(`⚠️ Territoire non trouvé pour position (${clan.start_q}, ${clan.start_r})`);
                continue;
            }
            
            console.log(`📍 Territoire trouvé à (${territory.position.q}, ${territory.position.r})`);
            
            // 6. Mettre à jour le territoire
            territory.clan_id = clan.id;
            territory.construction_type = 'ville';
            territory.user_id = bidding.game_user_id;
            
            // 7. Créer la construction si gameBoard disponible
            if (gameBoard?.meepleManager) {
                console.log(`🏗️ Création de la ville pour le clan ${clan.name}`);
                await territory.createConstruction(gameBoard, gameBoard.meepleManager);
            } else {
                console.warn(`⚠️ gameBoard ou meepleManager non disponible pour créer la ville`);
            }
        }
        
        console.log('✅ Traitement des biddings victorieux terminé');
        
        // Incrémenter le tour de jeu simultané
        gameState.game.simultaneous_play_turn = 1;
        
        // Mettre à jour toutes les cases de la barre d'information
        uiManager.updateSimultaneousPlayInfoBar();
    }
}