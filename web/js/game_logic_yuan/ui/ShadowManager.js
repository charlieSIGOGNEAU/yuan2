import * as THREE from 'three';

export class ShadowManager {
    constructor(renderer, directionalLight, camera = null, workplane = null) {
        this.renderer = renderer;
        this.directionalLight = directionalLight;
        this.camera = camera;
        this.workplane = workplane;
        this.shadowsEnabled = true; // État des ombres
        
        // Limitation du taux de calcul des ombres
        this.shadowUpdateLimited = true; // Si true, limite le calcul des ombres
        this.shadowUpdateInterval = 1000; // Intervalle en ms (1 seconde par défaut)
        this.lastShadowUpdate = 0; // Timestamp du dernier calcul d'ombre
        
        this.setupShadows();
        this.turn_duration = 10; // 2 minutes
        this.startTime = 0;
        this.animationStarted = false; // Flag pour savoir si l'animation a été démarrée
        this.beginningOfAnimation = true;
        
        this.directionalLight; // Assignée depuis GameBoard3D (THREE.DirectionalLight)
        this.ambientLight;     // Assignée depuis GameBoard3D (THREE.AmbientLight)
        




        this.setShadowUpdateLimited(true, 1000)
        //pour avoir le calcule des ombre toutes les secondes.
        // shadowManager.setShadowUpdateLimited(true, 1000)
    }

    // Configuration initiale des ombres
    setupShadows() {
        // Activer les ombres sur le renderer
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Ombres douces
        
        // Désactiver l'auto-update pour gérer manuellement
        this.renderer.shadowMap.autoUpdate = true; // On le contrôlera plus tard

        // Configurer la lumière directionnelle pour les ombres
        this.directionalLight.castShadow = true;
        
        // Configuration de la shadow map
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        
        // Zone de projection des ombres - Réduite pour plus de précision
        const shadowSize = 5;
        this.directionalLight.shadow.camera.left = -shadowSize;
        this.directionalLight.shadow.camera.right = shadowSize;
        this.directionalLight.shadow.camera.top = shadowSize / 2;
        this.directionalLight.shadow.camera.bottom = -shadowSize;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 25;
        
        // Qualité des ombres - Ajustement pour permettre les ombres entre tiles
        // Un bias trop élevé empêche les ombres de s'afficher sur des surfaces plates
        this.directionalLight.shadow.bias = 0.000; // Très légèrement positif, finalement 0 pour eviter les artophaque sur les androis non ombrage
        this.directionalLight.shadow.normalBias = 0.02; // Réduit de 0.1 à 0.01 pour permettre les ombres entre tiles
    }

    // Active les ombres sur un objet selon son type
    enableShadowsOnObject(object) {
        object.traverse((child) => {
            if (child.isMesh) {
                // Déterminer si l'objet doit émettre des ombres
                const shouldCastShadow = this.shouldCastShadow(child, object);
                child.castShadow = shouldCastShadow;
                
                // Déterminer si l'objet doit recevoir des ombres
                const shouldReceiveShadow = this.shouldReceiveShadow(child, object);
                child.receiveShadow = shouldReceiveShadow;
            }
        });
    }

    // Détermine si un objet doit émettre des ombres
    shouldCastShadow(mesh, parent) {
        const userData = parent.userData || mesh.userData || {};
        
        // Les sprites n'émettent pas d'ombres
        if (userData.type === 'sprite' || userData.spriteType) {
            return false;
        }
        
        // Les meeples émettent des ombres
        if (userData.type === 'meeple' || userData.meepleType) {
            return true;
        }
        
        // Les cercles n'émettent pas d'ombres
        if (userData.type === 'circle' || userData.circleType) {
            return false;
        }
        
        // L'eau n'émet pas d'ombres
        if (userData.tileType === 'eau') {
            return false;
        }
        
        // Vérifier si c'est un enfant d'une tile eau
        if (parent.parent) {
            const parentData = parent.parent.userData || {};
            if (parentData.tileType === 'eau') {
                return false;
            }
        }
        
        // Par défaut, les tiles et autres meshes émettent des ombres
        return true;
    }

