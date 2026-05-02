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

        function formatDateMDY($value) {
            if (!$value) return '-';

            $raw = trim((string) $value);
            if ($raw === '') return '-';

            try {
                return \Carbon\Carbon::parse($raw)->format('M d, Y');
            } catch (\Throwable $e) {
                return $value;
            }
        }
    @endphp

     <div class="header" style="background-color:#ffffff;">   
        <p><strong style="color:#000000;">Emerald's Tutorial Center</strong><br/>
        <span style="font-size:10px;">Ground Floor, Gabaldon Bldg., Passi City</span></p>
    </div>

    @if ($tutor)

        <div class="header">   
            <h3>Daily Time Record (DTR)</h3>
        </div>

        <div class="filters" style="background-color:#ffffff; border: none; padding: 0; margin-bottom: 30px;">
            <p>Tutor: <strong>{{ function_exists('mb_strtoupper') ? mb_strtoupper($tutor, 'UTF-8') : strtoupper($tutor) }}</strong></p>
            @php
                $incStartParsed = $inclusiveStartDate ? \Carbon\Carbon::parse($inclusiveStartDate)->toDateString() : null;
                $incEndParsed = $inclusiveEndDate ? \Carbon\Carbon::parse($inclusiveEndDate)->toDateString() : null;
                $incSame = $incStartParsed && $incEndParsed && $incStartParsed === $incEndParsed;
            @endphp

            @if ($incSame)
                <p>
                    Date:
                    <strong>{{ formatDateMDY($inclusiveStartDate) }}</strong>
                </p>
            @else
                <p>
                    Inclusive Date:
                    <strong>
                        {{ formatDateMDY($inclusiveStartDate) }}
                        —
                        {{ formatDateMDY($inclusiveEndDate) }}
                    </strong>
                </p>
            @endif
        </div>

    @elseif ($startDate || $endDate)

        <div class="filters" style="background-color:#ffffff; border: none; padding: 0; margin-bottom: 30px;">
            @php
                $startParsed = $startDate ? \Carbon\Carbon::parse($startDate)->toDateString() : null;
                $endParsed = $endDate ? \Carbon\Carbon::parse($endDate)->toDateString() : null;
                $sameRange = $startParsed && $endParsed && $startParsed === $endParsed;
            @endphp

            @if ($sameRange)

                <div class="header" style="background-color:#ffffff;">   
                    <h3>Daily Attendance Record</h3>
                </div>

                <p>Date: <strong>{{ formatDateMDY($startDate) }}</strong></p>
            @else

                <div class="header" style="background-color:#ffffff;">   
                    <h3>Attendance Log</h3>
                </div>

                <p>
                    Inclusive Date:
                    <strong>
                        {{ formatDateMDY($startDate) }}
                        —
                        {{ formatDateMDY($endDate) }}
                    </strong>
                </p>
            @endif
        </div>
    @endif

    @if (count($attendances) > 0)
        @if ($tutor)
            <table>
                <thead>
                    <tr>
                        <th style="width: 20%;">Tutee</th>
                        <th style="width: 18%;">Time</th>
                        {{-- <th style="width: 20%;">Package Type</th> --}}
                        <th style="width: 16%;">Dates</th>
                        <th style="width: 10%;">Hours</th>
                        <th style="width: 12%;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($attendances as $attendance)
                        <tr>
                            <td>{{ $attendance['student_name'] ?? '-' }}</td>
                            <td>
                                @if (!empty($attendance['grouped_times']) && is_array($attendance['grouped_times']))
                                    @foreach ($attendance['grouped_times'] as $gt)
                                        {{ formatTime12h($gt['time_in'] ?? null) }} - {{ formatTime12h($gt['time_out'] ?? null) }}
                                        {{-- ({{ $gt['days'] ?? '-' }}) --}}
                                        <br/>
                                    @endforeach
                                @else
                                    {{ formatTime12h($attendance['time_in'] ?? null) }} - {{ formatTime12h($attendance['time_out'] ?? null) }}
                                @endif
                            </td>
                            {{-- <td>
                                @if (!empty($attendance['grouped_times']) && is_array($attendance['grouped_times']))
                                    @foreach ($attendance['grouped_times'] as $gt)
                                        {{ $gt['package_type'] ?? ($attendance['package_type'] ?? '-') }}
                                        <br/>
                                    @endforeach
                                @else
                                    {{ $attendance['package_type'] ?? '-' }}
                                @endif
                            </td> --}}
                            <td>{{ $attendance['dates'] ?? (($attendance['day'] ?? null) ?: ($attendance['date'] ?? '-')) }}</td>
                            <td style="text-align: right;">{{ number_format((float)($attendance['hours'] ?? 0), 2) }}</td>
                            <td style="text-align: right;">{{ number_format((float)($attendance['amount'] ?? 0), 2) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #333;">
                <table style="width: 100%; border: none;">
                    <tr style="border: none;">
                        <td style="border: none; width: 60%; text-align: right; padding-right: 10px; font-weight: bold;">Total Hours:</td>
                        <td style="border: none; width: 20%; text-align: right; background-color: #f5f5f5; padding: 8px; border-radius: 4px; font-weight: bold;">{{ number_format((float)($totalHours ?? 0), 2) }} hrs</td>
                        <td style="border: none; width: 20%;"></td>
                    </tr>
                    <tr style="border: none; border-top: 1px solid #ddd;">
                        <td style="border: none; width: 60%; text-align: right; padding-right: 10px; font-weight: bold; font-size: 14px; padding-top: 10px;">Tutors Total Amount Due: Php </td>
                        <td style="border: none; width: 20%; text-align: right; background-color: #f0f0f0; padding: 8px; border-radius: 4px; font-weight: bold; font-size: 14px; padding-top: 10px;">{{ number_format((float)($totalAmount ?? 0), 2) }}</td>
                        <td style="border: none; width: 20%;"></td>
                    </tr>
                    <tr style="border: none; border-top: 1px solid #ddd;">
                        <td style="border: none; width: 60%; text-align: right; padding-right: 10px; font-weight: bold; font-size: 14px; padding-top: 10px;">Tutees Total Amount Due: Php </td>
                        <td style="border: none; width: 20%; text-align: right; background-color: #f0f0f0; padding: 8px; border-radius: 4px; font-weight: bold; font-size: 14px; padding-top: 10px;">{{ number_format((float)($totalAmountDue ?? 0), 2) }}</td>
                        <td style="border: none; width: 20%;"></td>
                    </tr>
                </table>
            </div>

            <p style="margin-top: 20px; font-size: 12px;">
                <strong>Total Records:</strong> {{ count($attendances) }}
            </p>
        @else
            @php
                $startParsed = $startDate ? \Carbon\Carbon::parse($startDate)->toDateString() : null;
                $endParsed = $endDate ? \Carbon\Carbon::parse($endDate)->toDateString() : null;
                $sameRange = $startParsed && $endParsed && $startParsed === $endParsed;
            @endphp

            @if ($sameRange)
                <table>
                    <thead>
                        <tr>
                            <th style="width: 15%;">Time</th>
                            <th style="width: 15%;">Tutee</th>
                            <th style="width: 15%;">Tutor</th>
                            <th style="width: 15%;">Package Type</th>
                            <th style="width: 8%;">Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($attendances as $attendance)
                            <tr>
                                <td>{{ formatTime12h($attendance['time_in']) }} - {{ formatTime12h($attendance['time_out']) }}</td>
                                <td>{{ $attendance['student_name'] ?? '-' }}</td>
                                <td>{{ $attendance['tutor_name'] ?? '-' }}</td>
                                <td>{{ $attendance['package_type'] ?? '-' }}</td>
                                <td style="text-align: right;">{{ number_format((float)($attendance['hours'] ?? 0), 2) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>

                <p style="margin-top: 20px; font-size: 12px;">
                    <strong>Total Hours:</strong> {{ number_format((float)($totalHours ?? 0), 2) }} hrs<br/>
                    <strong>Tutors Total Amount Due: </strong> Php {{ number_format((float)($totalAmount ?? 0), 2) }}<br/>
                    <strong>Tutees Total Amount Due: </strong> Php {{ number_format((float)($totalAmountDue ?? 0), 2) }}<br/>
                    <strong>Total Records:</strong> {{ count($attendances) }}
                </p>

            @else

                <table>
                    <thead>
                        <tr>
                            <th style="width: 10%;">Date</th>
                            <th style="width: 14%;">Tutee</th>
                            <th style="width: 12%;">Tutor</th>
                            <th style="width: 13%;">Time</th>
                            <th style="width: 11%;">Package</th>
                            <th style="width: 8%;">Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($attendances as $attendance)
                            <tr>
                                <td>{{ isset($attendance['date']) ? formatDateMDY($attendance['date']) : '-' }}</td>
                                <td>{{ $attendance['student_name'] ?? '-' }}</td>
                                <td>{{ $attendance['tutor_name'] ?? '-' }}</td>
                                <td>{{ formatTime12h($attendance['time_in']) }} - {{ formatTime12h($attendance['time_out']) }}</td>
                                <td>{{ $attendance['package_type'] ?? '-' }}</td>
                                <td style="text-align: right;">{{ number_format((float)($attendance['hours'] ?? 0), 2) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>

               

                <p style="margin-top: 20px; font-size: 12px;">
                    <strong>Total Hours:</strong> {{ number_format((float)($totalHours ?? 0), 2) }} hrs<br/>
                    <strong>Tutors Total Amount Due: </strong> Php {{ number_format((float)($totalAmount ?? 0), 2) }}<br/>
                    <strong>Tutees Total Amount Due: </strong> Php {{ number_format((float)($totalAmountDue ?? 0), 2) }}<br/>
                    <strong>Total Records:</strong> {{ count($attendances) }}
                </p>


            @endif

           
        @endif
    @else
        <div class="empty">
            <p>No attendance records found for the selected filters.</p>
        </div>
    @endif

    <div class="footer">
        <p>This is an electronically generated report. Page generated on {{ \Carbon\Carbon::now('Asia/Manila')->format('F d, Y \a\t g:i A') }}</p>
    </div>
</body>
</html>
