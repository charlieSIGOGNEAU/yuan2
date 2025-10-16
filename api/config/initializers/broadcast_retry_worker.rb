# Worker simple pour vérifier et retenter les broadcasts non confirmés
# Alternative à Sidekiq qui fonctionne sans dépendances externes
# Pour une solution en production robuste, utiliser Sidekiq (voir README_BROADCAST_CONFIRMATION.md)

class BroadcastRetryWorker
  INTERVAL = 5 # secondes
  
  class << self
    def start
      return if @running
      
      @running = true
      @thread = Thread.new do
        Rails.logger.info "🚀 Démarrage du BroadcastRetryWorker (intervalle: #{INTERVAL}s)"
        
        loop do
          begin
            BroadcastConfirmationService.check_and_retry_pending_broadcasts
          rescue => e
            Rails.logger.error "❌ Erreur dans BroadcastRetryWorker: #{e.message}"
            Rails.logger.error e.backtrace.join("\n")
          end
          
          sleep INTERVAL
        end
      end
      
      # Arrêter proprement le thread à la fermeture du serveur
      at_exit do
        stop
      end
    end
    
    def stop
      if @running
        Rails.logger.info "🛑 Arrêt du BroadcastRetryWorker"
        @running = false
        @thread&.kill
        @thread = nil
      end
    end
    
    def running?
      @running
    end
  end
end

# Démarrer le worker automatiquement en mode serveur (pas en console ou rake tasks)
if defined?(Rails::Server) || ENV['BROADCAST_RETRY_WORKER'] == 'true'
  Rails.application.config.after_initialize do
    BroadcastRetryWorker.start
  end
end

