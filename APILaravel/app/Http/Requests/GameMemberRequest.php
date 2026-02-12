<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GameMemberRequest extends FormRequest
{
    protected function prepareForValidation()
    {
        if ($this->route('game')) {
            $this->merge([
                'game_id' => $this->route('game'),
                'custom_code' => $this->custom_code ? strtoupper($this->custom_code) : null,
            ]);
        }
    }

    public function authorize(): bool
    {
        $this->gameUser = $this->user()->gameUsers()
            ->where('game_id', $this->game_id)
            ->first();

        if ($this->gameUser) {
            $this->game = $this->gameUser->game;
            return true;
        }
        return false;
    }

    public function rules(): array
    {
        return [
            'game_id' => 'required|integer|exists:games,id',
            'simultaneous_play_turn' => 'sometimes|integer',
            'custom_code' => 'sometimes|string|size:6',
        ];
    }
}