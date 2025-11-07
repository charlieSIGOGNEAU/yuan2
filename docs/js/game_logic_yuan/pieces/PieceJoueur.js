export class PieceJoueur {
    /**
     * @param {string} textureUrl - URL du sprite/texture
     * @param {number} width
     * @param {number} height
     */
    constructor(textureUrl, width, height) {
        this.textureUrl = textureUrl;
        this.width = width;
        this.height = height;
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        // Ici tu peux charger le sprite/texture si besoin
    }
}
