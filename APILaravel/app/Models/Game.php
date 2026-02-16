<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Enums\GameStatus;
use App\Enums\GameType;
use App\Models\GameUser;
use App\Models\Tile;
use App\Models\Clan;
use App\Models\Bidding;
use App\Models\User;

class Game extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'game_status',
        'game_type',
        'player_count',
        'clan_names',
        'biddings_turn',
        'turn_duration',
        'simultaneous_play_turn',
        'waiting_players_count',
        'custom_code',
        'creator_id',
        'submitted_by_user_id',
        'game_duration',
    ];
    protected $casts = [
        'game_status' => GameStatus::class,
        'game_type' => GameType::class,
    ];
    /**
     * Cette méthode intercepte la conversion en Array/JSON
     */
    public function toArray()
    {
        $array = parent::toArray();
        
        // On force la conversion en string via le nom de la case Enum
        if ($this->game_status instanceof GameStatus) {
            $array['game_status'] = strtolower($this->game_status->name);
        }
        
        if ($this->game_type instanceof GameType) {
            $array['game_type'] = strtolower($this->game_type->name);
        }

        return $array;
    }
    public function users()
    {
        return $this->belongsToMany(User::class, 'game_users');
    }
    public function gameUsers()
    {
        return $this->hasMany(GameUser::class);
    }
    public function tiles()
    {
        return $this->hasMany(Tile::class);
    }
    public function actions()
    {
        return $this->hasMany(Action::class);
    }
    public function clans()
    {
        return $this->hasMany(Clan::class);
    }
    public function biddings()
    {
        return $this->hasMany(Bidding::class);
    }
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
    public function submittedByUser()
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function theClans() : string
    {
        $clans = ["black_clan","red_clan","green_clan","orange_clan","white_clan","blue_clan","purple_clan","yellow_clan"];
        return implode(" ", array_slice($clans, 0, $this->player_count));
    }

    public function calculateTileCount(): int
    {
        return match ($this->player_count) {
            2 => 8,
            3 => 12,
            4 => 15,
            5 => 19,
            6 => 22,
            7 => 27,
            8 => 30,
            default => 0,
        };
    }
}
