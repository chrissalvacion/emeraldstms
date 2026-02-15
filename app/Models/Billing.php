<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Billing extends Model
{
    protected $fillable = [
        'billingid',
        'studentid',
        'billing_startdate',
        'billing_enddate',
        'attendance_record',
        'total_hours',
        'amount',
        'status',
    ];

    protected $casts = [
        'billing_startdate' => 'date:Y-m-d',
        'billing_enddate' => 'date:Y-m-d',
        'attendance_record' => 'array',
        'total_hours' => 'integer',
        'amount' => 'decimal:2',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute()
    {
        return Crypt::encryptString($this->id);
    }

    protected static function booted()
    {
        static::creating(function ($billing) {
            if (empty($billing->billingid)) {
                $billing->billingid = self::generateUniqueBillingId();
            }
        });
    }

    public static function generateUniqueBillingId()
    {
        do {
            try {
                $num = random_int(0, 999999999999);
            } catch (\Throwable $e) {
                $num = mt_rand(0, 999999999999);
            }

            $digits = str_pad((string) $num, 12, '0', STR_PAD_LEFT);
            $candidate = $digits . 'ETC';
        } while (self::where('billingid', $candidate)->exists());

        return $candidate;
    }
}
