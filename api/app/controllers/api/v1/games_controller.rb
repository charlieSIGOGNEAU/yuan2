class Api::V1::GamesController < ApplicationController
  before_action :authenticate_request

  # POST /api/v1/games/quick_game
  def quick_game
    game = Game.find_or_create_waiting_game(current_user)
    p "#" *111
    p game.id
    p "#" *111

    if game
      render json: {
        success: true,
        game: game_with_details(game),
        message: "Partie trouvée/créée avec succès"
      }
    else
      render json: {
        success: false,
        message: "Impossible de créer ou rejoindre une partie"
      }, status: 422
    end
  end

  private

  def game_with_details(game)
    {
      id: game.id,
      game_status: game.game_status,
      game_type: game.game_type,
      player_count: game.player_count,
      current_players_count: game.game_users.count,
      game_users: game.game_users.includes(:user).map do |game_user|
        {
          id: game_user.id,
          user_id: game_user.user_id,
          user_name: game_user.user.name
        }
      end,
      tiles: game.tiles.map do |tile|
        {
          id: tile.id,
          game_user_id: tile.game_user_id,
          turn: tile.turn
        }
      end
    }
  end
end 