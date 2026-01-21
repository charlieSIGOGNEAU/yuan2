# Job pour vérifier et retenter les broadcasts non confirmés
# Utilise Active Job (compatible avec ou sans Sidekiq)

class BroadcastRetryJob < ApplicationJob
  queue_as :default

  def perform
    BroadcastConfirmationService.check_and_retry_pending_broadcasts
  end
end
