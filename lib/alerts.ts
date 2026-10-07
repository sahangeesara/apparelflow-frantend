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
