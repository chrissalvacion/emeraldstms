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
        Schema::create('tutorials', function (Blueprint $table) {
            $table->id();
            $table->string('tutorialid')->unique();
            $table->string('studentid');
            $table->string('tutorid');
            $table->json('tutorial_schedule')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->integer('packageid')->required();
            $table->string('level')->nullable();
            $table->decimal('tutee_fee_amount', 10, 2)->nullable();
            $table->decimal('tutor_fee_amount', 10, 2)->nullable();
            $table->decimal('prepaid_amount', 10, 2)->nullable();
            $table->decimal('prepaid_hours', 10, 2)->nullable();
            $table->decimal('completed_hours', 10, 2)->nullable();
            $table->decimal('remaining_hours', 10, 2)->nullable();
            $table->string('billing_type')->default('per-session');
            $table->string('status')->default('Scheduled'); // e.g., "Scheduled", "Ongoing", "Completed", "Cancelled"
           
             // Foreign key to packages table
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tutorials');
    }
};
