export class PlayerSelectionUI {
    constructor() {
        this.currentPlayer = 1;
        this.buttons = [
            document.getElementById('player1-btn'),
            document.getElementById('player2-btn'),
            document.getElementById('player3-btn')
        ];
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.buttons.forEach((btn, idx) => {
            btn.addEventListener('mousedown', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                e.target.style.userSelect = 'none';
                
                e.target.blur();
                
                await this.selectPlayer(idx + 1);
                return false;
            }, true);

            ['mouseup', 'click', 'dblclick'].forEach(eventType => {
                btn.addEventListener(eventType, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    return false;
                }, true);
            });
        });
    }

    async selectPlayer(playerNumber) {
        this.currentPlayer = playerNumber;
        this.buttons.forEach((btn, idx) => {
            if (idx + 1 === playerNumber) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const event = new CustomEvent('playerSelected', { 
            detail: { playerNumber } 
        });
        document.dispatchEvent(event);

        if (playerNumber === 1) {
            try {
                const response = await fetch('http://localhost:3000/api/users/2', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'same-origin'
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log('Nom du joueur 1:', data.name);
            } catch (error) {
                console.error('Erreur lors de la récupération du joueur:', error);
            }
        }
    }

    getCurrentPlayer() {
        return this.currentPlayer;
    }
} 