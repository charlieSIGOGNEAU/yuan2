// Classes pour les modèles backend
import { TILE_CONFIGS } from './pieces/TileTypes.js';
import { meepleManager } from './pieces/MeepleManager.js';
import { ALL_CLANS } from './pieces/clanColors.js';



class User {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
    }

    update(data) {
        this.id = data.id || this.id;
        this.name = data.name || this.name;
    }
}

class Clan {
    constructor(data = {}) {
        this.id = data.id || null;
        this.game_id = data.game_id || null;
        this.color = data.color || '';
        this.honneur = this.getHonneur(data.name);
        this.verticalOffset = this.getVerticalOffset(data.name);
        this.name = data.name || '';
        this.start_q = data.start_q || 0;
        this.start_r = data.start_r || 0;
        this.available_chao = 6;
        this.numForests = 0;
        this.numRices = 0;
        this.numMines = 0;
        this.numTemples = 0;
        
        // Convertir le code hexadécimal en nom de couleur
        this.color_name = this.getColorName(this.color);
    }

    getHonneur(name) {
        const clan = ALL_CLANS.find(clan => clan.name === name);
        return clan ? clan.honneur : 0;
    }

    getVerticalOffset(name) {
        const clan = ALL_CLANS.find(clan => clan.name === name);
        return clan ? clan.verticalOffset : 0;
    }

    // Méthode pour convertir le code hexadécimal en nom de couleur
    getColorName(hexColor) {
        if (!hexColor) return '';
        
        // Chercher dans la liste des clans pour trouver la correspondance
        const matchingClan = ALL_CLANS.find(clan => clan.color_hex === hexColor);
        return matchingClan ? matchingClan.color_name : hexColor;
    }

    update(data) {
        this.id = data.id || this.id;
        this.game_id = data.game_id || this.game_id;
        this.color = data.color || this.color;
        this.name = data.name || this.name;
        this.start_q = data.start_q || this.start_q;
        this.start_r = data.start_r || this.start_r;
        
        // Mettre à jour color_name si la couleur a changé
        if (data.color && data.color !== this.color) {
            this.color_name = this.getColorName(data.color);
        }
    }
}

class GameUser {
    constructor(data = {}) {
        this.id = data.id || null;
        this.user_id = data.user_id || null;
        this.clan_id = data.clan_id || null;
        this.user_name = data.user_name || ''; 
    }

    update(data) {
        this.id = data.id || this.id;
        this.user_id = data.user_id || this.user_id;
        this.clan_id = data.clan_id || this.clan_id;
        this.user_name = data.user_name || this.user_name;
    }
}

class Tile {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || null;
        this.position = {
            q: data.position_q ?? null,
            r: data.position_r ?? null
        };
        this.rotation = data.rotation || 0;
        this.game_user_id = data.game_user_id || null;
        this.turn = data.turn || 0;
        this.sprite = null;
        this.terrain = null;
        this.terrainsCreated = false; // Flag pour savoir si les terrains ont été créés
        if (this.position && this.position.q !== null && this.name) {
            this.addTerrain();
        }
    }

    update(data) {
        this.id = data.id || this.id;
        this.name = data.name || this.name;
        if (data.position_q !== undefined || data.position_r !== undefined) {
            this.position = {
                q: data.position_q ?? this.position.q,
                r: data.position_r ?? this.position.r
            };
        }
        this.rotation = data.rotation || this.rotation;
        this.game_user_id = data.game_user_id || this.game_user_id;
        this.turn = data.turn || this.turn;
        if (this.position && this.position.q !== null && this.name && !this.terrainsCreated) {
            this.addTerrain();
        }
    }

    addTerrain() {
        // Récupérer la configuration de la tile
        const tileConfig = TILE_CONFIGS[this.name];
        if (!tileConfig) {
            console.error('Configuration non trouvée pour la tile:', this.name);
            return;
        }

        // Tableau des modifications de position pour chaque terrain
        const positionModifiers = [
            { q: +0, r: +0 },  // Centre
            { q: +1, r: +0 },  // Droite
            { q: +0, r: +1 },  // Haut droite
            { q: -1, r: +1 },  // Haut gauche
            { q: -1, r: +0 },  // Gauche
            { q: +0, r: -1 },  // Bas gauche
            { q: +1, r: -1 }   // Bas droite
        ];

        // Faire pivoter le tableau des terrains en fonction de la rotation
        const rotatedTerrains = [...tileConfig.terrains];
        // On garde le centre (index 0) et on fait pivoter le reste
        const center = rotatedTerrains[0];
        const rest = rotatedTerrains.slice(1);
        for (let i = 0; i < this.rotation; i++) {
            // Déplacer le dernier élément au début
            rest.unshift(rest.pop());
        }
        // Reconstruire le tableau avec le centre suivi des éléments pivotés
        rotatedTerrains[0] = center;
        for (let i = 0; i < rest.length; i++) {
            rotatedTerrains[i + 1] = rest[i];
        }

        // Créer un terrain pour chaque élément du tableau
        const newTerrains = rotatedTerrains.map((zone, index) => {
            // Calculer la position modifiée
            const modifiedPosition = {
                q: this.position.q + positionModifiers[index].q,
                r: this.position.r + positionModifiers[index].r
            };
            // Créer le terrain
            return new Territory({
                type: zone,
                position_q: modifiedPosition.q,
                position_r: modifiedPosition.r
            });
        });

        // Ajouter les nouveaux terrains à game.territories
        if (!gameState.game.territories) {
            gameState.game.territories = [];
        }
        gameState.game.territories.push(...newTerrains);
        
        // Marquer que les terrains ont été créés pour cette tile
        this.terrainsCreated = true;
    }
    
    
}

