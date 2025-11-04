class Api::V1::UsersController < ApplicationController
  before_action :authenticate_request

  def update
    updates = {}
    language = params[:language]
    fps = params[:fps]

    if language.present?
      unless %w[fr en zh ja ko de es pt ru it].include?(language)
        render json: { success: false, message: "Language not supported" }, status: 422
        return
      end
      updates[:language] = language
    end

    updates[:fps] = fps if fps.present?

    if updates.empty?
      render json: { success: false, message: "No parameters to update" }, status: 422
      return
    end

    if current_user.update(updates)
      render json: { success: true, message: "User updated successfully", updates: updates }
    else
      render json: { success: false, message: "Failed to update user", errors: current_user.errors.full_messages }, status: 422
    end
  end
end
