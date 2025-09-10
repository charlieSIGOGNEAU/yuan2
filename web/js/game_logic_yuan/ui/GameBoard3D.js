// attention dans un repere exagonal r, c'est en bas a gauche et q a droite. a modifier lor de la pose des tuiles

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { meepleManager } from '../pieces/MeepleManager.js';

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
        this.dragStart = null;
        this.workplaneStartPosition = null;
        this.activePointerId = null; // Pour suivre le doigt actif
        
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
        
        // Remettre les propriétés liées à l'eau
        this.waterMesh = null; // Mesh de référence pour l'eau
        this.waterGeometry = null; // Géométrie pour les instances
        this.waterMaterial = null; // Matériau pour les instances
        this.waterLoaded = false; // État du chargement de l'eau
        this.waterLoadPromise = null; // Promise pour attendre le chargement
        
        // Limites de zoom (correspondant à des hauteurs effectives de 1 à 10)
        this.minScale = 0.2; // Hauteur max de 10
        this.maxScale = 5; // Hauteur min de 1
        
        // Limites de déplacement du workplane
        this.maxPanDistance = 40; // Distance maximale de déplacement depuis l'origine
        
        // Système de callback pour les clics
        this.clickCallback = null; // Callback pour les clics détectés
        
        // Écouteur pour l'événement circleClicked
        this.container.addEventListener('circleClicked', (event) => {
            if (this.tempTile) {
                this.moveTileTemp(event.detail.position);
            }
        });

        // Démarrer l'initialisation asynchrone
        this.initAsync().catch(error => {
        });
    }
    
    
    async initAsync() {
        // Créer d'abord la scène Three.js
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 9, 6);
        this.camera.rotation.set(THREE.MathUtils.degToRad(-60), 0, 0);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.outputColorSpace = THREE.SRGBColorSpace; 
        
        // Utiliser la taille du container au lieu de window
        const containerRect = this.container.getBoundingClientRect();
        this.renderer.setSize(containerRect.width, containerRect.height);
        this.container.appendChild(this.renderer.domElement);
        
        // Ajout d'éclairage pour les modèles 3D
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); //Éclaire uniformément toute la scène (pas d'ombres) 0 = noir total, 2 = très lumineux, Affecte la luminosité générale, réduit les contrastes
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 3); // intensité de la lumière, augmente le contrast, Crée les ombres et les zones claires/sombres
        directionalLight.position.set(5, 10, 5); //direction de la source de lumiere
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        

        
        this.workplane = new THREE.Group();
        this.scene.add(this.workplane);


        // Après avoir créé la scène et le workplane


// Patch pour activer automatiquement les ombres sur tous les Mesh ajoutés dans la scène
const enableShadowsOnAdd = (parent) => {
    const originalAdd = parent.add;
    parent.add = (...objects) => {
        objects.forEach(obj => {
            if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
            }
            // Si le mesh contient des enfants
            obj.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        });
        originalAdd.apply(parent, objects);
    };
};

