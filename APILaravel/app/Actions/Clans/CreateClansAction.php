<?php

namespace App\Actions\Clans;

use App\Models\Game;
use App\Models\Clan;
use App\Enums\GameStatus;
use Illuminate\Support\Facades\DB;

class CreateClansAction
{
    public function __invoke(Game $game, array $clansData): void
    {
        DB::transaction(function () use ($game, $clansData) {
            if ($game->clans()->exists()) {
                throw new \Exception("Des clans existent déjà pour ce jeu", 409);
            }

            foreach ($clansData as $data) {
                $game->clans()->create($data);
            }

            $game->update(['game_status' => GameStatus::BIDDING_PHASE]);
        });
    }
}