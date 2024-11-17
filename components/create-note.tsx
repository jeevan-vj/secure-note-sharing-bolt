"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Lock, Mail, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { encryptNote, type EncryptionAlgorithm } from "@/lib/encryption";

const formSchema = z.object({
  content: z
    .string()
    .min(1, "Note content is required")
    .max(10000, "Note content must be less than 10,000 characters"),
  expiresIn: z.boolean().default(false),
  usePassword: z.boolean().default(false),
  password: z.string().optional()
    .refine((val) => !val || val.length >= 8, {
      message: "Password must be at least 8 characters",
    }),
  algorithm: z.enum(["AES-256", "RSA-2048"]).default("AES-256"),
  recipientEmail: z.string().email().optional(),
  requireVerification: z.boolean().default(false),
});

export function CreateNote() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      expiresIn: false,
      usePassword: false,
      password: "",
      algorithm: "AES-256",
      requireVerification: false,
    },
  });

  const usePassword = form.watch("usePassword");
  const requireVerification = form.watch("requireVerification");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const { encryptedData, key, algorithm } = encryptNote(
        values.content,
        values.usePassword ? values.password : undefined,
        {
          algorithm: values.algorithm as EncryptionAlgorithm,
          recipientEmail: values.recipientEmail,
        }
      );
      
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: encryptedData,
          expiresIn: values.expiresIn ? 24 : 72,
          isPasswordProtected: values.usePassword,
          algorithm: values.algorithm,
          recipientEmail: values.recipientEmail,
        }),
      });

      if (!response.ok) throw new Error("Failed to create note");
      
      const { id } = await response.json();
      const noteUrl = `${window.location.origin}/note/${id}#${key}`;
      
      setGeneratedLink(noteUrl);
      form.reset();
      toast.success("Secure note created successfully!");
    } catch (error) {
      toast.error("Failed to create note. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const copyToClipboard = async () => {
    if (!generatedLink) return;
    
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link. Please try manually.");
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Secure Note</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter sensitive information here..."
                    className="min-h-[200px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="algorithm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Encryption Algorithm</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select encryption algorithm" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="AES-256">
                        AES-256 (Recommended)
                      </SelectItem>
                      <SelectItem value="RSA-2048">
                        RSA-2048 (Asymmetric)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the encryption algorithm for your note
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="usePassword"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <FormLabel className="text-base">Password Protection</FormLabel>
                    </div>
                    <FormDescription>
                      Require a password to decrypt the note
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {usePassword && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter password (min. 8 characters)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="requireVerification"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4" />
                      <FormLabel className="text-base">Recipient Verification</FormLabel>
                    </div>
                    <FormDescription>
                      Verify recipient identity before access
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {requireVerification && (
              <FormField
                control={form.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient Email</FormLabel>
                    <div className="flex items-center space-x-2">
                      <FormControl>
                        <div className="relative w-full">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="recipient@example.com"
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                    </div>
                    <FormDescription>
                      Recipient will receive an email with verification instructions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="expiresIn"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Faster Expiration</FormLabel>
                    <FormDescription>
                      Note will expire in 24 hours instead of 72
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {generatedLink ? (
            <div className="space-y-4">
              <div className="p-4 rounded-md bg-muted break-all">
                <p className="text-sm font-mono">{generatedLink}</p>
              </div>
              <div className="flex space-x-4">
                <Button
                  type="button"
                  className="w-full"
                  onClick={copyToClipboard}
                >
                  Copy Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setGeneratedLink(null)}
                >
                  Create Another
                </Button>
              </div>
            </div>
          ) : (
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Secure Link
            </Button>
          )}
        </form>
      </Form>
    </div>
  );
}