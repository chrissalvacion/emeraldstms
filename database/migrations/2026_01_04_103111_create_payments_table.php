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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('paymentid')->unique();
            $table->string('billingid');
            $table->string('studentname');
            $table->date('payment_date');
            $table->decimal('amount', 10, 2);
            $table->string('payment_method');
            $table->string('transaction_reference')->nullable();
            $table->string('payer_name')->nullable();
            $table->string('status')->default('Pending');
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
