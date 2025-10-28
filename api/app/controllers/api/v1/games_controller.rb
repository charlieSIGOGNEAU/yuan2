class Api::V1::GamesController < ApplicationController
  before_action :authenticate_request
  before_action :set_game, only: [:submit_victory, :i_am_ready, :startGameAfterDelay, :launch_custom_game, :give_up_game, :force_end_turn]
  before_action :set_game_duration, only: [:launch_custom_game]
  before_action :set_custom_code, only: [:join_game_custom]

  # POST /api/v1/games/quick_game
  def quick_game
    result = Game.find_or_create_waiting_game(current_user)
    game = result[:game]
    message = result[:message]
    game_user = result[:game_user]
  

    if game
      case message
      when "ongoing game"
        GameBroadcast.game_broadcast_game_details(game.id)

      when "game ready installation_phase"
        game_user.update(player_ready: true)
        GameBroadcast.game_broadcast_ready_to_play( game.id) 
      when "waiting for players"
        GameBroadcast.game_broadcast_waiting_for_players( game.id) 
      when "new game"
        GameBroadcast.game_broadcast_waiting_for_players(game.id)
      end
      render json: { success: true, game_id: game.id }
    else
      render json: { success: false }, status: 422
    end
  end

  def creat_custom_game
    p "3"*100
    result = Game.creat_custom_game(current_user)
    message = result[:message]
    p "3"*100
    game = result[:game]
    game_user = result[:game_user]
    p "3"*100

    if message == "ongoing game"
      render json: { success: false, message: "You are already in a game", game_id: game.id, game_user_id: game_user.id, custom_code: game.custom_code, waiting_players_count: game.waiting_players_count }
      GameBroadcast.user_broadcast_game_details(current_user.id, game.id)

    elsif message == "new game"
      render json: { success: true, game_id: game.id, game_user_id: game_user.id, custom_code: result[:custom_code], waiting_players_count: game.waiting_players_count }
      GameBroadcast.game_broadcast_waiting_for_players(game.id)
    end
  end

  def join_game_custom
    result = Game.ongoing_game_custom(current_user,@custom_code)
    message = result[:message]

    if message == "ongoing game"
      render json: { success: false, message: "You are already in a game" }
      game = result[:game]
      game_user = result[:game_user]
      GameBroadcast.game_broadcast_waiting_for_players(game.id)

    elsif message == "game not found"
      render json: { success: false, message: "Game not found" }
    elsif message == "joined game and waiting for other players"   
      game = result[:game]
      game_user = result[:game_user]
      render json: { success: true, game_id: game.id }
      GameBroadcast.game_broadcast_waiting_for_players(game.id)
    else
      render json: { success: false, message: message }
    end
  end

  def launch_custom_game
    game = @game
    game_duration = @game_duration
    user = current_user
    creator = game.creator
    p "0"*100
    p game_duration
    p user.id
    p creator.id
    p game.game_status
    p "0"*100
    if (user.id == creator.id && game.game_status == "waiting_for_players")
      result = game.launch_custom_game(game_duration)
      p "1"*100
      p result
      p "2"*100
    
      if result[:message] == "go ready to play"
        render json: { success: true, game_id: game.id }
        game_user = game.game_users.find_by(user_id: user.id)
        game_user.update(player_ready: true)
        GameBroadcast.game_broadcast_ready_to_play(game.id)
      
      else
        render json: { success: false, message: result[:message]}
      end
    else
      render json: { success: false, message: "Game not in waiting_for_players"}
    end
  end

  def i_am_ready
    # game = Game.find(params[:game_id])
    game = @game
    game_user = game.game_users.find_by(user_id: current_user.id)
    result = game.i_am_ready(game_user)
    message = result[:message]
    if message == "player ready and game full"
      render json: { success: true, message: "Game ready installation_phase" }
      GameBroadcast.game_broadcast_game_details(game.id)
    elsif message == "player ready and game not full"
      render json: { success: true, message: "player ready and game not full" }
      GameBroadcast.game_broadcast_ready_to_play( game.id) 
    else
      render json: { success: false, message: "Game not in waiting_for_confirmation_players" }
    end
  end
    
  # POST /api/v1/games/:id/submit_victory
  def submit_victory
    # Vérifier si le jeu est déjà terminé
    if @game.completed? || @game.end_dispute?
      render json: { success: true, message: "Game already finished" }
      return
    end

    rankings = params[:rankings] # Array of {game_user_id: id, rank: rank}
    
    # Utiliser une transaction avec lock pour éviter les conditions de course
    begin
      @game.transaction do
        @game.lock!
        
        if @game.submitted_by_user_id.nil?
          # Premier utilisateur à soumettre les résultats
          rankings.each do |ranking|
            game_user = @game.game_users.find(ranking[:game_user_id])
            game_user.update!(rank: ranking[:rank])
          end
          
          @game.update!(submitted_by_user_id: current_user.id)
          
          render json: { success: true, message: "Rankings submitted successfully" }
        else
          # Un utilisateur a déjà soumis les résultats, vérifier que c'est un utilisateur différent
          if @game.submitted_by_user_id == current_user.id
            render json: { success: false, message: "You already submitted the rankings. Another player must validate." }
            return
          end
          
          # Comparer les classements soumis par les deux utilisateurs différents
          existing_rankings = @game.game_users.pluck(:id, :rank).to_h
          submitted_rankings = rankings.map { |r| [r[:game_user_id].to_i, r[:rank].to_i] }.to_h
          
          if existing_rankings == submitted_rankings
            # Les classements correspondent, on marque le jeu comme terminé
            @game.update!(game_status: :completed)
            render json: { success: true, message: "Game completed successfully" }
          else
            # Les classements ne correspondent pas, on marque le jeu en dispute
            @game.update!(game_status: :end_dispute)
            render json: { success: false, message: "Rankings don't match, game marked as disputed" }
          end
        end
      end
    rescue ActiveRecord::RecordInvalid => e
      render json: { success: false, message: "Invalid data: #{e.message}" }, status: 422
    rescue => e
      render json: { success: false, message: "Error processing victory submission: #{e.message}" }, status: 500
    end
  end

  def startGameAfterDelay
    p "4"*100
    p @game.game_status
    p "4"*100
    if @game.game_status == "waiting_for_confirmation_players"
      result = @game.start_game_after_delay
      message = result&.[](:message)
      if message == "game ready installation_phase"
        render json: { success: true, message: "Game ready installation_phase" }
        GameBroadcast.game_broadcast_game_details(@game.id)
      elsif message == "missing player, waiting for player"
        render json: { success: false, message: "Missing player, waiting for player" }
        GameBroadcast.game_broadcast_waiting_for_players(@game.id)
      elsif message == "game destroyed"
        render json: { success: false, message: "Game destroyed" }  
      end
      if result&.[](:user_of_game_users_destroyed)
        result[:user_of_game_users_destroyed].each do |user|
          GameBroadcast.user_broadcast_player_destroyed(@game.id, user.id)
        end
      end
    else
      render json: { success: false, message: "Game not in waiting_for_confirmation_players" }
    end
  end

  def give_up_game
    game = @game
    game_user = game.game_users.find_by(user_id: current_user.id)
    result = game.give_up_game(game_user)
    message = result[:message]
    case message
    when "player give up"
      render json: { success: true, message: "Player give up" }
      if game.game_status == "waiting_for_players"
      GameBroadcast.game_broadcast_waiting_for_players(game.id)
      else
        GameBroadcast.game_broadcast_ready_to_play(game.id)
      end
    when "player give up and game ready installation_phase"
      render json: { success: true, message: "player give up and game ready installation_phase" }
      GameBroadcast.game_broadcast_game_details(game.id)
    when "player give up and game waiting for players"
      render json: { success: true, message: "player give up and game waiting for players" }
      GameBroadcast.game_broadcast_waiting_for_players(game.id)
    when "player not found"
      render json: { success: false, message: "Player not found" }
    when "game destroyed"
      render json: { success: true, message: "nothing player left, game destroyed" }
    end


  end

  # POST /api/v1/games/confirm_game_details_reception
  # Confirme la réception d'un broadcast game_details
  def confirm_game_details_reception
    game_user_id = params[:game_user_id]
    game_id = params[:game_id]
    
    unless game_user_id && game_id
      render json: { success: false, message: "Missing parameters" }, status: 400
      return
    end
    
    # Vérifier que le current_user correspond au game_user
    game_user = GameUser.find_by(id: game_user_id)
    
    unless game_user && game_user.user_id == current_user.id
      render json: { success: false, message: "Unauthorized" }, status: 403
      return
    end
    
    # Confirmer la réception
    confirmed = BroadcastConfirmationService.confirm_reception(game_user_id)
    
    if confirmed
      render json: { success: true, message: "Confirmation reçue" }
    else
      render json: { success: true, message: "Aucun broadcast en attente" }
    end
  rescue => e
    Rails.logger.error "❌ Erreur lors de la confirmation: #{e.message}"
    render json: { success: false, message: e.message }, status: 500
  end

  def force_end_turn
    game = @game

    if params[:simultaneous_play_turn].nil?
      puts "⚠️ Paramètre manquant: simultaneous_play_turn"
      render json: {
        success: false,
        message: "Paramètre 'simultaneous_play_turn' manquant"
      }, status: :bad_request
      return
    end

    if game.simultaneous_play_turn != params[:simultaneous_play_turn]
      p "1"*100
      render json: {
        success: false,
        message: "Mauvais tour"
      }, status: :ok
      return
    end

    if game.updated_at > (game.turn_duration ).seconds.ago
      p "2"*100
      p game.updated_at
      p game.turn_duration.seconds.ago
      p "2"*100
      render json: {
        success: false,
        message: "Tour non forcément terminé"
      }, status: :ok
    
    else
      result = Action.force_end_turn(game,params[:simultaneous_play_turn])
      if result == "some players did not play this turn"
        render json: {
          success: true,
          message: result
        }, status: :ok
        GameBroadcast.game_broadcast_game_details(game.id)
      else
        render json: {
          success: false,
          message: result
        }, status: :ok
      end
    end
  end

  private
  def set_player_count
    @player_count = params[:player_count]
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, message: "Player count not found" }, status: 404
  end

  def set_game
    id = params[:id] || params[:game_id]
    @game = Game.find(id)
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, message: "Game not found" }, status: 404
  end

  def set_custom_code
    @custom_code = params[:custom_code]
  end

  def set_game_duration
    @game_duration = params[:game_duration].to_i || 120
  end

end 