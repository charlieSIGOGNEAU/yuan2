class ModifyActionsTable < ActiveRecord::Migration[7.2]
  def change
    # Supprimer la colonne action (string)
    remove_column :actions, :action
    
    # Ajouter les 5 nouvelles colonnes integer
    add_column :actions, :position_q, :integer
    add_column :actions, :position_r, :integer
    add_column :actions, :development_level, :integer
    add_column :actions, :fortification_level, :integer
    add_column :actions, :militarisation_level, :integer
  end
end
