<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

class Payments extends Model
{
    protected $fillable = [
        'paymentid',
        'billingid',
        'studentname',
        'payment_date',
        'amount',
        'payment_method',
        'transaction_reference',
        'payer_name',
        'status',
        'remarks',
        'nature_of_collection',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $payment) {
            if (!empty($payment->paymentid)) return;
            $payment->paymentid = self::generateUniquePaymentId();
        });
    }

    protected static function generateUniquePaymentId(): string
    {
        $year = Carbon::now('Asia/Manila')->format('Y');

        do {
            $numeric = str_pad((string) random_int(0, 999999999999), 12, '0', STR_PAD_LEFT);
            $candidate = $numeric . $year;
        } while (self::where('paymentid', $candidate)->exists());

        return $candidate;
    }
}
