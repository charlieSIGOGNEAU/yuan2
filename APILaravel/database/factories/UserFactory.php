<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{


    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'language' => 'fr',
            'fps' => 60,
            'render_scale' => 1.00,
            'shadow_realtime' => true,
            'provider' => 'email',
            'password' => Hash::make('password'), // password sera le mot de passe par défaut. on a rajouter "static::$password ??=" pour aller plus vite dans les teste pour ne pas calculer plusieur fois le meme Hash
        ];
    }
}
