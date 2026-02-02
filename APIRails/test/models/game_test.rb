# =====================================================
# TESTS UNITAIRES - MODÈLE GAME
# =====================================================
# Objectif: Valider la logique métier isolée du modèle Game
# Risques couverts: Bugs logiques, états invalides, calculs incorrects
# =====================================================

require "test_helper"

class GameTest < ActiveSupport::TestCase
  # =====================================================
  # TEST 1: Validations de base
  # Objectif: Vérifier que les validations empêchent les données invalides
  # Risque: Données corrompues en base
  # =====================================================
  test "game requires game_status, game_type and player_count" do
    # Créer une game sans les champs requis
    game = Game.new
    
    # Vérifier que la validation échoue
    assert_not game.valid?
    assert_includes game.errors[:player_count], "can't be blank"
  end

  test "game with valid attributes is valid" do
    game = Game.new(
      player_count: 3,
      game_status: :waiting_for_players,
      game_type: :quick_game,
      waiting_players_count: 0,
      turn_duration: 120
    )
    
    assert game.valid?, "Game should be valid with all required attributes"
  end

  # =====================================================
  # TEST 2: Enum game_status
  # Objectif: Vérifier les transitions d'états du jeu
  # Risque: État incohérent bloquant la partie
  # =====================================================
  test "game_status enum contains all expected values" do
    expected_statuses = %w[
      waiting_for_players
      waiting_for_confirmation_players
      installation_phase
      initial_placement
      bidding_phase
      starting_spot_selection
      simultaneous_play
      completed
      abandoned
      end_dispute
    ]
    
    assert_equal expected_statuses.sort, Game.game_statuses.keys.sort
  end

  test "game_status defaults to waiting_for_players" do
    game = Game.new(player_count: 3, game_type: :quick_game)
    assert_equal "waiting_for_players", game.game_status
  end

  # =====================================================
  # TEST 3: calculate_tile_count
  # Objectif: Vérifier le calcul du nombre de tuiles par joueur
  # Risque: Nombre de tuiles incorrect = partie non jouable
  # =====================================================
  test "calculate_tile_count returns correct values for each player count" do
    expected_tiles = {
      2 => 8,
      3 => 12,
      4 => 15,
      5 => 19,
      6 => 22,
      7 => 27,
      8 => 30
    }
    
    expected_tiles.each do |player_count, expected_tile_count|
      game = Game.new(player_count: player_count)
      assert_equal expected_tile_count, game.calculate_tile_count,
        "Expected #{expected_tile_count} tiles for #{player_count} players"
    end
  end

  # =====================================================
  # TEST 4: the_clans
  # Objectif: Vérifier l'attribution des clans selon le nombre de joueurs
  # Risque: Clans manquants ou en double
  # =====================================================
  test "the_clans returns correct number of clans" do
    (2..8).each do |count|
      game = Game.new(player_count: count)
      clans = game.the_clans.split(" ")
      assert_equal count, clans.length,
        "Expected #{count} clans for #{count} players"
    end
  end

  test "the_clans returns unique clans" do
    game = Game.new(player_count: 8)
    clans = game.the_clans.split(" ")
    assert_equal clans.uniq.length, clans.length, "Clans should be unique"
  end

  # =====================================================
  # TEST 5: add_player
  # Objectif: Vérifier l'ajout d'un joueur à une partie
  # Risque: Joueur ajouté à une partie pleine ou invalide
  # =====================================================
  test "add_player increments waiting_players_count" do
    # Créer une partie avec 1 joueur
    setup_result = create_game_with_players(player_count: 3)
    game = setup_result[:game]
    game.update!(waiting_players_count: 1)
    
    # Nettoyer les game_users existants pour le test
    game.game_users.delete_all
    game.update!(waiting_players_count: 0)
    
    new_user = create_test_user
    initial_count = game.waiting_players_count
    
    result = game.add_player(new_user)
    
    assert_equal initial_count + 1, game.reload.waiting_players_count
    assert_equal "yes waiting for other players", result[:message]
    assert_not_nil result[:game_user]
  end

  test "add_player returns game ready when game is full" do
    # Créer une partie pour 3 joueurs avec 2 déjà présents
    game = Game.create!(
      player_count: 3,
      game_status: :waiting_for_players,
      game_type: :quick_game,
      waiting_players_count: 2,
      turn_duration: 120
    )
    
    2.times { game.game_users.create!(user: create_test_user) }
    
    new_user = create_test_user
    result = game.add_player(new_user)
    
    assert_equal "game ready installation_phase", result[:message]
    assert_equal "waiting_for_confirmation_players", game.reload.game_status
  end

  test "add_player returns too many players when game is full" do
    game = Game.create!(
      player_count: 3,
      game_status: :waiting_for_players,
      game_type: :quick_game,
      waiting_players_count: 3,
      turn_duration: 120
    )
    
    new_user = create_test_user
    result = game.add_player(new_user)
    
    assert_equal "too many players", result[:message]
  end

  # =====================================================
  # TEST 6: ongoing_game
  # Objectif: Vérifier la détection de partie en cours
  # Risque: Joueur dans plusieurs parties simultanément
  # =====================================================
  test "ongoing_game returns nil when user has no active game" do
    user = create_test_user
    result = Game.ongoing_game(user)
    assert_nil result
  end

  test "ongoing_game returns game when user is in active game" do
    user = create_test_user
    game = Game.create!(
      player_count: 3,
      game_status: :waiting_for_players,
      game_type: :quick_game,
      waiting_players_count: 1,
      turn_duration: 120
    )
    game.game_users.create!(user: user, abandoned: false)
    
    result = Game.ongoing_game(user)
    
    assert_not_nil result
    assert_equal game.id, result[:game].id
  end

  test "ongoing_game ignores completed games" do
    user = create_test_user
    game = Game.create!(
      player_count: 3,
      game_status: :completed,
      game_type: :quick_game,
      waiting_players_count: 1,
      turn_duration: 120
    )
    game.game_users.create!(user: user, abandoned: false)
    
    result = Game.ongoing_game(user)
    assert_nil result
  end

  test "ongoing_game ignores abandoned game_users" do
    user = create_test_user
    game = Game.create!(
      player_count: 3,
      game_status: :waiting_for_players,
      game_type: :quick_game,
      waiting_players_count: 1,
      turn_duration: 120
    )
    game.game_users.create!(user: user, abandoned: true)
    
    result = Game.ongoing_game(user)
    assert_nil result
  end

  # =====================================================
  # TEST 7: find_or_create_waiting_game
  # Objectif: Vérifier la logique de matchmaking quick game
  # Risque: Mauvais matchmaking, parties non créées
  # =====================================================
  test "find_or_create_waiting_game creates new game when none exists" do
    user = create_test_user
    
    result = Game.find_or_create_waiting_game(user)
    
    assert_not_nil result[:game]
    assert_equal "new game", result[:message]
    assert_equal "quick_game", result[:game].game_type
    assert_equal 1, result[:game].waiting_players_count
  end

  test "find_or_create_waiting_game joins existing game" do
    # Créer une partie existante en attente
    existing_game = Game.create!(
      player_count: 3,
      game_status: :waiting_for_players,
      game_type: :quick_game,
      waiting_players_count: 1,
      turn_duration: 120
    )
    existing_game.game_users.create!(user: create_test_user)
    
    new_user = create_test_user
    result = Game.find_or_create_waiting_game(new_user)
    
    assert_equal existing_game.id, result[:game].id
    assert_equal "waiting for players", result[:message]
  end

  test "find_or_create_waiting_game returns ongoing game if user already in game" do
    user = create_test_user
    game = Game.create!(
      player_count: 3,
      game_status: :simultaneous_play,
      game_type: :quick_game,
      waiting_players_count: 3,
      turn_duration: 120
    )
    game.game_users.create!(user: user, abandoned: false)
    
    result = Game.find_or_create_waiting_game(user)
    
    assert_equal game.id, result[:game].id
    assert_equal "ongoing game", result[:message]
  end

  # =====================================================
  # TEST 8: i_am_ready
  # Objectif: Vérifier la confirmation de présence des joueurs
  # Risque: Partie lancée sans tous les joueurs prêts
  # =====================================================
  test "i_am_ready sets player_ready to true" do
    game = Game.create!(
      player_count: 3,
      game_status: :waiting_for_confirmation_players,
      game_type: :quick_game,
      waiting_players_count: 3,
      turn_duration: 120
    )
    user = create_test_user
    game_user = game.game_users.create!(user: user, player_ready: false)
    
    game.i_am_ready(game_user)
    
    assert game_user.reload.player_ready
  end

  test "i_am_ready starts installation when all players ready" do
    game = Game.create!(
      player_count: 2,
      game_status: :waiting_for_confirmation_players,
      game_type: :quick_game,
      waiting_players_count: 2,
      turn_duration: 120
    )
    
    user1 = create_test_user
    user2 = create_test_user
    game_user1 = game.game_users.create!(user: user1, player_ready: true)
    game_user2 = game.game_users.create!(user: user2, player_ready: false)
    
    result = game.i_am_ready(game_user2)
    
    assert_equal "player ready and game full", result[:message]
    assert_equal "installation_phase", game.reload.game_status
  end

  # =====================================================
  # TEST 9: creat_custom_game (note: typo dans le code original)
  # Objectif: Vérifier la création de partie personnalisée
  # Risque: Code de partie non unique, partie mal initialisée
  # =====================================================
  test "creat_custom_game creates game with unique code" do
    user = create_test_user
    
    result = Game.creat_custom_game(user)
    
    assert_equal "new game", result[:message]
    assert_not_nil result[:custom_code]
    assert_equal 6, result[:custom_code].length
    assert_equal user.id, result[:game].creator_id
    assert_equal "custom_game", result[:game].game_type
  end

  test "creat_custom_game returns ongoing game if user already playing" do
    user = create_test_user
    existing_game = Game.create!(
      player_count: 3,
      game_status: :simultaneous_play,
      game_type: :quick_game,
      waiting_players_count: 3,
      turn_duration: 120
    )
    existing_game.game_users.create!(user: user, abandoned: false)
    
    result = Game.creat_custom_game(user)
    
    assert_equal "ongoing game", result[:message]
  end

  # =====================================================
  # TEST 10: give_up_game
  # Objectif: Vérifier l'abandon d'une partie
  # Risque: Données corrompues, partie zombie
  # =====================================================
  test "give_up_game removes player from game" do
    game = Game.create!(
      player_count: 3,
      game_status: :waiting_for_players,
      game_type: :quick_game,
      waiting_players_count: 2,
      turn_duration: 120
    )
    user1 = create_test_user
    user2 = create_test_user
    game_user1 = game.game_users.create!(user: user1)
    game_user2 = game.game_users.create!(user: user2)
    
    initial_count = game.waiting_players_count
    result = game.give_up_game(game_user1)
    
    assert_equal initial_count - 1, game.reload.waiting_players_count
    assert_equal "player give up", result[:message]
    assert_nil GameUser.find_by(id: game_user1.id)
  end

  test "give_up_game destroys game when last player leaves" do
    game = Game.create!(
      player_count: 3,
      game_status: :waiting_for_players,
      game_type: :quick_game,
      waiting_players_count: 1,
      turn_duration: 120
    )
    user = create_test_user
    game_user = game.game_users.create!(user: user)
    game_id = game.id
    
    result = game.give_up_game(game_user)
    
    assert_equal "game destroyed", result[:message]
    assert_nil Game.find_by(id: game_id)
  end

  # =====================================================
  # TEST 11: check_game_completion_after_abandon
  # Objectif: Vérifier la fin de partie par abandon
  # Risque: Partie non terminée avec un seul joueur
  # =====================================================
  test "check_game_completion completes game when one player left" do
    game = Game.create!(
      player_count: 3,
      game_status: :simultaneous_play,
      game_type: :quick_game,
      waiting_players_count: 3,
      turn_duration: 120
    )
    
    user1 = create_test_user
    user2 = create_test_user
    user3 = create_test_user
    
    game.game_users.create!(user: user1, abandoned: false, user_name: "Player1")
    game.game_users.create!(user: user2, abandoned: true, user_name: "Player2")
    game.game_users.create!(user: user3, abandoned: true, user_name: "Player3")
    
    result = game.check_game_completion_after_abandon
    
    assert result
    assert_equal "completed", game.reload.game_status
  end

  test "check_game_completion does not complete game with multiple active players" do
    game = Game.create!(
      player_count: 3,
      game_status: :simultaneous_play,
      game_type: :quick_game,
      waiting_players_count: 3,
      turn_duration: 120
    )
    
    user1 = create_test_user
    user2 = create_test_user
    
    game.game_users.create!(user: user1, abandoned: false)
    game.game_users.create!(user: user2, abandoned: false)
    
    result = game.check_game_completion_after_abandon
    
    assert_not result
    assert_equal "simultaneous_play", game.reload.game_status
  end
end



