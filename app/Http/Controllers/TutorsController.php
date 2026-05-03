<?php

namespace App\Http\Controllers;

use App\Models\Tutors;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Validator;
<<<<<<< HEAD
use Illuminate\Support\Facades\Schema;
=======
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class TutorsController extends Controller
{
    protected function normalizeImportHeader(string $header): string
    {
        $normalized = strtolower(trim($header));
        return str_replace([' ', '-'], '_', $normalized);
    }

    protected function normalizeImportDate($value): ?string
    {
        if ($value === null) return null;
        if (is_string($value) && trim($value) === '') return null;

        if (is_numeric($value)) {
            try {
                return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
            } catch (\Throwable $e) {
                return null;
            }
        }

        try {
            return Carbon::parse((string) $value)->format('Y-m-d');
        } catch (\Throwable $e) {
            return null;
        }
    }

    protected function readImportRows(string $path): array
    {
        $spreadsheet = IOFactory::load($path);
        $sheet = $spreadsheet->getActiveSheet();
        return $sheet->toArray(null, true, true, false);
    }

    /**
     * Import tutors from CSV/Excel.
     */
    public function import(Request $request)
    {
        $validated = $request->validate([
            'file' => 'required|file|mimes:csv,txt,xlsx,xls|max:10240',
        ]);

        $path = $validated['file']->getRealPath();
        if (!$path) {
            return back()->withErrors([
                'file' => 'Uploaded file could not be processed.',
            ]);
        }

        try {
            $rows = $this->readImportRows($path);
        } catch (\Throwable $e) {
            return back()->withErrors([
                'file' => 'Unable to read file. Please upload a valid CSV or Excel file.',
            ]);
        }

        if (count($rows) < 2) {
            return back()->withErrors([
                'file' => 'The file must include a header row and at least one tutor row.',
            ]);
        }

        $headers = array_map(fn ($h) => $this->normalizeImportHeader((string) ($h ?? '')), $rows[0]);
        if (!in_array('firstname', $headers, true) || !in_array('lastname', $headers, true) || !in_array('email', $headers, true)) {
            return back()->withErrors([
                'file' => 'Headers must include at least firstname, lastname, and email.',
            ]);
        }

        $created = 0;
        $skipped = 0;
        $rowErrors = [];

        foreach (array_slice($rows, 1) as $index => $row) {
            $rowNumber = $index + 2;
            $mapped = [];
            foreach ($headers as $i => $header) {
                if ($header === '') continue;
                $mapped[$header] = $row[$i] ?? null;
            }

            $allEmpty = true;
            foreach ($mapped as $value) {
                if (trim((string) ($value ?? '')) !== '') {
                    $allEmpty = false;
                    break;
                }
            }
            if ($allEmpty) continue;

            $payload = [
                'tutorid'        => trim((string) ($mapped['tutorid'] ?? '')) ?: null,
                'firstname'      => trim((string) ($mapped['firstname'] ?? '')),
                'middlename'     => trim((string) ($mapped['middlename'] ?? '')) ?: null,
                'lastname'       => trim((string) ($mapped['lastname'] ?? '')),
                'date_of_birth'  => $this->normalizeImportDate($mapped['date_of_birth'] ?? null),
                'address'        => trim((string) ($mapped['address'] ?? '')) ?: null,
                'email'          => trim((string) ($mapped['email'] ?? '')),
                'phone'          => trim((string) ($mapped['phone'] ?? '')) ?: null,
                'license_number' => trim((string) ($mapped['license_number'] ?? '')) ?: null,
                'hire_date'      => $this->normalizeImportDate($mapped['hire_date'] ?? null),
            ];

            foreach (['date_of_birth', 'hire_date'] as $dateField) {
                if (!empty($mapped[$dateField]) && $payload[$dateField] === null) {
                    $rowErrors[] = "Row {$rowNumber}: invalid {$dateField} value.";
                    $skipped++;
                    continue 2;
                }
            }

            $validator = Validator::make($payload, [
                'tutorid'        => 'nullable|string|max:255|unique:tutors,tutorid',
                'firstname'      => 'required|string|max:255',
                'middlename'     => 'nullable|string|max:255',
                'lastname'       => 'required|string|max:255',
                'date_of_birth'  => 'nullable|date',
                'address'        => 'nullable|string|max:255',
<<<<<<< HEAD
                'email'          => 'nullable|email|max:255|unique:tutors,email',
=======
                'email'          => 'required|email|max:255|unique:tutors,email',
>>>>>>> a7e8c778e9d14e724049fa08653bc0cc8325e51d
                'phone'          => 'nullable|string|max:255',
                'license_number' => 'nullable|string|max:255',
                'hire_date'      => 'nullable|date',
            ]);

            if ($validator->fails()) {
                $rowErrors[] = "Row {$rowNumber}: " . implode(', ', $validator->errors()->all());
                $skipped++;
                continue;
            }

            Tutors::create($validator->validated());
            $created++;
        }

        if ($created === 0) {
            return back()->withErrors([
                'file' => 'No tutors were imported. ' . implode(' | ', array_slice($rowErrors, 0, 3)),
            ]);
        }

        $message = "Imported {$created} tutor" . ($created === 1 ? '' : 's') . ' successfully.';
        if ($skipped > 0) {
            $message .= " Skipped {$skipped} row" . ($skipped === 1 ? '' : 's') . '.';
        }

        return redirect()->route('tutors')->with('success', $message);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        if (!Schema::hasTable('tutors')) {
            return Inertia::render('tutors', [
                'tutors' => [],
            ]);
        }

        $tutors = Tutors::orderBy('id','desc')->get();
        return Inertia::render('tutors', [
            'tutors' => $tutors,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('tutors/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'firstname' => 'required|string|max:255',
            'middlename' => 'nullable|string|max:255',
            'lastname' => 'required|string|max:255',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:tutors,email',
            'phone' => 'nullable|string|max:255',
            'license_number' => 'nullable|string|max:255',
            'hire_date' => 'nullable|date',
        ]);

        // Ensure tutorid is set (model also provides a fallback)
        if (empty($validated['tutorid'])) {
            $validated['tutorid'] = Tutors::generateUniqueTutorId();
        }

        $tutor = Tutors::create($validated);

        return redirect()->route('tutors.show', ['tutors' => $tutor->encrypted_id]);
    }

    /**
     * Display the specified resource.
     */
    public function show($encrypted)
    {
        if (!Schema::hasTable('tutors')) {
            abort(404);
        }

        try {
            $id = Crypt::decryptString($encrypted);
        } catch (\Throwable $e) {
            abort(404);
        }

        $tutor = Tutors::findOrFail($id);

        // Load tutorials assigned to this tutor. Tutorials may store either the tutor's
        // `tutorid` string or the numeric `id` in the `tutorid` column, so match both.
        $tutorials = collect();
        if (Schema::hasTable('tutorials')) {
            $tutorials = \App\Models\Tutorials::where('tutorid', $tutor->tutorid)
                ->orWhere('tutorid', $tutor->id)
                ->orderBy('id', 'desc')
                ->get();
        }

        // Enrich tutorials with resolved student name for the frontend
        $tutorials = $tutorials->map(function ($t) {
            $student = null;
            if (Schema::hasTable('students')) {
                if (is_numeric($t->studentid)) {
                    $student = \App\Models\Students::find($t->studentid);
                } else {
                    $student = \App\Models\Students::where('tuteeid', $t->studentid)->first();
                }
            }

            return [
                'id' => $t->id,
                'tutorialid' => $t->tutorialid,
                'studentid' => $t->studentid,
                'tutorid' => $t->tutorid,
                'start_date' => $t->start_date,
                'end_date' => $t->end_date,
                'status' => $t->status,
                'tutorial_schedule' => $t->tutorial_schedule,
                'student_name' => $student ? trim(($student->firstname ?? '') . ' ' . ($student->lastname ?? '')) : null,
                'encrypted_id' => Crypt::encryptString($t->id),
            ];
        });

        return Inertia::render('tutors/show', [
            'tutor' => $tutor,
            'tutorials' => $tutorials,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($encrypted)
    {
        try {
            $id = Crypt::decryptString($encrypted);
        } catch (\Throwable $e) {
            abort(404);
        }

        $tutor = Tutors::findOrFail($id);

        return Inertia::render('tutors/edit', [
            'tutor' => $tutor,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $encrypted)
    {

        try {
            $id = Crypt::decryptString($encrypted);
        } catch (\Throwable $e) {
            abort(404);
        }

        $tutor = Tutors::findOrFail($id);

        $validated = $request->validate([
            'firstname' => 'required|string|max:255',
            'middlename' => 'nullable|string|max:255',
            'lastname' => 'required|string|max:255',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:tutors,email,'.$tutor->id,
            'phone' => 'nullable|string|max:255',
            'license_number' => 'nullable|string|max:255',
            'hire_date' => 'nullable|date',
        ]);

        $tutor->update($validated);

        return redirect()->route('tutors.show', ['tutors' => $tutor->encrypted_id]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($encrypted)
    {
        try {
            $id = Crypt::decryptString($encrypted);
        } catch (\Throwable $e) {
            abort(404);
        }

        $tutor = Tutors::findOrFail($id);
        $tutor->delete();

        return redirect()->route('tutors');
    }
}
