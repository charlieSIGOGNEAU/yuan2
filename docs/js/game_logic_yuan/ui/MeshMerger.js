// toute referance est passe en commentaire, donc suprimable. la fusion a pose des probleme de texture multiplee, mais je ne pense pas que ce sois le vrais probleme. vu que je suis passe a des calcule des ombre toute les 10s pour eviter les gish,il ni a plus besoind'optimiser le calcule des ombre

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export class MeshMerger {
    constructor(workplane, shadowManager) {
        
        this.workplane = workplane;
        this.shadowManager = shadowManager;
        
        // Group pour contenir les meshes fusionnés
        this.mergedTilesGroup = null;
        this.mergedTemplesGroup = null;
        
        // Listes temporaires pour accumuler les géométries par matériau
        this.tileGeometriesByMaterial = new Map(); // Map<materialKey, {geometries: [], material: Material}>
        this.templeGeometriesByMaterial = new Map();
        
        // Références aux meshes originaux (pour pouvoir les restaurer)
        this.originalTiles = [];
        this.originalTemples = [];
        
        // Compteurs pour éviter de reconstruire trop souvent
        this.tilesAddedSinceRebuild = 0;
        this.templesAddedSinceRebuild = 0;
        this.rebuildThreshold = 1; // Reconstruire après chaque ajout par défaut
        
        // Flag pour activer/désactiver la fusion
        this.mergingEnabled = false;
    }

    // Activer/désactiver la fusion
    setMergingEnabled(enabled) {
        this.mergingEnabled = enabled;
        if (!enabled) {
            // Restaurer tous les meshes originaux
            this.restoreOriginalMeshes();
        }
        console.log(`🔄 Fusion de meshes: ${enabled ? 'ACTIVÉE' : 'DÉSACTIVÉE'}`);
    }

    // Restaurer tous les meshes originaux
    restoreOriginalMeshes() {
        // Rendre visibles tous les meshes originaux
        this.originalTiles.forEach(tile => {
            if (tile) tile.visible = true;
        });
        this.originalTemples.forEach(temple => {
            if (temple) temple.visible = true;
        });
        
        // Supprimer les groupes fusionnés
        if (this.mergedTilesGroup) {
            this.workplane.remove(this.mergedTilesGroup);
            this.mergedTilesGroup = null;
        }
        if (this.mergedTemplesGroup) {
            this.workplane.remove(this.mergedTemplesGroup);
            this.mergedTemplesGroup = null;
        }
        
        console.log('✅ Meshes originaux restaurés');
    }

    // Ajouter une tile à la fusion
    addTileToMerge(tileMesh, autoRebuild = true) {
        if (!this.mergingEnabled) {
            // Fusion désactivée, ne rien faire
            return;
        }
        
        // Stocker la référence au mesh original
        this.originalTiles.push(tileMesh);
        
        // Extraire toutes les géométries de la tile groupées par matériau
        tileMesh.traverse((child) => {
            if (child.isMesh && child.geometry) {
                // Cloner la géométrie et appliquer la transformation du mesh
                const geometry = child.geometry.clone();
                
                // Appliquer la transformation monde du mesh à la géométrie
                child.updateMatrixWorld(true);
                geometry.applyMatrix4(child.matrixWorld);
                
                // Créer une clé unique pour le matériau
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((material, index) => {
                    const materialKey = material.uuid || `material_${index}`;
                    
                    if (!this.tileGeometriesByMaterial.has(materialKey)) {
                        this.tileGeometriesByMaterial.set(materialKey, {
                            geometries: [],
                            material: material.clone()
                        });
                    }
                    
                    this.tileGeometriesByMaterial.get(materialKey).geometries.push(geometry.clone());
                });
            }
        });
        
        // Marquer la tile originale comme invisible
        tileMesh.visible = false;
        
        this.tilesAddedSinceRebuild++;
        
        // Reconstruire si autoRebuild et seuil atteint
        if (autoRebuild && this.tilesAddedSinceRebuild >= this.rebuildThreshold) {
            this.rebuildTilesMesh();
            this.tilesAddedSinceRebuild = 0;
        }
    }

    // Ajouter un temple à la fusion
    addTempleToMerge(templeMesh, autoRebuild = true) {
        if (!this.mergingEnabled) {
            // Fusion désactivée, ne rien faire
            return;
        }
        
        // Stocker la référence au mesh original
        this.originalTemples.push(templeMesh);
        
        // Extraire toutes les géométries du temple groupées par matériau
        templeMesh.traverse((child) => {
            if (child.isMesh && child.geometry) {
                const geometry = child.geometry.clone();
                
                child.updateMatrixWorld(true);
                geometry.applyMatrix4(child.matrixWorld);
                
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach((material, index) => {
                    const materialKey = material.uuid || `material_${index}`;
                    
                    if (!this.templeGeometriesByMaterial.has(materialKey)) {
                        this.templeGeometriesByMaterial.set(materialKey, {
                            geometries: [],
                            material: material.clone()
                        });
                    }
                    
                    this.templeGeometriesByMaterial.get(materialKey).geometries.push(geometry.clone());
                });
            }
        });
        
        templeMesh.visible = false;
        
        this.templesAddedSinceRebuild++;
        
        // Reconstruire si autoRebuild et seuil atteint
        if (autoRebuild && this.templesAddedSinceRebuild >= this.rebuildThreshold) {
            this.rebuildTemplesMesh();
            this.templesAddedSinceRebuild = 0;
        }
    }

    // Reconstruire le mesh fusionné des tiles
    rebuildTilesMesh() {
        if (!this.mergingEnabled) return;
        
        // Supprimer l'ancien groupe fusionné
        if (this.mergedTilesGroup) {
            this.workplane.remove(this.mergedTilesGroup);
            // Disposer les géométries
            this.mergedTilesGroup.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
            });
            this.mergedTilesGroup = null;
        }

        // Si pas de géométries à fusionner, sortir
        if (this.tileGeometriesByMaterial.size === 0) {
            return;
        }

        try {
            // Créer un nouveau groupe pour contenir tous les meshes fusionnés
            this.mergedTilesGroup = new THREE.Group();
            this.mergedTilesGroup.userData = { type: 'mergedTilesGroup' };
            
            let totalGeometries = 0;
            
            // Pour chaque matériau, fusionner toutes ses géométries
            this.tileGeometriesByMaterial.forEach((data, materialKey) => {
                if (data.geometries.length === 0) return;
                
                try {
                    const mergedGeometry = mergeGeometries(data.geometries, false);
                    
                    if (mergedGeometry) {
                        const mesh = new THREE.Mesh(mergedGeometry, data.material);
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;
                        mesh.raycast = function() {}; // Désactiver collisions
                        
                        this.mergedTilesGroup.add(mesh);
                        totalGeometries += data.geometries.length;
                    }
                } catch (error) {
                    console.warn(`⚠️ Impossible de fusionner les géométries pour le matériau ${materialKey}:`, error);
                }
            });
            
            // Ajouter le groupe au workplane
            this.workplane.add(this.mergedTilesGroup);
            
            console.log(`✅ ${totalGeometries} géométries de tiles fusionnées en ${this.tileGeometriesByMaterial.size} groupes de matériaux`);
        } catch (error) {
            console.error('❌ Erreur lors de la fusion des tiles:', error);
        }
    }

    // Reconstruire le mesh fusionné des temples
    rebuildTemplesMesh() {
        if (!this.mergingEnabled) return;
        
        // Supprimer l'ancien groupe fusionné
        if (this.mergedTemplesGroup) {
            this.workplane.remove(this.mergedTemplesGroup);
            // Disposer les géométries
            this.mergedTemplesGroup.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
            });
            this.mergedTemplesGroup = null;
        }

        // Si pas de géométries à fusionner, sortir
        if (this.templeGeometriesByMaterial.size === 0) {
            return;
        }

        try {
            // Créer un nouveau groupe pour contenir tous les meshes fusionnés
            this.mergedTemplesGroup = new THREE.Group();
            this.mergedTemplesGroup.userData = { type: 'mergedTemplesGroup' };
            
            let totalGeometries = 0;
            
            // Pour chaque matériau, fusionner toutes ses géométries
            this.templeGeometriesByMaterial.forEach((data, materialKey) => {
                if (data.geometries.length === 0) return;
                
                try {
                    const mergedGeometry = mergeGeometries(data.geometries, false);
                    
                    if (mergedGeometry) {
                        const mesh = new THREE.Mesh(mergedGeometry, data.material);
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;
                        mesh.raycast = function() {}; // Désactiver collisions
                        
                        this.mergedTemplesGroup.add(mesh);
                        totalGeometries += data.geometries.length;
                    }
                } catch (error) {
                    console.warn(`⚠️ Impossible de fusionner les géométries pour le matériau ${materialKey}:`, error);
                }
            });
            
            // Ajouter le groupe au workplane
            this.workplane.add(this.mergedTemplesGroup);
            
            console.log(`✅ ${totalGeometries} géométries de temples fusionnées en ${this.templeGeometriesByMaterial.size} groupes de matériaux`);
        } catch (error) {
            console.error('❌ Erreur lors de la fusion des temples:', error);
        }
    }

    // Nettoyer toutes les fusions
    clear() {
        // Restaurer les meshes originaux
        this.restoreOriginalMeshes();
        
        // Vider les listes de géométries
        this.tileGeometriesByMaterial.forEach((data) => {
            data.geometries.forEach(geo => geo.dispose());
        });
        this.templeGeometriesByMaterial.forEach((data) => {
            data.geometries.forEach(geo => geo.dispose());
        });
        
        this.tileGeometriesByMaterial.clear();
        this.templeGeometriesByMaterial.clear();
        
        this.originalTiles = [];
        this.originalTemples = [];
        
        console.log('🧹 Nettoyage complet effectué');
    }

    // Obtenir des statistiques
    getStats() {
        let totalTileGeometries = 0;
        this.tileGeometriesByMaterial.forEach(data => {
            totalTileGeometries += data.geometries.length;
        });
        
        let totalTempleGeometries = 0;
        this.templeGeometriesByMaterial.forEach(data => {
            totalTempleGeometries += data.geometries.length;
        });
        
        const stats = {
            mergingEnabled: this.mergingEnabled,
            tilesCount: this.originalTiles.length,
            templesCount: this.originalTemples.length,
            tileGeometriesCount: totalTileGeometries,
            templeGeometriesCount: totalTempleGeometries,
            tileMaterialsCount: this.tileGeometriesByMaterial.size,
            templeMaterialsCount: this.templeGeometriesByMaterial.size,
            hasMergedTiles: this.mergedTilesGroup !== null,
            hasMergedTemples: this.mergedTemplesGroup !== null,
            tilesAddedSinceRebuild: this.tilesAddedSinceRebuild,
            templesAddedSinceRebuild: this.templesAddedSinceRebuild,
            rebuildThreshold: this.rebuildThreshold
        };
        
        console.log('📊 Statistiques de fusion:', stats);
        return stats;
    }

    // Définir le seuil de reconstruction (pour optimiser lors de l'ajout en batch)
    setRebuildThreshold(threshold) {
        this.rebuildThreshold = Math.max(1, threshold);
        console.log(`⚙️ Seuil de reconstruction défini: ${this.rebuildThreshold}`);
    }

    // Forcer la reconstruction maintenant (utile après un batch d'ajouts)
    forceRebuild() {
        if (this.tilesAddedSinceRebuild > 0) {
            this.rebuildTilesMesh();
            this.tilesAddedSinceRebuild = 0;
        }
        
        if (this.templesAddedSinceRebuild > 0) {
            this.rebuildTemplesMesh();
            this.templesAddedSinceRebuild = 0;
        }
        
        console.log('🔨 Reconstruction forcée terminée');
    }
}

export function createMeshMerger(workplane, shadowManager) {
    return new MeshMerger(workplane, shadowManager);
}

