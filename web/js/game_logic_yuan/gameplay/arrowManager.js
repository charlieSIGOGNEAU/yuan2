import * as THREE from 'three';
import { gameState } from '../gameState.js';

/**
 * Classe Arrow pour gérer une flèche individuelle avec évitement automatique des chevauchements
 */
class Arrow {
    constructor(action, territoryPath, arrowType) {
        this.action = action;
        this.territoryPath = territoryPath;
        this.arrowType = arrowType; // 'devellopementConnecte', 'devellopementAdjacent', 'Attaque'
        this.pathSprites = [];
        this.currentArrow = null;
        this.offset = { q: 0, r: 0, y: 0 };
        this.isRewinding = false; // Flag pour éviter les opérations simultanées
        this.smoothCurvePositions = []; // Stocker les positions pour le rewind
        
        // Récupérer les infos du clan
        const clanId = gameState.getClanIdByGameUserId(action.game_user_id);
        const clan = gameState.getClanById(clanId);
        this.color = gameState.getClanColor(clanId) || 0xff0000;
        this.offset.y = clan ? clan.verticalOffset : 0;
        
        // Calculer les décalages automatiques
        this.calculateOffsets();
        
        // Créer la flèche
        this.createArrow();
        
        // Ajouter cette Arrow à la liste
        arrowManager.arrows.push(this);
    }
    
    calculateOffsets() {
        // Pour 'devellopementAdjacent', pas de décalage Q/R
        if (this.arrowType === 'devellopementAdjacent') {
            this.offset.q = 0;
            this.offset.r = 0;
            return;
        }
        
        // Vérifier les conflits avec les chemins existants
        const currentEndPair = this.getLastTwoTerritories();
        let nombre = 0;
        
        // Compter les chemins avec la même paire finale
        for (const storedPath of arrowManager.storedTerritoryPaths) {
            const storedEndPair = this.getLastTwoTerritoriesFromPath(storedPath);
            if (this.areSamePairs(currentEndPair, storedEndPair)) {
                nombre++;
            }
        }
       
        // Ajouter ce chemin au stockage APRÈS la comparaison
        arrowManager.storedTerritoryPaths.push(this.territoryPath);
        
        // Calculer les décalages Q/R selon les règles
        let q, r;
        const [territory1, territory2] = currentEndPair;
        
        if (territory1.position.r === territory2.position.r) {
            // Même r0
            q = -0.05;
            r = 0.1;
        } else if (territory1.position.q === territory2.position.q) {
            // Même q0
            q = 0.1;
            r = -0.05;
        } else {
            // Différents
            q = 0.05;
            r = 0.05;
        }
        
        // Appliquer le multiplicateur selon nombre
        const multiplier = this.getMultiplier(nombre);
        this.offset.q = q * multiplier;
        this.offset.r = r * multiplier;
    }
    
    getLastTwoTerritories() {
        const len = this.territoryPath.length;
        return [this.territoryPath[len - 2], this.territoryPath[len - 1]];
    }
    
    getLastTwoTerritoriesFromPath(path) {
        const len = path.length;
        return [path[len - 2], path[len - 1]];
    }
    
    areSamePairs(pair1, pair2) {
        return pair1[0].position.q === pair2[0].position.q &&
               pair1[0].position.r === pair2[0].position.r &&
               pair1[1].position.q === pair2[1].position.q &&
               pair1[1].position.r === pair2[1].position.r;
    }
    
    getMultiplier(nombre) {
        const multipliers = [0, 1, -1, 2, -2, 3, -3, 4];
        return multipliers[nombre] ; 
    }
    
    async createArrow() {
        // Déléguer à displayPathDiscs avec les paramètres calculés
        const pathInstance = await arrowManager.displayPathDiscs(
            this.territoryPath, 
            this.color, 
            this.offset,
            this.arrowType
        );
        
        // Stocker les références des mesh créés
        if (pathInstance) {
            this.pathSprites = pathInstance.pathSprites || [];
            this.currentArrow = pathInstance.currentArrow;
            this.smoothCurvePositions = pathInstance.smoothCurvePositions || [];
        }
    }
    
