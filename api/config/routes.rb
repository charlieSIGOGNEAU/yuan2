Rails.application.routes.draw do
  # Mount Action Cable server
  mount ActionCable.server => '/cable'
  
  # API routes
  namespace :api do
    namespace :v1 do
      # Routes d'authentification
      post 'auth/login', to: 'auth#login'
      get 'auth/me', to: 'auth#me'
      
      # Routes de jeu
      post 'games/quick_game', to: 'games#quick_game'
      
      # Routes de tiles
      resources :games do
        resources :tiles, only: [] do
          member do
            post :place
          end
        end
        
        # Routes de clans
        resources :clans, only: [:create]
      end
    end
  end

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health_check#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
