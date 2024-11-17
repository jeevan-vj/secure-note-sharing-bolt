import { CreateNote } from '@/components/create-note';
import { ThemeToggle } from '@/components/theme-toggle';
import { LockKeyhole } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-8 pt-12">
          <div className="flex items-center space-x-2">
            <LockKeyhole className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">SecureShare</h1>
          </div>
          
          <p className="text-muted-foreground text-center max-w-2xl">
            Share sensitive information securely with one-time access links. 
            Your note will be encrypted and automatically destroyed after being read.
          </p>

          <div className="w-full max-w-2xl">
            <CreateNote />
          </div>

          <div className="text-sm text-muted-foreground text-center max-w-2xl mt-8">
            <h2 className="font-semibold mb-2">How it works:</h2>
            <ul className="space-y-2">
              <li>✨ Enter your sensitive information</li>
              <li>🔒 We encrypt it client-side before sending</li>
              <li>🔗 Get a secure one-time access link</li>
              <li>💨 Note self-destructs after being read</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}