// Appliquer sur la scène et le workplane
enableShadowsOnAdd(this.scene);
enableShadowsOnAdd(this.workplane);

        
        // Maintenant précharger les modèles
        // Charger l'eau via le MeepleManager
        this.loadWaterMesh();
        await this.meepleManager.preloadMeepleModel('ville');
        await this.meepleManager.preloadMeepleModel('guerrier');
        await this.meepleManager.preloadMeepleModel('fortification');
        await this.meepleManager.preloadMeepleModel('temple');
        await this.meepleManager.preloadMeepleModel('2villes');
        

        // Précharger les sprites
        await this.meepleManager.preloadSpriteTexture('pathArrow');
        await this.meepleManager.preloadSpriteTexture('pathDisc');
        await this.meepleManager.preloadSpriteTexture('tax1Chao');
        await this.meepleManager.preloadSpriteTexture('tax2Chao');
        
        // Précharger les cercles
        await this.meepleManager.preloadCircle('selection');
        
        // Continuer avec l'initialisation normale
        this.init();
    }
    
    init() {
        // Seulement les événements et l'animation
        this.setupEvents();
        this.animate();
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
                    
                    // Utiliser le MeepleManager pour l'eau
                    this.createWaterInstanceAsync().then(waterInstance => {
                        if (waterInstance) {
                            // Attacher l'eau comme enfant de la tuile
                            tile.add(waterInstance);
                        }
                    }).catch(error => {
                    });
                    
                            // Désactiver les collisions pour cette tuile
                    tile.traverse((child) => {
                        if (child.isMesh) {
                            child.raycast = function() {}; // Désactive le raycast
                        }
                    });
                    
        this.workplane.add(tile);
        this.tiles.push(tile); // Stocke la référence de la tuile
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
        tile.position.set(pos.x, 0.2, pos.z); // Hauteur fixée à 0.2
                    tile.rotation.y = rotation * Math.PI / 3; // Rotation sur l'axe Y pour les modèles 3D
                    // Le modèle est déjà à la bonne taille
                    
                    // Utiliser le MeepleManager pour l'eau
                    this.createWaterInstanceAsync().then(waterInstance => {
                        if (waterInstance) {
                            // Attacher l'eau comme enfant de la tuile temporaire
                            tile.add(waterInstance);

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

                    // Création des sprites rotation et OK (restent en 2D pour l'interface)
                    const textureLoader = new THREE.TextureLoader();
        const spriteGeometry = new THREE.PlaneGeometry(1, 1);

        // Premier sprite rotation à droite - créer d'abord le matériau sans texture
        const rightMaterial = new THREE.MeshBasicMaterial({
            alphaTest: 0.5,
            toneMapped: false,
            transparent: true,
            color: 0xffffff
        });
        const rightSprite = new THREE.Mesh(spriteGeometry, rightMaterial);
        
        // Charger la texture de rotation avec callback
        const rotationTexture = textureLoader.load(
            './images/rotation.webp',
            (loadedTexture) => {
                loadedTexture.colorSpace = THREE.SRGBColorSpace;
                // Appliquer la texture aux deux matériaux
                rightMaterial.map = loadedTexture;
                rightMaterial.needsUpdate = true;
                leftMaterial.map = loadedTexture;
                leftMaterial.needsUpdate = true;
            },
            undefined,
            (error) => {}
        );
                    rightSprite.position.set(pos.x + 0.5, 0.4, pos.z); // Position relative à la tuile principale
        rightSprite.rotation.x = -Math.PI / 2;
        rightSprite.rotation.z = 0;
        this.workplane.add(rightSprite);
        this.tiles.push(rightSprite);

        // Deuxième sprite rotation à gauche (avec symétrie verticale)
        const leftMaterial = new THREE.MeshBasicMaterial({
            alphaTest: 0.5,
            toneMapped: false,
            transparent: true,
            color: 0xffffff
        });
        const leftSprite = new THREE.Mesh(spriteGeometry, leftMaterial);
                    leftSprite.position.set(pos.x - 0.5, 0.4, pos.z); // Position relative à la tuile principale
        leftSprite.rotation.x = -Math.PI / 2;
        leftSprite.rotation.z = 0;
        leftSprite.scale.x = -1; // Symétrie verticale
        this.workplane.add(leftSprite);
        this.tiles.push(leftSprite);

        // Sprite OK (optimisé et face caméra)
        const okMaterial = new THREE.SpriteMaterial({
            transparent: true,
            alphaTest: 0.5,
            toneMapped: false,
            fog: false,
            color: 0xffffff
        });
        const okSprite = new THREE.Sprite(okMaterial);
        
        // Charger la texture OK avec callback
        const okTexture = textureLoader.load(
            './images/buttonOk.webp',
            (loadedTexture) => {
                loadedTexture.colorSpace = THREE.SRGBColorSpace;
                okMaterial.map = loadedTexture;
                okMaterial.needsUpdate = true;
            },
            undefined,
            (error) => {}
        );
        okSprite.position.set(pos.x + 1, 0.6, pos.z - 1); // Position relative à la tuile principale
        okSprite.scale.set(1, 1, 1); // Taille du sprite
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

    onPointerDown(e) {
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

        // Sinon, on commence le glisser-déposer du workplane
        this.isDragging = true;
        this.activePointerId = e.pointerId;
        this.dragStart = result.point;
        this.workplaneStartPosition = this.workplane.position.clone();
        
        // Capturer les événements pointer
        this.container.setPointerCapture(e.pointerId);
    }

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

        // Sinon, déplacer le workplane normalement
        const delta = new THREE.Vector3().subVectors(this.dragStart, result.point);
        const newPosition = this.workplaneStartPosition.clone().sub(delta);
        
        // Contraindre la position dans les limites
        this.constrainPosition(newPosition);
        this.workplane.position.copy(newPosition);
    }
    
    // Méthode pour contraindre la position du workplane dans les limites
    constrainPosition(position) {
        const distance = Math.sqrt(position.x * position.x + position.z * position.z);
        if (distance > this.maxPanDistance) {
            // Normaliser et limiter à la distance maximale
            const scale = this.maxPanDistance / distance;
            position.x *= scale;
            position.z *= scale;
            // console.log(`🚫 Déplacement du workplane limité: distance ${distance.toFixed(2)} > max ${this.maxPanDistance}`);
        }
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

        this.isDragging = false;
        this.activePointerId = null;
        this.clickStartPosition = null;
        this.clickStartTime = null;
        
        // Libérer la capture du pointer
        this.container.releasePointerCapture(e.pointerId);
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
        
        const result = this.getMouseWorld(e);
        if (!result.point) return;
        
        const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const mousePoint = result.point;
        
        // Calculer la nouvelle échelle proposée
        const currentScale = this.workplane.scale.x; // Utilise x car l'échelle est uniforme
        const newScale = currentScale * scaleFactor;
        
        // Vérifier les limites de zoom
        if (newScale < this.minScale || newScale > this.maxScale) {
            return; // Ne pas appliquer le zoom
        }
        
        const pointToWorkplaneDelta = new THREE.Vector3().subVectors(mousePoint, this.workplane.position);
        
        this.workplane.scale.multiplyScalar(scaleFactor);
        
        this.workplane.position.add(
            pointToWorkplaneDelta.multiplyScalar(1 - scaleFactor)
        );
        
        // Contraindre la position après le zoom
        this.constrainPosition(this.workplane.position);
    }

    onResize() {
        // Utiliser la taille du container au lieu de window
        const containerRect = this.container.getBoundingClientRect();
        this.camera.aspect = containerRect.width / containerRect.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(containerRect.width, containerRect.height);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Gestion des animations
        const currentTime = performance.now();
        for (let i = this.animations.length - 1; i >= 0; i--) {
            const animation = this.animations[i];
            const elapsed = currentTime - animation.startTime;
            const progress = Math.min(elapsed / animation.duration, 1);
            
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
                this.workplane.remove(sprite);
                sprite.geometry.dispose();
                sprite.material.dispose();
            });
            this.tempTileSprites = null;
        }

        // Supprimer les cercles
        this.removeAllCircles();

        // Réinitialiser la rotation
        this.tempTileRotation = null;
    }

    // Méthode de démonstration pour le nouveau système Territory
    async testTerritorySystem() {
        try {
            // Vérifier qu'on a des territoires
            if (!window.gameState?.game?.territories?.length) {
                return;
            }
            
            // Prendre le premier territoire disponible
            const territory = window.gameState.game.territories[0];
            
            // Configurer le territoire pour le test
            territory.color = '#FF0000'; // Rouge pour test
            territory.construction_type = 'ville';
            territory.rempart = 'fortifiee';
            
            // Test 1: Créer une construction
            territory.createConstruction(this, this.meepleManager);
            
            // Test 2: Créer des guerriers (3 pour tester le positionnement)
            setTimeout(() => {
                territory.createWarriors(this, this.meepleManager, 3);
                
                // Test 3: Mettre à jour le nombre de guerriers après 2 secondes
                setTimeout(() => {
                    territory.createWarriors(this, this.meepleManager, 5);
                    
                    // Test 4: Nettoyage après 3 secondes
                    setTimeout(() => {
                        territory.removeAllMeshes(this);
                        
                        // Réinitialiser le territoire
                        territory.color = null;
                        territory.construction_type = null;
                        territory.rempart = null;
                    }, 3000);
                }, 2000);
            }, 1000);
            
        } catch (error) {
        }
        }
} 