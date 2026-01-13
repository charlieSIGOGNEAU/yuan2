Pour ouvrir un serveur Python, il suffit d'exécuter la commande: 
python3 -m http.server 8000

Ouvrir DevDb via la palette de commandes :
Ctrl+Shift+P → tape DevDb: Open → sélectionne la table api/storage/development.sklite3

lancer Vite:  
npm run dev


ouvrir la consol de mon api dans mon docker local:
docker compose -f docker-compose.dev.yml exec api bash
# Voir où vous êtes
pwd
# /rails

# Voir les fichiers
ls -la

# Exécuter des commandes Rails
bundle exec rails console
bundle exec rails db:migrate
bundle exec rails generate model ...

# Voir les logs
tail -f log/development.log

# Quitter le shell
exit