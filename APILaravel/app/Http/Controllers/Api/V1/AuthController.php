<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Http\Resources\UserResource;
use App\Traits\HasLanguageValidation;
use Google_Client;
use Illuminate\Support\Facades\Auth;
class AuthController extends Controller
{
    use HasLanguageValidation;
    /**
     * POST /api/v1/auth/signup
     */
    public function signup(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'language' => 'nullable|string'
        ]);
    
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => "Erreur lors de l'inscription, email deja utilisé ou mot de passe trop court (min 6 caracteres)",
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
            'user'    => new UserResource($user), 
            'token'   => Auth::guard('api')->login($user)
        ], 201);
    }

    /**
     * POST /api/v1/auth/login_email
     */
    public function loginEmail(Request $request)
    {
        $credentials = $request->only(['email', 'password']);
        $credentials['provider'] = 'email';
    
        // attempt fais tout: il cherche l'user avec le mail et provider sur email et verrifie le password puis renvoi le token
        if (!$token = Auth::guard('api')->attempt($credentials)) {
            return response()->json([
                'success' => false,
                'message' => 'Email ou mot de passe incorrect'
            ], 401);
        }
    
        $user = Auth::guard('api')->user();
    
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

            return $this->respondWithToken(Auth::guard('api')->login($user), $user);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Erreur serveur Google'], 500);
        }
    }

    public function changeName(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        //verifier password
        if ($user->provider === 'email' && !Hash::check($request->password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Mot de passe incorrect'], 401);
        }

        if (!$request->name ) {
            return response()->json([
                'success' => false, 
                'message' => 'Le nom est requis'
            ], 422);
        }

        $user->name = $request->name;
        $user->save();
        return response()->json(['success' => true, 'message' => 'Nom changé avec succès', 'user' => new UserResource($user)], 200);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();

        if ($user->provider !== 'email') {
            return response()->json([
                'success' => false, 
                'message' => 'Cette action est réservée aux comptes email.'
            ], 403);
        }
    
        $request->validate([
            'current_password' => 'required|string',
            'new_password'     => 'required|string|min:8|confirmed',
        ]);
    
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false, 
                'message' => 'L\'ancien mot de passe est incorrect'
            ], 401);
        }
    
        $user->password = $request->new_password; 
        $user->save();
    
        return response()->json([
            'success' => true, 
            'message' => 'Mot de passe modifié avec succès'
        ]);
    }

    public function deleteAccount(Request $request)
    {
        $user = $request->user();
        
        if ($user->provider === 'email' && (!$request->password || !Hash::check($request->password, $user->password))) {
            return response()->json(['success' => false, 'message' => 'Mot de passe incorrect'], 401);
        }
        Auth::guard('api')->logout();
        $user->delete();
        return response()->json(['success' => true, 'message' => 'Compte supprimé avec succès'], 200);
    }

    /**
     * Fonctions utilitaires (Privées)
     */

    private function respondWithToken($token, $user, $status = 200)
    {
        return response()->json([
            'success' => true,
            'user' => new UserResource($user),
            'token' => $token
        ], $status);
    }
}