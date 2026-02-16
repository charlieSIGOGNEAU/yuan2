<?php

namespace App\Actions\Games;

use App\Models\Game;
use App\Enums\GameStatus;
use Illuminate\Support\Facades\DB;
use App\Services\Games\GameService;



class StartGameAfterDelay
{
    public function __construct(private GameService $gameService){}
    
    public function __invoke(Game $game)
    {
        return DB::transaction(function () use ($game) {
            $game->lockForUpdate()->refresh();

            if ($game->game_status !== GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS) {
                return ['status' => StartGameAfterDelayResult::INVALID_STATUS];
            }

            if ($game->updated_at->gt(now()->subSeconds(20))) {
                return ['status' => StartGameAfterDelayResult::UNEXPIRED_TIMEOUT];
            }

            $userIdToDestroed = $game->gameUsers()->where('player_ready', false)->pluck('user_id');

            $game->gameUsers()->whereIn('user_id', $userIdToDestroed)->delete();
            $game->unsetRelation('gameUsers');

            $currentPlayersCount = $game->gameUsers()->count();

            if ($currentPlayersCount >= 2) {
                $this->gameService->startInstallationPhase($game);
                return [
                    'status' => StartGameAfterDelayResult::GAME_READY_INSTALLATION_PHASE,
                    'userIdToDestroed' => $userIdToDestroed
                ];
            } 
            
            if ($currentPlayersCount === 0 || $game->game_type === GameType::CUSTOM_GAME) {
                $game->gameUsers()->delete();
                $game->delete();
                return [
                    'status' => StartGameAfterDelayResult::GAME_DESTROYED,
                    'userIdToDestroed' => $userIdToDestroed
                ];
            }

            // donc 1 joueur
            $game->update([
                'game_status' => GameStatus::WAITING_FOR_PLAYERS,
                'waiting_players_count' => $currentPlayersCount
            ]);
            
            return [
                'status' => StartGameAfterDelayResult::MISSING_PLAYER,
                'userIdToDestroed' => $userIdToDestroed
            ];
        });
    }
}