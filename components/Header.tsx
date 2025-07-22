import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  currentView: string;
}

export const Header: React.FC<HeaderProps> = ({ currentView }) => {
  const { user, profile, signOut } = useAuth();

  const displayName = (profile?.firstName && profile?.lastName) 
    ? `${profile.firstName} ${profile.lastName}` 
    : user?.email;

  const displayInitial = displayName?.charAt(0).toUpperCase() || '?';

  return (
    <header className="bg-slate-800 shadow-md p-4 flex justify-between items-center flex-shrink-0 z-10">
      <h1 className="text-2xl font-bold text-white">{currentView}</h1>
      <div className="flex items-center space-x-6">
        <button className="relative text-slate-400 hover:text-white transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-800"></span>
        </button>
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-emerald-400">
            {displayInitial}
          </div>
          <div>
            <p className="font-semibold text-slate-200 truncate max-w-[150px]">{displayName}</p>
            <p className="text-xs text-slate-400 capitalize">{profile?.role}</p>
          </div>
        </div>
        <button 
          onClick={signOut}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-lg text-sm transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
};