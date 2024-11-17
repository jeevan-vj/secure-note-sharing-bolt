"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Copy, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { decryptNote } from "@/lib/encryption";
import { toast } from "sonner";

export default function NotePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "decrypted" | "error" | "expired" | "password-required"
  >("loading");
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [encryptedData, setEncryptedData] = useState<string>("");
  const [decryptionKey, setDecryptionKey] = useState<string>("");

  useEffect(() => {
    const fetchNote = async () => {
      try {
        // Get the decryption key from the URL hash
        const key = window.location.hash.slice(1);
        if (!key) {
          setError("Invalid or missing decryption key");
          setStatus("error");
          return;
        }

        setDecryptionKey(key);
        const response = await fetch(`/api/notes/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404 || response.status === 410) {
            setStatus("expired");
            return;
          }
          throw new Error("Failed to fetch note");
        }

        const { content, isPasswordProtected } = await response.json();
        setEncryptedData(content);

        if (isPasswordProtected) {
          setStatus("password-required");
          return;
        }

        const decryptedContent = decryptNote(content, key);
        setNote(decryptedContent);
        setStatus("decrypted");
      } catch (error) {
        setError("Failed to decrypt note. The link may be invalid.");
        setStatus("error");
      }
    };

    fetchNote();
  }, [params.id]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const decryptedContent = decryptNote(encryptedData, decryptionKey, password);
      setNote(decryptedContent);
      setStatus("decrypted");
    } catch (error) {
      if (error.message === "Incorrect password") {
        toast.error("Incorrect password. Please try again.");
      } else {
        setError("Failed to decrypt note. Please try again.");
        setStatus("error");
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(note);
      toast.success("Note copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy note");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          {status === "loading" && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading note...</p>
            </div>
          )}

          {status === "password-required" && (
            <div className="w-full max-w-md space-y-6">
              <div className="flex flex-col items-center space-y-4 text-center">
                <Lock className="h-12 w-12 text-primary" />
                <h1 className="text-2xl font-bold">Password Protected Note</h1>
                <p className="text-muted-foreground">
                  This note is protected. Please enter the password to view it.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
                <Button type="submit" className="w-full">
                  Decrypt Note
                </Button>
              </form>
            </div>
          )}

          {status === "expired" && (
            <div className="flex flex-col items-center space-y-4 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive" />
              <h1 className="text-2xl font-bold">Note Expired</h1>
              <p className="text-muted-foreground max-w-md">
                This note has either expired or has already been accessed.
                For security reasons, notes can only be viewed once.
              </p>
              <Button onClick={() => router.push("/")} variant="outline">
                Create New Note
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center space-y-4 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive" />
              <h1 className="text-2xl font-bold">Error</h1>
              <p className="text-muted-foreground max-w-md">{error}</p>
              <Button onClick={() => router.push("/")} variant="outline">
                Return Home
              </Button>
            </div>
          )}

          {status === "decrypted" && (
            <div className="w-full max-w-2xl space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <h2 className="text-lg font-semibold">Note Decrypted</h2>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <pre className="whitespace-pre-wrap break-words text-sm">
                  {note}
                </pre>
              </div>

              <div className="flex justify-center">
                <Button onClick={() => router.push("/")} variant="outline">
                  Create New Note
                </Button>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                This note has been deleted from our servers and cannot be accessed again.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}