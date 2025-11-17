import * as THREE from 'three';

export class templeTax {
    constructor(sourceTerritory, payingClan, targetTerritory, receivingClan, amount = 0) {
        this.sourceTerritory = sourceTerritory;
        this.payingClan = payingClan;
        this.targetTerritory = targetTerritory;
        this.receivingClan = receivingClan;
        this.amount = amount;
    }

    delete() {
        // Nettoyer les références
        this.sourceTerritory = null;
        this.payingClan = null;
        this.targetTerritory = null;
        this.receivingClan = null;
        this.amount = 0;
    }
}

export class renderTax {
    constructor(sourceTerritory, targetTerritory, amount, gameBoard) {
        this.sourceTerritory = sourceTerritory;
        this.targetTerritory = targetTerritory;
        this.amount = amount;
        this.gameBoard = gameBoard;
        
        this.sprite = null;
        this.animationId = null;
        this.isAnimating = false;
        
        // Positions pour l'animation
        this.startPosition = this.sourceTerritory.getCartesianPosition(gameBoard);
        this.endPosition = this.targetTerritory.getCartesianPosition(gameBoard);
        
        // Paramètres de l'animation
        this.pauseStart = 0; // Pause au début (ms)
        this.moveDuration = 1000; // Durée du mouvement (ms)
        this.pauseEnd = 300; // Pause à la fin (ms)
        this.fadeDuration = 300; // Durée du fondu de disparition (ms)
        this.totalCycleDuration = this.pauseStart + this.moveDuration + this.pauseEnd + this.fadeDuration;
        this.animationStartTime = 0;
        
        this.init();
    }
    
    async init() {
        await this.createSprite();
        this.startAnimation();
    }
    
    async createSprite() {
        // Déterminer le type de sprite selon le montant
        const spriteType = this.amount === 1 ? 'tax1Chao' : 'tax2Chao';
        
        // Utiliser le MeepleManager pour créer le sprite
        this.sprite = await this.gameBoard.meepleManager.createSpriteInstance(
            spriteType,
            {
                x: this.startPosition.x,
                y: 0.3,
                z: this.startPosition.z
            },
            null, // Pas de couleur spécifique
            { taxAnimation: true } // userData pour identification
        );
        
        if (!this.sprite) {
            console.error('❌ Impossible de créer le sprite de taxe');
            return;
        }
        
        // Ajuster le matériau pour permettre le fondu de transparence
        if (this.sprite.material) {
            this.sprite.material.alphaTest = 0.01; // Réduire l'alphaTest pour permettre le fondu
            this.sprite.material.transparent = true; // S'assurer que la transparence est activée
            this.sprite.material.opacity = 1.0; // Opacité initiale
        }
        
        // Ajouter le sprite au workplane
        this.gameBoard.workplane.add(this.sprite);
        
        console.log(`💰 Sprite de taxe créé (montant: ${this.amount}) de (${this.startPosition.x}, ${this.startPosition.z}) vers (${this.endPosition.x}, ${this.endPosition.z})`);
    }
    
    // Cette méthode n'est plus nécessaire car le sprite est ajouté directement au workplane
    // Gardée pour compatibilité
    addToScene(scene) {
        console.log('💰 Sprite de taxe déjà ajouté au workplane');
    }
    
    startAnimation() {
        if (!this.sprite) return;
        
        this.isAnimating = true;
        this.animationStartTime = Date.now();
        this.animate();
    }
    
    animate() {
        if (!this.isAnimating || !this.sprite) return;
        
        const currentTime = Date.now();
        const elapsed = currentTime - this.animationStartTime;
        const cycleTime = elapsed % this.totalCycleDuration;
        
        if (cycleTime < this.pauseStart) {
            // Phase 1: Pause au début
            this.sprite.position.x = this.startPosition.x;
            this.sprite.position.z = this.startPosition.z;
            this.sprite.material.opacity = 1.0;
            
        } else if (cycleTime < this.pauseStart + this.moveDuration) {
            // Phase 2: Mouvement
            const moveElapsed = cycleTime - this.pauseStart;
            const moveProgress = moveElapsed / this.moveDuration;
            const t = this.easeInOutCubic(moveProgress);
            
            // Arrêter à 3/4 du trajet (70% de la distance)
            const targetT = t * 0.70;
            this.sprite.position.x = this.startPosition.x + (this.endPosition.x - this.startPosition.x) * targetT;
            this.sprite.position.z = this.startPosition.z + (this.endPosition.z - this.startPosition.z) * targetT;
            this.sprite.material.opacity = 1.0;
            
        } else if (cycleTime < this.pauseStart + this.moveDuration + this.fadeDuration) {
            // Phase 3: Fondu de disparition
            const fadeElapsed = cycleTime - this.pauseStart - this.moveDuration;
            const fadeProgress = fadeElapsed / this.fadeDuration;
            
            // Position à 3/4 du trajet pour le fondu
            const threeFourthsX = this.startPosition.x + (this.endPosition.x - this.startPosition.x) * 0.70;
            const threeFourthsZ = this.startPosition.z + (this.endPosition.z - this.startPosition.z) * 0.70;
            this.sprite.position.x = threeFourthsX;
            this.sprite.position.z = threeFourthsZ;
            
            const newOpacity = 1.0 - this.easeInQuad(fadeProgress);
            this.sprite.material.opacity = Math.max(0.0, newOpacity);
            
        } else {
            // Phase 4: Pause à la fin (invisible)
            const threeFourthsX = this.startPosition.x + (this.endPosition.x - this.startPosition.x) * 0.70;
            const threeFourthsZ = this.startPosition.z + (this.endPosition.z - this.startPosition.z) * 0.70;
            this.sprite.position.x = threeFourthsX;
            this.sprite.position.z = threeFourthsZ;
            this.sprite.material.opacity = 0.0;
            
            // Vérifier si c'est la fin du cycle pour redémarrer
            const pauseEndElapsed = cycleTime - this.pauseStart - this.moveDuration - this.fadeDuration;
            if (pauseEndElapsed >= this.pauseEnd) {
                this.animationStartTime = currentTime;
            }
        }
        
        // Le sprite doit toujours faire face à la caméra
        if (this.gameBoard && this.gameBoard.camera) {
            this.sprite.lookAt(this.gameBoard.camera.position);
        }
        
        // Continuer l'animation
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    // Fonctions d'easing pour des animations plus fluides
    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }
    
    // Easing cubique pour un mouvement plus naturel
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    // Easing quadratique pour le fondu
    easeInQuad(t) {
        return t * t;
    }
    
    delete() {
        console.log('💰 Suppression de l\'animation de taxe');
        
        // Arrêter l'animation
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Supprimer le sprite du workplane
        if (this.sprite && this.gameBoard) {
            this.gameBoard.workplane.remove(this.sprite);
            
            // Libérer la mémoire
            if (this.sprite.geometry) {
                this.sprite.geometry.dispose();
            }
            if (this.sprite.material) {
                if (this.sprite.material.map) {
                    this.sprite.material.map.dispose();
                }
                this.sprite.material.dispose();
            }
        }
        
        // Nettoyer les références
        this.sprite = null;
        this.gameBoard = null;
        this.sourceTerritory = null;
        this.targetTerritory = null;
        
        console.log('✅ Animation de taxe supprimée et mémoire libérée');
    }
}
// pour debug
// export default renderTax;