    // Détermine si un objet doit recevoir des ombres
    shouldReceiveShadow(mesh, parent) {
        const userData = parent.userData || mesh.userData || {};
        
        // Les sprites ne reçoivent pas d'ombres
        if (userData.type === 'sprite' || userData.spriteType) {
            return false;
        }
        
        // L'eau reçoit des ombres (même si elle n'en émet pas)
        if (userData.tileType === 'eau') {
            return true;
        }
        
        // Vérifier si c'est un enfant d'une tile eau
        if (parent.parent) {
            const parentData = parent.parent.userData || {};
            if (parentData.tileType === 'eau') {
                return true;
            }
        }
        
        // Tout le reste reçoit des ombres par défaut
        return true;
    }

    // Méthode utilitaire pour activer les ombres sur un Group ou Scene
    // enableShadowsOnContainer(container) {
    //     // Patch pour activer automatiquement les ombres sur tous les objets ajoutés
    //     const originalAdd = container.add.bind(container);
    //     container.add = (...objects) => {
    //         objects.forEach(obj => {
    //             this.enableShadowsOnObject(obj);
    //         });
    //         originalAdd(...objects);
    //     };
    // }

    // Changer la direction de la lumière
    setLightDirection(x, y, z) {
        this.directionalLight.position.set(x, y, z);
        console.log(`🌞 Direction lumière changée: (${x}, ${y}, ${z})`);
    }

    // Calculer le centre de la scène basé sur les tiles eau
    getSceneCenter() {
        const waterTiles = this.findWaterTiles();
        // console.log('🔍 Recherche du centre de la scène...', waterTiles);
        
        if (waterTiles.length === 0) {
            console.log('❌ Aucune tile eau trouvée, utilisation du centre par défaut (0, 0, 0)');
            return { x: 0, y: 0, z: 0 };
        }

        // Trouver les extrémités
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        

        waterTiles.forEach(tile => {
            // Utiliser getWorldPosition pour obtenir les coordonnées monde (pas locales)
            const worldPos = new THREE.Vector3();
            tile.getWorldPosition(worldPos);
            minX = Math.min(minX, worldPos.x);
            maxX = Math.max(maxX, worldPos.x);
            minZ = Math.min(minZ, worldPos.z);
            maxZ = Math.max(maxZ, worldPos.z);
        });


        // Calculer le centre
        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;
        const centerY = 0; // Au niveau du sol

        return { x: centerX, y: centerY, z: centerZ };
    }

    // Calculer le rayon de la sphère (distance max du centre + 3)
    getSceneSphereRadius() {
        const center = this.getSceneCenter();
        const waterTiles = this.findWaterTiles();
        
        if (waterTiles.length === 0) {
            return 15; // Rayon par défaut
        }

        let maxDistance = 0;

        waterTiles.forEach(tile => {
            // Utiliser getWorldPosition pour obtenir les coordonnées monde (pas locales)
            const worldPos = new THREE.Vector3();
            tile.getWorldPosition(worldPos);
            const dx = worldPos.x - center.x;
            const dz = worldPos.z - center.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            maxDistance = Math.max(maxDistance, distance);
        });

        return maxDistance + 3;
    }

