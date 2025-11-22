import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Component that throws an error when clicked
const ErrorThrower = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error: ErrorBoundary is working correctly!');
  }
  return <p>Click the button below to test ErrorBoundary</p>;
};

const TestErrorBoundary = () => {
  const [throwError, setThrowError] = useState(false);

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test ErrorBoundary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ErrorThrower shouldThrow={throwError} />
          <Button onClick={() => setThrowError(true)} variant="destructive">
            Throw Test Error
          </Button>
          <p className="text-xs text-muted-foreground">
            This page is for testing only. Navigate to{' '}
            <a href="/" className="text-primary underline">
              home
            </a>{' '}
            for the calculator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestErrorBoundary;
