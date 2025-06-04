# Web Frontend - Yuan Game (Version Simple + Partials)

Interface web minimaliste organisée avec partials et JS séparé.

## 📁 Structure Organisée

```
web/
├── index.html              # Page principale
├── partials/               # 🧩 Partials HTML
│   ├── login.html          #   Formulaire de connexion
│   └── menu.html           #   Menu principal
├── css/                    # 🎨 Styles séparés
│   ├── base.css            #   Styles communs
│   ├── login.css           #   Page de connexion
│   └── menu.css            #   Menu principal
├── js/
│   ├── app/                # 📱 JS organisé par fonctionnalité
│   │   ├── auth.js         #   Authentification JWT
│   │   ├── login.js        #   Page de connexion
│   │   └── menu.js         #   Menu principal
│   └── simple.js           # 🎯 Orchestrateur principal (25 lignes)
└── README.md               # Ce fichier
```

## 🚀 Ce que ça fait

1. **Page de connexion** : Partial HTML + CSS + JS dédié
2. **Authentification JWT** avec l'API Rails
3. **Menu principal** : Partial HTML + CSS + JS dédié
4. **CSS dynamique** : Chaque page charge son propre style
5. **Déconnexion** propre

## 📋 Comment utiliser

### 1. Lancer l'API Rails
```bash
cd api && rails server  # Port 3000
```

### 2. Lancer le serveur web
```bash
cd web && python3 -m http.server 8000  # Port 8000
```

### 3. Ouvrir http://localhost:8000

## 🔧 Organisation du Code

### **Partials HTML** 📋
- `login.html` : Formulaire simple
- `menu.html` : 3 boutons + déconnexion

### **CSS Séparé** 🎨
- `base.css` : Styles communs
- `login.css` : Styles du formulaire
- `menu.css` : Styles du menu

### **JS Modulaire** ⚙️
- `auth.js` : Gestion JWT (60 lignes)
- `login.js` : Page connexion (25 lignes)
- `menu.js` : Page menu (30 lignes)
- `simple.js` : Orchestrateur (25 lignes)

## 🎯 Avantages

✅ **Séparation claire** : HTML, CSS, JS séparés  
✅ **Réutilisable** : Partials modulaires  
✅ **Maintenable** : Code organisé par fonction  
✅ **Simple** : Pas de complexité inutile  
✅ **Extensible** : Facile d'ajouter des pages  

## 📝 Total

**140 lignes de JS** au lieu de 1000+ !
- Partials HTML réutilisables
- CSS organisé par page
- JS modulaire et simple

---

**Simplicité + Organisation = 🎯** 