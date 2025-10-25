# Fix Google OAuth 403 - OAuth Consent Screen

## Problème probable : OAuth Consent Screen mal configuré

Quand vous créez un Client ID, Google vérifie aussi l'**OAuth Consent Screen**. Si celui-ci n'est pas correctement configuré, vous aurez TOUJOURS une erreur 403, peu importe le nombre de Client IDs que vous créez.

## ✅ Solution : Configurer l'OAuth Consent Screen

### Étape 1 : Aller sur OAuth Consent Screen

https://console.cloud.google.com/apis/credentials/consent

### Étape 2 : Vérifier/Configurer

#### A. User Type
- Si vous voyez "Internal" : ❌ NE MARCHE PAS pour localhost
- Vous devez choisir **"External"** ✅

#### B. Publishing status
- **"Testing"** : ✅ Parfait pour le développement
  - MAIS vous devez ajouter votre email dans "Test users"
- **"In production"** : ✅ Fonctionne aussi mais nécessite une vérification Google

#### C. Test users (SI en mode Testing)
1. Cliquez sur "OAuth consent screen" dans le menu de gauche
2. Scrollez jusqu'à "Test users"
3. Cliquez sur "+ ADD USERS"
4. **Ajoutez VOTRE email** (celui que vous utilisez pour vous connecter)
5. Sauvegardez

### Étape 3 : Vérifier les informations obligatoires

Dans "OAuth consent screen", assurez-vous d'avoir rempli :
- ✅ App name : "Yuan Game" (ou autre)
- ✅ User support email : Votre email
- ✅ Developer contact information : Votre email
- ✅ Application home page : `http://localhost:8000` (ou laissez vide)

### Étape 4 : Scopes (Étendues)

1. Allez dans l'onglet "Scopes"
2. Cliquez sur "ADD OR REMOVE SCOPES"
3. Cherchez et ajoutez :
   - ✅ `.../auth/userinfo.email`
   - ✅ `.../auth/userinfo.profile`
   - ✅ `openid`
4. Sauvegardez

## 🔍 Checklist complète

Allez sur https://console.cloud.google.com/apis/credentials et vérifiez :

### 1. OAuth consent screen
- [ ] User Type = "External"
- [ ] Publishing status = "Testing"
- [ ] Votre email est dans "Test users"
- [ ] App name est rempli
- [ ] User support email est rempli
- [ ] Developer contact info est rempli

### 2. Credentials
- [ ] Vous avez un OAuth 2.0 Client ID
- [ ] Type = "Web application"
- [ ] Authorized JavaScript origins contient : `http://localhost:8000`
- [ ] Authorized redirect URIs est VIDE (ou contient aussi `http://localhost:8000`)

### 3. APIs activées
Allez sur https://console.cloud.google.com/apis/library et cherchez :
- [ ] "Google+ API" - Activez-la si pas déjà fait
- [ ] "Google Identity Toolkit API" - Activez-la si pas déjà fait

## 🧪 Test après configuration

1. Attendez 2-3 minutes pour la propagation
2. Videz le cache du navigateur : `localStorage.clear(); sessionStorage.clear();`
3. Rechargez la page : `location.reload(true);`
4. Testez le bouton Google

## ⚠️ Erreur courante

**"The given origin is not allowed for the given client ID"**

Même avec les origines correctes, cette erreur apparaît SI :
- L'OAuth consent screen n'est pas configuré
- Vous n'êtes pas dans les "Test users" (si mode Testing)
- Le projet Google Cloud n'a pas les bonnes APIs activées

## 📝 Note importante sur "Test users"

Si votre app est en mode **"Testing"** :
- SEULS les emails listés dans "Test users" peuvent se connecter
- Si vous essayez avec un autre compte Google = 403
- Ajoutez TOUS les emails de test que vous voulez utiliser

## 🚀 Alternative : Passer en mode "In production"

Si vous ne voulez pas gérer les "Test users" :
1. OAuth consent screen
2. Cliquez sur "PUBLISH APP"
3. L'app passera en "In production"
4. Vous pourrez vous connecter avec N'IMPORTE quel compte Google

⚠️ Attention : Google peut demander une vérification si vous utilisez des scopes sensibles.











