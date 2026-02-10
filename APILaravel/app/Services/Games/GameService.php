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
        
}
