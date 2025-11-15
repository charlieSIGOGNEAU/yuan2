// attention dans un repere exagonal r, c'est en bas a gauche et q a droite. a modifier lor de la pose des tuiles

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { meepleManager } from '../pieces/MeepleManager.js';
import { createShadowManager } from './ShadowManager.js';
import { Auth } from '../../app/auth.js';
// import { createMeshMerger } from './MeshMerger.js';

export class GameBoard3D {
    constructor(containerId) {
        
        this.container = document.getElementById(containerId);
        // Désactiver les comportements tactiles par défaut
        this.container.style.touchAction = 'none';
        
        this.instances = []; // Stocke les instances de pièces
        this.circles = []; // Stocke les cercles créés
        this.tiles = []; // Stocke les tuiles créées
        this.animations = []; // Stocke les animations en cours
        this.initialPlacementCities = []; // Stocke les villes du placement initial
        this.isDragging = false;
        this.dragStart = null; // Point d'intersection au début du drag (sur le plan y=0)
        this.cameraStartPosition = null; // Position de la caméra au début du drag
        this.cameraTargetPosition = null; // Position cible de la caméra pour le lissage
        this.activePointerId = null; // Pour suivre le doigt actif
        
        // Promise pour attendre que l'initialisation soit terminée
        this.ready = null;
        
        // Raycaster pour le nouveau système de déplacement caméra
        this.raycaster = new THREE.Raycaster();
        this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Plan au sol (y=0)
        
        // Propriétés pour le drag and drop des villes
        this.isDraggingCity = false;
        this.draggedCity = null;
        this.clickStartPosition = null; // Pour détecter les clics
        this.clickStartTime = null; // Pour mesurer la durée du clic
        this.cityDragEnabled = false; // Contrôle l'activation du drag & drop des villes
        this.tempTile = null;
        this.tempTileRotation = null;
        this.tempTilePosition = null;
        this.tempTileSprites = null;
        this.tileTemp = null;
        this.gltfLoader = new GLTFLoader(); // Ajouter le loader GLB
        this.meepleManager = meepleManager; // Référence au gestionnaire de meeples
        
        // Limitation FPS
        console.log('Auth', Auth);
        this.targetFPS = Auth.options.fps; // FPS cible (peut être modifié via setFPS) 
        this.frameInterval = 1000 / this.targetFPS; // Intervalle entre frames en ms
        this.lastFrameTime = 0; // Timestamp de la dernière frame rendue
        
        // Lissage du déplacement (pan)
        this.panSmoothingFactor = 0.5; // 0 = pas de lissage, 1 = lissage maximal (0.5 = moyenne)
        
        // Remettre les propriétés liées à l'eau
        this.waterMesh = null; // Mesh de référence pour l'eau
        this.waterGeometry = null; // Géométrie pour les instances
        this.waterMaterial = null; // Matériau pour les instances
        this.waterLoaded = false; // État du chargement de l'eau
        this.waterLoadPromise = null; // Promise pour attendre le chargement
        
        // Limites de zoom (hauteur Y de la caméra)
        this.minCameraY = 3; // Zoom max (caméra proche)
        this.maxCameraY = 9; // Zoom min (caméra loin)
        
        // Limites de déplacement du workplane (basées sur les tuiles)
        this.tileBounds = { minX: 0, maxX: 0, minZ: 0, maxZ: 0 }; // Bornes calculées dynamiquement
        this.panMargin = 5; // Marge supplémentaire autour des tuiles
        
        // Système de callback pour les clics
        this.clickCallback = null; // Callback pour les clics détectés
        
        // Écouteur pour l'événement circleClicked
        this.container.addEventListener('circleClicked', (event) => {
            if (this.tempTile) {
                this.moveTileTemp(event.detail.position);
            }
        });

        // Démarrer l'initialisation asynchrone et stocker la Promise
        this.ready = this.initAsync().catch(error => {
            console.error('Erreur lors de l\'initialisation de GameBoard3D:', error);
        });
    }

    testCamera(x,y,z) {
        this.camera.rotation.set(THREE.MathUtils.degToRad(x), THREE.MathUtils.degToRad(y), THREE.MathUtils.degToRad(z));
    }
    
    // Niveau d'anisotropie souhaité (limité par le GPU)
    getAnisotropyLevel() {
        const max = this.renderer && this.renderer.capabilities ? this.renderer.capabilities.getMaxAnisotropy() : 1;
        return Math.min(4, max || 1);
    }
    
    // Applique l'anisotropie à une texture si possible
    applyAnisotropy(texture) {
        try {
            if (texture && typeof texture === 'object') {
                const level = this.getAnisotropyLevel();
                console.log('anisotropy level', level);
                if (typeof texture.anisotropy === 'number') {
                    texture.anisotropy = level;
                    texture.needsUpdate = true;
                }
            }
        } catch (e) {
        }
    }
    
    async initAsync() {
        // Créer d'abord la scène Three.js
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 100);

        this.camera.position.set(0, 9, 6);
        this.camera.rotation.set(THREE.MathUtils.degToRad(-57), 0, 0);
        this.renderer = new THREE.WebGLRenderer({ antialias: false });
        

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace; 
        
        // Utiliser la taille du container au lieu de window
        const containerRect = this.container.getBoundingClientRect();
        this.renderer.setSize(containerRect.width, containerRect.height);
        this.container.appendChild(this.renderer.domElement);
        // Mettre à jour l'aspect ratio de la caméra avant de calculer le FOV
        this.camera.aspect = containerRect.width / containerRect.height;
        // FOV initial selon l'orientation (FOV diagonal fixe à 60°)
        this.updateFovByOrientation();
        
