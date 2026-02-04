<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use App\Traits\HasLanguageValidation;

class UserController extends Controller
{
    use HasLanguageValidation;
    /**
     * POST /api/v1/user/update
     */
    public function update(Request $request)
    {
        /** @var \PHPOpenSourceSaver\JWTAuth\JWTGuard $guard */
        $guard = auth('api');
        /** @var \App\Models\User $user */
        $user = $guard->user();

        $request->validate([
            'language'        => 'sometimes|string',
            'fps'             => 'sometimes|integer',
            'render_scale'    => 'sometimes|numeric',
            'shadow_realtime' => 'sometimes|boolean',
        ]);

        if (empty($request->all())) {
            return response()->json([
                'success' => false, 
                'message' => 'Aucun paramètre à mettre à jour'
            ], 422);
        }

        if ($request->has('language')) {
            $user->language = $this->validateLanguage($request->language);
        }
        if ($request->has('fps')) {
            $user->fps = $request->fps;
        }
        if ($request->has('render_scale')) {
            $user->render_scale = $request->render_scale;
        }
        if ($request->exists('shadow_realtime')) {
            $user->shadow_realtime = $request->boolean('shadow_realtime');
        }
        $user->save();
        return response()->json(['success' => true, 'message' => 'Utilisateur mis à jour avec succès', 'user' => new UserResource($user)], 200);
    }
}