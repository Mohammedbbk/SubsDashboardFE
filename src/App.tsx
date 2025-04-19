import { useState, useEffect, useCallback, useMemo } from "react";
import "./App.css";
import SubscriptionTable from "@/components/SubscriptionTable";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AddSubscriptionForm } from "@/components/AddSubscriptionForm";
import { Subscription } from "@/types";
import apiClient from "@/lib/apiClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { parseISO, isAfter, compareAsc, format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { ModeToggle } from "@/components/mode-toggle";
import { Calendar } from "@/components/ui/calendar";
import SaudiRiyalIcon from "@/assets/SaudiRiyal.svg";

interface DashboardSummary {
  total_monthly_spend: number;
}

function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedSubForComparison, setSelectedSubForComparison] =
    useState<Subscription | null>(null);

  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(true);

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<Subscription[]>("/subscriptions/");
      setSubscriptions(response.data);
    } catch (err: any) {
      setError(err.message || "Error fetching subscriptions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDashboardSummary = useCallback(async () => {
    setIsSummaryLoading(true);
    try {
      const response = await apiClient.get<DashboardSummary>("/dashboard-summary/");
      setDashboardSummary(response.data);
    } catch (err: any) {
      setError(err.message || "Error fetching dashboard summary");
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
    fetchDashboardSummary();
  }, [fetchSubscriptions, fetchDashboardSummary]);

  const renewalDatesForCalendar = useMemo(() => {
    return subscriptions
      .map(sub => {
        try {
          return parseISO(sub.renewal_date);
        } catch {
          return null;
        }
      })
      .filter((date): date is Date => date !== null && !isNaN(date.getTime()));
  }, [subscriptions]);

  const upcomingRenewals = useMemo(() => {
    const today = new Date();
    return subscriptions
      .map((sub) => {
        const renewalDateObj = parseISO(sub.renewal_date);
        return { ...sub, renewalDateObj };
      })
      .filter(
        (item) =>
          !isNaN(item.renewalDateObj.getTime()) &&
          isAfter(item.renewalDateObj, today)
      )
      .sort((a, b) => compareAsc(a.renewalDateObj, b.renewalDateObj))
      .slice(0, 5);
  }, [subscriptions]);
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    subscriptions.forEach((sub) => {
      const cost = Number(sub.monthly_cost) || 0;
      grouped[sub.name] = (grouped[sub.name] || 0) + cost;
    });
    return Object.entries(grouped).map(([name, totalCost]) => ({
      name,
      monthlyCost: parseFloat(totalCost.toFixed(2)),
    }));
  }, [subscriptions]);

  const handleSelectSubscription = (subscription: Subscription | null) => {
    setSelectedSubForComparison(subscription);
  };

  const comparisonContent = useMemo(() => {
    if (!selectedSubForComparison) {
      return (
        <p className="text-sm text-muted-foreground">
          Select a monthly subscription from the table to see cost comparisons.
        </p>
      );
    }

    if (selectedSubForComparison.billing_cycle === 'annually') {
      return (
        <p>
          Currently on an annual plan (
          {selectedSubForComparison.cost.toFixed(2)}{' '}
          <img src={SaudiRiyalIcon} alt="SAR" className="w-4 h-4 inline ml-1" />
          /year).
        </p>
      );
    }

    const monthlyCost = selectedSubForComparison.monthly_cost;
    const calculatedAnnualCost = selectedSubForComparison.annual_cost;
    const annualOptionCost = selectedSubForComparison.annual_cost_option;

    if (monthlyCost == null || calculatedAnnualCost == null) {
      return <p>Cost information missing.</p>;
    }

    const savings = annualOptionCost && annualOptionCost > 0
      ? calculatedAnnualCost - annualOptionCost
      : null;

    return (
      <p className="text-sm">
        Annual cost if paying monthly: {calculatedAnnualCost.toFixed(2)}{' '}
        <img src={SaudiRiyalIcon} alt="SAR" className="w-4 h-4 inline ml-1" />
        /year.
        {annualOptionCost && annualOptionCost > 0 ? (
          savings! > 0 ? (
            <> If you switched to an annual plan at {annualOptionCost.toFixed(2)}{' '}
              <img src={SaudiRiyalIcon} alt="SAR" className="w-4 h-4 inline ml-1" />
              /year, you could save {savings!.toFixed(2)}{' '}
              <img src={SaudiRiyalIcon} alt="SAR" className="w-4 h-4 inline ml-1" />
              /year.</>
          ) : (
            <> An annual option costs {annualOptionCost.toFixed(2)}{' '}
              <img src={SaudiRiyalIcon} alt="SAR" className="w-4 h-4 inline ml-1" />
              /year.</>
          )
        ) : (
          <> No specific annual plan cost provided for comparison.</>
        )}
      </p>
    );
  }, [selectedSubForComparison]);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Subscription Dashboard</h1>
        <div className="flex items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add New Subscription</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subscription</DialogTitle>
                <DialogDescription>
                  Fill out the form below to add a new subscription.
                </DialogDescription>
              </DialogHeader>
              <AddSubscriptionForm
                refreshData={fetchSubscriptions}
                onFormSuccess={() => setOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <ModeToggle />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Monthly Spend</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {isSummaryLoading ? 'Loading...' : (
              dashboardSummary ? (
                <span className="inline-flex items-center">
                  {dashboardSummary.total_monthly_spend.toFixed(2)}
                  <img src={SaudiRiyalIcon} alt="SAR" className="w-6 h-6 ml-2" />
                </span>
              ) : 'N/A'
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Renewal Calendar</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="multiple"
              modifiers={{ renewalDay: renewalDatesForCalendar }}
              modifiersClassNames={{
                renewalDay: 'bg-blue-200 dark:bg-blue-800/50 rounded-full',
              }}
              className="rounded-md border shadow"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Renewals</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingRenewals.length === 0 ? (
              <p>No upcoming renewals.</p>
            ) : (
              upcomingRenewals.map((item) => (
                <div key={item.id} className="mb-2">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {format(item.renewalDateObj, "PPP")} - <span className="inline-flex items-center">
                      {item.cost}
                      <img src={SaudiRiyalIcon} alt="SAR" className="w-4 h-4 ml-1" />
                    </span>
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `SAR ${value}`}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="monthlyCost"
                    fill="var(--color-primary)"
                    radius={4}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Annual Cost Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {comparisonContent}
          </CardContent>
        </Card>
      </div>

      <SubscriptionTable
        subscriptions={subscriptions}
        isLoading={isLoading}
        error={error}
        refreshData={fetchSubscriptions}
        onRowSelect={handleSelectSubscription}
        selectedSubscription={selectedSubForComparison}
      />
    </div>
  );
}

export default App;
