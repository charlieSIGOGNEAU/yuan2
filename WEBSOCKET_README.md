# 🔌 Action Cable + WebSocket - Yuan Game

Guide complet pour l'implémentation des WebSockets avec persistance de connexion.

## 🚀 Installation Rapide

### 1. Configurer Redis
```bash
./setup-redis.sh
```

### 2. Installer les gems
```bash
cd api && bundle install
```

### 3. Démarrer l'application
```bash
# Terminal 1: API Rails
cd api && rails server

# Terminal 2: Frontend Web  
cd web && python3 -m http.server 8000
```

## 🔧 Architecture WebSocket

### **Côté Serveur (Rails + Action Cable)**

#### **Connection** (`app/channels/application_cable/connection.rb`)
- ✅ Authentification JWT automatique
- ✅ Logging des connexions/déconnexions
- ✅ Gestion des erreurs de token

#### **GameChannel** (`app/channels/game_channel.rb`)
- ✅ Channels personnels et généraux
- ✅ Heartbeat serveur (30s)
- ✅ Messages ping/pong
- ✅ Diffusion de messages

### **Côté Client (JavaScript)**

#### **WebSocketClient** (`web/js/app/websocket.js`)
- ✅ Connexion automatique après login
- ✅ Reconnexion automatique avec backoff exponentiel
- ✅ Heartbeat client (30s)
- ✅ Détection de déconnexion
- ✅ Interface utilisateur temps réel

## 💓 Gestion de la Persistance

### **1. Heartbeat Bidirectionnel**

**Serveur → Client** (30s)
```ruby
# Dans GameChannel
def start_heartbeat
  @heartbeat_timer = Thread.new do
    loop do
      sleep 30
      transmit({ type: 'heartbeat', timestamp: Time.current })
    end
  end
end
```

**Client → Serveur** (30s)
```javascript
// Dans WebSocketClient
setInterval(() => {
  if (!this.ping()) {
    this.reconnect();
  }
}, 30000);
```

### **2. Détection de Déconnexion**

**Timeout de Heartbeat** (1 minute)
```javascript
const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat.getTime();
if (timeSinceLastHeartbeat > 60000) {
  console.warn('⚠️ Pas de heartbeat depuis 1 minute');
  this.reconnect();
}
```

**États de connexion WebSocket**
```javascript
// disconnected, connecting, connected
this.connection.onclose = () => {
  this.connectionStatus = 'disconnected';
  if (this.reconnectAttempts < this.maxReconnectAttempts) {
    this.scheduleReconnect();
  }
};
```

### **3. Reconnexion Automatique**

**Backoff Exponentiel**
```javascript
scheduleReconnect() {
  this.reconnectAttempts++;
  const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
  // 1s, 2s, 4s, 8s, 16s...
  setTimeout(() => this.connect(), delay);
}
```

**Limite de tentatives** (5 max)
```javascript
if (this.reconnectAttempts >= this.maxReconnectAttempts) {
  this.showConnectionError();
  // Arrêt des tentatives
}
```

## 🧪 Tests de Persistance

### **Boutons de Test disponibles**

1. **💓 Ping** - Teste la latence
2. **💬 Message Test** - Diffuse un message
3. **🔄 Reconnecter** - Force une reconnexion

### **Tests manuels de déconnexion**

```bash
# 1. Arrêter Redis
sudo systemctl stop redis-server

# 2. Redémarrer l'API Rails
# Ctrl+C dans le terminal Rails

# 3. Simuler une mauvaise connexion réseau
# Désactiver/réactiver WiFi
```

### **Vérification dans les logs**

**Rails logs** (`api/log/development.log`)
```
[ActionCable] User-1: 🔌 WebSocket connecté: Alice
[ActionCable] User-1: 💓 Ping reçu de Alice
[ActionCable] User-1: 🔌 WebSocket déconnecté: Alice
```

**Browser Console**
```
✅ WebSocket connecté
💓 Heartbeat démarré  
💓 Ping reçu
⚠️ Pas de heartbeat depuis 1 minute, reconnexion...
🔄 Tentative de reconnexion 1/5 dans 1000ms
```

## 🛡️ Stratégies de Robustesse

### **1. Gestion d'Erreurs Multiples**
- Token JWT expiré
- Serveur Redis indisponible
- Connexion réseau instable
- Arrêt brutal du serveur

### **2. Persistance d'État**
- Token JWT sauvé dans localStorage
- Reconnexion automatique au reload
- État de connexion visible dans l'UI

### **3. Performance**
- Redis en production pour scalabilité
- Heartbeat optimisé (30s/60s)
- Déconnexion propre au logout

## 📊 Monitoring de Connexion

### **Indicateurs en temps réel**
- 🟢 **connected** - Connexion active
- 🟡 **connecting** - Connexion en cours  
- 🔴 **disconnected** - Déconnecté

### **Métriques importantes**
- Temps de reconnexion
- Nombre de tentatives
- Latence ping/pong
- Fréquence des déconnexions

## 🚨 Résolution de Problèmes

### **WebSocket ne se connecte pas**
1. Vérifier que Redis fonctionne: `redis-cli ping`
2. Vérifier les logs Rails
3. Vérifier le token JWT dans localStorage

### **Déconnexions fréquentes**
1. Vérifier la stabilité réseau
2. Ajuster les timeouts dans `websocket.js`
3. Surveiller la charge serveur

### **Reconnexion échoue**
1. Vérifier l'expiration du token JWT
2. Relancer Redis si nécessaire
3. Effacer localStorage et se reconnecter

---

## 🎯 Résultat

✅ **WebSocket persistant** avec reconnexion automatique  
✅ **Heartbeat bidirectionnel** pour détecter les pannes  
✅ **Interface temps réel** avec indicateur de statut  
✅ **Gestion d'erreurs robuste** avec backoff exponentiel  
✅ **Tests intégrés** pour valider la persistance  

**La connexion WebSocket reste stable même en cas de problèmes réseau !** 🚀 