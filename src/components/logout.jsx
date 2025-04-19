// components/LogoutButton.jsx
'use client'

import { logout } from '@/app/logout/actions';

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button 
        type="submit"
        className="bg-red-700 text-white mb-4  px-11 py-2 rounded"
      >
        Logout
      </button>
    </form>
  );
}