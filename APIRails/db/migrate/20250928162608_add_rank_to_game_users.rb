class AddRankToGameUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :game_users, :rank, :integer
  end
end
