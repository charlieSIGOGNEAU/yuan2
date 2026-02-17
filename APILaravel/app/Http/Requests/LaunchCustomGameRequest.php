<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LaunchCustomGameRequest extends FormRequest
{
        public function authorize(): bool
        {
            $gameId = $this->input('game_id');

            $this->gameUser = $this->user()->gameUsers()
                ->where('game_id', $gameId)
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
            'game_duration' => 'nullable|integer|min:30|max:600',
        ];
    }
}