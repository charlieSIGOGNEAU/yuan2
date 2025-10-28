class Api::V1::UsersController < ApplicationController
  before_action :authenticate_request

  # PATCH /api/v1/user
  def update
    language = params[:language]
    
    # Valider que la langue est supportée
    unless %w[fr en zh ja ko de es pt ru it].include?(language)
      render json: { success: false, message: "Language not supported" }, status: 422
      return
    end

    if current_user.update(language: language)
      render json: { 
        success: true, 
        message: "Language updated successfully",
        language: language 
      }
    else
      render json: { 
        success: false, 
        message: "Failed to update language",
        errors: current_user.errors.full_messages 
      }, status: 422
    end
  end
end

