// components/LogoutButton.jsx (text-only version)
'use client'

import { logout } from '@/app/logout/actions';
import { UserRoundX } from 'lucide-react';

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="
          bg-red-600 hover:bg-red-700 
          text-white font-medium 
          px-2 py-2 rounded-full
          shadow-md hover:shadow-lg
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50
          active:bg-red-800
        "
      >
        <UserRoundX className='w-5 h-5'/>
      </button>
    </form>
  );
}