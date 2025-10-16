Rails.application.routes.draw do
  # Mount Action Cable server
  mount ActionCable.server => '/cable'
  
  # API routes
  namespace :api do
    namespace :v1 do
      # Routes d'authentification
      post 'auth/login', to: 'auth#login'
      post 'auth/login_email', to: 'auth#login_email'
      post 'auth/signup', to: 'auth#signup'
      post 'auth/google_login', to: 'auth#google_login'
      get 'auth/me', to: 'auth#me'
      
      # Routes de configuration
      get 'config/google_client_id', to: 'config#google_client_id'
      
      # Routes utilisateur
      patch 'user', to: 'users#update'
      
      # Routes de jeu
      post 'games/quick_game', to: 'games#quick_game'
      post 'games/creat_custom_game', to: 'games#creat_custom_game'
      post 'games/join_game_custom', to: 'games#join_game_custom'
      post 'games/launch_custom_game', to: 'games#launch_custom_game'
      post 'games/startGameAfterTimeout', to: 'games#startGameAfterTimeout'
      post 'games/i_am_ready', to: 'games#i_am_ready'
      post 'games/startGameAfterDelay', to: 'games#startGameAfterDelay'
      post 'games/give_up_game', to: 'games#give_up_game'

      # Routes de tiles
      resources :games do
        member do
          post :submit_victory
        end
        resources :tiles, only: [] do
          member do
            post :place
          end
        end
        
        # Routes de clans
        resources :clans, only: [:create]
        
        # Routes de bidding
        resources :bidding, only: [:create]
        
        # Routes d'actions
        resources :actions, only: [:create]
        
        # Routes de game_users
        resources :game_users, only: [] do
          member do
            post :abandon
          end
        end
      end
      
    end
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health_check#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
