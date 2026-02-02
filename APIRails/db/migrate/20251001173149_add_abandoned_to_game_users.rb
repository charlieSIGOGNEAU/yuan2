class AddAbandonedToGameUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :game_users, :abandoned, :boolean, default: false, null: false
  end
end
