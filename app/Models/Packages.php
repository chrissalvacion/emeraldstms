<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Packages extends Model
{
    protected $table = 'package';

    protected $fillable = [
        'name',
        'description',
        'type',
        'level',
        'duration_hours',
        'tutee_fee_amount',
        'tutor_fee_amount',
        'status',
    ];

    protected $casts = [
        'duration_hours' => 'integer',
        'tutee_fee_amount' => 'float',
        'tutor_fee_amount' => 'float',
    ];
}
