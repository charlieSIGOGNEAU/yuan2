import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class MeepleManager {
    constructor() {
        this.gltfLoader = new GLTFLoader();
        this.loadedModels = new Map(); // Cache des modèles préchargés
        this.loadPromises = new Map(); // Promises de chargement pour éviter les doublons
        this.instances = [];
        this.modelPreloader = null;
        
        // Supprimer les propriétés liées à l'eau
        // this.waterMesh = null;
        // this.waterGeometry = null;
        // this.waterMaterial = null;
        // this.waterLoaded = false;
        // this.waterLoadPromise = null;
        
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
            console.log(`🎭 Préchargement du meeple: ${type} depuis ${meepleInfo.path}`);

            this.gltfLoader.load(
                meepleInfo.path,
                (gltf) => {
                    console.log(`✅ Meeple ${type} préchargé avec succès`);
                    
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
                    console.log(`📊 Progression chargement ${type}:`, Math.round(progress.loaded / progress.total * 100) + '%');
                },
                (error) => {
                    console.error(`❌ Erreur lors du chargement du meeple ${type}:`, error);
                    this.loadPromises.delete(type); // Nettoyer la promise même en cas d'erreur
                    reject(error);
                }
            );
        });

        // Stocker la promise pour éviter les chargements multiples
        this.loadPromises.set(type, loadPromise);
        return loadPromise;
    }

    // Précharger tous les types de meeples
    async preloadAllMeeples() {
        console.log('🎭 Préchargement de tous les meeples...');
        const preloadPromises = Object.keys(this.meepleTypes).map(type => 
            this.preloadMeepleModel(type)
        );

        try {
            await Promise.all(preloadPromises);
            console.log('✅ Tous les meeples ont été préchargés avec succès');
        } catch (error) {
            console.error('❌ Erreur lors du préchargement des meeples:', error);
            throw error;
        }
    }

    // Créer une instance d'un meeple avec couleur optionnelle
    createMeepleInstance(type, colorHex = null, userData = {}) {
        const baseModel = this.loadedModels.get(type);
        if (!baseModel) {
            console.error(`❌ Modèle ${type} non préchargé. Appelez preloadMeepleModel() d'abord.`);
            return null;
        }

        const meepleInfo = this.meepleTypes[type];
        
        // Cloner le modèle pour créer une instance
        const instance = baseModel.clone();
        
        // Appliquer la couleur si le meeple est colorable et une couleur est fournie
        if (meepleInfo.colorable && colorHex) {
            instance.traverse((child) => {
                if (child.isMesh && child.material) {
                    // Cloner le matériau pour éviter d'affecter les autres instances
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    const clonedMaterials = materials.map(material => {
                        const clonedMaterial = material.clone();
                        clonedMaterial.color = new THREE.Color(colorHex);
                        clonedMaterial.needsUpdate = true;
                        return clonedMaterial;
                    });
                    
                    child.material = Array.isArray(child.material) ? clonedMaterials : clonedMaterials[0];
                }
            });
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

        console.log(`🎭 Instance de ${type} créée${colorHex ? ` avec couleur ${colorHex}` : ''}`);
        return instance;
    }

    // Créer plusieurs instances d'un même type avec différentes couleurs
    createColoredMeepleSet(type, colors = []) {
        if (!this.meepleTypes[type]?.colorable) {
            console.warn(`⚠️ Le meeple ${type} n'est pas colorable`);
            return [];
        }

        const instances = colors.map(colorHex => 
            this.createMeepleInstance(type, colorHex, { setColor: colorHex })
        );

        console.log(`🎨 Set de ${instances.length} instances ${type} créé avec ${colors.length} couleurs`);
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

        console.log(`🏰 ${instances.length} instances de ${type} créées pour les clans`);
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
        console.log('🧹 Nettoyage du cache des meeples...');
        
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
        console.log('✅ Cache des meeples nettoyé');
    }
    
    // Supprimer les méthodes liées à l'eau
    // loadWaterMesh() { ... }
    // createWaterInstance() { ... }
    // createWaterInstanceAsync() { ... }
}

// Instance unique du gestionnaire de meeples
export const meepleManager = new MeepleManager(); 