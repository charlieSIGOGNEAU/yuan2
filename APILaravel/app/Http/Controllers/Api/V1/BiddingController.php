<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Http\Requests\BiddingRequest;
use App\Actions\Biddings\CreateBiddingAction;
use App\Services\GameBroadcastService;

class BiddingController extends Controller
{
    public function store(BiddingRequest $request, Game $game, CreateBiddingAction $action, GameBroadcastService $broadcast) {
        $gameUser = $request->gameUser; 

        // Exécution de l'action
        $result = $action($game, $gameUser, $request->validated());

        // Gestion des Broadcasts
        if ($result['status'] === 'completed' || $result['status'] === 'already_finalized') {
            $broadcast->gameBroadcastGameDetails($game);
        } else {
            // Notification "En attente des autres"
            // Tu peux créer cette méthode dans ton Service
            $broadcast->userBroadcastWaitingForOthers($gameUser->user, $game);
        }

        return response()->json([
            'success' => true,
            'status' => $result['status'],
            'bidding' => $result['bidding']
        ]);
    }
}