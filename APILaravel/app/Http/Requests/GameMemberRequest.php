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
        // if ($this->route('game')) {
        //     $this->merge([
        //         // 'game_id' => $this->route('game'),
        //         'game_id' => $this->route('game')->id,
        //     ]);
        // }
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



    protected function failedAuthorization()
    {
        \Log::info('FAILED AUTH', ['user' => $this->user()]);
        throw new \Illuminate\Auth\Access\AuthorizationException('This action is unauthorized.');
    }

    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator)
    {
        \Log::info('FAILED VALIDATION', $validator->errors()->toArray());
    }

}