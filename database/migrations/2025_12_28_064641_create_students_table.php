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
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('tuteeid')->unique()->required();
            $table->string('firstname')->required();
            $table->string('middlename')->nullable();
            $table->string('lastname')->required();
            $table->date('date_of_birth')->nullable();
            $table->string('school')->nullable();
            $table->string('parent_name')->nullable();
            $table->string('parent_contact', 12)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
