<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\GameMemberRequest;
use App\Actions\GameUser\AbandonGame;

class GameUserController extends Controller
{
    public function abandon(GameMemberRequest $request, AbandonGame $abandonAction)
    {
        $result = $abandonAction($request->gameUser, $request->game);

        return response()->json($result);
    }
}