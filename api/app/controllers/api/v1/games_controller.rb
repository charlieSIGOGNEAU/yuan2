class Api::V1::GamesController < ApplicationController
  before_action :authenticate_request
  before_action :set_game, only: [:submit_victory]

  # POST /api/v1/games/quick_game
  def quick_game
    result = Game.find_or_create_waiting_game(current_user)
    game = result[:game]
    message = result[:message]
    game_user = result[:game_user]

    if game
      GameBroadcast.user_broadcast_game_details(current_user.id, game.id, game_user.id)

      case message
      when "ongoing game"
      when "game ready installation_phase"
        GameBroadcast.game_broadcast_game_details(game.id)
      when "waiting for players"
        GameBroadcast.game_broadcast_new_player(game.id, game_user.id) 
      when "new game"
      end
      render json: { success: true, game_id: game.id }
    else
      render json: { success: false }, status: 422
    end
  end

  # POST /api/v1/games/:id/submit_victory
  def submit_victory
    # Vérifier si le jeu est déjà terminé
    if @game.completed? || @game.end_dispute?
      render json: { success: false, message: "Game already finished" }
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
          # Un utilisateur a déjà soumis les résultats, on compare
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

  def set_game
    @game = Game.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, message: "Game not found" }, status: 404
  end

end 