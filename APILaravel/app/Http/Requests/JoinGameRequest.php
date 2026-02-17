<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class JoinGameRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'custom_code' => 'required|string|size:6',
        ];
    }
}