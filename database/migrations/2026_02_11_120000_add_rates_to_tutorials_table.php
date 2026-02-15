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
            $table->decimal('rate_grade_school', 10, 2)->nullable()->after('status');
            $table->decimal('rate_secondary', 10, 2)->nullable()->after('rate_grade_school');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tutorials', function (Blueprint $table) {
            $table->dropColumn(['rate_grade_school', 'rate_secondary']);
        });
    }
};
