import * as THREE from 'three';
import { gameState } from '../gameState.js';

/**
 * Classe Arrow pour gérer une flèche individuelle avec évitement automatique des chevauchements
 */
class Arrow {
    constructor(action, territoryPath, arrowType, warriorsToSend = 0, warriorsAlreadySent = 0) {
        this.action = action;
        this.territoryPath = territoryPath;
        this.arrowType = arrowType; // 'devellopementConnecte', 'devellopementAdjacent', 'attaque', 'telepartation'
        this.warriorsToSend = warriorsToSend;
        this.warriorsAlreadySent = warriorsAlreadySent;
        this.pathSprites = [];
        this.currentArrow = null;
        this.offset = { q: 0, r: 0, y: 0 };
        this.isRewinding = false; // Flag pour éviter les opérations simultanées
        this.smoothCurvePositions = []; // Stocker les positions pour le rewind
        this.warriorMeshes = [];
        this.warriorOffsetIndices = [];
        
        
        // Promesse qui se résout quand l'animation est terminée
        this.animationPromise = null;
        this.resolveAnimation = null;
        
        // Récupérer les infos du clan
        const clanId = gameState.getClanIdByGameUserId(action.game_user_id);
        const clan = gameState.getClanById(clanId);
        this.clanId = clanId;
        this.color = gameState.getClanColor(clanId) || 0xff0000;
        this.offset.y = clan ? clan.verticalOffset : 0;
        
        // Calculer les décalages automatiques
        this.calculateOffsets();
        
        // Créer la promesse d'animation
        this.animationPromise = new Promise((resolve) => {
            this.resolveAnimation = resolve;
        });
        
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
        
        // Déterminer la paire finale
        const currentEndPair = this.getLastTwoTerritories();
        const [territory1, territory2] = currentEndPair;
        const pairKey = arrowManager.getPairKey(territory1, territory2);

        // Obtenir l'offset de base de la paire
        const base = arrowManager.getBaseOffsetForPair(territory1, territory2);

        // Obtenir/assigner un index d'offset par clan pour cette paire
        const indexForClan = arrowManager.getOrAssignOffsetIndex(pairKey, this.clanId);

        // Convertir index -> multiplicateur (0, 1, -1, 2, -2, ...)
        const multiplier = arrowManager.getMultiplier(indexForClan);

        // Appliquer l'offset
        this.offset.q = base.q * multiplier;
        this.offset.r = base.r * multiplier;
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
        try {
            // Créer immédiatement les guerriers au départ pour les attaques
            if (this.arrowType === 'attaque' && this.warriorsToSend > 0) {
                await this.spawnWarriorsAtStart();
            }

            // Déléguer à displayPathDiscs avec les paramètres calculés
            const pathInstance = await arrowManager.displayPathDiscs(
                this.territoryPath, 
                this.color, 
                this.offset,
                this.arrowType,
                this // ownerArrow
            );
            
            // Stocker les références des mesh créés
            if (pathInstance) {
                this.pathSprites = pathInstance.pathSprites || [];
                this.currentArrow = pathInstance.currentArrow;
                this.smoothCurvePositions = pathInstance.smoothCurvePositions || [];
            }
            
            // Résoudre la promesse d'animation
            // console.log(`✅ Animation terminée pour flèche ${this.arrowType}`);
            if (this.resolveAnimation) {
                this.resolveAnimation();
            }
        } catch (error) {
            console.error('❌ Erreur lors de la création de la flèche:', error);
            // Résoudre quand même la promesse pour ne pas bloquer
            if (this.resolveAnimation) {
                this.resolveAnimation();
            }
        }
    }

