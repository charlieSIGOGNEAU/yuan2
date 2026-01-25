require "test_helper"
require "concurrent"

class RaceConditionTest < ActiveSupport::TestCase
  test "QuickGame: 3rd and 4th players handled correctly under concurrency (looped for stability)" do
    iterations = 5  # nombre d'itérations pour simuler plusieurs scenarios
    iterations.times do |i|

      GameUser.delete_all
      Game.delete_all

      # Créer 4 utilisateurs
      users = 4.times.map { |j| create_test_user(name: "Player#{j+1}_#{i}") }

      # User1 et User2 rejoignent séquentiellement
      first_result = Game.find_or_create_waiting_game(users[0])
      second_result = Game.find_or_create_waiting_game(users[1])
      game = first_result[:game]


      # User3 et User4 rejoignent SIMULTANÉMENT via threads
      results = {}
      barrier = Concurrent::CountDownLatch.new(2)  # on va attendre 2 threads pour commencer
      threads = [users[2], users[3]].map do |user|
        Thread.new do
          begin
            barrier.count_down # on decremente le count down pour que les threads partent en même temps
            barrier.wait(5)   # on attend que les 2 threads partent en même temps ou 5 secondesau plus tard
            results[user.id] = Game.find_or_create_waiting_game(user)
          ensure
            ActiveRecord::Base.connection_pool.release_connection # on libere la connection meme si il y a une erreur
          end
        end
      end
      threads.each(&:join) # on attend que les 2 threads soient terminés


      # Vérification
      game.reload # on reload la game pour etre sur que les données sont à jour
      all_games = Game.where(game_type: :quick_game).order(:id)
      first_game = all_games.first
      second_game = all_games.last

      # La première game a exactement 3 joueurs
      assert_equal 3, first_game.game_users.count,
        "Itération #{i+1}: La première game ne doit pas dépasser 3 joueurs"

      # La première game est en waiting_for_confirmation_players
      assert_equal "waiting_for_confirmation_players", first_game.game_status,
        "Itération #{i+1}: La première game doit être en waiting_for_confirmation_players"

      # Une seconde game est créée pour le 4ème joueur
      assert_equal 2, all_games.count,
        "Itération #{i+1}: Une nouvelle game doit être créée pour le 4ème joueur"
      assert_equal 1, second_game.game_users.count,
        "Itération #{i+1}: La deuxième game doit avoir exactement 1 joueur"
      assert_equal "waiting_for_players", second_game.game_status,
        "Itération #{i+1}: La deuxième game doit rester en waiting_for_players"

      # Tous les 4 utilisateurs sont assignés à une game
      all_user_ids = all_games.flat_map { |g| g.game_users.pluck(:user_id) }
      assert_equal 4, all_user_ids.uniq.count,
        "Itération #{i+1}: Tous les 4 utilisateurs doivent être assignés à une game"
    end
  end

  test "QuickGame: 1st and 2nd players handled correctly under concurrency (looped for stability)" do
    iterations = 5
    iterations.times do |i|
      GameUser.delete_all
      Game.delete_all

      # Créer 2 utilisateurs
      users = 2.times.map { |j| create_test_user(name: "Player#{j+1}_#{i}") }

      result ={}
      barrier = Concurrent::CountDownLatch.new(2)
      threads = [users[0], users[1]].map do |user|
        Thread.new do
          begin
            barrier.count_down # on decremente le count down pour que les threads partent en même temps
            barrier.wait(5)   # on attend que les 2 threads partent en même temps ou 5 secondesau plus tard
            result[user.id] = Game.find_or_create_waiting_game(user)
          ensure
            ActiveRecord::Base.connection_pool.release_connection # on libere la connection meme si il y a une erreur
          end
        end
      end
      threads.each(&:join) # on attend que les 2 threads soient terminés

      # Vérification
      all_games = Game.all.order(:id)
      first_game = all_games.first

      assert_equal 2, first_game.game_users.count,
        "Itération #{i+1}: La première game doit avoir exactement 2 joueurs"
      assert_equal 1, all_games.count,
        "Itération #{i+1}: Une seule game doit être créée"
    end
  end

  test "only one thread can finalize a simultaneous turn" do
    iterations = 5
    iterations.times do |i|
      Action.delete_all
      GameUser.delete_all
      User.delete_all
      Game.delete_all


      game = Game.create!(game_type: :quick_game, game_status: :simultaneous_play, player_count: 3, simultaneous_play_turn: 1)


      game_user_1 = GameUser.create!(
        user: User.create!(name: "player1", email: "player1@test.com", password: "player1@test.com"),
        game_id: game.id,
        abandoned: true
      )
      game_user_2 = GameUser.create!(
        user: User.create!(name: "player2", email: "player2@test.com", password: "player2@test.com"),
        game_id: game.id,
        abandoned: false
      )
      game_user_3 = GameUser.create!(
        user: User.create!(name: "player3", email: "player3@test.com", password: "player3@test.com"),
        game_id: game.id,
        abandoned: false
      )
      action_2 = Action.create!(game_user_id: game_user_2.id, game_id: game.id, turn: 1, position_q: nil, position_r: nil, development_level: 0, fortification_level: 0, militarisation_level: 0)
      action_3 = Action.create!(game_user_id: game_user_3.id, game_id: game.id, turn: 1, position_q: nil, position_r: nil, development_level: 0, fortification_level: 0, militarisation_level: 0)

      result = {}
      barrier = Concurrent::CountDownLatch.new(2)
      threads = [action_2.id, action_3.id].map do |action_id|
        Thread.new do
          begin
            barrier.count_down # on decremente le count down pour que les threads partent en même temps
            barrier.wait(5)   # on attend que les 2 threads partent en même temps ou 5 secondesau plus tard
            result[action_id] = game.transaction_finalization(Action.find(action_id))
          ensure
            ActiveRecord::Base.connection_pool.release_connection # on libere la connection meme si il y a une erreur
          end
        end
      end
      threads.each(&:join) # on attend que les 2 threads soient terminés

      # Vérification
      assert_equal 1, Action.where(game_id: game.id, turn: 1, game_user_id: game_user_1.id).count,
        "il dois y avoir une seul action pour le joueur 1 qui a abandonné"

      boolean = (result[action_2.id] == :tour_finished && result[action_3.id] == :already_completed) || 
      (result[action_2.id] == :already_completed && result[action_3.id] == :tour_finished)
      assert_equal true, boolean,
        " un joueur dois cloturer le tour et l'autre dois le voir deja cloturer"
      assert_equal 2, game.reload.simultaneous_play_turn,
        "le tour doit etre incrementé de 1"
    end
  end

end