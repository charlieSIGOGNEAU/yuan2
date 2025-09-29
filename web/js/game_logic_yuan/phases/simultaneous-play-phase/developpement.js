import { gameState } from '../../gameState.js';
import * as THREE from 'three';
import { arrowManager } from '../../gameplay/arrowManager.js';
import { uiManager } from '../../ui/UIManager.js';
import { renderTax, templeTax } from '../../gameplay/taxe.js';
import { i18n } from '../../../core/i18n.js';

/**
 * Classe Edge pour représenter une relation entre action, territoire et flèche
 */
class Edge {
    constructor(action, territory, arrow = null) {
        this.action = action;
        this.territory = territory;
        this.arrow = arrow;
    }
}

export const developpementAndMore = {
    // === FONCTIONS PRINCIPALES ===
    animation: true,
    gameBoard: null,
    echaoSprites: [], // Stockage des sprites echao créés

    async developpement(gameBoard, processedTurns) {
        this.gameBoard = gameBoard;

        // // test de taxe
        // const taxAnimation = new renderTax(gameState.getTerritoryByPosition(1,0), gameState.getTerritoryByPosition(1,1), 2, gameBoard);
        // taxAnimation.addToScene(); // Pas besoin de scene, déjà ajouté au workplane

        this.assigneDevelopmentPhase(processedTurns);
        // arrowManager.initialize(gameBoard);

        // Nouvelle logique de gestion des développements
        await this.handleDevelopmentLogic(processedTurns);
    },

    wait(){
        if (this.animation) {
            return new Promise(resolve => setTimeout(resolve, 1000));
        }
    },

    // Fonction principale pour gérer toute la logique de développement
    async handleDevelopmentLogic(processedTurns) {
        console.log(`🚀 === DÉBUT LOGIQUE DÉVELOPPEMENT TOUR ${processedTurns} ===`);
        console.log(`🎬 Animation activée: ${this.animation}`);
        console.log(`🎮 GameBoard disponible: ${!!this.gameBoard}`);
        console.log(`⚒️ MeepleManager disponible: ${!!this.gameBoard?.meepleManager}`);
        
        const edges = [];

        // Étape 1: Gérer les colonisations
        console.log(`\n📍 === ÉTAPE 1: COLONISATIONS ===`);
        await this.handleColonizations(processedTurns, edges);

        // Étape 2: Gérer les expansions  
        console.log(`\n🗺️ === ÉTAPE 2: EXPANSIONS ===`);
        await this.handleExpansions(processedTurns, edges);

        // Étape 3: Gérer les urbanisations gratuites
        console.log(`\n🏙️ === ÉTAPE 3: URBANISATIONS GRATUITES ===`);
        await this.handleFreeUrbanizations(processedTurns);

        // Étape 4: Finalisation de la phase
        console.log(`\n🏁 === ÉTAPE 5: FINALISATION PHASE ===`);
        await this.finalizeDevelopmentPhase();

        // Étape 5: Gérer les expansions niveau 3 (temples et taxes)
        console.log(`\n🏛️ === ÉTAPE 4: EXPANSIONS NIVEAU 3 (TEMPLES) ===`);
        await this.handleColonisation3(processedTurns);

        // etape 6: les revenu de colonisation 2 et 3 et expention 2
        console.log(`\n💰 === ÉTAPE 5: REVENUS DE COLONISATION 2 ET 3 ET EXPANSION 2 ===`);
        await this.handleRevenusColonisation23EtExpansion2(processedTurns);
        
        console.log(`\n✅ === FIN LOGIQUE DÉVELOPPEMENT TOUR ${processedTurns} ===`);
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

        // Si development_level = 0, ne rien faire
        if (action.development_level === 0) {
            return;
        }

        // Gestion des différents cas
        if (action.development_level !== 0) {
            // Cas 1: Le territoire a le même clan_id
            if (territory.clan_id === userClanId) {
                action.development_type = "expantion";
                console.log(`✅ Action d'expansion définie pour territoire (${action.position_q}, ${action.position_r})`);
                return;
            }

            // Cas 2 et 3: Le territoire n'a pas de clan_id renseigné
            if (!territory.clan_id && ['forest', 'rice', 'mine', 'plain'].includes(territory.type)) {
                // Cas 2: development_level = 3
                if (action.development_level === 3) {
                    action.development_type = "colonisation";
                    console.log(`✅ Action de colonisation (niveau 3) définie pour territoire (${action.position_q}, ${action.position_r})`);
                    return;
                }

                // Cas 3: development_level = 1 ou 2 avec territoire connecté
                if (action.development_level === 1 || action.development_level === 2) {
                    // Vérifier si territory.connectedProvinces possède au moins un territoire avec le bon clan_id
                    const hasConnectedClanTerritory = territory.connectedProvinces.some(connectedTerritory => 
                        connectedTerritory.clan_id === userClanId
                    );

                    if (hasConnectedClanTerritory) {
                        action.development_type = "colonisation";
                        console.log(`✅ Action de colonisation (niveau ${action.development_level}) définie pour territoire (${action.position_q}, ${action.position_r})`);
                        return;
                    }
                }
            }
        }

        // Cas par défaut: action non conforme
        console.log(`❌ Action non conforme: game_user_id=${action.game_user_id}, territoire=(${action.position_q}, ${action.position_r}), level=${action.development_level}, territoire.clan_id=${territory.clan_id}, territoire.type=${territory.type}`);
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

    // === NOUVELLES FONCTIONS DE GESTION ===


    // Fonction pour afficher un message et attendre next (si animation activée)
    async showMessageAndWaitNext(messageKey) {
        console.log(`📢 showMessageAndWaitNext appelée avec messageKey: ${messageKey}, animation: ${this.animation}`);
        if (!this.animation) {
            console.log(`📢 Animation désactivée, retour immédiat`);
            return;
        }
        
        try {
            // Utiliser le système de traduction centralisé
            const message = i18n.t(`game.phases.simultaneous_play.${messageKey}`);
            console.log(`📢 Message traduit: ${message}`);

            uiManager.updateInfoPanel(message);
            uiManager.showNextBar();
            
            await uiManager.waitForNext();
            uiManager.showMenuOnlyBar();
            
            // Effacer le message affiché
            uiManager.updateInfoPanel('');

        } catch (error) {
            console.error('Erreur lors de l\'affichage du message:', error);
            // Fallback: afficher quand même les barres
            uiManager.showNextBar();
            await uiManager.waitForNext();
            uiManager.showMenuOnlyBar();
            
            // Effacer le message affiché même en cas d'erreur
            uiManager.updateInfoPanel('');
        }
    },

    // Fonction pour trouver le groupe connexe de territoires avec le même clan_id
    // il existe une fonction toute faite dans la classe territory. elle ne necessite pas de rancegner le clan_id
    findConnectedTerritoryGroup(startTerritory, clanId) {
        const visited = new Set();
        const group = [];
        const toVisit = [startTerritory];

        while (toVisit.length > 0) {
            const territory = toVisit.pop();
            
            if (visited.has(territory) || territory.clan_id !== clanId) {
                continue;
            }

            visited.add(territory);
            group.push(territory);

            // Ajouter les territoires adjacents avec le même clan_id
            for (const adjacent of territory.adjacentProvinces) {
                if (!visited.has(adjacent) && adjacent.clan_id === clanId) {
                    toVisit.push(adjacent);
                }
            }
        }

        return group;
    },

    // Gérer les colonisations
    async handleColonizations(processedTurns, edges) {
        const colonizationActions = gameState.game.actions.filter(action => 
            action.turn === processedTurns && action.development_type === "colonisation"
        );
        
        console.log(`📍 ${colonizationActions.length} actions de colonisation trouvées`);

        // if (colonizationActions.length > 0 && this.animation) {
        //     console.log(`📢 Affichage message cibles colonisation`);
        //     await this.showMessageAndWaitNext('colonization_targets');
        // } else {
        //     console.log(`📢 Pas d'affichage message: colonizationActions.length=${colonizationActions.length}, animation=${this.animation}`);
        // }

        // Colonisations niveau 1-2
        console.log(`📍 Traitement colonisations niveau 1-2`);
        await this.handleColonizationsLevel12(processedTurns, edges);

        // Colonisations niveau 3
        console.log(`📍 Traitement colonisations niveau 3`);
        await this.handleColonizationsLevel3(processedTurns, edges);

        // Gérer les conflits entre clans pour le même territoire
        console.log(`⚔️ Gestion conflits territoriaux, ${edges.length} edges à analyser`);
        await this.handleTerritoryConflicts(edges);
    },

    // Gérer les colonisations niveau 1-2
    async handleColonizationsLevel12(processedTurns, edges) {
        const actions = gameState.game.actions.filter(action => 
            action.turn === processedTurns && 
            action.development_type === "colonisation" && 
            (action.development_level === 1 || action.development_level === 2)
        );

        console.log(`📍 ${actions.length} actions de colonisation niveau 1-2 trouvées`);

        const arrowPromises = []; // Stocker les promesses d'animation

        for (const action of actions) {
            const territory = action.getTerritory();
            const clan = action.getClan();
            
            console.log(`📍 Colonisation niveau ${action.development_level} - Territoire (${action.position_q}, ${action.position_r}) par clan ${clan?.id}`);
            
            const edge = new Edge(action, territory);
            edges.push(edge);

            if (this.animation) {
                console.log(`🏹 Recherche chemin le plus court pour animation`);
                // Trouver le chemin le plus court
                let shortestPath = null;
                let shortestLength = Infinity;

                for (const connectedTerritory of territory.connectedProvinces) {
                    if (connectedTerritory.clan_id === clan.id) {
                        const path = connectedTerritory.findShortestPathTo(territory);
                        if (path && path.length < shortestLength) {
                            shortestPath = path;
                            shortestLength = path.length;
                        }
                    }
                }

                if (shortestPath) {
                    console.log(`🏹 Création flèche avec chemin de longueur ${shortestPath.length}`);
                    const arrowPromise = arrowManager.createArrow(action, shortestPath, "devellopementConnecte")
                        .then(arrow => {
                            edge.arrow = arrow;
                            console.log(`🏹 Flèche niveau 1-2 terminée`);
                            console.log("arrow", arrow);
                            return arrow; // Retourner l'arrow pour la promesse
                            
                        });
                    arrowPromises.push(arrowPromise);
                } else {
                    console.log(`❌ Aucun chemin trouvé pour la flèche`);
                }
            }
        }

        // Attendre que toutes les animations de flèches soient terminées
        if (this.animation && arrowPromises.length > 0) {
            console.log(`⏳ Attente de ${arrowPromises.length} animations de flèches niveau 1-2...`);
            await Promise.all(arrowPromises);
            console.log(`✅ Toutes les animations niveau 1-2 terminées`);
        }
    },

    // Gérer les colonisations niveau 3
    async handleColonizationsLevel3(processedTurns, edges) {
        const actions = gameState.game.actions.filter(action => 
            action.turn === processedTurns && 
            action.development_type === "colonisation" && 
            action.development_level === 3
        );

        console.log(`📍 ${actions.length} actions de colonisation niveau 3 trouvées`);

        const arrowPromises = []; // Stocker les promesses d'animation

        for (const action of actions) {
            const territory = action.getTerritory();
            const clan = action.getClan();
            
            const edge = new Edge(action, territory);
            edges.push(edge);

            if (this.animation) {
                // Trouver le territoire le plus proche avec le même clan_id
                let closestTerritory = null;
                let shortestDistance = Infinity;

                for (const t of gameState.game.territories) {
                    if (t.clan_id === clan.id) {
                        const distance = this.calculateEuclideanDistance(territory, t);
                        if (distance < shortestDistance) {
                            shortestDistance = distance;
                            closestTerritory = t;
                        }
                    }
                }

                if (closestTerritory) {
                    const territoryPath = [closestTerritory, territory];
                    console.log(`🏹 Création flèche niveau 3 depuis territoire proche`);
                    const arrowPromise = arrowManager.createArrow(action, territoryPath, "telepartation")
                        .then(arrow => {
                            edge.arrow = arrow;
                            console.log(`🏹 Flèche niveau 3 terminée`);
                            return arrow; // Retourner l'arrow pour la promesse
                        });
                    arrowPromises.push(arrowPromise);
                }
            }
        }

        // Attendre que toutes les animations de flèches soient terminées
        if (this.animation && arrowPromises.length > 0) {
            console.log(`⏳ Attente de ${arrowPromises.length} animations de flèches niveau 3...`);
            await Promise.all(arrowPromises);
            console.log(`✅ Toutes les animations niveau 3 terminées`);
        }
    },

    // Calculer la distance euclidienne entre deux territoires
    calculateEuclideanDistance(territory1, territory2) {
        const dx = territory1.position.q - territory2.position.q;
        const dy = territory1.position.r - territory2.position.r;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // Gérer les conflits entre clans pour le même territoire
    async handleTerritoryConflicts(edges) {
        // Grouper les edges par territoire
        const edgesByTerritory = new Map();
        
        for (const edge of edges) {
            const territoryKey = `${edge.territory.position.q}_${edge.territory.position.r}`;
            if (!edgesByTerritory.has(territoryKey)) {
                edgesByTerritory.set(territoryKey, []);
            }
            edgesByTerritory.get(territoryKey).push(edge);
        }

        // Trouver les territoires en conflit
        const conflictingTerritories = [];
        for (const [territoryKey, territoryEdges] of edgesByTerritory) {
            if (territoryEdges.length > 1) {
                conflictingTerritories.push(territoryEdges);
            }
        }

        if (conflictingTerritories.length > 0 && this.animation) {
            await this.showMessageAndWaitNext('clan_conflicts_territory');
        }

        // Résoudre les conflits
        const edgesToRemove = [];
        for (const territoryEdges of conflictingTerritories) {
            // Trier par honneur (plus faible en premier)
            territoryEdges.sort((a, b) => {
                const clanA = a.action.getClan();
                const clanB = b.action.getClan();
                return clanA.honneur - clanB.honneur;
            });

            // Garder seulement celui avec l'honneur le plus faible, supprimer les autres
            for (let i = 1; i < territoryEdges.length; i++) {
                edgesToRemove.push(territoryEdges[i]);
            }
        }

        // Traiter les edges à supprimer
        console.log(`🗑️ Suppression de ${edgesToRemove.length} edges en conflit`);
        
        // Collecter toutes les promesses de rewind pour les exécuter en parallèle
        const rewindPromises = [];
        
        for (const edge of edgesToRemove) {
            const clan = edge.action.getClan();
            clan.available_chao += edge.action.chao;
            
            edge.action.development_level = 0;
            edge.action.fortification_level = 0;
            edge.action.militarisation_level = 0;
            edge.action.development_type = null;

            if (this.animation && edge.arrow) {
                console.log(`🔄 Ajout rewind à la liste dans handleTerritoryConflicts`, typeof edge.arrow);
                if (typeof edge.arrow.rewind === 'function') {
                    rewindPromises.push(edge.arrow.rewind());
                } else {
                    console.warn(`⚠️ edge.arrow.rewind n'est pas une fonction dans handleTerritoryConflicts:`, edge.arrow);
                }
            }

            // Retirer l'edge de la liste
            const index = edges.indexOf(edge);
            if (index > -1) {
                edges.splice(index, 1);
            }
        }
        
        // Exécuter tous les rewinds en parallèle
        if (rewindPromises.length > 0) {
            console.log(`🔄 Exécution de ${rewindPromises.length} rewinds en parallèle dans handleTerritoryConflicts`);
            await Promise.all(rewindPromises);
            console.log(`✅ Tous les rewinds terminés dans handleTerritoryConflicts`);
        }

        // Traiter les edges restantes (winners)
        console.log(`🏆 Traitement de ${edges.length} edges gagnantes pour colonisation`);
        
        // Créer une copie du tableau pour éviter les problèmes de modification pendant l'itération
        const edgesToProcess = [...edges];
        console.log(`📋 Copie créée avec ${edgesToProcess.length} edges à traiter`);
        
        for (let i = 0; i < edgesToProcess.length; i++) {
            const edge = edgesToProcess[i];
            console.log(`🔄 Traitement edge ${i + 1}/${edgesToProcess.length}`);
            
            if (edge.action.development_type === "colonisation") {
                console.log(`🏘️ Création village sur territoire (${edge.territory.position.q}, ${edge.territory.position.r}) pour clan ${edge.action.getClan().id}`);
                edge.territory.construction_type = "village";
                edge.territory.clan_id = edge.action.getClan().id;
                
                try {
                    await edge.territory.createConstruction(this.gameBoard, this.gameBoard?.meepleManager);
                    console.log(`✅ Village créé avec succès`);
                } catch (error) {
                    console.error(`❌ Erreur création village:`, error);
                }
                
                // Supprimer l'edge du tableau original après traitement
                const index = edges.indexOf(edge);
                if (index > -1) {
                    edges.splice(index, 1);
                    console.log(`🗑️ Edge supprimée, ${edges.length} edges restantes`);
                }
            }
        }
    },

    // Gérer les expansions
    async handleExpansions(processedTurns, edges) {
        // Créer les edges pour les colonisations (territoires adjacents)
        const colonizationActions = gameState.game.actions.filter(action => 
            action.turn === processedTurns && action.development_type === "colonisation"
        );

        for (const action of colonizationActions) {
            const territory = action.getTerritory();
            for (const adjacentTerritory of territory.adjacentProvinces) {
                if (!adjacentTerritory.clan_id) {
                    const edge = new Edge(action, adjacentTerritory);
                    edges.push(edge);
                    if (this.animation) {
                        const territoryPath = [territory, adjacentTerritory];
                        console.log(`🏹 Création flèche adjacente pour colonisation`);
                        arrowManager.createArrow(action, territoryPath, "devellopementAdjacent")
                            .then(arrow => {
                                edge.arrow = arrow;
                                console.log(`🏹 Flèche adjacente colonisation terminée`);
                            })
                            .catch(error => {
                                console.error(`❌ Erreur création flèche adjacente colonisation:`, error);
                            });
                    }
                }
            }
        }

        // Gérer les expansions
        const expansionActions = gameState.game.actions.filter(action => 
            action.turn === processedTurns && action.development_type === "expantion"&& 
            (action.development_level === 1 || action.development_level === 2)
        );

        for (const action of expansionActions) {
            const territory = action.getTerritory();
            const clan = action.getClan();
            
            // Trouver le groupe connexe
            const connectedGroup = this.findConnectedTerritoryGroup(territory, clan.id);
            
            // Créer des edges pour tous les territoires adjacents libres
            for (const groupTerritory of connectedGroup) {
                for (const adjacentTerritory of groupTerritory.adjacentProvinces) {
                    if (!adjacentTerritory.clan_id) {
                        // Vérifier que l'edge n'existe pas déjà
                        const existingEdge = edges.find(e => 
                            e.action === action && e.territory === adjacentTerritory
                        );
                        
                        if (!existingEdge) {
                            const edge = new Edge(action, adjacentTerritory);
                            edges.push(edge);

                            if (this.animation) {
                                const territoryPath = [groupTerritory, adjacentTerritory];
                                console.log(`🏹 Création flèche adjacente pour expansion`);
                                arrowManager.createArrow(action, territoryPath, "devellopementAdjacent")
                                    .then(arrow => {
                                        edge.arrow = arrow;
                                        console.log(`🏹 Flèche adjacente expansion terminée`);
                                    })
                                    .catch(error => {
                                        console.error(`❌ Erreur création flèche adjacente expansion:`, error);
                                    });
                            }
                        }
                    }
                }
            }
        }

        // Gérer les conflits d'expansion (même logique que les colonisations)
        await this.handleExpansionConflicts(edges);
    },

    // Gérer les conflits d'expansion
    async handleExpansionConflicts(edges) {
        // Grouper les edges par territoire (même logique que handleTerritoryConflicts)
        const edgesByTerritory = new Map();
        
        for (const edge of edges) {
            const territoryKey = `${edge.territory.position.q}_${edge.territory.position.r}`;
            if (!edgesByTerritory.has(territoryKey)) {
                edgesByTerritory.set(territoryKey, []);
            }
            edgesByTerritory.get(territoryKey).push(edge);
        }

        // Trouver les territoires en conflit (plusieurs edges sur le même territoire)
        const conflictingTerritories = [];
        for (const [territoryKey, territoryEdges] of edgesByTerritory) {
            if (territoryEdges.length > 1) {
                conflictingTerritories.push(territoryEdges);
            }
        }

        if (conflictingTerritories.length > 0) {
            if (this.animation) {
                await this.showMessageAndWaitNext('provinces_disputed');
            }

            // Supprimer toutes les edges en conflit
            const edgesToRemove = [];
            for (const territoryEdges of conflictingTerritories) {
                edgesToRemove.push(...territoryEdges);
            }

            console.log(`🗑️ Suppression de ${edgesToRemove.length} edges en conflit d'expansion`);
            
            // Collecter toutes les promesses de rewind pour les exécuter en parallèle
            const rewindPromises = [];
            
            for (const edge of edgesToRemove) {
                if (this.animation && edge.arrow) {
                    console.log(`🔄 Ajout rewind à la liste dans handleExpansionConflicts`, typeof edge.arrow);
                    if (typeof edge.arrow.rewind === 'function') {
                        rewindPromises.push(edge.arrow.rewind());
                    } else {
                        console.warn(`⚠️ edge.arrow.rewind n'est pas une fonction dans handleExpansionConflicts:`, edge.arrow);
                    }
                }

                const index = edges.indexOf(edge);
                if (index > -1) {
                    edges.splice(index, 1);
                }
            }
            
            // Exécuter tous les rewinds en parallèle
            if (rewindPromises.length > 0) {
                console.log(`🔄 Exécution de ${rewindPromises.length} rewinds en parallèle dans handleExpansionConflicts`);
                await Promise.all(rewindPromises);
                console.log(`✅ Tous les rewinds terminés dans handleExpansionConflicts`);
            }
        }

        // Traiter les edges restantes (sans conflit)
        console.log(`🏘️ Traitement de ${edges.length} edges restantes pour expansion`);
        for (const edge of edges) {
            console.log(`🏘️ Création village expansion sur territoire (${edge.territory.position.q}, ${edge.territory.position.r}) pour clan ${edge.action.getClan().id}`);
            edge.territory.construction_type = "village";
            edge.territory.clan_id = edge.action.getClan().id;
            
            try {
                await edge.territory.createConstruction(this.gameBoard, this.gameBoard?.meepleManager);
                console.log(`✅ Village expansion créé avec succès`);
            } catch (error) {
                console.error(`❌ Erreur création village expansion:`, error);
            }
        }
    },

    // Gérer les urbanisations gratuites
    async handleFreeUrbanizations(processedTurns) {
        const colonizationActions = gameState.game.actions.filter(action => 
            action.turn === processedTurns && action.development_type === "colonisation"
        );

        let hasUrbanization = false;
        const groupsToUrbanize = [];

        for (const action of colonizationActions) {
            const territory = action.getTerritory();
            const clan = action.getClan();
            
            if (territory.clan_id === clan.id) {
                const connectedGroup = this.findConnectedTerritoryGroup(territory, clan.id);
                
                // Vérifier si tous les territoires sont des villages
                const allVillages = connectedGroup.every(t => t.construction_type === "village");
                
                if (allVillages && connectedGroup.length > 0) {
                    hasUrbanization = true;
                    groupsToUrbanize.push({ group: connectedGroup, origin: territory });
                }
            }
        }

        if (hasUrbanization && this.animation) {
            await this.showMessageAndWaitNext('free_urbanization');
        }

        // Effectuer les urbanisations
        console.log(`🏙️ Effectuer ${groupsToUrbanize.length} urbanisations gratuites`);
        for (const { group, origin } of groupsToUrbanize) {
            console.log(`🏙️ Urbanisation gratuite sur territoire (${origin.position.q}, ${origin.position.r})`);
            console.log(`🏙️ Groupe connexe de ${group.length} territoires`);
            
            origin.construction_type = "ville";
            
            try {
                await origin.createConstruction(this.gameBoard, this.gameBoard?.meepleManager);
                console.log(`✅ Ville créée avec succès`);
            } catch (error) {
                console.error(`❌ Erreur création ville:`, error);
            }
        }
    },

    // Gérer les expansions niveau 3 (temples et taxes)
    async handleColonisation3(processedTurns) {
        console.log(`🏛️ Gestion des expansions niveau 3 (temples et taxes)`);
        
        // Récupérer toutes les actions d'expansion niveau 3
        const expansion3Actions = gameState.game.actions.filter(action => 
            action.turn === processedTurns && 
            action.development_type === "expantion" && 
            action.development_level === 3
        );
        
        console.log(`🏛️ Trouvé ${expansion3Actions.length} actions d'expansion niveau 3`);
        
        // Si aucune action, on s'arrête
        if (expansion3Actions.length === 0) {
            console.log(`🏛️ Aucune action d'expansion niveau 3, arrêt`);
            return;
        }
        
        // Étape 1: Créer les temples sur les territoires qui n'en ont pas
        const templeCreationPromises = [];
        for (const action of expansion3Actions) {
            const territory = action.getTerritory();
            if (!territory) {
                console.warn(`⚠️ Territory non trouvé pour l'action`, action);
                continue;
            }
            
            console.log(`🏛️ Vérification du temple sur territoire (${territory.position.q}, ${territory.position.r})`);
            
            if (!territory.hasTemple) {
                console.log(`🏛️ Création du temple sur territoire (${territory.position.q}, ${territory.position.r})`);
                territory.hasTemple = true;
                
                try {
                    if (this.gameBoard && this.gameBoard.meepleManager) {
                        const templePromise = territory.createTemple(this.gameBoard, this.gameBoard.meepleManager);
                        templeCreationPromises.push(templePromise);
                    }
                } catch (error) {
                    console.error(`❌ Erreur lors de la création du temple:`, error);
                }
            } else {
                console.log(`🏛️ Temple déjà présent sur territoire (${territory.position.q}, ${territory.position.r})`);
            }
        }
        
        // Attendre la création de tous les temples
        if (templeCreationPromises.length > 0) {
            try {
                await Promise.all(templeCreationPromises);
                console.log(`✅ ${templeCreationPromises.length} temples créés`);
            } catch (error) {
                console.error(`❌ Erreur lors de la création des temples:`, error);
            }
        }
        
        // Étape 2: Créer les taxes pour les territoires adjacents avec des clans différents
        const allTempleTaxes = [];
        
        for (const action of expansion3Actions) {
            const territory = action.getTerritory();
            const receivingClan = action.getClan();
            
            if (!territory || !receivingClan) {
                console.warn(`⚠️ Territory ou clan non trouvé pour l'action`, action);
                continue;
            }
            
            console.log(`💰 Création des taxes pour territoire (${territory.position.q}, ${territory.position.r}), clan ${receivingClan.color}`);
            
            // Récupérer les provinces adjacentes
            const adjacentTerritories = territory.adjacentProvinces || [];
            
            for (const adjacentTerritory of adjacentTerritories) {
                // Vérifier si le territoire adjacent a un clan différent
                if (adjacentTerritory.clan_id && adjacentTerritory.clan_id !== territory.clan_id) {
                    const payingClan = gameState.getClanById(adjacentTerritory.clan_id);
                    
                    if (payingClan) {
                        // Vérifier qu'il n'existe pas déjà une taxe identique
                        const existingTax = allTempleTaxes.find(tax => 
                            tax.sourceTerritory === adjacentTerritory && 
                            tax.targetTerritory === territory &&
                            tax.payingClan === payingClan &&
                            tax.receivingClan === receivingClan
                        );
                        
                        if (!existingTax) {
                            const newTax = new templeTax(
                                adjacentTerritory,  // sourceTerritory
                                payingClan,         // payingClan
                                territory,          // targetTerritory  
                                receivingClan,      // receivingClan
                                0                   // amount (sera calculé plus tard)
                            );
                            
                            allTempleTaxes.push(newTax);
                            console.log(`💰 Taxe créée: ${payingClan.color} → ${receivingClan.color}`);
                        }
                    }
                }
            }
        }
        
        console.log(`💰 Total de ${allTempleTaxes.length} taxes créées`);
        
        // Étape 3: Calculer les montants des taxes par clan
        const clansWithTaxes = new Map(); // clan_id → templeTax[]
        
        // Regrouper les taxes par clan payeur
        for (const tax of allTempleTaxes) {
            const clanId = tax.payingClan.id;
            if (!clansWithTaxes.has(clanId)) {
                clansWithTaxes.set(clanId, []);
            }
            clansWithTaxes.get(clanId).push(tax);
        }
        
        // Calculer les montants selon le chao disponible
        for (const [clanId, taxCollection] of clansWithTaxes) {
            const clan = gameState.getClanById(clanId);
            const taxCount = taxCollection.length;
            
            console.log(`💰 Calcul des taxes pour clan ${clan.color}: ${taxCount} taxes, ${clan.available_chao} chao disponible`);
            
            let amountPerTax = 0;
            
            if (clan.available_chao >= 2 * taxCount) {
                // Cas 1: Assez de chao pour payer 2 par taxe
                amountPerTax = 2;
                console.log(`💰 Clan ${clan.color}: paiement de 2 chao par taxe`);
            } else if (clan.available_chao >= taxCount) {
                // Cas 2: Assez de chao pour payer 1 par taxe
                amountPerTax = 1;
                console.log(`💰 Clan ${clan.color}: paiement de 1 chao par taxe`);
            } else {
                // Cas 3: Pas assez de chao
                amountPerTax = 0;
                console.log(`💰 Clan ${clan.color}: pas assez de chao, aucun paiement`);
            }
            
            // Appliquer le montant à toutes les taxes de ce clan
            for (const tax of taxCollection) {
                tax.amount = amountPerTax;
            }
        }
        
        // Étape 4: Effectuer les transferts de chao
        const effectiveTaxes = allTempleTaxes.filter(tax => tax.amount > 0);
        console.log(`💰 ${effectiveTaxes.length} taxes effectives à traiter`);
        
        for (const tax of effectiveTaxes) {
            console.log(`💰 Transfert: ${tax.payingClan.color} (${tax.payingClan.available_chao}) → ${tax.receivingClan.color} (${tax.receivingClan.available_chao}), montant: ${tax.amount}`);
            
            tax.payingClan.available_chao -= tax.amount;
            tax.receivingClan.available_chao += tax.amount;
            
            console.log(`💰 Après transfert: ${tax.payingClan.color} (${tax.payingClan.available_chao}), ${tax.receivingClan.color} (${tax.receivingClan.available_chao})`);
        }
        
        // Étape 5: Animation et affichage si activé
        const activeTaxAnimations = [];
        if (this.animation && effectiveTaxes.length > 0) {
            console.log(`🎬 Animation des taxes activée`);
            
            // Créer les animations de taxes
            for (const tax of effectiveTaxes) {
                try {
                    const taxAnimation = new renderTax(
                        tax.sourceTerritory, 
                        tax.targetTerritory, 
                        tax.amount, 
                        this.gameBoard
                    );
                    activeTaxAnimations.push(taxAnimation);
                } catch (error) {
                    console.error(`❌ Erreur lors de la création de l'animation de taxe:`, error);
                }
            }
            
            // Afficher le message et attendre
            await this.showMessageAndWaitNext('temple_tax_complete');
            
            // Supprimer toutes les animations de taxes
            for (const taxAnimation of activeTaxAnimations) {
                try {
                    taxAnimation.delete();
                } catch (error) {
                    console.error(`❌ Erreur lors de la suppression de l'animation de taxe:`, error);
                }
            }
        }
        
        // Étape 6: Nettoyer toutes les taxes
        for (const tax of allTempleTaxes) {
            tax.delete();
        }
        
        console.log(`✅ Gestion des temples et taxes terminée`);
    },

    // Finalisation de la phase de développement
    async finalizeDevelopmentPhase() {
        console.log(`🏁 Finalisation de la phase de développement`);
        
        // Afficher le message de fin de phase
        // await this.showMessageAndWaitNext('conquest_phase_complete');
        await this.wait();
        
        // Supprimer toutes les flèches et libérer la mémoire
        console.log(`🧹 Suppression de toutes les flèches...`);
        arrowManager.clearAllArrows();
        console.log(`✅ Toutes les flèches supprimées`);
        
        // Supprimer tous les sprites tax2Chao
        console.log(`🧹 Suppression des sprites tax2Chao...`);
        this.removeAllTax2ChaoSprites();
        console.log(`✅ Tous les sprites tax2Chao supprimés`);
        
        // Afficher la barre avec seulement le menu
        console.log(`🎛️ Affichage barre menu seulement`);
        uiManager.showMenuOnlyBar();
    },

    async handleRevenusColonisation23EtExpansion2(processedTurns) {
        console.log(`💰 Gestion des revenus de colonisation 2 et 3 et expention 2`);
        
        const actions = gameState.game.actions.filter(action => 
            action.turn === processedTurns && 
            ((action.development_type === "colonisation" && (action.development_level === 2 || action.development_level === 3)) ||
            (action.development_type === "expantion" && action.development_level === 2))
        );

        if (actions.length === 0) {
            console.log(`💰 Aucune action de colonisation 2 ou 3 ou expention 2 trouvée`);
            return;
        }

        for (const action of actions) {
            const clan = action.getClan();
            const territory = action.getTerritory();
            clan.available_chao += 2;

            if (actions.length > 0 && this.animation) {
                // Créer le sprite tax2Chao sur le territoire
                this.createTax2ChaoSprite(territory);
            }
        }   
        if (actions.length > 0 && this.animation) {
            await this.showMessageAndWaitNext('revenue_collected');
            this.removeAllTax2ChaoSprites();
        }
    },

    // Créer un sprite tax2Chao sur un territoire avec animation
    async createTax2ChaoSprite(territory) {
        if (!this.gameBoard || !this.gameBoard.meepleManager) {
            console.warn(`⚠️ gameBoard ou meepleManager non disponible pour créer le sprite tax2Chao`);
            return;
        }

        try {
            // Obtenir la position cartésienne du territoire
            const cartesianPos = territory.getCartesianPosition(this.gameBoard);
            
            // Créer le sprite tax2Chao à une hauteur de base de 0.5
            const spritePosition = {
                x: cartesianPos.x,
                y: 0.5,
                z: cartesianPos.z
            };

            const tax2ChaoSprite = await this.gameBoard.meepleManager.createSpriteInstance(
                'tax2Chao',
                spritePosition,
                null, // Pas de couleur personnalisée
                { territory: territory }
            );

            if (tax2ChaoSprite) {
                // Supprimer le sprite original du workplane
                this.gameBoard.workplane.remove(tax2ChaoSprite);
                
                // Créer un vrai THREE.Sprite qui reste face à la caméra
                const verticalSprite = await this.createVerticalSprite(territory, cartesianPos);
                
                // Stocker la référence pour pouvoir la supprimer plus tard
                this.echaoSprites.push(verticalSprite);
                
                // Démarrer l'animation d'oscillation en boucle
                this.startTax2ChaoAnimation(verticalSprite, 0.5);
                
                console.log(`💰 Sprite tax2Chao vertical créé sur territoire (${territory.position.q}, ${territory.position.r}) avec animation`);
            }
        } catch (error) {
            console.error(`❌ Erreur lors de la création du sprite tax2Chao:`, error);
        }
    },

    // Créer un vrai THREE.Sprite vertical qui reste face à la caméra
    async createVerticalSprite(territory, position) {
        try {
            // Charger la texture 2chao.webp
            const textureLoader = new THREE.TextureLoader();
            const texture = await new Promise((resolve, reject) => {
                textureLoader.load(
                    './images/2chao.webp',
                    (loadedTexture) => {
                        loadedTexture.colorSpace = THREE.SRGBColorSpace;
                        resolve(loadedTexture);
                    },
                    undefined,
                    reject
                );
            });

            // Créer le matériau du sprite
            const spriteMaterial = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                alphaTest: 0.5,
                toneMapped: false,
                fog: false,
                color: 0xffffff
            });

            // Créer le sprite
            const sprite = new THREE.Sprite(spriteMaterial);
            
            // Définir la taille du sprite (carré)
            sprite.scale.set(0.5, 0.5, 1); // Largeur, hauteur (la profondeur n'a pas de sens pour un sprite)
            
            // Positionner le sprite
            sprite.position.set(position.x, 0.7, position.z);
            
            // Ajouter au workplane
            this.gameBoard.workplane.add(sprite);
            
            // Ajouter les données utilisateur
            sprite.userData = { territory: territory };
            
            return sprite;
        } catch (error) {
            console.error(`❌ Erreur lors de la création du sprite vertical:`, error);
            return null;
        }
    },

    // Animer le sprite tax2Chao avec une oscillation verticale fluide en boucle
    startTax2ChaoAnimation(sprite, baseHeight) {
        const amplitude = 0.3; // Amplitude de l'oscillation (0.3 unités au-dessus et en-dessous)
        const duration = 2000; // Durée d'un cycle complet en ms
        const startTime = Date.now();
        
        // Fonction d'animation utilisant une courbe cosinus pour un mouvement fluide
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = (elapsed % duration) / duration; // Utiliser modulo pour la boucle
            
            // Utiliser une courbe cosinus pour un mouvement fluide avec ralentissement aux extrémités
            // La fonction cosinus va de 1 à -1, on la normalise pour aller de 0 à 1
            const cosineValue = (Math.cos(progress * Math.PI * 2) + 1) / 2;
            
            // Appliquer l'oscillation verticale
            const newY = baseHeight + (cosineValue * amplitude);
            sprite.position.y = newY;
            
            // Continuer l'animation en boucle
            requestAnimationFrame(animate);
        };
        
        // Démarrer l'animation
        requestAnimationFrame(animate);
        console.log(`🎬 Animation tax2Chao démarrée en boucle (${duration}ms par cycle, amplitude: ${amplitude})`);
    },

    // Supprimer tous les sprites tax2Chao
    removeAllTax2ChaoSprites() {
        if (!this.gameBoard || this.echaoSprites.length === 0) return;
        
        console.log(`🗑️ Suppression de ${this.echaoSprites.length} sprites tax2Chao`);
        
        for (const sprite of this.echaoSprites) {
            this.gameBoard.workplane.remove(sprite);
        }
        
        this.echaoSprites = [];
        console.log(`✅ Tous les sprites tax2Chao supprimés`);
    },
}
// pour le debug
window.developpementAndMore = developpementAndMore;
