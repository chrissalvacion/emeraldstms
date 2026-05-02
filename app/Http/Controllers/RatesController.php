<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class RatesController extends Controller
{
    private const KEY_DEFAULT_RATE_GRADE_SCHOOL = 'default_rate_grade_school';
    private const KEY_DEFAULT_RATE_SECONDARY = 'default_rate_secondary';
    private const KEY_TUTOR_FEE_ELEMENTARY = 'tutor_fee_elementary';
    private const KEY_TUTOR_FEE_JHS = 'tutor_fee_jhs';
    private const KEY_TUTOR_FEE_SHS = 'tutor_fee_shs';

    public function edit()
    {
        if (!Schema::hasTable('app_settings')) {
            return Inertia::render('rates', [
                'default_rate_grade_school' => '',
                'default_rate_secondary' => '',
                'tutor_fee_elementary' => '',
                'tutor_fee_jhs' => '',
                'tutor_fee_shs' => '',
            ]);
        }

        $gs = AppSetting::where('key', self::KEY_DEFAULT_RATE_GRADE_SCHOOL)->value('value');
        $sec = AppSetting::where('key', self::KEY_DEFAULT_RATE_SECONDARY)->value('value');
        $tutorElem = AppSetting::where('key', self::KEY_TUTOR_FEE_ELEMENTARY)->value('value');
        $tutorJhs = AppSetting::where('key', self::KEY_TUTOR_FEE_JHS)->value('value');
        $tutorShs = AppSetting::where('key', self::KEY_TUTOR_FEE_SHS)->value('value');

        return Inertia::render('rates', [
            'default_rate_grade_school' => $gs !== null ? (string) $gs : '',
            'default_rate_secondary' => $sec !== null ? (string) $sec : '',
            'tutor_fee_elementary' => $tutorElem !== null ? (string) $tutorElem : '',
            'tutor_fee_jhs' => $tutorJhs !== null ? (string) $tutorJhs : '',
            'tutor_fee_shs' => $tutorShs !== null ? (string) $tutorShs : '',
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'default_rate_grade_school' => 'required|numeric|min:0',
            'default_rate_secondary' => 'required|numeric|min:0',
            'tutor_fee_elementary' => 'nullable|numeric|min:0',
            'tutor_fee_jhs' => 'nullable|numeric|min:0',
            'tutor_fee_shs' => 'nullable|numeric|min:0',
        ]);

        AppSetting::updateOrCreate(
            ['key' => self::KEY_DEFAULT_RATE_GRADE_SCHOOL],
            ['value' => (string) $validated['default_rate_grade_school']]
        );

        AppSetting::updateOrCreate(
            ['key' => self::KEY_DEFAULT_RATE_SECONDARY],
            ['value' => (string) $validated['default_rate_secondary']]
        );

        if (isset($validated['tutor_fee_elementary'])) {
            AppSetting::updateOrCreate(
                ['key' => self::KEY_TUTOR_FEE_ELEMENTARY],
                ['value' => (string) $validated['tutor_fee_elementary']]
            );
        }

        if (isset($validated['tutor_fee_jhs'])) {
            AppSetting::updateOrCreate(
                ['key' => self::KEY_TUTOR_FEE_JHS],
                ['value' => (string) $validated['tutor_fee_jhs']]
            );
        }

        if (isset($validated['tutor_fee_shs'])) {
            AppSetting::updateOrCreate(
                ['key' => self::KEY_TUTOR_FEE_SHS],
                ['value' => (string) $validated['tutor_fee_shs']]
            );
        }

        return redirect()->route('rates.edit')->with('success', 'Rates saved successfully.');
    }
}
