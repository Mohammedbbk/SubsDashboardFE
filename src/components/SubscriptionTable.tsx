import React, { useState } from "react";
import { Subscription } from "@/types";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";
import { differenceInDays, isAfter, parseISO, format } from "date-fns";
import { cn } from "@/lib/utils";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import SaudiRiyalIcon from "@/assets/SaudiRiyal.svg";

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => void;
  onRowSelect: (subscription: Subscription | null) => void;
  selectedSubscription: Subscription | null;
}

const SubscriptionTable: React.FC<SubscriptionTableProps> = ({
  subscriptions,
  isLoading,
  error,
  refreshData,
  onRowSelect,
  selectedSubscription,
}) => {
  const [subToDelete, setSubToDelete] = useState<Subscription | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [subToUpdate, setSubToUpdate] = useState<Subscription | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateCost, setUpdateCost] = useState<string>("");
  const [updateCycle, setUpdateCycle] = useState<"monthly" | "annually">("monthly");
  const [historySub, setHistorySub] = useState<Subscription | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState<Array<{ effective_date: string; cost: number | string; id?: number }>>([]); 

  const handleDeleteClick = (subscription: Subscription) => {
    setSubToDelete(subscription);
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!subToDelete) return;

    try {
      await apiClient.delete(`/subscriptions/${subToDelete.id}/`);
      toast.success(`Subscription "${subToDelete?.name}" deleted successfully!`);
      refreshData();
      setIsConfirmOpen(false);
      setSubToDelete(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Delete error:", err);
        toast.error(err.message || "Failed to delete subscription. Please try again.");
      } else {
        console.error("Delete error:", err);
        toast.error("Failed to delete subscription. Please try again.");
      }
      setIsConfirmOpen(false);
      setSubToDelete(null);
    }
  };

  const handleUpdateOpen = (sub: Subscription) => {
    setSubToUpdate(sub);
    setUpdateCost(sub.cost.toString());
    setUpdateCycle(sub.billing_cycle as "monthly" | "annually");
    setIsUpdateOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subToUpdate) return;
    try {
      await apiClient.post(
        `/subscriptions/${subToUpdate.id}/update-price/`,
        { cost: parseFloat(updateCost), billing_cycle: updateCycle }
      );
      toast.success("Price updated successfully!");
      refreshData();
      setIsUpdateOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Failed to update price.");
      } else {
        toast.error("Failed to update price.");
      }
    }
  };

  const handleHistoryOpen = async (sub: Subscription) => {
    setHistorySub(sub);
    setIsHistoryOpen(true);
    setHistoryData([]); 
    try {
      const res = await apiClient.get<Array<{ effective_date: string; cost: number | string; id?: number }>>(`/subscriptions/${sub.id}/history/`);
      setHistoryData(res.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("History fetching error:", err);
        toast.error(err.message || "Failed to fetch price history.");
      } else {
        console.error("History fetching error:", err);
        toast.error("Failed to fetch price history.");
      }
    }
  };

  if (isLoading) {
    return <div>Loading subscriptions...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600">Error loading subscriptions: {error}</div>
    );
  }

  return (
    <>
      <Table>
        <TableCaption>A list of your subscriptions.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Cycle</TableHead>
            <TableHead>Renewal Date</TableHead>
            <TableHead>Monthly Cost</TableHead>
            <TableHead>Annual Cost</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!Array.isArray(subscriptions) || subscriptions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                {isLoading
                  ? "Loading..."
                  : error
                  ? `Error: ${error}`
                  : "No subscriptions found. Add one!"}
              </TableCell>
            </TableRow>
          ) : (
            subscriptions.map((sub) => {
              const isSelected = selectedSubscription?.id === sub.id;
              const today = new Date();
              let renewalDate: Date | null = null;
              let formattedRenewalDate = "-";
              try {
                const parsed = parseISO(sub.renewal_date);
                if (!isNaN(parsed.getTime())) {
                  renewalDate = parsed;
                  formattedRenewalDate = format(renewalDate, "PPP");
                }
              } catch {
              }

              let isRenewingSoon = false;
              if (renewalDate && !isNaN(renewalDate.getTime())) {
                const daysUntilRenewal = differenceInDays(renewalDate, today);
                isRenewingSoon =
                  isAfter(renewalDate, today) && daysUntilRenewal < 7;
              }

              return (
                <TableRow
                  key={sub.id}
                  onClick={() => {
                    if (sub.billing_cycle === "monthly") {
                      onRowSelect(sub);
                    } else {
                      onRowSelect(null); 
                    }
                  }}
                  className={cn(
                    sub.billing_cycle === "monthly" ? "cursor-pointer" : "cursor-default",
                    isRenewingSoon && "bg-yellow-100 dark:bg-yellow-900/30",
                    isSelected && "[&>td]:!bg-muted/50"
                  )}
                >
                  <TableCell className="font-medium">{sub.name}</TableCell>
                  <TableCell>{Number(sub.cost).toFixed(2)} SAR</TableCell>
                  <TableCell>{sub.billing_cycle}</TableCell>
                  <TableCell>{formattedRenewalDate}</TableCell>
                  <TableCell>{sub.monthly_cost?.toFixed(2) ?? "-"}</TableCell>
                  <TableCell>{sub.annual_cost?.toFixed(2) ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleUpdateOpen(sub); }}>
                      Update Price
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleHistoryOpen(sub); }}>
                      View History
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleDeleteClick(sub); }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              subscription for "{subToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSubToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Price</DialogTitle>
            <DialogDescription>Modify cost and billing cycle.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={updateCost}
              onChange={(e) => setUpdateCost(e.target.value)}
              required
            />
            <Select value={updateCycle} onValueChange={(val: "monthly" | "annually") => setUpdateCycle(val)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Price History for {historySub?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {historyData.length === 0 && <p className="text-sm text-muted-foreground">No price history found.</p>}
            {historyData.map((h, index) => {
              const itemKey = h.id ?? h.effective_date ?? `history-${index}`;

              if (h?.effective_date == null || h.effective_date === "" || h?.cost == null) {
                 return null;
              }

              let formattedDate = "Invalid Date";
              try {
                const parsed = parseISO(h.effective_date);
                if (!isNaN(parsed.getTime())) {
                  formattedDate = format(parsed, "PPP");
                }
              } catch (e) { }

              const costAsNumber = Number(h.cost);
              const formattedCost = !isNaN(costAsNumber) ? costAsNumber.toFixed(2) : "N/A";

              return (
                <div key={itemKey} className="flex justify-between text-sm">
                  <span>{formattedDate}</span>
                  <span className="inline-flex items-center font-medium">
                    {formattedCost}
                    <img src={SaudiRiyalIcon} alt="SAR" className="w-4 h-4 inline ml-1 filter dark:invert" />
                  </span>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SubscriptionTable;