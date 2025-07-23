import { gameState } from '../gameState.js';
import { uiManager } from '../ui/UIManager.js';
import { i18n } from '../../core/i18n.js';
import * as THREE from 'three';

export const biddingPhase = {
    // Stockage des cercles créés avec leurs clans associés
    createdCircles: [], // [{ circle: THREE.Mesh, clan: Clan }]
    
    // Fonction principale pour gérer la phase de bidding
    async biddingPhase(gameBoard) {
        console.log('🎯 Démarrage de la phase bidding_phase');

        // Mettre à jour les territories et placer les villes
        await this.setupClanTerritories(gameBoard);
        
        // Récupérer le joueur actuel
        const myGameUserId = gameState.myGameUserId;
        const myGameUser = gameState.game?.game_users?.find(gu => gu.id === myGameUserId);
        
        console.log(`👤 Joueur actuel: ${myGameUserId}`);
        console.log(`🏛️ Clan sélectionné: ${myGameUser?.clan_id || 'aucun'}`);
        
        // Vérifier si le joueur a déjà sélectionné un clan
        if (myGameUser && myGameUser.clan_id !== null && myGameUser.clan_id !== undefined) {
            console.log('⏳ Joueur a déjà sélectionné un clan, affichage du message d\'attente');
            await this.handlePlayerWithClan(gameBoard);
        } else {
            console.log('🎯 Joueur n\'a pas encore sélectionné de clan, affichage de l\'interface de sélection');
            await this.handlePlayerWithoutClan(gameBoard);
        }
    },

    // Fonction pour le joueur qui a déjà un clan (attente)
    async handlePlayerWithClan(gameBoard) {
        console.log('⏳ Gestion du joueur avec clan (attente)');
        
        // Afficher le message d'attente
        uiManager.updateInfoPanel(i18n.t('game.phases.bidding.waiting_for_others'));
        
        // Afficher la barre avec seulement le menu
        uiManager.showMenuOnlyBar();
        
        this.removeAllCircles(gameBoard);
    },

    // Fonction pour le joueur qui n'a pas encore de clan (sélection + enchère)
    async handlePlayerWithoutClan(gameBoard) {
        console.log('🎯 Gestion du joueur sans clan (sélection + enchère)');
        
        this.removeAllCircles(gameBoard);

        // Placer des cercles sur les clans non utilisés
        await this.placeUnusedClanCircles(gameBoard);
        
        // Vérifier s'il n'y a qu'un seul clan disponible
        if (this.createdCircles.length === 1) {
            console.log('🎯 Un seul clan disponible, sélection automatique');
            
            // Sélectionner automatiquement le clan
            this.selectedClan = this.createdCircles[0].clan;
            
            // Mettre l'enchère à 0
            uiManager.currentBid = 0;
            
            // Afficher les instructions
            uiManager.updateInfoPanel(i18n.t('game.phases.bidding.instructions'));
            
            // Afficher la barre de bidding
            uiManager.showBiddingBar();
            setTimeout(() => uiManager.updateBiddingText(0, 6), 200);
            
            // Envoyer automatiquement à l'API
            console.log(`🚀 Envoi automatique: clan ${this.selectedClan.name} avec enchère 0`);
            import('../gameApi.js').then(module => {
                module.gameApi.sendClanBiddingToApi(this.selectedClan.id, 0);
            });
            
            return;
        }

        // Afficher les instructions
        uiManager.updateInfoPanel(i18n.t('game.phases.bidding.instructions'));
        
        // Afficher la barre de bidding
        uiManager.showBiddingBar();
        setTimeout(() => uiManager.updateBiddingText(0, 6), 200);
        
        // Variables pour le suivi de la sélection
        this.selectedClan = null;
        this.currentBid = 0;
        
        // Définir le callback pour les clics
        const handleClick = (hexCoords, worldPoint) => {
            // Vérifier si on a cliqué sur un cercle (clan non utilisé)
            const clickedCircle = this.createdCircles.find(({ circle, clan }) => {
                const clanHexCoords = { q: clan.start_q, r: clan.start_r };
                return clanHexCoords.q === hexCoords.q && clanHexCoords.r === hexCoords.r;
            });
            
            if (clickedCircle) {
                console.log(`✅ Clic sur le cercle du clan ${clickedCircle.clan.name} (${clickedCircle.clan.color})`);
                
                // Stocker le clan sélectionné
                this.selectedClan = clickedCircle.clan;
                
                // Mettre à jour le message avec la sélection actuelle
                this.updateBiddingMessage();
                
            } else {
                // Si on clique en dehors, on peut désélectionner
                this.selectedClan = null;
                uiManager.updateInfoPanel(i18n.t('game.phases.bidding.instructions'));
            }
        };

        // Utiliser le système de callback de GameBoard3D
        gameBoard.detectClickOnly(handleClick);
        
        // Stocker la référence pour pouvoir la supprimer plus tard
        this.clickHandler = handleClick;
        this.currentGameBoard = gameBoard;
        
        console.log('✅ Interface de sélection + enchère initialisée');
    },

    // Fonction pour mettre à jour le message de bidding
    updateBiddingMessage() {
        if (!this.selectedClan) {
            uiManager.updateInfoPanel(i18n.t('game.phases.bidding.instructions'));
            return;
        }
        
        const currentBid = uiManager.currentBid || 0;
        const message = i18n.t('game.phases.bidding.bid_on_clan', {
            color: i18n.t(`colors.${this.selectedClan.color_name}`),
            chao: currentBid
        });
        
        uiManager.updateInfoPanel(message);
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
                
                // Créer la ville si gameBoard disponible (version asynchrone)
                if (gameBoard?.meepleManager) {
                    await territory.createConstruction(gameBoard, gameBoard.meepleManager);
                }
            }
        }
    },

    // Placer des cercles sur les positions des clans non utilisés
    async placeUnusedClanCircles(gameBoard) {
        if (!gameBoard) return;
        
        // Supprimer les anciens cercles d'abord
        this.removeAllCircles(gameBoard);
        
        // Récupérer tous les game_users du jeu
        const gameUsers = gameState.game?.game_users || [];
        console.log(`👥 GameUsers trouvés: ${gameUsers.length}`);
        
        // Récupérer tous les clans du jeu
        const allClans = gameState.game?.clans || [];
        console.log(`🏛️ Tous les clans: ${allClans.length}`);
        
        // Récupérer les clan_id qui sont renseignés dans les game_users
        const usedClanIds = gameUsers
            .map(user => user.clan_id)
            .filter(clanId => clanId !== null && clanId !== undefined);
        
        console.log(`🔍 Clan IDs utilisés: ${usedClanIds}`);
        
        // Filtrer les clans non utilisés (ceux qui ne sont pas dans usedClanIds)
        const unusedClans = allClans.filter(clan => !usedClanIds.includes(clan.id));
        
        console.log(`🔍 Clans non utilisés: ${unusedClans.length}`);
        unusedClans.forEach(clan => {
            console.log(`  - Clan ${clan.name} (${clan.color}) - ID: ${clan.id}`);
        });
        
        // Créer un cercle pour chaque clan non utilisé
        for (const clan of unusedClans) {
            const circle = this.createClanCircle(gameBoard, { q: clan.start_q, r: clan.start_r });
            // Stocker le cercle avec son clan associé
            this.createdCircles.push({
                circle: circle,
                clan: clan
            });
            console.log(`🔵 Cercle créé pour le clan ${clan.name} (${clan.color}) à (${clan.start_q}, ${clan.start_r})`);
        }
    },

    // Supprimer tous les cercles créés
    removeAllCircles(gameBoard) {
        if (!gameBoard) return;
        
        console.log(`🗑️ Suppression de ${this.createdCircles.length} cercles`);
        
        this.createdCircles.forEach(({ circle, clan }) => {
            gameBoard.workplane.remove(circle);
            // Libérer les ressources
            if (circle.geometry) circle.geometry.dispose();
            if (circle.material) circle.material.dispose();
            console.log(`🗑️ Cercle supprimé pour le clan ${clan.name}`);
        });
        
        this.createdCircles = [];
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
        return circle; // Retourner le cercle créé
    },

    // Fonction pour nettoyer les ressources de la phase
    cleanupPhase() {
        if (this.currentGameBoard) {
            this.currentGameBoard.disableClickCallback();
            this.currentGameBoard = null;
        }
        this.clickHandler = null;
        this.selectedClan = null;
    }
};