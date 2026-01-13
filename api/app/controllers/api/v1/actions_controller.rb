class Api::V1::ActionsController < ApplicationController
  before_action :authenticate_request
  before_action :prepare_action_params, only: [:create]
  before_action :find_game
  before_action :find_game_user
  before_action :validate_turn, only: [:create]
  

  # POST /api/v1/games/:game_id/actions
  def create  
    # Attributs à modifier/créer
  attrs = @action_params.slice(
    :position_q, :position_r, :development_level, :fortification_level, :militarisation_level
  )

    # Vérifier si une action existe déjà pour ce game_user et ce turn
    existing_action = Action.find_by(
      game_id: @game.id,
      game_user_id: @game_user.id,
      turn: @current_turn
    )
    
    if existing_action
      puts "🔄 Mise à jour de l'action existante"
      existing_action.assign_attributes(attrs)
      save_and_render(existing_action)
    else
      action = Action.new({ game_id: @game.id, game_user_id: @game_user.id, turn: @current_turn }.merge(attrs))
      save_and_render(action)
    end
  end

  private


  def prepare_action_params
    @action_params = action_params
  end

  # Méthode pour autoriser les paramètres
  def action_params
    permitted = params.permit(
      :game_user_id, :game_id, :turn, 
      :position_q, :position_r, 
      :development_level, :fortification_level, :militarisation_level
    )

    # Champs obligatoires
    [:game_user_id, :game_id, :turn].each do |key|
      value = permitted[key]
      raise ActionController::BadRequest, "#{key} est obligatoire" if value.nil?
      begin
        permitted[key] = Integer(value)
      rescue ArgumentError
        raise ActionController::BadRequest, "#{key} doit être un entier"
      end
    end

    # Champs optionnels mais forcés à 0 si nil
    [:development_level, :fortification_level, :militarisation_level].each do |key|
      value = permitted[key]
      if value.nil? || value == ""
        permitted[key] = 0
      else
        begin
          permitted[key] = Integer(value)
        rescue ArgumentError
          raise ActionController::BadRequest, "#{key} doit être un entier"
        end
      end
    end

    # position_q et position_r optionnels
    [:position_q, :position_r].each do |key|
      value = permitted[key]
      next if value.nil? || value == ""
      begin
        permitted[key] = Integer(value)
      rescue ArgumentError
        raise ActionController::BadRequest, "#{key} doit être un entier"
      end
    end

    permitted
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
      return
    end
  
    # Vérifier que le game_user_id dans les params correspond bien
    if action_params[:game_user_id] != @game_user.id
      puts "❌ GameUser ID dans params (#{action_params[:game_user_id]}) ne correspond pas au joueur authentifié #{@game_user.id}"
      render json: {
        success: false,
        message: "Accès non autorisé - game_user_id invalide"
      }, status: :forbidden
      return
    end
  
    puts "👤 GameUser trouvé et validé: #{@game_user.id} (#{@game_user.user_name})"
  end

  def validate_turn
    @current_turn = @game.simultaneous_play_turn
    turn_param = @action_params[:turn]
    
    if turn_param.nil? || turn_param.to_i != @current_turn
      puts "❌ Turn invalide: reçu #{turn_param}, attendu #{@current_turn}"
      render json: {
        success: false,
        message: "Turn invalide - vous devez jouer au tour actuel"
      }, status: :forbidden
    end
  end

  def save_and_render(action)
    success = Game.transaction do
      @game.reload.lock!  #pour s'assurer qu'un broadcast ne s'envois avec des information perimées
      current_turn = @game.simultaneous_play_turn
      if action.turn != current_turn
        render json: { success: false, message: "trop tard, le tour est déjà terminé" }, status: :forbidden
        false  
      elsif !action.save
        error_msg = "Erreur: #{action.errors.full_messages.join(', ')}"
        puts "❌ #{error_msg}"
        render json: { success: false, message: error_msg, errors: action.errors.full_messages }, status: :unprocessable_entity
        false
      else
        true  
      end
    end
  
    return unless success  # sort si la transaction a échoué, les render sont deja fais. mais pas de render si true
  
    puts "✅ Action enregistrée pour le joueur #{action.game_user.user_name}"
    result = @game.check_turn_completion_and_broadcast(action, @current_user)
    messages = {
      tour_finished: "Tour terminé avec succès",
      already_completed: "Le tour était déjà finalisé",
      still_waiting: "Action enregistrée, en attente des autres joueurs"
    }
    render json: {
      success: true,
      message: messages[result],
      turn_completed: [:tour_finished, :already_completed].include?(result),
      action: action.format_action_response()
      }, status: :ok
  end

end 