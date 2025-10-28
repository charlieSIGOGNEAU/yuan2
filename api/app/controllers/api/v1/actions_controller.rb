class Api::V1::ActionsController < ApplicationController
  before_action :authenticate_request
  before_action :find_game
  before_action :find_game_user

  # POST /api/v1/games/:game_id/actions
  # POST /api/v1/games/:game_id/actions
  def create  
    # Vérifier que le game_user_id correspond bien au joueur authentifié
    if action_params.key?(:game_user_id) && action_params[:game_user_id].present? && action_params[:game_user_id].to_i != @game_user.id
      puts "❌ Game user ID invalide: reçu #{action_params[:game_user_id]}, attendu #{@game_user.id}"
      render json: {
        success: false,
        message: "Accès non autorisé - game_user_id invalide"
      }, status: :forbidden
      return
    end

    # Vérifier que le turn correspond au simultaneous_play_turn de la game
    current_turn = @game.simultaneous_play_turn
    if action_params.key?(:turn) && action_params[:turn].present? && action_params[:turn].to_i != current_turn
      puts "❌ Turn invalide: reçu #{action_params[:turn]}, attendu #{current_turn}"
      render json: {
        success: false,
        message: "Turn invalide - vous devez jouer au tour actuel"
      }, status: :forbidden
      return
    end

    # Vérifier si une action existe déjà pour ce game_user et ce turn
    existing_action = Action.find_by(
      game_id: @game.id,
      game_user_id: @game_user.id,
      turn: current_turn
    )
    
    if existing_action
      puts "🔄 Mise à jour de l'action existante pour ce joueur à ce tour"
      updates = {}
      if action_params.key?(:position_q)
        updates[:position_q] = action_params[:position_q].present? ? action_params[:position_q].to_i : nil
      end
      if action_params.key?(:position_r)
        updates[:position_r] = action_params[:position_r].present? ? action_params[:position_r].to_i : nil
      end
      if action_params.key?(:development_level) && action_params[:development_level].present?
        updates[:development_level] = action_params[:development_level].to_i
      end
      if action_params.key?(:fortification_level) && action_params[:fortification_level].present?
        updates[:fortification_level] = action_params[:fortification_level].to_i
      end
      if action_params.key?(:militarisation_level) && action_params[:militarisation_level].present?
        updates[:militarisation_level] = action_params[:militarisation_level].to_i
      end
      existing_action.assign_attributes(updates)
      
      if existing_action.save
        puts "✅ Action mise à jour avec succès pour le joueur #{@game_user.user_name}"
        
        result = @game.check_turn_completion_and_broadcast(existing_action, @current_user)
        status_code = existing_action.created_at == existing_action.updated_at ? :created : :ok
        render json: result, status: status_code
      else
        error_msg = "Erreur lors de la mise à jour de l'action: #{existing_action.errors.full_messages.join(', ')}"
        puts "❌ #{error_msg}"
        
        render json: {
          success: false,
          message: error_msg,
          errors: existing_action.errors.full_messages
        }, status: :unprocessable_entity
      end
      return
    end

    # Créer la nouvelle action
    action = Action.new(
      game_id: @game.id,
      game_user_id: @game_user.id,
      turn: current_turn,
      position_q: action_params[:position_q].present? ? action_params[:position_q].to_i : nil,
      position_r: action_params[:position_r].present? ? action_params[:position_r].to_i : nil,
      development_level: action_params[:development_level].to_i,
      fortification_level: action_params[:fortification_level].to_i,
      militarisation_level: action_params[:militarisation_level].to_i
    )

    if action.save
      puts "✅ Action créée avec succès pour le joueur #{@game_user.user_name}"
      
      result = @game.check_turn_completion_and_broadcast(action, @current_user)
      status_code = action.created_at == action.updated_at ? :created : :ok
      render json: result, status: status_code
    else
      error_msg = "Erreur lors de la création de l'action: #{action.errors.full_messages.join(', ')}"
      puts "❌ #{error_msg}"
      
      render json: {
        success: false,
        message: error_msg,
        errors: action.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  

  private

  # Méthode pour autoriser les paramètres
  def action_params
    params.permit(:game_user_id, :game_id, :turn, :position_q, :position_r, 
                  :development_level, :fortification_level, :militarisation_level)
  end

  def find_game
    @game = Game.find(params[:game_id])
    puts "🎮 Jeu trouvé: #{@game.id}"
  rescue ActiveRecord::RecordNotFound
    puts "❌ Jeu non trouvé: #{params[:game_id]}"
    render json: {
      success: false,
      message: "Jeu non trouvé"
    }, status: :not_found
  end

  def find_game_user
    # Récupérer le game_user à partir du token d'authentification
    @game_user = @current_user.game_users.find_by(game_id: @game.id)
    
    if @game_user.nil?
      puts "❌ GameUser non trouvé pour l'utilisateur #{@current_user.id} dans le jeu #{@game.id}"
      render json: {
        success: false,
        message: "Vous ne participez pas à ce jeu"
      }, status: :forbidden
    else
      puts "👤 GameUser trouvé: #{@game_user.id} (#{@game_user.user_name})"
    end
  end

end 