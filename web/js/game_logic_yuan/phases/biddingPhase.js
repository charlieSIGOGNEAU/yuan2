import { gameState } from '../gameState.js';
import { uiManager } from '../ui/UIManager.js';
import { i18n } from '../../core/i18n.js';
import * as THREE from 'three';

export const biddingPhase = {
    
    // Fonction principale pour gérer la phase de bidding
    async execute(gameBoard) {
        console.log('🎯 Démarrage de la phase bidding_phase');
        
        // Précharger les modèles nécessaires
        if (gameBoard?.meepleManager) {
            await gameBoard.meepleManager.preloadMeepleModel('ville');
            await gameBoard.meepleManager.preloadMeepleModel('guerrier');
            await gameBoard.meepleManager.preloadMeepleModel('fortification');
        }
        
        // Afficher les barres d'interface
        uiManager.updateInfoPanel(i18n.t('game.phases.bidding.instructions'));
        uiManager.showBiddingBar();
        setTimeout(() => uiManager.updateBiddingText(0, 6), 200);
        
        // Mettre à jour les territories et placer les villes
        await this.setupClanTerritories(gameBoard);
        
        // Placer des cercles sur les clans non utilisés
        await this.placeUnusedClanCircles(gameBoard);
        
        console.log('✅ Phase de bidding initialisée');
    },

    // Mettre à jour les territories avec les clans et placer les villes
    async setupClanTerritories(gameBoard) {
        const clans = gameState.game?.clans || [];
        const territories = gameState.game?.territories || [];
        
        for (const clan of clans) {
            // Trouver le territoire correspondant
            const territory = territories.find(t => 
                t.position.q === clan.start_q && t.position.r === clan.start_r
            );
            
            if (territory && territory.construction_type !== 'ville') {
                // Mettre à jour le territoire
                territory.color = clan.color || '#808080';
                territory.construction_type = 'ville';
                
                // Créer la ville si gameBoard disponible
                if (gameBoard?.meepleManager) {
                    territory.createConstruction(gameBoard, gameBoard.meepleManager);
                }
            }
        }
    },

    // Placer des cercles sur les positions des clans non utilisés
    async placeUnusedClanCircles(gameBoard) {
        if (!gameBoard) return;
        
        // Récupérer les clan_id des gameUsers
        const gameUsers = gameState.game?.gameUsers || [];
        const usedClanIds = gameUsers.map(user => user.clan_id).filter(id => id !== null);
        
        // Récupérer tous les clans
        const allClans = gameState.game?.clans || [];
        
        // Trouver les clans non utilisés
        const unusedClans = allClans.filter(clan => !usedClanIds.includes(clan.id));
        
        console.log(`🔍 Clans non utilisés: ${unusedClans.length}`);
        
        // Créer un cercle pour chaque clan non utilisé
        for (const clan of unusedClans) {
            this.createClanCircle(gameBoard, { q: clan.start_q, r: clan.start_r });
        }
    },

    // Créer un cercle sur une position donnée
    createClanCircle(gameBoard, position) {
        const textureLoader = new THREE.TextureLoader();
        const geometry = new THREE.PlaneGeometry(1, 1); // 1x1 comme demandé
        
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
        circle.position.set(pos.x, 0.1, pos.z); // Hauteur 0.1 comme modifié
        circle.rotation.x = -Math.PI / 2; // Plat sur le sol
        
        // Ajouter au workplane
        gameBoard.workplane.add(circle);
        
        console.log(`🔵 Cercle créé à (${position.q}, ${position.r})`);
    }
}; 