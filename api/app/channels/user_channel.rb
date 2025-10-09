# Channel pour les communications personnalisées aux utilisateurs
class UserChannel < ApplicationCable::Channel
  def subscribed
    if params[:user_id].present? && params[:user_id].to_i == current_user.id
      stream_from "user_#{current_user.id}"
      logger.info "📡 Utilisateur #{current_user.name} souscrit au UserChannel"

      user = current_user
      ongoing_game_result = Game.ongoing_game(user)
      
      if ongoing_game_result
        # Utiliser les IDs pour éviter tout problème de sérialisation
        game_id = ongoing_game_result[:game].id
        user_id = user.id
        game_user_id = ongoing_game_result[:game_user].id

        begin
          GameBroadcast.user_broadcast_game_details(user_id, game_id, game_user_id)
        rescue => e
          logger.error "‼️ Broadcast failed: #{e.class}: #{e.message}"
          logger.error e.backtrace.join("\n")
          raise
        end 
      end
    else
      reject
    end
  end

  def unsubscribed
    logger.info "📡 Utilisateur #{current_user.name} désouscrit du UserChannel"
  end
end 