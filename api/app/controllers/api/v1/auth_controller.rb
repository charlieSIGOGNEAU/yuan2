class Api::V1::AuthController < ApplicationController
  before_action :authenticate_request, except: [:login]
  
  # POST /api/v1/auth/login
  def login
    puts "🔐 Tentative de connexion avec: #{params[:name]}"
    
    if params[:name].present?
      # Chercher ou créer l'utilisateur
      user = User.find_by(name: params[:name])
      
      if user.nil?
        # Créer un nouvel utilisateur
        user = User.create(name: params[:name])
        puts "✅ Nouvel utilisateur créé: #{user.name} (ID: #{user.id})"
      else
        puts "✅ Utilisateur existant trouvé: #{user.name} (ID: #{user.id})"
      end
      
      if user.persisted?
        token = user.generate_jwt_token
        puts "🎫 Token généré pour #{user.name}"
        
        render json: {
          success: true,
          message: "Connexion réussie",
          user: {
            id: user.id,
            name: user.name,
            language: user.language
          },
          token: token
        }, status: :ok
      else
        puts "❌ Erreur création utilisateur: #{user.errors.full_messages}"
        render json: {
          success: false,
          message: "Erreur lors de la création de l'utilisateur",
          errors: user.errors.full_messages
        }, status: :unprocessable_entity
      end
    else
      puts "❌ Nom manquant"
      render json: {
        success: false,
        message: "Le nom est requis"
      }, status: :bad_request
    end
  end

  # GET /api/v1/auth/me
  def me
    if current_user
      puts "👤 Utilisateur authentifié: #{current_user.name}"
      render json: {
        success: true,
        user: {
          id: current_user.id,
          name: current_user.name,
          language: current_user.language
        }
      }
    else
      puts "❌ Utilisateur non authentifié"
      render json: {
        success: false,
        message: "Non authentifié"
      }, status: :unauthorized
    end
  end
end 