    /**
     * Crée les meshes de guerriers au point de départ (sans tenir compte du décalage de flèche)
     */
    async spawnWarriorsAtStart() {
        try {
            const count = Math.max(0, this.warriorsToSend | 0);
            if (count === 0) return;

            if (!arrowManager.gameBoard || !arrowManager.gameBoard.meepleManager) return;

            const [territory1, territory2] = this.getLastTwoTerritories();
            const pairKey = arrowManager.getPairKey(territory1, territory2);
            const baseIndex = arrowManager.reserveWarriorOffsets(pairKey, count);
            const offsets = arrowManager.hexPositionsCartesian;
            const offsetsLen = offsets.length;

            // Calculer la position de départ de l'arrow (sans décalage global)
            const startHex = this.territoryPath[0].position;
            let startPosHex = startHex;
            if (this.arrowType === 'attaque' && this.territoryPath.length > 1) {
                const nextHex = this.territoryPath[1].position;
                startPosHex = {
                    q: (startHex.q + nextHex.q) / 2,
                    r: (startHex.r + nextHex.r) / 2,
                    z: startHex.z || 0
                };
            }
            const startCartesian = arrowManager.gameBoard.hexToCartesian(startPosHex);

            for (let i = 0; i < count; i++) {
                const idx = (baseIndex + i) % offsetsLen;
                const off = offsets[idx];

                const mesh = await arrowManager.gameBoard.meepleManager.createMeepleInstance('guerrier', this.color, {
                    ownerArrowId: this.action?.id ?? undefined,
                    ownerClanId: this.clanId,
                    arrowType: this.arrowType,
                    warriorIndexLocal: i,
                    warriorIndexGlobal: baseIndex + i,
                    pairKey: pairKey
                });
                // mesh.castShadow = false;
                // mesh.receiveShadow = false;
                if (!mesh) continue;

                // Position monde au départ (ignorer le décalage q/r de la flèche)
                mesh.position.set(startCartesian.x + off.x, 0.06 + this.offset.y, startCartesian.z + off.z);

                // Ajouter sur le workplane au début
                if (arrowManager.gameBoard && arrowManager.gameBoard.workplane) {
                    arrowManager.gameBoard.workplane.add(mesh);
                }

                this.warriorMeshes.push(mesh);
                this.warriorOffsetIndices.push(baseIndex + i);
            }
        } catch (e) {
            console.warn('⚠️ Impossible de créer les guerriers au départ:', e);
        }
    }

    /**
     * Attache les guerriers à la pointe de la flèche pour qu'ils se déplacent avec elle
     * @param {THREE.Mesh} arrowSprite
     */
    attachWarriorsToArrow(arrowSprite) {
        // Gardé pour compatibilité: positionner une fois en monde sans parentage
        if (!arrowSprite || !this.warriorMeshes || this.warriorMeshes.length === 0) return;
        const offsets = arrowManager.hexPositionsCartesian;
        const offsetsLen = offsets.length;
        const arrowPos = arrowSprite.position;
        for (let i = 0; i < this.warriorMeshes.length; i++) {
            const mesh = this.warriorMeshes[i];
            const idx = (this.warriorOffsetIndices[i] ?? i) % offsetsLen;
            const off = offsets[idx];
            // Ne pas faire tourner la formation: utiliser l'offset brut
            mesh.position.set(arrowPos.x + off.x, 0.06 + this.offset.y, arrowPos.z + off.z);
            if (!mesh.parent && arrowManager.gameBoard && arrowManager.gameBoard.workplane) {
                arrowManager.gameBoard.workplane.add(mesh);
            }
        }
    }

    /**
     * Anime la "mort" d'un guerrier puis le supprime proprement
     * @param {THREE.Object3D} mesh Guerrier à éliminer
     */
    async animateAndRemoveWarrior(mesh) {
        if (!mesh) return;
        await arrowManager.animateAndRemoveMesh(mesh);
    }

    /**
     * Supprime N guerriers de cette flèche avec animation
     * @param {number} count nombre de guerriers à supprimer
     */
    async removeWarriorsWithAnimation(count) {
        const toRemove = Math.min(Math.max(0, count | 0), this.warriorMeshes.length);
        if (toRemove === 0) return;

        // Extraire les meshes à supprimer (prendre depuis la fin pour stabilité visuelle)
        const removedMeshes = this.warriorMeshes.splice(this.warriorMeshes.length - toRemove, toRemove);
        // Retirer les indices correspondants
        this.warriorOffsetIndices.splice(this.warriorOffsetIndices.length - toRemove, toRemove);

        // Lancer les animations en parallèle
        await Promise.all(removedMeshes.map(mesh => this.animateAndRemoveWarrior(mesh)));
    }