class Action {
    constructor(data = {}) {
        this.id = data.id || null;
        this.game_user_id = data.game_user_id || null;
        this.game_id = data.game_id || null;
        this.turn = data.turn || 0;
        this.position_q = data.position_q !== undefined ? data.position_q : null;
        this.position_r = data.position_r !== undefined ? data.position_r : null;
        this.development_level = data.development_level || 0;
        this.fortification_level = data.fortification_level || 0;
        this.militarisation_level = data.militarisation_level || 0;
        this.development_type = ""; //expantion ou colonisation
        this.fortification_type = ""; //urbanisation ou renforcement
        this.militarisation_type = ""; //recrutement ou attaque
        this.chao = 0;
    }

    update(data) {
        this.id = data.id || this.id;
        this.game_user_id = data.game_user_id || this.game_user_id;
        this.game_id = data.game_id || this.game_id;
        this.turn = data.turn || this.turn;
        this.position_q = data.position_q !== undefined ? data.position_q : this.position_q;
        this.position_r = data.position_r !== undefined ? data.position_r : this.position_r;
        this.development_level = data.development_level !== undefined ? data.development_level : this.development_level;
        this.fortification_level = data.fortification_level !== undefined ? data.fortification_level : this.fortification_level;
        this.militarisation_level = data.militarisation_level !== undefined ? data.militarisation_level : this.militarisation_level;
    }

    // Méthode pour récupérer le territoire concerné par l'action
    getTerritory() {
        if (this.position_q === null || this.position_r === null) {
            return null;
        }
        return gameState.getTerritoryByPosition(this.position_q, this.position_r);
    }

    // Méthode pour récupérer le clan concerné par l'action
    getClan() {
        if (!this.game_user_id) {
            return null;
        }
        
        // Récupérer le game_user
        const gameUser = gameState.game.game_users.find(gu => gu.id === this.game_user_id);
        if (!gameUser || !gameUser.clan_id) {
            return null;
        }
        
        // Récupérer le clan
        return gameState.getClanById(gameUser.clan_id);
    }

    isMyAction() {
        return this.game_user_id === gameState.game.myGameUserId;
    }
}   

class Bidding {
    constructor(data = {}) {
        this.id = data.id || null;
        this.game_id = data.game_id || null;
        this.game_user_id = data.game_user_id || null;
        this.turn = data.turn || 0;
        this.chao = data.chao || 0;
        this.victory = data.victory || false;
        this.clan_id = data.clan_id || null;
    }

    update(data) {
        this.id = data.id || this.id;
        this.game_id = data.game_id || this.game_id;
        this.game_user_id = data.game_user_id || this.game_user_id;
        this.turn = data.turn || this.turn;
        this.chao = data.chao || this.chao;
        this.victory = data.victory ?? this.victory;
        this.clan_id = data.clan_id || this.clan_id;
    }
}   

class Territory {
    constructor(data = {}) {
        this.type = data.type || 'plain';
        this.position = {
            q: data.position_q ?? 0,
            r: data.position_r ?? 0
        };
        this.user_id = data.user_id || null; //probablement a supprimer
        this.construction_type = data.construction_type || null; // village, ville, 2villes
        this.rempart = data.protection_type || null; // fortifiee, indestruible


        this.clan_id = data.clan_id || null; // Référence au clan au lieu de color
        this.hasTemple = false; // Variable booléenne pour indiquer si un temple est présent

        this.warriors = 0; // nombre de guerriers (remplace armee)
        this.warriors_mesh = []; // Tableau des mesh de guerriers (remplace armee)
        
        // Cache pour les territoires et provinces adjacents ou connecte
        this.adjacentTerritories = null;
        this.connectedTerritories = null;
        this.adjacentProvinces = []; //seulement mine foret plaine ou riziere
        this.connectedProvinces = []; //seulement mine foret plaine ou riziere
        
        // Références aux mesh 3D
        this.construction_mesh = null; // Mesh de la construction (village, ville, 2villes)
        this.rempart_mesh = null; // Mesh du rempart (fortifiee, indestruible)
        this.temple_mesh = null; // Mesh du temple
        
        // Créer un temple directement si le territoire est de type 'plain'
        setTimeout(() => {
            if (this.type === 'plain') {
                this.createTemple(gameBoard, gameBoard.meepleManager,false);
            }
        }, 1000); // Délai pour s'assurer que gameBoard est disponible
        
    }

