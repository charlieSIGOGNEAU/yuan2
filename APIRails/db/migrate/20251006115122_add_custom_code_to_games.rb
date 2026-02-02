class AddCustomCodeToGames < ActiveRecord::Migration[7.2]
  def change
    add_column :games, :custom_code, :string
    add_index :games, :custom_code, unique: true
  end
end
