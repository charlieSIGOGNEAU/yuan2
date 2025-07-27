class AddSimultaneousPlayTurnToGames < ActiveRecord::Migration[7.2]
  def change
    add_column :games, :simultaneous_play_turn, :integer, default: 0
  end
end