    update(data) {
        this.type = data.type || this.type;
        this.position_q = data.position_q || this.position_q;
        this.position_r = data.position_r || this.position_r;
        this.user_id = data.user_id || this.user_id; //probablement a supprimer
        this.construction_type = data.construction_type || this.construction_type;
        this.rempart = data.protection_type || this.protection_type;
        this.clan_id = data.clan_id || this.clan_id;
        // Note: warriors n'est pas mis à jour via data, il est géré par les méthodes
    }

    // Obtenir la position cartésienne de ce territoire
    getCartesianPosition(gameBoard) {
        return gameBoard.hexToCartesian(this.position);
    }

    // Obtenir tous les territoires connectés du même clan
    getConnectedClanTerritories() {
        const clanId = this.clan_id;
        const visited = new Set();
        const stack = [this];
        const group = [];
    
        while (stack.length > 0) {
            const territory = stack.pop();
    
            if (visited.has(territory)) continue;
            visited.add(territory);
    
            if (territory.clan_id === clanId) {
                group.push(territory);
    
                for (const neighbor of territory.adjacentProvinces) {
                    if (!visited.has(neighbor)) {
                        stack.push(neighbor);
                    }
                }
            }
        }
        return group;
    }
    


    // Créer la mesh de construction
    async createConstruction(gameBoard, meepleManager) {
        if (this.construction_mesh) {
            this.removeConstruction(gameBoard); 
        }

        // Récupérer la couleur via la référence au clan
        let colorHex = null;
        if (this.clan_id) {
            const clan = gameState.game.clans.find(c => c.id === this.clan_id);
            if (clan) {
                colorHex = clan.color;
            }
        }
        
        // Créer l'instance du meeple (version asynchrone)
        const mesh = await meepleManager.createMeepleInstance(this.construction_type, colorHex, {
            territory: this,
            type: 'construction'
        });

        if (mesh) {
            // Positionner à la position exacte du territoire
            const pos = this.getCartesianPosition(gameBoard);
            
            // Désactiver les collisions
            mesh.traverse((child) => {
                if (child.isMesh) {
                    child.raycast = function() {};
                }
            });

            // Ajouter au workplane
            gameBoard.workplane.add(mesh);
            this.construction_mesh = mesh;
            
            // Créer l'animation de roulement pour les villages
            if (this.construction_type === 'village') {
                this.animateVillageRoll(mesh, pos);
            } else {
                // Positionner directement pour les autres constructions
                mesh.position.set(pos.x, pos.y, pos.z);
            }
        }
    }

    // Créer la mesh de rempart
    async createRempart(gameBoard, meepleManager) {
        // Supprimer l'ancienne mesh si présente
        if (this.rempart_mesh) {
            this.removeRempart(gameBoard);
        }

        if (!this.rempart) {
            console.warn('⚠️ Aucun type de rempart défini');
            return;
        }

        console.log(`🏰 Création du rempart de type: ${this.rempart}`);

        // Utiliser le type 'fortification' du MeepleManager (non colorable)
        const mesh = await meepleManager.createMeepleInstance('fortification', null, {
            territory: this,
            type: 'rempart',
            rempartType: this.rempart
        });

        if (!mesh) {
            console.error('❌ Impossible de créer la mesh de rempart');
            return;
        }

        // Positionner à la position exacte du territoire
        const pos = this.getCartesianPosition(gameBoard);
        
        // Désactiver les collisions
        mesh.traverse((child) => {
            if (child.isMesh) {
                child.raycast = function() {};
            }
        });

        // Ajouter au workplane
        gameBoard.workplane.add(mesh);
        this.rempart_mesh = mesh;
        
        // Créer l'animation selon le type de rempart
        if (this.rempart === 'indestruible') {
            // Animation dramatique pour les remparts indestructibles
            this.animateRempartFall(mesh, pos, 4.0, 1200); // Plus haut et plus long
        } else {
            // Animation plus douce pour les remparts fortifiés
            this.animateRempartFall(mesh, pos, 2.0, 800); // Plus bas et plus court
        }
        
        console.log(`✅ Rempart ${this.rempart} créé et animation démarrée`);
    }

    // Animer la chute du rempart avec un effet d'écrasement
    animateRempartFall(mesh, targetPosition, startHeight, duration) {
        const startY = startHeight; // Position de départ en hauteur
        const targetY = targetPosition.y; // Position finale
        const startTime = Date.now();
        
        // Positionner le rempart en hauteur au début
        mesh.position.set(targetPosition.x, startY, targetPosition.z);
        
        // Fonction d'easing pour un effet d'écrasement (ease-out avec rebond)
        const easeOutBounce = (t) => {
            if (t < 1 / 2.75) {
                return 7.5625 * t * t;
            } else if (t < 2 / 2.75) {
                return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            } else if (t < 2.5 / 2.75) {
                return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            } else {
                return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
            }
        };
        
        // Fonction d'animation
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1); // De 0 à 1
            
