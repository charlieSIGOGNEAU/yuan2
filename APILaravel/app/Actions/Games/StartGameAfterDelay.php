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
                return ['message' => 'invalid status'];
            }

            if ($game->updated_at->gt(now()->subSeconds(20))) {
                return ['message' => 'unexpired timeout'];
            }

            $game->gameUsers()->where('player_ready', false)->delete();

            $game->refresh();
            $currentPlayersCount = $game->gameUsers()->count();

            if ($currentPlayersCount >= 2) {
                $this->gameService->startInstallationPhase($game);
                return ['message' => 'game ready installation_phase'];
            } 
            
            if ($currentPlayersCount === 0 || $game->game_type === GameType::CUSTOM_GAME) {
                $game->gameUsers()->delete();
                $game->delete();
                return ['message' => 'game destroyed'];
            }

            // donc 1 joueur
            $game->update([
                'game_status' => GameStatus::WAITING_FOR_PLAYERS,
                'waiting_players_count' => $currentPlayersCount
            ]);
            
            return [
                'message' => 'missing player, waiting for player',
            ];
        });
    }
}