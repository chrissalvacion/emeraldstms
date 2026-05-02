<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Unpaid Billings Report</title>
    <style>
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, Arial, sans-serif; color: #111; font-size: 12px; line-height: 1.4; }
        .header { margin-bottom: 14px; }
        .title { font-size: 20px; font-weight: 700; margin: 0 0 4px 0; }
        .subtitle { font-size: 12px; color: #555; margin: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background: #f4f4f4; text-align: left; font-weight: 700; }
        td.right, th.right { text-align: right; }
        .muted { color: #666; }
        .totals { margin-top: 12px; width: 45%; margin-left: auto; }
        .totals td { border: 1px solid #ddd; padding: 8px; }
        .totals .label { font-weight: 700; background: #fafafa; }
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

        $formatBillingDate = function ($start, $end) use ($formatDate) {
            $startText = $formatDate($start);
            $endText = $formatDate($end);
            if ($startText === '-' && $endText === '-') return '-';
            if ($startText === $endText) return $startText;
            return $startText . ' - ' . $endText;
        };

        $formatAmount = function ($v) {
            $n = is_numeric($v) ? (float) $v : 0.0;
            return number_format($n, 2);
        };

        $formatStatus = function ($status) {
            $raw = trim((string) $status);
            return $raw === '' ? '-' : ucfirst(strtolower($raw));
        };
    @endphp

    <div class="header">
        <h1 class="title">Unpaid Billings Report</h1>
        <p class="subtitle">Emerald's Tutorial Center</p>
        <p class="subtitle">Generated on {{ ($generatedAt ?? null) ? $generatedAt->format('F d, Y h:i A') : now()->format('F d, Y h:i A') }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 14%;">Billing ID</th>
                <th style="width: 24%;">Name of Tutee</th>
                <th style="width: 19%;">Billing Date</th>
                <th class="right" style="width: 11%;">Amount Due</th>
                <th class="right" style="width: 11%;">Amount Paid</th>
                <th class="right" style="width: 11%;">Balance</th>
                <th style="width: 10%;">Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($billings as $billing)
                <tr>
                    <td>{{ $billing['billingid'] ?? '-' }}</td>
                    <td>{{ $billing['student_name'] ?? ($billing['studentid'] ?? '-') }}</td>
                    <td>{{ $formatBillingDate($billing['billing_startdate'] ?? null, $billing['billing_enddate'] ?? null) }}</td>
                    <td class="right">{{ $formatAmount($billing['amount'] ?? 0) }}</td>
                    <td class="right">{{ $formatAmount($billing['total_paid'] ?? 0) }}</td>
                    <td class="right">{{ $formatAmount($billing['balance'] ?? 0) }}</td>
                    <td>{{ $formatStatus($billing['status'] ?? '-') }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="muted">No unpaid billings found.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <table class="totals">
        <tbody>
            <tr>
                <td class="label">Total Amount Due</td>
                <td class="right">{{ $formatAmount($totalAmountDue ?? 0) }}</td>
            </tr>
            <tr>
                <td class="label">Total Amount Paid</td>
                <td class="right">{{ $formatAmount($totalAmountPaid ?? 0) }}</td>
            </tr>
            <tr>
                <td class="label">Total Balance</td>
                <td class="right">{{ $formatAmount($totalBalance ?? 0) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">This is an electronically generated report.</div>
</body>
</html>
