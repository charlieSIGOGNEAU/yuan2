class Tout < ActiveRecord::Migration[7.2]
  def change
    create_table :tests do |t|
      t.string :name

      t.timestamps
    end
  
    create_table :users do |t|
      t.string :name

      t.timestamps
    end
  
    create_table :games do |t|
      t.integer :game_status, default: 0, null: false
      t.integer :game_type, default: 0, null: false
      t.integer :player_count
      t.string :clans

      t.timestamps
    end

    create_table :clans do |t|
      t.references :game, null: false, foreign_key: true
      t.string :color
      t.string :name
      t.integer :start_q
      t.integer :start_r
      t.integer :received_turn
      t.integer :received_chao

      t.timestamps
    end
  
    create_table :tiles do |t|
      t.string :name
      t.integer :position_q
      t.integer :position_r
      t.integer :rotation
      t.references :game_user, null: false, foreign_key: true
      t.references :game, null: false, foreign_key: true
      t.integer :turn

      t.timestamps
    end
  
    create_table :game_users do |t|
      t.references :user, null: false, foreign_key: true
      t.references :game, null: false, foreign_key: true
      t.references :clan, foreign_key: true
      t.string :user_name

      t.timestamps
    end

    create_table :actions do |t|
      t.references :game_user, null: false, foreign_key: true
      t.references :game, null: false, foreign_key: true
      t.string :action
      t.integer :turn

      t.timestamps
    end

    create_table :enchers do |t|
      t.references :game, null: false, foreign_key: true
      t.references :game_user, null: false, foreign_key: true
      t.integer :turn
      t.integer :chao
      t.boolean :victory

      t.timestamps
    end

    add_index :game_users, [:user_id, :game_id], unique: true
  end

end
