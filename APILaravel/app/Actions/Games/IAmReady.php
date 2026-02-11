<?php

namespace App\Actions\Games;

use Illuminate\Support\Facades\DB;
use App\Models\GameUser;
use App\Models\Game;
use App\Models\Tile;
use App\Enums\GameStatus;
use Illuminate\Support\Collection;

class IAmReady
{
    public function __invoke(GameUser $gameUser, Game $game)
    {
        return DB::transaction(function () use ($gameUser, $game) {
            $game->lockForUpdate();
            if ($game->game_status !== GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS) {
                return ['message' => 'game not in waiting for confirmation players'];
            }

            $gameUser->update(['player_ready' => true]);

            $readyCount = $game->gameUsers()->where('player_ready', true)->count();
            
            if ($readyCount !== $game->player_count) {
                return ['message' => 'player ready and game not full'];
            }
            $this->startInstallationPhase($game);
            return ['message' => 'player ready and game full'];
        });
    }

    private function startInstallationPhase(Game $game)
    {
        $gameUsers = $game->gameUsers()->where('abandoned', false)->get();
        $game->update([
            'game_status' => GameStatus::INSTALLATION_PHASE,
            'player_count' => $gameUsers->count(),
            'clan_names' => $game->theClans()
        ]);
        $this->createTilesForPlayers($game, $gameUsers);
    }



    private function createTilesForPlayers(Game $game, Collection $gameUsers)
    {
        $tileCount = $game->calculateTileCount();
        $userCount = $gameUsers->count();

        for ($i = 0; $i < $tileCount; $i++) {
            $currentUser = $gameUsers[$i % $userCount];
            
            $tilesData[] = [
                'game_id'      => $game->id,
                'game_user_id' => $currentUser->id,
                'turn'         => $i,
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }

        Tile::insert($tilesData);
    }

    
}
