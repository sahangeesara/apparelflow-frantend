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
