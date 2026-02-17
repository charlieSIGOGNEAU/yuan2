<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ActionRequest;
use App\Actions\Actions\CreateAction;
use App\Models\Game;
use App\Services\GameBroadcastService;

class ActionController extends Controller
{
    public function store(ActionRequest $request, Game $game, CreateAction $createAction, GameBroadcastService $gameBroadcastService)
    {
        $result = $createAction($game, $request->gameUser, $request->validated());

        if (!$result['success']) {
            return response()->json($result, 403);
        }
        if ($result['result'] === 'tour_finished') { 
            $gameBroadcastService->gamebroadcastGameDetails($game);
        }
            

        $messages = [
            'tour_finished'     => "Tour terminé avec succès",
            'already_completed' => "Le tour était déjà finalisé",
            'still_waiting'     => "Action enregistrée, en attente des autres joueurs"
        ];

        return response()->json([
            'success'        => true,
            'message'        => $messages[$result['result']],
            'turn_completed' => $result['turn_completed'],
            'action'         => $result['action']
        ]);
    }
}