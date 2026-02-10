# Implémentation WebSockets avec Laravel Reverb (Custom Implementation)

Ce document récapitule la mise en place d'une architecture WebSocket temps réel entre une API Laravel (stateless avec JWT) et un client JS natif (sans Laravel Echo).

## 1. Installation & Serveur (Backend)

Laravel utilise **Reverb** comme serveur WebSocket compatible Pusher.
- **Démarrage** : `php artisan reverb:start` (doit tourner en parallèle de l'API).
- **Configuration (.env)** : Définir les clés `REVERB_APP_KEY`, `REVERB_HOST`, `REVERB_PORT`, etc.

## 2. Configuration des Routes et de l'Authentification

Pour supporter une API Stateless avec JWT (et non des sessions cookies), la configuration standard doit être adaptée.

### A. Routes de Broadcasting (`routes/api.php`)
Il est crucial d'enregistrer les routes de broadcasting dans `api.php` pour qu'elles utilisent le middleware `auth:api` et soient préfixées par `/api/`. Cela évite l'erreur 500 liée à l'absence de table `sessions`.

```php
// En haut du fichier APILaravel/routes/api.php
use Illuminate\Support\Facades\Broadcast;

Broadcast::routes(['middleware' => ['auth:api']]);
```

### B. Canaux Privés (`routes/channels.php`)
Définir les règles d'accès en spécifiant `['guards' => ['api']]`.

```php
Broadcast::channel('user_{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
}, ['guards' => ['api']]);
```

### C. CORS (`config/cors.php`)
Autoriser explicitement la route d'auth et les credentials.

```php
'paths' => ['api/*', 'broadcasting/auth', ...],
'supports_credentials' => true,
```

## 3. Déclenchement d'un Événement (Backend)

L'événement doit implémenter `ShouldBroadcast` (ou `ShouldBroadcastNow` pour éviter la queue en dev).

```php
// APILaravel/app/Events/UserBroadcast.php
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

class UserBroadcast implements ShouldBroadcastNow
{
    public function broadcastOn(): PrivateChannel {
        return new PrivateChannel('user_' . $this->userId);
    }
    
    public function broadcastAs(): string {
        return 'message'; // Nom de l'événement reçu par le JS
    }
}
```

## 4. Client WebSocket (Frontend JS Natif)

Contrairement à l'exemple standard Laravel Echo, nous utilisons ici une **implémentation native WebSocket** qui gère la compatibilité Rails/Laravel.

### URL de Connexion
Pour Reverb (protocole Pusher), l'URL de connexion ne doit **pas** contenir le token, mais les paramètres de protocole.

```javascript
// URL Laravel Reverb
wsUrl = `${ServerConfig.WS_URL}?protocol=7&client=js&version=8.4.0&flash=false`;
```

### Authentification Manuelle (Handshake)
Le flux d'authentification pour un canal privé (`private-user_{id}`) se fait en 3 étapes manuelles :

1.  **Connexion** : Se connecter au WebSocket et attendre l'événement `pusher:connection_established`.
2.  **Signature** : Récupérer le `socket_id` de l'événement, puis appeler l'API d'auth :
    *   **URL** : `/api/broadcasting/auth`
    *   **Payload** : `{ socket_id, channel_name }`
    *   **Headers** : `Authorization: Bearer <token>`
3.  **Souscription** : Envoyer un message WebSocket `pusher:subscribe` avec la signature reçue.

```javascript
// Extrait de docs/js/app/websocket.js (Simplifié)

// 1. Écoute de la connexion
if (rawData.event === 'pusher:connection_established') {
    this.socketId = JSON.parse(rawData.data).socket_id;
    this.subscribeToUserChannelLaravel(userId);
}

// 2. & 3. Auth et Souscription
async subscribeToUserChannelLaravel(userId) {
    // Appel API Auth
    const response = await fetch('/api/broadcasting/auth', { /* headers + body */ });
    const authData = await response.json();
    
    // Envoi Souscription WebSocket
    this.connection.send(JSON.stringify({
        event: 'pusher:subscribe',
        data: {
            auth: authData.auth,
            channel: `private-user_${userId}`
        }
    }));
}
```

## 5. Résolution des Problèmes Rencontrés

| Problème | Cause | Solution Appliquée |
| :--- | :--- | :--- |
| **500 Internal Server Error** sur `/broadcasting/auth` | Route définie dans `web.php` (middleware web) cherchant une session DB inexistante. | Déplacer `Broadcast::routes()` dans `api.php` avec middleware `auth:api`. |
| **WebSocket Connection Failed** | URL WebSocket manquait les paramètres du protocole Pusher (`protocol=7`...). | Ajouter les paramètres `protocol=7&client=js...` dans l'URL. |
| **Message non reçu** | `ShouldBroadcast` mettait l'événement en file d'attente (Queue) non active. | Utiliser `ShouldBroadcastNow` pour l'envoi immédiat ou lancer un worker. |

## 6. Harmonisation des Payloads (Adapter Pattern)

Pour que le frontend (conçu pour Rails) reste agnostique du backend, nous avons implémenté une **normalisation des messages** directement à la réception dans `websocket.js`.

*   **Format Rails (ActionCable)** : `{ message: { ...game_data... } }`
*   **Format Laravel (Reverb)** : `{ data: { ...game_data... }, userId: ... }`

Le code JS transforme le format Laravel pour qu'il ressemble à celui de Rails avant de le passer à la logique de jeu :

```javascript
/* docs/js/app/websocket.js */
const payload = typeof rawData.data === 'string' ? JSON.parse(rawData.data) : rawData.data;

// Transformation : On encapsule data dans une propriété 'message'
gameApi.handleGameMessage({ message: payload.data });
```

Cela permet de ne **pas modifier** `gameApi.js` et de garder la compatibilité avec les deux backends.
