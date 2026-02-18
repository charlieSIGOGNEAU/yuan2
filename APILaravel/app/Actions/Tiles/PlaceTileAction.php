<?php

namespace App\Actions\Tiles;

use App\Models\Game;
use App\Models\Tile;
use App\Enums\GameStatus;
use Illuminate\Support\Facades\Log;

class PlaceTileAction
{
    public function __invoke(Game $game, Tile $tile, array $data, bool $isLastTile): void
    {
        // 1. Mise à jour de la tuile
        $tile->update([
            'name'       => $data['name'] ?? $tile->name,
            'rotation'   => $data['rotation'] ?? $tile->rotation,
            'position_q' => $data['position_q'] ?? $tile->position_q,
            'position_r' => $data['position_r'] ?? $tile->position_r,
        ]);

        // 2. Logique de changement de phase
        if ($isLastTile) {
            $this->checkAndAdvancePhase($game);
        }
    }

    private function checkAndAdvancePhase(Game $game): void
    {
        $allTilesNamed = $game->tiles()->whereNull('name')->count() === 0;

        if ($allTilesNamed) {
            $game->update(['game_status' => GameStatus::INITIAL_PLACEMENT]);
        }
    }
}