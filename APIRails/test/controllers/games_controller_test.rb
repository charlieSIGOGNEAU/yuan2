# =====================================================
# TESTS D'INTÉGRATION - GAMES CONTROLLER
# =====================================================
# Objectif: Valider le flux complet Controller + Model + DB
# Risques couverts: Erreurs HTTP, authentification, réponses JSON incorrectes
# =====================================================

require "test_helper"

class Api::V1::GamesControllerTest < ActionDispatch::IntegrationTest
  # =====================================================
  # TESTS D'AUTHENTIFICATION
  # Objectif: Vérifier que authenticate_request bloque les requêtes non auth
  # Risque: Accès non autorisé aux endpoints
  # =====================================================
  
  test "quick_game returns 401 without authentication" do
    post "/api/v1/games/quick_game"
    
    assert_response :unauthorized
  end

  test "quick_game returns 401 with invalid token" do
    post "/api/v1/games/quick_game", headers: {
      'Authorization' => 'Bearer invalid_token',
      'Content-Type' => 'application/json'
    }
    
    assert_response :unauthorized
  end

  test "quick_game returns 401 with expired token" do
    user = create_test_user
    # Créer un token expiré
    expired_payload = {
      user_id: user.id,
      exp: 1.hour.ago.to_i
    }
    expired_token = JWT.encode(expired_payload, Rails.application.credentials.secret_key_base || ENV['SECRET_KEY_BASE'] || 'test_secret')
    
    post "/api/v1/games/quick_game", headers: {
      'Authorization' => "Bearer #{expired_token}",
      'Content-Type' => 'application/json'
    }
    
    assert_response :unauthorized
  end

  # =====================================================
  # TEST: quick_game endpoint
  # Objectif: Vérifier le matchmaking quick game
  # Risque: Échec de création/join de partie
  # =====================================================
  
  test "quick_game creates new game when none available" do
    user = create_test_user
    
    assert_difference 'Game.count', 1 do
      post "/api/v1/games/quick_game", headers: auth_headers(user)
    end
    
    assert_response :success
    json = JSON.parse(response.body)
    assert json['success']
    assert_not_nil json['game_id']
  end

  test "quick_game joins existing waiting game" do
    # Créer une partie existante
    existing_user = create_test_user
    existing_game = Game.create!(
      player_count: 3,
      game_status: :waiting_for_players,
      game_type: :quick_game,
      waiting_players_count: 1,
      turn_duration: 120
    )
    existing_game.game_users.create!(user: existing_user)
    
    new_user = create_test_user
    
    assert_no_difference 'Game.count' do
      post "/api/v1/games/quick_game", headers: auth_headers(new_user)
    end
    
    assert_response :success
    json = JSON.parse(response.body)
    assert json['success']
    assert_equal existing_game.id, json['game_id']
  end

  test "quick_game returns existing game if user already in game" do
    user = create_test_user
    game = Game.create!(
      player_count: 3,
      game_status: :simultaneous_play,
      game_type: :quick_game,
      waiting_players_count: 3,
      turn_duration: 120
    )
    game.game_users.create!(user: user, abandoned: false)
    
    post "/api/v1/games/quick_game", headers: auth_headers(user)
    
    assert_response :success
    json = JSON.parse(response.body)
    assert json['success']
    assert_equal game.id, json['game_id']
  end

  # =====================================================
  # TEST: creat_custom_game endpoint
  # Objectif: Vérifier la création de partie personnalisée
  # Risque: Code non unique, mauvaise initialisation
  # =====================================================
  
  test "creat_custom_game creates game with custom code" do
    user = create_test_user
    
    assert_difference 'Game.count', 1 do
      post "/api/v1/games/creat_custom_game", headers: auth_headers(user)
    end
    
    assert_response :success
    json = JSON.parse(response.body)
    assert json['success']
    assert_not_nil json['custom_code']
    assert_equal 6, json['custom_code'].length
  end

  test "creat_custom_game returns error if user already in game" do
    user = create_test_user
    game = Game.create!(
      player_count: 3,
      game_status: :simultaneous_play,
      game_type: :quick_game,
      waiting_players_count: 3,
      turn_duration: 120
    )
    game.game_users.create!(user: user, abandoned: false)
    
    post "/api/v1/games/creat_custom_game", headers: auth_headers(user)
    
    assert_response :success
    json = JSON.parse(response.body)
    assert_not json['success']
    assert_equal "You are already in a game", json['message']
  end

  # =====================================================
  # TEST: join_game_custom endpoint
  # Objectif: Vérifier la jonction à une partie custom
  # Risque: Join une partie inexistante ou pleine
  # =====================================================
  
  test "join_game_custom joins game with valid code" do
    creator = create_test_user
    custom_code = "ABC123"
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
    
    joiner = create_test_user
    
    post "/api/v1/games/join_game_custom",
      params: { custom_code: custom_code }.to_json,
      headers: auth_headers(joiner)
    
    assert_response :success
    json = JSON.parse(response.body)
    assert json['success']
    assert_equal game.id, json['game_id']
  end

  test "join_game_custom returns error for invalid code" do
    user = create_test_user
    
    post "/api/v1/games/join_game_custom",
      params: { custom_code: "INVALID" }.to_json,
      headers: auth_headers(user)
    
    assert_response :success
    json = JSON.parse(response.body)
    assert_not json['success']
    assert_equal "Game not found", json['message']
  end

  # =====================================================
  # TEST: i_am_ready endpoint
  # Objectif: Vérifier la confirmation de présence
  # Risque: Partie lancée sans confirmation
  # =====================================================
  
  test "i_am_ready sets player ready" do
    user = create_test_user
    game = Game.create!(
      player_count: 3,
      game_status: :waiting_for_confirmation_players,
      game_type: :quick_game,
      waiting_players_count: 3,
      turn_duration: 120
    )
    game_user = game.game_users.create!(user: user, player_ready: false)
    
    # Ajouter d'autres joueurs pour éviter que la partie se lance
    2.times { game.game_users.create!(user: create_test_user, player_ready: false) }
    
    post "/api/v1/games/#{game.id}/i_am_ready", headers: auth_headers(user)
    
    assert_response :success
    json = JSON.parse(response.body)
    assert json['success']
    assert game_user.reload.player_ready
  end

  test "i_am_ready starts game when all players ready" do
    game = Game.create!(
      player_count: 2,
      game_status: :waiting_for_confirmation_players,
      game_type: :quick_game,
      waiting_players_count: 2,
      turn_duration: 120
    )
    
    user1 = create_test_user
    user2 = create_test_user
    game.game_users.create!(user: user1, player_ready: true)
    game.game_users.create!(user: user2, player_ready: false)
    
    post "/api/v1/games/#{game.id}/i_am_ready", headers: auth_headers(user2)
    
    assert_response :success
    json = JSON.parse(response.body)
    assert json['success']
    assert_equal "installation_phase", game.reload.game_status
  end

  # =====================================================
  # TEST: give_up_game endpoint
  # Objectif: Vérifier l'abandon de partie
  # Risque: Données corrompues après abandon
  # =====================================================
  
  test "give_up_game removes player from game" do
    user = create_test_user
    game = Game.create!(
      player_count: 3,
      game_status: :waiting_for_players,
      game_type: :quick_game,
      waiting_players_count: 2,
      turn_duration: 120
    )
    game_user = game.game_users.create!(user: user)
    game.game_users.create!(user: create_test_user) # Autre joueur
    
    post "/api/v1/games/#{game.id}/give_up_game", headers: auth_headers(user)
    
    assert_response :success
    json = JSON.parse(response.body)
    assert json['success']
    assert_nil GameUser.find_by(id: game_user.id)
  end

  test "give_up_game destroys empty game" do
    user = create_test_user
    game = Game.create!(
      player_count: 3,
      game_status: :waiting_for_players,
      game_type: :quick_game,
      waiting_players_count: 1,
      turn_duration: 120
    )
    game.game_users.create!(user: user)
    game_id = game.id
    
    post "/api/v1/games/#{game.id}/give_up_game", headers: auth_headers(user)
    
    assert_response :success
    json = JSON.parse(response.body)
    assert json['success']
    assert_nil Game.find_by(id: game_id)
  end

  # =====================================================
  # TEST: submit_victory endpoint
  # Objectif: Vérifier la soumission des résultats
  # Risque: Résultats incorrects enregistrés
  # =====================================================
  
  test "submit_victory stores rankings" do
    game = Game.create!(
      player_count: 2,
      game_status: :simultaneous_play,
      game_type: :quick_game,
      waiting_players_count: 2,
      turn_duration: 120
    )
    
    user1 = create_test_user
    user2 = create_test_user
    game_user1 = game.game_users.create!(user: user1)
    game_user2 = game.game_users.create!(user: user2)
    
    rankings = [
      { game_user_id: game_user1.id, rank: 1 },
      { game_user_id: game_user2.id, rank: 2 }
    ]
    
    post "/api/v1/games/#{game.id}/submit_victory",
      params: { rankings: rankings }.to_json,
      headers: auth_headers(user1)
    
    assert_response :success
    json = JSON.parse(response.body)
    assert json['success']
    assert_equal user1.id, game.reload.submitted_by_user_id
  end

  test "submit_victory completes game when second user confirms" do
    game = Game.create!(
      player_count: 2,
      game_status: :simultaneous_play,
      game_type: :quick_game,
      waiting_players_count: 2,
      turn_duration: 120
    )
    
    user1 = create_test_user
    user2 = create_test_user
    game_user1 = game.game_users.create!(user: user1, rank: 1)
    game_user2 = game.game_users.create!(user: user2, rank: 2)
    game.update!(submitted_by_user_id: user1.id)
    
    rankings = [
      { game_user_id: game_user1.id, rank: 1 },
      { game_user_id: game_user2.id, rank: 2 }
    ]
    
    post "/api/v1/games/#{game.id}/submit_victory",
      params: { rankings: rankings }.to_json,
      headers: auth_headers(user2)
    
    assert_response :success
    json = JSON.parse(response.body)
    assert json['success']
    assert_equal "completed", game.reload.game_status
  end

  test "submit_victory marks dispute when rankings differ" do
    game = Game.create!(
      player_count: 2,
      game_status: :simultaneous_play,
      game_type: :quick_game,
      waiting_players_count: 2,
      turn_duration: 120
    )
    
    user1 = create_test_user
    user2 = create_test_user
    game_user1 = game.game_users.create!(user: user1, rank: 1)
    game_user2 = game.game_users.create!(user: user2, rank: 2)
    game.update!(submitted_by_user_id: user1.id)
    
    # User2 soumet des rankings différents
    different_rankings = [
      { game_user_id: game_user1.id, rank: 2 },
      { game_user_id: game_user2.id, rank: 1 }
    ]
    
    post "/api/v1/games/#{game.id}/submit_victory",
      params: { rankings: different_rankings }.to_json,
      headers: auth_headers(user2)
    
    assert_response :success
    json = JSON.parse(response.body)
    assert_not json['success']
    assert_equal "end_dispute", game.reload.game_status
  end

  # =====================================================
  # TEST: launch_custom_game endpoint
  # Objectif: Vérifier le lancement de partie custom
  # Risque: Partie lancée par non-créateur
  # =====================================================
  
  test "launch_custom_game starts game for creator" do
    creator = create_test_user
    game = Game.create!(
      player_count: 8,
      game_status: :waiting_for_players,
      game_type: :custom_game,
      waiting_players_count: 2,
      turn_duration: 120,
      creator: creator,
      custom_code: "ABC123"
    )
    game.game_users.create!(user: creator)
    game.game_users.create!(user: create_test_user)
    
    post "/api/v1/games/#{game.id}/launch_custom_game",
      params: { game_duration: 60 }.to_json,
      headers: auth_headers(creator)
    
    assert_response :success
    json = JSON.parse(response.body)
    assert json['success']
    assert_equal "waiting_for_confirmation_players", game.reload.game_status
  end

  test "launch_custom_game fails for non-creator" do
    creator = create_test_user
    other_user = create_test_user
    game = Game.create!(
      player_count: 8,
      game_status: :waiting_for_players,
      game_type: :custom_game,
      waiting_players_count: 2,
      turn_duration: 120,
      creator: creator,
      custom_code: "ABC123"
    )
    game.game_users.create!(user: creator)
    game.game_users.create!(user: other_user)
    
    post "/api/v1/games/#{game.id}/launch_custom_game",
      params: { game_duration: 60 }.to_json,
      headers: auth_headers(other_user)
    
    assert_response :success
    json = JSON.parse(response.body)
    assert_not json['success']
    assert_equal "waiting_for_players", game.reload.game_status
  end

  # =====================================================
  # TEST: set_game not found
  # Objectif: Vérifier la gestion des IDs invalides
  # Risque: Erreur 500 au lieu de 404
  # =====================================================
  
  test "returns 404 for non-existent game" do
    user = create_test_user
    
    post "/api/v1/games/999999/i_am_ready", headers: auth_headers(user)
    
    assert_response :not_found
    json = JSON.parse(response.body)
    assert_not json['success']
    assert_equal "Game not found", json['message']
  end
end



