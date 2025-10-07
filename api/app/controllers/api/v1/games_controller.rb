class Api::V1::GamesController < ApplicationController
  before_action :authenticate_request
  before_action :set_game, only: [:submit_victory, :join_game_custom]
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
        GameBroadcast.game_broadcast_game_details(game)

      when "game ready installation_phase"
        GameBroadcast.game_broadcast_game_details(game)
      when "waiting for players"
        GameBroadcast.game_broadcast_new_player(game, game_user) 
      when "new game"
      end
      render json: { success: true, game_id: game.id }
    else
      render json: { success: false }, status: 422
    end
  end

  def custom_game
    result = Game.custom_game(current_user)
    message = result[:message]
    game = result[:game]
    game_user = result[:game_user]

    if message == "ongoing game"
      render json: { success: false, message: "You are already in a game" }
      GameBroadcast.user_broadcast_game_details(current_user.id, game.id, game_user.id)
    elsif message == "new game"
      render json: { success: true, game_id: game.id, game_user_id: game_user.id, custom_code: result[:custom_code] }
    end
  end

  def join_game_custom
    result = Game.ongoing_game_custom(current_user,@custom_code)
    message = result[:message]

    if message == "ongoing game"
      render json: { success: false, message: "You are already in a game" }
      game = result[:game]
      game_user = result[:game_user]
      GameBroadcast.user_broadcast_game_details(current_user.id, game.id, game_user.id)
    elsif message == "game not found"
      render json: { success: false, message: "Game not found" }
    elsif message == "joined game and waiting for other players"
      render json: { success: true, game_id: game.id }
      game = result[:game]
      game_user = result[:game_user]
      GameBroadcast.user_broadcast_game_details(current_user.id, game.id, game_user.id)
    elsif message == "joined game and game ready installation_phase"
    end
  end

  def launch_custom_game
    result = Game.launch_custom_game(current_user,@custom_code)



    if result
      game = result[:game]
      game_user = result[:game_user]
      GameBroadcast.user_broadcast_game_details(current_user.id, game, game_user.id)
      render json: { success: false, game_id: game.id }
    end
    
    game = Game.find(params[:game_id])
    if game

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

  private
  def set_player_count
    @player_count = params[:player_count]
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, message: "Player count not found" }, status: 404
  end

  def set_game
    @game = Game.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, message: "Game not found" }, status: 404
  end

  def set_custom_code
    @custom_code = params[:custom_code]
  end

end 