    // Positionner la lumière sur la sphère avec coordonnées sphériques
    // rx: rotation horizontale autour de l'axe Y (en degrés, 0-360)
    //     0° = Nord (vers +Z), 90° = Est (vers +X), 180° = Sud (vers -Z), 270° = Ouest (vers -X)
    // ry: élévation verticale (en degrés, 0-90)
    //     0° = horizon (soleil couchant/levant), 45° = mi-hauteur, 90° = zénith (midi)
    setLightOnSphere(rx, ry) {
        // Calculer le centre et le rayon de la scène
        const center = this.getSceneCenter();
        const radius = this.getSceneSphereRadius();
        // console.log('🔍 Positionner la lumière sur la sphère...', center, radius);

        // Convertir les angles en radians
        const rxRad = THREE.MathUtils.degToRad(rx);
        const ryRad = THREE.MathUtils.degToRad(ry);

        // Conversion coordonnées sphériques → cartésiennes
        // x = centerX + radius * cos(elevation) * sin(azimuth)
        // y = centerY + radius * sin(elevation)
        // z = centerZ + radius * cos(elevation) * cos(azimuth)
        const x = center.x + radius * Math.cos(ryRad) * Math.sin(rxRad);
        const y = center.y + radius * Math.sin(ryRad);
        const z = center.z + radius * Math.cos(ryRad) * Math.cos(rxRad);

        // Positionner la lumière
        this.directionalLight.position.set(x, y, z);

        // Faire pointer la lumière vers le centre de la scène
        this.directionalLight.target.position.set(center.x, center.y, center.z);
        this.directionalLight.target.updateMatrixWorld();

        // console.log(`🌞 Lumière positionnée sur sphère:`);
        // console.log(`   Centre: (${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)})`);
        // console.log(`   Rayon: ${radius.toFixed(2)}`);
        // console.log(`   Angles: rx=${rx}° (azimuth), ry=${ry}° (élévation)`);
        // console.log(`   Position: (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`);

        // Optimiser la shadow box après le changement
        this.optimizeShadowBox(2, true);
    }

    startSunAnimation() {
        // Ne démarrer l'animation qu'une seule fois
        this.startTime = Date.now();
        this.beginningOfAnimation = true;
        if (this.animationStarted) {
            console.log('🌞 Animation du soleil déjà démarrée');
            this.setShadowUpdateLimited(true, this.turn_duration * 1000 / 12)
            return;
        }
        else {
            this.animateSun(); // lance la boucle
        }
        
    }
    
    animateSun() {
        // soleil qui tourne
        const sunrise = {rx: 90, ry: 20};
        const noon = {rx: -45, ry: 45};
        const sunset = {rx: -180, ry: 10};
        const progress = ((Date.now() - this.startTime) / this.turn_duration / 1000) % 1; // boucle sur [0,1]
        let rx, ry;
        if (progress <= 0.5 ) { // matin → midi
            const t = progress * 2; // normalisé [0,1]
            rx = sunrise.rx * (1 - t) + noon.rx * t;
            ry = sunrise.ry * (1 - t**0.5) + noon.ry * t**0.5;
        } else { // midi → nuit
            const t = (progress - 0.5) * 2;
            rx = noon.rx * (1 - t) + sunset.rx * t;
            ry = noon.ry * (1 - t**2) + sunset.ry * t**2;
        }   
        this.setLightOnSphere(rx, ry);

        //couleur du soleil    
        if (this.ambientLight) {
            const orange = new THREE.Color(0xff4500);
            const white = new THREE.Color(0xffffff);

            // calculer la distance à 0.5
            const d = Math.abs(progress - 0.5) * 2; // d = 1 quand progress = 0 ou 1, d = 0 quand progress = 0.5

            // interpoler
            const color = white.clone().lerp(orange, d**4);
            this.ambientLight.color.set(color);       
        }

        // clignotement de la lumière pour signaler fin du tour
        let x = this.turn_duration - (Date.now() - this.startTime) / 1000;
        const alarmDuration = 5
        const alarmePeriod = 3

        if (x < alarmDuration && x > 0 && this.ambientLight) {
            const intensity = Math.sin(x / alarmDuration * Math.PI * alarmePeriod * 2 + Math.PI/2)  ; 
            // this.ambientLight.intensity = 0.5 + intensity ;
            this.directionalLight.intensity = 4 + intensity*2 ;
        }
        else {
            // this.ambientLight.intensity = 0.5;
            this.directionalLight.intensity = 4;
        }

        if (this.beginningOfAnimation) {
            this.beginningOfAnimation = false;
            this.setShadowUpdateLimited(true, this.turn_duration * 1000 / 12)
        }

        requestAnimationFrame(() => this.animateSun());
    }

