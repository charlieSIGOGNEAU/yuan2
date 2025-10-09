class Api::V1::BiddingController < ApplicationController
  before_action :authenticate_request
  before_action :find_game
  before_action :find_game_user

  # POST /api/v1/games/:game_id/bidding
  def create
    p "#"*111
    puts "💰 Tentative de création d'une enchère pour le jeu #{@game.id} par le joueur #{@game_user.id}"
    puts "📝 Données reçues: chao=#{bidding_params[:chao]}, turn=#{bidding_params[:turn]}, clan_id=#{bidding_params[:clan_id]}"
    puts "🎮 biddings_turn actuel: #{@game.biddings_turn}"
    
    # Vérifier que le game_user_id correspond bien au joueur authentifié
    if bidding_params[:game_user_id].to_i != @game_user.id
      puts "❌ Game user ID invalide: reçu #{bidding_params[:game_user_id]}, attendu #{@game_user.id}"
      render json: {
        success: false,
        message: "Accès non autorisé - game_user_id invalide"
      }, status: :forbidden
      return
    end

    # Utiliser biddings_turn comme turn si turn n'est pas spécifié
    current_turn = bidding_params[:turn] || @game.biddings_turn
    puts "🎯 Turn utilisé: #{current_turn}"

    # Vérifier si une enchère existe déjà pour ce game_user et ce turn
    existing_bidding = Bidding.find_by(
      game_id: @game.id,
      game_user_id: @game_user.id,
      turn: current_turn
    )
    
    if existing_bidding
      puts "🔄 Mise à jour de l'enchère existante pour ce joueur à ce tour"
      existing_bidding.chao = bidding_params[:chao].to_i
      existing_bidding.clan_id = bidding_params[:clan_id]  # Mettre à jour le clan_id
      
      if existing_bidding.save
        puts "✅ Enchère mise à jour avec succès: #{existing_bidding.chao} chao pour le joueur #{@game_user.user_name}"
        
        # Vérifier si le tour est terminé
        check_turn_completion_and_broadcast(existing_bidding)
        
      else
        error_msg = "Erreur lors de la mise à jour de l'enchère: #{existing_bidding.errors.full_messages.join(', ')}"
        puts "❌ #{error_msg}"
        
        render json: {
          success: false,
          message: error_msg,
          errors: existing_bidding.errors.full_messages
        }, status: :unprocessable_entity
      end
      return
    end

    # Créer la nouvelle enchère
    bidding = Bidding.new(
      game_id: @game.id,
      game_user_id: @game_user.id,
      chao: bidding_params[:chao].to_i,
      turn: current_turn,
      victory: false,
      clan_id: bidding_params[:clan_id]  # Ajouter le clan_id
    )

    if bidding.save
      puts "✅ Enchère créée avec succès: #{bidding.chao} chao pour le joueur #{@game_user.user_name}"
      
      check_turn_completion_and_broadcast(bidding)
    else
      error_msg = "Erreur lors de la création de l'enchère: #{bidding.errors.full_messages.join(', ')}"
      puts "❌ #{error_msg}"
      
      render json: {
        success: false,
        message: error_msg,
        errors: bidding.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  private

  # Méthode pour autoriser les paramètres
  def bidding_params
    # Gérer les paramètres imbriqués dans "bidding" ou de premier niveau
    if params[:bidding]
      params.require(:bidding).permit(:chao, :turn, :game_user_id, :clan_id)
    else
      # Permettre aussi game_id et bidding pour éviter les warnings
      params.permit(:chao, :turn, :game_user_id, :clan_id, :game_id, :bidding)
    end
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

  def check_turn_completion_and_broadcast(bidding)
    current_turn = bidding.turn
    # Utilisation de l'association pour optimiser la requête SQLite
    biddings_count = @game.biddings.where(turn: current_turn).count
    players_count = @game.game_users.count
    
    puts "📊 Enchères du turn #{current_turn}: #{biddings_count}/#{players_count}"
    
    if biddings_count == players_count - current_turn + 1
      puts "🏆 Toutes les enchères sont terminées pour ce turn, tentative de finalisation..."
      
      # DÉTERMINER LE GAGNANT AVANT LE VERROU (optimisation)
      winning_bidding = @game.biddings.where(turn: current_turn)
                             .order(chao: :desc, id: :asc)
                             .first
      
      puts "🎯 Gagnant potentiel identifié: #{winning_bidding&.game_user&.user_name} avec #{winning_bidding&.chao} chao"
      
      # Récupérer le clan_id depuis les paramètres de l'enchère gagnante
      if winning_bidding
        # Chercher l'enchère avec le clan_id dans les paramètres
        winning_bidding_with_clan = @game.biddings.where(turn: current_turn)
                                         .joins(:game_user)
                                         .where("biddings.clan_id IS NOT NULL")
                                         .order(chao: :desc, id: :asc)
                                         .first
        
        if winning_bidding_with_clan
          winning_bidding = winning_bidding_with_clan
          puts "🎯 Enchère gagnante avec clan_id trouvée: #{winning_bidding.clan_id}"
        end
      end
      
      # PROTECTION RACE CONDITION : Verrou atomique sur le statut de la game
      winner_determined = false
      
      @game.transaction do
        @game.reload.lock!  # Verrou pessimiste sur la game
        
        # Vérifier que la game est encore en bidding_phase
        if @game.bidding_phase?
          puts "🔒 Verrou acquis, traitement de la victoire d'enchère"

          # Incrémenter biddings_turn
          new_biddings_turn = @game.biddings_turn + 1
          @game.update!(biddings_turn: new_biddings_turn)
          puts "🎮 biddings_turn incrémenté: #{new_biddings_turn}"
          
          # Attribuer le clan_id au game_user gagnant
          if winning_bidding
            winning_game_user = winning_bidding.game_user
            clan_id = winning_bidding.clan_id  # Utiliser le clan_id de l'enchère gagnante
            
            if clan_id
              winning_game_user.update!(clan_id: clan_id)
              winner_name = winning_game_user.user_name
              puts "🎉 Clan #{clan_id} attribué au gagnant #{winner_name} avec #{winning_bidding.chao} chao"
            else
              puts "⚠️ Aucun clan_id trouvé dans l'enchère gagnante"
            end
            
            # Marquer l'enchère comme victorieuse
            winning_bidding.update!(victory: true)
            winner_determined = true
          end
          
          # Vérifier si tous les tours d'enchères sont terminés
          if new_biddings_turn > @game.player_count
            puts "🏁 Tous les tours d'enchères terminés, passage en simultaneous_play"
            @game.update!(game_status: :simultaneous_play, simultaneous_play_turn: 1)
            puts "🎮 Statut de la game changé: bidding_phase → simultaneous_play"
          end
        else
          puts "⚠️ Un autre joueur a déjà finalisé ce tour (statut: #{@game.game_status})"
        end
      end
      
      # Broadcast SEULEMENT si ce thread a gagné le verrou
      if winner_determined
        puts "📡 Broadcasting des résultats du tour..."
        GameBroadcast.game_broadcast_game_details(@game.id)
        
        render json: {
          success: true,
          message: "Enchère #{bidding.created_at == bidding.updated_at ? 'créée' : 'mise à jour'} avec succès - Tour terminé",
          bidding: format_bidding_response(bidding),
          turn_completed: true,
          winning_bidding_id: winning_bidding&.id,
          new_game_status: "starting_spot_selection"
        }, status: bidding.created_at == bidding.updated_at ? :created : :ok
      else
        puts "📡 Tour déjà finalisé par un autre joueur, broadcast des détails actuels..."
        GameBroadcast.game_broadcast_game_details(@game.id)
        
        render json: {
          success: true,
          message: "Enchère #{bidding.created_at == bidding.updated_at ? 'créée' : 'mise à jour'} avec succès - Tour déjà terminé",
          bidding: format_bidding_response(bidding),
          turn_completed: true,
          already_completed: true
        }, status: bidding.created_at == bidding.updated_at ? :created : :ok
      end
    else
      puts "⏳ En attente des autres joueurs (#{biddings_count}/#{players_count})"
      
      # Notifier ce joueur qu'il attend les autres
      GameBroadcast.user_broadcast_waiting_for_others(@current_user.id, @game.id)
      
      render json: {
        success: true,
        message: "Enchère #{bidding.created_at == bidding.updated_at ? 'créée' : 'mise à jour'} avec succès - En attente des autres joueurs",
        bidding: format_bidding_response(bidding),
        turn_completed: false,
        waiting_for_players: players_count - biddings_count
      }, status: bidding.created_at == bidding.updated_at ? :created : :ok
    end
  end

  def format_bidding_response(bidding)
    response = {
      id: bidding.id,
      game_user_id: bidding.game_user_id,
      chao: bidding.chao,
      turn: bidding.turn,
      victory: bidding.victory,
      created_at: bidding.created_at
    }
    
    # Ajouter updated_at seulement si différent de created_at
    response[:updated_at] = bidding.updated_at if bidding.updated_at != bidding.created_at
    
    response
  end
end 