<?php

use App\Models\Attendance;
use App\Models\Students;
use App\Models\Tutorials;
use App\Models\Tutors;
use App\Models\User;
use Carbon\Carbon;

it('allows time-in for a scheduled tutorial on the current day that has not yet passed', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $tutor = Tutors::create([
        'tutorid' => 'T-0001',
        'firstname' => 'Test',
        'lastname' => 'Tutor',
        'email' => 'tutor@example.com',
    ]);

    $student = Students::create([
        'tuteeid' => 'S-0001',
        'firstname' => 'Test',
        'lastname' => 'Student',
    ]);

    Tutorials::create([
        'tutorialid' => 'TUT-0001',
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
    ]);

    // Monday (end is 11:00) - allow even before start, as long as end time is not passed.
    Carbon::setTestNow(Carbon::parse('2026-01-05 08:00:00', 'Asia/Manila'));
    $this->post(route('attendance.timeIn'), ['tutorid' => (string) $tutor->id])
        ->assertRedirect(route('attendance.clock'));
    expect(Attendance::query()->count())->toBe(1);
});

it('restricts time-in if it is already recorded for that tutorial today', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $tutor = Tutors::create([
        'tutorid' => 'T-0002',
        'firstname' => 'Test',
        'lastname' => 'Tutor',
        'email' => 'tutor2@example.com',
    ]);

    $student = Students::create([
        'tuteeid' => 'S-0002',
        'firstname' => 'Test',
        'lastname' => 'Student',
    ]);

    Tutorials::create([
        'tutorialid' => 'TUT-0002',
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
    ]);

    Carbon::setTestNow(Carbon::parse('2026-01-05 10:05:00', 'Asia/Manila'));

    $this->post(route('attendance.timeIn'), ['tutorid' => (string) $tutor->id])
        ->assertRedirect(route('attendance.clock'));

    // Second time-in should be blocked for the same tutorial on the same day.
    $this->post(route('attendance.timeIn'), ['tutorid' => (string) $tutor->id])
        ->assertSessionHasErrors('tutorid');

    expect(Attendance::query()->count())->toBe(1);
});

it('rejects time-in at or after end time', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $tutor = Tutors::create([
        'tutorid' => 'T-0003',
        'firstname' => 'Test',
        'lastname' => 'Tutor',
        'email' => 'tutor3@example.com',
    ]);

    $student = Students::create([
        'tuteeid' => 'S-0003',
        'firstname' => 'Test',
        'lastname' => 'Student',
    ]);

    Tutorials::create([
        'tutorialid' => 'TUT-0003',
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
    ]);

    Carbon::setTestNow(Carbon::parse('2026-01-05 11:00:00', 'Asia/Manila'));

    $this->post(route('attendance.timeIn'), ['tutorid' => (string) $tutor->id])
        ->assertSessionHasErrors('tutorid');

    expect(Attendance::query()->count())->toBe(0);
});

it('allows time-in during the scheduled session', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $tutor = Tutors::create([
        'tutorid' => 'T-0004',
        'firstname' => 'Test',
        'lastname' => 'Tutor',
        'email' => 'tutor4@example.com',
    ]);

    $student = Students::create([
        'tuteeid' => 'S-0004',
        'firstname' => 'Test',
        'lastname' => 'Student',
    ]);

    Tutorials::create([
        'tutorialid' => 'TUT-0004',
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
    ]);

    Carbon::setTestNow(Carbon::parse('2026-01-05 10:31:00', 'Asia/Manila'));

    $this->post(route('attendance.timeIn'), ['tutorid' => (string) $tutor->id])
        ->assertRedirect(route('attendance.clock'));

    expect(Attendance::query()->count())->toBe(1);
});
