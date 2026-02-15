<?php

use App\Models\Attendance;
use App\Models\Students;
use App\Models\Tutorials;
use App\Models\Tutors;
use App\Models\User;
use Carbon\Carbon;

it('marks the tutorial as Ongoing when the first attendance is created', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $tutor = Tutors::create([
        'tutorid' => 'T-1001',
        'firstname' => 'Test',
        'lastname' => 'Tutor',
        'email' => 'status-tutor@example.com',
    ]);

    $student = Students::create([
        'tuteeid' => 'S-1001',
        'firstname' => 'Test',
        'lastname' => 'Student',
    ]);

    $tutorial = Tutorials::create([
        'tutorialid' => 'TUT-STATUS-1',
        'studentid' => (string) $student->id,
        'tutorid' => (string) $tutor->id,
        'tutorial_schedule' => [
            [
                'days' => ['Monday'],
                'start_time' => '10:00',
                'end_time' => '11:00',
            ],
        ],
        'status' => 'Scheduled',
        'start_date' => '2026-01-01',
        'end_date' => '2026-01-31',
    ]);

    Carbon::setTestNow(Carbon::parse('2026-01-05 10:05:00', 'Asia/Manila'));

    $this->post(route('attendance.timeIn'), ['tutorid' => (string) $tutor->id])
        ->assertRedirect(route('attendance.clock'));

    expect(Attendance::query()->where('tutorialid', 'TUT-STATUS-1')->count())->toBe(1);
    expect($tutorial->refresh()->status)->toBe('Ongoing');
});

it('automatically marks tutorials Completed when end_date is past', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $tutor = Tutors::create([
        'tutorid' => 'T-1002',
        'firstname' => 'Test',
        'lastname' => 'Tutor',
        'email' => 'status-tutor2@example.com',
    ]);

    $student = Students::create([
        'tuteeid' => 'S-1002',
        'firstname' => 'Test',
        'lastname' => 'Student',
    ]);

    $tutorial = Tutorials::create([
        'tutorialid' => 'TUT-STATUS-2',
        'studentid' => (string) $student->id,
        'tutorid' => (string) $tutor->id,
        'tutorial_schedule' => [
            [
                'days' => ['Monday'],
                'start_time' => '10:00',
                'end_time' => '11:00',
            ],
        ],
        'status' => 'Ongoing',
        'start_date' => '2025-12-01',
        'end_date' => '2026-01-01',
    ]);

    Carbon::setTestNow(Carbon::parse('2026-01-04 09:00:00', 'Asia/Manila'));

    // Visiting the tutorials index should auto-complete past tutorials.
    $this->get(route('tutorials'))->assertOk();

    expect($tutorial->refresh()->status)->toBe('Completed');
});
