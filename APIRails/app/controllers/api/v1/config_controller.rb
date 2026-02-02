class Api::V1::ConfigController < ApplicationController
  # GET /api/v1/config/google_client_id
  def google_client_id
    render json: {
      client_id: ENV['GOOGLE_CLIENT_ID']
    }
  end
end

