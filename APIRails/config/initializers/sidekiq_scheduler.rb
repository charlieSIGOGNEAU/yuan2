# Configuration de Sidekiq Scheduler (OPTIONNEL)
# Ce fichier ne se charge que si la gem sidekiq-scheduler est installée
# Pour l'instant, le BroadcastRetryWorker simple est utilisé (voir broadcast_retry_worker.rb)

begin
  require 'sidekiq-scheduler'
  
  # Charger le fichier de configuration
  schedule_file = Rails.root.join('config', 'sidekiq_scheduler.yml')

  if File.exist?(schedule_file)
    Sidekiq.configure_server do |config|
      config.on(:startup) do
        Sidekiq.schedule = YAML.load_file(schedule_file)
        SidekiqScheduler::Scheduler.instance.reload_schedule!
      end
    end
    
    Rails.logger.info "✅ Sidekiq Scheduler configuré avec succès"
  else
    Rails.logger.warn "⚠️ Fichier de configuration Sidekiq Scheduler non trouvé: #{schedule_file}"
  end
rescue LoadError
  # Sidekiq n'est pas installé, on utilise BroadcastRetryWorker simple
  Rails.logger.info "ℹ️ Sidekiq non installé, utilisation du BroadcastRetryWorker simple"
end

