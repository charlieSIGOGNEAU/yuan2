<?php

namespace App\Http\Requests;

class ActionRequest extends GameMemberRequest
{
    protected function prepareForValidation()
    {
        parent::prepareForValidation();

        $this->merge([
            'development_level'    => $this->input('development_level', 0),
            'fortification_level'  => $this->input('fortification_level', 0),
            'militarisation_level' => $this->input('militarisation_level', 0),
        ]);
    }

    public function authorize(): bool
    {
        if (!parent::authorize()) return false;

        return (int)$this->turn === (int)$this->game->simultaneous_play_turn;
    }

    public function rules(): array
    {
        return [
            'turn'                 => 'required|integer',
            'position_q'           => 'nullable|integer',
            'position_r'           => 'nullable|integer',
            'development_level'    => 'integer',
            'fortification_level'  => 'integer',
            'militarisation_level' => 'integer',
        ];
    }
}