            // Appliquer l'easing pour un effet de chute avec rebond
            const easedProgress = easeOutBounce(progress);
            
            // Calculer la position Y avec l'easing
            const currentY = startY + (targetY - startY) * easedProgress;
            mesh.position.y = currentY;
            
            // Ajouter une légère rotation pendant la chute pour plus de réalisme
            const rotationAmount = Math.sin(progress * Math.PI * 3) * 0.05; // Rotation plus subtile que le temple
            mesh.rotation.y = rotationAmount;
            
            // Continuer l'animation si pas terminée
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Finaliser la position et rotation
                mesh.position.y = targetY;
                mesh.rotation.y = 0;
            }
        };
        
        // Démarrer l'animation
        requestAnimationFrame(animate);
    }

    // Créer la mesh de temple
    async createTemple(gameBoard, meepleManager, shouldAnimate = false) {
        if (this.hasTemple && this.temple_mesh) {
            return; // Temple déjà créé
        }        
        // Utiliser le type 'temple' du MeepleManager (non colorable)
        const mesh = await meepleManager.createMeepleInstance('temple', null, {
            territory: this,
            type: 'temple'
        });

        if (mesh) {
            // Positionner à la position exacte du territoire
            const pos = this.getCartesianPosition(gameBoard);
            
            // Désactiver les collisions
            mesh.traverse((child) => {
                if (child.isMesh) {
                    child.raycast = function() {};
                }
            });

            // Ajouter au workplane
            gameBoard.workplane.add(mesh);
            this.temple_mesh = mesh;
            this.hasTemple = true;
            
            // Créer l'animation de chute si demandé, sinon le positionner directement
            if (shouldAnimate) {
                this.animateTempleFall(mesh, pos);
            } else {
                mesh.position.set(pos.x, pos.y, pos.z);
                mesh.rotation.y = 0;
            }
        }
    }

    // Animer la chute du temple avec un effet d'écrasement esthétique
    animateTempleFall(mesh, targetPosition) {
        const startY = 5; // Position de départ en hauteur
        const targetY = targetPosition.y; // Position finale
        const duration = 1000; // Durée en ms
        const startTime = Date.now();
        
        // Positionner le temple en hauteur au début
        mesh.position.set(targetPosition.x, startY, targetPosition.z);
        
        // Fonction d'easing pour un effet d'écrasement (ease-out avec rebond)
        const easeOutBounce = (t) => {
            if (t < 1 / 2.75) {
                return 7.5625 * t * t;
            } else if (t < 2 / 2.75) {
                return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
            } else if (t < 2.5 / 2.75) {
                return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
            } else {
                return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
            }
        };
        
        // Fonction d'animation
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1); // De 0 à 1
            
            // Appliquer l'easing pour un effet de chute avec rebond
            const easedProgress = easeOutBounce(progress);
            
            // Calculer la position Y avec l'easing
            const currentY = startY + (targetY - startY) * easedProgress;
            mesh.position.y = currentY;
            
            // Ajouter une légère rotation pendant la chute pour plus de réalisme
            const rotationAmount = Math.sin(progress * Math.PI * 3) * 0.1; // Rotation oscillante
            mesh.rotation.y = rotationAmount;
            
            // Continuer l'animation si pas terminée
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Finaliser la position et rotation
                mesh.position.y = targetY;
                mesh.rotation.y = 0;
            }
        };
        
        // Démarrer l'animation
        requestAnimationFrame(animate);
    }

    // Animer le roulement du village avec un effet de pion de go
    animateVillageRoll(mesh, targetPosition) {
        const startY = 0.3; // Position de départ en hauteur (légèrement plus bas que le temple)
        const targetY = targetPosition.y; // Position finale
        const duration = 1500; // Durée en ms (plus rapide que le temple)
        const startTime = Date.now();
        
        // Positionner le village en hauteur au début
        mesh.position.set(targetPosition.x, startY, targetPosition.z);
        
        // Fonction d'easing pour un effet de roulement (ease-out avec légère oscillation)
        const easeOutElastic = (t) => {
            const c4 = (2 * Math.PI) / 3;
            return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        };
        
        // Fonction d'animation
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1); // De 0 à 1
            
            // Appliquer l'easing pour un effet de roulement avec rebond léger
            const easedProgress = easeOutElastic(progress);
            
            // Calculer la position Y avec l'easing
            const currentY = startY + (targetY - startY) * easedProgress;
            mesh.position.y = currentY;
            
            // Ajouter une rotation continue pour simuler le roulement
            const rotationSpeed = 4; // Vitesse de rotation
            const rotationAmount = progress * rotationSpeed * Math.PI * 2; // Rotation complète
            mesh.rotation.y = rotationAmount;
            
            // Ajouter une légère oscillation sur l'axe X pour simuler le roulement
            const rollAmount = Math.sin(progress * Math.PI * 4) * 0.2; // Oscillation rapide
            mesh.rotation.x = rollAmount;
            
            // Continuer l'animation si pas terminée
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Finaliser la position et rotation
                mesh.position.y = targetY;
                mesh.rotation.y = 0;
                mesh.rotation.x = 0;
            }
        };
        
        // Démarrer l'animation
        requestAnimationFrame(animate);
    }

    // Créer les mesh de guerriers
    async createWarriors(gameBoard, meepleManager, warriorsToAdd, animate = true) {
        if (!this.clan_id || warriorsToAdd <= 0) {
            return; // Pas de guerriers à créer
        }

        // Récupérer la couleur du clan
        const clanColor = gameState.getClanColor(this.clan_id);
        if (!clanColor) {
            console.warn(`⚠️ Couleur du clan non trouvée pour clan_id=${this.clan_id}`);
            return;
        }

        // Lire le nombre de guerriers déjà présents
        const currentWarriorsCount = this.warriors_mesh.length;
        
        
        // Obtenir la position du territoire
        const territoryPosition = this.getCartesianPosition(gameBoard);
        
        // Créer les nouveaux guerriers
        for (let i = 0; i < warriorsToAdd; i++) {
            const warriorIndex = currentWarriorsCount + i;
            
            const mesh = await meepleManager.createMeepleInstance('guerrier', clanColor, {
                territory: this,
                type: 'warrior',
                index: warriorIndex
            });

            if (mesh) {
                // Calculer la position finale du guerrier
                const warriorPosition = this.calculateWarriorPosition(territoryPosition, warriorIndex);
                
                // Position initiale (en bas)
                mesh.position.set(warriorPosition.x, -0.5, warriorPosition.z);
                
                // Désactiver les collisions
                mesh.traverse((child) => {
                    if (child.isMesh) {
                        child.raycast = function() {};
                    }
                });

                // Ajouter au workplane et stocker
                gameBoard.workplane.add(mesh);
                this.warriors_mesh.push(mesh);
                
                // Animer l'arrivée du guerrier seulement si animate est true
                if (animate) {
                    this.animateWarriorArrival(mesh, warriorPosition, 1000);
                } else {
                    // Positionner directement le guerrier à sa position finale
                    mesh.position.set(warriorPosition.x, warriorPosition.y, warriorPosition.z);
                }
            }
        }
    }

    // Calculer la position d'un guerrier selon l'index
    calculateWarriorPosition(territoryPosition, warriorIndex) {
        const distance = 0.4; // Distance de 0.4 du centre du territoire
        const baseAngle = -Math.PI / 4; // Angle de base (-π/4)
        const angleStep = Math.PI / 6; // Pas d'angle de π/10
        
        // Calculer l'angle pour ce guerrier - formule correcte
        const angle = baseAngle + ((-1)**warriorIndex) * Math.floor((warriorIndex + 1) / 2) * angleStep;
        
        // Calculer la position finale
        const x = territoryPosition.x + distance * Math.cos(angle);
        const y = territoryPosition.y; // Même hauteur que le territoire
        const z = territoryPosition.z - distance * Math.sin(angle); // Inversé pour avoir bas à gauche
        
        return { x, y, z };
    }

    // Animer l'arrivée d'un guerrier
    animateWarriorArrival(mesh, finalPosition, duration) {
        const startTime = performance.now();
        const startY = -0.5;
        const finalY = finalPosition.y;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing pour une animation fluide
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            
            // Animation de la position Y
            const currentY = startY + (finalY - startY) * easeOutCubic;
            mesh.position.y = currentY;
            
            // Animation de rotation (360°) synchronisée avec le mouvement
            mesh.rotation.y = easeOutCubic * Math.PI * 2;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation terminée, position finale exacte
                mesh.position.set(finalPosition.x, finalY, finalPosition.z);
                mesh.rotation.y = 0; // facultatif, sinon garder la valeur finale (2π)
            }
        };
        
        requestAnimationFrame(animate);
    }
    

    // Supprimer la construction
    removeConstruction(gameBoard) {
        if (this.construction_mesh) {
            gameBoard.workplane.remove(this.construction_mesh);
            this.construction_mesh = null;
        }
    }

    // Supprimer le rempart
    removeRempart(gameBoard) {
        if (this.rempart_mesh) {
            gameBoard.workplane.remove(this.rempart_mesh);
            this.rempart_mesh = null;
        }
    }

    // Supprimer tous les guerriers
    removeWarriors(gameBoard) {
        if (this.warriors_mesh.length > 0) {
            this.warriors_mesh.forEach(warrior => {
                gameBoard.workplane.remove(warrior);
            });
            this.warriors_mesh = [];
            this.warriors = 0;
        }
    }


    getAdjacentTerritories() {
        if (this.adjacentTerritories !== null) {
            return this.adjacentTerritories;
        }

        const adjacentPositions = [
            { q: +1, r: +0 },  // Droite
            { q: +0, r: +1 },  // Haut droite
            { q: -1, r: +1 },  // Haut gauche
            { q: -1, r: +0 },  // Gauche
            { q: +0, r: -1 },  // Bas gauche
            { q: +1, r: -1 }   // Bas droite
        ];

        const adjacentTerritories = adjacentPositions.map(pos => {
            const q = this.position.q + pos.q;
            const r = this.position.r + pos.r;
            return gameState.game.territories.find(t => 
                t.position.q === q && t.position.r === r
            );
        }).filter(t => t !== undefined);

        // Stocker le cache seulement si simultaneous_play_turn > 0
        if (gameState.game.simultaneous_play_turn > 0) {
            this.adjacentTerritories = adjacentTerritories;
        }

        return adjacentTerritories;
    }

    areTerritoryAdjacent(territory2) {
        const adjacentTerritories = this.getAdjacentTerritories();
        return adjacentTerritories.some(territory => 
            territory.position.q === territory2.position.q && 
            territory.position.r === territory2.position.r
        );
    }

    // Fonction pour filtrer et stocker les provinces adjacentes (plain, forest, rice, mine)
    updateProvinceTerritories() {
        console.log("updateProvinceTerritories", this);
        const adjacentTerritories = this.getAdjacentTerritories();
        this.adjacentProvinces = adjacentTerritories.filter(territory => 
            ['plain', 'forest', 'rice', 'mine'].includes(territory.type)
        );
    }

    // Fonction pour calculer tous les territoires connectés (via lacs + adjacents)
    getConnectedTerritories() {
        if (this.connectedTerritories !== null) {
            return this.connectedTerritories;
        }

        const connectedTerritories = new Set();
        
        // Ajouter d'abord les territoires adjacents
        const adjacentTerritories = this.getAdjacentTerritories();
        adjacentTerritories.forEach(territory => connectedTerritories.add(territory));
        
        // Parcourir tous les lacs pour trouver ceux qui contiennent ce territoire
        for (const lake of gameState.game.lakes.values()) {
            // Vérifier si ce territoire est dans ce lac
            if (lake.connectedTerritories.has(this)) {
                // Ajouter tous les autres territoires connectés à ce lac
                for (const territory of lake.connectedTerritories) {
                    if (territory !== this) { // Ne pas s'ajouter soi-même
                        connectedTerritories.add(territory);
                    }
                }
            }
        }
        
        // Convertir le Set en Array et stocker dans le cache
        this.connectedTerritories = Array.from(connectedTerritories);
        
        return this.connectedTerritories;
    }

    // Fonction pour filtrer et stocker les provinces connectées (plain, forest, rice, mine)
    updateConnectedProvinces() {
        const connectedTerritories = this.getConnectedTerritories();
        this.connectedProvinces = connectedTerritories.filter(territory => 
            ['plain', 'forest', 'rice', 'mine'].includes(territory.type)
        );
    }

    // Fonction pour trouver le chemin le plus court vers un territoire cible
    // Le chemin doit passer exclusivement par des territoires 'water' entre le départ et l'arrivée
    // Seuls le premier et dernier territoire peuvent être non-water
    findShortestPathTo(targetTerritory) {
        // Vérifier si les territoires sont adjacents directs
        const adjacentTerritories = this.getAdjacentTerritories();
        const isAdjacent = adjacentTerritories.some(territory => 
            territory.position.q === targetTerritory.position.q && 
            territory.position.r === targetTerritory.position.r
        );
        
        if (isAdjacent) {
            return [this, targetTerritory]; // Chemin direct avec 2 éléments
        }
        
        // Vérifier si les territoires sont connectés via les lacs
        const connectedTerritories = this.getConnectedTerritories();
        const isConnected = connectedTerritories.some(territory => 
            territory.position.q === targetTerritory.position.q && 
            territory.position.r === targetTerritory.position.r
        );
        
        if (!isConnected) {
            console.warn('❌ Territoires non connectés via les lacs ou adjacence');
            return null; // Pas de chemin possible
        }
        
        // Si c'est le même territoire, retourner juste ce territoire
        if (this.position.q === targetTerritory.position.q && 
            this.position.r === targetTerritory.position.r) {
            return [this];
        }
        
        // BFS (Breadth-First Search) pour trouver le chemin le plus court
        const queue = [{ territory: this, path: [this] }];
        const visited = new Set();
        visited.add(`${this.position.q},${this.position.r}`);
        
        while (queue.length > 0) {
            const { territory: currentTerritory, path } = queue.shift();
            
            // Explorer les territoires adjacents
            const adjacentTerritories = currentTerritory.getAdjacentTerritories();
            
            for (const adjacent of adjacentTerritories) {
                const posKey = `${adjacent.position.q},${adjacent.position.r}`;
                
                if (visited.has(posKey)) {
                    continue; // Déjà visité
                }
                
                visited.add(posKey);
                const newPath = [...path, adjacent];
                
                // Si on a atteint la cible
                if (adjacent.position.q === targetTerritory.position.q && 
                    adjacent.position.r === targetTerritory.position.r) {
                    return newPath;
                }
                
                // Continuer seulement si c'est un territoire water (pour les intermédiaires)
                // Ou si c'est le territoire cible final (même s'il n'est pas water)
                if (adjacent.type === 'water') {
                    queue.push({ territory: adjacent, path: newPath });
                } else if (adjacent.position.q === targetTerritory.position.q && 
                          adjacent.position.r === targetTerritory.position.r) {
                    // Si c'est le territoire cible, on peut l'atteindre même s'il n'est pas water
                    queue.push({ territory: adjacent, path: newPath });
                }
                // Ne pas ajouter les territoires non-water intermédiaires
            }
        }
        
        console.warn('❌ Aucun chemin trouvé vers le territoire cible');
        return null; // Aucun chemin trouvé
    }
}

