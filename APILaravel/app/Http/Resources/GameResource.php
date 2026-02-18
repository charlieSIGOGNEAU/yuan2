<?php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GameResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                      => $this->id,
            'game_status'             => $this->game_status,
            'game_type'               => $this->game_type,
            'player_count'            => $this->player_count,
            'clan_names'              => $this->clan_names,
            'biddings_turn'           => $this->biddings_turn,
            'turn_duration'           => $this->turn_duration,
            'simultaneous_play_turn'  => $this->simultaneous_play_turn,
            'waiting_players_count'   => $this->waiting_players_count,
            'creator_id'              => $this->creator_id,
            'submitted_by_user_id'    => $this->submitted_by_user_id,
            'custom_code'             => $this->custom_code,

            // suite un peux bourin, mais je trouve ca plus lisible que faire une fonction qui retire game_id de chaque element de la liste. en plus elle permait de m'assurai que les bouleens soient envoye proprement et pas des tring de 0 ou 1.
            'game_users' => $this->whenLoaded('gameUsers', function () {
                return $this->gameUsers->map(function ($gu) {
                    return [
                        'id'                 => $gu->id,
                        'user_id'            => $gu->user_id,
                        'clan_id'            => $gu->clan_id,
                        'player_ready'       => (bool)$gu->player_ready,
                        'user_name'          => $gu->user_name,
                        'rank'               => $gu->rank,
                        'abandoned'          => (bool)$gu->abandoned,
                        'is_creator_of_game' => (bool)$gu->is_creator_of_game,
                    ];
                });
            }),

            'clans' => $this->whenLoaded('clans', function () {
                return $this->clans->map(function ($clan) {
                    return [
                        'id'            => $clan->id,
                        'color'         => $clan->color,
                        'name'          => $clan->name,
                        'start_q'       => $clan->start_q,
                        'start_r'       => $clan->start_r,
                        'received_turn' => $clan->received_turn,
                        'received_chao' => $clan->received_chao,
                    ];
                });
            }),

            'tiles' => $this->whenLoaded('tiles', function () {
                return $this->tiles->map(function ($tile) {
                    return [
                        'id'           => $tile->id,
                        'name'         => $tile->name,
                        'position_q'   => $tile->position_q,
                        'position_r'   => $tile->position_r,
                        'rotation'     => $tile->rotation,
                        'game_user_id' => $tile->game_user_id,
                        'turn'         => $tile->turn,
                    ];
                });
            }),

            'actions' => $this->whenLoaded('actions', function () {
                return $this->actions->map(function ($action) {
                    return [
                        'id'           => $action->id,
                        'game_user_id' => $action->game_user_id,
                        'action'       => $action->action,
                        'turn'         => $action->turn,
                        'position_q'   => $action->position_q,
                        'position_r'   => $action->position_r,
                        'development_level' => $action->development_level,
                        'fortification_level' => $action->fortification_level,
                        'militarisation_level' => $action->militarisation_level,
                    ];
                });
            }),

            'biddings' => $this->whenLoaded('biddings', function () {
                return $this->biddings->map(function ($bid) {
                    return [
                        'id'           => $bid->id,
                        'game_user_id' => $bid->game_user_id,
                        'turn'         => $bid->turn,
                        'chao'         => $bid->chao,
                        'victory'      => (bool)$bid->victory,
                        'clan_id'      => $bid->clan_id,
                    ];
                });
            }),
        ];
    }
}