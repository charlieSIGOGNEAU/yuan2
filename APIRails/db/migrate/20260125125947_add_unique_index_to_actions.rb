class AddUniqueIndexToActions < ActiveRecord::Migration[7.2]
  def change
    add_index :actions,
      [:game_id, :turn, :game_user_id],
      unique: true,
      name: "index_actions_unique_game_turn_user"
  end
end
