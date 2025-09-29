class Api::V1::ActionsController < ApplicationController
  before_action :authenticate_request
  before_action :find_game
  before_action :find_game_user

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
        
        check_turn_completion_and_broadcast(existing_action)
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
      
      check_turn_completion_and_broadcast(action)
      
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

  def check_turn_completion_and_broadcast(action)
    current_turn = action.turn
    # Compter les actions avec le même turn dans la même game
    actions_count = Action.where(game_id: @game.id, turn: current_turn).count
    players_count = @game.game_users.count
    
    puts "📊 Actions du turn #{current_turn}: #{actions_count}/#{players_count}"
    
    if actions_count == players_count
      puts "🏆 Toutes les actions sont terminées pour ce turn, tentative de finalisation..."
      
      # PROTECTION RACE CONDITION : Verrou atomique sur le statut de la game
      turn_completed = false
      
      @game.transaction do
        @game.reload.lock!  # Verrou pessimiste sur la game
        
        # Vérifier que la game est encore en simultaneous_play
        if @game.simultaneous_play?
          puts "🔒 Verrou acquis, traitement de la fin du tour"

          # Incrémenter simultaneous_play_turn
          new_simultaneous_play_turn = @game.simultaneous_play_turn + 1
          @game.update!(simultaneous_play_turn: new_simultaneous_play_turn)
          puts "🎮 simultaneous_play_turn incrémenté: #{new_simultaneous_play_turn}"
          
          turn_completed = true
        else
          puts "⚠️ Un autre joueur a déjà finalisé ce tour (statut: #{@game.game_status})"
        end
      end
      
      # Broadcast SEULEMENT si ce thread a gagné le verrou
      if turn_completed
        puts "📡 Broadcasting des résultats du tour..."
        GameBroadcast.game_broadcast_game_details(@game.id)
        
        render json: {
          success: true,
          message: "Action #{action.created_at == action.updated_at ? 'créée' : 'mise à jour'} avec succès - Tour terminé",
          action: format_action_response(action),
          turn_completed: true
        }, status: action.created_at == action.updated_at ? :created : :ok
      else
        puts "📡 Tour déjà finalisé par un autre joueur, broadcast des détails actuels..."
        GameBroadcast.game_broadcast_game_details(@game.id)
        
        render json: {
          success: true,
          message: "Action #{action.created_at == action.updated_at ? 'créée' : 'mise à jour'} avec succès - Tour déjà terminé",
          action: format_action_response(action),
          turn_completed: true,
          already_completed: true
        }, status: action.created_at == action.updated_at ? :created : :ok
      end
    else
      puts "⏳ En attente des autres joueurs (#{actions_count}/#{players_count})"
      
      # Notifier ce joueur qu'il attend les autres
      GameBroadcast.user_broadcast_waiting_for_others(@current_user.id, @game.id)
      
      render json: {
        success: true,
        message: "Action #{action.created_at == action.updated_at ? 'créée' : 'mise à jour'} avec succès - En attente des autres joueurs",
        action: format_action_response(action),
        turn_completed: false,
        waiting_for_players: players_count - actions_count
      }, status: action.created_at == action.updated_at ? :created : :ok
    end
  end

  def format_action_response(action)
    response = {
      id: action.id,
      game_user_id: action.game_user_id,
      game_id: action.game_id,
      turn: action.turn,
      position_q: action.position_q,
      position_r: action.position_r,
      development_level: action.development_level,
      fortification_level: action.fortification_level,
      militarisation_level: action.militarisation_level,
      created_at: action.created_at
    }
    
    # Ajouter updated_at seulement si différent de created_at
    response[:updated_at] = action.updated_at if action.updated_at != action.created_at
    
    response
  end

end 