    // vertion avec moins de glich mais avec effet tick tic chaque seconde, a optimiser pour ne pas calculer les onbre entre les mouvement
    // animateSun() {
    //     const now = Date.now();
    
    //     // Ne mettre à jour que si au moins 1 seconde s'est écoulée
    //     if (!this.lastSunUpdate || now - this.lastSunUpdate >= 1000) {
    //         this.lastSunUpdate = now;
    
    //         const sunrise = {rx: 90, ry: 10};
    //         const noon = {rx: -45, ry: 45};
    //         const sunset = {rx: -180, ry: 10};
    
    //         const progress = ((now - this.startTime) / this.turn_duration / 1000) % 1; // boucle sur [0,1]
    
    //         let rx, ry;
    //         if (progress <= 0.5) { // matin → midi
    //             const t = progress * 2; // normalisé [0,1]
    //             rx = sunrise.rx * (1 - t) + noon.rx * t;
    //             ry = sunrise.ry * (1 - t) + noon.ry * t;
    //         } else { // midi → nuit
    //             const t = (progress - 0.5) * 2;
    //             rx = noon.rx * (1 - t) + sunset.rx * t;
    //             ry = noon.ry * (1 - t) + sunset.ry * t;
    //         }
    
    //         this.setLightOnSphere(rx, ry);
    //     }
    
    //     requestAnimationFrame(() => this.animateSun());
    // }
    

//     // Présets de position solaire
//     setSunPreset(preset) {
//         const presets = {
//             'sunrise': { rx: 90, ry: 5 },      // Lever du soleil à l'est, bas
//             'morning': { rx: 90, ry: 30 },     // Matin, soleil montant à l'est
//             'noon': { rx: 0, ry: 90 },         // Midi, soleil au zénith
//             'afternoon': { rx: 270, ry: 30 },  // Après-midi, soleil descendant à l'ouest
//             'sunset': { rx: 270, ry: 5 },      // Coucher du soleil à l'ouest, bas
//             'north': { rx: 0, ry: 45 },        // Nord, mi-hauteur
//             'south': { rx: 180, ry: 45 },      // Sud, mi-hauteur
//             'east': { rx: 90, ry: 45 },        // Est, mi-hauteur
//             'west': { rx: 270, ry: 45 }        // Ouest, mi-hauteur
//         };

//         if (presets[preset]) {
//             console.log(`☀️ Preset solaire: ${preset}`);
//             this.setLightOnSphere(presets[preset].rx, presets[preset].ry);
//         } else {
//             console.log(`❌ Preset inconnu. Disponibles: ${Object.keys(presets).join(', ')}`);
//         }
//     }

//     // Afficher l'aide pour setLightOnSphere
//     showLightHelp() {
//         console.log(`
// 🌞 === AIDE POSITIONNEMENT LUMIÈRE SUR SPHÈRE ===

// Usage:
//   shadowManager.setLightOnSphere(rx, ry)

// Paramètres:
//   rx = rotation horizontale (azimuth) en degrés (0-360)
//        0° = Nord (+Z)
//        90° = Est (+X)
//        180° = Sud (-Z)
//        270° = Ouest (-X)

//   ry = élévation verticale en degrés (0-90)
//        0° = horizon (soleil couchant/levant)
//        45° = mi-hauteur
//        90° = zénith (midi, soleil au-dessus)

// Exemples:
//   shadowManager.setLightOnSphere(90, 10)   // Lever du soleil à l'est
//   shadowManager.setLightOnSphere(0, 90)    // Midi, soleil au-dessus
//   shadowManager.setLightOnSphere(270, 10)  // Coucher du soleil à l'ouest

// Présets disponibles:
//   shadowManager.setSunPreset('sunrise')    // Lever du soleil
//   shadowManager.setSunPreset('noon')       // Midi
//   shadowManager.setSunPreset('sunset')     // Coucher du soleil
//   shadowManager.setSunPreset('north')      // Nord
//   shadowManager.setSunPreset('south')      // Sud
//   shadowManager.setSunPreset('east')       // Est
//   shadowManager.setSunPreset('west')       // Ouest

// Infos:
//   shadowManager.getSceneCenter()           // Centre de la scène
//   shadowManager.getSceneSphereRadius()     // Rayon de la sphère
//         `);
//     }

