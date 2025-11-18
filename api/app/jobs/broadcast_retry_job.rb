# Job Sidekiq pour vérifier et retenter les broadcasts non confirmés
# S'exécute toutes les 5 secondes via le scheduler

class BroadcastRetryJob
  include Sidekiq::Job

  def perform
    BroadcastConfirmationService.check_and_retry_pending_broadcasts
  end
end

