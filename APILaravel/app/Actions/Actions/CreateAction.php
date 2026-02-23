<?php

namespace App\Actions\Actions;

use App\Models\Game;
use App\Models\GameUser;
use App\Models\Action;
use Illuminate\Support\Facades\DB;

class CreateAction
{
    public function __invoke(Game $game, GameUser $gameUser, array $data)
    {
        return DB::transaction(function () use ($game, $gameUser, $data) {
            Game::where('id', $game->id)->lockForUpdate()->first();
            $game->refresh();
            $currentTurn = $game->simultaneous_play_turn;

            if ((int)$data['turn'] !== $currentTurn) {
                return ['success' => false, 'message' => 'trop tard, le tour est déjà terminé'];
            }

            $action = Action::updateOrCreate(
                [
                    'game_id'      => $game->id,
                    'game_user_id' => $gameUser->id,
                    'turn'         => $currentTurn
                ],
                [
                    'position_q'           => $data['position_q'] ?? null,
                    'position_r'           => $data['position_r'] ?? null,
                    'development_level'    => $data['development_level'],
                    'fortification_level'  => $data['fortification_level'],
                    'militarisation_level' => $data['militarisation_level'],
                ]
            );

            // Appel de la vérification de fin de tour
            $result = $this->checkTurnCompletion($game);

            return [
                'success'        => true,
                'result'         => $result,
                'action'         => $action,
                'turn_completed' => in_array($result, ['tour_finished', 'already_completed'])
            ];
        });
    }

    private function checkTurnCompletion(Game $game)
    {
        $actionsCount = Action::where('game_id', $game->id)
            ->where('turn', $game->simultaneous_play_turn)
            ->count();

        $playersCount = $game->gameUsers()->count();

        if ($actionsCount >= $playersCount) {
            $game->increment('simultaneous_play_turn');
            return 'tour_finished';
        }

        return 'still_waiting';
    }
}