# Channel pour les communications personnalisées aux utilisateurs
class UserChannel < ApplicationCable::Channel
  def subscribed
    if params[:user_id].present? && params[:user_id].to_i == current_user.id
      stream_from "user_#{current_user.id}"
      logger.info "📡 Utilisateur #{current_user.name} souscrit au UserChannel"
    else
      reject
    end
  end

  def unsubscribed
    logger.info "📡 Utilisateur #{current_user.name} désouscrit du UserChannel"
  end
end 