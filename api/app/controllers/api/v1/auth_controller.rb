class Api::V1::AuthController < ApplicationController
  before_action :authenticate_request, except: [:login, :login_email, :signup, :google_login]
  
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
            language: user.language,
            fps: user.fps
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
          language: user.language,
          fps: user.fps
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

    # Valider et normaliser la langue
    language = validate_language(params[:language])
    puts "🌍 Langue détectée pour le nouveau compte: #{language}"

    # Créer un nouvel utilisateur
    user = User.new(
      email: params[:email],
      password: params[:password],
      password_confirmation: params[:password],
      provider: 'email',
      language: language,
      fps: 20
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
          language: user.language,
          fps: user.fps
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

  # POST /api/v1/auth/google_login
  def google_login
    puts "🔐 Tentative de connexion Google"
    
    if params[:credential].blank?
      puts "❌ Token Google manquant"
      return render json: {
        success: false,
        message: "Token Google requis"
      }, status: :bad_request
    end

    begin
      # Vérifier le token Google
      validator = GoogleIDToken::Validator.new
      client_id = ENV['GOOGLE_CLIENT_ID']
      
      payload = validator.check(params[:credential], client_id)
      
      if payload.nil?
        puts "❌ Token Google invalide"
        return render json: {
          success: false,
          message: "Token Google invalide"
        }, status: :unauthorized
      end

      email = payload['email']
      name = payload['name'] || email.split('@').first
      google_id = payload['sub']
      
      puts "✅ Token Google vérifié pour: #{email}"
      
      # Chercher ou créer l'utilisateur
      user = User.find_by(email: email)
      
      if user.nil?
        # Valider et normaliser la langue
        language = validate_language(params[:language])
        puts "🌍 Langue détectée pour le nouveau compte Google: #{language}"
        
        # Créer un nouvel utilisateur Google
        user = User.new(
          email: email,
          name: name,
          provider: 'google',
          language: language,
          fps: 20
        )
        
        if user.save
          puts "✅ Nouvel utilisateur Google créé: #{user.email} (ID: #{user.id})"
        else
          puts "❌ Erreur création utilisateur Google: #{user.errors.full_messages}"
          return render json: {
            success: false,
            message: "Erreur lors de la création de l'utilisateur",
            errors: user.errors.full_messages
          }, status: :unprocessable_entity
        end
      else
        puts "✅ Utilisateur Google existant trouvé: #{user.email} (ID: #{user.id})"
      end
      
      # Générer le token JWT
      token = user.generate_jwt_token
      
      render json: {
        success: true,
        message: "Connexion Google réussie",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          language: user.language,
          fps: user.fps
        },
        token: token
      }, status: :ok
      
    rescue => e
      puts "❌ Erreur lors de la vérification du token Google: #{e.message}"
      render json: {
        success: false,
        message: "Erreur lors de la vérification du token Google"
      }, status: :internal_server_error
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
          language: current_user.language,
          fps: current_user.fps
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

  # POST /api/v1/auth/change_name
  def change_name
    puts "✏️ Tentative de changement de nom pour: #{current_user.name}"
    
    new_name = params[:new_name]
    password = params[:password]
    
    if new_name.blank?
      puts "❌ Nouveau nom manquant"
      return render json: {
        success: false,
        message: "Le nouveau nom est requis"
      }, status: :bad_request
    end
    
    if password.blank?
      puts "❌ Mot de passe manquant"
      return render json: {
        success: false,
        message: "Le mot de passe est requis"
      }, status: :bad_request
    end
    
    # Vérifier le mot de passe (seulement pour les utilisateurs email)
    if current_user.provider == 'email'
      unless current_user.authenticate(password)
        puts "❌ Mot de passe incorrect"
        return render json: {
          success: false,
          message: "Mot de passe incorrect"
        }, status: :unauthorized
      end
    end
    
    # Mettre à jour le nom
    if current_user.update(name: new_name)
      puts "✅ Nom changé avec succès: #{new_name}"
      render json: {
        success: true,
        message: "Nom changé avec succès",
        user: {
          id: current_user.id,
          name: current_user.name,
          email: current_user.email,
          language: current_user.language,
          fps: current_user.fps
        }
      }, status: :ok
    else
      puts "❌ Erreur lors du changement de nom: #{current_user.errors.full_messages}"
      render json: {
        success: false,
        message: "Erreur lors du changement de nom",
        errors: current_user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/auth/change_password
  def change_password
    puts "🔑 Tentative de changement de mot de passe pour: #{current_user.email}"
    
    current_password = params[:current_password]
    new_password = params[:new_password]
    
    # Vérifier que c'est un utilisateur email (Google n'a pas de password)
    if current_user.provider != 'email'
      puts "❌ Utilisateur Google ne peut pas changer de mot de passe"
      return render json: {
        success: false,
        message: "Les utilisateurs Google ne peuvent pas changer de mot de passe"
      }, status: :bad_request
    end
    
    if current_password.blank? || new_password.blank?
      puts "❌ Mot de passe actuel ou nouveau mot de passe manquant"
      return render json: {
        success: false,
        message: "Le mot de passe actuel et le nouveau mot de passe sont requis"
      }, status: :bad_request
    end
    
    if new_password.length < 6
      puts "❌ Nouveau mot de passe trop court"
      return render json: {
        success: false,
        message: "Le nouveau mot de passe doit contenir au moins 6 caractères"
      }, status: :bad_request
    end
    
    # Vérifier le mot de passe actuel
    unless current_user.authenticate(current_password)
      puts "❌ Mot de passe actuel incorrect"
      return render json: {
        success: false,
        message: "Mot de passe actuel incorrect"
      }, status: :unauthorized
    end
    
    # Mettre à jour le mot de passe
    if current_user.update(password: new_password, password_confirmation: new_password)
      puts "✅ Mot de passe changé avec succès"
      render json: {
        success: true,
        message: "Mot de passe changé avec succès"
      }, status: :ok
    else
      puts "❌ Erreur lors du changement de mot de passe: #{current_user.errors.full_messages}"
      render json: {
        success: false,
        message: "Erreur lors du changement de mot de passe",
        errors: current_user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/auth/delete_account
  def delete_account
    puts "🗑️ Tentative de suppression de compte pour: #{current_user.email}"
    
    password = params[:password]
    
    if password.blank?
      puts "❌ Mot de passe manquant"
      return render json: {
        success: false,
        message: "Le mot de passe est requis"
      }, status: :bad_request
    end
    
    # Vérifier le mot de passe (seulement pour les utilisateurs email)
    if current_user.provider == 'email'
      unless current_user.authenticate(password)
        puts "❌ Mot de passe incorrect"
        return render json: {
          success: false,
          message: "Mot de passe incorrect"
        }, status: :unauthorized
      end
    end
    
    # Supprimer l'utilisateur
    user_email = current_user.email
    if current_user.destroy
      puts "✅ Compte supprimé avec succès: #{user_email}"
      render json: {
        success: true,
        message: "Compte supprimé avec succès"
      }, status: :ok
    else
      puts "❌ Erreur lors de la suppression du compte: #{current_user.errors.full_messages}"
      render json: {
        success: false,
        message: "Erreur lors de la suppression du compte",
        errors: current_user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  private

  # Valider et normaliser la langue
  def validate_language(language)
    supported_languages = %w[fr en zh ja ko de es pt ru it]
    
    # Si la langue est fournie et supportée, l'utiliser
    if language.present? && supported_languages.include?(language.downcase)
      return language.downcase
    end
    
    # Fallback sur l'anglais
    puts "⚠️ Langue '#{language}' non supportée, fallback sur 'en'"
    'en'
  end
end 