<?php

namespace App\Actions\Biddings;

use App\Models\Game;
use App\Models\Bidding;
use App\Models\GameUser;
use App\Enums\GameStatus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CreateBiddingAction
{
    public function __invoke(Game $game, GameUser $gameUser, array $data): array
    {
        return DB::transaction(function () use ($game, $gameUser, $data) {
            $game->lockForUpdate()->find($game->id); 

            $turn = $data['turn'] ?? $game->biddings_turn;

            // Création ou Mise à jour
            $bidding = Bidding::updateOrCreate(
                ['game_id' => $game->id, 'game_user_id' => $gameUser->id, 'turn' => $turn],
                ['chao' => $data['chao'], 'clan_id' => $data['clan_id'], 'victory' => false]
            );

            $biddingsCount = $game->biddings()->where('turn', $turn)->count();
            $playersCount = $game->gameUsers()->count();
            
            if ($biddingsCount === ($playersCount - $turn + 1)) {
                return $this->finalizeTurn($game, $turn, $bidding);
            }

            return ['status' => 'waiting', 'bidding' => $bidding];
        });
    }

    private function finalizeTurn(Game $game, int $turn, Bidding $currentBidding): array
    {
        // Trouver le gagnant (le plus de chao, puis le premier ID)
        $winner = $game->biddings()
            ->where('turn', $turn)
            ->whereNotNull('clan_id')
            ->orderByDesc('chao')
            ->orderBy('id')
            ->first();

        if ($winner && $game->game_status === GameStatus::BIDDING_PHASE) {
            // Assigner le clan au GameUser gagnant
            $winner->gameUser->update(['clan_id' => $winner->clan_id]);
            $winner->update(['victory' => true]);

            // Incrémenter le tour d'enchère
            $newTurn = $game->biddings_turn + 1;
            $game->update(['biddings_turn' => $newTurn]);

            // Si toutes les enchères sont finies
            if ($newTurn > $game->player_count) {
                $game->update([
                    'game_status' => GameStatus::SIMULTANEOUS_PLAY,
                    'simultaneous_play_turn' => 1
                ]);
            }

            return ['status' => 'completed', 'bidding' => $currentBidding, 'winner' => $winner];
        }

        return ['status' => 'already_finalized', 'bidding' => $currentBidding];
    }
}