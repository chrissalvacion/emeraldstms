<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class Tutors extends Model
{
    protected $fillable = [
        'tutorid',
        'firstname',
        'middlename',
        'lastname',
        'date_of_birth',
        'address',
        'email',
        'phone',
        'license_number',
        'hire_date',
    ];

    protected $casts = [
        'date_of_birth' => 'date:Y-m-d',
        'hire_date' => 'date:Y-m-d',
    ];

    protected $appends = ['encrypted_id'];

    public function getEncryptedIdAttribute()
    {
        return Crypt::encryptString($this->id);
    }

    protected static function booted()
    {
        static::creating(function ($tutor) {
            if (empty($tutor->tutorid)) {
                $tutor->tutorid = self::generateUniqueTutorId();
            }
        });
    }

    public static function generateUniqueTutorId()
    {
        do {
            // 4 random digits, padded
            try {
                $num = random_int(0, 9999);
            } catch (\Throwable $e) {
                $num = mt_rand(0, 9999);
            }
            $digits = str_pad((string)$num, 4, '0', STR_PAD_LEFT);
            $candidate = $digits . '-' . date('Y') . '-T';
        } while (self::where('tutorid', $candidate)->exists());

        return $candidate;
    }

    /**
     * Relationship: tutor has many tutorials
     */
    public function tutorials()
    {
        return $this->hasMany(\App\Models\Tutorials::class, 'tutorid', 'tutorid');
    }
}
