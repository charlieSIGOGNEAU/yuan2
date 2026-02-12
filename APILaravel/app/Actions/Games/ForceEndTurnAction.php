<?php

namespace App\Actions\Games;

use Illuminate\Support\Facades\DB;
use App\Models\Game;
use App\Models\Action;

class ForceEndTurnAction
{
    public function __invoke(Game $game, int $turn)
    {
        return DB::transaction(function () use ($game, $turn) {
            Game::where('id', $game->id)->lockForUpdate()->first();
            $game->refresh();
            if ($game->simultaneous_play_turn != $turn) {
                return 'already_ended';
            }
            $playedGameUsersId = Action::where('game_id', $game->id)->where('turn', $turn)->pluck('game_user_id');
            $missingGameUsers = $game->gameUsers()->whereNotIn('id', $playedGameUsersId)->pluck('id');
            foreach ($missingGameUsers as $missingGameUser) {
                Action::create([
                    'game_id' => $game->id,
                    'game_user_id' => $missingGameUser,
                    'turn' => $turn,
                    'development_level' => 0,
                    'fortification_level' => 0,
                    'militarisation_level' => 0,
                ]);
            }
            $game->increment('simultaneous_play_turn');
            return 'forced_success';
        });
    }
}