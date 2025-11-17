class Api::V1::UsersController < ApplicationController
  before_action :authenticate_request

  def update
    updates = {}
    language = params[:language]
    fps = params[:fps]
    render_scale = params[:render_scale]
    shadow_realtime = params[:shadow_realtime]

    if language.present?
      unless %w[fr en zh ja ko de es pt ru it].include?(language)
        render json: { success: false, message: "Language not supported" }, status: 422
        return
      end
      updates[:language] = language
    end

    updates[:fps] = fps if fps.present?
    updates[:render_scale] = render_scale if render_scale.present?
    updates[:shadow_realtime] = shadow_realtime unless shadow_realtime.nil?

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
