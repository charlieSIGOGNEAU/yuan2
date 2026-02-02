module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      # Récupérer le token depuis les paramètres
      token = request.params[:token]
      
      if token.blank?
        reject_unauthorized_connection
      end

      begin
        # Décoder le JWT
        decoded_token = JWT.decode(token, Rails.application.secret_key_base.to_s, true, { algorithm: 'HS256' })
        user_id = decoded_token[0]['user_id']
        
        user = User.find(user_id)
        
        if user
          user
        else
          reject_unauthorized_connection
        end
      rescue JWT::DecodeError, ActiveRecord::RecordNotFound
        reject_unauthorized_connection
      end
    end

    def disconnect
      puts "🔌 WebSocket déconnecté: #{current_user&.name}"
      logger.info "🔌 WebSocket déconnecté: #{current_user&.name}"
    end
  end
end
