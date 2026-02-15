<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tutorials', function (Blueprint $table) {
            $table->string('education_level')->nullable()->after('tutorid');
            $table->string('grade_level')->nullable()->after('education_level');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tutorials', function (Blueprint $table) {
            $table->dropColumn(['education_level', 'grade_level']);
        });
    }
};