        // Ajout d'éclairage pour les modèles 3D
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); //Éclaire uniformément toute la scène (pas d'ombres) 0 = noir total, 2 = très lumineux, Affecte la luminosité générale, réduit les contrastes
        this.ambientLight = ambientLight;
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 4); // intensité de la lumière, augmente le contrast, Crée les ombres et les zones claires/sombres
        directionalLight.position.set(-10, 4, -3); //direction de la source de lumiere
        this.directionalLight = directionalLight;
        this.scene.add(directionalLight);
        
        // Ajouter le target de la lumière à la scène (nécessaire pour setLightOnSphere)
        this.scene.add(directionalLight.target);
        
        this.workplane = new THREE.Group();
        this.scene.add(this.workplane);

        // Initialiser le gestionnaire d'ombres
        this.shadowManager =await createShadowManager(this.renderer, directionalLight, this.camera, this.workplane);
        // this.shadowManager.enableShadowsOnContainer(this.scene);
        // this.shadowManager.enableShadowsOnContainer(this.workplane);
        this.shadowManager.ambientLight = this.ambientLight;
        
        // Initialiser le gestionnaire de fusion de meshes
        // this.meshMerger = createMeshMerger(this.workplane, this.shadowManager);
        
        // Exposer globalement pour l'accès console
        window.shadowManager = this.shadowManager;
        // window.meshMerger = this.meshMerger;
        
        // Exposer les fonctions FPS globalement
        window.setFPS = (fps) => this.setFPS(fps);
        window.getFPS = () => this.getFPS();
        
        // Exposer les fonctions de lissage du déplacement globalement
        window.setPanSmoothing = (factor) => this.setPanSmoothing(factor);
        window.getPanSmoothing = () => this.getPanSmoothing();

            
        // Maintenant précharger les modèles
        // Charger l'eau via le MeepleManager
        this.loadWaterMesh();
        const models = [
            'ville',
            'guerrier',
            'fortification',
            'temple',
            '2villes'
          ].map(name => this.meepleManager.preloadMeepleModel(name));
        
          const sprites = [
            'pathArrow',
            'pathDisc',
            'tax1Chao',
            'tax2Chao',
            'rotation',
            'buttonOk'
          ].map(name => this.meepleManager.preloadSpriteTexture(name));
        
          const circles = [
            'selection'
          ].map(name => this.meepleManager.preloadCircle(name));
        
          // attendre que tout soit chargé en parallèle
          await Promise.all([...models, ...sprites, ...circles]);
        
          // sol en bois une fois les assets prêts
          await this.addWoodFloor();
        
        // Continuer avec l'initialisation normale
        this.init();
    }
    
    init() {
        // Seulement les événements et l'animation
        this.setupEvents();
        // Initialiser les bornes des tuiles
        this.calculateTileBounds();
        // Optimiser la shadow box initiale
        if (this.shadowManager) {
            this.shadowManager.optimizeShadowBox(2);
        }
        this.animate();
    }

    // Met à jour le FOV vertical pour maintenir un FOV diagonal fixe à 60 degrés
    updateFovByOrientation() {
        if (!this.camera || !this.container) return;
        const rect = this.container.getBoundingClientRect();
        const aspectRatio = rect.width / rect.height;
        
        // FOV diagonal fixe à 60 degrés
        const diagonalFovDeg = 99;
        const diagonalFovRad = THREE.MathUtils.degToRad(diagonalFovDeg);
        
        // Calculer le FOV vertical pour maintenir le FOV diagonal constant
        // FOV_vertical = 2 * atan(tan(FOV_diagonal / 2) / sqrt(1 + aspect_ratio^2))
        const verticalFovRad = 2 * Math.atan(Math.tan(diagonalFovRad / 2) / Math.sqrt(1 + aspectRatio * aspectRatio));
        const verticalFovDeg = THREE.MathUtils.radToDeg(verticalFovRad);
        
        if (Math.abs(this.camera.fov - verticalFovDeg) > 0.01) {
            this.camera.fov = verticalFovDeg;
            this.camera.updateProjectionMatrix();
        }
    }


    // Ajoute un plan texturé bois sur le workplane
    addWoodFloor() {
        return new Promise((resolve, reject) => {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(
                './images/texture/wood.jpg',
                (texture) => {
                    // Espace colorimétrique et répétition
                    texture.colorSpace = THREE.SRGBColorSpace;
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    // Répéter 30x30 (taille tuile 3x3 sur un plan 90x90)
                    texture.repeat.set(30, 30);
                    this.applyAnisotropy(texture);

                    const geometry = new THREE.PlaneGeometry(90, 90);
                    const material = new THREE.MeshStandardMaterial({
                        map: texture
                    });

                    const woodFloor = new THREE.Mesh(geometry, material);
                    woodFloor.rotation.x = -Math.PI / 2; // Parallèle au plan XZ
                    woodFloor.position.set(0, -0.2, 0);
                    
                    // Marquer le sol pour qu'il reçoive des ombres
                    woodFloor.userData = { type: 'floor' };

                    // Activer la réception des ombres
                    woodFloor.receiveShadow = true;

                    this.workplane.add(woodFloor);
                    this.woodFloor = woodFloor;
                    resolve(woodFloor);
                },
                undefined,
                (error) => {
                    reject(error);
                }
            );
        });
    }

        // Remettre les méthodes liées à l'eau
        loadWaterMesh() {
            
            this.waterLoadPromise = new Promise((resolve, reject) => {
                this.gltfLoader.load(
                    './glb/tiles/eau.glb',
                    (gltf) => {
                        
                        // Stocker la mesh de référence
                        this.waterMesh = gltf.scene;
                        
                        // Corriger l'espace colorimétrique des textures
                        this.waterMesh.traverse((child) => {
                            if (child.isMesh && child.material) {
                                const materials = Array.isArray(child.material) ? child.material : [child.material];
                                materials.forEach(material => {
                                    if (material.map) {
                                        material.map.colorSpace = THREE.SRGBColorSpace;
                                        material.map.needsUpdate = true;
                                    }
                                    material.needsUpdate = true;
                                });
                                
                                // Stocker la géométrie et le matériau pour les instances
                                if (!this.waterGeometry) {
                                    this.waterGeometry = child.geometry;
                                    this.waterMaterial = child.material;
                                }
                            }
                        });
                        
                        this.waterLoaded = true;
                        resolve(this.waterMesh);
                    },
                    (progress) => {
                    },
                    (error) => {
                        reject(error);
                    }
                );
            });
        }
        
        createWaterInstance() {
            if (!this.waterLoaded || !this.waterMesh) {
                return null;
            }
            
            // Cloner la scène entière de l'eau pour créer une instance
            const waterInstance = this.waterMesh.clone();
            
            // Corriger les matériaux clonés pour éviter les conflits
            waterInstance.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material = child.material.clone();
                }
            });
            
            // L'eau est positionnée relativement à la tuile, donc position (0,0,0) par rapport à son parent
            waterInstance.position.set(0, 0, 0);
            
            // Marquer l'eau pour qu'elle ne projette pas d'ombres
            waterInstance.userData = { tileType: 'eau' };
            
            return waterInstance;
        }
        
        async createWaterInstanceAsync() {
            // Attendre que l'eau soit chargée si ce n'est pas déjà fait
            if (!this.waterLoaded && this.waterLoadPromise) {
                try {
                    await this.waterLoadPromise;
                } catch (error) {
                    return null;
                }
            }
            
            return this.createWaterInstance();
        }

        

        setupEvents() {
            // Gestionnaire d'événements pointer (fonctionne pour souris et tactile)
            this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
            this.container.addEventListener('pointermove', this.onPointerMove.bind(this));
            this.container.addEventListener('pointerup', this.onPointerUp.bind(this));
            this.container.addEventListener('pointercancel', this.onPointerUp.bind(this));
            window.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
            
            // Écouter les changements de taille du container et de la fenêtre
        window.addEventListener('resize', this.onResize.bind(this));
        window.addEventListener('orientationchange', this.onResize.bind(this));
            
            // Observer les changements de taille du container
            this.resizeObserver = new ResizeObserver(() => {
                this.onResize();
            });
            this.resizeObserver.observe(this.container);
        }
        //q correspond à un déplacement vers la droite. r correspond à un déplacement en diagonale en haut a droites.
        hexToCartesian(position = {q: 0, r: 0, z: 0}) {
            return {x: position.q+position.r/2, y: position.z || 0, z: -position.r/2*Math.sqrt(3)};
        }
        cartesianToHex({ x, y, z }) {
            // Convertir les coordonnées monde en coordonnées relatives au workplane
            const relativeX = (x - this.workplane.position.x) / this.workplane.scale.x;
            const relativeZ = (z - this.workplane.position.z) / this.workplane.scale.z;
            
            const r = -relativeZ / (0.5 * Math.sqrt(3));
            const q = relativeX - r / 2;
            return { q: Math.round(q), r: Math.round(r) };
        }

        // Version sans arrondir pour le calcul de distances
        #cartesianToHexFloat({ x, y, z }) {
            // Convertir les coordonnées monde en coordonnées relatives au workplane
            const relativeX = (x - this.workplane.position.x) / this.workplane.scale.x;
            const relativeZ = (z - this.workplane.position.z) / this.workplane.scale.z;
            
            const r = -relativeZ / (0.5 * Math.sqrt(3));
            const q = relativeX - r / 2;
            return { q: q, r: r }; // Pas d'arrondir
        }

        // Fonction pour détecter si une ville se trouve à une position donnée
        detectCityAtPosition(point) {
            // Convertir en coordonnées hexagonales
            const hexCoords = this.cartesianToHex(point);
            
            // Chercher s'il y a une ville à ces coordonnées
            let cityFound = null;
            this.workplane.traverse((child) => {
                if (child.userData && 
                    child.userData.type === 'clan_city' && 
                    child.userData.position &&
                    child.userData.position.q === hexCoords.q && 
                    child.userData.position.r === hexCoords.r) {
                    cityFound = child;
                }
            });
            
            return cityFound;
        }

        // Fonction pour détecter uniquement les clics (sans glissement)
        detectClickOnly(callback) {
            // Stocker le callback pour l'utiliser dans onPointerUp
            this.clickCallback = callback;
        }

        // Fonction pour désactiver le callback de clic
        disableClickCallback() {
            this.clickCallback = null;
        }

        // Méthode pour ajouter une tuile
        addTile(modelUrl, position = { q: 0, r: 0, z: 0}, rotation = 0) {
            return new Promise((resolve, reject) => {
                this.gltfLoader.load(
                    modelUrl,
                    (gltf) => {
                        const tile = gltf.scene;
                        
                        // Corriger l'espace colorimétrique des textures pour éviter la saturation
                        tile.traverse((child) => {
                        if (child.isMesh && child.material) {
                                const materials = Array.isArray(child.material) ? child.material : [child.material];
                                materials.forEach(material => {
                                    // Corriger les textures principales
                                    if (material.map) {
                                        material.map.colorSpace = THREE.SRGBColorSpace;
                                        material.map.needsUpdate = true;
                                    this.applyAnisotropy(material.map);
                                    }
                                    // Corriger les autres types de textures si présentes
                                if (material.normalMap) {
                                    material.normalMap.colorSpace = THREE.LinearSRGBColorSpace;
                                    material.normalMap.needsUpdate = true;
                                }
                                if (material.roughnessMap) {
                                    material.roughnessMap.colorSpace = THREE.LinearSRGBColorSpace;
                                    material.roughnessMap.needsUpdate = true;
                                }
                                if (material.metalnessMap) {
                                    material.metalnessMap.colorSpace = THREE.LinearSRGBColorSpace;
                                    material.metalnessMap.needsUpdate = true;
                                }
                                    material.needsUpdate = true;
                                });
                            }
                        });
                        
            const pos = this.hexToCartesian(position);
            tile.position.set(pos.x, pos.y, pos.z);
                        tile.rotation.y = rotation * Math.PI / 3; // Rotation sur l'axe Y pour les modèles 3D
                        // Les modèles sont déjà à la bonne taille (3 unités)
                        
                        // Marquer la tuile avec son type
                        const tileType = modelUrl.includes('eau.glb') ? 'eau' : 'tile';
                        tile.userData = { tileType: tileType };
                        
                        // Utiliser le MeepleManager pour l'eau
                        this.createWaterInstanceAsync().then(waterInstance => {
                            if (waterInstance) {
                                // Attacher l'eau comme enfant de la tuile
                                tile.add(waterInstance);
                                // Appliquer les paramètres d'ombres à l'eau
                                if (this.shadowManager) {
                                    this.shadowManager.enableShadowsOnObject(waterInstance);
                                }
                            }
                        }).catch(error => {
                        });
                        
                                // Désactiver les collisions pour cette tuile et activer les ombres
                        tile.traverse((child) => {
                            if (child.isMesh) {
                                child.raycast = function() {}; // Désactive le raycast
                                child.castShadow = true; // Activer l'émission d'ombres
                                child.receiveShadow = true; // Activer la réception d'ombres
                            }
                        });
                        
            this.workplane.add(tile);
            this.tiles.push(tile); // Stocke la référence de la tuile
            
            // NOTE: Fusion désactivée pour préserver les matériaux et textures
            // TODO: Implémenter une fusion qui gère les matériaux multiples
            // if (tileType !== 'eau' && this.meshMerger) {
            //     this.meshMerger.addTileToMerge(tile, true);
            // }
            
            // Recalculer les bornes après ajout d'une tuile
            this.calculateTileBounds();
            
                        resolve(tile);
                    },
                    (progress) => {
                    },
                    (error) => {
                        reject(error);
                    }
                );
            });
        }

        addTileTemp(modelUrl, position = { q: 0, r: 0}, rotation = 0) {
            // Nettoyer toute tuile temporaire existante avant d'en créer une nouvelle
            if (this.tempTile) {
                this.removeTempTile();
            }
            this.tempTilePosition = position;
            this.tempTileRotation = rotation;
            
            return new Promise((resolve, reject) => {
            this.gltfLoader.load(
            modelUrl,
            async (gltf) => {
                const tile = gltf.scene;
                
            // Corriger l'espace colorimétrique des textures pour éviter la saturation
            tile.traverse((child) => {
                        if (child.isMesh && child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(material => {
                        // Corriger les textures principales
                        if (material.map) {
                            material.map.colorSpace = THREE.SRGBColorSpace;
                            material.map.needsUpdate = true;
                                    this.applyAnisotropy(material.map);
                        }
                        // Corriger les autres types de textures si présentes
                                if (material.normalMap) {
                                    material.normalMap.colorSpace = THREE.LinearSRGBColorSpace;
                                    material.normalMap.needsUpdate = true;
                                }
                                if (material.roughnessMap) {
                                    material.roughnessMap.colorSpace = THREE.LinearSRGBColorSpace;
                                    material.roughnessMap.needsUpdate = true;
                                }
                                if (material.metalnessMap) {
                                    material.metalnessMap.colorSpace = THREE.LinearSRGBColorSpace;
                                    material.metalnessMap.needsUpdate = true;
                                }
                        material.needsUpdate = true;
                    });
                }
            });

            tile.castShadow = false;
            console.log('🎮 tile.castShadow:', tile.castShadow);
                        
            const pos = this.hexToCartesian(position);
            tile.position.set(pos.x, 0.2, pos.z); // Hauteur fixée à 0.2
            tile.rotation.y = rotation * Math.PI / 3; // Rotation sur l'axe Y pour les modèles 3D
            // Le modèle est déjà à la bonne taille
            
            // Marquer la tuile temporaire avec son type
            const tileType = modelUrl.includes('eau.glb') ? 'eau' : 'tile';
            tile.userData = { tileType: tileType };
            
            // Utiliser le MeepleManager pour l'eau
            this.createWaterInstanceAsync().then(waterInstance => {
                if (waterInstance) {
                    // Attacher l'eau comme enfant de la tuile temporaire
                    tile.add(waterInstance);
                    // Appliquer les paramètres d'ombres à l'eau
                    if (this.shadowManager) {
                        this.shadowManager.enableShadowsOnObject(waterInstance);
                    }
                }
            }).catch(error => {
            });
            
            // Désactiver les collisions pour cette tuile temporaire
            tile.traverse((child) => {
                if (child.isMesh) {
                    child.raycast = function() {}; // Désactive le raycast
                }
            });
                        
            this.workplane.add(tile);
            this.tileTemp = tile;

            // Création des sprites rotation et OK via MeepleManager (instances)
            const rightSprite = await this.meepleManager.createSpriteInstance(
                'rotation',
                { x: pos.x + 0.5, y: 0.4, z: pos.z },
                null,
                {},
                0
            );
            rightSprite.rotation.x = -Math.PI / 2;
            rightSprite.rotation.z = 0;
            this.workplane.add(rightSprite);
            this.tiles.push(rightSprite);

            const leftSprite = await this.meepleManager.createSpriteInstance(
                'rotation',
                { x: pos.x - 0.5, y: 0.4, z: pos.z },
                null,
                {},
                0
            );
            leftSprite.rotation.x = -Math.PI / 2;
            leftSprite.rotation.z = 0;
            leftSprite.scale.x = -1; // Symétrie verticale
            this.workplane.add(leftSprite);
            this.tiles.push(leftSprite);

            const okSprite = await this.meepleManager.createSpriteInstance(
                'buttonOk',
                { x: pos.x + 1, y: 0.6, z: pos.z - 1 },
                null,
                { faceCamera: true }
            );
            this.workplane.add(okSprite);
            this.tiles.push(okSprite);

            // Stocker les références aux sprites
            this.tempTile = tile;
            this.tempTileRotation = rotation;
            this.tempTileSprites = [leftSprite, rightSprite, okSprite];

                        resolve(tile);
                    },
                    (progress) => {
                        // Optionnel: callback de progression
                    },
                    (error) => {
                        reject(error);
                    }
                );
            });
        }

        // Nouvelle méthode pour déplacer la tuile temporaire
        moveTileTemp(position = { q: 0, r: 0 }) {
            if (this.tempTile) {
                this.tempTilePosition = position;
                const pos = this.hexToCartesian(position);
                
                // Déplacer la tuile principale
                this.tempTile.position.set(pos.x, 0.2, pos.z);
                
                // Déplacer les sprites de rotation et le bouton OK
                if (this.tempTileSprites) {
                    this.tempTileSprites[0].position.set(pos.x - 0.5, 0.4, pos.z); // Sprite rotation gauche
                    this.tempTileSprites[1].position.set(pos.x + 0.5, 0.4, pos.z); // Sprite rotation droit
                    this.tempTileSprites[2].position.set(pos.x + 1, 0.6, pos.z - 1); // Bouton OK
                }
            }
        }

        // Méthode pour ajouter une ville de clan
        addClanCity(position = { q: 0, r: 0 }, colorHex = '#FFFFFF', clanName = 'Unknown', isInitialPlacement = false) {
            
            return new Promise((resolve, reject) => {
                this.gltfLoader.load(
                    './glb/meeple/ville.glb',
                    (gltf) => {
                        const cityMesh = gltf.scene;
                        
                        // Corriger l'espace colorimétrique des textures
                        cityMesh.traverse((child) => {
                            if (child.isMesh && child.material) {
                                const materials = Array.isArray(child.material) ? child.material : [child.material];
                                materials.forEach(material => {
                                    // Corriger les textures principales
                                    if (material.map) {
                                        material.map.colorSpace = THREE.SRGBColorSpace;
                                        material.map.needsUpdate = true;
                                    }
                                    // Appliquer la couleur du clan
                                    material.color = new THREE.Color(colorHex);
                                    material.needsUpdate = true;
                                });
                            }
                        });
                        
                        // Convertir les coordonnées hexagonales en cartésiennes
                        const pos = this.hexToCartesian(position);
                        cityMesh.position.set(pos.x, pos.y, pos.z);
                        
                        // Stocker des informations sur le clan dans userData
                        cityMesh.userData = {
                            type: 'clan_city',
                            clanName: clanName,
                            position: position,
                            color: colorHex
                        };
                        
                        // Désactiver les collisions pour cette ville
                        cityMesh.traverse((child) => {
                            if (child.isMesh) {
                                child.raycast = function() {}; // Désactive le raycast
                            }
                        });
                        
                        this.workplane.add(cityMesh);
                        
                        // Stocker la référence si c'est pour l'initial placement
                        if (isInitialPlacement) {
                            this.initialPlacementCities.push(cityMesh);
                        }
                        
                        resolve(cityMesh);
                    },
                    (progress) => {
                    },
                    (error) => {
                        reject(error);
                    }
                );
            });
        }

        // Initialiser les meeples avec les couleurs des clans
        async initializeMeeplesWithClans(clansData = []) {
            try {
                // Précharger tous les types de meeples
                await this.meepleManager.preloadAllMeeples();
                
                // Créer des instances pré-colorées pour chaque type de meeple colorable
                const colorableMeeples = ['ville', 'village', 'guerrier', '2villes'];
                
                for (const meepleType of colorableMeeples) {
                    const instances = this.meepleManager.createMeeplesByClans(meepleType, clansData);
                }
                
            } catch (error) {
                throw error;
            }
        }

        // Ajouter un meeple au plateau (version optimisée)
        addMeeple(type, position = { q: 0, r: 0, z: 0 }, colorHex = null, userData = {}) {
            
            // Créer une instance du meeple
            const meepleInstance = this.meepleManager.createMeepleInstance(type, colorHex, userData);
            
            if (!meepleInstance) {
                return null;
            }
            
            // Convertir les coordonnées hexagonales en cartésiennes
            const pos = this.hexToCartesian(position);
            meepleInstance.position.set(pos.x, pos.y + (position.z || 0), pos.z);
            
            // Désactiver les collisions pour ce meeple
            meepleInstance.traverse((child) => {
                if (child.isMesh) {
                    child.raycast = function() {}; // Désactive le raycast
                }
            });
            
            // Ajouter au workplane
            this.workplane.add(meepleInstance);
            
            // NOTE: Fusion désactivée pour préserver les matériaux et textures
            // TODO: Implémenter une fusion qui gère les matériaux multiples
            // if (type === 'temple' && this.meshMerger) {
            //     this.meshMerger.addTempleToMerge(meepleInstance, true);
            // }
            
            return meepleInstance;
        }

        // Méthode pour créer une ville de clan (optimisée avec le MeepleManager)
        addClanCityOptimized(position = { q: 0, r: 0 }, colorHex = '#FFFFFF', clanName = 'Unknown', isInitialPlacement = false) {
            // Utiliser le nouveau système de meeples
            const cityMesh = this.addMeeple('ville', position, colorHex, {
                type: 'clan_city',
                clanName: clanName,
                position: position,
                color: colorHex
            });
            
            if (!cityMesh) {
                return null;
            }
            
            // Stocker la référence si c'est pour l'initial placement
            if (isInitialPlacement) {
                this.initialPlacementCities.push(cityMesh);
            }
            
            return Promise.resolve(cityMesh);
        }

        // Méthode de test pour le système de meeples
        async testMeepleSystem() {
            try {
                // Test 1: Préchargement
                await this.meepleManager.preloadMeepleModel('ville');
                
                // Test 2: Création d'instance colorée
                const redCity = this.meepleManager.createMeepleInstance('ville', '#FF0000', {
                    testInstance: true
                });
                
                if (redCity) {
                    // Test 3: Ajout au plateau
                    const pos = this.hexToCartesian({ q: 0, r: 0 });
                    redCity.position.set(pos.x, pos.y, pos.z);
                    this.workplane.add(redCity);
                    
                    // Nettoyer après test
                    setTimeout(() => {
                        this.workplane.remove(redCity);
                    }, 3000);
                }
                
            } catch (error) {
            }
        }

        removeAllCircles() {
            // Supprime tous les cercles du workplane
            this.circles.forEach(circle => {
                this.workplane.remove(circle);
                // Libère la mémoire
                circle.geometry.dispose();
                circle.material.dispose();
            });
            // Vide le tableau des cercles
            this.circles = [];
        }

        // Fonction pour activer le drag & drop des villes (phase initial_placement)
        enableCityDrag() {
            this.cityDragEnabled = true;
        }

        // Fonction pour désactiver le drag & drop des villes
        disableCityDrag() {
            this.cityDragEnabled = false;
            // Arrêter tout drag en cours
            if (this.isDraggingCity) {
                this.isDraggingCity = false;
                this.draggedCity = null;
            }
        }

        // Fonction pour supprimer les villes du placement initial uniquement
        removeInitialPlacementCities() {


            
            // Supprimer chaque ville stockée
            this.initialPlacementCities.forEach((city, index) => {
                
                // Supprimer du workplane
                this.workplane.remove(city);
                
                // Libérer les ressources en parcourant tous les enfants
                city.traverse((child) => {
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    if (child.material) {
                        // Gérer les matériaux multiples ou simples
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => {
                                // Libérer les textures
                                if (material.map) material.map.dispose();
                                if (material.normalMap) material.normalMap.dispose();
                                if (material.roughnessMap) material.roughnessMap.dispose();
                                if (material.metalnessMap) material.metalnessMap.dispose();
                                material.dispose();
                            });
                        } else {
                            // Libérer les textures
                            if (child.material.map) child.material.map.dispose();
                            if (child.material.normalMap) child.material.normalMap.dispose();
                            if (child.material.roughnessMap) child.material.roughnessMap.dispose();
                            if (child.material.metalnessMap) child.material.metalnessMap.dispose();
                            child.material.dispose();
                        }
                    }
                });
            });
            
            const removedCount = this.initialPlacementCities.length;
            
            // Vider le tableau après suppression
            this.initialPlacementCities = [];
            
            return removedCount;
        }

        getMouseWorld(e) {
            const rect = this.renderer.domElement.getBoundingClientRect();
            const ndc = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(ndc, this.camera);

            // Intersection avec les pièces, les cercles et les sprites de rotation
            const instanceMeshes = this.instances.map(i => i.mesh);
            const circleMeshes = this.circles;
            const rotationSprites = this.tempTileSprites || [];
            const allMeshes = instanceMeshes.concat(circleMeshes, rotationSprites);

            const intersects = raycaster.intersectObjects(allMeshes, true);
            if (intersects.length > 0) {
                // On cherche si c'est un cercle, une instance ou un sprite de rotation
                const intersected = intersects[0].object;
                const instance = this.instances.find(i => i.mesh === intersected || i.mesh.children.includes(intersected));
                const circle = this.circles.find(c => c === intersected);
                const rotationSprite = this.tempTileSprites?.find(s => s === intersected);

                return { 
                    point: intersects[0].point, 
                    instance,
                    circle,
                    rotationSprite
                };
            }

            // Si pas d'intersection, utiliser le plan
            const planeSurface = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const point = new THREE.Vector3();
            raycaster.ray.intersectPlane(planeSurface, point);
            return { point, instance: null, circle: null, rotationSprite: null };
        }

        // Renvoie toujours l'intersection avec le plan sol Y=0 (ignore les objets)
        getMouseOnGround(e) {
            const rect = this.renderer.domElement.getBoundingClientRect();
            const ndc = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(ndc, this.camera);
            const planeSurface = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const point = new THREE.Vector3();
            if (raycaster.ray.intersectPlane(planeSurface, point)) {
                return point;
            }
            return null;
        }

        onPointerDown(e) {
            // Ignorer les clics sur les boutons UI (fullscreen, etc.)
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return; // Laisser l'événement se propager normalement
            }
            
            e.preventDefault();
            // Si on est déjà en train de glisser, on ignore
            if (this.isDragging) return;

            const result = this.getMouseWorld(e);
            if (!result.point) return;

            
            // Détecter s'il y a une ville à cette position seulement si le drag est activé
            const cityFound = this.cityDragEnabled ? this.detectCityAtPosition(result.point) : null;

            // Stocker la position et le temps de départ pour détecter les clics
            this.clickStartPosition = {
                x: e.clientX,
                y: e.clientY
            };
            this.clickStartTime = performance.now();

            // Si on a cliqué sur une ville et que le drag est activé, commencer le drag de la ville
            if (cityFound && this.cityDragEnabled) {
                this.isDraggingCity = true;
                this.draggedCity = cityFound;
                this.activePointerId = e.pointerId;
                
                // Capturer les événements pointer
                this.container.setPointerCapture(e.pointerId);
                return; // Ne pas faire le drag du workplane
            }

            // Si on a cliqué sur un objet interactif (à implémenter plus tard)
            if (result.instance) {
                this.handleObjectClick(result.instance);
                return;
            }

            // Sinon, on commence le glisser-déposer de la caméra
            this.isDragging = true;
            this.activePointerId = e.pointerId;
            
            // Calculer le point d'intersection avec le plan au sol via raycaster
            const mouse = new THREE.Vector2();
            mouse.x = (e.clientX / this.container.clientWidth) * 2 - 1;
            mouse.y = -(e.clientY / this.container.clientHeight) * 2 + 1;
            
            this.raycaster.setFromCamera(mouse, this.camera);
            const intersectPoint = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.groundPlane, intersectPoint);
            
            if (intersectPoint) {
                this.dragStart = intersectPoint.clone();
                this.cameraStartPosition = this.camera.position.clone();
                this.cameraTargetPosition = this.camera.position.clone(); // Initialiser la cible
                
                // Recalculer les bornes basées sur les tuiles au début du déplacement
                this.calculateTileBounds();
            }
            
            // Capturer les événements pointer
            this.container.setPointerCapture(e.pointerId);
        }
        // deplacement du plan
        onPointerMove(e) {
            // Ne traiter que les événements du pointer actif
            if ((!this.isDragging && !this.isDraggingCity) || e.pointerId !== this.activePointerId) return;

            const result = this.getMouseWorld(e);
            if (!result.point) return;

            // Si on est en train de draguer une ville (et que le drag est activé)
            if (this.isDraggingCity && this.draggedCity && this.cityDragEnabled) {
                // Convertir en coordonnées relatives au workplane (en tenant compte de l'échelle)
                const relativeX = (result.point.x - this.workplane.position.x) / this.workplane.scale.x;
                const relativeZ = (result.point.z - this.workplane.position.z) / this.workplane.scale.z;
                
                // Déplacer la ville à la position relative du curseur
                this.draggedCity.position.set(relativeX, this.draggedCity.position.y, relativeZ);
                return;
            }

            // Sinon, déplacer la caméra
            if (!this.dragStart || !this.cameraStartPosition) return;
            
            // IMPORTANT : Créer une caméra temporaire à la position de DÉPART pour le raycaster
            // Cela évite que le raycaster utilise la position actuelle (qui a déjà bougé)
            const tempCamera = this.camera.clone();
            tempCamera.position.copy(this.cameraStartPosition);
            tempCamera.updateMatrixWorld();
            
            // Calculer le point d'intersection avec le plan au sol depuis la position de départ
            const mouse = new THREE.Vector2();
            mouse.x = (e.clientX / this.container.clientWidth) * 2 - 1;
            mouse.y = -(e.clientY / this.container.clientHeight) * 2 + 1;
            
            this.raycaster.setFromCamera(mouse, tempCamera);
            const currentPoint = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.groundPlane, currentPoint);
            
            if (currentPoint) {
                // Calculer le delta entre le point de départ et le point actuel
                const delta = new THREE.Vector3().subVectors(this.dragStart, currentPoint);
                
                // Appliquer le delta à la position de départ de la caméra
                const newCameraPosition = this.cameraStartPosition.clone().add(delta);
                
                // Contraindre la position de la caméra dans les limites
                this.constrainCameraPosition(newCameraPosition);
                
                // Appliquer directement la position (pas de lissage)
                this.cameraTargetPosition = newCameraPosition;
            }
        }
        
        // Calcule les bornes basées sur les tuiles posées
        calculateTileBounds() {
            if (this.tiles.length === 0) {
                // Si aucune tuile, utiliser des bornes par défaut
                this.tileBounds = { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
                return;
            }

            let minX = Infinity, maxX = -Infinity;
            let minZ = Infinity, maxZ = -Infinity;

            // Parcourir toutes les tuiles pour trouver les bornes
            this.tiles.forEach(tile => {
                // Ignorer les sprites temporaires et autres objets
                if (tile.userData && tile.userData.type) return;
                if (this.tempTileSprites && this.tempTileSprites.includes(tile)) return;

                const pos = tile.position;
                minX = Math.min(minX, pos.x - 1.5); // -1.5 pour la demi-largeur d'une tuile (3x3)
                maxX = Math.max(maxX, pos.x + 1.5);
                minZ = Math.min(minZ, pos.z - 1.5);
                maxZ = Math.max(maxZ, pos.z + 1.5);
            });

            // Ajouter une marge supplémentaire
            this.tileBounds = {
                minX: minX - this.panMargin,
                maxX: maxX + this.panMargin,
                minZ: minZ - this.panMargin,
                maxZ: maxZ + this.panMargin
            };

        }

        // Méthode pour contraindre la position de la caméra dans les limites des tuiles
        constrainCameraPosition(position) {
            // Les bornes s'appliquent directement à la position de la caméra en coordonnées monde
            // Contraindre la position X et Z de la caméra
            let constrained = false;
            
            if (position.x < this.tileBounds.minX) {
                position.x = this.tileBounds.minX;
                constrained = true;
            } else if (position.x > this.tileBounds.maxX) {
                position.x = this.tileBounds.maxX;
                constrained = true;
            }
            
            if (position.z < this.tileBounds.minZ) {
                position.z = this.tileBounds.minZ;
                constrained = true;
            } else if (position.z > this.tileBounds.maxZ) {
                position.z = this.tileBounds.maxZ;
                constrained = true;
            }
            
            return constrained;
        }



        onPointerUp(e) {
            // Ne traiter que les événements du pointer actif
            if (e.pointerId !== this.activePointerId) return;

            // Si on était en train de draguer une ville (et que le drag est activé)
            if (this.isDraggingCity && this.draggedCity && this.cityDragEnabled) {
                const result = this.getMouseWorld(e);
                if (result.point) {
                    // Convertir la position en coordonnées hexagonales sans arrondir
                    const floatCoords = this.#cartesianToHexFloat(result.point);
                    
                    // Position d'origine de la ville qu'on déplace
                    const originalPos = this.draggedCity.userData.position;
                    
                    // Récupérer tous les territoires occupés par des villes (sauf la ville actuelle)
                    const occupiedTerritories = new Set();
                    this.workplane.traverse((child) => {
                        if (child.userData && 
                            child.userData.type === 'clan_city' && 
                            child !== this.draggedCity && // Exclure la ville qu'on déplace
                            child.userData.position) {
                            const key = `${child.userData.position.q},${child.userData.position.r}`;
                            occupiedTerritories.add(key);
                        }
                    });

                    
                    // Trouver le terrain valide le plus proche
                    if (window.gameState && window.gameState.game && window.gameState.game.territories) {
                        const validTerrainTypes = ['mine', 'forest', 'plain', 'rice'];
                        const territories = window.gameState.game.territories;
                        
                        let closestTerrain = null;
                        let minDistance = Infinity;
                        let validTerrainCount = 0;
                        let availableTerrainCount = 0;
                        
                        for (const terrain of territories) {
                            // Vérifier si c'est un terrain valide
                            if (!validTerrainTypes.includes(terrain.type)) continue;
                            validTerrainCount++;
                            
                            // Vérifier si le terrain n'est pas occupé (sauf si c'est la position d'origine)
                            const terrainKey = `${terrain.position.q},${terrain.position.r}`;
                            const isOrigin = terrain.position.q === originalPos.q && terrain.position.r === originalPos.r;
                            if (occupiedTerritories.has(terrainKey) && !isOrigin) {
                                continue;
                            }
                            availableTerrainCount++;
                            
                            // Calculer la distance
                            const dx = floatCoords.q - terrain.position.q;
                            const dy = floatCoords.r - terrain.position.r;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance < minDistance) {
                                minDistance = distance;
                                closestTerrain = terrain;
                            }
                        }
                        
                        if (closestTerrain) {
                            // Placer la ville sur le terrain choisi
                            const exactPos = this.hexToCartesian({ q: closestTerrain.position.q, r: closestTerrain.position.r, z: 0 });
                            this.draggedCity.position.set(exactPos.x, this.draggedCity.position.y, exactPos.z);
                            
                            // Mettre à jour les userData
                            this.draggedCity.userData.position = { q: closestTerrain.position.q, r: closestTerrain.position.r };
                        }
                    }
                }
                
                // Réinitialiser l'état du drag de ville
                this.isDraggingCity = false;
                this.draggedCity = null;
                this.activePointerId = null;
                this.clickStartPosition = null;
                this.clickStartTime = null;
                
                // Libérer la capture du pointer
                this.container.releasePointerCapture(e.pointerId);
                return;
            }

            // Vérifier si c'était un clic (peu de déplacement et durée courte)
            if (this.clickStartPosition && this.clickStartTime) {
                const dx = Math.abs(e.clientX - this.clickStartPosition.x);
                const dy = Math.abs(e.clientY - this.clickStartPosition.y);
                const maxDistance = Math.max(dx, dy); // On prend la plus grande distance
                const duration = performance.now() - this.clickStartTime;
                
                // Si le déplacement est inférieur à 5 pixels ET la durée est inférieure à 500ms
                if (maxDistance < 5 && duration < 1000) {
                    const result = this.getMouseWorld(e);
                    
                    // Appeler le callback de clic s'il existe
                    if (this.clickCallback) {
                        if (result && result.point) {
                            const hexCoords = this.cartesianToHex(result.point);
                            this.clickCallback(hexCoords, result.point);
                        }
                        // Ne pas nettoyer le callback pour permettre des clics multiples
                        // this.clickCallback = null;
                    } else {
                        // Logique existante pour les autres types de clics
                    if (result.rotationSprite) {
                        this.handleRotationSpriteClick(result.rotationSprite);
                    } else if (result.circle) {
                        this.handleCircleClick(result.circle);
                    } else if (result.instance) {
                        this.handleObjectClick(result.instance);
                        }
                    }
                }
            }

            // Si on vient de finir un drag de la caméra, optimiser la shadow box
            const wasDragging = this.isDragging;
            
            this.isDragging = false;
            this.activePointerId = null;
            this.clickStartPosition = null;
            this.clickStartTime = null;
            this.cameraTargetPosition = null; // Réinitialiser la position cible
            
            // Libérer la capture du pointer
            this.container.releasePointerCapture(e.pointerId);
            
            // Optimiser la shadow box après le pan
            if (wasDragging && this.shadowManager) {
                this.shadowManager.optimizeShadowBox(2);
            }
        }

        handleObjectClick(object) {
        }

        handleCircleClick(circle) {
            // Création et émission de l'événement personnalisé
            const event = new CustomEvent('circleClicked', {
                detail: {
                    position: circle.userData.position
                }
            });
            this.container.dispatchEvent(event);
        }

        animateTileTempRotation(targetRotation) {
            if (!this.tileTemp) return;
            const startRotation = this.tileTemp.rotation.y;
            // Corrige la différence d'angle pour prendre le plus court chemin
            let delta = targetRotation - startRotation;
            if (delta > Math.PI) delta -= 2 * Math.PI;
            if (delta < -Math.PI) delta += 2 * Math.PI;
            const endRotation = startRotation + delta;

            this.animations.push({
                object: this.tileTemp,
                property: 'rotationY',
                startTime: performance.now(),
                duration: 150,
                from: { y: startRotation },
                to: { y: endRotation }
            });
        }

        handleRotationSpriteClick(sprite) {
            if (sprite === this.tempTileSprites[0]) {
                this.tempTileRotation += 1;
            } else if (sprite === this.tempTileSprites[1]) {
                this.tempTileRotation -= 1;
            } else if (sprite === this.tempTileSprites[2]) {
                // Émettre un événement avec les informations de la tile
                const event = new CustomEvent('tilePlaced', {
                    detail: {
                        position: this.tempTilePosition,
                        rotation: this.tempTileRotation
                    }
                });
                this.container.dispatchEvent(event);
                this.removeTempTile();
                return;
            }
            this.tempTileRotation = (this.tempTileRotation + 6) % 6;
            // Appelle l'animation au lieu de changer directement la rotation
            this.animateTileTempRotation(this.tempTileRotation * Math.PI / 3);
        }

        onWheel(e) {
            e.preventDefault();
            
            // Calculer le point d'intersection du curseur avec le plan au sol
            const mouse = new THREE.Vector2();
            mouse.x = (e.clientX / this.container.clientWidth) * 2 - 1;
            mouse.y = -(e.clientY / this.container.clientHeight) * 2 + 1;
            
            this.raycaster.setFromCamera(mouse, this.camera);
            const targetPoint = new THREE.Vector3();
            const intersected = this.raycaster.ray.intersectPlane(this.groundPlane, targetPoint);
            
            if (!intersected) return; // Pas d'intersection avec le plan
            
            // Calculer la direction de la caméra vers le point cible
            const direction = new THREE.Vector3().subVectors(targetPoint, this.camera.position);
            const distance = direction.length();
            direction.normalize(); // Normaliser pour avoir un vecteur unitaire
            
            // Calculer la quantité de déplacement
            const zoomDirection = e.deltaY < 0 ? 1 : -1; // 1 = zoom in (vers le point), -1 = zoom out (s'éloigner)
            const zoomSpeed = 0.5; // Vitesse de zoom
            const moveAmount = zoomDirection * zoomSpeed;
            
            // Nouvelle position de la caméra
            const newPosition = this.camera.position.clone().add(direction.multiplyScalar(moveAmount));
            
            // Contraindre la hauteur Y entre les limites
            if (newPosition.y < this.minCameraY || newPosition.y > this.maxCameraY) {
                return; // Arrêter si on dépasse les limites
            }
            
            // Appliquer la nouvelle position
            this.camera.position.copy(newPosition);
            
            // Optimiser la shadow box après le zoom
            if (this.shadowManager) {
                this.shadowManager.optimizeShadowBox(2);
            }
        }

        onResize() {
            // Utiliser la taille du container au lieu de window
            const containerRect = this.container.getBoundingClientRect();
            this.camera.aspect = containerRect.width / containerRect.height;
            // Adapter le FOV à l'orientation
            this.updateFovByOrientation();
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(containerRect.width, containerRect.height);
            
            // Optimiser la shadow box après le resize
            if (this.shadowManager) {
                this.shadowManager.optimizeShadowBox(2);
            }
        }

        animate() {
            requestAnimationFrame(this.animate.bind(this));
            
            // Limitation FPS : vérifier si assez de temps s'est écoulé
            const currentTime = performance.now();
            const elapsed = currentTime - this.lastFrameTime;
            
            if (elapsed < this.frameInterval) {
                // Pas assez de temps écoulé, skip ce frame
                return;
            }
            
            // Enregistrer le temps de ce frame
            this.lastFrameTime = currentTime - (elapsed % this.frameInterval);
            
            // Mise à jour de la position de la caméra
            if (this.cameraTargetPosition) {
                // Appliquer directement la position cible (pas de lissage pour éviter les glitches)
                // this.camera.position.copy(this.cameraTargetPosition);
                const lerpFactor = 1 - this.panSmoothingFactor;
                
                // Interpoler progressivement vers la position cible
                this.camera.position.lerp(this.cameraTargetPosition, lerpFactor);
                
                // Si on est très proche de la cible (< 0.01 unité), on snap à la position exacte
                const distance = this.camera.position.distanceTo(this.cameraTargetPosition);
                if (distance < 0.01) {
                    this.camera.position.copy(this.cameraTargetPosition);
                    // Si on n'est plus en train de draguer, on peut effacer la cible
                    if (!this.isDragging) {
                        this.cameraTargetPosition = null;
                    }
                }
            }
            
            // Mise à jour des ombres (gestion de la limitation si activée)
            if (this.shadowManager) {
                this.shadowManager.update(currentTime);
            }
            
            // Gestion des animations
            for (let i = this.animations.length - 1; i >= 0; i--) {
                const animation = this.animations[i];
                const animElapsed = currentTime - animation.startTime;
                const progress = Math.min(animElapsed / animation.duration, 1);
                
                if (animation.property === 'rotationZ') {
                    // Animation de rotation Z (sprites 2D)
                    const z = animation.from.z + (animation.to.z - animation.from.z) * progress;
                    animation.object.rotation.z = z;
                } else if (animation.property === 'rotationY') {
                    // Animation de rotation Y (modèles 3D)
                    const y = animation.from.y + (animation.to.y - animation.from.y) * progress;
                    animation.object.rotation.y = y;
                } else {
                    // Animation d'échelle (déjà existant)
                    const scale = animation.from.scale + (animation.to.scale - animation.from.scale) * progress;
                    animation.object.scale.set(scale, scale, scale);
                }
                
                // Suppression de l'animation une fois terminée
                if (progress === 1) {
                    this.animations.splice(i, 1);
                }
            }
            
            this.renderer.render(this.scene, this.camera);
        }

        // Définir les FPS cible (appelable depuis la console)
        setFPS(fps) {
            this.targetFPS = Math.max(1, Math.min(144, fps)); // Limité entre 1 et 144 FPS
            this.frameInterval = 1000 / this.targetFPS;
            console.log(`🎬 FPS limité à: ${this.targetFPS} FPS (${this.frameInterval.toFixed(2)}ms par frame)`);
        }

        // Obtenir les FPS actuels
        getFPS() {
            console.log(`🎬 FPS cible: ${this.targetFPS} FPS`);
            return this.targetFPS;
        }

        // Définir le facteur de lissage du déplacement (pan)
        setPanSmoothing(factor) {
            this.panSmoothingFactor = Math.max(0, Math.min(1, factor)); // Limité entre 0 et 1
            const percentage = Math.round((1 - this.panSmoothingFactor) * 100);
            console.log(`🎯 Lissage du déplacement: ${this.panSmoothingFactor.toFixed(2)} (réactivité à ${percentage}%)`);
            if (this.panSmoothingFactor === 0) {
                console.log(`   → Pas de lissage (mouvement direct)`);
            } else if (this.panSmoothingFactor === 0.5) {
                console.log(`   → Moyenne entre ancienne et nouvelle position`);
            } else if (this.panSmoothingFactor >= 0.8) {
                console.log(`   → Lissage très important (mouvement lent)`);
            }
        }

        // Obtenir le facteur de lissage actuel
        getPanSmoothing() {
            const percentage = Math.round((1 - this.panSmoothingFactor) * 100);
            console.log(`🎯 Lissage du déplacement: ${this.panSmoothingFactor.toFixed(2)} (réactivité à ${percentage}%)`);
            return this.panSmoothingFactor;
        }

    

        removeTempTile() {
            // Supprimer la tuile temporaire (modèle 3D + eau)
            if (this.tileTemp) {
                this.workplane.remove(this.tileTemp);
                // Pour les modèles GLB, il faut parcourir tous les enfants pour disposer des ressources
                // Cela inclut maintenant l'eau attachée comme enfant
                this.tileTemp.traverse((child) => {
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
                this.tileTemp = null;
            }

            // Supprimer les sprites de rotation et le bouton OK
            if (this.tempTileSprites) {
                this.tempTileSprites.forEach(sprite => {
                    try {
                        this.workplane.remove(sprite);
                        if (sprite.geometry && typeof sprite.geometry.dispose === 'function') {
                            sprite.geometry.dispose();
                        }
                        if (sprite.material) {
                            if (sprite.material.map && typeof sprite.material.map.dispose === 'function') {
                                sprite.material.map.dispose();
                            }
                            if (sprite.material.alphaMap && typeof sprite.material.alphaMap.dispose === 'function') {
                                sprite.material.alphaMap.dispose();
                            }
                            if (typeof sprite.material.dispose === 'function') {
                                sprite.material.dispose();
                            }
                        }
                    } catch (e) {
                    }
                });
                this.tempTileSprites = null;
            }

            // Supprimer les cercles
            this.removeAllCircles();

            // Réinitialiser la rotation
            this.tempTileRotation = null;
        }

} 