class Lake {
    constructor() {
        this.waterTiles = new Set();
        this.connectedTerritories = new Set();
        this.id = Math.random().toString(36).substr(2, 9);
    }


    static updateConnectedTerritories() {
        // Parcourir tous les lacs
        for (const lake of gameState.game.lakes.values()) {
            // Réinitialiser les territoires connectés
            lake.connectedTerritories.clear();
            
            // Pour chaque terrain d'eau du lac
            for (const waterTerrain of lake.waterTiles) {
                // Trouver les terrains adjacents qui ne sont pas de l'eau
                const adjacentTerrains = waterTerrain.getAdjacentTerritories();
                for (const adjacentTerrain of adjacentTerrains) {
                    if (adjacentTerrain.type !== 'water') {
                        lake.connectedTerritories.add(adjacentTerrain);
                    }
                }
            }
        }
    }

    // Fonction d'initialisation complète des lacs
    static initializeAllLakes() {
        
        // Vider tous les lacs existants
        gameState.game.lakes.clear();
        
        // Récupérer tous les territoires water
        const waterTerritories = gameState.game.territories.filter(t => t.type === 'water');
        
        // Marquer tous les territoires water comme non traités
        const processedTerritories = new Set();
        
        // Pour chaque territoire water non traité
        for (const waterTerritory of waterTerritories) {
            if (processedTerritories.has(waterTerritory)) {
                continue; // Déjà traité
            }
            
            // Créer un nouveau lac
            const newLake = new Lake();
            
            // Trouver tous les territoires water connectés par adjacence
            const territoriesToProcess = [waterTerritory];
            
            while (territoriesToProcess.length > 0) {
                const currentTerritory = territoriesToProcess.pop();
                
                if (processedTerritories.has(currentTerritory)) {
                    continue;
                }
                
                // Ajouter ce territoire au lac
                newLake.waterTiles.add(currentTerritory);
                processedTerritories.add(currentTerritory);
                
                // Trouver les territoires water adjacents non traités
                const adjacentTerritories = currentTerritory.getAdjacentTerritories();
                for (const adjacent of adjacentTerritories) {
                    if (adjacent.type === 'water' && !processedTerritories.has(adjacent)) {
                        territoriesToProcess.push(adjacent);
                    }
                }
            }
            
            // Ajouter le lac à la liste des lacs
            gameState.game.lakes.set(newLake.id, newLake);
        }
        
        // Calculer les territoires connectés pour chaque lac
        Lake.updateConnectedTerritories();
    }
}

