<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Payroll - {{ $payroll->payrollid }}</title>
    <style>
        @page {
            size: 13in 8.5in;
            margin: 0.5in;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            color: #000;
            line-height: 1.5;
            font-size: 11px;
        }

        .container {
            width: 100%;
            padding: 10px;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
        }

        .header h1 {
            font-size: 22px;
            margin-bottom: 5px;
            font-weight: bold;
        }

        .header p {
            font-size: 12px;
            color: #000;
        }

        .info-section {
            margin-bottom: 15px;
            margin-left: 15px;
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background-color: #fff;
            border: none;
        }

        .info-item {
            font-size: 11px;
        }

        .info-label {
            font-weight: bold;
            color: #000;
        }

        .info-value {
            margin-left: 5px;
        }

        table {
            width: 95%;
            border-collapse: collapse;
            margin-bottom: 15px;
            margin-left: 15px;
            border: 1px solid #000;
        }

        thead {
            background-color: #fff;
            color: #000;
        }

        th {
            padding: 10px 8px;
            text-align: left;
            font-weight: bold;
            font-size: 11px;
            border: 1px solid #000;
        }

        th.center {
            text-align: center;
        }

        th.right {
            text-align: right;
        }

        td {
            padding: 10px 8px;
            font-size: 12px;
            border: 1px solid #000;
            vertical-align: middle;
        }

        td.center {
            text-align: center;
        }

        td.right {
            text-align: right;
        }

        tbody tr {
            background-color: #fff;
        }

        .signature-field {
            min-height: 25px;
            display: inline-block;
            width: 50%;
        }

        .summary-section {
            margin-top: 15px;
            padding: 12px;
            background-color: #fff;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 20px;
        }

        .summary-row.total {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #000;
            font-weight: bold;
            font-size: 20px;
        }

        .status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
        }

        .status-pending {
            background-color: #fef08a;
            color: #854d0e;
        }

        .status-approved {
            background-color: #bfdbfe;
            color: #1e40af;
        }

        .status-paid {
            background-color: #bbf7d0;
            color: #065f46;
        }

        .footer {
            text-align: center;
            margin-top: 25px;
            font-size: 9px;
            color: #666;
        }

        .signature-section {
            margin-top: 20px;
            margin-left:15px;
            display: flex;
            justify-content: space-between;
        }

        .signature-box {
            width: 30%;
            text-align: center;
        }

        .signature-line {
            border-top: 1px solid #000;
            margin-top: 40px;
            padding-top: 5px;
            font-size: 11px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>PAYROLL RECORD</h1>
            <p>{{ config('app.name', 'EMERALD STMS') }}</p>
        </div>

        <!-- Basic Information -->
        <div class="info-section">
            <div class="info-item">
                <span class="info-label">Payroll ID:</span>
                <span class="info-value">{{ $payroll->payrollid }}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Period:</span>
                <span class="info-value">{{ $payroll->period_start->format('M d, Y') }} - {{ $payroll->period_end->format('M d, Y') }}</span>
            </div>
            {{-- <div class="info-item">
                <span class="info-label">Status:</span>
                <span class="status-badge status-{{ $payroll->status }}">
                    {{ strtoupper($payroll->status) }}
                </span>
            </div> --}}
        </div>

        <!-- Payroll Entries Table -->
        <table>
            <thead>
                <tr>
                    <th class="center" style="width: 5px;">#</th>
                    <th style="width: 50px;">Tutor</th>
                    <th class="right" style="width: 20px;">Avg Rate</th>
                    <th class="center" style="width: 10px;">Hours</th>
                    <th class="right" style="width: 20px;">Total</th>
                    <th class="right" style="width: 20px;">Amount Received</th>
                    <th style="width: 30px;">Signature</th>
                </tr>
            </thead>
            <tbody>
                @foreach($entries as $index => $entry)
                <tr>
                    <td class="center">{{ $index + 1 }}</td>
                    <td>{{ $entry['tutor_name'] ?? 'N/A' }}</td>
                    <td class="right">{{ number_format($entry['hourly_rate'] ?? 0, 2) }}</td>
                    <td class="center">{{ number_format($entry['total_hours'] ?? 0, 0) }}</td>
                    <td class="right">{{ number_format($entry['total_amount'] ?? 0, 2) }}</td>
                    <td class="right">
                        @if(isset($entry['amount_received']) && $entry['amount_received'] > 0)
                            {{ number_format($entry['amount_received'], 2) }}
                        @else
                            <span class="signature-field"></span>
                        @endif
                    </td>
                    <td>
                        @if(isset($entry['signature']) && !empty($entry['signature']))
                            {{ $entry['signature'] }}
                        @else
                            <span class="signature-field"></span>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Summary -->
        <div class="summary-section">
            <div class="summary-row">
                <span>Total Amount Payable:</span>
                <span>{{ number_format($total_amount, 2) }}</span>
            </div>
            {{-- <div class="summary-row">
                <span>Total Amount Received:</span>
                <span>{{ number_format($total_received, 2) }}</span>
            </div>
            <div class="summary-row total">
                <span>REMAINING BALANCE:</span>
                <span>{{ number_format($total_amount - $total_received, 2) }}</span>
            </div> --}}
        </div>

        <!-- Signature Section -->
        <div class="signature-section">
            <div class="signature-box">
                <div class="signature-line">Authorized By</div>
            </div>
            <div class="signature-box">
                <div class="signature-line">Prepared By</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            Generated on {{ date('F d, Y h:i A', strtotime('now')) }}
        </div>
    </div>
</body>
</html>
