<?php

namespace App\Http\Controllers;

use App\Models\Students;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Crypt;

class StudentsController extends Controller
{
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
