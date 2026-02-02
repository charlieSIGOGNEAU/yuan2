class AddWaitingPlayersCountToGames < ActiveRecord::Migration[7.2]
  def change
    add_column :games, :waiting_players_count, :integer, default: 0, null: false
  end
end
