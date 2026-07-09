import React from 'react';

import Header from './_components/Header';
import SideBar from './_components/SideBar';

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 md:block">
        <SideBar />
      </aside>
      <div className="md:pl-64">
        <Header />
        <main className="mx-auto max-w-6xl p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
