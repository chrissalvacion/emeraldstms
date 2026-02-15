<?php

namespace Database\Seeders;

use App\Models\Tutors;
use Illuminate\Database\Seeder;

class TutorsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = \Faker\Factory::create();

        for ($i = 0; $i < 10; $i++) {
            Tutors::create([
                'firstname' => $faker->firstName(),
                'middlename' => $faker->optional()->firstName(),
                'lastname' => $faker->lastName(),
                'date_of_birth' => $faker->date('Y-m-d', '-25 years'),
                'address' => $faker->address(),
                'email' => $faker->unique()->safeEmail(),
                'phone' => $faker->phoneNumber(),
                'license_number' => strtoupper($faker->bothify('??####')),
                'hire_date' => $faker->date('Y-m-d', 'now'),
            ]);
        }
    }
}
