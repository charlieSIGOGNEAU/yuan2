class Game < ApplicationRecord
    enum :game_status, {
      waiting_for_players: 0,
      waiting_for_confirmation_players: 1,
      installation_phase: 2,
      initial_placement: 3,
      bidding_phase: 4,
      starting_spot_selection: 5,
      simultaneous_play: 6,
      completed: 7,
      abandoned: 8,
      end_dispute: 9
    }, default: :waiting_for_players
  
    enum :game_type, {
      quick_game: 0,
      custom_game: 1
    }, default: :quick_game

  belongs_to :creator, class_name: 'User', optional: true
  
  has_many :game_users, dependent: :destroy
  has_many :users, through: :game_users
  has_many :tiles, dependent: :destroy
  has_many :actions, dependent: :destroy
  has_many :clans, dependent: :destroy
  has_many :biddings, dependent: :destroy
  belongs_to :submitted_by_user, class_name: 'User', optional: true
  
  validates :game_status, presence: true
  validates :game_type, presence: true
  validates :player_count, presence: true, numericality: { only_integer: true}

  # on verrifi si les 20s sont ecoule et lance la partie
  def start_game_after_delay
    # on peux probablement optimiser cette transaction et lock, mais elle ne devrais pas arriver souvent
    game_users_ready_count = self.game_users.where(player_ready: true).count
    if game_users_ready_count >= 2
      transaction do
        self.lock!
        if (self.game_status == "waiting_for_confirmation_players") && (self.updated_at < 20.seconds.ago)
          game_users = self.game_users
          user_of_game_users_destroyed = []
          game_users.each do |game_user|
            unless game_user.player_ready
              game_user.lock!
              user = game_user.user
              user_of_game_users_destroyed << user
              game_user.destroy
              self.waiting_players_count -= 1
              self.save!
            end
          end
          self.player_count = self.waiting_players_count
          self.save!
          self.start_installation_phase()   
          return {message: "game ready installation_phase", user_of_game_users_destroyed: user_of_game_users_destroyed}
        else
          return {message: "unexpired timeout"}
        end
      end
    elsif self.waiting_players_count == 0
      self.destroy
      return {message: "game destroyed"}
    else
      self.game_status = "waiting_for_players"
      self.save!
      return {message: "missing player, waiting for player"}
    end
  end

  # fonction a imbrique dans une transaction avec un lock de la game pour etre sur que la game est bien en status waiting_for_confirmation_players
  # on lance la phase d'installation, creation de Tiles, liste des clans
  def start_installation_phase()
      self.game_status = "installation_phase"
      self.player_count = self.game_users.where(player_ready: true).count
      self.save!
      self.create_tiles_for_players()
      self.clan_names = the_clans()
      self.save!
  end

  # si possible on mes le joueur a ready to  et si touts les joueurs sont ready on lance la phase d'installation
  def i_am_ready(game_user)
    transaction do
      self.lock!
      if self.game_status == "waiting_for_confirmation_players"
        game_user.update(player_ready: true)
        game_users_ready = game_users.where(player_ready: true)
        if game_users_ready.count == self.player_count
          start_installation_phase()
          return {message: "player ready and game full"}
        else
          return {message: "player ready and game not full"}
        end
      else
        return {message: "game not in waiting_for_confirmation_players"}
      end
    end
  end

  # verrifie si l'utilisateur a une partie en cours
  def self.ongoing_game(user)
    existing_game_for_user = Game.joins(:game_users)
                                  .where(game_users: { user_id: user.id, abandoned: false })
                                  .where.not(game_status: [:completed, :abandoned])
                                  .first
    if existing_game_for_user
      game_user = existing_game_for_user.game_users.find_by(user_id: user.id)
      if existing_game_for_user.game_status == "waiting_for_confirmation_players"
        return {game: existing_game_for_user, game_user: game_user, message: "waiting for confirmation players"}
      end
      return {game: existing_game_for_user, game_user: game_user, message: "ongoing game"}
    end
    return nil
  end

  # on atribu les clan disponible en fonction du nombre de joueur 
  def the_clans()
    clans = ["black_clan","red_clan","green_clan","orange_clan","white_clan","blue_clan","purple_clan","yellow_clan"]
    clans.take(self.player_count).join(" ")
  end

  def self.find_or_create_waiting_game(user)
    # verrifie si l'utilisateur a une partie en cours
    ongoing_game = self.ongoing_game(user)
    return ongoing_game if ongoing_game

    attempts = 0

    # loop pour les race conditions
    loop do
      attempts += 1
      raise "Too many attempts" if attempts > 3

      # Si on ne peut pas rejoindre la partie, on cherche une autre partie
      waiting_game = where(game_status: :waiting_for_players, game_type: :quick_game).first

      if waiting_game
        result = waiting_game.add_player(user)
        game_user = result[:game_user]
        message = result[:message]
        case message
        when "yes waiting for other players"
          return { game: waiting_game, game_user: game_user, message: "waiting for players" }
        when "too many players"
          # ca boucle, plusieurs 3 eme joueurs simultanement, on cherche une autre partie
        when "game ready installation_phase"
          return { game: waiting_game, game_user: game_user, message: "game ready installation_phase" }
        end
      else
        begin
          game = create!(
            player_count: 3,
            game_status: :waiting_for_players,
            game_type: :quick_game,
            waiting_players_count: 1,
            turn_duration: 120
          )
          game_user = game.game_users.create(user: user)
          return {game: game, game_user: game_user, message: "new game"}
          # si creation de partie simultanee
        rescue ActiveRecord::RecordNotUnique
          # ca boucle pour eviter la creation de partie simultanee
        end
      end
    end
  end

  # ajoute et creer un game_user a waiting_for_players, on renvoi un message pour dire si il reste de la place ou si la game est full
  def add_player(user)

    transaction do
      #j'ai decomenté reload.lock! car je pense que c'etait un oublie
      reload.lock!
            
      if (self.waiting_players_count < (player_count - 1)) && (self.game_status == "waiting_for_players")
        self.increment!(:waiting_players_count)
        game_user = self.game_users.create(user: user)
        return {message: "yes waiting for other players", game_user: game_user}

      elsif (self.waiting_players_count == (player_count - 1)) && (self.game_status == "waiting_for_players")
        self.update!(
          waiting_players_count: self.waiting_players_count + 1,
          game_status: :waiting_for_confirmation_players
        )        
        game_user = self.game_users.create(user: user)
        return {message: "game ready installation_phase", game_user: game_user}

      else
        return {message: "too many players"}
      end

    end
  end

  # on calcul le nombre de tuile en fonction du nombre de joueur
  def calculate_tile_count
    case player_count
    when 2 then 8
    when 3 then 12
    when 4 then 15
    when 5 then 19
    when 6 then 22
    when 7 then 27
    when 8 then 30
    end
  end

  # on cree les Tuiles pour la game en fonction du nombre de joueur
  def create_tiles_for_players()
    tile_count = self.calculate_tile_count
    game_users_list = game_users.reload.to_a
    Rails.logger.info "Liste des game_users : #{game_users_list.map(&:id)}"
    
    tile_count.times do |i|
      game_user = game_users_list[i % player_count]
      Rails.logger.info "Création de la tuile #{i} pour le game_user #{game_user.id}"
      
      tile = tiles.create(
        game_user_id: game_user.id,
        turn: i
      )
      
      unless tile.persisted?
        Rails.logger.error "Échec de la création de la tuile #{i} : #{tile.errors.full_messages}"
        return false
      end
    end
    true
  end


  def self.creat_custom_game(user)
    # on rejoind une partie si une partie en cours
    ongoing_game = self.ongoing_game(user)
    if ongoing_game
      game_user = ongoing_game[:game].game_users.find_by(user_id: user.id)
      return {game: ongoing_game[:game], game_user: game_user, message: "ongoing game"}
    # sinon on cree une nouvelle partie
    else
      game = nil
      custom_code = nil
      loop do
        custom_code = SecureRandom.alphanumeric(6).upcase
        game = self.create(game_type: :custom_game, game_status: :waiting_for_players, creator: user, custom_code: custom_code, player_count: 8, waiting_players_count: 1, creator_id: user.id)
        unless game.persisted?
          puts "❌ Erreurs : #{game.errors.full_messages.join(', ')}"
        end
        break if game.persisted?
      end
      game_user = game.game_users.create(user: user)
      return {game: game, game_user: game_user, custom_code: custom_code, message: "new game"}
    end
  end


  def self.ongoing_game_custom(user,custom_code)
    # on rejoind une partie si on a une partie en cours
    ongoing_game = self.ongoing_game(user)
    if ongoing_game
      game_user = ongoing_game.game_users.find_by(user_id: user.id)
      return {game: ongoing_game, game_user: game_user, message: "ongoing game"}
    # sinon on cree une nouvelle partie
    else
      game = self.where(custom_code: custom_code)
           .where("waiting_players_count <= ?", 8)
           .first
      unless game
        return {message: "game not found"}
      else
        if game.game_status != "waiting_for_players"
          return {message: "game not in waiting_for_players"}
        end
        success = false
        Game.transaction do
          game.lock!
          var_waiting_players_count = 0
          if game.waiting_players_count < 8
            game.waiting_players_count += 1
            var_waiting_players_count = game.waiting_players_count
            game.save!
            success = true
          else
            raise ActiveRecord::Rollback
          end
        end
        unless success
          return {message: "game full"}
        else
          game_user = game.game_users.create(user: user)
          if game.waiting_players_count < 8
            return {game: game, game_user: game_user, message: "joined game and waiting for other players"}
          else
            return {game: game, game_user: game_user, message: "joined game and game ready installation_phase"}
          end
        end
      end
      
    end
  end

  def launch_custom_game(game_duration)
    place_available = 0
    success = false
    Game.transaction do
      self.lock!
      if self.game_status == "waiting_for_players"
        self.game_status = "waiting_for_confirmation_players"
        self.save!
        place_available = 8 - self.waiting_players_count
        success = true
      else
        raise ActiveRecord::Rollback
      end
    end
    unless success
      return {message: "error game not in waiting_for_players"}
    end
    if place_available > 0
      self.reassign_players(place_available)
    end
    player_count = GameUser.where(game_id: self.id).count
    self.player_count = player_count
    self.waiting_players_count = player_count
    self.turn_duration = [game_duration, 15].max
    self.save!
    return {game: self, message: "go ready to play"}

  end


  def reassign_players(place_available)
    other_game = Game.where(game_status: "waiting_for_players", game_type: "quick_game").first
    return unless other_game
  
    Game.transaction do
      other_game.lock!
      self.lock!
  
      if other_game.game_status == "waiting_for_players" && self.game_status == "waiting_for_players"
        num_players_to_move = [place_available, other_game.waiting_players_count].min
  
        other_game.decrement!(:waiting_players_count, num_players_to_move)
        self.increment!(:waiting_players_count, num_players_to_move)
  
        other_game.game_users.limit(num_players_to_move).update_all(game_id: self.id)
      else
        raise ActiveRecord::Rollback
      end
    end
  end
  

  def give_up_game(game_user)
    transaction do
      self.lock!
      if ((self.game_status == "waiting_for_players" || self.game_status == "waiting_for_confirmation_players") && game_user)
        game_user.destroy
        transaction do
          self.lock!
          self.waiting_players_count -= 1
          self.save!
        end
        if self.waiting_players_count == 0
          self.destroy
          return {message: "game destroyed"}
        elsif (GameUser.where(game_id: self.id).where(player_ready: true).count == self.waiting_players_count && self.waiting_players_count >=2)
          # lancer la game
          self.player_count = self.waiting_players_count
          self.save!
          self.start_installation_phase()
          return {message: "player give up and game ready installation_phase"}
        elsif (self.game_status == "waiting_for_confirmation_players") && (GameUser.where(game_id: self.id).where(player_ready: true).count < 2)
          # re mettre en status waiting_for_players
          self.game_status = "waiting_for_players"
          self.save!
          return {message: "player give up and game waiting for players"}
        else
          return {message: "player give up"}
        end
      else
        return {message: "player not found"}
      end
    end
  end




  def check_turn_completion_and_broadcast(action, current_user)
    result_status = transaction_finalization(action)
    case result_status
    when :tour_finished
      GameBroadcast.game_broadcast_game_details(self.id)
    when :still_waiting
      GameBroadcast.user_broadcast_waiting_for_others(current_user.id, self.id)
    end
    result_status
  end

  def transaction_finalization(action)
    status = nil
    fill_missing_actions_for_abandoned(simultaneous_play_turn)
    if actions.where(turn: simultaneous_play_turn).count == player_count 
      #update conditionel pour s'assurer qu'un seul joueur cloture le tour pour avoir un seul broadcast
      updated = Game #retourne le nombre de ligne modifier, donc 1 si reussie, 0 si echoué car race condition
        .where(id: id, simultaneous_play_turn: action.turn)
        .update_all("simultaneous_play_turn = simultaneous_play_turn + 1")
    
      status = updated == 1 ? :tour_finished : :already_completed #1 ligne modifiee donc tour termine, 0 donc tour deja cloture par un autre joueur
    else
      status = :still_waiting
    end
    return status
  end


  def check_game_completion_after_abandon
    # Compter les joueurs qui n'ont pas abandonné
    active_players = game_users.where(abandoned: false)
    active_players_count = active_players.count

    puts "🔍 Vérification de la fin de partie: #{active_players_count} joueur(s) actif(s)"
    
    if active_players_count <= 1
      puts "🏁 Fin de partie détectée (#{active_players_count} joueur(s) restant(s))"
      
      # Mettre à jour le statut de la game
      update!(game_status: :completed)
      
      # Si un seul joueur reste, il est le gagnant
      if active_players_count == 1
        winner = active_players.first
        puts "🏆 Gagnant par abandon: #{winner.user_name} (ID: #{winner.id})"
        
        # Envoyer un message au gagnant
        GameBroadcast.user_broadcast_game_won(winner.user_id, id, winner.id)
        
        # Notifier tous les joueurs de la fin de partie
        GameBroadcast.game_broadcast_game_details(self.id)
      else
        puts "❌ Aucun joueur actif, partie terminée sans gagnant"
        # Notifier tous les joueurs de la fin de partie
        GameBroadcast.game_broadcast_game_details(self.id)
      end
      
      return true
    else
      puts "✅ La partie continue (#{active_players_count} joueurs actifs)"
      return false
    end
  end




  private

  def can_add_player?
    waiting_for_players? && game_users.count < player_count
  end

  def initialize_game
    Rails.logger.info "Initialisation de la partie #{id}"
    create_tiles
    update(game_status: :installation_phase, biddings_turn: 1)
  rescue => e
    Rails.logger.error "ERROR during game initialization for game #{id}: #{e.message}"
    raise
  end


    
  # creer des action passer le tour pour les joueurs qui ont abandonné
  def fill_missing_actions_for_abandoned(turn)
    game_users.where(abandoned: true).each do |game_user|
      begin
        actions.create!(
          game_user_id: game_user.id,
          turn: turn,
          position_q: nil, position_r: nil,
          development_level: 0, fortification_level: 0, militarisation_level: 0
        )
      rescue ActiveRecord::RecordNotUnique
        # déjà créé par un autre thread donc pas de probleme
      end
    end
  end
  

end 