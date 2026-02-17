<?php

namespace App\Http\Requests;

class confirmationGameDetailRequest extends GameMemberRequest
{
    public function rules(): array
    {
        return [
            'simultaneous_play_turn' => 'required|integer',
        ];
    }
}