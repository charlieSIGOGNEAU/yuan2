class Tout < ActiveRecord::Migration[7.2]
  def change
    # Tables sans dépendances (créées en premier)
    create_table :tests do |t|
      t.string :name

      t.timestamps
    end
  
    create_table :users do |t|
      t.string :name
      t.string :language, default: 'fr', null: false
      t.integer :fps, default: 60, null: false
      t.decimal :render_scale, default: 1, null: false
      t.boolean :shadow_realtime , default: true, null: false

      t.timestamps
    end
  
    create_table :games do |t|
      t.integer :game_status, default: 0, null: false
      t.integer :game_type, default: 0, null: false
      t.integer :player_count
      t.string :clan_names
      t.integer :biddings_turn, default: 1, null: false
      t.integer :turn_duration , default: 120, null: false

      t.timestamps
    end

    # Tables qui dépendent de games (créées après games)
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
  
    # game_users dépend de users, games et clans (créée après ces tables)
    create_table :game_users do |t|
      t.references :user, null: false, foreign_key: true
      t.references :game, null: false, foreign_key: true
      t.references :clan, foreign_key: true
      t.boolean :player_ready, default: false, null: false
      t.string :user_name

      t.timestamps
    end

    add_index :game_users, [:user_id, :game_id], unique: true

    # Tables qui dépendent de game_users (créées après game_users)
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

    create_table :actions do |t|
      t.references :game_user, null: false, foreign_key: true
      t.references :game, null: false, foreign_key: true
      t.string :action
      t.integer :turn

      t.timestamps
    end

    add_index :actions, [:game_user_id, :turn, :action], unique: true

    create_table :biddings do |t|
      t.references :game, null: false, foreign_key: true
      t.references :game_user, null: false, foreign_key: true
      t.integer :turn
      t.integer :chao
      t.boolean :victory

      t.timestamps
    end
  end

end
