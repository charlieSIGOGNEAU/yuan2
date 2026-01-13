#!/usr/bin/env ruby
# Script pour exécuter les migrations directement avec ActiveRecord

require 'rubygems'
# Utiliser Rails 8.0.2 qui est installé
gem 'rails', '8.0.2'
require 'active_record'
require 'active_record/migration'

# Charger la configuration de la base de données
ENV['RAILS_ENV'] ||= 'development'
db_config = YAML.load_file('config/database.yml', aliases: true)[ENV['RAILS_ENV']]

# Se connecter à la base de données
ActiveRecord::Base.establish_connection(db_config)

# Charger les migrations
migrations_path = 'db/migrate'
ActiveRecord::Migration.verbose = true

# Exécuter les migrations
puts "Exécution des migrations..."
ActiveRecord::Migrator.migrate(migrations_path)

puts "Migrations terminées !"

