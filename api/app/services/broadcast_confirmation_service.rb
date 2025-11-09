# Service pour gérer les confirmations de réception des broadcasts game_details
# Utilise Redis pour garantir l'atomicité même en cas de load balancing

class BroadcastConfirmationService
  REDIS_KEY_PREFIX = "broadcast_confirmation".freeze
  MAX_RETRIES = 10
  RETRY_INTERVAL = 5 # secondes
  TTL = 120 # Time to live en secondes (2 minutes)

  class << self
    # Enregistre un broadcast en attente de confirmation
    # @param game_user_id [Integer] ID du game_user destinataire
    # @param game_id [Integer] ID de la game
    def register_pending_broadcast(game_user_id, game_id)
      key = redis_key(game_user_id)
      
      # Ne réinitialiser le compteur que si le broadcast n'existe pas encore
      # Cela évite de réinitialiser le compteur lors des retries
      existing_count = redis.hget(key, "retry_count")
      
      redis.hset(
        key,
        "game_id",
        game_id.to_s
      )
      
      # Ne réinitialiser le compteur que s'il n'existe pas
      if existing_count.nil?
        redis.hset(
          key,
          "retry_count",
          "1"
        )
      end
      
      redis.hset(
        key,
        "timestamp",
        Time.now.to_i.to_s
      )
      redis.expire(key, TTL)
      
      Rails.logger.info "📝 Broadcast enregistré pour game_user_id=#{game_user_id}, game_id=#{game_id}"
    end

    # Confirme la réception d'un broadcast
    # @param game_user_id [Integer] ID du game_user qui confirme
    # @return [Boolean] true si la confirmation a été traitée
    def confirm_reception(game_user_id)
      key = redis_key(game_user_id)
      
      if redis.exists?(key)
        redis.del(key)
        Rails.logger.info "✅ Confirmation reçue pour game_user_id=#{game_user_id}"
        true
      else
        Rails.logger.warn "⚠️ Aucun broadcast en attente pour game_user_id=#{game_user_id}"
        false
      end
    end

    # Vérifie tous les broadcasts en attente et retente si nécessaire
    # À appeler périodiquement (toutes les 5 secondes via Sidekiq)
    def check_and_retry_pending_broadcasts
      pattern = "#{REDIS_KEY_PREFIX}:*"
      keys = redis.keys(pattern)
      
      
      keys.each do |key|
        game_user_id = extract_game_user_id_from_key(key)
        next unless game_user_id
        
        game_id = redis.hget(key, "game_id")
        retry_count = redis.hget(key, "retry_count").to_i
        
        next unless game_id
        
        if retry_count >= MAX_RETRIES
          Rails.logger.warn "❌ Abandon après #{MAX_RETRIES} tentatives pour game_user_id=#{game_user_id}"
          redis.del(key)
        else
          # Incrémenter le compteur
          new_count = retry_count + 1
          redis.hset(key, "retry_count", new_count.to_s)
          
          Rails.logger.info "🔄 Retry #{new_count}/#{MAX_RETRIES} pour game_user_id=#{game_user_id}, game_id=#{game_id}"
          
          # Retenter le broadcast
          begin
            game_user = GameUser.find(game_user_id)
            GameBroadcast.user_broadcast_game_details(game_user.user_id, game_id.to_i)
          rescue ActiveRecord::RecordNotFound => e
            Rails.logger.error "❌ GameUser #{game_user_id} introuvable: #{e.message}"
            redis.del(key)
          rescue => e
            Rails.logger.error "❌ Erreur lors du retry pour game_user_id=#{game_user_id}: #{e.message}"
          end
        end
      end
    end

    # Statistiques sur les broadcasts en attente (pour monitoring)
    def pending_broadcasts_stats
      pattern = "#{REDIS_KEY_PREFIX}:*"
      keys = redis.keys(pattern)
      
      stats = {
        total: keys.length,
        by_retry_count: Hash.new(0)
      }
      
      keys.each do |key|
        retry_count = redis.hget(key, "retry_count").to_i
        stats[:by_retry_count][retry_count] += 1
      end
      
      stats
    end

    private

    def redis
      @redis ||= Redis.new(url: ENV['REDIS_URL'] || 'redis://localhost:6379/0')
    end

    def redis_key(game_user_id)
      "#{REDIS_KEY_PREFIX}:#{game_user_id}"
    end

    def extract_game_user_id_from_key(key)
      key.split(':').last.to_i
    rescue
      nil
    end
  end
end

