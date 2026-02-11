<?php

namespace App\Actions\Games;

use App\Models\Game;
use App\Models\User;
use App\Enums\GameStatus;
use Illuminate\Support\Facades\DB;

class SubmitVictory
{
    public function __invoke(Game $game, User $user, array $rankings)
    {
        return DB::transaction(function () use ($game, $user, $rankings) {
            $game->lockForUpdate();

            if ($game->game_status === GameStatus::COMPLETED || $game->game_status === GameStatus::END_DISPUTE) {
                return ['success' => true, 'message' => 'Game already finished'];
            }

            // todo : n+1 query a ameliorer    
            if (is_null($game->submitted_by_user_id)) {
                foreach ($rankings as $rankData) {
                    $game->gameUsers()
                        ->where('id', $rankData['game_user_id'])
                        ->update(['rank' => $rankData['rank']]);
                }

                $game->update(['submitted_by_user_id' => $user->id]);

                return ['success' => true, 'message' => 'Rankings submitted successfully'];
            }

            if ($game->submitted_by_user_id === $user->id) {
                return ['success' => false, 'message' => 'Another player must validate'];
            }

            // je récupère ce qui est en base (soumis par le joueur 1)
            $existingRankings = $game->gameUsers()->pluck('rank', 'id')->toArray();
            
            // je transforme ce que le joueur 2 vient d'envoyer pour comparer en les ordonnant pour plus de securiter lors de la comparaison
            $submittedRankings = collect($rankings)->sortBy('game_user_id')->pluck('rank', 'game_user_id')->toArray();

            if ($existingRankings == $submittedRankings) {
                $game->update(['game_status' => GameStatus::COMPLETED]);
                return ['success' => true, 'message' => 'Game completed successfully'];
            } else {
                $game->update(['game_status' => GameStatus::END_DISPUTE]);
                return ['success' => false, 'message' => 'Rankings don\'t match, game marked as disputed'];
            }
        });
    }
}