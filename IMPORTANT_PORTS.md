# ⚠️ IMPORTANT : Ports Vite

## 🔍 Problème identifié

Deux serveurs tournaient en même temps :
- **Port 5173** : Mode DEV (`npm run dev`) 
- **Port 4173** : Mode PREVIEW (`npm run preview`)

## ❌ Le piège

Si vous testez sur **http://localhost:5173** (mode dev), vous NE VERREZ PAS les changements du build de production !

Le mode dev sert les fichiers **sources** directement depuis `/docs` avec le HMR.
Le mode preview sert les fichiers **compilés** depuis `/dist` (le build).

## ✅ Solution

### Pour tester le build de production :

1. **Arrêter le serveur dev** (si il tourne)
```bash
# Ctrl+C dans le terminal où tourne npm run dev
# OU
pkill -f "vite" && sleep 1
```

2. **Créer le build**
```bash
npm run build
```

3. **Lancer UNIQUEMENT le preview**
```bash
npm run preview
```

4. **Tester sur http://localhost:4173** ← IMPORTANT !

### Pour le développement normal :

1. **Lancer UNIQUEMENT le mode dev**
```bash
npm run dev
```

2. **Tester sur http://localhost:5173**

## 🎯 Récapitulatif des ports

| Mode | Port | Commande | Utilisation |
|------|------|----------|-------------|
| **DEV** | 5173 | `npm run dev` | Développement avec HMR |
| **PREVIEW** | 4173 | `npm run preview` | Test du build prod |

## ⚠️ Ne jamais avoir les deux en même temps !

Avoir les deux serveurs actifs crée de la confusion :
- Vous ne savez pas quel serveur vous testez
- Les changements de build ne sont pas visibles si vous testez le dev
- Les logs sont mélangés

## 📋 Checklist avant de tester le build

- [ ] Arrêter le serveur dev (Ctrl+C ou pkill)
- [ ] Vérifier qu'aucun serveur n'écoute sur 5173
- [ ] Lancer `npm run build`
- [ ] Lancer `npm run preview`
- [ ] Ouvrir **http://localhost:4173** (pas 5173 !)
- [ ] Vider le cache du navigateur (Ctrl+Shift+R)

## 🔍 Vérifier quel serveur tourne

```bash
# Voir quels ports sont utilisés
lsof -i :5173 -i :4173 | grep LISTEN

# OU
netstat -tuln | grep -E "(5173|4173)"
```

Résultat attendu pour le preview uniquement :
```
node    xxxxx  user   18u  IPv6  xxxxx  TCP *:4173 (LISTEN)
```

## ✅ Maintenant testez correctement !

1. Le serveur dev (5173) a été arrêté
2. Le build a été reconstruit avec les logs
3. Le preview (4173) tourne
4. **Testez sur http://localhost:4173**
5. **Videz le cache (Ctrl+Shift+R)**
6. **Regardez la console pour les nouveaux logs**

