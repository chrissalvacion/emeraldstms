<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\TutorsSeeder;
use Database\Seeders\StudentsSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'tutorialcenter.emeralds@gmail.com'],
            [
                'name' => 'Emeralds Tutorial Center ',
                'password' => Hash::make('password2026'),
                'email_verified_at' => now(),
            ]
        );

        // Seed tutors and students
        // $this->call([
        //     TutorsSeeder::class,
        //     StudentsSeeder::class,
        // ]);
    }
}
