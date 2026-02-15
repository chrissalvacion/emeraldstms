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
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->string('tutorid');
            $table->string('studentid');
            $table->date('date')->nullable();
            $table->time('time_in')->nullable();
            $table->time('time_out')->nullable();
            $table->string('status')->nullable();
            $table->string('remarks')->nullable();
            $table->string('tutorialid');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
