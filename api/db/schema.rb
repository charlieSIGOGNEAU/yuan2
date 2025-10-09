# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2025_10_09_114846) do
  create_table "actions", force: :cascade do |t|
    t.integer "game_user_id", null: false
    t.integer "game_id", null: false
    t.integer "turn"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "position_q"
    t.integer "position_r"
    t.integer "development_level"
    t.integer "fortification_level"
    t.integer "militarisation_level"
    t.index ["game_id"], name: "index_actions_on_game_id"
    t.index ["game_user_id"], name: "index_actions_on_game_user_id"
  end

  create_table "biddings", force: :cascade do |t|
    t.integer "game_id", null: false
    t.integer "game_user_id", null: false
    t.integer "turn"
    t.integer "chao"
    t.boolean "victory"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "clan_id"
    t.index ["clan_id"], name: "index_biddings_on_clan_id"
    t.index ["game_id"], name: "index_biddings_on_game_id"
    t.index ["game_user_id"], name: "index_biddings_on_game_user_id"
  end

  create_table "clans", force: :cascade do |t|
    t.integer "game_id", null: false
    t.string "color"
    t.string "name"
    t.integer "start_q"
    t.integer "start_r"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["game_id"], name: "index_clans_on_game_id"
  end

  create_table "game_users", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "game_id", null: false
    t.integer "clan_id"
    t.string "user_name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "rank"
    t.boolean "abandoned", default: false, null: false
    t.boolean "is_creator_of_game", default: false
    t.index ["clan_id"], name: "index_game_users_on_clan_id"
    t.index ["game_id"], name: "index_game_users_on_game_id"
    t.index ["user_id", "game_id"], name: "index_game_users_on_user_id_and_game_id", unique: true
    t.index ["user_id"], name: "index_game_users_on_user_id"
  end

  create_table "games", force: :cascade do |t|
    t.integer "game_status", default: 0, null: false
    t.integer "game_type", default: 0, null: false
    t.integer "player_count"
    t.string "clan_names"
    t.integer "biddings_turn", default: 1, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "simultaneous_play_turn", default: 0
    t.integer "submitted_by_user_id"
    t.integer "waiting_players_count", default: 0, null: false
    t.integer "creator_id"
    t.string "custom_code"
    t.index ["custom_code"], name: "index_games_on_custom_code", unique: true
    t.index ["submitted_by_user_id"], name: "index_games_on_submitted_by_user_id"
  end

  create_table "tests", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "tiles", force: :cascade do |t|
    t.string "name"
    t.integer "position_q"
    t.integer "position_r"
    t.integer "rotation"
    t.integer "game_user_id", null: false
    t.integer "game_id", null: false
    t.integer "turn"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["game_id"], name: "index_tiles_on_game_id"
    t.index ["game_user_id"], name: "index_tiles_on_game_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "name"
    t.string "language", default: "fr", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "email"
    t.string "provider", default: "email"
    t.string "password_digest"
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "actions", "game_users"
  add_foreign_key "actions", "games"
  add_foreign_key "biddings", "clans"
  add_foreign_key "biddings", "game_users"
  add_foreign_key "biddings", "games"
  add_foreign_key "clans", "games"
  add_foreign_key "game_users", "clans"
  add_foreign_key "game_users", "games"
  add_foreign_key "game_users", "users"
  add_foreign_key "games", "users", column: "submitted_by_user_id"
  add_foreign_key "tiles", "game_users"
  add_foreign_key "tiles", "games"
end
