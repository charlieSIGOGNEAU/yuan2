import { gameState } from '../../gameState.js';
import { uiManager } from '../../ui/UIManager.js';
import { i18n } from '../../../core/i18n.js';
import { arrowManager } from '../../gameplay/arrowManager.js';

export const militarisation = {
    animation: true,
    gameBoard: null,
    actionsOfTurn: [],

    async setupMilitarisation(gameBoard, processedTurns) {
        this.gameBoard = gameBoard;
        this.actionsOfTurn = gameState.game.actions.filter(action => action.turn === processedTurns);
        this.assigneMilitarisation(this.actionsOfTurn);
        await this.realiseRecrutements(this.actionsOfTurn.filter(action => action.militarisation_type === "recrutement"));
        if (this.animation) {
            uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.recrutement_complete'));
            await uiManager.waitForNext();
        }
        console.log("🔄 debut attaques" , this.actionsOfTurn.filter(action => action.militarisation_type === "attaque"));
        await this.realiseAttaques(this.actionsOfTurn.filter(action => action.militarisation_type === "attaque"));
        if (this.animation) {
            uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.attaque_complete'));
            await uiManager.waitForNext();
        }
    },

    assigneMilitarisation(actionsOfTurn) {
        for (const action of actionsOfTurn) {
            const territory = action.getTerritory();
            const clan = action.getClan();

            if (action.militarisation_level > 0) {
                if (this.isRecrutement(territory, clan)) action.militarisation_type = "recrutement";
                else if (this.isAttaque(territory, clan)) action.militarisation_type = "attaque";
                else action.militarisation_type = "";
            }
        }     
    },

    isRecrutement(territoryCible, clan) {
        return ((territoryCible.clan_id === clan.id) && ((territoryCible.construction_type === 'ville') || (territoryCible.construction_type === '2villes'))); 
    },

    isAttaque(territoryCible, clan) {
        return ((territoryCible.clan_id && (territoryCible.clan_id !== clan.id))) &&
            ((territoryCible.connectedProvinces.filter(province => (province.clan_id === clan.id) && (province.warriors > 0))).length > 0) // verification que la province cible est conecte a une arme possede
    },

    wait(){
        if (this.animation) {
            return new Promise(resolve => setTimeout(resolve, 500));
        }
    },

    async realiseRecrutements(actions) {
        for (const action of actions) {
            const territory = action.getTerritory();
            if (action.militarisation_level===1 && action.isMyAction()) {
                uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.recruitment_level1'));
                await uiManager.waitForNext();
            }
            if (action.militarisation_level===2) {
                // action.warriors += 1;
                console.log('🔄 debut recrutement2');
                territory.warriors += 1;
                territory.createWarriors(this.gameBoard, this.gameBoard.meepleManager, 1, true);
                await this.wait();
            }
            if (action.militarisation_level===3) {
                // action.warriors += 3;
                console.log('🔄 debut recrutement3');
                territory.warriors += 3;
                territory.createWarriors(this.gameBoard, this.gameBoard.meepleManager, 1, true);
                await this.wait();
                territory.createWarriors(this.gameBoard, this.gameBoard.meepleManager, 1, true);
                await this.wait();
                territory.createWarriors(this.gameBoard, this.gameBoard.meepleManager, 1, true);
                await this.wait();
            }

        }

    },

    groupConnectedTerritories(territories) {
        const groups = [];
        const visited = new Set();
    
        function dfs(current, group) {
            group.push(current);
            visited.add(current);
            for (const neighbor of current.adjacentProvinces) {
                if (territories.includes(neighbor) && !visited.has(neighbor)) {
                    dfs(neighbor, group);
                }
            }
        }
    
        for (const territory of territories) {
            if (!visited.has(territory)) {
                const group = [];
                dfs(territory, group);
                groups.push(group);
            }
        }
        return groups;
    },

    async realiseAttaques(actions) {
        
        let conflicts = [];
        let arrowPromises = [];
        for (const action of actions) {
            const territory = action.getTerritory();
            const conflict = {territory: territory, warriors: 0, attacker: action.getClan(), arrow: []};

            let moreOne = action.militarisation_level > 1;
            if (moreOne) conflict.warriors = 1;

            for (const province of territory.connectedProvinces) {
                if (province.clan_id === action.getClan().id && province.warriors > 0) {
                    conflict.warriors += province.warriors;         
                    if (this.animation) {
                        let arrowWarriors = moreOne ? (province.warriors + 1) : province.warriors;
                        const arrowPromise = arrowManager.createArrow(action, province.findShortestPathTo(territory), "attaque", arrowWarriors, 0).then(arrow => {
                            conflict.arrow.push(arrow);
                            console.log("arrow", arrow);
                            return arrow;
                        });
                        arrowPromises.push(arrowPromise);
                        moreOne = false;
                    }
                    province.warriors = 0;
                    province.removeWarriors(this.gameBoard);
                }
            }
            conflicts.push(conflict);
        }

        if (this.animation && arrowPromises.length > 0) {
            console.log(`⏳ Attente de ${arrowPromises.length} animations de flèches attaque...`);
            await Promise.all(arrowPromises);
            console.log(`✅ Toutes les animations attaque terminées`);
        }

        console.log("voila les conflits: ", conflicts);

        // on groupe les conflits par territoire
        let conflictsByTerritory = new Map();

        for (const conflict of conflicts) {
            if (!conflictsByTerritory.has(conflict.territory)) {
                conflictsByTerritory.set(conflict.territory, []);
            }
            conflictsByTerritory.get(conflict.territory).push(conflict);
        }
        conflicts = null;
        // log des conflits par territoire
        console.log("voila les groupe de territoires attaques");
        for (const [territory, group] of conflictsByTerritory) {
            console.log("Territoire:", territory, "Conflits:", group);
        }



        // mainteant on creer les conflit restant apres les attaques entre les attaquants
        let intermediateConflicts = [];
        const removalPromises = [];
        for (const [territory, conflicts] of conflictsByTerritory) {
            if (conflicts.length > 1) {
                conflicts.sort((a, b) => b.warriors - a.warriors);
                const strongest = conflicts[0];
                const second = conflicts[1];
                strongest.warriors = strongest.warriors - second.warriors;
                if (this.animation) {
                    // Supprimer visuellement en parallèle sur TOUTES les flèches de CHAQUE conflit
                    const perConflictRemove = Math.max(0, second.warriors | 0);
                    if (perConflictRemove > 0) {
                        for (const c of conflicts) {
                            let remaining = perConflictRemove;
                            const arrows = Array.isArray(c.arrow) ? c.arrow : (c.arrow ? [c.arrow] : []);
                            for (const arr of arrows) {
                                if (!arr || typeof arr.removeWarriorsWithAnimation !== 'function') continue;
                                const available = (arr.warriorMeshes && arr.warriorMeshes.length) ? arr.warriorMeshes.length : 0;
                                if (available <= 0) continue;
                                const take = Math.min(remaining, available);
                                if (take > 0) {
                                    removalPromises.push(arr.removeWarriorsWithAnimation(take));
                                    remaining -= take;
                                }
                                if (remaining <= 0) break;
                            }
                            // S'il n'y a plus de guerriers disponibles sur cet ensemble de flèches, on passe simplement au suivant
                        }
                    }
                }
                if (strongest.warriors > 0) intermediateConflicts.push(strongest);
            }
        }
        if (this.animation && removalPromises.length > 0) {
            await Promise.all(removalPromises);
        }
        // log des conflits restant apres les afontement des attaquans
        console.log("voila les conflits restant apres les afontement des attaquans", intermediateConflicts);



        //conflit externe fini, mainteantant, on gere les conflits locaux
        let finalLocalConflicts = [];
        // Helpers basiques
        const removeFromConflictArrows = async (conflict, count) => {
            if (!this.animation || count <= 0) return;
            const arrows = Array.isArray(conflict.arrow) ? conflict.arrow : (conflict.arrow ? [conflict.arrow] : []);
            let remaining = count;
            const promises = [];
            for (const arr of arrows) {
                if (!arr || typeof arr.removeWarriorsWithAnimation !== 'function') continue;
                const available = (arr.warriorMeshes && arr.warriorMeshes.length) ? arr.warriorMeshes.length : 0;
                if (available <= 0) continue;
                const take = Math.min(remaining, available);
                if (take > 0) {
                    promises.push(arr.removeWarriorsWithAnimation(take));
                    remaining -= take;
                }
                if (remaining <= 0) break;
            }
            await Promise.all(promises);
        };
        const removeFromTerritory = async (territory, count) => {
            if (!this.animation || count <= 0 || !territory?.warriors_mesh?.length) return;
            let remaining = count;
            const promises = [];
            while (remaining > 0 && territory.warriors_mesh.length > 0) {
                const mesh = territory.warriors_mesh.pop();
                if (mesh) promises.push(arrowManager.animateAndRemoveMesh(mesh));
                remaining--;
            }
            await Promise.all(promises);
        };
        for (const conflict of intermediateConflicts) {
            const casualties = Math.min(conflict.warriors, conflict.territory.warriors);
            const p1 = removeFromConflictArrows(conflict, casualties);
            const p2 = removeFromTerritory(conflict.territory, casualties);
            await Promise.all([p1, p2]);

            conflict.warriors -= casualties;
            conflict.territory.warriors -= casualties;

            if (conflict.warriors > 0) {
                finalLocalConflicts.push(conflict);
            }
        }
        intermediateConflicts = null;
        // log des conflits restant apres les afontement des attaquans
        console.log("voila les conflit locaux restant apres les afontements des attaquans",finalLocalConflicts);

        // contestingTerritories, ce sont l'integralite de territoires conteste, en comprenant les reactions en chaine. un territoire peut etre conteste par plusieurs clans
        // tableau de bi objet : territory, clan
        let contestingTerritories = [];
        for (const conflict of finalLocalConflicts) {
            contestingTerritories.push({territory: conflict.territory, conflict: conflict}) // on ajoute les territory cible directement
            const territoriesZone = finalLocalConflicts.filter(conflict2 => conflict2.territory.clan === conflict.territory.clan).map(conflict3 => conflict3.territory);
            console.log("voila les territoires zone", territoriesZone);
            const territoriesClan = gameState.game.territories.filter(territory => territory.clan_id === conflict.territory.clan_id && !territoriesZone.includes(territory));
            console.log("voila les territoires clan", territoriesClan);
            const groupConnectedTerritories = this.groupConnectedTerritories(territoriesClan);
            for (const group of groupConnectedTerritories) {        
                if (group.filter(territory => territory.construction_type === 'ville' || territory.construction_type === '2villes').length === 0) {
                    for (const territory of group) {
                        const contestingTerritory = {territory: territory, conflict: conflict};
                        contestingTerritories.push(contestingTerritory);
                    }
                }
            }
        }
        console.log("voila les territoires contestes", contestingTerritories);

        // on compte le nombre de territoires contestes par conflict
        const clanContestedCount = new Map();
        for (const ct of contestingTerritories) {
            const key = ct.conflict; 
            clanContestedCount.set(key, (clanContestedCount.get(key) || 0) + 1);
        }
        console.log("voila le nombre de territoires contestes par clan", clanContestedCount);

        // on groupe les territoires contestes par territoire
        const contestingTerritoriesGroup = new Map();
        for (const territoryConflict of contestingTerritories) {
            const territory = territoryConflict.territory;
            if (!contestingTerritoriesGroup.has(territory)) {
                contestingTerritoriesGroup.set(territory, []);
            }
            contestingTerritoriesGroup.get(territory).push(territoryConflict.conflict);
        }
        console.log("voila les territoires contestes par territoire", contestingTerritoriesGroup);

        
        
        // on filtre les conflits externe pour ne conserver que ce qui sont en bout de chaine
        const filteredConflicts = new Map();
        for (const [territory, conflicts] of contestingTerritoriesGroup) {
            let bestConflict = null;
            let minCount = Infinity;

            for (const conflict of conflicts) {
                const count = clanContestedCount.get(conflict.conflict) || 0;

                if (count < minCount) {
                    minCount = count;
                    bestConflict = conflict;
                }
            }
            filteredConflicts.set(territory, bestConflict);
        }
        console.log("voila les conflits filtres", filteredConflicts);

        // on rend neutre les province en conflit
        for (const territory of filteredConflicts.keys()) {
            territory.clan_id = null;
            territory.warriors = 0;
            territory.removeWarriors(this.gameBoard);
            territory.removeConstruction(this.gameBoard);
            console.log("territory", territory);
        }

        // on rend neutre les province non viable, et non revendiquee.
        for (const territory of gameState.game.territories.filter(territory => territory.clan_id != null && !filteredConflicts.has(territory))) {
            if (territory.getConnectedClanTerritories().filter(territory => territory.construction_type === 'ville' || territory.construction_type === '2villes').length === 0) {
                territory.clan_id = null;
                territory.warriors = 0;
                territory.removeWarriors(this.gameBoard);
                territory.removeConstruction(this.gameBoard);
            }
        }

        // on change le clan, enleve les constructions et les guerriers, on passe tout en village du nouveau proprietaire
        for (const [territory, conflict] of filteredConflicts) {
            territory.clan_id = conflict.attacker.id;
            territory.warriors = 0;
            territory.removeWarriors(this.gameBoard);
            territory.construction_type = 'village';
            territory.createConstruction(this.gameBoard, this.gameBoard.meepleManager);
        }

        // on creer les nouveau warriors, suprimer les arrow et warrior associes
        console.log("finalLocalConflicts", finalLocalConflicts);
        console.log("filteredConflicts", filteredConflicts);
        for (const conflict of finalLocalConflicts) {
            conflict.territory.warriors = conflict.warriors;
            conflict.territory.createWarriors(this.gameBoard, this.gameBoard.meepleManager, conflict.warriors,false);
        }

        if (this.animation) {
            // ici suprimer tout les warriors de tout les arrows puis suprimer tout les arrows
            for (const arr of arrowManager.arrows) {
                arr.removeWarriorsImmediate(arr.warriorMeshes.length);
            }
            // Ensuite, supprimer toutes les arrows et libérer la mémoire associée
            arrowManager.clearAllArrows();
        }

        // on attribue les urbanisation gratuite
        for (const action of actions) {
            const territory = action.getTerritory();
            if (territory.getConnectedClanTerritories().filter(territory => territory.construction_type === 'ville' || territory.construction_type === '2villes').length === 0) {
                territory.construction_type = 'ville';
                territory.createConstruction(this.gameBoard, this.gameBoard.meepleManager);
            }
        }
        await uiManager.waitForNext();

        // ici gerer les attaque de zone

    },
            
}






        

