// attention dans un repere exagonal r, c'est en bas a gauche et q a droite. a modifier lor de la pose des tuiles

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class GameBoard3D {
    constructor(containerId) {
        console.log('GameBoard3D constructor');
        this.container = document.getElementById(containerId);
        // Désactiver les comportements tactiles par défaut
        this.container.style.touchAction = 'none';
        
        this.instances = []; // Stocke les instances de pièces
        this.circles = []; // Stocke les cercles créés
        this.tiles = []; // Stocke les tuiles créées
        this.animations = []; // Stocke les animations en cours
        this.isDragging = false;
        this.dragStart = null;
        this.workplaneStartPosition = null;
        this.activePointerId = null; // Pour suivre le doigt actif
        this.clickStartPosition = null; // Pour détecter les clics
        this.clickStartTime = null; // Pour mesurer la durée du clic
        this.tempTile = null;
        this.tempTileRotation = null;
        this.tempTilePosition = null;
        this.tempTileSprites = null;
        this.tileTemp = null;
        this.gltfLoader = new GLTFLoader(); // Ajouter le loader GLB
        
        // Écouteur pour l'événement circleClicked
        this.container.addEventListener('circleClicked', (event) => {
            if (this.tempTile) {
                this.moveTileTemp(event.detail.position);
            }
        });

        this.init();
    }
    
    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 9, 6);
        this.camera.rotation.set(THREE.MathUtils.degToRad(-60), 0, 0);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace; 
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);
        
        // Ajout d'éclairage pour les modèles 3D
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Lumière ambiante
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        console.log('💡 Éclairage ajouté à la scène');
        
        this.workplane = new THREE.Group();
        this.scene.add(this.workplane);
        this.setupEvents();
        this.animate();
    }

    createCircle(position = {q: 0, r: 0}) {
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('./images/cercle.webp');
        const geometry = new THREE.PlaneGeometry(1.8, 1.8);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const circle = new THREE.Mesh(geometry, material);
        const pos = this.#hexToCartesian(position);
        circle.position.set(pos.x, pos.y, pos.z);
        circle.rotation.x = -Math.PI / 2; // Pour le mettre à plat sur le plan
        
        // Stockage de la position d'origine
        circle.userData = {
            position: position
        };
        
        // Initialisation de l'échelle à 0
        circle.scale.set(0, 0, 0);
        
        // Ajout de l'animation
        const animation = {
            object: circle,
            startTime: performance.now(),
            duration: 500, // milliseconde
            from: { scale: 0 },
            to: { scale: 1 }
        };
        this.animations.push(animation);
        
        this.workplane.add(circle);
        this.circles.push(circle);
        return circle;
    }

    setupEvents() {
        // Gestionnaire d'événements pointer (fonctionne pour souris et tactile)
        this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
        this.container.addEventListener('pointermove', this.onPointerMove.bind(this));
        this.container.addEventListener('pointerup', this.onPointerUp.bind(this));
        this.container.addEventListener('pointercancel', this.onPointerUp.bind(this));
        window.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        window.addEventListener('resize', this.onResize.bind(this));
    }
    //q correspond à un déplacement vers la droite. r correspond à un déplacement en diagonale en haut a droites.
    #hexToCartesian (position = {q: 0, r: 0, z: 0}) {
        return {x: position.q+position.r/2, y: position.z || 0, z: -position.r/2*Math.sqrt(3)};
    }
    // Méthode pour ajouter une tuile
    addTile(modelUrl, position = { q: 0, r: 0, z: 0}, rotation = 0, size = 3) {
        console.log(`🔄 Chargement du modèle: ${modelUrl} à la position:`, position);
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                modelUrl,
                (gltf) => {
                    console.log(`✅ Modèle chargé avec succès: ${modelUrl}`, gltf);
                    const tile = gltf.scene;
        const pos = this.#hexToCartesian(position);
        tile.position.set(pos.x, pos.y, pos.z);
                    tile.rotation.y = rotation * Math.PI / 3; // Rotation sur l'axe Y pour les modèles 3D
                    // Les modèles sont déjà à la bonne taille (3 unités)
                    console.log(`📍 Position calculée:`, pos, `Rotation: ${rotation}`);
        this.workplane.add(tile);
        this.tiles.push(tile); // Stocke la référence de la tuile
                    console.log(`🎯 Tuile ajoutée au workplane. Total tuiles:`, this.tiles.length);
                    resolve(tile);
                },
                (progress) => {
                    console.log(`📊 Progression du chargement: ${modelUrl}`, progress);
                },
                (error) => {
                    console.error(`❌ Erreur lors du chargement du modèle ${modelUrl}:`, error);
                    reject(error);
                }
            );
        });
    }

    addTileTemp(modelUrl, position = { q: 0, r: 0}, rotation = 0) {
        console.log(`🔄 Chargement de la tuile temporaire: ${modelUrl} à la position:`, position);
        this.tempTilePosition = position;
        this.tempTileRotation = rotation;
        
        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                modelUrl,
                (gltf) => {
                    console.log(`✅ Tuile temporaire chargée avec succès: ${modelUrl}`, gltf);
                    const tile = gltf.scene;
        const pos = this.#hexToCartesian(position);
        tile.position.set(pos.x, 0.1, pos.z); // Hauteur fixée à 0.1
                    tile.rotation.y = rotation * Math.PI / 3; // Rotation sur l'axe Y pour les modèles 3D
                    // Le modèle est déjà à la bonne taille
                    console.log(`📍 Position tuile temporaire:`, pos, `Rotation: ${rotation}`);
        this.workplane.add(tile);
        this.tileTemp = tile;

                    // Création des sprites rotation et OK (restent en 2D pour l'interface)
                    const textureLoader = new THREE.TextureLoader();
        const spriteGeometry = new THREE.PlaneGeometry(1, 1);
        const rotationTexture = textureLoader.load('./images/rotation.webp');

        // Premier sprite rotation à droite
        const rightSprite = new THREE.Mesh(spriteGeometry, new THREE.MeshBasicMaterial({
            map: rotationTexture,
            alphaTest: 0.5,
        }));
                    rightSprite.position.set(pos.x + 1.5, 0.2, pos.z); // Position relative à la tuile principale
        rightSprite.rotation.x = -Math.PI / 2;
        rightSprite.rotation.z = 0;
        this.workplane.add(rightSprite);
        this.tiles.push(rightSprite);

        // Deuxième sprite rotation à gauche (avec symétrie verticale)
        const leftSprite = new THREE.Mesh(spriteGeometry, new THREE.MeshBasicMaterial({
            map: rotationTexture,
            alphaTest: 0.5,
        }));
                    leftSprite.position.set(pos.x - 1.5, 0.2, pos.z); // Position relative à la tuile principale
        leftSprite.rotation.x = -Math.PI / 2;
        leftSprite.rotation.z = 0;
        leftSprite.scale.x = -1; // Symétrie verticale
        this.workplane.add(leftSprite);
        this.tiles.push(leftSprite);

        // Sprite OK
        const okTexture = textureLoader.load('./images/buttonOk.webp');
        const okSprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: okTexture,
            transparent: true,
            alphaTest: 0.5
        }));
        okSprite.position.set(pos.x + 1, 0.4, pos.z - 1); // Position relative à la tuile principale
        okSprite.scale.set(1, 1, 1); // Taille du sprite
        this.workplane.add(okSprite);
        this.tiles.push(okSprite);

        // Stocker les références aux sprites
        this.tempTile = tile;
        this.tempTileRotation = rotation;
        this.tempTileSprites = [leftSprite, rightSprite, okSprite];

                    console.log(`🎯 Tuile temporaire et sprites créés avec succès !`);
                    resolve(tile);
                },
                (progress) => {
                    // Optionnel: callback de progression
                },
                (error) => {
                    console.error('Erreur lors du chargement du modèle temporaire:', error);
                    reject(error);
                }
            );
        });
    }

    // Nouvelle méthode pour déplacer la tuile temporaire
    moveTileTemp(position = { q: 0, r: 0 }) {
        if (this.tempTile) {
            this.tempTilePosition = position;
            console.log(this.tempTilePosition);
            const pos = this.#hexToCartesian(position);
            
            // Déplacer la tuile principale
            this.tempTile.position.set(pos.x, 0.1, pos.z);
            
            // Déplacer les sprites de rotation et le bouton OK
            if (this.tempTileSprites) {
                this.tempTileSprites[0].position.set(pos.x - 0.5, 0.2, pos.z); // Sprite rotation gauche
                this.tempTileSprites[1].position.set(pos.x + 0.5, 0.2, pos.z); // Sprite rotation droit
                this.tempTileSprites[2].position.set(pos.x + 1, 0.4, pos.z - 1); // Bouton OK
            }
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

        // Stocker la position et le temps de départ pour détecter les clics
        this.clickStartPosition = {
            x: e.clientX,
            y: e.clientY
        };
        this.clickStartTime = performance.now();

        // Si on a cliqué sur un objet interactif (à implémenter plus tard)
        if (result.object) {
            this.handleObjectClick(result.object);
            return;
        }

        // Sinon, on commence le glisser-déposer
        this.isDragging = true;
        this.activePointerId = e.pointerId;
        this.dragStart = result.point;
        this.workplaneStartPosition = this.workplane.position.clone();
        
        // Capturer les événements pointer
        this.container.setPointerCapture(e.pointerId);
    }

    onPointerMove(e) {
        // Ne traiter que les événements du pointer actif
        if (!this.isDragging || e.pointerId !== this.activePointerId) return;

        const result = this.getMouseWorld(e);
        if (!result.point) return;

        const delta = new THREE.Vector3().subVectors(this.dragStart, result.point);
        this.workplane.position.copy(this.workplaneStartPosition.clone().sub(delta));
    }

    onPointerUp(e) {
        // Ne traiter que les événements du pointer actif
        if (e.pointerId !== this.activePointerId) return;

        // Vérifier si c'était un clic (peu de déplacement et durée courte)
        if (this.clickStartPosition && this.clickStartTime) {
            const dx = Math.abs(e.clientX - this.clickStartPosition.x);
            const dy = Math.abs(e.clientY - this.clickStartPosition.y);
            const maxDistance = Math.max(dx, dy); // On prend la plus grande distance
            const duration = performance.now() - this.clickStartTime;
            
            // Si le déplacement est inférieur à 5 pixels ET la durée est inférieure à 500ms
            if (maxDistance < 5 && duration < 1000) {
                const result = this.getMouseWorld(e);
                if (result.rotationSprite) {
                    this.handleRotationSpriteClick(result.rotationSprite);
                } else if (result.circle) {
                    this.handleCircleClick(result.circle);
                } else if (result.instance) {
                    this.handleObjectClick(result.instance);
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
        console.log('Objet cliqué:', object);
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
            console.log('Sprite de rotation gauche cliqué');
            this.tempTileRotation += 1;
        } else if (sprite === this.tempTileSprites[1]) {
            console.log('Sprite de rotation droite cliqué');
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
        console.log(this.tempTileRotation);
        // Appelle l'animation au lieu de changer directement la rotation
        this.animateTileTempRotation(this.tempTileRotation * Math.PI / 3);
    }

    onWheel(e) {
        e.preventDefault();
        
        const result = this.getMouseWorld(e);
        if (!result.point) return;
        
        const scaleFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const mousePoint = result.point;
        
        const pointToWorkplaneDelta = new THREE.Vector3().subVectors(mousePoint, this.workplane.position);
        
        this.workplane.scale.multiplyScalar(scaleFactor);
        
        this.workplane.position.add(
            pointToWorkplaneDelta.multiplyScalar(1 - scaleFactor)
        );
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
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

    // Méthode pour ajouter une instance
    // addInstance(instance) {
    //     if (!instance.mesh) {
    //         instance.createMesh();
    //     }
        
    //     this.instances.push(instance);
    //     this.workplane.add(instance.mesh);
    //     return instance;
    // }

    // Méthode pour supprimer une instance
    // removeInstance(instance) {
    //     const index = this.instances.indexOf(instance);
    //     if (index !== -1) {
    //         this.instances.splice(index, 1);
    //         this.workplane.remove(instance.mesh);
    //     }
    // }

    removeTempTile() {
        // Supprimer la tuile temporaire (modèle 3D)
        if (this.tileTemp) {
            this.workplane.remove(this.tileTemp);
            // Pour les modèles GLB, il faut parcourir tous les enfants pour disposer des ressources
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
} 