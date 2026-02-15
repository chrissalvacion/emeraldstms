<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

class Students extends Model
{
    protected $fillable = [
        'tuteeid',
        'firstname',
        'middlename',
        'lastname',
        'date_of_birth',
        'school',
        'parent_name',
        'parent_contact',
    ];

    protected $casts = [
        'date_of_birth' => 'date:Y-m-d',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute()
    {
        return Crypt::encryptString($this->id);
    }

    /**
     * Generate a tutee id on creating if not provided.
     * Format: 6-digit code + '-' + YEAR (e.g. 034512-2025)
     */
    protected static function booted()
    {
        static::creating(function ($student) {
            if (empty($student->tuteeid)) {
                $year = date('Y');

                // Generate a unique 6-digit numeric code and append the current year.
                // Retry a small number of times to avoid collisions.
                $attempts = 0;
                do {
                    $code = str_pad(strval(random_int(0, 999999)), 6, '0', STR_PAD_LEFT);
                    $candidate = "{$code}-{$year}-E";
                    $exists = DB::table('students')->where('tuteeid', $candidate)->exists();
                    $attempts++;
                } while ($exists && $attempts < 10);

                if ($exists) {
                    // Fallback: use timestamp + random suffix to ensure uniqueness
                    $candidate = date('YmdHis') . '-' . substr((string) bin2hex(random_bytes(4)), 0, 6) . "-{$year}";
                }

                $student->tuteeid = $candidate;
            }
        });
    }
}
