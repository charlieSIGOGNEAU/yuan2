#!/bin/bash
# Script pour installer les gems manuellement si bundle install bloque

cd /home/dipsi0/thp/yuan2/api

echo "Installation des gems critiques manuellement..."

# Gems déjà installées
gem list | grep -q "pg" && echo "✓ pg déjà installé" || gem install pg --no-document

# Installer les gems une par une
gem install rails -v "7.2.2" --no-document
gem install puma --no-document
gem install redis --no-document
gem install bcrypt -v "3.1.7" --no-document
gem install jwt --no-document
gem install bootsnap --no-document
gem install rack-cors --no-document
gem install google-id-token --no-document
gem install dotenv-rails --no-document

echo "Gems installées. Essayons maintenant bundle install avec --local"
bundle install --local 2>&1 || echo "Échec de bundle install --local"

