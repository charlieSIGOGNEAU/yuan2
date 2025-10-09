class AddAuthenticationToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :email, :string
    add_column :users, :provider, :string, default: 'email'
    add_column :users, :password_digest, :string
    
    # Ajouter un index unique sur email (pour les providers email)
    add_index :users, :email, unique: true
    
    # Rendre le nom optionnel maintenant (sera généré pour Google)
    change_column_null :users, :name, true
  end
end
