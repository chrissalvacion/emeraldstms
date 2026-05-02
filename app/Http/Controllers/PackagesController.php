<?php

namespace App\Http\Controllers;

use App\Models\Packages;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class PackagesController extends Controller
{
    public function index(Request $request): Response
    {
        if (!Schema::hasTable('package')) {
            return Inertia::render('package', [
                'packages' => [],
                'package' => null,
            ]);
        }

        $packages = Packages::query()
            ->orderBy('name')
            ->get();

        $editingPackage = null;
        $editId = $request->integer('edit');
        if ($editId) {
            $editingPackage = Packages::query()->find($editId);
        }

        return Inertia::render('package', [
            'packages' => $packages,
            'package' => $editingPackage,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['nullable', 'string', 'max:255'],
            'level' => ['nullable', 'string', 'max:255'],
            'duration_hours' => ['nullable', 'integer', 'min:1'],
            'tutee_fee_amount' => ['nullable', 'numeric', 'min:0'],
            'tutor_fee_amount' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', 'in:active,inactive,archived'],
        ]);

        $validated['status'] = $validated['status'] ?? 'active';

        Packages::query()->create($validated);

        return redirect()->route('packages.index');
    }

    public function update(Request $request, Packages $package): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['nullable', 'string', 'max:255'],
            'level' => ['nullable', 'string', 'max:255'],
            'duration_hours' => ['nullable', 'integer', 'min:1'],
            'tutee_fee_amount' => ['nullable', 'numeric', 'min:0'],
            'tutor_fee_amount' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'string', 'in:active,inactive,archived'],
        ]);

        $validated['status'] = $validated['status'] ?? ($package->status ?? 'active');

        $package->update($validated);

        return redirect()->route('packages.index');
    }

    public function destroy(Packages $package): RedirectResponse
    {
        $package->delete();

        return redirect()->route('packages.index');
    }
}
