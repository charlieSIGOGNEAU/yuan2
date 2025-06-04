# Channel principal pour les communications de jeu
class GameChannel < ApplicationCable::Channel
  def subscribed
    # Rejoindre le channel personnel de l'utilisateur
    stream_from "game_#{current_user.id}"
    
    # Channel général pour tous les utilisateurs connectés
    stream_from "game_general"
    
    # Si un game_id est spécifié, rejoindre ce channel spécifique
    if params[:game_id].present?
      game_id = params[:game_id].to_i
      stream_from "game_#{game_id}_updates"
      logger.info "📡 Utilisateur #{current_user.name} souscrit au GameChannel pour Game #{game_id}"
      
      # 🆕 Notifier les autres utilisateurs déjà connectés au channel
      ActionCable.server.broadcast "game_#{game_id}_updates", {
        type: 'user_joined_game',
        user: current_user.name,
        game_id: game_id,
        message: "#{current_user.name} a rejoint le Game #{game_id}",
        timestamp: Time.current
      }
    else
      logger.info "📡 Utilisateur #{current_user.name} souscrit au GameChannel général"
    end
    
    # Confirmer la connexion
    transmit({
      type: 'connection_confirmed',
      message: params[:game_id] ? "WebSocket connecté au Game #{params[:game_id]}!" : 'WebSocket connecté avec succès!',
      user: current_user.name,
      game_id: params[:game_id],
      timestamp: Time.current
    })
    
    # Démarrer le heartbeat seulement pour le channel principal (sans game_id)
    start_heartbeat unless params[:game_id].present?
  end

  def unsubscribed
    if params[:game_id].present?
      logger.info "📡 Utilisateur #{current_user.name} désouscrit du GameChannel Game #{params[:game_id]}"
    else
      logger.info "📡 Utilisateur #{current_user.name} désouscrit du GameChannel général"
      stop_heartbeat
    end
  end

  # Recevoir un ping du client
  def ping(data)
    logger.debug "💓 Ping reçu de #{current_user.name}"
    transmit({
      type: 'pong',
      timestamp: Time.current,
      client_timestamp: data['timestamp']
    })
  end

  # Envoyer un message de test
  def send_message(data)
    message = data['message']
    logger.info "💬 Message de #{current_user.name}: #{message}"
    
    # Diffuser à tous les utilisateurs connectés
    ActionCable.server.broadcast "game_general", {
      type: 'user_message',
      user: current_user.name,
      message: message,
      timestamp: Time.current
    }
  end

  # Envoyer un message à un jeu spécifique
  def send_game_message(data)
    game_id = data['game_id'].to_i
    message = data['message']
    logger.info "🎮 Message de #{current_user.name} pour Game #{game_id}: #{message}"
    
    # Diffuser à tous les utilisateurs abonnés au jeu spécifique
    ActionCable.server.broadcast "game_#{game_id}_updates", {
      type: 'game_message',
      user: current_user.name,
      message: message,
      game_id: game_id,
      timestamp: Time.current
    }
  end

  private

  def start_heartbeat
    # Envoyer un heartbeat toutes les 60 secondes (au lieu de 30)
    # pour éviter les conflits avec les pings système d'Action Cable (toutes les 3s)
    @heartbeat_timer = Thread.new do
      loop do
        sleep 60
        transmit({
          type: 'heartbeat',
          timestamp: Time.current
        })
      end
    end
  end

  def stop_heartbeat
    @heartbeat_timer&.kill
  end
end 