class Game {
    constructor(data = {}) {
        this.id = data.id || null;
        this.game_status = data.game_status || '';
        this.game_type = data.game_type || '';
        this.player_count = data.player_count || 0;
        this.clan_names = data.clan_names || '';
        this.biddings_turn = data.biddings_turn || 0;
        this.simultaneous_play_turn = data.simultaneous_play_turn || 0;

        
        // Relations
        this.game_users = data.game_users ? data.game_users.map(gu => new GameUser(gu)) : [];
        this.tiles = data.tiles ? data.tiles.map(tile => new Tile(tile)) : [];
        this.actions = data.actions ? data.actions.map(action => new Action(action)) : [];
        this.biddings = data.biddings ? data.biddings.map(bidding => new Bidding(bidding)) : [];
        this.clans = data.clans ? data.clans.map(clan => new Clan(clan)) : [];
        this.territories = [];  // Initialiser comme un tableau vide
        this.lakes = new Map(); // Map des lacs par ID
        
        // Clan du joueur actuel
        this.myClan = null;
        
        // Variable temporaire pour le chao du joueur
        this.myChaoTemp = 0;
    }

    // Fonction pour récupérer le clan du joueur actuel
    setMyClanFromVictoryBidding(myGameUserId) {
        // Chercher le bidding victorieux du joueur actuel
        const victoryBidding = this.biddings.find(bidding => 
            bidding.game_user_id === myGameUserId && bidding.victory === true
        );
        
        if (!victoryBidding) {
            console.warn(`⚠️ Aucun bidding victorieux trouvé pour game_user_id=${myGameUserId}`);
            return;
        }
        
        // Récupérer le clan correspondant
        const clan = this.clans.find(clan => clan.id === victoryBidding.clan_id);
        
        if (!clan) {
            console.warn(`⚠️ Clan non trouvé pour clan_id=${victoryBidding.clan_id}`);
            return;
        }
        
        // Stocker le clan du joueur actuel
        this.myClan = clan;
    }

