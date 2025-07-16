Tile.delete_all
Action.delete_all
Encher.delete_all
GameUser.delete_all
Clan.delete_all
Game.delete_all
User.delete_all

User.create(name: "user1")
User.create(name: "user2")
User.create(name: "user3")
User.create(name: "user4")
User.create(name: "user5")
User.create(name: "user6")



# # Créer des utilisateurs de test
# puts "Création d'utilisateurs de test..."

# test_users = [
#   { name: "user1", email: "user1@test.com" },
#   { name: "user2", email: "user2@test.com" },
#   { name: "user3", email: "user3@test.com" },
#   { name: "user4", email: "user4@test.com" },
#   { name: "user5", email: "user5@test.com" },
#   { name: "user6", email: "user6@test.com" }
# ]

# test_users.each do |user_data|
#   user = User.find_or_create_by(email: user_data[:email]) do |u|
#     u.name = user_data[:name]
#   end
#   puts "✅ Utilisateur créé/trouvé: #{user.name} (#{user.email})"
# end
# user1=User.find_by(email: "user1@test.com")
# user2=User.find_by(email: "user2@test.com")
# user3=User.find_by(email: "user3@test.com")
# user4=User.find_by(email: "user4@test.com")
# user5=User.find_by(email: "user5@test.com")
# user6=User.find_by(email: "user6@test.com")

# game1 = Game.create!(game_status: 0, game_type: 0, player_count: 2)
# game2 = Game.create!(game_status: 0, game_type: 0, player_count: 3)
# game3 = Game.create!(game_status: 0, game_type: 0, player_count: 4)

# gameuser1=GameUser.create!(user_id: user1.id, game_id: game1.id, clan: 'clan1', user_name: 'user1')
# gameuser2=GameUser.create!(user_id: user2.id, game_id: game1.id, clan: 'clan2', user_name: 'user2')
# gameuser3=GameUser.create!(user_id: user3.id, game_id: game1.id, clan: 'clan3', user_name: 'user3')
# gameuser4=GameUser.create!(user_id: user4.id, game_id: game2.id, clan: 'clan4', user_name: 'user4')
# gameuser5=GameUser.create!(user_id: user5.id, game_id: game2.id, clan: 'clan5', user_name: 'user5')
# gameuser6=GameUser.create!(user_id: user6.id, game_id: game2.id, clan: 'clan6', user_name: 'user6')

# puts "#{User.count} utilisateurs total en base"
# puts "Seed terminé !"

p "seed genere"