<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Billing</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #111; font-size: 13px; line-height: 1.4; }
        .muted { color: #555; }
        .header { display: table; width: 100%; margin-bottom: 14px; }
        .header-left { display: table-cell; vertical-align: top; }
        .header-right { display: table-cell; vertical-align: top; text-align: right; }
        .company { font-size: 16px; font-weight: 800; margin-bottom: 2px; }
        .title { font-size: 18px; font-weight: 700; margin-bottom: 2px; }
        .subtitle { font-size: 12px; color: #555; }
        .qr { position: fixed; bottom: 16px; left: 16px; text-align: left; }
        .qr img { width: 120px; height: 120px; }
        .card { border: 1px solid #ddd; border-radius: 10px; padding: 10px; margin-bottom: 14px; }
        .grid { width: 100%; }
        .grid-row { display: table; width: 100%; }
        .grid-cell { display: table-cell; vertical-align: top; width: 50%; padding: 6px 8px; }
        .label { font-size: 12px; color: #555; margin-bottom: 2px; }
        .value { font-weight: 600; word-break: break-word; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background: #f5f5f5; text-align: left; font-size: 12px; }
        td { font-size: 12px; }
        td.right { text-align: right; }
        .footer { margin-top: 8px; font-size: 10px; color: #666; }
    </style>
</head>
<body>
    @php
        $formatDate = function ($v) {
            if (empty($v)) return '-';
            try {
                return \Carbon\Carbon::parse($v)->format('m/d/Y');
            } catch (\Throwable $e) {
                return (string) $v;
            }
        };

        $formatAmount = function ($v) {
            if ($v === null || $v === '') return '-';
            $n = is_numeric($v) ? (float) $v : null;
            return $n !== null ? number_format($n, 2, '.', '') : (string) $v;
        };

        $wholeHours = function ($row) {
            $hours = $row['hours'] ?? null;
            if (is_numeric($hours)) return (string) round((float) $hours);
            $minutes = $row['minutes'] ?? null;
            if (is_numeric($minutes)) return (string) round(((float) $minutes) / 60);
            return '—';
        };

        $rows = is_array($attendance_rows ?? null) ? $attendance_rows : [];
    @endphp

    @if(!empty($qr_data_uri))
        <div class="qr">
            <img src="{{ $qr_data_uri }}" alt="QR" />
        </div>
    @endif

    <div class="header">
        <div class="header-left">
            <div class="title"><h1>Billing Statement - {{ $billing->billingid ?? '' }}</h1></div>
            <div class="company">Emerald Tutorial Center</div>
            <div class="subtitle">1234 Learning St., Knowledge City, EduState, 56789</div>
        </div>
    </div>
    <div class="card">
        <div class="subtitle">Billing Statement</div>
        <div class="grid">
            <div class="grid-row">
                <div class="grid-cell">
                    <div class="label">Billing ID</div>
                    <div class="value">{{ $billing->billingid ?? '-' }}</div>
                </div>
                <div class="grid-cell">
                    <div class="label">Student</div>
                    <div class="value">{{ $student_name ?? ($billing->studentid ?? '-') }}</div>
                </div>
            </div>

            <div class="grid-row">
                <div class="grid-cell">
                    <div class="label">Start date</div>
                    <div class="value">{{ $formatDate($billing->getRawOriginal('billing_startdate') ?? $billing->billing_startdate) }}</div>
                </div>
                <div class="grid-cell">
                    <div class="label">End date</div>
                    <div class="value">{{ $formatDate($billing->getRawOriginal('billing_enddate') ?? $billing->billing_enddate) }}</div>
                </div>
            </div>

            <div class="grid-row">
                <div class="grid-cell">
                    <div class="label">Total hours</div>
                    <div class="value">{{ $billing->total_hours ?? '-' }}</div>
                </div>
                <div class="grid-cell">
                    <div class="label">Amount</div>
                    <div class="value">{{ $formatAmount($billing->amount ?? null) }}</div>
                </div>
            </div>

            <div class="grid-row">
                <div class="grid-cell">
                    <div class="label">Status</div>
                    <div class="value">{{ strtolower((string)($billing->status ?? '')) }}</div>
                </div>
                <div class="grid-cell">
                    <div class="label">Generated</div>
                    <div class="value">{{ ($generated_at ?? null) ? $generated_at->format('m/d/Y h:i A') : '' }}</div>
                </div>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="label" style="margin-bottom: 8px;">Attendance record</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 90px;">Date</th>
                    <th style="width: 120px;">Tutorial ID</th>
                    <th>Tutor</th>
                    <th style="width: 75px;">Time In</th>
                    <th style="width: 75px;">Time Out</th>
                    <th style="width: 55px; text-align: right;">Hours</th>
                    <th style="width: 70px; text-align: right;">Rate</th>
                </tr>
            </thead>
            <tbody>
                @if(count($rows) === 0)
                    <tr>
                        <td colspan="7" class="muted">—</td>
                    </tr>
                @else
                    @foreach($rows as $r)
                        <tr>
                            <td>{{ $formatDate($r['date'] ?? null) }}</td>
                            <td>{{ $r['tutorialid'] ?? '—' }}</td>
                            <td>{{ $r['tutor_name'] ?? ($r['tutorid'] ?? '—') }}</td>
                            <td>{{ $r['time_in'] ?? '—' }}</td>
                            <td>{{ $r['time_out'] ?? '—' }}</td>
                            <td class="right">{{ $wholeHours($r) }}</td>
                            <td class="right">{{ $formatAmount($r['hourly_rate'] ?? null) }}</td>
                        </tr>
                    @endforeach
                @endif
            </tbody>
        </table>
        <div class="footer">Generated by EmeraldSTMS</div>
    </div>
</body>
</html>
