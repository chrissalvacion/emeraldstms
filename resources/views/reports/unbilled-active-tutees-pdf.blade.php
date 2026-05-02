<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Unbilled Active Tutees Report</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, Arial, sans-serif; color: #111; font-size: 12px; line-height: 1.4; }
        .header { margin-bottom: 14px; }
        .title { font-size: 20px; font-weight: 700; margin: 0 0 4px 0; }
        .subtitle { font-size: 12px; color: #555; margin: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background: #f4f4f4; text-align: left; font-weight: 700; }
        .muted { color: #666; }
        .summary { margin-top: 12px; width: 40%; }
        .summary td { border: 1px solid #ddd; padding: 8px; }
        .summary .label { font-weight: 700; background: #fafafa; }
        .footer { margin-top: 10px; font-size: 10px; color: #666; }
    </style>
</head>
<body>
    @php
        $formatDate = function ($value) {
            if (empty($value)) return '-';
            try {
                return \Carbon\Carbon::parse($value)->format('M d, Y');
            } catch (\Throwable $e) {
                return (string) $value;
            }
        };
    @endphp

    <div class="header">
        <h1 class="title">Unbilled Active Tutees Report</h1>
        <p class="subtitle">Emerald's Tutorial Center</p>
        @if (!empty($start_date) && !empty($end_date))
            <p class="subtitle">Period: {{ $formatDate($start_date) }} &ndash; {{ $formatDate($end_date) }}</p>
        @endif
        <p class="subtitle">Generated on {{ ($generatedAt ?? null) ? $generatedAt->format('F d, Y h:i A') : now()->format('F d, Y h:i A') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 16%;">Tutorial ID</th>
                <th style="width: 26%;">Name of Tutee</th>
                <th style="width: 22%;">Tutor</th>
                <th style="width: 12%;">Start Date</th>
                <th style="width: 12%;">End Date</th>
                <th style="width: 12%;">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($tutees as $tutee)
                <tr>
                    <td>{{ $tutee['tutorialid'] ?? '-' }}</td>
                    <td>{{ $tutee['student_name'] ?? ($tutee['studentid'] ?? '-') }}</td>
                    <td>{{ $tutee['tutor_name'] ?? ($tutee['tutorid'] ?? '-') }}</td>
                    <td>{{ $formatDate($tutee['start_date'] ?? null) }}</td>
                    <td>{{ $formatDate($tutee['end_date'] ?? null) }}</td>
                    <td>{{ $tutee['status'] ?? '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="muted">No unbilled active tutees found.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="summary">
        <tbody>
            <tr>
                <td class="label">Total Unbilled Tutees</td>
                <td>{{ count($tutees) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">This is an electronically generated report.</div>
</body>
</html>
