import { gameState } from '../../gameState.js';
import * as THREE from 'three';

export const developpementAndMore = {
    // === FONCTIONS PRINCIPALES ===
    annimation: true,
    gameBoard: null,
    pathSprites: [], // Stockage des sprites de chemin
    
    developpement(gameBoard, processedTurns) {
        this.gameBoard = gameBoard;
        this.assigneDevelopmentPhase(processedTurns);
    },

    // Fonction pour traiter une action de développement
    processDevelopmentAction(action) {
        // Récupérer le territoire des coordonnées de l'action
        const territory = gameState.getTerritoryByPosition(action.position_q, action.position_r);
        if (!territory) {
            console.log(`❌ Territoire non trouvé aux coordonnées (${action.position_q}, ${action.position_r})`);
            return;
        }

        // Récupérer le clan_id du game_user_id
        const userClanId = gameState.getClanIdByGameUserId(action.game_user_id);
        if (!userClanId) {
            console.log(`❌ Clan non trouvé pour game_user_id=${action.game_user_id}`);
            return;
        }

        // Si developpement_level = 0, ne rien faire
        if (action.developpement_level === 0) {
            return;
        }

        // Gestion des différents cas
        if (action.developpement_level !== 0) {
            // Cas 1: Le territoire a le même clan_id
            if (territory.clan_id === userClanId) {
                action.development_type = "expantion";
                console.log(`✅ Action d'expansion définie pour territoire (${action.position_q}, ${action.position_r})`);
                return;
            }

            // Cas 2 et 3: Le territoire n'a pas de clan_id renseigné
            if (!territory.clan_id && ['forest', 'rice', 'mine', 'plain'].includes(territory.type)) {
                // Cas 2: developpement_level = 3
                if (action.developpement_level === 3) {
                    action.development_type = "colonisation";
                    console.log(`✅ Action de colonisation (niveau 3) définie pour territoire (${action.position_q}, ${action.position_r})`);
                    return;
                }

                // Cas 3: developpement_level = 1 ou 2 avec territoire connecté
                if (action.developpement_level === 1 || action.developpement_level === 2) {
                    // Vérifier si territory.connectedProvinces possède au moins un territoire avec le bon clan_id
                    const hasConnectedClanTerritory = territory.connectedProvinces.some(connectedTerritory => 
                        connectedTerritory.clan_id === userClanId
                    );

                    if (hasConnectedClanTerritory) {
                        action.development_type = "colonisation";
                        console.log(`✅ Action de colonisation (niveau ${action.developpement_level}) définie pour territoire (${action.position_q}, ${action.position_r})`);
                        return;
                    }
                }
            }
        }

        // Cas par défaut: action non conforme
        console.log(`❌ Action non conforme: game_user_id=${action.game_user_id}, territoire=(${action.position_q}, ${action.position_r}), level=${action.developpement_level}, territoire.clan_id=${territory.clan_id}, territoire.type=${territory.type}`);
    },

    assigneDevelopmentPhase(processedTurns) {
        console.log(`🔄 Traitement des actions de développement pour le tour ${processedTurns}`);
        
        // Récupérer toutes les actions du tour spécifié
        const actionsOfTurn = gameState.game.actions.filter(action => action.turn === processedTurns);
        
        console.log(`📋 ${actionsOfTurn.length} actions trouvées pour le tour ${processedTurns}`);
        
        // Exécuter la fonction pour toutes les actions du tour
        for (const action of actionsOfTurn) {
            this.processDevelopmentAction(action);
        }
        
        console.log(`✅ Traitement des actions de développement terminé pour le tour ${processedTurns}`);
    },



    
    /**
     * Affiche des disques rouges aux positions du chemin trouvé par findShortestPathTo
     * @param {Array} territoryPath - Liste des territoires retournée par findShortestPathTo
     */
    async displayPathDiscs(territoryPath) {
        // Nettoyer les anciens sprites de chemin
        this.clearPathDiscs();

        if (!territoryPath || territoryPath.length === 0) {
            console.warn('❌ Aucun chemin fourni pour l\'affichage des disques');
            return;
        }

        if (!this.gameBoard) {
            console.warn('❌ GameBoard non disponible pour l\'affichage des disques');
            return;
        }

        console.log(`🔴 Affichage de ${territoryPath.length} disques rouges sur le chemin`);

        // Modifier les coordonnées du premier et dernier élément avec des barycentres pondérés
        const adjustedPositions = [];
        
        for (let i = 0; i < territoryPath.length; i++) {
            let adjustedPosition;
            
            if (i === 0 && territoryPath.length > 1) {
                // Premier élément : barycentre (1, 3) entre le 1er et 2ème territoire
                const pos1 = territoryPath[0].position;
                const pos2 = territoryPath[1].position;
                
                // Barycentre avec poids 3 pour pos1 et 1 pour pos2 : (1*pos1 + 3*pos2) / 4
                adjustedPosition = {
                    q: (3 * pos1.q + 1 * pos2.q) / 4,
                    r: (3 * pos1.r + 1 * pos2.r) / 4,
                    z: pos1.z || 0
                };
                
                console.log(`📍 Premier disque ajusté: (${pos1.q}, ${pos1.r}) -> (${adjustedPosition.q.toFixed(2)}, ${adjustedPosition.r.toFixed(2)})`);
                
            } else if (i === territoryPath.length - 1 && territoryPath.length > 1) {
                // Dernier élément : barycentre (3, 1) entre l'avant-dernier et dernier territoire
                const pos1 = territoryPath[territoryPath.length - 2].position;
                const pos2 = territoryPath[territoryPath.length - 1].position;
                
                // Barycentre avec poids 1 pour pos1 et 3 pour pos2 : (3*pos1 + 1*pos2) / 4
                adjustedPosition = {
                    q: (1 * pos1.q + 3 * pos2.q) / 4,
                    r: (1 * pos1.r + 3 * pos2.r) / 4,
                    z: pos2.z || 0
                };
                
                console.log(`📍 Dernier disque ajusté: (${pos2.q}, ${pos2.r}) -> (${adjustedPosition.q.toFixed(2)}, ${adjustedPosition.r.toFixed(2)})`);
                
            } else {
                // Éléments intermédiaires : position normale
                adjustedPosition = territoryPath[i].position;
            }
            
            adjustedPositions.push(adjustedPosition);
        }

        // Créer les disques de façon asynchrone pour optimiser les performances
        for (let i = 0; i < adjustedPositions.length; i++) {
            const position = adjustedPositions[i];
            const originalTerritory = territoryPath[i];
            
            // Convertir les coordonnées hexagonales en cartésiennes
            const cartesianPos = this.gameBoard.hexToCartesian(position);
            
            try {
                // Créer une instance de sprite via le MeepleManager (optimisé)
                const discSprite = await this.gameBoard.meepleManager.createSpriteInstance(
                    'pathDisc',
                    { x: cartesianPos.x, y: 0.1, z: cartesianPos.z },
                    0xff0000, // Rouge
                    { 
                        territoryQ: originalTerritory.position.q,
                        territoryR: originalTerritory.position.r,
                        adjustedQ: position.q,
                        adjustedR: position.r,
                        pathIndex: i
                    }
                );

                // Ajouter le sprite au workplane
                this.gameBoard.workplane.add(discSprite);
                
                // Stocker la référence pour pouvoir le supprimer plus tard
                this.pathSprites.push(discSprite);

                console.log(`✅ Disque ${i + 1}/${adjustedPositions.length} ajouté à la position (${position.q.toFixed(2)}, ${position.r.toFixed(2)}) -> cartésien (${cartesianPos.x.toFixed(2)}, 0.5, ${cartesianPos.z.toFixed(2)})`);
            } catch (error) {
                console.warn(`⚠️ Erreur lors de la création du disque ${i + 1}:`, error);
            }
        }

        console.log(`🎯 ${this.pathSprites.length} disques rouges affichés sur le chemin`);
    },

    /**
     * Supprime tous les disques de chemin affichés
     */
    clearPathDiscs() {
        if (this.pathSprites.length === 0) {
            return;
        }

        console.log(`🧹 Suppression de ${this.pathSprites.length} disques de chemin`);

        this.pathSprites.forEach(sprite => {
            // Supprimer du workplane
            this.gameBoard.workplane.remove(sprite);
            
            // Libérer la géométrie et le matériau
            if (sprite.geometry) {
                sprite.geometry.dispose();
            }
            if (sprite.material) {
                if (sprite.material.map) {
                    sprite.material.map.dispose();
                }
                sprite.material.dispose();
            }
        });

        // Vider le tableau
        this.pathSprites = [];
        console.log('✅ Tous les disques de chemin ont été supprimés');
    },
}
// pour le debug
window.developpementAndMore = developpementAndMore;