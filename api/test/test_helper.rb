ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    # DÉSACTIVÉ pour les tests de concurrence qui nécessitent une vraie DB
    # parallelize(workers: :number_of_processors)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    # fixtures :all

    # =====================================================
    # HELPERS POUR CRÉER DES DONNÉES DE TEST
    # =====================================================

    # Crée un utilisateur de test unique
    def create_test_user(name: nil, email: nil)
      name ||= "TestUser_#{SecureRandom.hex(4)}"
      email ||= "#{SecureRandom.hex(6)}@test.com"
      User.create!(
        name: name,
        email: email,
        password_digest: BCrypt::Password.create("password123"),
        language: "fr",
        fps: 60,
        render_scale: 1.0,
        shadow_realtime: true
      )
    end

    # Crée une partie quick_game avec N joueurs
    def create_game_with_players(player_count: 3, status: :waiting_for_players)
      game = Game.create!(
        player_count: player_count,
        game_status: status,
        game_type: :quick_game,
        waiting_players_count: 0,
        turn_duration: 120
      )
      
      users = []
      player_count.times do
        user = create_test_user
        users << user
        game.game_users.create!(user: user)
        game.increment!(:waiting_players_count)
      end
      
      { game: game, users: users }
    end

    # Crée une partie custom avec créateur
    def create_custom_game(creator: nil)
      creator ||= create_test_user
      custom_code = SecureRandom.alphanumeric(6).upcase
      
      game = Game.create!(
        player_count: 8,
        game_status: :waiting_for_players,
        game_type: :custom_game,
        waiting_players_count: 1,
        turn_duration: 120,
        creator: creator,
        custom_code: custom_code
      )
      
      game.game_users.create!(user: creator)
      
      { game: game, creator: creator, custom_code: custom_code }
    end

    # Génère un token JWT valide pour un utilisateur
    def generate_auth_token(user)
      payload = {
        user_id: user.id,
        exp: 24.hours.from_now.to_i
      }
      JWT.encode(payload, Rails.application.credentials.secret_key_base || ENV['SECRET_KEY_BASE'] || 'test_secret')
    end

    # Headers d'authentification pour les requêtes API
    def auth_headers(user)
      {
        'Authorization' => "Bearer #{generate_auth_token(user)}",
        'Content-Type' => 'application/json'
      }
    end

    # Nettoie toutes les données de test
    def cleanup_test_data
      # Suppression dans l'ordre pour respecter les foreign keys
      Action.delete_all
      Bidding.delete_all
      Tile.delete_all
      GameUser.delete_all
      Clan.delete_all
      Game.delete_all
      User.where("email LIKE ?", "%@test.com").delete_all
    end

    # Setup et teardown automatiques
    def setup
      cleanup_test_data
    end

    def teardown
      cleanup_test_data
    end
  end
end

# =====================================================
# HELPER POUR LES TESTS DE CONTRÔLEUR
# =====================================================
module ActionDispatch
  class IntegrationTest
    include ActiveSupport::TestCase::LocalVariables rescue nil

    def create_test_user(name: nil, email: nil)
      name ||= "TestUser_#{SecureRandom.hex(4)}"
      email ||= "#{SecureRandom.hex(6)}@test.com"
      User.create!(
        name: name,
        email: email,
        password_digest: BCrypt::Password.create("password123"),
        language: "fr",
        fps: 60,
        render_scale: 1.0,
        shadow_realtime: true
      )
    end

    def generate_auth_token(user)
      payload = {
        user_id: user.id,
        exp: 24.hours.from_now.to_i
      }
      JWT.encode(payload, Rails.application.credentials.secret_key_base || ENV['SECRET_KEY_BASE'] || 'test_secret')
    end

    def auth_headers(user)
      {
        'Authorization' => "Bearer #{generate_auth_token(user)}",
        'Content-Type' => 'application/json'
      }
    end

    def cleanup_test_data
      Action.delete_all
      Bidding.delete_all
      Tile.delete_all
      GameUser.delete_all
      Clan.delete_all
      Game.delete_all
      User.where("email LIKE ?", "%@test.com").delete_all
    end

    def setup
      cleanup_test_data
    end

    def teardown
      cleanup_test_data
    end
  end
end
