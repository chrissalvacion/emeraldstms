<?php

namespace App\Http\Controllers;

use App\Models\Students;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class StudentsController extends Controller
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
     * Display a listing of the resource.
     */
    public function index()
    {
        $students = Students::orderBy('id','desc')->get();
        return Inertia::render('students', [
            'students' => $students,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('students/create');
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
            'school' => 'nullable|string|max:255',
            'parent_name' => 'nullable|string|max:255',
            'parent_contact' => 'nullable|string|max:255',
        ]);

        $student = Students::create($validated);

        return redirect()->route('students.show', ['students' => $student->encrypted_id])->with('success', 'Student created.');
    }

    /**
     * Import students from CSV/Excel.
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
                'file' => 'The file must include a header row and at least one student row.',
            ]);
        }

        $headers = array_map(fn ($h) => $this->normalizeImportHeader((string) ($h ?? '')), $rows[0]);
        if (!in_array('firstname', $headers, true) || !in_array('lastname', $headers, true)) {
            return back()->withErrors([
                'file' => 'Headers must include at least firstname and lastname.',
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
                'tuteeid' => trim((string) ($mapped['tuteeid'] ?? '')) ?: null,
                'firstname' => trim((string) ($mapped['firstname'] ?? '')),
                'middlename' => trim((string) ($mapped['middlename'] ?? '')) ?: null,
                'lastname' => trim((string) ($mapped['lastname'] ?? '')),
                'date_of_birth' => $this->normalizeImportDate($mapped['date_of_birth'] ?? null),
                'school' => trim((string) ($mapped['school'] ?? '')) ?: null,
                'parent_name' => trim((string) ($mapped['parent_name'] ?? '')) ?: null,
                'parent_contact' => trim((string) ($mapped['parent_contact'] ?? '')) ?: null,
            ];

            if (!empty($mapped['date_of_birth']) && $payload['date_of_birth'] === null) {
                $rowErrors[] = "Row {$rowNumber}: invalid date_of_birth value.";
                $skipped++;
                continue;
            }

            $validator = Validator::make($payload, [
                'tuteeid' => 'nullable|string|max:255|unique:students,tuteeid',
                'firstname' => 'required|string|max:255',
                'middlename' => 'nullable|string|max:255',
                'lastname' => 'required|string|max:255',
                'date_of_birth' => 'nullable|date',
                'school' => 'nullable|string|max:255',
                'parent_name' => 'nullable|string|max:255',
                'parent_contact' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                $rowErrors[] = "Row {$rowNumber}: " . implode(', ', $validator->errors()->all());
                $skipped++;
                continue;
            }

            Students::create($validator->validated());
            $created++;
        }

        if ($created === 0) {
            return back()->withErrors([
                'file' => 'No students were imported. ' . implode(' | ', array_slice($rowErrors, 0, 3)),
            ]);
        }

        $message = "Imported {$created} student" . ($created === 1 ? '' : 's') . ' successfully.';
        if ($skipped > 0) {
            $message .= " Skipped {$skipped} row" . ($skipped === 1 ? '' : 's') . '.';
        }

        return redirect()->route('students')->with('success', $message);
    }

    /**
     * Display the specified resource.
     */
    public function show($encrypted)
    {
        try {
            $id = Crypt::decryptString($encrypted);
        } catch (\Throwable $e) {
            abort(404);
        }

        $student = Students::findOrFail($id);

        // also pass tutors list for assignment modal
        $tutors = \App\Models\Tutors::orderBy('id', 'desc')->get()->map(function ($t) {
            return [
                'id' => $t->id,
                'tutorid' => $t->tutorid ?? null,
                'firstname' => $t->firstname ?? null,
                'lastname' => $t->lastname ?? null,
                'encrypted_id' => $t->encrypted_id ?? null,
            ];
        });

        // load tutorials for this student
        $tutorials = \App\Models\Tutorials::where(function ($q) use ($student) {
            $q->where('studentid', $student->id)->orWhere('studentid', $student->tuteeid);
        })->orderBy('id','desc')->get()->map(function ($t) {
            // resolve tutor name
            $tutor = null;
            if (is_numeric($t->tutorid)) {
                $tutor = \App\Models\Tutors::find($t->tutorid);
            } else {
                $tutor = \App\Models\Tutors::where('tutorid', $t->tutorid)->first();
            }

            return [
                'id' => $t->id,
                'tutorialid' => $t->tutorialid,
                'encrypted_id' => $t->encrypted_id ?? null,
                'start_date' => $t->start_date,
                'end_date' => $t->end_date,
                'status' => $t->status,
                'tutor_name' => $tutor ? trim(($tutor->firstname ?? '') . ' ' . ($tutor->lastname ?? '')) : null,
                'tutorial_schedule' => $t->tutorial_schedule ?? null,
                'created_at' => $t->created_at,
            ];
        });

        return Inertia::render('students/show', [
            'student' => $student,
            'tutors' => $tutors,
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

        $student = Students::findOrFail($id);

        return Inertia::render('students/edit', [
            'student' => $student,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $encrypted)
    {
        $validated = $request->validate([
            'firstname' => 'required|string|max:255',
            'middlename' => 'nullable|string|max:255',
            'lastname' => 'required|string|max:255',
            'date_of_birth' => 'nullable|date',
            'school' => 'nullable|string|max:255',
            'parent_name' => 'nullable|string|max:255',
            'parent_contact' => 'nullable|string|max:255',
        ]);

        try {
            $id = Crypt::decryptString($encrypted);
        } catch (\Throwable $e) {
            abort(404);
        }

        $student = Students::findOrFail($id);
        $student->update($validated);

        return redirect()->route('students.show', ['students' => $student->encrypted_id])->with('success', 'Student updated.');
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

        $student = Students::findOrFail($id);
        $student->delete();

        return redirect()->route('students')->with('success', 'Student deleted.');
    }
}
