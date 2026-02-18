<?php

namespace App\Actions\GameUser;

use App\Models\Game;
use App\Models\User;
use App\Models\GameUser;
use App\Enums\GameStatus;
use App\Services\GameBroadcastService;
use Illuminate\Support\Facades\DB;

class AbandonGame
{
    public function __construct(private GameBroadcastService $broadcastService)
    {
    }

    public function __invoke(GameUser $gameUser, Game $game): array
    {
        return DB::transaction(function () use ($gameUser, $game) {
            Game::where('id', $game->id)->lockForUpdate()->first();
            $game->refresh();

            $earlyPhases = [
                GameStatus::WAITING_FOR_PLAYERS,
                GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS,
                GameStatus::INSTALLATION_PHASE,
                GameStatus::INITIAL_PLACEMENT,
                GameStatus::BIDDING_PHASE,
                GameStatus::STARTING_SPOT_SELECTION
            ];

            if (in_array($game->game_status, $earlyPhases)) {
                // Récupération directe des objets User autonomes pour faire les brodcasts apres la destruction de la game et gameUser
                $usersToNotify = User::whereIn('id', function($query) use ($game) {
                    $query->select('user_id')
                        ->from('game_users')
                        ->where('game_id', $game->id)
                        ->where('abandoned', false);
                })->get();

                DB::afterCommit(function () use ($usersToNotify) {
                    foreach ($usersToNotify as $user) {
                        $this->broadcastService->userBroadcastGameDestroyed($user);
                    }
                });

                $game->delete(); 
                return ['success' => true, 'message' => "Game destroyed"];
            }

            if (in_array($game->game_status, [GameStatus::COMPLETED, GameStatus::END_DISPUTE])) {
                return ['success' => true, 'message' => "Game already finished"];
            }

            $gameUser->update(['abandoned' => true]);

            DB::afterCommit(fn() => $this->broadcastService->userBroadcastPlayerAbandoned($game, $gameUser));

            $activePlayers = $game->gameUsers()->where('abandoned', false)->get();
            $count = $activePlayers->count();

            if ($count <= 1) {
                $game->update(['game_status' => GameStatus::COMPLETED]);

                if ($count === 1) {
                    $winner = $activePlayers->first();
                    DB::afterCommit(fn() => $this->broadcastService->userBroadcastGameWon($winner));
                }
            }

            return ['success' => true, 'message' => "Game abandoned successfully"];
        });
    }
}