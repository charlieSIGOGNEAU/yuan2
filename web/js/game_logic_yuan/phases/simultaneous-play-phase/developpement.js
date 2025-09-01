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

        // Créer une courbe lissée avec un nombre de points 
        const curvePointsCount = Math.round(10 * (adjustedPositions.length - 1) ); 
        const smoothCurvePositions = this.createSmoothCurve(adjustedPositions, curvePointsCount);

        console.log(`🌊 Courbe lissée créée avec ${smoothCurvePositions.length} points (${adjustedPositions.length} points originaux)`);

        // Afficher les points un par un avec animation
        this.animatePathDisplay(smoothCurvePositions);
    },

    /**
     * Anime l'affichage des points un par un pour créer l'effet de flèche qui grandit
     * @param {Array} smoothCurvePositions - Points de la courbe lissée
     */
    async animatePathDisplay(smoothCurvePositions) {
        console.log(`🎬 Début de l'animation: ${smoothCurvePositions.length} points à afficher`);
        
        for (let i = 0; i < smoothCurvePositions.length; i++) {
            const position = smoothCurvePositions[i];
            // Pour les points interpolés, on utilise des données génériques
            const isOriginalPoint = position.isOriginal || false;
            const originalIndex = position.originalIndex || -1;
            
            // Utiliser les coordonnées cartésiennes directement si disponibles
            const cartesianPos = position.cartesianX !== undefined ? 
                { x: position.cartesianX, y: 0.1, z: position.cartesianZ } :
                this.gameBoard.hexToCartesian(position);
            
            try {
                // Créer une instance de sprite carré orienté via le MeepleManager (optimisé)
                const discSprite = await this.gameBoard.meepleManager.createSpriteInstance(
                    'pathSquare', // Utiliser les carrés pleins
                    { x: cartesianPos.x, y: 0.05, z: cartesianPos.z },
                    0xff0000, // Rouge
                    { 
                        isOriginalPoint: isOriginalPoint,
                        originalIndex: originalIndex,
                        interpolatedQ: position.q,
                        interpolatedR: position.r,
                        curveIndex: i,
                        rotationY: position.rotationY || 0,
                        tangent: position.direction
                    },
                    position.rotationY || 0 // Rotation selon la direction de la courbe
                );

                // Ajouter le sprite au workplane
                this.gameBoard.workplane.add(discSprite);
                
                // Stocker la référence pour pouvoir le supprimer plus tard
                this.pathSprites.push(discSprite);

                const pointType = isOriginalPoint ? '🎯 ORIGINAL' : '🔗 INTERPOLÉ';
                const rotationDeg = ((position.rotationY || 0) * 180 / Math.PI).toFixed(1);
                console.log(`✅ Carré ${i + 1}/${smoothCurvePositions.length} ${pointType} ajouté à (${position.q.toFixed(2)}, ${position.r.toFixed(2)}) rotation: ${rotationDeg}°`);
                
                // Attendre 50ms avant d'afficher le prochain point
                if (i < smoothCurvePositions.length - 1) { // Pas d'attente après le dernier point
                    await new Promise(resolve => setTimeout(resolve, 20));
                }
                
            } catch (error) {
                console.warn(`⚠️ Erreur lors de la création du disque ${i + 1}:`, error);
            }
        }
        
        console.log(`🎯 Animation terminée: ${this.pathSprites.length} carrés rouges orientés affichés sur le chemin lissé`);
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

    /**
     * Crée une courbe lissée entre les points avec THREE.CatmullRomCurve3
     * @param {Array} positions - Liste des positions originales
     * @param {number} totalPoints - Nombre total de points sur la courbe
     * @returns {Array} Liste étendue avec points interpolés
     */
    createSmoothCurve(positions, totalPoints = 50) {
        if (positions.length < 2) {
            return positions.map((pos, index) => ({
                ...pos,
                isOriginal: true,
                originalIndex: index
            }));
        }

        // Convertir les positions hexagonales en coordonnées cartésiennes Three.js
        const cartesianPoints = positions.map(pos => {
            const cartesian = this.gameBoard.hexToCartesian(pos);
            return new THREE.Vector3(cartesian.x, 0.1, cartesian.z);
        });

        // Lisser les points intermédiaires (moyenne pondérée avec les voisins) pour éviter les angles
        const smoothedPoints = this.smoothControlPoints(cartesianPoints);

        // Créer une courbe Catmull-Rom qui passe par tous les points
        const curve = new THREE.CatmullRomCurve3(smoothedPoints, false); // false = courbe ouverte
        
        // Obtenir des points uniformément répartis sur la courbe
        const curvePoints = curve.getPoints(totalPoints);
        
        // Convertir les points Three.js en coordonnées avec direction calculée entre points
        const smoothPositions = curvePoints.map((point, index) => {
            // Conversion inverse approximative des coordonnées cartésiennes vers hexagonales
            const hexPos = this.cartesianToHex(point.x, point.z);
            
            // Calculer l'orientation basée sur les points précédent et suivant
            let directionX, directionZ;
            
            if (index === 0) {
                // Premier point : utiliser la direction vers le point suivant
                const nextPoint = curvePoints[1] || point;
                directionX = nextPoint.x - point.x;
                directionZ = nextPoint.z - point.z;
            } else if (index === curvePoints.length - 1) {
                // Dernier point : utiliser la direction depuis le point précédent
                const prevPoint = curvePoints[index - 1];
                directionX = point.x - prevPoint.x;
                directionZ = point.z - prevPoint.z;
            } else {
                // Points intermédiaires : moyenne entre précédent et suivant
                const prevPoint = curvePoints[index - 1];
                const nextPoint = curvePoints[index + 1];
                directionX = nextPoint.x - prevPoint.x;
                directionZ = nextPoint.z - prevPoint.z;
            }
            
            // Normaliser et calculer l'angle
            const length = Math.sqrt(directionX * directionX + directionZ * directionZ);
            if (length > 0) {
                directionX /= length;
                directionZ /= length;
            }
            
            const rotationY = Math.atan2(directionX, directionZ); // Angle en radians autour de l'axe Y
            
            return {
                q: hexPos.q,
                r: hexPos.r,
                z: 0,
                isOriginal: false,
                curveIndex: index,
                cartesianX: point.x,
                cartesianZ: point.z,
                // Direction du tracé calculée entre points
                directionX: directionX,
                directionZ: directionZ,
                rotationY: rotationY, // Rotation pour aligner avec la direction
                direction: {
                    x: directionX,
                    y: 0,
                    z: directionZ
                }
            };
        });

        console.log(`🌊 Courbe Catmull-Rom créée: ${positions.length} points originaux → ${smoothPositions.length} points lissés`);
        return smoothPositions;
    },

    /**
     * Conversion approximative des coordonnées cartésiennes vers hexagonales
     * @param {number} x - Coordonnée cartésienne X
     * @param {number} z - Coordonnée cartésienne Z
     * @returns {Object} Coordonnées hexagonales approximatives
     */
    cartesianToHex(x, z) {
        // Inverse de hexToCartesian: {x: q+r/2, z: -r/2*sqrt(3)}
        // Résolution du système d'équations:
        // x = q + r/2  =>  q = x - r/2
        // z = -r/2*sqrt(3)  =>  r = -2*z/sqrt(3)
        
        const r = -2 * z / Math.sqrt(3);
        const q = x - r / 2;
        
        return { q: q, r: r };
    },

    /**
     * Lisse les points de contrôle en remplaçant chaque point intermédiaire 
     * par une moyenne pondérée de ses voisins (garde le premier et dernier point)
     * @param {Array} points - Points Three.js Vector3
     * @returns {Array} Points lissés
     */
    smoothControlPoints(points) {
        if (points.length <= 2) {
            return points; // Pas assez de points pour lisser
        }

        const smoothedPoints = [...points]; // Copie du tableau

        // Remplacer chaque point intermédiaire par une moyenne pondérée
        for (let i = 1; i < points.length - 1; i++) {
            const prevPoint = points[i - 1];
            const currentPoint = points[i];
            const nextPoint = points[i + 1];
            
            // Moyenne pondérée : 1×précédent + 3×original + 1×suivant / 5
            smoothedPoints[i] = new THREE.Vector3(
                (prevPoint.x + 3 * currentPoint.x + nextPoint.x) / 5,
                (prevPoint.y + 3 * currentPoint.y + nextPoint.y) / 5,
                (prevPoint.z + 3 * currentPoint.z + nextPoint.z) / 5
            );
        }

        console.log(`🌊 Lissage des points de contrôle: ${points.length} points → courbe plus smooth`);
        return smoothedPoints;
    },
}
// pour le debug
window.developpementAndMore = developpementAndMore;