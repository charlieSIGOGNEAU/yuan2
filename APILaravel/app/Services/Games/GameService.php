<?php

namespace App\Services\Games;

use App\Models\User;
use App\Models\Game;
use App\Models\Tile;
use App\Enums\GameStatus;
use App\Enums\GameType;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
class GameService
{
    
    public function ongoingGame(User $user) : ?array
    {
        $excludedStatuses = [
            GameStatus::COMPLETED->value, 
            GameStatus::ABANDONED->value, 
            GameStatus::END_DISPUTE->value
        ];
        \Log::info($user->id);

        $existingGameForUser = Game::whereHas('gameUsers', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->where('abandoned', false);
        })
        ->whereNotIn('game_status', $excludedStatuses)
        ->first();

        if (!$existingGameForUser) {
            return null;
        }

        $gameUser = $existingGameForUser->gameUsers()->where('user_id', $user->id)->first();
        $message = $existingGameForUser->game_status === GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS ? "waiting for confirmation players" : "ongoing game";
        return [
            'game' => $existingGameForUser,
            'game_user' => $gameUser,
            'message' => $message
        ];
    }

    public function startInstallationPhase(Game $game)
    {
        $gameUsers = $game->gameUsers()->where('abandoned', false)->get();
        $game->update([
            'game_status' => GameStatus::INSTALLATION_PHASE,
            'player_count' => $gameUsers->count(),
            'clan_names' => $game->theClans()
        ]);
        $this->createTilesForPlayers($game, $gameUsers);
    }



    public function createTilesForPlayers(Game $game, Collection $gameUsers)
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
