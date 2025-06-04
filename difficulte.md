## **LES PRINCIPALES DIFFICULTÉS RENCONTRÉES**

**1. 🔐 PROBLÈME D'AUTHENTIFICATION JWT AVEC WEBSOCKET**

**Le problème :** Les WebSockets ne supportent pas les headers Authorization comme les requêtes HTTP classiques.

**Détail technique :**

javascript

Apply to authenticati...

*// ❌ CECI NE FONCTIONNE PAS avec WebSocket*

fetch('/api/users', {

headers: {

'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGci...'

}

})

*// ❌ WebSocket ne peut pas faire ça :*

websocket = new WebSocket('ws://localhost:3000/cable', {

headers: { 'Authorization': 'Bearer ...' }  *// IMPOSSIBLE !*

})

**Solutions qu'on a dû implémenter :**

**Option A : Token dans l'URL (celle qu'on utilise)connection.rb      *# Récupérer le token depuis les paramètres de l'URL ou les headers*      token = request.params[:token] || extract_token_from_headers**

javascript

Apply to authenticati...

*// ✅ Token passé dans l'URL*

cable = ActionCable.createConsumer('ws://localhost:3000/cable?token=eyJ0eXAiOiJKV1Qi...');

**Option B : Token dans les headers de connexion initialeconnection.rb    def extract_token_from_headers      *# Essayer d'extraire le token depuis les headers Authorization*      auth_header = request.headers['Authorization']      puts "🔍 Header Authorization: #{auth_header&.truncate(50) || 'AUCUN'}"      auth_header&.split(' ')&.last**

**2. 🌐 PROBLÈMES CORS ET ORIGINES**

**Le problème :** Les WebSockets ont des règles CORS différentes des requêtes HTTP.

**Configuration CORS classique :**

cors.rb

Rails.application.config.middleware.insert_before 0, Rack::Cors do

allow do

origins '*'  *# En développement, autoriser toutes les origines*

resource '*',

headers: :any,

methods: [:get, :post, :put, :patch, :delete, :options, :head],

credentials: false  *# Désactiver credentials pour les wildcard origins*

end

end

**Mais pour Action Cable, il faut AUSSI :**

development.rb

*# Uncomment if you wish to allow Action Cable access from any origin.*

config.action_cable.disable_request_forgery_protection = true

*# Configuration ActionCable pour le développement*

config.action_cable.allowed_request_origins = [

'http://localhost:3000',

'http://127.0.0.1:3000',

'http://localhost:5500',

'http://127.0.0.1:5500',

'http://localhost:8000',

'http://127.0.0.1:8000',

/http:\/\/localhost:\d+/,

/http:\/\/127\.0\.0\.1:\d+/,

nil  *# Autoriser les connexions sans origin (pour les tests)*

]

**Pourquoi c'est compliqué :**

- CORS s'applique au middleware Rack
- Action Cable a ses propres vérifications d'origine
- Il faut configurer les DEUX

**3. 🔑 PROBLÈME DE GEM RACK-CORS COMMENTÉE**

**Le problème qu'on a eu :**

ruby

Apply to authenticati...

*# Dans le Gemfile, cette ligne était commentée :*

*# gem "rack-cors"*

**Erreur résultante :**

text

Apply to authenticati...

NameError: uninitialized constant Rack::Cors

**Solution :**

Gemfile

gem "rack-cors"

Puis bundle install

**4. 🔄 PROBLÈME DE CYCLE DE VIE DES CONNEXIONS**

**Le problème :** Comprendre quand et comment les connexions se ferment/s'ouvrent.

**Méthodes importantes dans connection.rb :**

connection.rb

def connect

puts "🔌 === DÉBUT CONNEXION WEBSOCKET ==="

puts "📍 Origin: #{request.headers['Origin']}"

puts "🌐 URL: #{request.url}"

puts "🔗 Query params: #{request.query_parameters}"

puts "📋 Headers: #{request.headers.to_h.select { |k, v| k.downcase.include?('auth') || k.downcase.include?('token') }}"

self.current_user = find_verified_user

puts "✅ Connexion WebSocket authentifiée établie pour #{current_user.name} (ID: #{current_user.id})"

**Points critiques :**

- connect() s'exécute **UNE SEULE FOIS** à la connexion
- Si l'authentification échoue ici → connexion rejetée
- current_user est défini ici et disponible dans tous les channels

**5. 🎯 PROBLÈME DE ROUTING ET MOUNTING**

**Le problème :** Où monter Action Cable et comment.

routes.rb

mount ActionCable.server => '/cable'

**Points critiques :**

- Doit être au niveau racine des routes
- L'URL devient ws://localhost:3000/cable
- **PAS** ws://localhost:3000/api/cable

**6. 📡 PROBLÈME DE COMPRÉHENSION DU FLUX**

**Confusion initiale :** Comprendre qui envoie quoi et quand.