    /**
     * Rembobine l'arrow en désaffichant les points un par un en sens inverse
     * puis libère la mémoire
     */
    async rewind() {
        if (this.isRewinding) {
            console.warn('⚠️ Arrow déjà en cours de rembobinage');
            return;
        }
        
        this.isRewinding = true;
        console.log(`🔄 Début du rembobinage de l'arrow avec ${this.pathSprites.length} sprites`);
        
        try {
            // Désafficher les sprites du chemin en sens inverse
            for (let i = this.pathSprites.length - 1; i >= 0; i--) {
                const sprite = this.pathSprites[i];
                
                // Retirer le sprite du workplane
                if (arrowManager.gameBoard && arrowManager.gameBoard.workplane) {
                    arrowManager.gameBoard.workplane.remove(sprite);
                }
                arrowManager.disposeSprite(sprite);
                
                // Mettre à jour la position de la flèche vers l'arrière
                if (this.currentArrow && i > 0) {
                    await this.updateArrowPositionRewind(i - 1);
                }
                
                // Attendre 20ms avant de supprimer le sprite suivant
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 20));
                }
            }
            
            // Supprimer la flèche à la fin
            if (this.currentArrow) {
                if (arrowManager.gameBoard && arrowManager.gameBoard.workplane) {
                    arrowManager.gameBoard.workplane.remove(this.currentArrow);
                }
                arrowManager.disposeSprite(this.currentArrow);
                this.currentArrow = null;
            }
            
            console.log('✅ Rembobinage terminé');
            
        } catch (error) {
            console.error('❌ Erreur pendant le rembobinage:', error);
        } finally {
            // Libérer la mémoire et retirer de la liste
            this.dispose();
        }
    }
    
    /**
     * Met à jour la position de la flèche pendant le rembobinage
     * @param {number} targetIndex - Index de destination pour la flèche
     */
    async updateArrowPositionRewind(targetIndex) {
        if (!this.currentArrow || !this.smoothCurvePositions[targetIndex]) {
            return;
        }
        
        const position = this.smoothCurvePositions[targetIndex];
        
        // Utiliser les coordonnées cartésiennes directement si disponibles
        const cartesianPos = position.cartesianX !== undefined ? 
            { x: position.cartesianX, y: 0.1, z: position.cartesianZ } :
            arrowManager.gameBoard.hexToCartesian(position);
        
        // Appliquer le décalage Y
        cartesianPos.y = 0.06 + this.offset.y;
        
        // Calculer la rotation de la flèche
        const arrowRotation = (position.rotationY || 0) + Math.PI;
        
        // Déplacer et réorienter la flèche
        this.currentArrow.position.set(cartesianPos.x, cartesianPos.y, cartesianPos.z);
        this.currentArrow.rotation.order = 'YXZ';
        this.currentArrow.rotation.set(-Math.PI / 2, arrowRotation, 0);
    }
    
    /**
     * Supprime et libère la mémoire des mesh créés par cette flèche
     */
    dispose() {
        // Supprimer les sprites du chemin
        this.pathSprites.forEach(sprite => {
            if (arrowManager.gameBoard && arrowManager.gameBoard.workplane) {
                arrowManager.gameBoard.workplane.remove(sprite);
            }
            arrowManager.disposeSprite(sprite);
        });
        
        // Supprimer la flèche
        if (this.currentArrow) {
            if (arrowManager.gameBoard && arrowManager.gameBoard.workplane) {
                arrowManager.gameBoard.workplane.remove(this.currentArrow);
            }
            arrowManager.disposeSprite(this.currentArrow);
        }
        
        // Retirer cette Arrow de la liste d'arrowManager
        const index = arrowManager.arrows.indexOf(this);
        if (index > -1) {
            arrowManager.arrows.splice(index, 1);
        }
        
        console.log('🗑️ Arrow supprimée et mémoire libérée');
    }
}