    // Activer ou désactiver le rendu des ombres
    
    setShadowsEnabled(enabled) {
        this.shadowsEnabled = enabled;
        this.renderer.shadowMap.enabled = enabled;
        
        // Désactiver castShadow sur la lumière si désactivé
        this.directionalLight.castShadow = enabled;
        
        console.log(`${enabled ? '✅' : '❌'} Ombres ${enabled ? 'ACTIVÉES' : 'DÉSACTIVÉES'}`);
        console.log(`   Performance: ${enabled ? 'Normale' : 'Optimisée (pas d\'ombres)'}`);
    }

    // Basculer l'état des ombres (toggle)
    toggleShadows() {
        this.setShadowsEnabled(!this.shadowsEnabled);
    }

    // Obtenir l'état actuel des ombres
    getShadowsEnabled() {
        console.log(`${this.shadowsEnabled ? '✅' : '❌'} Ombres: ${this.shadowsEnabled ? 'ACTIVÉES' : 'DÉSACTIVÉES'}`);
        return this.shadowsEnabled;
    }

    // Activer/désactiver la limitation du taux de calcul des ombres
    setShadowUpdateLimited(enabled, intervalMs = 1000) {
        this.shadowUpdateLimited = enabled;
        this.shadowUpdateInterval = Math.max(16, intervalMs); // Minimum 16ms (60 FPS)
        
        if (enabled) {
            // Désactiver l'auto-update pour gérer manuellement
            this.renderer.shadowMap.autoUpdate = false;
            this.lastShadowUpdate = 0; // Forcer une mise à jour immédiate
            console.log(`⏱️ Limitation du calcul des ombres ACTIVÉE`);
            console.log(`   → Mise à jour toutes les ${intervalMs}ms (${(1000/intervalMs).toFixed(1)} fois/seconde)`);
            console.log(`   → Gain de performance: Allègement GPU`);
        } else {
            // Réactiver l'auto-update
            this.renderer.shadowMap.autoUpdate = true;
            console.log(`⏱️ Limitation du calcul des ombres DÉSACTIVÉE`);
            console.log(`   → Mise à jour à chaque frame (performance GPU normale)`);
        }
    }

    // Basculer la limitation (toggle)
    toggleShadowUpdateLimited() {
        this.setShadowUpdateLimited(!this.shadowUpdateLimited, this.shadowUpdateInterval);
    }

    // Obtenir l'état de la limitation
    getShadowUpdateLimited() {
        if (this.shadowUpdateLimited) {
            console.log(`⏱️ Limitation: ACTIVÉE (${this.shadowUpdateInterval}ms)`);
        } else {
            console.log(`⏱️ Limitation: DÉSACTIVÉE (auto-update)`);
        }
        return this.shadowUpdateLimited;
    }

    // Méthode appelée dans la boucle animate() pour gérer la mise à jour des ombres
    update(currentTime) {
        // Si la limitation est désactivée, ne rien faire (autoUpdate = true)
        if (!this.shadowUpdateLimited) {
            return;
        }

        // Vérifier si assez de temps s'est écoulé depuis la dernière mise à jour
        const elapsed = currentTime - this.lastShadowUpdate;
        
        if (elapsed >= this.shadowUpdateInterval) {
            // Forcer la mise à jour des ombres
            this.renderer.shadowMap.needsUpdate = true;
            this.lastShadowUpdate = currentTime;
        }
    }