    /**
     * Supprime immédiatement N guerriers sans animation
     * @param {number} count
     */
    removeWarriorsImmediate(count) {
        const toRemove = Math.min(Math.max(0, count | 0), this.warriorMeshes.length);
        if (toRemove <= 0) return;
        // Extraire et supprimer les indices réservés
        this.warriorOffsetIndices.splice(this.warriorOffsetIndices.length - toRemove, toRemove);
        const removedMeshes = this.warriorMeshes.splice(this.warriorMeshes.length - toRemove, toRemove);
        for (const mesh of removedMeshes) {
            if (!mesh) continue;
            if (mesh.parent) {
                mesh.parent.remove(mesh);
            } else if (arrowManager.gameBoard && arrowManager.gameBoard.workplane) {
                arrowManager.gameBoard.workplane.remove(mesh);
            }
            arrowManager.disposeMeshDeep(mesh);
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
                
                // Attendre un délai configurable avant de supprimer le sprite suivant
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, arrowManager.animationStepDelayMs ));
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

        // Supprimer les guerriers attachés à cette flèche
        if (this.warriorMeshes && this.warriorMeshes.length > 0) {
            this.warriorMeshes.forEach(mesh => {
                try {
                    if (!mesh) return;
                    if (mesh.parent) {
                        mesh.parent.remove(mesh);
                    } else if (arrowManager.gameBoard && arrowManager.gameBoard.workplane) {
                        arrowManager.gameBoard.workplane.remove(mesh);
                    }
                    arrowManager.disposeSprite(mesh);
                } catch (e) {
                    console.warn('⚠️ Erreur lors de la suppression d\'un guerrier:', e);
                }
            });
            this.warriorMeshes = [];
            this.warriorOffsetIndices = [];
        }
        
        // Retirer cette Arrow de la liste d'arrowManager
        const index = arrowManager.arrows.indexOf(this);
        if (index > -1) {
            arrowManager.arrows.splice(index, 1);
        }
    }
}