export const arrowManager = {
    gameBoard: null,
    storedTerritoryPaths: [], // Tableau des tableaux de territoires pour comparaison
    arrows: [], // Tableau des objets Arrow
    
    // Anciens tableaux pour compatibilité (à supprimer plus tard)
    allArrows: [], 
    pathInstances: [],

    initialize(gameBoard) {
        this.gameBoard = gameBoard;
    },
    
    /**
     * Crée une nouvelle Arrow avec gestion automatique des décalages
     * @param {Object} action - L'action contenant game_user_id
     * @param {Array} territoryPath - Tableau des territoires
     * @param {string} arrowType - Type: 'devellopementConnecte', 'devellopementAdjacent', 'Attaque'
     * @returns {Arrow} Instance Arrow créée
     */
    createArrow(action, territoryPath, arrowType = 'devellopementConnecte') {
        return new Arrow(action, territoryPath, arrowType);
    },
    
    /**
     * Rembobine une arrow spécifique
     * @param {Arrow} arrow - L'instance Arrow à rembobiner
     */
    async rewindArrow(arrow) {
        if (!arrow || !(arrow instanceof Arrow)) {
            console.warn('⚠️ Arrow invalide fournie pour le rembobinage');
            return;
        }
        
        await arrow.rewind();
    },
    
    /**
     * Supprime toutes les arrows et remet à zéro les compteurs
     */
    clearAllArrows() {
        console.log(`🧹 Suppression de ${this.arrows.length} arrows`);
        
        // Disposer toutes les arrows
        this.arrows.forEach(arrow => arrow.dispose());
        
        // Réinitialiser les variables
        this.storedTerritoryPaths = [];
        this.arrows = [];
        
        // Nettoyer les anciens tableaux aussi
        this.allArrows = [];
        this.pathInstances = [];
        
        console.log('✅ Toutes les arrows ont été supprimées et compteurs réinitialisés');
    },

    /**
     * Affiche des disques colorés aux positions du chemin trouvé par findShortestPathTo
     * @param {Array} territoryPath - Liste des territoires retournée par findShortestPathTo
     * @param {number} color - Couleur hex (par défaut rouge 0xff0000)
     * @param {Object} offset - Décalages pour la totalité de la flèche {q: 0, r: 0, y: 0}
     * a chaque joueur suplementaire au premier rajouter y+0.01 pour eviter la superposition.
     * si 2 fleche arrive sur la meme case et viene de la meme case alor decaler la fleche de de q+-0.1 ou r+-0.1 ou les deux de +-0.05, le tout perpendiculairement a ce 2 case,pour eviter la superposition. si il y a encor plus de fleche repeter l'operation
     */
    async displayPathDiscs(territoryPath, color = 0xff0000, offset = {q: 0, r: 0, y: 0}, arrowType = 'devellopementConnecte') {

        if (!territoryPath || territoryPath.length === 0) {
            console.warn('❌ Aucun chemin fourni pour l\'affichage des disques');
            return;
        }

        if (!this.gameBoard) {
            console.warn('❌ GameBoard non disponible pour l\'affichage des disques');
            return;
        }


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
                    q: (3 * pos1.q + 1 * pos2.q) / 4 + offset.q,
                    r: (3 * pos1.r + 1 * pos2.r) / 4 + offset.r,
                    z: pos1.z || 0
                };
                
                
            } else if (i === territoryPath.length - 1 && territoryPath.length > 1) {
                // Dernier élément : barycentre (3, 1) entre l'avant-dernier et dernier territoire
                const pos1 = territoryPath[territoryPath.length - 2].position;
                const pos2 = territoryPath[territoryPath.length - 1].position;
                
                // Barycentre avec poids 1 pour pos1 et 3 pour pos2 : (3*pos1 + 1*pos2) / 4
                adjustedPosition = {
                    q: (1 * pos1.q + 3 * pos2.q) / 4 + offset.q,
                    r: (1 * pos1.r + 3 * pos2.r) / 4 + offset.r,
                    z: pos2.z || 0
                };
                
                
            } else {
                // Éléments intermédiaires : position normale avec décalage
                const pos = territoryPath[i].position;
                adjustedPosition = {
                    q: pos.q + offset.q,
                    r: pos.r + offset.r,
                    z: pos.z || 0
                };
            }
            
            adjustedPositions.push(adjustedPosition);
        }

        // Créer une courbe lissée avec un nombre de points 
        const multiplier = arrowType === 'Attaque' ? 7 : 10;
        const curvePointsCount = Math.round(multiplier * (adjustedPositions.length - 1.3)); 
        const smoothCurvePositions = this.createSmoothCurve(adjustedPositions, curvePointsCount);


        // Créer une nouvelle instance de chemin
        const pathInstance = {
            id: Date.now() + Math.random(), // ID unique
            color: color,
            offset: offset,
            pathSprites: [],
            currentArrow: null,
            smoothCurvePositions: smoothCurvePositions // Stocker pour le rewind
        };

        // Afficher les points un par un avec animation
        await this.animatePathDisplay(smoothCurvePositions, pathInstance, arrowType);
        
        // Ajouter l'instance à la liste
        this.pathInstances.push(pathInstance);
        
        // Retourner l'instance pour permettre à Arrow de récupérer les mesh
        return pathInstance;
    },

    /**
     * Anime l'affichage des points un par un pour créer l'effet de flèche qui grandit
     * @param {Array} smoothCurvePositions - Points de la courbe lissée
     * @param {Object} pathInstance - Instance du chemin à animer
     * @param {string} arrowType - Type de flèche
     */
    async animatePathDisplay(smoothCurvePositions, pathInstance, arrowType) {
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
            
            // Appliquer le décalage Y
            cartesianPos.y = 0.05 + pathInstance.offset.y;
            
            try {
                // Créer une instance de sprite selon le type
                const spriteType = arrowType === 'Attaque' ? 'pathDisc' : 'pathSquare';
                const discSprite = await this.gameBoard.meepleManager.createSpriteInstance(
                    spriteType,
                    { x: cartesianPos.x, y: cartesianPos.y, z: cartesianPos.z },
                    pathInstance.color, // Couleur de l'instance
                    { 
                        isOriginalPoint: isOriginalPoint,
                        originalIndex: originalIndex,
                        interpolatedQ: position.q,
                        interpolatedR: position.r,
                        curveIndex: i,
                        rotationY: position.rotationY || 0,
                        tangent: position.direction,
                        pathInstanceId: pathInstance.id
                    },
                    position.rotationY || 0 // Rotation selon la direction de la courbe
                );

                // Ajouter le sprite au workplane
                this.gameBoard.workplane.add(discSprite);
                
                // Stocker la référence dans l'instance du chemin
                pathInstance.pathSprites.push(discSprite);

                // Gestion de la flèche qui suit le tracé
                await this.updateArrowPosition(smoothCurvePositions, i, pathInstance);

                const pointType = isOriginalPoint ? '🎯 ORIGINAL' : '🔗 INTERPOLÉ';
                const rotationDeg = ((position.rotationY || 0) * 180 / Math.PI).toFixed(1);
                
                // Attendre 20ms avant d'afficher le prochain point
                if (i < smoothCurvePositions.length - 1) { // Pas d'attente après le dernier point
                    await new Promise(resolve => setTimeout(resolve, 20));
                }
                
            } catch (error) {
                console.warn(`⚠️ Erreur lors de la création du disque ${i + 1}:`, error);
            }
        }
    },

    /**
     * Met à jour la position de la flèche pour qu'elle suive fluidement le tracé
     * @param {Array} smoothCurvePositions - Points de la courbe
     * @param {number} currentIndex - Index actuel dans l'animation
     * @param {Object} pathInstance - Instance du chemin
     */
    async updateArrowPosition(smoothCurvePositions, currentIndex, pathInstance) {
        const position = smoothCurvePositions[currentIndex];
        
        // Utiliser les coordonnées cartésiennes directement si disponibles
        const cartesianPos = position.cartesianX !== undefined ? 
            { x: position.cartesianX, y: 0.1, z: position.cartesianZ } :
            this.gameBoard.hexToCartesian(position);
        
        // Appliquer le décalage Y (légèrement au-dessus des carrés)
        cartesianPos.y = 0.06 + pathInstance.offset.y;

        // Calculer la rotation de la flèche (pointe vers le haut dans l'image)
        // Ajuster de -180° car l'image pointe vers le haut et non vers le bas
        const arrowRotation = (position.rotationY || 0) + Math.PI ;

        try {
            if (!pathInstance.currentArrow) {
                // Créer la flèche pour la première fois
                pathInstance.currentArrow = await this.gameBoard.meepleManager.createSpriteInstance(
                    'pathArrow',
                    { x: cartesianPos.x, y: cartesianPos.y, z: cartesianPos.z }, // Légèrement au-dessus des carrés
                    pathInstance.color, // Couleur de l'instance
                    { 
                        isArrow: true,
                        currentIndex: currentIndex,
                        pathInstanceId: pathInstance.id
                    },
                    arrowRotation
                );

                // Ajouter la flèche au workplane et à la liste globale
                this.gameBoard.workplane.add(pathInstance.currentArrow);
                this.allArrows.push(pathInstance.currentArrow);
            } else {
                // Déplacer et réorienter la flèche existante
                pathInstance.currentArrow.position.set(cartesianPos.x, cartesianPos.y, cartesianPos.z);
                pathInstance.currentArrow.rotation.order = 'YXZ';
                pathInstance.currentArrow.rotation.set(-Math.PI / 2, arrowRotation, 0);
                pathInstance.currentArrow.userData.currentIndex = currentIndex;
            }
        } catch (error) {
            console.warn('⚠️ Erreur lors de la mise à jour de la flèche:', error);
        }
    },

    /**
     * Supprime toutes les flèches et libère la mémoire
     */
    clearAllArrows() {
        if (this.allArrows.length === 0 && this.pathInstances.length === 0) {
            console.log('ℹ️ Aucune flèche à supprimer');
            return;
        }

        console.log(`🧹 Suppression de ${this.pathInstances.length} chemins avec ${this.allArrows.length} flèches`);

        // Supprimer toutes les instances de chemin
        this.pathInstances.forEach(pathInstance => {
            // Supprimer les carrés du chemin
            pathInstance.pathSprites.forEach(sprite => {
                this.gameBoard.workplane.remove(sprite);
                this.disposeSprite(sprite);
            });

            // Supprimer la flèche de l'instance
            if (pathInstance.currentArrow) {
                this.gameBoard.workplane.remove(pathInstance.currentArrow);
                this.disposeSprite(pathInstance.currentArrow);
            }
        });

        // Nettoyer les tableaux
        this.pathInstances = [];
        this.allArrows = [];
        
        console.log('✅ Toutes les flèches et chemins ont été supprimés');
    },

    /**
     * Libère la mémoire d'un sprite (géométrie et matériaux)
     * @param {THREE.Mesh} sprite - Sprite à libérer
     */
    disposeSprite(sprite) {
        if (!sprite) return;

        if (sprite.geometry) {
            sprite.geometry.dispose();
        }
        if (sprite.material) {
            if (sprite.material.map) {
                sprite.material.map.dispose();
            }
            if (sprite.material.alphaMap) {
                sprite.material.alphaMap.dispose();
            }
            sprite.material.dispose();
        }
    },

    /**
     * Retourne le nom de la couleur pour les logs
     * @param {number} color - Couleur hex
     * @returns {string} Nom de la couleur
     */
    /**
     * Fonction de compatibilité - utilise le nouveau système
     * @deprecated Utiliser directement displayPathDiscs avec le paramètre couleur
     */
    clearPathDiscs() {
        console.warn('⚠️ clearPathDiscs est dépréciée, utilisez clearAllArrows()');
        this.clearAllArrows();
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
        return smoothedPoints;
    },
}

// pour le debug
// Pour le debug
window.arrowManager = arrowManager;
window.Arrow = Arrow;