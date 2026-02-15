<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    protected $fillable = [
        'tutorid',
        'studentid',
        'date',
        'time_in',
        'time_out',
        'tutorialid',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
        'time_in' => 'string',
        'time_out' => 'string',
    ];
}
