class Api::V1::TilesController < ApplicationController
  before_action :authenticate_request

  # POST /api/v1/games/:game_id/tiles/:id/place
  def place
    game = Game.find(params[:game_id])
    tile = game.tiles.find(params[:id])
    
    # Vérifier que la tile appartient bien au joueur actuel
    game_user = game.game_users.find_by(user: current_user)
    
    if tile.game_user_id != game_user.id
      render json: { success: false, error: 'Cette tile ne vous appartient pas' }, status: 403
      return
    end
    
    # Mettre à jour la tile
    if tile.update(
      name: params[:name],
      rotation: params[:rotation],
      position_q: params[:position_q],
      position_r: params[:position_r]
    )
      # Diffuser les changements à tous les joueurs
      GameBroadcast.game_broadcast_game_details(game.id)
      
      render json: { success: true, tile: tile }
    else
      render json: { success: false, errors: tile.errors }, status: 422
    end
  end
end 