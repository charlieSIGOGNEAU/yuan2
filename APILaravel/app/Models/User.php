<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use App\Models\Game;
use App\Models\GameUser;
use App\Models\Tile;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    // pour le JWT, on n'etulisera pas les methodes directement dans le model
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }
    public function getJWTCustomClaims()
    {
        return [];
    }

    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'language',
        'fps',
        'render_scale',
        'shadow_realtime',
        'email',
        'provider',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
    ];

    public function games()
    {
        return $this->belongsToMany(Game::class, 'game_users');
    }
    public function gameUsers()
    {
        return $this->hasMany(GameUser::class);
    }
    public function tiles()
    {
        return $this->hasMany(Tile::class);
    }
    public function createdGames()
    {
        return $this->hasMany(Game::class, 'creator_id');
    }

    // pour que laravel utilise bcrypt pour les mots de passe automatiquement
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'render_scale' => 'float',
        ];
    }

    //protected, c'est comme prive dans Rails, static=de class. boot: sera charge a la creation de la class (pas de l'instance). c'est la ou on enregistre les ecouteurs d'evenements (listeners)
    protected static function boot()
    {
        // pour que d'abord on appelle la boot de la class parente
        parent::boot();

        // static:: = self de ruby, donc fait referance a la class User.
        // saving : la fonction qui suit sera executee avant la save ou update de l'instance (ecivalant a before_save before_validation dans Rails)
        // [xxx:yyy] : xxx, l'endroit de la fonction, ici static::class donc App\Models\User, yyy la fonction a executer, ici generateNameFromEmail.
        /// a cause de saving, laravel va de lui meme envoye comme premier parametre de la fonction l'instance de la class.
        static::saving([static::class, 'generateNameFromEmail']);
    }

    protected static function generateNameFromEmail($user)
    {
        if (empty($user->name) && !empty($user->email)) {
            $user->name = explode('@', $user->email)[0];
        }
    }


}
