import React from 'react';
import MainLayout from '../../layouts/MainLayout';

export function AppLayout({ children }) {
  return <MainLayout>{children}</MainLayout>;
}

export default AppLayout;
