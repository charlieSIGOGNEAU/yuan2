<?php

namespace App\Actions\Games;

use App\Models\Game;
use App\Models\GameUser;
use App\Enums\GameStatus;
use App\Enums\GameType;
use Illuminate\Support\Facades\DB;

class LaunchCustomGame
{
    public function __invoke(Game $game, int $duration): array
    {
        $placeAvailable = 0;
        try{
            DB::transaction(function () use ($game, &$placeAvailable) {
                $game->lockForUpdate();
                $game->refresh();
                if ($game->game_status !== GameStatus::WAITING_FOR_PLAYERS) {
                    throw new \Exception("Game not in waiting_for_players");
                }
                $game->update([
                    'game_status' => GameStatus::WAITING_FOR_CONFIRMATION_PLAYERS,
                ]);
                $placeAvailable = 8 - $game->waiting_players_count;
            });
        }catch (\Exception $e) {
            return ['game' => $game, 'message' => 'part already launched'];
        }
        if ($placeAvailable > 0) {
            $this->reassignPlayers($game, $placeAvailable);
        }

        $playerCount = GameUser::where('game_id', $game->id)->count();
        $game->update([
            'player_count' => $playerCount,
            'waiting_players_count' => $playerCount,
            'turn_duration' => max($duration, 20),
        ]);
        return ['game' => $game, 'message' => 'go ready to play'];
    }

    private function reassignPlayers(Game $game, int $placeAvailable) {
        if (!$otherGame = Game::where('game_status', GameStatus::WAITING_FOR_PLAYERS)->where('game_type', GameType::QUICK_GAME)->first()) {
            return;
        }
        DB::transaction(function () use ($game, $otherGame, $placeAvailable) {
            $game->lockForUpdate();
            $game->refresh();
            if ($otherGame->game_status !== GameStatus::WAITING_FOR_PLAYERS) {
                return;
            }
            $numPlayersToMove = min($placeAvailable, $otherGame->waiting_players_count);
            if ($numPlayersToMove <= 0) return;
            $otherGame->decrement('waiting_players_count', $numPlayersToMove);
            $game->increment('waiting_players_count', $numPlayersToMove);
            
            // je récupère les IDs des joueurs à déplacer
            $playerIdsToMove = $otherGame->gameUsers()
                ->limit($numPlayersToMove)
                ->pluck('id');

            // je fait les updates en une requete
            $otherGame->gameUsers()->whereIn('id', $playerIdsToMove)->update([
                'game_id' => $game->id
            ]);
        });
    }
}


            
            