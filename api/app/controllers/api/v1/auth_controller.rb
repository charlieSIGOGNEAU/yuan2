class Api::V1::AuthController < ApplicationController
  before_action :authenticate_request, except: [:login, :login_email, :signup]
  
  # POST /api/v1/auth/login (ancienne méthode - compatibilité)
  def login
    puts "🔐 Tentative de connexion avec: #{params[:name]}"
    
    if params[:name].present?
      # Chercher ou créer l'utilisateur
      user = User.find_by(name: params[:name])
      
      if user.nil?
        # Créer un nouvel utilisateur temporaire (pour tests)
        user = User.create(name: params[:name], email: "#{params[:name]}@temp.com", provider: 'email', password: 'password123')
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
            email: user.email,
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

  # POST /api/v1/auth/login_email
  def login_email
    puts "🔐 Tentative de connexion email avec: #{params[:email]}"
    
    if params[:email].blank? || params[:password].blank?
      puts "❌ Email ou mot de passe manquant"
      return render json: {
        success: false,
        message: "Email et mot de passe requis"
      }, status: :bad_request
    end

    user = User.find_by(email: params[:email], provider: 'email')
    
    if user && user.authenticate(params[:password])
      puts "✅ Connexion réussie pour: #{user.email}"
      token = user.generate_jwt_token
      
      render json: {
        success: true,
        message: "Connexion réussie",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          language: user.language
        },
        token: token
      }, status: :ok
    else
      puts "❌ Email ou mot de passe incorrect"
      render json: {
        success: false,
        message: "Email ou mot de passe incorrect"
      }, status: :unauthorized
    end
  end

  # POST /api/v1/auth/signup
  def signup
    puts "📝 Tentative d'inscription avec: #{params[:email]}"
    
    if params[:email].blank? || params[:password].blank?
      puts "❌ Email ou mot de passe manquant"
      return render json: {
        success: false,
        message: "Email et mot de passe requis"
      }, status: :bad_request
    end

    # Créer un nouvel utilisateur
    user = User.new(
      email: params[:email],
      password: params[:password],
      password_confirmation: params[:password],
      provider: 'email',
      language: params[:language] || 'fr'
    )

    if user.save
      puts "✅ Inscription réussie: #{user.email} (ID: #{user.id})"
      token = user.generate_jwt_token
      
      render json: {
        success: true,
        message: "Inscription réussie",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          language: user.language
        },
        token: token
      }, status: :created
    else
      puts "❌ Erreur inscription: #{user.errors.full_messages}"
      render json: {
        success: false,
        message: "Erreur lors de l'inscription",
        errors: user.errors.full_messages
      }, status: :unprocessable_entity
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
          email: current_user.email,
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