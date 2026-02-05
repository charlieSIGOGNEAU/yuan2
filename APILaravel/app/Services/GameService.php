<?php

namespace App\Services;

use App\Models\User;
use App\Models\Game;
use App\Enums\GameStatus;
use App\Enums\GameType;
use Illuminate\Support\Facades\DB;
class GameService
{
    public function findOrCreateWaitingGame(User $user)
    {
        $ongoingGame = $this->ongoingGame($user);
        if ($ongoingGame) {
            return $ongoingGame;
        }
        $attempts = 0;
        while ($attempts < 3) {
            $attempts++;

            try {

                return DB::transaction(function () use ($user) {
                
                    $waitingGame = Game::where('game_status', GameStatus::WAITING_FOR_PLAYERS)
                        ->where('game_type', GameType::QUICK_GAME)
                        ->lockForUpdate()
                        ->first();
                    if ($waitingGame) {
                        $result = $waitingGame->addPlayer($user);
                        return $result;
                    }
                    $game = Game::create([
                        'game_status' => GameStatus::WAITING_FOR_PLAYERS,
                        'game_type' => GameType::QUICK_GAME,
                        'player_count' => 3,
                        'waiting_players_count' => 1,
                        'turn_duration' => 120,
                    ]);
                    return [
                        'message' => 'new game',
                        'game' => $game,
                        'game_user' => $game->gameUsers()->create(['user_id' => $user->id])
                    ];
                });
            } catch (\Illuminate\Database\QueryException $e) {
                // On ne loggue que si on veut débugger les collisions
                // La boucle continue automatiquement vers l'essai suivant
                if ($attempts >= 3) {
                    throw $e; // On finit par lâcher l'erreur si ça échoue trop souvent
                }
            }
        }
        return null;
    }

    private function ongoingGame(User $user)
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
        $message = $existingGameForUser->game_status == GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS ? "waiting for confirmation players" : "ongoing game";
        return [
            'game' => $existingGameForUser,
            'game_user' => $gameUser,
            'message' => $message
        ];
    }

    // est dans une transaction
    private function addPlayer(Game $game, User $user)
    {
        $game->waiting_players_count++;

        if ($game->waiting_players_count >= $game->player_count) {
            $game->game_status = GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS;
            $message = 'game ready installation_phase';
        } else {
            $message = 'yes waiting for other players';
        }

        $game->save();

        return [
            'message' => $message,
            'game' => $game,
            'game_user' => $game->gameUsers()->create(['user_id' => $user->id]),
        ];

    }
}