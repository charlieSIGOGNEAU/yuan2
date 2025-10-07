class User < ApplicationRecord
    belongs_to :current_game, class_name: 'Game', optional: true
    has_many :game_users
    has_many :games, through: :game_users
    has_many :tiles
    has_many :created_games, class_name: 'Game', foreign_key: 'creator_id'

    validates :name, presence: true

    def generate_jwt_token
      JsonWebToken.encode(user_id: id, name: name)
    end

    def self.find_by_token(token)
      decoded_token = JsonWebToken.decode(token)
      return nil unless decoded_token
      find_by(id: decoded_token[:user_id])
    end

end
  