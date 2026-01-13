#!/usr/bin/env ruby
# Script pour créer un Gemfile.lock minimal à partir des gems installées

require 'rubygems'

# Lire le Gemfile
gemfile_content = File.read('Gemfile')

# Extraire les gems principales (ignorer les lignes commentées)
gems = {}
gemfile_content.lines.each do |line|
  next if line.strip.start_with?('#')
  if match = line.match(/gem\s+["']([^"']+)["'](?:,\s*["']([^"']+)["'])?/)
    name = match[1]
    version = match[2]&.gsub(/[~>=<]/, '')
    gems[name] = version
  end
end

# Obtenir les versions installées
installed_versions = {}
gems.each do |name, _|
  begin
    spec = Gem::Specification.find_by_name(name)
    installed_versions[name] = spec.version.to_s
    puts "✓ Trouvé: #{name} #{installed_versions[name]}"
  rescue Gem::MissingSpecError
    puts "⚠ #{name} non installé (sera ignoré)"
  end
end

# Créer un Gemfile.lock minimal
lockfile = <<~LOCKFILE
GEM
  remote: https://rubygems.org/
  specs:

BUNDLED WITH
   2.6.3
LOCKFILE

File.write('Gemfile.lock', lockfile)
puts "\nGemfile.lock minimal créé (vide, mais structure créée)"
puts "Vous pouvez maintenant essayer: bundle install --local"

