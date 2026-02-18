<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GameMemberRequest extends FormRequest
{
    public $game;
    public $gameUser;
    protected function prepareForValidation()
    {
        $gameParam = $this->route('game');

        if ($gameParam) {
            // Si c'est un objet (Model Binding), on prend son ->id
            // Si c'est déjà une string/int (ID seul), on la garde telle quelle
            $id = is_object($gameParam) ? $gameParam->id : $gameParam;

            $this->merge([
                'game_id' => $id,
            ]);
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
}