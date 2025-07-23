class Api::V1::ClansController < ApplicationController
  before_action :authenticate_request
  before_action :find_game, only: [:create]

  # POST /api/v1/games/:game_id/clans
  def create
    puts "🏛️ Tentative de création des clans pour le jeu #{@game.id}"
    puts "📝 Données reçues: #{params[:clans]}"
    
    if params[:clans].blank?
      puts "❌ Aucune donnée de clan fournie"
      render json: {
        success: false,
        message: "Aucune donnée de clan fournie"
      }, status: :bad_request
      return
    end

    # Vérifier si des clans existent déjà pour ce jeu
    existing_clans = Clan.where(game_id: @game.id)
    
    if existing_clans.exists?
      puts "⚠️ Des clans existent déjà pour ce jeu (#{existing_clans.count} clans)"
      render json: {
        success: false,
        message: "Des clans existent déjà pour ce jeu",
        existing_clans_count: existing_clans.count
      }, status: :conflict
      return
    end

    # Créer tous les clans
    created_clans = []
    errors = []

    params[:clans].each_with_index do |clan_data, index|
      puts "🏘️ Création du clan #{index + 1}: #{clan_data[:name]} (#{clan_data[:color]})"
      
      clan = Clan.new(
        game_id: @game.id,
        name: clan_data[:name],
        color: clan_data[:color],
        start_q: clan_data[:start_q],
        start_r: clan_data[:start_r]
      )

      if clan.save
        created_clans << clan
        puts "✅ Clan #{clan.name} créé avec succès"
      else
        error_msg = "Erreur lors de la création du clan #{clan_data[:name]}: #{clan.errors.full_messages.join(', ')}"
        puts "❌ #{error_msg}"
        errors << error_msg
      end
    end

    if errors.empty?
      puts "🎉 Tous les clans ont été créés avec succès (#{created_clans.count} clans)"
      
      # Faire passer le jeu à la phase d'installation après création des clans
      @game.update(game_status: :bidding_phase )
      puts "🎮 Jeu #{@game.id} passé en phase bidding_phase "
      
      # Diffuser les changements à tous les joueurs
      GameBroadcast.game_broadcast_game_details(@game.id)
      
      render json: {
        success: true,
        message: "Tous les clans ont été créés avec succès",
        clans_count: created_clans.count,
        clans: created_clans.map do |clan|
          {
            id: clan.id,
            name: clan.name,
            color: clan.color,
            start_q: clan.start_q,
            start_r: clan.start_r
          }
        end
      }, status: :created
    else
      puts "💥 Erreurs lors de la création des clans"
      
      # Supprimer les clans créés en cas d'erreur partielle
      created_clans.each(&:destroy)
      
      render json: {
        success: false,
        message: "Erreurs lors de la création des clans",
        errors: errors
      }, status: :unprocessable_entity
    end
  end

  private

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
end 