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
            // 1. Verrouillage et rafraîchissement
            Game::where('id', $game->id)->lockForUpdate()->first();
            $game->refresh();

            // 2. Cas des phases précoces (Destruction de la partie)
            $earlyPhases = [
                GameStatus::WAITING_FOR_PLAYERS,
                GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS,
                GameStatus::INSTALLATION_PHASE,
                GameStatus::INITIAL_PLACEMENT,
                GameStatus::BIDDING_PHASE,
                GameStatus::STARTING_SPOT_SELECTION
            ];

            if (in_array($game->game_status, $earlyPhases)) {
                // Récupération directe des objets User autonomes
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

            // 3. Vérification si déjà fini
            if (in_array($game->game_status, [GameStatus::COMPLETED, GameStatus::END_DISPUTE])) {
                return ['success' => true, 'message' => "Game already finished"];
            }

            // 4. Marquage de l'abandon
            $gameUser->update(['abandoned' => true]);

            // Broadcast : "Un joueur a abandonné" (Informer les survivants)
            DB::afterCommit(fn() => $this->broadcastService->userBroadcastPlayerAbandoned($game, $gameUser));

            // 5. Vérification de la fin de partie
            $activePlayers = $game->gameUsers()->where('abandoned', false)->get();
            $count = $activePlayers->count();

            if ($count <= 1) {
                $game->update(['game_status' => GameStatus::COMPLETED]);

                if ($count === 1) {
                    $winner = $activePlayers->first();
                    // Notification spécifique au gagnant
                    DB::afterCommit(fn() => $this->broadcastService->userBroadcastGameWon($winner));
                }
            }

            // 6. Notification globale (Mise à jour de l'état du jeu pour tous)
            DB::afterCommit(fn() => $this->broadcastService->gameBroadcastGameDetails($game));

            return ['success' => true, 'message' => "Game abandoned successfully"];
        });
    }
}