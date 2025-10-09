class User < ApplicationRecord
    belongs_to :current_game, class_name: 'Game', optional: true
    has_many :game_users
    has_many :games, through: :game_users
    has_many :tiles
    has_many :created_games, class_name: 'Game', foreign_key: 'creator_id'

    # Activer bcrypt pour les mots de passe
    has_secure_password validations: false

    # Validations
    validates :email, presence: true, uniqueness: true, 
              format: { with: URI::MailTo::EMAIL_REGEXP, message: "doit être une adresse email valide" }
    validates :provider, presence: true, inclusion: { in: %w[email google], message: "doit être 'email' ou 'google'" }
    
    # Validation conditionnelle : password requis seulement pour provider 'email'
    validates :password, presence: true, length: { minimum: 6 }, if: -> { provider == 'email' && new_record? }
    validates :password_digest, presence: true, if: -> { provider == 'email' }
    
    # Le nom peut être généré automatiquement à partir de l'email
    before_validation :generate_name_from_email, if: -> { name.blank? && email.present? }

    def generate_jwt_token
      JsonWebToken.encode(user_id: id, name: name, email: email)
    end

    def self.find_by_token(token)
      decoded_token = JsonWebToken.decode(token)
      return nil unless decoded_token
      find_by(id: decoded_token[:user_id])
    end

    private

    def generate_name_from_email
      self.name = email.split('@').first if email.present?
    end

end
  