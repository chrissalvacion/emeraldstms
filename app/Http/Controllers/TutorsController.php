<?php

namespace App\Http\Controllers;

use App\Models\Tutors;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Crypt;

class TutorsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
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
            'email' => 'required|email|unique:tutors,email',
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
        try {
            $id = Crypt::decryptString($encrypted);
        } catch (\Throwable $e) {
            abort(404);
        }

        $tutor = Tutors::findOrFail($id);

        // Load tutorials assigned to this tutor. Tutorials may store either the tutor's
        // `tutorid` string or the numeric `id` in the `tutorid` column, so match both.
        $tutorials = \App\Models\Tutorials::where('tutorid', $tutor->tutorid)
            ->orWhere('tutorid', $tutor->id)
            ->orderBy('id', 'desc')
            ->get();

        // Enrich tutorials with resolved student name for the frontend
        $tutorials = $tutorials->map(function ($t) {
            $student = null;
            if (is_numeric($t->studentid)) {
                $student = \App\Models\Students::find($t->studentid);
            } else {
                $student = \App\Models\Students::where('tuteeid', $t->studentid)->first();
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
            'email' => 'required|email|unique:tutors,email,'.$tutor->id,
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
