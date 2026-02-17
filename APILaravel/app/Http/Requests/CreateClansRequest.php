<?php

namespace App\Http\Requests;

class CreateClansRequest extends GameMemberRequest
{
    public function rules(): array
    {
        return [
            'clans'         => 'required|array|min:1',
            'clans.*.name'    => 'required|string',
            'clans.*.color'   => 'required|string',
            'clans.*.start_q' => 'required|integer',
            'clans.*.start_r' => 'required|integer',
        ];
    }
}