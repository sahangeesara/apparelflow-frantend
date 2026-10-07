'use client';

import Swal from 'sweetalert2';

export function showSuccess(message: string) {
  return Swal.fire({
    icon: 'success',
    title: 'Success',
    text: message,
    confirmButtonColor: '#1e3a8a',
  });
}

export function showError(message: string) {
  return Swal.fire({
    icon: 'error',
    title: 'Unable to continue',
    text: message,
    confirmButtonColor: '#1e3a8a',
  });
}

export function showInfo(message: string) {
  return Swal.fire({
    icon: 'info',
    title: 'Notice',
    text: message,
    confirmButtonColor: '#1e3a8a',
  });
}

export function showJson(title: string, value: unknown) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return Swal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonColor: '#1e3a8a',
    width: 640,
  });
}

type VerificationVariance = {
  actual?: number | null;
  expected?: number | null;
  variance?: number | null;
  component?: string | null;
};

function escapeHtml(value: unknown) {
  return String(value ?? '—')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function showVerificationVariances(value: unknown) {
  if (!Array.isArray(value)) return showJson('Verification variances', value);

  const rows = value
    .filter((item): item is VerificationVariance => typeof item === 'object' && item !== null)
    .map(item => {
      const variance = Number(item.variance ?? 0);
      const isMatch = variance === 0;
      const result = isMatch ? 'Match' : variance > 0 ? 'Over' : 'Short';
      const resultColor = isMatch ? '#15803d' : variance > 0 ? '#b45309' : '#b91c1c';
      return `
        <tr>
          <td style="padding:10px;text-align:left;border-bottom:1px solid #e2e8f0">${escapeHtml(item.component)}</td>
          <td style="padding:10px;text-align:right;border-bottom:1px solid #e2e8f0">${escapeHtml(item.expected)}</td>
          <td style="padding:10px;text-align:right;border-bottom:1px solid #e2e8f0">${escapeHtml(item.actual)}</td>
          <td style="padding:10px;text-align:right;border-bottom:1px solid #e2e8f0;font-weight:600">${escapeHtml(item.variance)}</td>
          <td style="padding:10px;text-align:center;border-bottom:1px solid #e2e8f0;color:${resultColor};font-weight:600">${result}</td>
        </tr>`;
    })
    .join('');

  return Swal.fire({
    icon: 'info',
    title: 'Verification variances',
    html: rows
      ? `<div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead>
              <tr style="background:#f8fafc">
                <th style="padding:10px;text-align:left">Component</th>
                <th style="padding:10px;text-align:right">Expected</th>
                <th style="padding:10px;text-align:right">Actual</th>
                <th style="padding:10px;text-align:right">Variance</th>
                <th style="padding:10px;text-align:center">Result</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`
      : '<p>No variance details available.</p>',
    confirmButtonColor: '#1e3a8a',
    width: 760,
  });
}

export function showConfirm(message: string) {
  return Swal.fire({
    icon: 'question',
    title: 'Confirm logout',
    text: message,
    showCancelButton: true,
    confirmButtonText: 'Yes, log out',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#1e3a8a',
    cancelButtonColor: '#64748b',
    reverseButtons: true,
  });
}