    // Ajuster la zone de projection des ombres (shadowSize)
    // setShadowSize(size) {
    //     this.directionalLight.shadow.camera.left = -size;
    //     this.directionalLight.shadow.camera.right = size;
    //     this.directionalLight.shadow.camera.top = size;
    //     this.directionalLight.shadow.camera.bottom = -size;
    //     this.directionalLight.shadow.camera.updateProjectionMatrix();
    //     console.log(`📐 Taille zone ombres changée: ${size}`);
    // }

    // Ajuster le bias des ombres
    // setShadowBias(bias, normalBias = null) {
    //     this.directionalLight.shadow.bias = bias;
    //     if (normalBias !== null) {
    //         this.directionalLight.shadow.normalBias = normalBias;
    //     }
    //     console.log(`🎚️ Bias ombres changé: ${bias}, normalBias: ${this.directionalLight.shadow.normalBias}`);
    // }

    // Afficher les paramètres actuels des ombres
    // getShadowSettings() {
    //     const settings = {
    //         mapSize: {
    //             width: this.directionalLight.shadow.mapSize.width,
    //             height: this.directionalLight.shadow.mapSize.height
    //         },
    //         shadowSize: this.directionalLight.shadow.camera.right,
    //         bias: this.directionalLight.shadow.bias,
    //         normalBias: this.directionalLight.shadow.normalBias,
    //         lightPosition: this.directionalLight.position,
    //         shadowCamera: {
    //             left: this.directionalLight.shadow.camera.left,
    //             right: this.directionalLight.shadow.camera.right,
    //             top: this.directionalLight.shadow.camera.top,
    //             bottom: this.directionalLight.shadow.camera.bottom,
    //             near: this.directionalLight.shadow.camera.near,
    //             far: this.directionalLight.shadow.camera.far
    //         }
    //     };
    //     console.log('⚙️ Paramètres des ombres:', settings);
    //     return settings;
    // }

    // Calculer les 4 points d'intersection entre le frustum de la caméra et le plan y=0
    getCameraFrustumGroundPoints(silent = true) {
        if (!this.camera) {
            if (!silent) console.log('❌ Caméra non définie');
            return null;
        }

        const raycaster = new THREE.Raycaster();
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Plan y=0
        const points = [];

        // Les 4 coins de l'écran en coordonnées NDC (Normalized Device Coordinates)
        const corners = [
            new THREE.Vector2(-1, -1), // Bas gauche
            new THREE.Vector2(1, -1),  // Bas droite
            new THREE.Vector2(1, 1),   // Haut droite
            new THREE.Vector2(-1, 1)   // Haut gauche
        ];

        corners.forEach((corner, index) => {
            raycaster.setFromCamera(corner, this.camera);
            const intersectionPoint = new THREE.Vector3();
            
            if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
                points.push(intersectionPoint);
            } else {
                // Si pas d'intersection, utiliser un point lointain dans la direction du rayon
                if (!silent) {
                    console.log("❌ Pas d'intersection, utiliser un point lointain dans la direction du rayon");
                }
                const farPoint = raycaster.ray.origin.clone().add(
                    raycaster.ray.direction.clone().multiplyScalar(100)
                );
                points.push(farPoint);
            }
        });

        if (!silent) {
            console.log('🎯 Points du frustum calculés:', points.map(p => 
                `(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`
            ));
        }