    update(data) {
        this.id = data.id || this.id;
        this.game_status = data.game_status || this.game_status;
        this.game_type = data.game_type || this.game_type;
        this.player_count = data.player_count || this.player_count;
        this.clan_names = data.clan_names || this.clan_names;
        this.biddings_turn = data.biddings_turn || this.biddings_turn;
        this.simultaneous_play_turn = data.simultaneous_play_turn || this.simultaneous_play_turn;

        // Mise à jour des game_users
        if (data.game_users) {
            // Créer un map des game_users existants
            const existingUsers = new Map(this.game_users.map(gu => [gu.id, gu]));
            
            this.game_users = data.game_users.map(guData => {
                const existing = existingUsers.get(guData.id);
                if (existing) {
                    existing.update(guData);
                    return existing;
                } else {
                    return new GameUser(guData);
                }
            });
        }

        // Mise à jour des tiles
        if (data.tiles) {
            const existingTiles = new Map(this.tiles.map(tile => [tile.id, tile]));
            
            this.tiles = data.tiles.map(tileData => {
                const existing = existingTiles.get(tileData.id);
                if (existing) {
                    existing.update(tileData);
                    return existing;
                } else {
                    return new Tile(tileData);
                }
            });
        }

        // Mise à jour des actions
        if (data.actions) {
            const existingActions = new Map(this.actions.map(action => [action.id, action]));
            
            this.actions = data.actions.map(actionData => {
                const existing = existingActions.get(actionData.id);
                if (existing) {
                    existing.update(actionData);
                    return existing;
                } else {
                    return new Action(actionData);
                }
            });
        }

        // Mise à jour des biddings
        if (data.biddings) {
            const existingBiddings = new Map(this.biddings.map(bidding => [bidding.id, bidding]));
            
            this.biddings = data.biddings.map(biddingData => {
                const existing = existingBiddings.get(biddingData.id);
                if (existing) {
                    existing.update(biddingData);
                    return existing;
                } else {
                    return new Bidding(biddingData);
                }
            });
        }

        // Mise à jour des clans
        if (data.clans) {
            const existingClans = new Map(this.clans.map(clan => [clan.id, clan]));
            
            this.clans = data.clans.map(clanData => {
                const existing = existingClans.get(clanData.id);
                if (existing) {
                    existing.update(clanData);
                    return existing;
                } else {
                    return new Clan(clanData);
                }
            });
        }
    }

}

