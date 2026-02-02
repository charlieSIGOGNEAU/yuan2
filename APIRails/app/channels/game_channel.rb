# Channel principal pour les communications de jeu
class GameChannel < ApplicationCable::Channel

  # normalement, c'est aussi inutile car gere dans le UserChanel
  # def subscribed
  #   stream_from "user_#{current_user.id}"
  #   logger.info "📡 Utilisateur #{current_user.name} souscrit au GameChannel personel"
  # end

  # def unsubscribed
  #   logger.info "📡 Utilisateur #{current_user.name} désouscrit du GameChannel personel"
  # end
end 

# # Channel principal pour les communications de jeu
# class GameChannel < ApplicationCable::Channel
#   def subscribed
    
#     if params[:game_id].present?
#       game_id = params[:game_id].to_i
#       stream_from "game_#{game_id}"

#       logger.info "📡 Utilisateur #{current_user.name} souscrit au GameChannel pour Game #{game_id}"
#     else
#       stream_from "user_#{current_user.id}"
#       logger.info "📡 Utilisateur #{current_user.name} souscrit au GameChannel personel"
#     end
#   end

#   def unsubscribed
#     if params[:game_id].present?
#       logger.info "📡 Utilisateur #{current_user.name} désouscrit du GameChannel Game #{params[:game_id]}"
#     else
#       logger.info "📡 Utilisateur #{current_user.name} désouscrit du GameChannel personel"
#     end
#   end
# end 