        return points;
    }

    // Optimiser la shadow box en fonction de ce que voit la caméra
    optimizeShadowBox(margin = 2, silent = true) {
        if (!this.camera) {
            if (!silent) console.log('❌ Caméra non définie');
            return false;
        }

        // 1. Obtenir les 4 points du frustum sur le plan y=0
        const groundPoints = this.getCameraFrustumGroundPoints(silent);
        if (!groundPoints || groundPoints.length === 0) {
            if (!silent) console.log('❌ Impossible de calculer les points du frustum');
            return false;
        }

        // 2. Mettre à jour la matrice monde de la shadow camera pour avoir la bonne matrice inverse
        this.directionalLight.shadow.camera.updateMatrixWorld(true);
        const lightViewMatrix = this.directionalLight.shadow.camera.matrixWorldInverse;

        // 3. Transformer les points dans le repère de la lumière
        const transformedPoints = groundPoints.map(point => {
            const p = point.clone();
            p.applyMatrix4(lightViewMatrix);
            return p;
        });

        if (!silent) {
            console.log('💡 Points transformés dans le repère lumière:', transformedPoints.map(p => 
                `(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`
            ));
        }

        // 4. Calculer la boîte englobante (AABB) dans le repère de la lumière
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        transformedPoints.forEach(p => {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
            minZ = Math.min(minZ, p.z);
            maxZ = Math.max(maxZ, p.z);
        });

        // 5. Ajouter une marge de sécurité pour inclure les objets en hauteur
        minX -= margin;
        maxX += margin;
        minY -= margin;
        maxY += margin;
        minZ -= margin;
        maxZ += margin;

        // 6. Appliquer les valeurs à la shadow camera
        this.directionalLight.shadow.camera.left = minX;
        this.directionalLight.shadow.camera.right = maxX;
        this.directionalLight.shadow.camera.top = maxY;
        this.directionalLight.shadow.camera.bottom = minY;
        this.directionalLight.shadow.camera.near = -maxZ; // Inversé car on regarde dans -Z
        this.directionalLight.shadow.camera.far = -minZ;

        // 7. Mettre à jour la matrice de projection
        this.directionalLight.shadow.camera.updateProjectionMatrix();

        if (!silent) {
            console.log('📦 Shadow box optimisée:');
            console.log(`   Left: ${minX.toFixed(2)}, Right: ${maxX.toFixed(2)}`);
            console.log(`   Bottom: ${minY.toFixed(2)}, Top: ${maxY.toFixed(2)}`);
            console.log(`   Near: ${(-maxZ).toFixed(2)}, Far: ${(-minZ).toFixed(2)}`);
        }

        return true;
    }

    // Version automatique qui s'exécute à chaque frame (à appeler dans la boucle d'animation)
    updateShadowBoxAuto() {
        this.optimizeShadowBox();
    }

    // Obtenir les coordonnées de la caméra
    getCameraPosition() {
        if (!this.camera) {
            console.log('❌ Caméra non définie');
            return null;
        }
        const pos = this.camera.position;
        const rot = this.camera.rotation;
        console.log(`📷 Position caméra: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
        console.log(`📷 Rotation caméra: (${THREE.MathUtils.radToDeg(rot.x).toFixed(2)}°, ${THREE.MathUtils.radToDeg(rot.y).toFixed(2)}°, ${THREE.MathUtils.radToDeg(rot.z).toFixed(2)}°)`);
        return { position: pos, rotation: rot };
    }

    // Trouver toutes les tiles eau
    findWaterTiles() {
        if (!this.workplane) {
            console.log('❌ Workplane non défini');
            return [];
        }

        const waterTiles = [];
        this.workplane.traverse((child) => {
            if (child.userData && child.userData.tileType === 'eau') {
                waterTiles.push(child);
            }
        });

        return waterTiles;
    }

    // // Obtenir la tile eau la plus à gauche (x minimum)
    // getLeftmostWaterTile() {
    //     const waterTiles = this.findWaterTiles();
        
    //     if (waterTiles.length === 0) {
    //         console.log('❌ Aucune tile eau trouvée');
    //         return null;
    //     }

    //     let leftmost = waterTiles[0];
    //     const leftmostWorldPos = new THREE.Vector3();
    //     leftmost.getWorldPosition(leftmostWorldPos);
    //     let minX = leftmostWorldPos.x;

    //     waterTiles.forEach(tile => {
    //         const worldPos = new THREE.Vector3();
    //         tile.getWorldPosition(worldPos);
    //         if (worldPos.x < minX) {
    //             minX = worldPos.x;
    //             leftmost = tile;
    //             leftmostWorldPos.copy(worldPos);
    //         }
    //     });

    //     return leftmost;
    // }

    // // Obtenir la tile eau la plus à droite (x maximum)
    // getRightmostWaterTile() {
    //     const waterTiles = this.findWaterTiles();
        
    //     if (waterTiles.length === 0) {
    //         console.log('❌ Aucune tile eau trouvée');
    //         return null;
    //     }

    //     let rightmost = waterTiles[0];
    //     const rightmostWorldPos = new THREE.Vector3();
    //     rightmost.getWorldPosition(rightmostWorldPos);
    //     let maxX = rightmostWorldPos.x;

    //     waterTiles.forEach(tile => {
    //         const worldPos = new THREE.Vector3();
    //         tile.getWorldPosition(worldPos);
    //         if (worldPos.x > maxX) {
    //             maxX = worldPos.x;
    //             rightmost = tile;
    //             rightmostWorldPos.copy(worldPos);
    //         }
    //     });

    //     return rightmost;
    // }

    // // Obtenir la tile eau la plus au fond (z minimum)
    // getBackmostWaterTile() {
    //     const waterTiles = this.findWaterTiles();
        
    //     if (waterTiles.length === 0) {
    //         console.log('❌ Aucune tile eau trouvée');
    //         return null;
    //     }

    //     let backmost = waterTiles[0];
    //     const backmostWorldPos = new THREE.Vector3();
    //     backmost.getWorldPosition(backmostWorldPos);
    //     let minZ = backmostWorldPos.z;

    //     waterTiles.forEach(tile => {
    //         const worldPos = new THREE.Vector3();
    //         tile.getWorldPosition(worldPos);
    //         if (worldPos.z < minZ) {
    //             minZ = worldPos.z;
    //             backmost = tile;
    //             backmostWorldPos.copy(worldPos);
    //         }
    //     });

    //     console.log(`🔼 Tile eau la plus au fond: (${backmostWorldPos.x.toFixed(2)}, ${backmostWorldPos.y.toFixed(2)}, ${backmostWorldPos.z.toFixed(2)})`);
    //     return backmost;
    // }

    // // Obtenir la tile eau la plus vers l'avant (z maximum)
    // getFrontmostWaterTile() {
    //     const waterTiles = this.findWaterTiles();
        
    //     if (waterTiles.length === 0) {
    //         console.log('❌ Aucune tile eau trouvée');
    //         return null;
    //     }

    //     let frontmost = waterTiles[0];
    //     const frontmostWorldPos = new THREE.Vector3();
    //     frontmost.getWorldPosition(frontmostWorldPos);
    //     let maxZ = frontmostWorldPos.z;

    //     waterTiles.forEach(tile => {
    //         const worldPos = new THREE.Vector3();
    //         tile.getWorldPosition(worldPos);
    //         if (worldPos.z > maxZ) {
    //             maxZ = worldPos.z;
    //             frontmost = tile;
    //             frontmostWorldPos.copy(worldPos);
    //         }
    //     });

    //     console.log(`🔽 Tile eau la plus vers l'avant: (${frontmostWorldPos.x.toFixed(2)}, ${frontmostWorldPos.y.toFixed(2)}, ${frontmostWorldPos.z.toFixed(2)})`);
    //     return frontmost;
    // }
}

export function createShadowManager(renderer, directionalLight, camera = null, workplane = null) {
    return new ShadowManager(renderer, directionalLight, camera, workplane);
}

// window.ShadowManager = ShadowManager;