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
                'game_id' => $this->route('game'),
                'custom_code' => $this->custom_code ? strtoupper($this->custom_code) : null,
            ]);
        }
    }

    public function authorize(): bool
    {
        // On s'assure de récupérer uniquement l'ID, pas l'objet entier
        // Si $this->game_id est un objet, on prend son ->id, sinon on prend la valeur brute
        $gameId = is_object($this->game_id) ? $this->game_id->id : $this->game_id;
        
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
            'game_id' => 'required|integer|exists:games,id',
            'simultaneous_play_turn' => 'sometimes|integer',
            'custom_code' => 'sometimes|string|size:6',
        ];
    }
}