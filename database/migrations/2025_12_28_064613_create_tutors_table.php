<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tutors', function (Blueprint $table) {
            $table->id();
            $table->string('tutorid')->unique()->required();
            $table->string('firstname')->required();
            $table->string('middlename')->nullable();
            $table->string('lastname')->required();
            $table->date('date_of_birth')->nullable();
            $table->string('address')->nullable();
            $table->string('email')->unique()->required();
            $table->string('phone')->nullable();
            $table->string('license_number')->nullable();
            $table->date('hire_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tutors');
    }
};
