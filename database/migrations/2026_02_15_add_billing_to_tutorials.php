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
        Schema::table('tutorials', function (Blueprint $table) {
            // Add billing_type column: 'per-session' or 'prepaid-package'
            $table->string('billing_type')->default('per-session')->after('status');
            // Add prepaid_amount column: total amount paid for prepaid package
            $table->decimal('prepaid_amount', 10, 2)->nullable()->after('billing_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tutorials', function (Blueprint $table) {
            $table->dropColumn(['billing_type', 'prepaid_amount']);
        });
    }
};
