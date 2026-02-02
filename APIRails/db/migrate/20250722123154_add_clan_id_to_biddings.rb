class AddClanIdToBiddings < ActiveRecord::Migration[7.2]
  def change
    add_reference :biddings, :clan, null: true, foreign_key: true, index: true
  end
end
