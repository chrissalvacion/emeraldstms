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
        Schema::create('package', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('type')->nullable(); // e.g., "regular", "promotional", etc.
            $table->string('level')->nullable(); // e.g., "beginner", "intermediate", "advanced"
            $table->integer('duration_hours')->nullable(); // Duration in hours
            $table->decimal('tutee_fee_amount', 10, 2)->nullable();
            $table->decimal('tutor_fee_amount', 10, 2)->nullable();
            $table->string('status')->default('active'); // e.g., "active", "inactive", "archived"
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('package');
    }
};
