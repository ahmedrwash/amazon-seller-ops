import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from '@/context/AuthContext';

export default function AccessDeniedModal({ open }) {
  const { signOut } = useAuth();

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="bg-slate-900 border-slate-700 text-slate-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-500">Account Disabled</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            Your account has been disabled. Please contact an administrator for assistance.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={() => signOut()}
            className="bg-slate-800 text-white hover:bg-slate-700"
          >
            Sign Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}