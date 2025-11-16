'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { toast } from 'sonner';

import { useState } from 'react';

import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';

import { useNavigate } from 'react-router-dom';

import { api } from '@/lib/api';
import axios from 'axios';

import { z } from 'zod';
import { LoaderCircle } from 'lucide-react';

const registerSchema = z
  .object({
    email: z.email({ message: 'Please enter a valid email address.' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters long.' }),
    name: z
      .string()
      .min(2, { message: 'Name must be at least 2 characters long.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

export default function Register() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    try {
      await api.user.register({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      toast.success('Account created successfully! Please log in.');
      navigate('/login');
    } catch (error) {
      console.log(error);
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message ||
          error.response?.data?.error ||
          'Registration failed. Please try again later.';
        toast.error(message);
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl min-w-[400px]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-center text-3xl font-bold tracking-tight">
            Create Account
          </CardTitle>
          <CardDescription className="text-center text-base">
            Enter your information to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="John Doe"
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Create a password"
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-11 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Button
              variant="link"
              onClick={handleLogin}
              className="h-auto p-0 text-fuchsia-200 hover:text-fuchsia-400 hover:no-underline font-semibold"
            >
              Sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}