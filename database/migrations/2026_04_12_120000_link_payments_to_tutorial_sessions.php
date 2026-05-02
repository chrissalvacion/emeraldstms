<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'tutorialid')) {
                $table->string('tutorialid')->nullable()->after('billingid');
            }
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('billingid')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('payments')
            ->whereNull('billingid')
            ->update(['billingid' => '']);

        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'tutorialid')) {
                $table->dropColumn('tutorialid');
            }
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('billingid')->nullable(false)->change();
        });
    }
};