export const arrowManager = {
    gameBoard: null,
    storedTerritoryPaths: [], // Tableau des tableaux de territoires pour comparaison
    offsetAssignmentsByPair: new Map(), // Clé "q1,r1|q2,r2" -> Map(clanId -> index)
    arrows: [], // Tableau des objets Arrow
    animationStepDelayMs: 40, // Délai entre points de l'animation 
    warriorCountsByPair: new Map(), // Clé pairKey -> nombre total de guerriers réservés
    
    // Anciens tableaux pour compatibilité (à supprimer plus tard)
    allArrows: [], 
    pathInstances: [],

    initialize(gameBoard) {
        this.gameBoard = gameBoard;
        this.hexPositionsCartesian = [];
        this.initializeHexPositionsCartesian();
        
    },
    
    
    
    /**
     * Crée une nouvelle Arrow avec gestion automatique des décalages
     * @param {Object} action - L'action contenant game_user_id
     * @param {Array} territoryPath - Tableau des territoires
     * @param {string} arrowType - Type: 'devellopementConnecte', 'devellopementAdjacent', 'attaque', 'telepartation'
     * @returns {Promise<Arrow>} Promise qui se résout avec l'instance Arrow créée après animation
     */
    async createArrow(action, territoryPath, arrowType = 'devellopementConnecte', warriorsToSend = 0, warriorsAlreadySent = 0) {
        const arrow = new Arrow(action, territoryPath, arrowType, warriorsToSend, warriorsAlreadySent);
        // Attendre que l'animation de la flèche soit terminée
        await arrow.animationPromise;
        return arrow;
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
     * Initialise hexPositionsCartesian en convertissant les positions hexagonales en coordonnées cartésiennes
     */
    initializeHexPositionsCartesian() {
        const hexPositions = [
            {q: 0, r: 0}, {q: 0, r: -1}, {q: 1, r: -1}, {q: 1, r: 0}, {q: 0, r: 1}, 
            {q: -1, r: 1}, {q: -1, r: 0}, {q: 0, r: -2}, {q: 1, r: -2}, {q: 2, r: -2}, 
            {q: 2, r: -1}, {q: 2, r: 0}, {q: 1, r: 1}, {q: 0, r: 2}, {q: -1, r: 2}, 
            {q: -2, r: 2}, {q: -2, r: 1}, {q: -2, r: 0}, {q: -1, r: -1}
        ];
        
        const scale = 0.2; 
        this.hexPositionsCartesian = hexPositions.map(pos => {
            const {x, y, z} = this.gameBoard.hexToCartesian(pos);
            return {x: x * scale, y: y * scale, z: z * scale};
        });
    },

    // Construit une clé unique pour la paire finale (avant-dernier -> dernier territoire)
    getPairKey(territory1, territory2) {
        return `${territory1.position.q},${territory1.position.r}|${territory2.position.q},${territory2.position.r}`;
    },

    // Offset de base (q, r) selon l'orientation de la paire
    getBaseOffsetForPair(territory1, territory2) {
        let q, r;
        if (territory1.position.r === territory2.position.r) {
            q = -0.05;
            r = 0.1;
        } else if (territory1.position.q === territory2.position.q) {
            q = 0.1;
            r = -0.05;
        } else {
            q = 0.05;
            r = 0.05;
        }
        return { q, r };
    },

    // Récupère ou attribue un index d'offset pour un clan donné sur une paire donnée
    getOrAssignOffsetIndex(pairKey, clanId) {
        let assignments = this.offsetAssignmentsByPair.get(pairKey);
        if (!assignments) {
            assignments = new Map();
            this.offsetAssignmentsByPair.set(pairKey, assignments);
        }
        if (assignments.has(clanId)) {
            return assignments.get(clanId);
        }
        const newIndex = assignments.size; // index basé sur le nombre de clans déjà présents
        assignments.set(clanId, newIndex);
        return newIndex;
    },

    // Séquence de multiplicateurs 0, 1, -1, 2, -2, ...
    getMultiplier(index) {
        const sequence = [0];
        for (let i = 1; i <= index; i++) {
            if (sequence.length > index) break;
            sequence.push(i);
            if (sequence.length > index) break;
            sequence.push(-i);
        }
        return sequence[index] ?? 0;
    },

    /**
     * Réserve des indices d'offset pour des guerriers sur une paire finale identique
     * afin d'éviter le chevauchement entre plusieurs arrows
     * @param {string} pairKey
     * @param {number} count
     * @returns {number} index de départ réservé
     */
    reserveWarriorOffsets(pairKey, count) {
        if (count <= 0) return 0;
        const current = this.warriorCountsByPair.get(pairKey) || 0;
        this.warriorCountsByPair.set(pairKey, current + count);
        return current;
    },
    
    /**
     * Supprime toutes les arrows et remet à zéro les compteurs
     */
    clearAllArrows() {
        
        // Disposer toutes les arrows
        this.arrows.forEach(arrow => arrow.dispose());
        
        // Réinitialiser les variables
        this.storedTerritoryPaths = [];
        this.arrows = [];
        
        // Nettoyer les anciens tableaux aussi
        this.allArrows = [];
        this.pathInstances = [];
        
        console.log('✅ Toutes les arrows ont été supprimées et compteurs réinitialisés');
        // Réinitialiser aussi les réservations de guerriers
        this.warriorCountsByPair.clear();
    },

    /**
     * Affiche des disques colorés aux positions du chemin trouvé par findShortestPathTo
     * @param {Array} territoryPath - Liste des territoires retournée par findShortestPathTo
     * @param {number} color - Couleur hex (par défaut rouge 0xff0000)
     * @param {Object} offset - Décalages pour la totalité de la flèche {q: 0, r: 0, y: 0}
     * a chaque joueur suplementaire au premier rajouter y+0.01 pour eviter la superposition.
     * si 2 fleche arrive sur la meme case et viene de la meme case alor decaler la fleche de de q+-0.1 ou r+-0.1 ou les deux de +-0.05, le tout perpendiculairement a ce 2 case,pour eviter la superposition. si il y a encor plus de fleche repeter l'operation
     */
    async displayPathDiscs(territoryPath, color = 0xff0000, offset = {q: 0, r: 0, y: 0}, arrowType = 'devellopementConnecte', ownerArrow = null) {

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
        const totalTerritories = territoryPath.length;
        
        for (let i = 0; i < territoryPath.length; i++) {
            let adjustedPosition;
            
            if (i === 0 && territoryPath.length > 1) {
                const pos1 = territoryPath[0].position;
                const pos2 = territoryPath[1].position;
                
                if (arrowType === 'telepartation') {
                    // Pour téléportation : calcul de la distance euclidienne et poids inversés
                    const dx = pos1.q - territoryPath[territoryPath.length - 1].position.q;
                    const dy = pos1.r - territoryPath[territoryPath.length - 1].position.r;
                    const euclideanDistance = Math.sqrt(dx * dx + dy * dy);
                    
                    const weight1 = euclideanDistance * 4 - 2;
                    const weight2 = 1;
                    const totalWeight = weight1 + weight2;
                    
                    
                    adjustedPosition = {
                        q: (weight1 * pos1.q + weight2 * pos2.q) / totalWeight + offset.q,
                        r: (weight1 * pos1.r + weight2 * pos2.r) / totalWeight + offset.r,
                        z: pos1.z || 0
                    };
                } else {
                    // Non téléportation: logique unifiée selon la longueur du chemin
                    if (totalTerritories === 2) {
                        // 2 territoires: premier point = à mi-chemin entre le premier et le milieu (3/4 du premier, 1/4 du second)
                        adjustedPosition = {
                            q: (3 * pos1.q + 1 * pos2.q) / 4 + offset.q,
                            r: (3 * pos1.r + 1 * pos2.r) / 4 + offset.r,
                            z: pos1.z || 0
                        };
                    } else {
                        // >2 territoires: premier point = milieu entre les deux premiers
                        adjustedPosition = {
                            q: (pos1.q + pos2.q) / 2 + offset.q,
                            r: (pos1.r + pos2.r) / 2 + offset.r,
                            z: pos1.z || 0
                        };
                    }
                }
                
            } else if (i === territoryPath.length - 1 && territoryPath.length > 1) {
                const pos1 = territoryPath[territoryPath.length - 2].position;
                const pos2 = territoryPath[territoryPath.length - 1].position;
                
                if (arrowType === 'telepartation') {
                    // Pour téléportation : calcul de la distance euclidienne et poids inversés
                    const dx = territoryPath[0].position.q - pos2.q;
                    const dy = territoryPath[0].position.r - pos2.r;
                    const euclideanDistance = Math.sqrt(dx * dx + dy * dy);
                    
                    const weight1 = 1;
                    const weight2 = euclideanDistance * 4 - 2;
                    const totalWeight = weight1 + weight2;
                    
                    
                    adjustedPosition = {
                        q: (weight1 * pos1.q + weight2 * pos2.q) / totalWeight + offset.q,
                        r: (weight1 * pos1.r + weight2 * pos2.r) / totalWeight + offset.r,
                        z: pos2.z || 0
                    };
                } else {
                    // Non téléportation: logique unifiée selon la longueur du chemin
                    if (totalTerritories === 2) {
                        // 2 territoires: dernier point = à mi-chemin entre le milieu et le second (1/4 du premier, 3/4 du second)
                        adjustedPosition = {
                            q: (1 * pos1.q + 3 * pos2.q) / 4 + offset.q,
                            r: (1 * pos1.r + 3 * pos2.r) / 4 + offset.r,
                            z: pos2.z || 0
                        };
                    } else {
                        // >2 territoires: dernier point = milieu entre les deux derniers
                        adjustedPosition = {
                            q: (pos1.q + pos2.q) / 2 + offset.q,
                            r: (pos1.r + pos2.r) / 2 + offset.r,
                            z: pos2.z || 0
                        };
                    }
                }
                
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
        let multiplier;
        if (arrowType === 'attaque') {
            multiplier = 7;
        } else if (arrowType === 'telepartation') {
            // Calculer la distance euclidienne entre le premier et dernier territoire
            const firstTerritory = territoryPath[0];
            const lastTerritory = territoryPath[territoryPath.length - 1];
            const dx = firstTerritory.position.q - lastTerritory.position.q;
            const dy = firstTerritory.position.r - lastTerritory.position.r;
            const euclideanDistance = Math.sqrt(dx * dx + dy * dy);
            multiplier = (euclideanDistance + 0.5)*20;
        } else {
            multiplier = 11; // Par défaut pour devellopementConnecte, devellopementAdjacent, etc.
        }
        const curvePointsCount = Math.round(multiplier * (adjustedPositions.length - 1.3)); 
        const smoothCurvePositions = this.createSmoothCurve(adjustedPositions, curvePointsCount);


        // Créer une nouvelle instance de chemin
        const pathInstance = {
            id: Date.now() + Math.random(), // ID unique
            color: color,
            offset: offset,
            pathSprites: [],
            currentArrow: null,
            smoothCurvePositions: smoothCurvePositions, // Stocker pour le rewind
            ownerArrow: ownerArrow
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
                const spriteType = arrowType === 'attaque' ? 'pathDisc' : 'pathSquare';
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

                // Décaler uniquement la visibilité du point, sans bloquer la logique
                discSprite.visible = false;
                // Ajouter le sprite au workplane immédiatement (mais invisible)
                this.gameBoard.workplane.add(discSprite);
                // Stocker la référence dans l'instance du chemin immédiatement
                pathInstance.pathSprites.push(discSprite);
                // Rendre visible après un délai sans bloquer la suite
                setTimeout(() => {
                    if (discSprite && discSprite.material) {
                        discSprite.visible = true;
                    }
                }, arrowManager.animationStepDelayMs);

                // Gestion de la flèche qui suit le tracé (attendre la fin de l'interpolation)
                const movePromise = this.updateArrowPosition(smoothCurvePositions, i, pathInstance);
                await movePromise;

                const pointType = isOriginalPoint ? '🎯 ORIGINAL' : '🔗 INTERPOLÉ';
                const rotationDeg = ((position.rotationY || 0) * 180 / Math.PI).toFixed(1);
                
                // Pas de délai bloquant: la visibilité est retardée via setTimeout ci-dessus
                
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
        const targetPos = position.cartesianX !== undefined ?
            { x: position.cartesianX, y: 0.1, z: position.cartesianZ } :
            this.gameBoard.hexToCartesian(position);
        // Appliquer le décalage Y (légèrement au-dessus des carrés)
        targetPos.y = 0.06 + pathInstance.offset.y;

        // Rotation cible de la flèche (texture pointe vers le haut, on ajoute PI)
        const targetAngleRaw = position.rotationY || 0; // angle brut de la tangente
        const targetArrowY = targetAngleRaw + Math.PI;

        try {
            if (!pathInstance.currentArrow) {
                // Créer la flèche pour la première fois (sans interpolation)
                pathInstance.currentArrow = await this.gameBoard.meepleManager.createSpriteInstance(
                    'pathArrow',
                    { x: targetPos.x, y: targetPos.y, z: targetPos.z },
                    pathInstance.color,
                    {
                        isArrow: true,
                        currentIndex: currentIndex,
                        pathInstanceId: pathInstance.id
                    },
                    targetArrowY
                );

                // Ajouter la flèche au workplane et à la liste globale
                this.gameBoard.workplane.add(pathInstance.currentArrow);
                this.allArrows.push(pathInstance.currentArrow);

                // Position initiale des guerriers (sans parentage, formation fixe)
                if (pathInstance.ownerArrow && pathInstance.ownerArrow.arrowType === 'attaque') {
                    const owner = pathInstance.ownerArrow;
                    const offsets = this.hexPositionsCartesian;
                    const offsetsLen = offsets.length;
                    for (let i = 0; i < (owner.warriorMeshes?.length || 0); i++) {
                        const mesh = owner.warriorMeshes[i];
                        const idx = (owner.warriorOffsetIndices[i] ?? i) % offsetsLen;
                        const off = offsets[idx];
                        mesh.position.set(targetPos.x + off.x, 0.06 + owner.offset.y, targetPos.z + off.z);
                        mesh.rotation.set(0, 0, 0);
                        if (!mesh.parent) {
                            this.gameBoard.workplane.add(mesh);
                        }
                    }
                }
                return;
            }

            // Interpolation fluide uniquement pour la pointe de la flèche
            // Annuler une animation précédente si elle existe
            if (pathInstance._arrowAnimRequestId) {
                cancelAnimationFrame(pathInstance._arrowAnimRequestId);
                pathInstance._arrowAnimRequestId = null;
            }

            return await new Promise((resolve) => {
                const duration = arrowManager.animationStepDelayMs; // même tempo que l'affichage des points
                const startTime = performance.now();
                const startX = pathInstance.currentArrow.position.x;
                const startY = pathInstance.currentArrow.position.y;
                const startZ = pathInstance.currentArrow.position.z;
                const startArrowY = pathInstance.currentArrow.rotation.y || 0; // angle Y actuel de la flèche

                // Angle brut correspondant à l'angle Y actuel (flèche = brut + PI)
                const startAngleRaw = startArrowY - Math.PI;

                const lerp = (a, b, t) => a + (b - a) * t;
                const lerpAngle = (a, b, t) => {
                    let diff = b - a;
                    while (diff > Math.PI) diff -= 2 * Math.PI;
                    while (diff < -Math.PI) diff += 2 * Math.PI;
                    return a + diff * t;
                };

                const step = (now) => {
                    const elapsed = now - startTime;
                    const t = duration > 0 ? Math.min(elapsed / duration, 1) : 1;

                    // Interpo linéaire des positions
                    const x = lerp(startX, targetPos.x, t);
                    const y = lerp(startY, targetPos.y, t);
                    const z = lerp(startZ, targetPos.z, t);

                    // Interpo d'angle brut (pour offsets guerriers), puis déduire l'angle Y de la flèche
                    const angleRaw = lerpAngle(startAngleRaw, targetAngleRaw, t);
                    const arrowY = angleRaw + Math.PI;

                    // Appliquer à la flèche
                    pathInstance.currentArrow.position.set(x, y, z);
                    pathInstance.currentArrow.rotation.order = 'YXZ';
                    pathInstance.currentArrow.rotation.set(-Math.PI / 2, arrowY, 0);
                    pathInstance.currentArrow.userData.currentIndex = currentIndex;

                    // Repositionner les guerriers (toujours verticaux, formation fixe)
                    if (pathInstance.ownerArrow && pathInstance.ownerArrow.arrowType === 'attaque') {
                        const owner = pathInstance.ownerArrow;
                        const offsets = this.hexPositionsCartesian;
                        const offsetsLen = offsets.length;
                        for (let i = 0; i < (owner.warriorMeshes?.length || 0); i++) {
                            const mesh = owner.warriorMeshes[i];
                            const idx = (owner.warriorOffsetIndices[i] ?? i) % offsetsLen;
                            const off = offsets[idx];
                            mesh.position.set(x + off.x, 0.06 + owner.offset.y, z + off.z);
                            mesh.rotation.set(0, 0, 0);
                            if (!mesh.parent) {
                                this.gameBoard.workplane.add(mesh);
                            }
                        }
                    }

                    if (t < 1) {
                        pathInstance._arrowAnimRequestId = requestAnimationFrame(step);
                    } else {
                        pathInstance._arrowAnimRequestId = null;
                        resolve();
                    }
                };

                pathInstance._arrowAnimRequestId = requestAnimationFrame(step);
            });
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

        // Nettoyer les tableaux et les assignations d'offset
        this.pathInstances = [];
        this.allArrows = [];
        this.offsetAssignmentsByPair.clear();
        this.warriorCountsByPair.clear();
        
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

    // Libération profonde pour les Mesh GLTF (guerriers)
    disposeMeshDeep(object) {
        if (!object) return;
        try {
            object.traverse((child) => {
                if (child.isMesh) {
                    if (child.geometry) child.geometry.dispose();
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach((mat) => {
                        if (!mat) return;
                        if (mat.map) mat.map.dispose();
                        if (mat.normalMap) mat.normalMap.dispose();
                        if (mat.roughnessMap) mat.roughnessMap.dispose();
                        if (mat.metalnessMap) mat.metalnessMap.dispose();
                        if (mat.alphaMap) mat.alphaMap.dispose();
                        mat.dispose();
                    });
                }
            });
        } catch {}
    },

    // Animation générique et suppression d'un mesh (réutilisable pour flèches et territoires)
    async animateAndRemoveMesh(mesh) {
        if (!mesh) return;
        try {
            // Marquer l'objet pour empêcher tout repositionnement ultérieur
            mesh.userData = mesh.userData || {};
            mesh.userData.isDying = true;

            // Capturer état initial
            const baseY = mesh.position.y;
            const baseRotZ = mesh.rotation.z || 0;

            // Oscillation autour de Z: +20°↔-20°, 3 allers-retours, 300ms par aller-retour
            const swingCycles = 3;
            const swingDuration = 300; // ms par aller-retour
            const angleMax = 20 * Math.PI / 180; // 20° en radians

            for (let cycle = 0; cycle < swingCycles; cycle++) {
                const startTime = performance.now();
                await new Promise((resolve) => {
                    const step = (now) => {
                        const t = Math.min((now - startTime) / swingDuration, 1);
                        const s = t * 2; // 0..2
                        let angle;
                        if (s <= 1) {
                            angle = baseRotZ + (1 - s) * angleMax + (s) * (-angleMax); // +A -> -A
                        } else {
                            const u = s - 1; // 0..1
                            angle = baseRotZ + (1 - u) * (-angleMax) + (u) * (angleMax); // -A -> +A
                        }
                        mesh.rotation.z = angle;
                        if (t < 1) requestAnimationFrame(step); else resolve();
                    };
                    requestAnimationFrame(step);
                });
            }

            // Descente verticale de 0.5 en 200ms, linéaire
            await new Promise((resolve) => {
                const drop = 0.5;
                const duration = 200;
                const startTime = performance.now();
                const step = (now) => {
                    const t = Math.min((now - startTime) / duration, 1);
                    mesh.position.y = baseY - drop * t;
                    if (t < 1) requestAnimationFrame(step); else resolve();
                };
                requestAnimationFrame(step);
            });

            // Retirer du workplane et libérer
            if (mesh.parent) {
                mesh.parent.remove(mesh);
            } else if (arrowManager.gameBoard && arrowManager.gameBoard.workplane) {
                arrowManager.gameBoard.workplane.remove(mesh);
            }
            arrowManager.disposeMeshDeep(mesh);
        } catch (e) {
            console.warn('⚠️ Erreur animation suppression mesh:', e);
            try {
                if (mesh.parent) mesh.parent.remove(mesh);
                arrowManager.disposeMeshDeep(mesh);
            } catch {}
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
// window.arrowManager = arrowManager;
// window.Arrow = Arrow;
// arrowManager.createArrow(gameState.game.actions[3],gameState.getTerritoryByPosition(2,2).findShortestPathTo(gameState.getTerritoryByPosition(0,0)),"devellopementConnecte")