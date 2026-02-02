class AddUniqueWaitingQuickGameConstraint < ActiveRecord::Migration[7.2]
  def change
    add_index :games, [:game_type, :game_status],
      unique: true,
      where: "game_status = 0 AND game_type = 0",
      name: "index_unique_waiting_quick_game"
  end
end
