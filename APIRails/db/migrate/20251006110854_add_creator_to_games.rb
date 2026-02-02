class AddCreatorToGames < ActiveRecord::Migration[7.2]
  def change
    add_column :games, :creator_id, :integer
  end
end
