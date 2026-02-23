<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LaunchCustomGameRequest extends FormRequest
{
    protected function prepareForValidation()
    {
        $this->merge([
            'game_duration' => $this->game_duration ?? 120,
        ]);
    }
    public function authorize(): bool
    {
        $gameId = $this->input('game_id');

        $this->gameUser = $this->user()->gameUsers()->where('game_id', $gameId)->first();
        return ($this->gameUser && $this->gameUser->game->creator_id === $this->user()->id);
    }

    public function rules(): array
    {
        return [
            'game_duration' => 'required|integer'
        ];
    }
}