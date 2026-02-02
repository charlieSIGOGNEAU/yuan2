class AddIsCreatorOfGameToGameUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :game_users, :is_creator_of_game, :boolean, default: false
  end
end
