<?php

namespace Database\Seeders;

use App\Models\Students;
use Illuminate\Database\Seeder;

class StudentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = \Faker\Factory::create();

        for ($i = 0; $i < 20; $i++) {
            Students::create([
                'firstname' => $faker->firstName(),
                'middlename' => $faker->optional()->firstName(),
                'lastname' => $faker->lastName(),
                'date_of_birth' => $faker->date('Y-m-d', '-12 years'),
                'grade_level' => $faker->numberBetween(1, 12),
                'school' => $faker->company(),
                'parent_name' => $faker->name(),
                'parent_contact' => $faker->phoneNumber(),
            ]);
        }
    }
}
