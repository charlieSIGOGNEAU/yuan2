<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Http\Resources\UserResource;
//use Google_Client; // Assure-toi d'avoir google/apiclient

class AuthController extends Controller
{
    /**
     * POST /api/v1/auth/signup
     */
    public function signup(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email',
            'password' => 'required|confirmed|min:6',
            'language' => 'nullable|string'
        ]);
    
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => "Erreur lors de l'inscription",
                'errors'  => $validator->errors()->all() 
            ], 422);
        }
    
        $user = User::create([
            'email'    => $request->email,
            'password' => $request->password, // Haché par le modèle
            'provider' => 'email',
            'language' => $this->validateLanguage($request->language),
            'fps'      => 60
        ]);
    
        /** @var \PHPOpenSourceSaver\JWTAuth\JWTGuard $guard */
        $guard = auth('api');
        $token = $guard->login($user);
    
        return response()->json([
            'success' => true,
            'message' => "Inscription réussie",
            'user'    => new UserResource($user), // Utilisation de notre ressource
            'token'   => $token
        ], 201);
    }

    /**
     * POST /api/v1/auth/login_email
     */
    public function loginEmail(Request $request)
    {
        $credentials = $request->only(['email', 'password']);
        $credentials['provider'] = 'email';
    
        // c'est pour que l'IDE ne nous mette pas de rouge sur attempt, mais on pourais s'en passer
        /** @var \PHPOpenSourceSaver\JWTAuth\JWTGuard $guard */
        $guard = auth('api');
    
        // attempt fais tout: il cherche l'user avec le mail et provider sur email et verrifie le password puis renvoi le token
        if (!$token = $guard->attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Email ou mot de passe incorrect'
            ], 401);
        }
    
        $user = $guard->user();
    
        return response()->json([
            'success' => true,
            'message' => 'Connexion réussie',
            'user'    => new UserResource($user),
            'token'   => $token
        ]);
    }

    /**
     * POST /api/v1/auth/google_login
     */
    public function googleLogin(Request $request)
    {
        if (!$request->credential) {
            return response()->json(['success' => false, 'message' => 'Token Google requis'], 400);
        }

        try {
            $client = new Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')]);
            $payload = $client->verifyIdToken($request->credential);

            if (!$payload) {
                return response()->json(['success' => false, 'message' => 'Token Google invalide'], 401);
            }

            $user = User::firstOrCreate(
                ['email' => $payload['email']],
                [
                    'name' => $payload['name'] ?? explode('@', $payload['email'])[0],
                    'provider' => 'google',
                    'language' => $this->validateLanguage($request->language),
                    'fps' => 60
                ]
            );

            /** @var \PHPOpenSourceSaver\JWTAuth\JWTGuard $guard */
            $guard = auth('api');
            $token = $guard->login($user);
            return $this->respondWithToken($token, $user);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur serveur Google'], 500);
        }
    }

    /**
     * Fonctions utilitaires (Privées)
     */
    private function validateLanguage($lang)
    {
        $supported = ['fr', 'en', 'zh', 'ja', 'ko', 'de', 'es', 'pt', 'ru', 'it'];
        $lang = strtolower($lang);
        return in_array($lang, $supported) ? $lang : 'en';
    }

    private function respondWithToken($token, $user, $status = 200)
    {
        return response()->json([
            'success' => true,
            'user' => new UserResource($user),
            'token' => $token
        ], $status);
    }
}