# Channel pour les communications personnalisées aux utilisateurs
class UserChannel < ApplicationCable::Channel
  def subscribed
    if params[:user_id].present? && params[:user_id].to_i == current_user.id
      stream_from "user_#{current_user.id}"
      logger.info "📡 Utilisateur #{current_user.name} souscrit au UserChannel"

      user=User.find(current_user.id)
      game=Game.ongoing_game(user)[:game]

      if game
        game_user=game.game_users.find_by(user_id: user.id)

        p "1"*100
        p game
        p "1"*100
        p game.class
        p "1"*100
        GameBroadcast.user_broadcast_game_details(user, game, game_user)
      end

      p "2"*100

    else
      reject
    end
  end

  def unsubscribed
    logger.info "📡 Utilisateur #{current_user.name} désouscrit du UserChannel"
  end
end 