<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'email'           => $this->email,
            'language'        => $this->language,
            'fps'             => $this->fps,
            'render_scale'    => $this->render_scale,
            'shadow_realtime' => (bool)$this->shadow_realtime,
        ];
    }
}