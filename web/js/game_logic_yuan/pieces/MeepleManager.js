import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class MeepleManager {
    constructor() {
        this.gltfLoader = new GLTFLoader();
        this.loadedModels = new Map(); // Cache des modèles préchargés
        this.loadPromises = new Map(); // Promises de chargement pour éviter les doublons
        this.instances = [];
        this.modelPreloader = null;
                
        // Types de meeples et leurs caractéristiques
        this.meepleTypes = {
            ville: { 
                path: './glb/meeple/ville.glb', 
                colorable: true,
                scale: { x: 1, y: 1, z: 1 }
            },
            village: { 
                path: './glb/meeple/village.glb', 
                colorable: true,
                scale: { x: 1, y: 1, z: 1 }
            },
            guerrier: { 
                path: './glb/meeple/guerrier.glb', 
                colorable: true,
                scale: { x: 1, y: 1, z: 1 }
            },
            '2villes': { 
                path: './glb/meeple/2villes.glb', 
                colorable: true,
                scale: { x: 1, y: 1, z: 1 }
            },
            temple: { 
                path: './glb/meeple/Temple.glb', 
                colorable: false,
                scale: { x: 1, y: 1, z: 1 }
            },
            fortification: { 
                path: './glb/meeple/fortification.glb', 
                colorable: false,
                scale: { x: 1, y: 1, z: 1 }
            }
        };

        // Types de cercles et leurs caractéristiques
        this.circleTypes = {
            selection: {
                path: './images/cercle.webp',
                scale: 1.0, // Scale de base
                colorable: true,
                defaultColor: 0xffffff
            }
        };

        // Types de sprites 2D et leurs caractéristiques
        this.spriteTypes = {
            pathSquare: {
                path: null, // Pas de texture - carré plein
                size: 0.1, // Légèrement plus grand pour couvrir plus d'espace
                colorable: true,
                defaultColor: 0xff0000, // Rouge
                useAsAlphaMap: false, // Pas de canal alpha
                oriented: true, // Indique que ce sprite doit être orienté selon la direction
                solidColor: true // Carré plein sans texture
            },
            pathDisc: {
                path: './images/disqueAlpha.png',
                size: 0.1,
                colorable: true,
                defaultColor: 0xff0000,
                useAsAlphaMap: true,
                oriented: true,
                solidColor: false
            },
            pathArrow: {
                path: './images/arow.png', // Flèche avec canal alpha
                size: 0.3, // Plus grande que les carrés pour être visible
                colorable: true,
                defaultColor: 0xff0000, // Rouge
                useAsAlphaMap: true, // Utiliser comme canal alpha
                oriented: true, // S'oriente selon la direction
                solidColor: false // Avec texture
            },
            tax1Chao: {
                path: './images/1chao.webp',
                size: 0.5,
                colorable: false,
                defaultColor: 0xffffff,
                useAsAlphaMap: false, // L'image a déjà sa propre texture alpha
                oriented: false, // Face caméra
                solidColor: false
            },
            tax2Chao: {
                path: './images/2chao.webp',
                size: 0.5,
                colorable: false,
                defaultColor: 0xffffff,
                useAsAlphaMap: false, // L'image a déjà sa propre texture alpha
                oriented: false, // Face caméra
                solidColor: false
            },
            echao: {
                path: './images/echao.webp',
                size: 0.5,
                colorable: false,
                defaultColor: 0xffffff,
                useAsAlphaMap: false, // L'image a déjà sa propre texture alpha
                oriented: false, // Face caméra
                solidColor: false
            }
        };

        // Cache des textures préchargées
        this.loadedTextures = new Map();
    }

    // Précharger un modèle de meeple
    async preloadMeepleModel(type) {
        if (!this.meepleTypes[type]) {
            throw new Error(`Type de meeple inconnu: ${type}`);
        }

        // Si déjà chargé, retourner le modèle
        if (this.loadedModels.has(type)) {
            return this.loadedModels.get(type);
        }

        // Si en cours de chargement, retourner la promise existante
        if (this.loadPromises.has(type)) {
            return this.loadPromises.get(type);
        }

        // Créer une nouvelle promise de chargement
        const loadPromise = new Promise((resolve, reject) => {
            const meepleInfo = this.meepleTypes[type];

            this.gltfLoader.load(
                meepleInfo.path,
                (gltf) => {
                    // Corriger l'espace colorimétrique des textures
                    gltf.scene.traverse((child) => {
                        if (child.isMesh && child.material) {
                            const materials = Array.isArray(child.material) ? child.material : [child.material];
                            materials.forEach(material => {
                                if (material.map) {
                                    material.map.colorSpace = THREE.SRGBColorSpace;
                                    material.map.needsUpdate = true;
                                }
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

                    // Stocker le modèle dans le cache
                    this.loadedModels.set(type, gltf.scene);
                    this.loadPromises.delete(type); // Nettoyer la promise
                    resolve(gltf.scene);
                },
                (progress) => {
                },
                (error) => {
                    this.loadPromises.delete(type); // Nettoyer la promise même en cas d'erreur
                    reject(error);
                }
            );
        });

        // Stocker la promise pour éviter les chargements multiples
        this.loadPromises.set(type, loadPromise);
        return loadPromise;
    }

    // Précharger une texture de sprite
    async preloadSpriteTexture(type) {
        if (!this.spriteTypes[type]) {
            throw new Error(`Type de sprite inconnu: ${type}`);
        }

        // Si déjà chargé, retourner la texture
        if (this.loadedTextures.has(type)) {
            return this.loadedTextures.get(type);
        }

        // Si en cours de chargement, retourner la promise existante
        const loadKey = `sprite_${type}`;
        if (this.loadPromises.has(loadKey)) {
            return this.loadPromises.get(loadKey);
        }

        // Créer une nouvelle promise de chargement
        const loadPromise = new Promise((resolve, reject) => {
            const spriteInfo = this.spriteTypes[type];
            const textureLoader = new THREE.TextureLoader();

            textureLoader.load(
                spriteInfo.path,
                (texture) => {
                    // Ne pas définir l'espace colorimétrique pour les masques alpha
                    if (!spriteInfo.useAsAlphaMap) {
                        texture.colorSpace = THREE.SRGBColorSpace;
                    }
                    
                    this.loadedTextures.set(type, texture);
                    this.loadPromises.delete(loadKey);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    this.loadPromises.delete(loadKey);
                    reject(error);
                }
            );
        });

        this.loadPromises.set(loadKey, loadPromise);
        return loadPromise;
    }

    // Précharger un cercle (Mesh parallèle au plan XZ)
    async preloadCircle(type) {
        if (!this.circleTypes[type]) {
            throw new Error(`Type de cercle inconnu: ${type}`);
        }

        // Si déjà chargé, retourner le modèle
        if (this.loadedModels.has(`circle_${type}`)) {
            return this.loadedModels.get(`circle_${type}`);
        }

        // Si en cours de chargement, retourner la promise existante
        if (this.loadPromises.has(`circle_${type}`)) {
            return this.loadPromises.get(`circle_${type}`);
        }

        // Créer une nouvelle promise de chargement
        const loadPromise = new Promise((resolve, reject) => {
            const circleInfo = this.circleTypes[type];

            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(
                circleInfo.path,
                (texture) => {
                    // Corriger l'espace colorimétrique
                    texture.colorSpace = THREE.SRGBColorSpace;
                    
                    // Créer la géométrie et le matériau pour Mesh parallèle au plan XZ
                    const geometry = new THREE.PlaneGeometry(1, 1);
                    const material = new THREE.MeshBasicMaterial({
                        map: texture,
                        transparent: true,
                        opacity: 0.8,
                        side: THREE.DoubleSide,
                        color: circleInfo.defaultColor
                    });
                    
                    // Créer le mesh (parallèle au plan XZ)
                    const circleMesh = new THREE.Mesh(geometry, material);
                    circleMesh.rotation.x = -Math.PI / 2; // Parallèle au plan XZ
                    
                    // Stocker le modèle dans le cache
                    this.loadedModels.set(`circle_${type}`, circleMesh);
                    this.loadPromises.delete(`circle_${type}`); // Nettoyer la promise
                    resolve(circleMesh);
                },
                (progress) => {
                },
                (error) => {
                    this.loadPromises.delete(`circle_${type}`); // Nettoyer la promise même en cas d'erreur
                    reject(error);
                }
            );
        });

        // Stocker la promise pour éviter les chargements multiples
        this.loadPromises.set(`circle_${type}`, loadPromise);
        return loadPromise;
    }

    // Précharger tous les types de meeples
    async preloadAllMeeples() {
        const preloadPromises = Object.keys(this.meepleTypes).map(type => 
            this.preloadMeepleModel(type)
        );

        try {
            await Promise.all(preloadPromises);
        } catch (error) {
            throw error;
        }
    }

    // Créer une instance d'un meeple avec couleur optionnelle
    async createMeepleInstance(type, colorHex = null, userData = {}) {
        // Vérifier si le modèle est déjà chargé
        let baseModel = this.loadedModels.get(type);
        
        // Si pas encore chargé, attendre qu'il soit en cours de chargement
        if (!baseModel && this.loadPromises.has(type)) {
            try {
                baseModel = await this.loadPromises.get(type);
            } catch (error) {
                return null;
            }
        }
        
        // Si toujours pas de modèle, essayer de le précharger
        if (!baseModel) {
            try {
                baseModel = await this.preloadMeepleModel(type);
            } catch (error) {
                return null;
            }
        }

        const meepleInfo = this.meepleTypes[type];
        if (!meepleInfo) {
            return null;
        }
        
        // Cloner le modèle pour créer une instance
        const instance = baseModel.clone();
        
        // Appliquer la couleur si le meeple est colorable et une couleur est fournie
        if (meepleInfo.colorable && colorHex) {
            console.log(`🎨 Application couleur ${colorHex} sur meeple type ${type}`);
            instance.traverse((child) => {
                if (child.isMesh && child.material) {
                    console.log(`🎨 Mesh trouvé, type matériau:`, child.material.type || 'unknown');
                    // Cloner le matériau pour éviter d'affecter les autres instances
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    const clonedMaterials = materials.map(material => {
                        const clonedMaterial = material.clone();
                        clonedMaterial.color = new THREE.Color(colorHex);
                        
                        // Pour les matériaux PBR, s'assurer que la couleur n'est pas assombrie
                        if (clonedMaterial.isMeshStandardMaterial || clonedMaterial.isMeshPhysicalMaterial) {
                            clonedMaterial.metalness = 0; // Pas de métallicité (assombrit)
                            clonedMaterial.roughness = 0.5; // Rugosité modérée
                            clonedMaterial.emissive = new THREE.Color(0x000000); // Pas d'émission
                        }
                        
                        clonedMaterial.needsUpdate = true;
                        return clonedMaterial;
                    });
                    
                    child.material = Array.isArray(child.material) ? clonedMaterials : clonedMaterials[0];
                }
            });
        }

        // Gestion spéciale pour les fortifications selon le type de rempart
        if (type === 'fortification' && userData.rempartType) {
            console.log(`🏰 Application texture spéciale pour rempart type: ${userData.rempartType}`);
            
            if (userData.rempartType === 'indestruible') {
                // Charger la texture gravier pour les remparts indestructibles
                try {
                    const textureLoader = new THREE.TextureLoader();
                    const gravierTexture = await new Promise((resolve, reject) => {
                        textureLoader.load(
                            './images/texture/textureGravier.jpg',
                            (texture) => {
                                texture.colorSpace = THREE.SRGBColorSpace;
                                resolve(texture);
                            },
                            undefined,
                            reject
                        );
                    });

                    // Appliquer la texture gravier à tous les meshes
                    instance.traverse((child) => {
                        if (child.isMesh && child.material) {
                            const materials = Array.isArray(child.material) ? child.material : [child.material];
                            const clonedMaterials = materials.map(material => {
                                const clonedMaterial = material.clone();
                                clonedMaterial.map = gravierTexture.clone();
                                clonedMaterial.needsUpdate = true;
                                return clonedMaterial;
                            });
                            
                            child.material = Array.isArray(child.material) ? clonedMaterials : clonedMaterials[0];
                        }
                    });
                    
                    console.log(`🏰 Texture gravier appliquée pour rempart indestructible`);
                } catch (error) {
                    console.warn(`⚠️ Impossible de charger la texture gravier:`, error);
                }
            }
            // Pour 'fortifiee', on garde la texture par défaut du GLB
        }

        // Appliquer la taille par défaut
        const scale = meepleInfo.scale;
        instance.scale.set(scale.x, scale.y, scale.z);
        
        // Stocker les métadonnées
        instance.userData = {
            type: 'meeple',
            meepleType: type,
            colorHex: colorHex,
            colorable: meepleInfo.colorable,
            ...userData
        };

        return instance;
    }

    // Créer une instance de sprite 2D
    async createSpriteInstance(type, position = { x: 0, y: 0, z: 0 }, colorHex = null, userData = {}, rotationY = 0) {
        if (!this.spriteTypes[type]) {
            throw new Error(`Type de sprite inconnu: ${type}`);
        }

        const spriteInfo = this.spriteTypes[type];
        
        // Créer la géométrie du plan
        const geometry = new THREE.PlaneGeometry(spriteInfo.size, spriteInfo.size);
        
        // Créer le matériau selon le type de sprite
        let material;
        
        if (spriteInfo.solidColor) {
            // Matériau simple sans texture pour carré plein
            material = new THREE.MeshBasicMaterial({
                transparent: false, // Pas de transparence
                toneMapped: false,
                color: colorHex ? colorHex : spriteInfo.defaultColor,
                side: THREE.DoubleSide
            });
        } else {
            // Matériau avec texture (pour les autres sprites)
            const texture = await this.preloadSpriteTexture(type);
            
            material = new THREE.MeshBasicMaterial({
                transparent: true,
                alphaTest: 0.5,
                toneMapped: false,
                color: colorHex ? colorHex : spriteInfo.defaultColor,
                side: THREE.DoubleSide
            });

            // Appliquer la texture selon son type
            if (spriteInfo.useAsAlphaMap) {
                material.alphaMap = texture.clone();
            } else {
                material.map = texture.clone();
            }
        }

        // Créer le mesh
        const sprite = new THREE.Mesh(geometry, material);
        
        // Positionner le sprite
        sprite.position.set(position.x, position.y, position.z);
        
        // Calculer l'orientation finale directement
        if (spriteInfo.oriented && rotationY !== 0) {
            // Définir l'ordre d'Euler pour des rotations correctes
            sprite.rotation.order = 'YXZ';
            sprite.rotation.set(-Math.PI / 2, rotationY, 0); // X pour horizontal, Y pour direction
        } else {
            // Orientation standard (horizontal seulement)
            sprite.rotation.x = -Math.PI / 2;
        }
        
        // Ajouter les userData
        sprite.userData = {
            type: 'sprite',
            spriteType: type,
            spriteInfo: spriteInfo,
            originalColor: colorHex ? colorHex : spriteInfo.defaultColor,
            ...userData
        };

        // Ajouter à la liste des instances
        this.instances.push(sprite);

        return sprite;
    }

    // Créer une instance d'un cercle avec position et animation
    async createCircleInstance(type, position = { q: 0, r: 0 }, scale = 1.0, height = 0, colorHex = null, userData = {}) {
        // Vérifier si le modèle est déjà chargé
        let baseModel = this.loadedModels.get(`circle_${type}`);
        
        // Si pas encore chargé, attendre qu'il soit en cours de chargement
        if (!baseModel && this.loadPromises.has(`circle_${type}`)) {
            try {
                baseModel = await this.loadPromises.get(`circle_${type}`);
            } catch (error) {
                return null;
            }
        }
        
        // Si toujours pas de modèle, essayer de le précharger
        if (!baseModel) {
            try {
                baseModel = await this.preloadCircle(type);
            } catch (error) {
                return null;
            }
        }

        const circleInfo = this.circleTypes[type];
        if (!circleInfo) {
            return null;
        }
        
        // Cloner le modèle pour créer une instance
        const instance = baseModel.clone();
        
        // Appliquer la couleur si le cercle est colorable et une couleur est fournie
        if (circleInfo.colorable && colorHex) {
            if (instance.material) {
                // Cloner le matériau pour éviter d'affecter les autres instances
                const clonedMaterial = instance.material.clone();
                clonedMaterial.color = new THREE.Color(colorHex);
                clonedMaterial.needsUpdate = true;
                instance.material = clonedMaterial;
            }
        }

        // Ne pas positionner automatiquement - sera fait par l'appelant
        // instance.position.set(position.x || 0, height, position.z || 0);
        
        // Commencer avec scale 0 pour l'animation
        instance.scale.set(0, 0, 0);
        
        // Animation progressive vers le scale final
        const startTime = performance.now();
        const duration = 500; // 500ms
        
        const animateScale = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Fonction d'easing pour une animation plus naturelle
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentScale = easeOut * scale;
            
            instance.scale.set(currentScale, currentScale, currentScale);
            
            if (progress < 1) {
                requestAnimationFrame(animateScale);
            }
        };
        
        requestAnimationFrame(animateScale);
        
        // Stocker les métadonnées
        instance.userData = {
            type: 'circle',
            circleType: type,
            colorHex: colorHex,
            colorable: circleInfo.colorable,
            position: position,
            scale: scale,
            height: height,
            ...userData
        };

        return instance;
    }

    // Créer plusieurs instances d'un même type avec différentes couleurs
    createColoredMeepleSet(type, colors = []) {
        if (!this.meepleTypes[type]?.colorable) {
            return [];
        }

        const instances = colors.map(colorHex => 
            this.createMeepleInstance(type, colorHex, { setColor: colorHex })
        );

        return instances;
    }

    // Créer des instances pour tous les clans d'un type donné
    createMeeplesByClans(type, clansData = []) {
        const instances = clansData.map(clan => 
            this.createMeepleInstance(type, clan.color_hex, {
                clanName: clan.name,
                clanColor: clan.color_hex
            })
        );

        return instances;
    }

    // Vérifier si un type de meeple est préchargé
    isMeepleLoaded(type) {
        return this.loadedModels.has(type);
    }

    // Obtenir la liste des types de meeples disponibles
    getAvailableMeepleTypes() {
        return Object.keys(this.meepleTypes);
    }

    // Obtenir les informations d'un type de meeple
    getMeepleInfo(type) {
        return this.meepleTypes[type] || null;
    }

    // Nettoyer le cache (pour économiser la mémoire si nécessaire)
    clearCache() {
        // Disposer des ressources Three.js
        this.loadedModels.forEach((model, type) => {
            model.traverse((child) => {
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
        });

        this.loadedModels.clear();
        this.loadPromises.clear();
    }
    
    // Supprimer les méthodes liées à l'eau
    // loadWaterMesh() { ... }
    // createWaterInstance() { ... }
    // createWaterInstanceAsync() { ... }
}

// Instance unique du gestionnaire de meeples
export const meepleManager = new MeepleManager(); 