/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface TestResult {
  test: string;
  status: "success" | "error" | "pending";
  response?: any;
  error?: string;
  duration?: number;
}

export default function ApiTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateResult = (
    test: string,
    status: TestResult["status"],
    response?: any,
    error?: string,
    duration?: number
  ) => {
    setResults((prev) => {
      const existing = prev.find((r) => r.test === test);
      if (existing) {
        return prev.map((r) =>
          r.test === test ? { ...r, status, response, error, duration } : r
        );
      } else {
        return [...prev, { test, status, response, error, duration }];
      }
    });
  };

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    updateResult(testName, "pending");
    const startTime = Date.now();
    try {
      const response = await testFn();
      const duration = Date.now() - startTime;
      updateResult(testName, "success", response, undefined, duration);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      updateResult(
        testName,
        "error",
        undefined,
        error instanceof Error ? error.message : String(error),
        duration
      );
      throw error;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Test 1: Create a test user
      const testUser = await runTest("Create Test User", async () => {
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: `test-${Date.now()}@example.com`,
            password: "TestPassword123!",
            username: `testuser${Date.now()}`,
            role: "user",
            currency: "USD",
            walletName: "Test USD Wallet",
          }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to create user");
        return data;
      });

      // Test 2: Get users with balances
      await runTest("Get Users with Balances", async () => {
        const response = await fetch("/api/admin/users-with-balances");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to get users");
        return data;
      });

      // Test 3: Get specific user by ID
      if (testUser?.data?.user?.id) {
        await runTest("Get User by ID", async () => {
          const response = await fetch(
            `/api/admin/users/${testUser.data.user.id}`
          );
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Failed to get user");
          return data;
        });
      }

      // Test 4: Get balance
      await runTest("Get Current Balance", async () => {
        const response = await fetch("/api/balance");
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to get balance");
        return data;
      });

      // Test 5: Get wallets
      await runTest("Get Wallets", async () => {
        const response = await fetch("/api/admin/wallets");
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to get wallets");
        return data;
      });

      // Test 6: Create expense (if user was created successfully)
      if (testUser?.data?.user?.id) {
        await runTest("Create Test Expense", async () => {
          const response = await fetch("/api/transactions/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: 25.5,
              description: "Test expense from API test",
              category: "food",
              date: new Date().toISOString().split("T")[0],
            }),
          });
          const data = await response.json();
          if (!response.ok)
            throw new Error(data.error || "Failed to create expense");
          return data;
        });
      }

      // Test 7: Get expenses
      await runTest("Get Expenses", async () => {
        const response = await fetch("/api/transactions/expenses");
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to get expenses");
        return data;
      });

      // Test 8: Fund user (if test user was created)
      if (testUser?.data?.user?.id) {
        await runTest("Fund Test User", async () => {
          const response = await fetch("/api/admin/funds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: testUser.data.user.id,
              amount: 100,
              description: "Test funding from API test",
            }),
          });
          const data = await response.json();
          if (!response.ok)
            throw new Error(data.error || "Failed to fund user");
          return data;
        });
      }
    } catch (error) {
      console.error("Test suite error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const successCount = results.filter((r) => r.status === "success").length;
  const errorCount = results.filter((r) => r.status === "error").length;
  const totalTests = results.length;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">API Test Suite</h1>
        <p className="text-gray-600">
          Test all API functions to validate the consolidated SQL setup
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <Button
          onClick={runAllTests}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? "Running Tests..." : "Run All Tests"}
        </Button>
        <Button onClick={clearResults} variant="outline" disabled={isRunning}>
          Clear Results
        </Button>
      </div>

      {/* Test Results Summary */}
      {results.length > 0 && (
        <div className="mb-6 flex gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            Total: {totalTests}
          </Badge>
          <Badge className="bg-green-500 text-lg px-4 py-2">
            Passed: {successCount}
          </Badge>
          <Badge className="bg-red-500 text-lg px-4 py-2">
            Failed: {errorCount}
          </Badge>
          <Badge className="bg-blue-500 text-lg px-4 py-2">
            Success Rate:{" "}
            {totalTests > 0 ? Math.round((successCount / totalTests) * 100) : 0}
            %
          </Badge>
        </div>
      )}

      {/* Test Results */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>{result.test}</span>
                <div className="flex items-center gap-2">
                  {result.duration && (
                    <span className="text-sm text-gray-500">
                      {result.duration}ms
                    </span>
                  )}
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.error && (
                <div className="mb-4">
                  <Label className="text-red-600 font-semibold">Error:</Label>
                  <div className="bg-red-50 border border-red-200 rounded p-3 mt-1">
                    <code className="text-red-700">{result.error}</code>
                  </div>
                </div>
              )}
              {result.response && (
                <div>
                  <Label className="text-green-600 font-semibold">
                    Response:
                  </Label>
                  <Textarea
                    value={JSON.stringify(result.response, null, 2)}
                    readOnly
                    className="mt-1 font-mono text-sm"
                    rows={8}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Manual Test Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Manual API Testing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Quick Test Endpoints:</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    runTest("Health Check", async () => {
                      const response = await fetch("/api/balance");
                      const data = await response.json();
                      if (!response.ok) throw new Error(data.error);
                      return data;
                    })
                  }
                >
                  Test Balance API
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    runTest("Users List", async () => {
                      const response = await fetch(
                        "/api/admin/users-with-balances"
                      );
                      const data = await response.json();
                      if (!response.ok) throw new Error(data.error);
                      return data;
                    })
                  }
                >
                  Test Users API
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
