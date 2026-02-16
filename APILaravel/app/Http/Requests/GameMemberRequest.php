<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GameMemberRequest extends FormRequest
{
    public $game;
    public $gameUser;
    protected function prepareForValidation()
    {
        if ($this->route('game')) {
            $this->merge([
                // 'game_id' => $this->route('game'),
                'game_id' => $this->route('game')->id,
            ]);
            if ($this->custom_code !== null) {
                $this->merge(['custom_code' => strtoupper($this->custom_code)]);
            }
        }
    }

    public function authorize(): bool
    {
        $gameId = $this->game_id;
        
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
            'simultaneous_play_turn' => 'sometimes|integer',
            'custom_code' => 'sometimes|string|size:6',
        ];
    }

    protected function failedAuthorization()
    {
        \Log::info('FAILED AUTH', ['user' => $this->user()]);
    }

    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator)
    {
        \Log::info('FAILED VALIDATION', $validator->errors()->toArray());
    }

}