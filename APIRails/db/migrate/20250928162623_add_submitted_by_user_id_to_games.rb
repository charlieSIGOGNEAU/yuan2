class AddSubmittedByUserIdToGames < ActiveRecord::Migration[7.2]
  def change
    add_column :games, :submitted_by_user_id, :integer
    add_foreign_key :games, :users, column: :submitted_by_user_id
    add_index :games, :submitted_by_user_id
  end
end
