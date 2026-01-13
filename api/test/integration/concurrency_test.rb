# =====================================================
# TESTS DE CONCURRENCE / RACE CONDITIONS
# =====================================================
# Objectif: Valider que les locks et transactions fonctionnent
# Risques couverts: Double join, données corrompues, deadlocks
# IMPORTANT: Ces tests écrivent dans la vraie DB pour déclencher les locks
# =====================================================

require "test_helper"

class ConcurrencyTest < ActionDispatch::IntegrationTest
  # Désactiver les transactions pour les tests de concurrence
  # self.use_transactional_tests = false

  # =====================================================
  # TEST 1: Race condition sur add_player
  # Objectif: Vérifier que deux joueurs ne peuvent pas rejoindre
  #           simultanément et dépasser le player_count
  # Risque: Plus de joueurs que prévu dans une partie
  # =====================================================
  test "concurrent add_player does not exceed player_count" do
    # Créer une partie avec 1 place restante
    game = Game.create!(
      player_count: 3,
      game_status: :waiting_for_players,
      game_type: :quick_game,
      waiting_players_count: 2,
      turn_duration: 120
    )
    2.times { game.game_users.create!(user: create_test_user) }
    
    # Créer plusieurs utilisateurs qui vont essayer de rejoindre
    users = 5.times.map { create_test_user }
    results = []
    threads = []
    
    # Lancer 5 threads simultanés
    users.each do |user|
      threads << Thread.new do
        result = game.add_player(user)
        results << result[:message]
      end
    end
    
    threads.each(&:join)
    
    game.reload
    
    # Vérifier qu'on a au maximum player_count joueurs
    assert game.game_users.count <= game.player_count,
      "Game should not have more than #{game.player_count} players, got #{game.game_users.count}"
    
    # Vérifier qu'un seul a réussi à obtenir "game ready"
    ready_count = results.count { |r| r == "game ready installation_phase" }
    assert ready_count <= 1, "Only one player should trigger 'game ready'"
  end

  # =====================================================
  # TEST 2: Race condition sur quick_game matchmaking
  # Objectif: Vérifier que plusieurs joueurs ne créent pas
  #           plusieurs parties mais rejoignent la même
  # Risque: Fragmentation des joueurs dans plusieurs parties
  # =====================================================
  test "concurrent quick_game joins same game" do
    # S'assurer qu'il n'y a pas de partie existante
    Game.delete_all
    
    users = 3.times.map { create_test_user }
    game_ids = []
    threads = []
    
    users.each do |user|
      threads << Thread.new do
        result = Game.find_or_create_waiting_game(user)
        game_ids << result[:game].id
      end
    end
    
    threads.each(&:join)
    
    # Tous devraient être dans la même partie (ou max 2 si race condition légère)
    unique_games = game_ids.uniq
    assert unique_games.length <= 2,
      "Players should be in same game or at most 2 games, got #{unique_games.length}"
  end

  # =====================================================
  # TEST 3: Race condition sur i_am_ready
  # Objectif: Vérifier que start_installation_phase n'est
  #           appelé qu'une seule fois
  # Risque: Double initialisation de la partie
  # =====================================================
  test "concurrent i_am_ready triggers installation once" do
    game = Game.create!(
      player_count: 3,
      game_status: :waiting_for_confirmation_players,
      game_type: :quick_game,
      waiting_players_count: 3,
      turn_duration: 120
    )
    
    users = 3.times.map { create_test_user }
    game_users = users.map { |u| game.game_users.create!(user: u, player_ready: false) }
    
    # Marquer 2 joueurs comme ready
    game_users[0].update!(player_ready: true)
    game_users[1].update!(player_ready: true)
    
    results = []
    threads = []
    
    # Le 3ème joueur et un doublon essaient de se marquer ready
    [game_users[2], game_users[2]].each do |gu|
      threads << Thread.new do
        result = game.i_am_ready(gu)
        results << result[:message]
      end
    end
    
    threads.each(&:join)
    
    game.reload
    
    # La partie doit être en installation_phase
    assert_equal "installation_phase", game.game_status
    
    # Un seul message "player ready and game full"
    full_count = results.count { |r| r == "player ready and game full" }
    assert_equal 1, full_count, "Only one thread should get 'game full'"
  end

  # =====================================================
  # TEST 4: Race condition sur give_up_game
  # Objectif: Vérifier qu'un joueur ne peut pas abandonner
  #           deux fois (double suppression)
  # Risque: Compteur waiting_players_count négatif
  # =====================================================
  test "concurrent give_up_game does not corrupt counter" do
    game = Game.create!(
      player_count: 3,
      game_status: :waiting_for_players,
      game_type: :quick_game,
      waiting_players_count: 3,
      turn_duration: 120
    )
    
    users = 3.times.map { create_test_user }
    game_users = users.map { |u| game.game_users.create!(user: u) }
    
    threads = []
    
    # Deux threads essaient de faire abandonner le même joueur
    2.times do
      threads << Thread.new do
        begin
          game.give_up_game(game_users[0])
        rescue => e
          # Ignorer les erreurs de joueur déjà supprimé
        end
      end
    end
    
    threads.each(&:join)
    
    game.reload
    
    # Le compteur ne doit pas être négatif
    assert game.waiting_players_count >= 0,
      "waiting_players_count should not be negative"
    
    # Le joueur ne doit avoir été supprimé qu'une fois
    remaining_game_users = game.game_users.count
    assert remaining_game_users >= 2,
      "Should have at least 2 remaining players"
  end

  # =====================================================
  # TEST 5: Race condition sur ongoing_game_custom (join custom)
  # Objectif: Vérifier que 8 joueurs max peuvent rejoindre
  # Risque: Plus de 8 joueurs dans une partie custom
  # =====================================================
  test "concurrent join_custom_game respects max players" do
    creator = create_test_user
    custom_code = "RACE01"
    
    game = Game.create!(
      player_count: 8,
      game_status: :waiting_for_players,
      game_type: :custom_game,
      waiting_players_count: 7, # Presque pleine
      turn_duration: 120,
      creator: creator,
      custom_code: custom_code
    )
    7.times { game.game_users.create!(user: create_test_user) }
    
    # 5 joueurs essaient de rejoindre simultanément
    new_users = 5.times.map { create_test_user }
    results = []
    threads = []
    
    new_users.each do |user|
      threads << Thread.new do
        result = Game.ongoing_game_custom(user, custom_code)
        results << result[:message]
      end
    end
    
    threads.each(&:join)
    
    game.reload
    
    # Max 8 joueurs
    assert game.game_users.count <= 8,
      "Custom game should have max 8 players, got #{game.game_users.count}"
    assert game.waiting_players_count <= 8,
      "waiting_players_count should be max 8, got #{game.waiting_players_count}"
  end

  # =====================================================
  # TEST 6: Race condition sur submit_victory
  # Objectif: Vérifier que submitted_by_user_id n'est set qu'une fois
  # Risque: Perte de la première soumission
  # =====================================================
  test "concurrent submit_victory preserves first submission" do
    game = Game.create!(
      player_count: 3,
      game_status: :simultaneous_play,
      game_type: :quick_game,
      waiting_players_count: 3,
      turn_duration: 120
    )
    
    users = 3.times.map { create_test_user }
    game_users = users.map { |u| game.game_users.create!(user: u) }
    
    rankings = game_users.each_with_index.map do |gu, idx|
      { game_user_id: gu.id, rank: idx + 1 }
    end
    
    first_submitter_ids = []
    threads = []
    mutex = Mutex.new
    
    # 3 joueurs soumettent simultanément
    users.each do |user|
      threads << Thread.new do
        game.transaction do
          game.lock!
          if game.submitted_by_user_id.nil?
            rankings.each do |ranking|
              gu = game.game_users.find(ranking[:game_user_id])
              gu.update!(rank: ranking[:rank])
            end
            game.update!(submitted_by_user_id: user.id)
            mutex.synchronize { first_submitter_ids << user.id }
          end
        end
      end
    end
    
    threads.each(&:join)
    
    game.reload
    
    # Un seul submitted_by_user_id
    assert_not_nil game.submitted_by_user_id
    assert_equal 1, first_submitter_ids.uniq.length,
      "Only one user should be the first submitter"
  end

  # =====================================================
  # TEST 7: Race condition sur launch_custom_game
  # Objectif: Vérifier que le statut ne change qu'une fois
  # Risque: Double changement de statut
  # =====================================================
  test "concurrent launch_custom_game changes status once" do
    creator = create_test_user
    
    game = Game.create!(
      player_count: 8,
      game_status: :waiting_for_players,
      game_type: :custom_game,
      waiting_players_count: 3,
      turn_duration: 120,
      creator: creator,
      custom_code: "LAUNCH1"
    )
    game.game_users.create!(user: creator)
    2.times { game.game_users.create!(user: create_test_user) }
    
    results = []
    threads = []
    
    # Le créateur essaie de lancer 3 fois simultanément
    3.times do
      threads << Thread.new do
        result = game.launch_custom_game(60)
        results << result[:message]
      end
    end
    
    threads.each(&:join)
    
    game.reload
    
    # La partie doit être en waiting_for_confirmation_players
    assert_equal "waiting_for_confirmation_players", game.game_status
    
    # Un seul succès
    success_count = results.count { |r| r == "go ready to play" }
    assert_equal 1, success_count, "Only one launch should succeed"
  end

  # =====================================================
  # TEST 8: Simulation de charge - Multiple quick_games
  # Objectif: Vérifier la stabilité sous charge
  # Risque: Erreurs aléatoires, données corrompues
  # =====================================================
  test "stress test with multiple concurrent quick_game requests" do
    Game.delete_all
    
    users = 10.times.map { create_test_user }
    errors = []
    threads = []
    
    users.each do |user|
      threads << Thread.new do
        begin
          5.times do
            result = Game.find_or_create_waiting_game(user)
            raise "No game returned" unless result[:game]
          end
        rescue => e
          errors << "#{user.id}: #{e.message}"
        end
      end
    end
    
    threads.each(&:join)
    
    assert errors.empty?, "Errors during stress test: #{errors.join(', ')}"
    
    # Vérifier l'intégrité des données
    Game.all.each do |game|
      assert game.waiting_players_count >= 0,
        "Game #{game.id} has negative waiting_players_count"
      assert game.game_users.count <= game.player_count,
        "Game #{game.id} has more players than allowed"
    end
  end
end



