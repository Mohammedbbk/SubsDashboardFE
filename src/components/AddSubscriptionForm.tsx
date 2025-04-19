import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Button } from "@/components/ui/button"
import apiClient from "@/lib/apiClient"
import { toast } from "sonner"
import { format } from "date-fns"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  cost: z.coerce.number().positive({ message: "Cost must be positive" }),
  billing_cycle: z.enum(["monthly", "annually"]),
  start_date: z.date(),
})

export type AddSubscriptionFormValues = z.infer<typeof formSchema>

interface AddSubscriptionFormProps {
  refreshData: () => void
  onFormSuccess: () => void
}

export function AddSubscriptionForm({ refreshData, onFormSuccess }: AddSubscriptionFormProps) {
  const form = useForm<AddSubscriptionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cost: 0,
      billing_cycle: "monthly",
      start_date: undefined as unknown as Date,
    },
  })

  const onSubmit = async (values: AddSubscriptionFormValues) => {
    try {
      const formattedValues = {
        ...values,
        start_date: values.start_date ? format(values.start_date, 'yyyy-MM-dd') : '',
      }

      await apiClient.post('/subscriptions/', formattedValues)
      toast.success("Subscription added successfully!")
      onFormSuccess()
      refreshData()
    } catch (err: any) {
      console.error("API Error Response:", err.response?.data)
      toast.error(
        err.response?.data?.detail ||
          Object.values(err.response?.data || {}).flat().join(' ') ||
          "Failed to add subscription. Please try again."
      )
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Subscription name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost</FormLabel>
              <FormControl>
                <Input type="text" placeholder="Subscription cost" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="billing_cycle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Billing Cycle</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <DatePicker value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Add Subscription</Button>
      </form>
    </Form>
  )
}
