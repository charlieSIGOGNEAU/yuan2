# Web Frontend

Cette partie contient l'interface web séparée de l'API Rails.

## Structure

```
web/
├── index.html          # Page principale
├── js/
│   └── app.js         # Logique JavaScript (authentification, etc.)
├── css/
│   └── (fichiers CSS si nécessaire)
├── partials/
│   └── login-form.html # Partial du formulaire de connexion
└── README.md          # Ce fichier
```

## Utilisation

1. Lancez l'API Rails : `cd api && rails server`
2. Servez les fichiers web avec un serveur HTTP simple
3. Ouvrez `index.html` dans votre navigateur

## Authentification

L'authentification se fait via JWT avec l'API Rails qui fonctionne sur le port 3000 par défaut. 