import React, { useState } from 'react'; 
import { Subscription } from '@/types';
import apiClient from '@/lib/apiClient'; 
import { toast } from "sonner"; 
import { differenceInDays, isAfter, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => void; 
  onRowSelect: (subscription: Subscription | null) => void;
  selectedSubscription: Subscription | null;
}

const SubscriptionTable: React.FC<SubscriptionTableProps> = ({ subscriptions, isLoading, error, refreshData, onRowSelect, selectedSubscription }) => {
  const [subToDelete, setSubToDelete] = useState<Subscription | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDeleteClick = (subscription: Subscription) => {
    setSubToDelete(subscription);
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!subToDelete) return;

    try {
      await apiClient.delete(`/subscriptions/${subToDelete.id}/`);
      toast.success(`Subscription "${subToDelete.name}" deleted successfully!`);
      refreshData(); 
      setIsConfirmOpen(false); 
      setSubToDelete(null); 
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error("Failed to delete subscription. Please try again.");
      setIsConfirmOpen(false); 
      setSubToDelete(null);
    }
  };

  if (isLoading) {
    return <div>Loading subscriptions...</div>;
  }
                
  if (error) {
    return <div className="text-red-600">Error loading subscriptions: {error}</div>;
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
          {subscriptions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center"> {/* Adjusted colSpan */}
                No subscriptions found. Add one!
              </TableCell>
            </TableRow>
          ) : (
            subscriptions.map(sub => {
              const isSelected = selectedSubscription?.id === sub.id;
              const today = new Date();
              const renewalDate = parseISO(sub.renewal_date);
              let isRenewingSoon = false;
              if (renewalDate && !isNaN(renewalDate.getTime())) {
                const daysUntilRenewal = differenceInDays(renewalDate, today);
                isRenewingSoon = isAfter(renewalDate, today) && daysUntilRenewal < 7;
              }

              return (
                <TableRow
                  key={sub.id}
                  onClick={() => {
                    if (sub.billing_cycle === 'monthly') {
                      onRowSelect(sub);
                    }
                  }}
                  className={cn(
                    'cursor-pointer',
                    isRenewingSoon && 'bg-yellow-100 dark:bg-yellow-900/30',
                    isSelected && '[&>td]:!bg-muted/50',
                  )}
                >
                  <TableCell className="font-medium">{sub.name}</TableCell>
                  <TableCell>{sub.cost}</TableCell> {/* TODO: Format currency */}
                  <TableCell>{sub.billing_cycle}</TableCell>
                  <TableCell>{sub.renewal_date}</TableCell> {/* TODO: Format date */}
                  <TableCell>{sub.monthly_cost?.toFixed(2) ?? '-'}</TableCell> {/* Format to 2 decimals */}
                  <TableCell>{sub.annual_cost?.toFixed(2) ?? '-'}</TableCell> {/* Format to 2 decimals */}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(sub)}
                    >
                      <Trash2 className="h-4 w-4" />
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
            <AlertDialogCancel onClick={() => setSubToDelete(null)}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SubscriptionTable;