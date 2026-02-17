<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Http\Requests\CreateClansRequest;
use App\Actions\Clans\CreateClansAction;
use App\Services\GameBroadcastService;

class ClanController extends Controller
{
    public function store(CreateClansRequest $request, Game $game, CreateClansAction $action, GameBroadcastService $broadcast) {
        try {
            $action($game, $request->clans);
            
            $broadcast->gameBroadcastGameDetails($game);

            return response()->json([
                'success' => true,
                'message' => 'Tous les clans ont été créés',
                'clans' => $game->clans()->get()
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 422);
        }
    }
}