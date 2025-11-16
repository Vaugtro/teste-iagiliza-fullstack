import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

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

import { LoaderCircle } from 'lucide-react';

import { api } from '@/lib/api';
import axios from 'axios';

const loginSchema = z.object({
  email: z.email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(1, {
    message: 'Password is required.',
  }),
});

export default function Login() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
  setIsLoading(true);
  try {
    const response = await api.user.login(values);
    console.log(response);
    navigate('/dashboard');
  } catch (error) {
    console.log(error);
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message ||
        error.response?.data?.error ||
        'Login failed. Please try again later.';
      toast.error(message);
    } else {
      toast.error('An unexpected error occurred. Please try again.');
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl min-w-[400px]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-center text-3xl font-bold tracking-tight">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center text-base">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}  className="space-y-5">
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
                        placeholder="Enter your password"
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
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Button
              variant="link"
              onClick={handleRegister}
              className="h-auto p-0 text-fuchsia-200 hover:text-fuchsia-400 hover:no-underline font-semibold"
            >
              Create account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
