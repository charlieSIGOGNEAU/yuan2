Tile.delete_all
Action.delete_all
Bidding.delete_all
GameUser.delete_all
Clan.delete_all
Game.delete_all
User.delete_all

puts "Création d'utilisateurs de test avec email/password..."

# Créer 3 utilisateurs avec email/password (provider: email)
user1 = User.create!(
  email: "user1@mail.com",
  password: "user1@mail.com",
  password_confirmation: "user1@mail.com",
  provider: "email",
  language: "fr"
)
puts "✅ User1 créé: #{user1.email} (name: #{user1.name})"

user2 = User.create!(
  email: "user2@mail.com",
  password: "user2@mail.com",
  password_confirmation: "user2@mail.com",
  provider: "email",
  language: "fr"
)
puts "✅ User2 créé: #{user2.email} (name: #{user2.name})"

user3 = User.create!(
  email: "user3@mail.com",
  password: "user3@mail.com",
  password_confirmation: "user3@mail.com",
  provider: "email",
  language: "fr"
)
puts "✅ User3 créé: #{user3.email} (name: #{user3.name})"

# Créer quelques utilisateurs supplémentaires pour les tests
user4 = User.create!(
  email: "user4@mail.com",
  password: "user4@mail.com",
  password_confirmation: "user4@mail.com",
  provider: "email",
  language: "en"
)
puts "✅ User4 créé: #{user4.email} (name: #{user4.name})"

user5 = User.create!(
  email: "user5@mail.com",
  password: "user5@mail.com",
  password_confirmation: "user5@mail.com",
  provider: "email",
  language: "fr"
)
puts "✅ User5 créé: #{user5.email} (name: #{user5.name})"

user6 = User.create!(
  email: "user6@mail.com",
  password: "user6@mail.com",
  password_confirmation: "user6@mail.com",
  provider: "email",
  language: "fr"
)
puts "✅ User6 créé: #{user6.email} (name: #{user6.name})"


p "seed genere"