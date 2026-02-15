<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Payroll extends Model
{
    protected $table = 'payroll';

    protected $fillable = [
        'payrollid',
        'period_start',
        'period_end',
        'status',
    ];

    protected $casts = [
        'period_start' => 'date:Y-m-d',
        'period_end' => 'date:Y-m-d',
    ];

    protected $appends = ['encrypted_id', 'tutor_count', 'total_payable'];

    public function getEncryptedIdAttribute()
    {
        return Crypt::encryptString($this->id);
    }

    public function getTutorCountAttribute()
    {
        return $this->entries()->count();
    }

    public function getTotalPayableAttribute()
    {
        return $this->entries()->sum('total_amount');
    }

    protected static function booted()
    {
        static::creating(function ($payroll) {
            if (empty($payroll->payrollid)) {
                $payroll->payrollid = self::generateUniquePayrollId();
            }
        });
    }

    public static function generateUniquePayrollId()
    {
        do {
            try {
                $num = random_int(0, 9999);
            } catch (\Throwable $e) {
                $num = mt_rand(0, 9999);
            }
            $digits = str_pad((string) $num, 4, '0', STR_PAD_LEFT);
            $candidate = 'PR-' . $digits . '-' . date('Y');
        } while (self::where('payrollid', $candidate)->exists());

        return $candidate;
    }

    /**
     * Get the entries associated with this payroll.
     */
    public function entries()
    {
        return $this->hasMany(PayrollEntry::class, 'payroll_id');
    }
}
