class RenameBiddingsLeftToBiddingsTurn < ActiveRecord::Migration[7.2]
  def change
    rename_column :games, :biddings_left, :biddings_turn
  end
end
