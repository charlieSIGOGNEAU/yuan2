<?php

namespace App\Actions\Games;

use App\Models\User;
use App\Models\Game;
use App\Models\GameUser;
use App\Enums\GameStatus;
use App\Enums\GameType;
use Illuminate\Support\Facades\DB;
use App\Services\Games\GameService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class CreateCustomGame
{
    public function __construct(private GameService $gameService)
    {
    }

    /**
     *  crée une partie custom.
     * * @param User $user
     * @return array|null
     */
    public function __invoke(User $user) : ?array
    {
        if ($ongoingGame = $this->gameService->ongoingGame($user)) {
            $game = $ongoingGame['game'];
            $gameUser = $game->gameUsers->firstWhere('user_id', $user->id);
            return [
                'game' => $game,
                'game_user' => $gameUser,
                'message' => "ongoing game"
            ];
        }
        $game =null;
        $customCode = null;
        $attempts = 0;
        do {
            $attempts++;
            $customCode = strtoupper(Str::random(6));
            $game = Game::create([
                'game_type' => GameType::CUSTOM_GAME,
                'game_status' => GameStatus::WAITING_FOR_PLAYERS,
                'creator_id' => $user->id,
                'custom_code' => $customCode,
                'player_count' => 8,
                'waiting_players_count' => 1,
            ]);
            if (!$game->exists) {
                Log::error("erreur lors de la creation de la partie");
            }
            
        } while ($attempts < 3 && !$game->exists);
        if (!$game->exists) {
            throw new \Exception("Impossible de créer une partie après plusieurs tentatives.");
        }
        $gameUser = GameUser::create([
            'game_id' => $game->id,
            'user_id' => $user->id
        ]);
        return [
            'game' => $game,
            'game_user' => $gameUser,
            'custom_code' => $customCode,
            'message' => 'new game'
        ];
    }        
}