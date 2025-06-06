class Api::V1::GamesController < ApplicationController
  before_action :authenticate_request

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
      when "game ready simultaneous_play"
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

  # une methode de recuperation de donne de la partie en fonction de l'id de la partie

 


end 