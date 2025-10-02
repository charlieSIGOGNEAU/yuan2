class Api::V1::GameUsersController < ApplicationController
  before_action :authenticate_request
  before_action :set_game
  before_action :set_game_user

  # POST /api/v1/games/:game_id/game_users/:id/abandon
  def abandon
    # Vérifier que le game_user appartient bien à l'utilisateur actuel
    if @game_user.user_id != current_user.id
      render json: { success: false, message: "Unauthorized" }, status: 403
      return
    end

    # Vérifier que la partie n'est pas déjà terminée
    if @game.completed? || @game.end_dispute?
      render json: { success: false, message: "Game already finished" }, status: 422
      return
    end

    # Vérifier que le joueur n'a pas déjà abandonné
    # if @game_user.abandoned?
    #   render json: { success: false, message: "You already abandoned this game" }, status: 422
    #   return
    # end

    # Marquer le game_user comme ayant abandonné
    if @game_user.update(abandoned: true)
      # Optionnel : broadcaster l'information aux autres joueurs
      # GameBroadcast.game_broadcast_player_abandoned(@game.id, @game_user.id)
      
      render json: { 
        success: true, 
        message: "Game abandoned successfully"
      }
    else
      render json: { 
        success: false, 
        message: "Failed to abandon game",
        errors: @game_user.errors.full_messages 
      }, status: 422
    end
    GameBroadcast.user_broadcast_player_abandoned(@game.id, @game_user.id)
  end

  private

  def set_game
    @game = Game.find(params[:game_id])
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, message: "Game not found" }, status: 404
  end

  def set_game_user
    @game_user = @game.game_users.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { success: false, message: "Game user not found" }, status: 404
  end
end

