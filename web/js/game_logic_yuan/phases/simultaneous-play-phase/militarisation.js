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
        // if (this.animation) {
        //     uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.recrutement_complete'));
        //     await uiManager.waitForNext();
        // }
        if ((this.animation) && (this.actionsOfTurn.filter(action => action.militarisation_type === "recrutement").length > 0)) {
            this.wait(1000);
        }
        console.log("🔄 debut attaques" , this.actionsOfTurn.filter(action => action.militarisation_type === "attaque"));
        await this.realiseAttaques(this.actionsOfTurn.filter(action => action.militarisation_type === "attaque"));
        // if (this.animation) {
        //     uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.attaque_complete'));
        //     await uiManager.waitForNext();
        // }
        if ((this.animation) && (this.actionsOfTurn.filter(action => action.militarisation_type === "attaque").length > 0)) {
            this.wait(1000);
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

    wait(times){
        if (this.animation) {
            return new Promise(resolve => setTimeout(resolve, times));
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
                await this.wait(500);
            }
            if (action.militarisation_level===3) {
                // action.warriors += 3;
                console.log('🔄 debut recrutement3');
                territory.warriors += 3;
                territory.createWarriors(this.gameBoard, this.gameBoard.meepleManager, 1, true);
                await this.wait(500);
                territory.createWarriors(this.gameBoard, this.gameBoard.meepleManager, 1, true);
                await this.wait(500);
                territory.createWarriors(this.gameBoard, this.gameBoard.meepleManager, 1, true);
                await this.wait(500);
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
            (actions.length > 0) && await this.wait(1000);
        }
        console.log("voila les conflits: ", conflicts);

        await this.manageConflicts(conflicts, actions, false);
    },




    
    async manageConflicts(conflicts, actions, zone = false) {
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
            else {
                intermediateConflicts.push(conflicts[0]);
            }
        }
        if (this.animation && removalPromises.length > 0) {
            await Promise.all(removalPromises);

        }
        // log des conflits restant apres les afontement des attaquans
        console.log("voila les conflits restant apres les afontement des attaquans entre eux", intermediateConflicts);
        



        //conflit externe fini, mainteantant, on gere les conflits locaux
        let finalLocalConflicts = [];
        // Helpers basiques
        const removeFromConflictArrows = async (conflict, count) => {
            if (!this.animation || count <= 0) return;
            const arrows = conflict.arrow;
            let remaining = count;
            const promises = [];
            for (const arr of arrows) {
                const take = Math.min(remaining, arr.warriorMeshes.length);
                if (take > 0) {
                    promises.push(arr.removeWarriorsWithAnimation(take));
                    remaining -= take;
                }
                if (remaining <= 0) break;
            }
            await Promise.all(promises);
        };
        const removeFromTerritory = async (territory, count) => {
            if (!this.animation || count <= 0 || !territory?.warriors_mesh?.length) return; // probablemet un probleme, il faut suprimer les worrior aussi si il ni a pas d'animation
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
            const attackForce = conflict.warriors;
            let defenseForce = 0;
            if (conflict.territory.rempart === 'fortifiee') {
                defenseForce = conflict.territory.warriors + 2;
                }
            else if (conflict.territory.rempart === 'indestruible') {
                defenseForce = Infinity;
            }
            else {
                defenseForce = conflict.territory.warriors;
            }
            const casualties = Math.min(attackForce, defenseForce);
            let p1 = null;
            if (!zone) {
                p1 = removeFromConflictArrows(conflict, casualties);
            }
            const p2 = removeFromTerritory(conflict.territory, casualties);
            await Promise.all([p1, p2]);
            conflict.warriors -= casualties;
            conflict.territory.warriors = Math.max(0, conflict.territory.warriors - casualties);
            if (conflict.warriors > 0) {
                finalLocalConflicts.push(conflict);
                conflict.territory.rempart = null;
                conflict.territory.removeRempart(this.gameBoard);
            }
        }



        
        intermediateConflicts = null;
        console.log("voila les conflits locaux restant apres les  attaquans et attaques la province cible, juste avand de gerer les conflicts de zone",finalLocalConflicts);


        // contestingTerritories, ce sont l'integralite de territoires conteste, en comprenant les reactions en chaine. un territoire peut etre conteste par plusieurs clans
        // tableau de bi objet : territory, clan
        let contestingTerritories = [];
        for (const conflict of finalLocalConflicts) {
            contestingTerritories.push({territory: conflict.territory, conflict: conflict}) // on ajoute le territory cible directement avec son conflict associé
            // const territoriesZone = finalLocalConflicts.filter(conflict2 => conflict2.territory.clan === conflict.territory.clan).map(conflict3 => conflict3.territory);
            const territoriesZone = finalLocalConflicts.filter(conflict2 => conflict2.attacker === conflict.attacker).map(conflict3 => conflict3.territory);
            console.log("voila les territoires zone", territoriesZone, "zone :" ,zone); // ce sont les provinces vise par le seul conflict qu'on est en train de treter (donc un seul conflict si pas zone)
            const territoriesClan = gameState.game.territories.filter(territory => territory.clan_id === conflict.territory.clan_id && !territoriesZone.includes(territory));
            console.log("voila les territoires clan", territoriesClan);
            const groupConnectedTerritories = this.groupConnectedTerritories(territoriesClan);
            for (const group of groupConnectedTerritories) {        
                if (group.filter(territory => territory.construction_type === 'ville' || territory.construction_type === '2villes').length === 0) {
                    for (const territory of group) {
                        const contestingTerritory = {territory: territory, conflict: conflict, range: null};
                        contestingTerritories.push(contestingTerritory);
                    }
                }
            }
        }
        console.log("voila les territoires contestes", contestingTerritories);


        function computeRange(from, to) {
            const visited = new Set();
            const queue = [{ t: from, d: 0 }];
            visited.add(from);
            while (queue.length > 0) {
                const { t, d } = queue.shift();
                if (t === to) return d;
                for (const n of t.adjacentProvinces) {
                    if (!visited.has(n)) {
                        visited.add(n);
                        queue.push({ t: n, d: d + 1 });
                    }
                }
            }
            return 0;
        }


        for (const ct of contestingTerritories) {
            ct.range = computeRange(ct.territory, ct.conflict.territory);
        }

        const contestingTerritoriesGroup = new Map();
        for (const ct of contestingTerritories) {
            if (!contestingTerritoriesGroup.has(ct.territory)) {
                contestingTerritoriesGroup.set(ct.territory, []);
            }
            contestingTerritoriesGroup.get(ct.territory).push(ct);
        }

        const filteredConflicts = new Map();
        for (const [territory, cts] of contestingTerritoriesGroup) {
            let minRange = Infinity;
            for (const ct of cts) {
                if (ct.range < minRange) minRange = ct.range;
            }
            const withMinRange = cts.filter(ct => ct.range === minRange);
            const byAttacker = new Map();
            for (const ct of withMinRange) {
                const key = ct.conflict.attacker;
                if (!byAttacker.has(key)) {
                    byAttacker.set(key, ct);
                } else {
                    if (Math.random() < 0.5) byAttacker.set(key, ct);
                }
            }
            const kept = Array.from(byAttacker.values());
            const chosen = kept.length > 0 ? kept[0] : withMinRange[0];
            filteredConflicts.set(territory, chosen.conflict);
        }
        console.log("filteredConflicts", filteredConflicts);


        // on rend neutre les province en conflit
        for (const territory of filteredConflicts.keys()) {
            territory.clan_id = null;
            territory.warriors = 0;
            territory.removeWarriors(this.gameBoard);
            territory.removeConstruction(this.gameBoard);

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
        (actions.length > 0) && await this.wait(500);

        // on change le clan, enleve les constructions et les guerriers, on passe tout en village du nouveau proprietaire
        for (const [territory, conflict] of filteredConflicts) {
            territory.clan_id = conflict.attacker.id;
            territory.warriors = 0;
            territory.removeWarriors(this.gameBoard);
            territory.construction_type = 'village';
            territory.createConstruction(this.gameBoard, this.gameBoard.meepleManager);          
        }
        (actions.length > 0) && await this.wait(500);


        // on creer les nouveau warriors, suprimer les arrow et warrior associes
        console.log("finalLocalConflicts", finalLocalConflicts);
        console.log("filteredConflicts", filteredConflicts);
        for (const conflict of finalLocalConflicts) {
            if(!zone) {
                conflict.territory.warriors = conflict.warriors;
                conflict.territory.createWarriors(this.gameBoard, this.gameBoard.meepleManager, conflict.warriors,false);
            }
        }

        if (this.animation) {
            // ici suprimer tout les warriors de tout les arrows puis suprimer tout les arrows
            for (const arr of arrowManager.arrows) {
                arr.removeWarriorsImmediate(arr.warriorMeshes.length);
            }
            // Ensuite, supprimer toutes les arrows et libérer la mémoire associée
            arrowManager.clearAllArrows();
            (actions.length > 0) && await this.wait(1000);
        }

        // on attribue les urbanisation gratuite. On le re fais apres l'attaque de zone au cas ou la dernier ville a ete perdue par un attaquant de zone
        const hasFreeUrbanization = actions.some(action => {
            return action.getTerritory().getConnectedClanTerritories()
                .every(t => t.construction_type !== 'ville' && t.construction_type !== '2villes');
        });

        if (hasFreeUrbanization && this.animation) {
            uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.attaque_free_urbanization'));
            await uiManager.waitForNext();
        }
        for (const action of actions) {
            const territory = action.getTerritory();
            if (territory.getConnectedClanTerritories().filter(territory => territory.construction_type === 'ville' || territory.construction_type === '2villes').length === 0) {
                territory.construction_type = 'ville';
                territory.createConstruction(this.gameBoard, this.gameBoard.meepleManager);
            }
        }
        (hasFreeUrbanization && this.animation) && await this.wait(1000);

        // ici on gere les attaque de zone
        // on recupere les actions d'attaque de zone qui on conqui leur cible
        let conflictsZone = [];
        if (!zone) {
            let actionsZone = [];
            for (const conflict of finalLocalConflicts) {
                const conflictAction = actions.filter(action => action.getClan() === conflict.attacker)[0] //je recupere l'action a l'origine du conflict que j'ai oublier de stoquer dans le conflict
                if (conflictAction.militarisation_level === 3) {
                    actionsZone.push(conflictAction);
                }
            }
            // on cree les conflits de zone
            let arrowPromisesZone = this.animation ? [] : null;
            for (const action of actionsZone) {
                const provinceZone = action.getTerritory().adjacentProvinces.filter(province => province.clan_id !== action.getClan().id && province.clan_id !== null)
                console.log("voila les provinces zone", provinceZone);
                for (const province of provinceZone) {
                    const conflict = {territory: province, warriors: 1, attacker: action.getClan(), arrow: []};
                    conflictsZone.push(conflict);
                    if (this.animation) {
                        const arrowPromise = arrowManager.createArrow(action, [action.getTerritory(), province], "attaque", 0, 0).then(arrow => {
                            conflict.arrow.push(arrow);
                            return arrow;
                        });
                        arrowPromisesZone.push(arrowPromise);
                    }
                }
            }
            if (this.animation) await Promise.all(arrowPromisesZone);
        }
        console.log("avant zone");
        // if (this.animation) await uiManager.waitForNext();
        (actions.length > 0) && await this.wait(1000);


        const attaque3=actions.filter(action => action.militarisation_level === 3);
        if (!zone && attaque3.length > 0) await this.manageConflicts(conflictsZone, actions, true);
    },
            
}






        

