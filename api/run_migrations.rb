#!/usr/bin/env ruby
# Script pour exécuter les migrations sans bundler

# Charger les gems directement
require 'rubygems'
gem 'rails', '7.2.2'
require 'rails'

# Charger l'application Rails
ENV['RAILS_ENV'] ||= 'development'
require_relative 'config/application'

# Initialiser Rails
Rails.application.initialize!

# Exécuter les migrations
puts "Exécution des migrations..."
Rails::Command.invoke :db, ['migrate']

