class GameUser < ApplicationRecord
    belongs_to :user
    belongs_to :game
    belongs_to :clan, optional: true
    has_many :biddings, dependent: :destroy
  
    validates :user_name, presence: true
  
    before_validation :set_user_name, on: :create
  
    private
  
    def set_user_name
      self.user_name = user.name if user
    end
  
  end 