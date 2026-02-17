<?php

namespace App\Http\Requests;

class BiddingRequest extends GameMemberRequest
{
    protected function prepareForValidation()
    {
        parent::prepareForValidation();
        if (!$this->has('chao')) {
            $this->merge(['chao' => 0]);
        }
    }
    
    public function rules(): array
    {
        return [
            'chao'    => 'required|integer|min:0',
            'clan_id' => 'required|exists:clans,id',
            'turn'    => 'nullable|integer',
        ];
    }
}