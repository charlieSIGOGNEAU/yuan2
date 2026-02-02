class RemoveReceivedTurnAndReceivedChaoFromClans < ActiveRecord::Migration[7.2]
  def change
    remove_column :clans, :received_turn, :integer
    remove_column :clans, :received_chao, :integer
  end
end
