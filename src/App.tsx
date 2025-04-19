import { useState, useEffect, useCallback, useMemo } from 'react'
import './App.css'
import SubscriptionTable from '@/components/SubscriptionTable'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AddSubscriptionForm } from '@/components/AddSubscriptionForm'
import { Subscription } from '@/types'
import apiClient from '@/lib/apiClient'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { parseISO, isAfter, compareAsc, format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { ModeToggle } from "@/components/mode-toggle";

function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [selectedSubForComparison, setSelectedSubForComparison] = useState<Subscription | null>(null);

  const WorkspaceSubscriptions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<Subscription[]>('/subscriptions/')
      setSubscriptions(response.data)
    } catch (err: any) {
      setError(err.message || 'Error fetching subscriptions')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    WorkspaceSubscriptions()
  }, [WorkspaceSubscriptions])

  const totalMonthlySpend = useMemo(() => {
    return subscriptions.reduce((acc, sub) => acc + (Number(sub.monthly_cost) || 0), 0);
  }, [subscriptions]);
  const upcomingRenewals = useMemo(() => {
    const today = new Date();
    return subscriptions
      .map(sub => {
        const renewalDateObj = parseISO(sub.renewal_date);
        return { ...sub, renewalDateObj };
      })
      .filter(item => !isNaN(item.renewalDateObj.getTime()) && isAfter(item.renewalDateObj, today))
      .sort((a, b) => compareAsc(a.renewalDateObj, b.renewalDateObj))
      .slice(0, 5);
  }, [subscriptions]);
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};
    subscriptions.forEach(sub => {
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
              <AddSubscriptionForm refreshData={WorkspaceSubscriptions} onFormSuccess={() => setOpen(false)} />
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
            {totalMonthlySpend.toFixed(2)} SAR
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
              upcomingRenewals.map(item => (
                <div key={item.id} className="mb-2">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    {format(item.renewalDateObj, 'PPP')} - {item.cost} SAR
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
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={value => `SAR ${value}`} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="monthlyCost" fill="var(--color-primary)" radius={4} />
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
            {selectedSubForComparison && selectedSubForComparison.billing_cycle === 'monthly' ? (
              <p>
                Annual cost for '{selectedSubForComparison.name}': {selectedSubForComparison.annual_cost?.toFixed(2)} SAR
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a monthly subscription from the table to see its calculated annual cost.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <SubscriptionTable
        subscriptions={subscriptions}
        isLoading={isLoading}
        error={error}
        refreshData={WorkspaceSubscriptions}
        onRowSelect={handleSelectSubscription}
        selectedSubscription={selectedSubForComparison}
      />
    </div>
  )
}

export default App
