import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OrderItem {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  price: string | number;
  total: string | number;
}

interface OrderItemsTableProps {
  items: OrderItem[];
}

export function OrderItemsTable({ items }: OrderItemsTableProps) {
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + Number(item.total), 0);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead className="text-center">Quantity</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-gray-500">
                No items found
              </TableCell>
            </TableRow>
          ) : (
            <>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ₹{Number(item.price).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{Number(item.total).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-50 font-semibold">
                <TableCell colSpan={3} className="text-right">
                  Subtotal
                </TableCell>
                <TableCell className="text-right">
                  ₹{calculateSubtotal().toFixed(2)}
                </TableCell>
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
