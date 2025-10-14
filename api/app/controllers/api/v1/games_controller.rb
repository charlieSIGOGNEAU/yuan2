class Api::V1::GamesController < ApplicationController
  before_action :authenticate_request
  before_action :set_game, only: [:submit_victory, :i_am_ready, :startGameAfterDelay, :launch_custom_game, :give_up_game]
  before_action :set_custom_code, only: [:join_game_custom]

  # POST /api/v1/games/quick_game
  def quick_game
    result = Game.find_or_create_waiting_game(current_user)
    game = result[:game]
    message = result[:message]
    game_user = result[:game_user]

    if game
      # GameBroadcast.user_broadcast_game_details(current_user.id, game, game_user.id)
      case message
      when "ongoing game"
        GameBroadcast.game_broadcast_game_details(game.id)

      when "game ready installation_phase"
        game_user.update(player_ready: true)
        GameBroadcast.game_broadcast_ready_to_play( game.id) 
      when "waiting for players"
        GameBroadcast.game_broadcast_waiting_for_players( game.id) 
        # GameBroadcast.user_broadcast_game_details(current_user.id, game.id, game_user.id)
      when "new game"
        GameBroadcast.game_broadcast_waiting_for_players(game.id)
        # GameBroadcast.user_broadcast_game_details(current_user.id, game.id, game_user.id)
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
      GameBroadcast.user_broadcast_game_details(current_user.id, game.id, game_user.id)

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
      # GameBroadcast.user_broadcast_game_details(current_user.id, game.id, game_user.id)
      GameBroadcast.game_broadcast_waiting_for_players(game.id)

    elsif message == "game not found"
      render json: { success: false, message: "Game not found" }
    elsif message == "joined game and waiting for other players"   
      game = result[:game]
      game_user = result[:game_user]
      render json: { success: true, game_id: game.id }
      # GameBroadcast.user_broadcast_game_details(current_user.id, game.id, game_user.id)
      GameBroadcast.game_broadcast_waiting_for_players(game.id)
    elsif message == "joined game and game ready installation_phase"
    end
  end

  def launch_custom_game
    game = @game
    user = current_user
    creator = game.creator
    if (user.id == creator.id && game.game_status == "waiting_for_players")
    result = game.launch_custom_game

    p "1"*100
    p result
    p "2"*100
    end
    if result[:message] == "go ready to play"
      render json: { success: true, game_id: game.id }
      game_user = game.game_users.find_by(user_id: user.id)
      game_user.update(player_ready: true)
      GameBroadcast.game_broadcast_ready_to_play(game.id)
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

    result = @game.start_game_after_delay
    message = result[:message]
    if message == "game ready installation_phase"
      render json: { success: true, message: "Game ready installation_phase" }
      GameBroadcast.game_broadcast_game_details(@game.id)
    else message == "missing player, waiting for player"
      render json: { success: false, message: "Missing player, waiting for player" }
    end
    if result[:user_of_game_users_destroyed]
      p "3"*100
      p result[:user_of_game_users_destroyed]
      p "3"*100
      result[:user_of_game_users_destroyed].each do |user|
        GameBroadcast.user_broadcast_player_destroyed(@game.id, user.id)
      end
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

end 