class GameState {
    constructor(data = {}) {
        this.game = data.game ? new Game(data.game) : new Game();
        this.myGameUserId = data.my_game_user_id || null;
    }

    update(data) {
        if (data.game) {
            this.game.update(data.game);
        }
        if (data.my_game_user_id !== undefined) {
            this.myGameUserId = data.my_game_user_id;
        }
        
        // Si un gameBoard est fourni, le stocker globalement
        if (data.gameBoard) {
            window.gameBoard = data.gameBoard;
        }
    }

    // Méthode utilitaire pour obtenir mon GameUser
    getMyGameUser() {
        return this.game.game_users.find(gu => gu.id === this.myGameUserId);
    }

    // Méthode pour vérifier si on est en phase d'installation
    isInstallationPhase() {
        return this.game.game_status === 'installation_phase';
    }
    
    isnotwaiting_for_players() {
        return this.game.game_status !== 'waiting_for_players';
    }

    // Méthode pour vérifier si on est en jeu simultané
    isSimultaneousPlay() {
        return this.game.game_status === 'simultaneous_play';
    }

    // Méthode pour vérifier si on est le joueur avec l'ID le plus bas
    isLowestIdPlayer() {
        if (!this.myGameUserId || this.game.game_users.length === 0) {
            return false;
        }
        
        const lowestId = Math.min(...this.game.game_users.map(gu => gu.id));
        return this.myGameUserId === lowestId;
    }

    // Méthode pour trouver un territoire par ses coordonnées
    getTerritoryByPosition(q, r) {
        return this.game.territories.find(territory => 
            territory.position.q === q && territory.position.r === r
        );
    }

    // Méthode pour trouver un clan par son ID
    getClanById(clanId) {
        return this.game.clans.find(clan => clan.id === clanId);
    }

    // Méthode pour récupérer la couleur d'un clan
    getClanColor(clanId) {
        const clan = this.game.clans.find(clan => clan.id === clanId);
        return clan ? clan.color : null;
    }

    // Méthode pour récupérer le clan_id d'un game_user_id
    getClanIdByGameUserId(gameUserId) {
        const gameUser = this.game.game_users.find(gu => gu.id === gameUserId);
        return gameUser ? gameUser.clan_id : null;
    }

    
}

// Instance globale du gameState (vide au départ)
export const gameState = new GameState();

// Exporter la classe Lake pour l'utiliser dans d'autres modules
export { Lake };

// Rendre gameState accessible globalement pour les fonctions utilitaires
window.gameState = gameState;


