# Debug Google OAuth - Vérification de l'origine

## Étape 1 : Vérifier l'origine exacte dans le navigateur

Ouvrez votre page : http://localhost:8000/web/#landing

Appuyez sur F12 pour ouvrir la console, puis exécutez :

```javascript
console.log('🔍 Origine actuelle:', window.location.origin);
console.log('🔍 URL complète:', window.location.href);
console.log('🔍 Protocol:', window.location.protocol);
console.log('🔍 Hostname:', window.location.hostname);
console.log('🔍 Port:', window.location.port);
```

**Résultat attendu** :
```
🔍 Origine actuelle: http://localhost:8000
```

## Étape 2 : Vider COMPLÈTEMENT le cache Google

Dans la console du navigateur, exécutez :

```javascript
// Vider tout le cache lié à Google
Object.keys(localStorage).forEach(key => {
    if (key.includes('google') || key.includes('gsi')) {
        localStorage.removeItem(key);
        console.log('Supprimé:', key);
    }
});

Object.keys(sessionStorage).forEach(key => {
    if (key.includes('google') || key.includes('gsi')) {
        sessionStorage.removeItem(key);
        console.log('Supprimé:', key);
    }
});

// Vider les cookies Google
document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

console.log('✅ Cache Google vidé');
```

Puis rechargez la page : `location.reload(true);`

## Étape 3 : Tester avec un nouveau Client ID

Si ça ne marche toujours pas, le problème peut venir du Client ID lui-même.

**Solution** : Créer un NOUVEAU Client ID dans Google Cloud Console :

1. Allez sur https://console.cloud.google.com/apis/credentials
2. Cliquez sur **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Type d'application : **"Application Web"**
4. Nom : **"Yuan Game - Dev"**
5. Origines JavaScript autorisées :
   - `http://localhost:8000`
   - `http://127.0.0.1:8000`
6. URI de redirection : **LAISSER VIDE**
7. Cliquez sur **CREATE**
8. Copiez le nouveau **Client ID**

Puis mettez à jour :
- `web/js/app/config.js` : mettez le nouveau Client ID
- `api/.env` : mettez le nouveau Client ID
- Redémarrez le serveur Rails

## Étape 4 : Si ça ne marche toujours pas - Autre méthode

Au lieu du bouton Google rendu, utilisez la méthode "Sign in with Google" avec redirection :

1. Google Cloud Console → OAuth consent screen
2. Vérifiez que l'application est en mode "Testing" ou "Production"
3. Ajoutez votre email dans "Test users" si en mode Testing

## Étape 5 : Vérification finale

Dans Google Cloud Console, vérifiez aussi :
- **API Library** → "Google+ API" ou "Google Identity Toolkit API" est activée
- **OAuth consent screen** → Status est "Testing" ou "In production"
- Votre email est dans les "Test users" si mode Testing

## Commande de test rapide

Pour tester si Google accepte votre origine, exécutez dans la console du navigateur :

```javascript
fetch('https://accounts.google.com/gsi/button', {
    method: 'HEAD'
}).then(() => console.log('✅ Google accessible'))
  .catch(e => console.error('❌ Erreur:', e));
```

## Alternative temporaire : Utiliser un proxy local

Si vraiment rien ne fonctionne, vous pouvez temporairement utiliser un proxy HTTPS local :

```bash
# Installer mkcert (pour créer des certificats SSL locaux)
# Puis utiliser un serveur HTTPS au lieu de HTTP
```

Mais normalement, HTTP local devrait fonctionner avec Google.




