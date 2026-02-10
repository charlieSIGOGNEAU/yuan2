<?php

namespace App\Actions\Games;

use App\Models\User;
use App\Models\Game;
use App\Services\Games\GameService;
use App\Enums\GameStatus;
use Illuminate\Support\Facades\DB;

class JoinCustomGame
{
    public function __construct(private GameService $gameService)
    {
    }

    /**rejoindre une partie avec un code custom
     * * @param User $user
     * @return array|null
     */
    public function __invoke(User $user, string $customCode) : array
    {
        if ($ongoingGame = $this->gameService->ongoingGame($user)) {
            return [
                'game' => $ongoingGame['game'],
                'game_user' => $ongoingGame['game_user'],
                'message' => $ongoingGame['message']
            ];
        }
        if (!$game = Game::where('custom_code', $customCode)->first()) {
            return [ 'message' => 'game not found'];
        }
        if ($game->game_Status === GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS) {
            return [ 'message' => 'game not in waiting_for_players'];
        }
        if ($game->waiting_players_count >= 8) {
            return ['message' => 'game full'];
        }
        return DB::transaction(function () use ($game, $user) {
            $game->lockForUpdate();
            $game->refresh();
            if ($game->waiting_players_count >= 8) {
                return [ 'message' => 'game full'];          
            }
            $game->increment('waiting_players_count');
            $gameUser = $game->gameUsers()->create(['user_id' => $user->id]);
            if ($game->waiting_players_count < 8) {
                return [
                    'game' => $game,
                    'game_user' => $gameUser,
                    'message' => 'joined game and waiting for other players'
                ];
            }
            else {
                return [
                    'game' => $game,
                    'game_user' => $gameUser,
                    'message' => 'joined game and game ready installation_phase'
                ];
            }
        });
    }
}