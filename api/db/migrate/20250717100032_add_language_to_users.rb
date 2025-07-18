class AddLanguageToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :language, :string, default: 'fr', null: false
  end
end
