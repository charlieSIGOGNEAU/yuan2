# Channel principal pour les communications de jeu
class GameChannel < ApplicationCable::Channel
  def subscribed
    
    if params[:game_id].present?
      game_id = params[:game_id].to_i
      stream_from "game_#{game_id}"
      GameBroadcast.send_game_message(game_id, {
        type: 'user_joined_game',
        user_id: current_user.id,
        user_name: current_user.name,
        game_id: game_id,
        message: "#{current_user.name} a rejoint le Game #{game_id}",
        timestamp: Time.current
      })
      if (game = Game.find_by(id: game_id))
        GameBroadcast.send_user_message(current_user.id, {
          type: 'details_game test',
          game: game.as_json(include: { game_users: {} })
        })
      end  
      logger.info "📡 Utilisateur #{current_user.name} souscrit au GameChannel pour Game #{game_id}"
    else
      stream_from "user_#{current_user.id}"
        GameBroadcast.send_user_message(current_user.id, {
        type: 'user_joined_user_channel',
        user: current_user.name,
        message: "#{current_user.name} a rejoint son chanel personel",
        timestamp: Time.current
      })
      logger.info "📡 Utilisateur #{current_user.name} souscrit au GameChannel personel"
    end
  end

  def unsubscribed
    if params[:game_id].present?
      logger.info "📡 Utilisateur #{current_user.name} désouscrit du GameChannel Game #{params[:game_id]}"
    else
      logger.info "📡 Utilisateur #{current_user.name} désouscrit du GameChannel personel"
    end
  end
end 