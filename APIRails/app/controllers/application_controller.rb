class ApplicationController < ActionController::API
  # L'authentification sera définie dans chaque contrôleur selon ses besoins

  private

  def authenticate_request
    puts "🔍 Vérification de l'authentification..."
    header = request.headers['Authorization']
    puts "📋 Header Authorization: #{header&.truncate(50) || 'AUCUN'}"
    
    if header.present?
      token = header.split(' ').last
      puts "🎫 Token extrait: #{token[0..20]}..."
      
      @current_user = User.find_by_token(token)
      
      if @current_user
        puts "✅ Utilisateur authentifié: #{@current_user.name} (ID: #{@current_user.id})"
      else
        puts "❌ Token invalide ou utilisateur non trouvé"
        render json: { success: false, message: 'Token invalide' }, status: :unauthorized
      end
    else
      puts "❌ Header Authorization manquant"
      render json: { success: false, message: 'Token manquant' }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end
end
