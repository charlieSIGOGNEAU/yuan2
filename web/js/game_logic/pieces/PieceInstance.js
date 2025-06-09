export class PieceInstance {
    /**
     * @param {object} pieceType - Instance de Tile ou PieceJoueur
     * @param {object} position - {x, y, z}
     * @param {object} rotation - {x, y, z}
     */
    constructor(pieceType, position = {x:0, y:0, z:0}, rotation = {x:0, y:0, z:0}) {
        this.pieceType = pieceType; // référence partagée
        this.position = position;
        this.rotation = rotation;
        // Ici tu peux créer le sprite à partir du type si besoin
    }
}
