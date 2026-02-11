<?php

namespace App\Services\Games;

use App\Models\User;
use App\Models\Game;
use App\Enums\GameStatus;
use App\Enums\GameType;
use Illuminate\Support\Facades\DB;
class GameService
{
    
    public function ongoingGame(User $user) : ?array
    {
        $existingGameForUser = Game::whereHas('gameUsers', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->where('abandoned', false);
        })
        ->whereNotIn('game_status', [GameStatus::COMPLETED, GameStatus::ABANDONED])
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
        $game->update([
            'game_status' => GameStatus::INSTALLATION_PHASE,
            'player_count' => $game->gameUsers()->where('abandoned', false)->count()
        ]);
        $this->createTilesForPlayers($game);
        $game->update([
            'clan_names' => $this->theClans($game)
        ]);
    }



    private function createTilesForPlayers(Game $game)
    {
        
    }


    private function theClans(Game $game) : string
    {
        $clans = ["black_clan","red_clan","green_clan","orange_clan","white_clan","blue_clan","purple_clan","yellow_clan"];
        return implode(" ", array_slice($clans, 0, $game->player_count));
    }
        
}
