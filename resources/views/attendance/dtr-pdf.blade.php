<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Daily Time Records</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.5;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .filters {
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 4px;
        }
        .filters p {
            margin: 5px 0;
            font-size: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        thead {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
            font-size: 12px;
        }
        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        tbody tr:nth-child(even) {
            background-color: #fafafa;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 11px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        .empty {
            text-align: center;
            color: #999;
            padding: 20px;
        }
    </style>
</head>
<body>
    {{-- Helper function for time formatting --}}
    @php
        function formatTime12h($value) {
            if (!$value) return '-';
            
            $raw = trim($value);
            if (!$raw) return '-';
            
            // Parse HH:MM or HH:MM:SS format
            if (preg_match('/^(\d{1,2}):(\d{2})(?::\d{2})?$/', $raw, $matches)) {
                $hh = intval($matches[1]);
                $mm = intval($matches[2]);
                
                if ($hh < 0 || $hh > 23 || $mm < 0 || $mm > 59) return $value;
                
                $suffix = $hh >= 12 ? 'PM' : 'AM';
                $hh12 = $hh % 12;
                if ($hh12 === 0) $hh12 = 12;
                
                return sprintf('%d:%02d %s', $hh12, $mm, $suffix);
            }
            
            return $value;
        }
    @endphp

    <div class="header">
        
        <h3>Daily Time Record (DTR)<br/>
        Emerald's Tutorial Center</h3>
        <p>Generated on {{ date('F d, Y g:i A') }}</p>
    </div>

    @if ($tutor || $startDate || $endDate)
        <div class="filters">
            @if ($tutor)
                <p>Tutor: <strong>{{ $tutor }}</strong></p>
            @endif
            @if ($startDate)
                <p>Start Date: <strong>{{ $startDate }}</strong></p>
            @endif
            @if ($endDate)
                <p>End Date: <strong>{{ $endDate }}</strong></p>
            @endif
        </div>
    @endif

    @if (count($attendances) > 0)
        <table>
            <thead>
                <tr>
                    <th style="width: 10%;">Date</th>
                    <th style="width: 16%;">Student</th>
                    <th style="width: 12%;">Tutorial ID</th>
                    <th style="width: 10%;">Time In</th>
                    <th style="width: 10%;">Time Out</th>
                    <th style="width: 8%;">Hours</th>
                    <th style="width: 8%;">Tutor Fee</th>
                    <th style="width: 10%;">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($attendances as $attendance)
                    <tr>
                        <td>{{ $attendance['date'] ?? '-' }}</td>
                        <td>{{ $attendance['student_name'] ?? '-' }}</td>
                        <td>{{ $attendance['tutorialid'] ?? '-' }}</td>
                        <td>{{ formatTime12h($attendance['time_in']) }}</td>
                        <td>{{ formatTime12h($attendance['time_out']) }}</td>
                        <td style="text-align: right;">{{ number_format($attendance['hours'], 0) }}</td>
                        <td style="text-align: right;">{{ number_format((float)($attendance['tutor_fee'] ?? 0), 2) }}</td>
                        <td style="text-align: right;">{{ number_format((float)($attendance['amount'] ?? 0), 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #333;">
            <table style="width: 100%; border: none;">
                <tr style="border: none;">
                    <td style="border: none; width: 60%; text-align: right; padding-right: 10px; font-weight: bold;">Total Hours:</td>
                    <td style="border: none; width: 15%; text-align: right; background-color: #f5f5f5; padding: 8px; border-radius: 4px; font-weight: bold;">{{ number_format($totalHours, 0) }} hrs</td>
                    <td style="border: none; width: 25%;"></td>
                </tr>
                <tr style="border: none;">
                    <td style="border: none; width: 60%; text-align: right; padding-right: 10px; font-weight: bold;">Average Tutor Fee:</td>
                    <td style="border: none; width: 15%; text-align: right; background-color: #f5f5f5; padding: 8px; border-radius: 4px; font-weight: bold;">{{ number_format((float)($averageTutorFee ?? 0), 2) }}</td>
                    <td style="border: none; width: 25%;"></td>
                </tr>
                <tr style="border: none; border-top: 1px solid #ddd;">
                    <td style="border: none; width: 60%; text-align: right; padding-right: 10px; font-weight: bold; font-size: 14px; padding-top: 10px;">Total Salary:</td>
                    <td style="border: none; width: 15%; text-align: right; background-color: #f0f0f0; padding: 8px; border-radius: 4px; font-weight: bold; font-size: 14px; padding-top: 10px;">{{ number_format((float)($totalAmount ?? 0), 2) }}</td>
                    <td style="border: none; width: 25%;"></td>
                </tr>
            </table>
        </div>

        <p style="margin-top: 20px; font-size: 12px;">
            <strong>Total Records:</strong> {{ count($attendances) }}
        </p>
    @else
        <div class="empty">
            <p>No attendance records found for the selected filters.</p>
        </div>
    @endif

    <div class="footer">
        <p>This is an electronically generated report. Page generated on {{ date('F d, Y \a\t g:i A') }}</p>
    </div>
</body>
</html>
