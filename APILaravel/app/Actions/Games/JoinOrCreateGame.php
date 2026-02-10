<?php

namespace App\Actions\Games;

use App\Models\User;
use App\Models\Game;
use App\Enums\GameStatus;
use App\Enums\GameType;
use App\Services\Games\GameService;
use Illuminate\Support\Facades\DB;

class JoinOrCreateGame
{
    public function __construct(private GameService $gameService)
    {
    }
    /**
     * Cherche ou crée une partie en attente.
     * * @param User $user
     * @return array|null
     */
    public function __invoke(User $user) : ?array
    {
        if ($ongoingGame = $this->gameService->ongoingGame($user)) {
            return $ongoingGame;
        }
        $attempts = 0;
        while ($attempts < 3) {
            $attempts++;

            try {

                return DB::transaction(function () use ($user) : ?array {
                
                    $waitingGame = Game::where('game_status', GameStatus::WAITING_FOR_PLAYERS)
                        ->where('game_type', GameType::QUICK_GAME)
                        ->lockForUpdate()
                        ->first();
                    if ($waitingGame) {
                        $result = $this->addPlayer($waitingGame, $user);
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
                // On ne loggue que si on veut débugger les collision                // La boucle continue automatiquement vers l'essai suivant
                if ($attempts >= 3) {
                    throw $e; // On finit par lâcher l'erreur si ça échoue trop souvent
                }
            }
        }
        return null;
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