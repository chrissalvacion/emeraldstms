<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollEntry extends Model
{
    protected $table = 'payroll_entries';

    protected $fillable = [
        'payroll_id',
        'tutorid',
        'hourly_rate',
        'total_hours',
        'total_amount',
        'amount_received',
        'signature',
        'attendance_records',
    ];

    protected $casts = [
        'hourly_rate' => 'decimal:2',
        'total_hours' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'amount_received' => 'decimal:2',
        'attendance_records' => 'array',
    ];

    protected $appends = ['tutor_name'];

    public function getTutorNameAttribute()
    {
        if (empty($this->tutorid)) return null;

        $tutor = null;
        if (is_numeric($this->tutorid)) {
            $tutor = Tutors::find($this->tutorid);
        } else {
            $tutor = Tutors::where('tutorid', $this->tutorid)->first();
        }

        if (!$tutor) return null;

        return trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? '')) ?: null;
    }

    /**
     * Get the payroll that owns this entry
     */
    public function payroll()
    {
        return $this->belongsTo(Payroll::class);
    }
}