**Flow correct :**
1. **Client** → Connexion WebSocket avec token
1. **Serveur** → Vérifie JWT dans connection.rb
1. **Client** → S'abonne à un channel
1. **Serveur** → subscribed() dans le channel
1. **Client** → subscription.perform('method_name', data)
1. **Serveur** → Méthode correspondante dans le channel
1. **Serveur** → transmit() pour envoyer au client
1. **Client** → received(data) en JavaScript

1. 1. **Client** → Connexion WebSocket avec token
2. 1. **Serveur** → Vérifie JWT dans connection.rb
3. 1. **Client** → S'abonne à un channel
4. 1. **Serveur** → subscribed() dans le channel
5. 1. **Client** → subscription.perform('method_name', data)
6. 1. **Serveur** → Méthode correspondante dans le channel
7. 1. **Serveur** → transmit() pour envoyer au client
8. 1. **Client** → received(data) en JavaScript

**7. 🧩 PROBLÈME DE STRUCTURE DES DONNÉES**

**Le problème :** Format des messages entre client et serveur.

**Côté serveur (Ruby) :**

test_channel.rb

transmit({

type: "welcome",

message: "Connexion réussie au TestChannel!",

user: {

id: current_user.id,

name: current_user.name,

email: current_user.email

},

timestamp: Time.current

})

**Côté client (JavaScript) :**

test_websocket.html

received(data) {

log(`📨 Message reçu: ${JSON.stringify(data)}`);

// Traitement spécial pour les pongs

if (data.type === 'pong') {

const latency = new Date() - pingStartTime;

log(`🏓 SERVEUR → CLIENT: Pong reçu ! Latence: ${latency}ms`);

connectionTimeSpan.style.color = latency < 100 ? '#155724' : (latency < 500 ? '#856404' : '#721c24');

}

// Traitement des pings du serveur

if (data.type === 'server_ping') {

log(`📡 SERVEUR → CLIENT: Ping du serveur reçu ! Envoi de la réponse automatique...`);

// Répondre automatiquement au ping du serveur

subscription.perform('server_pong', {

received_at: new Date().toISOString(),

**8. 🔍 PROBLÈME DE DEBUGGING**

**Le défi :** Comment déboguer les WebSockets.

**Solutions qu'on a mises en place :**

**Logs détaillés côté serveur :**

connection.rb

puts "🔌 === DÉBUT CONNEXION WEBSOCKET ==="

puts "📍 Origin: #{request.headers['Origin']}"

puts "🌐 URL: #{request.url}"

puts "🔗 Query params: #{request.query_parameters}"

puts "📋 Headers: #{request.headers.to_h.select { |k, v| k.downcase.include?('auth') || k.downcase.include?('token') }}"

**Logs détaillés côté client :**

test_websocket.html

function log(message) {

const timestamp = new Date().toLocaleTimeString();

logDiv.textContent += `[${timestamp}] ${message}\n`;

logDiv.scrollTop = logDiv.scrollHeight;

console.log(`[WebSocket] ${message}`);

}

## **🎯 CONSEILS POUR REFAIRE SEUL**

**1. Ordre d'implémentation recommandé :**

1. **D'abord** : API REST classique avec JWT
1. **Ensuite** : Action Cable sans authentification
1. **Enfin** : Authentification JWT avec Action Cable

1. 1. **D'abord** : API REST classique avec JWT
2. 1. **Ensuite** : Action Cable sans authentification
3. 1. **Enfin** : Authentification JWT avec Action Cable

**2. Tests progressifs :**

1. **Test 1** : Connexion WebSocket sans auth
1. **Test 2** : Ping/pong simple
1. **Test 3** : Ajouter l'authentification
1. **Test 4** : Gestion des erreurs

1. 1. **Test 1** : Connexion WebSocket sans auth
2. 1. **Test 2** : Ping/pong simple
3. 1. **Test 3** : Ajouter l'authentification
4. 1. **Test 4** : Gestion des erreurs

**3. Points d'attention critiques :**

ruby

Apply to authenticati...

*# ✅ TOUJOURS décommenter rack-cors*

gem "rack-cors"

*# ✅ TOUJOURS configurer les deux CORS*

*# Dans cors.rb ET development.rb*

*# ✅ TOUJOURS logger pour déboguer*

puts "🔍 Debug info: #{variable}"

*# ✅ TOUJOURS vérifier le token format*

token = request.params[:token] || extract_token_from_headers

**4. Erreurs à éviter absolument :**

- ❌ Oublier bundle install après décommenter rack-cors
- ❌ Configurer CORS seulement dans cors.rb (il faut AUSSI development.rb)
- ❌ Mettre le token dans un header Authorization (ne marche pas avec WebSocket)
- ❌ Monter Action Cable dans un namespace API
- ❌ Oublier identified_by :current_user dans connection.rb