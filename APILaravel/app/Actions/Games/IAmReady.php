<?php

namespace App\Actions\Games;

use Illuminate\Support\Facades\DB;
use App\Models\GameUser;
use App\Models\Game;
use App\Enums\GameStatus;
use App\Services\Games\GameService;

class IAmReady
{
    public function __construct(private GameService $gameService){}
    
    public function __invoke(GameUser $gameUser, Game $game)
    {
        return DB::transaction(function () use ($gameUser, $game) {
            $game = Game::where('id', $game->id)->lockForUpdate()->first();
            if ($game->game_status !== GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS) {
                return ['message' => 'game not in waiting for confirmation players'];
            }

            $gameUser->update(['player_ready' => true]);

            $readyCount = $game->gameUsers()->where('player_ready', true)->count();
            
            if ($readyCount !== $game->player_count) {
                return ['message' => 'player ready and game not full'];
            }
            $this->gameService->startInstallationPhase($game);
            return ['message' => 'player ready and game full', 'game' => $game];
        });
    }
}
