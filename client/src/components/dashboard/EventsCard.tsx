import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useContractEvents } from "@/lib/api";
import { ContractEvent } from "@/lib/types";
import { formatAddress } from "@/lib/utils";

export default function EventsCard() {
  const [eventType, setEventType] = useState<string>("");
  const [limit, setLimit] = useState<number>(10);
  const [blockRange, setBlockRange] = useState<{ from?: number; to?: number }>({});
  const [applyFilters, setApplyFilters] = useState<boolean>(false);

  // Query contract events
  const { data, isLoading, error } = useContractEvents(
    applyFilters ? {
      fromBlock: blockRange.from,
      toBlock: blockRange.to,
      limit,
      eventName: eventType || undefined
    } : { limit }
  );
  
  const events = data?.events || [];
  const range = data?.range;

  // Handle filter changes
  const handleFilterApply = () => {
    setApplyFilters(true);
  };

  const handleFilterReset = () => {
    setEventType("");
    setBlockRange({});
    setLimit(10);
    setApplyFilters(false);
  };

  // Get badge color based on event name
  const getEventBadgeColor = (eventName: string) => {
    switch (eventName.toLowerCase()) {
      case 'transfer':
        return "bg-blue-100 text-blue-800";
      case 'mint':
      case 'minted':
        return "bg-green-100 text-green-800";
      case 'burn':
      case 'burned':
        return "bg-red-100 text-red-800";
      case 'approval':
        return "bg-purple-100 text-purple-800";
      case 'paused':
        return "bg-yellow-100 text-yellow-800";
      case 'unpaused':
        return "bg-emerald-100 text-emerald-800";
      case 'rewardmultiplier':
        return "bg-indigo-100 text-indigo-800";
      case 'roleadminchanged':
      case 'rolegrant':
      case 'rolerevoked':
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Events</CardTitle>
        <CardDescription>
          {range ? `Showing events from blocks ${range.fromBlock} to ${range.toBlock}` : 'Recent contract events'}
        </CardDescription>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <div className="flex-1">
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Events</SelectItem>
                <SelectItem value="Transfer">Transfer</SelectItem>
                <SelectItem value="Approval">Approval</SelectItem>
                <SelectItem value="Paused">Paused</SelectItem>
                <SelectItem value="Unpaused">Unpaused</SelectItem>
                <SelectItem value="RewardMultiplier">Reward Multiplier</SelectItem>
                <SelectItem value="RoleGranted">Role Granted</SelectItem>
                <SelectItem value="RoleRevoked">Role Revoked</SelectItem>
                <SelectItem value="RoleAdminChanged">Role Admin Changed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-1 flex-row gap-2">
            <Input 
              type="number" 
              placeholder="From Block" 
              value={blockRange.from || ''}
              onChange={e => setBlockRange(prev => ({ ...prev, from: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="max-w-32"
            />
            <Input 
              type="number" 
              placeholder="To Block" 
              value={blockRange.to || ''}
              onChange={e => setBlockRange(prev => ({ ...prev, to: e.target.value ? parseInt(e.target.value) : undefined }))}
              className="max-w-32"
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleFilterReset} size="sm">
              Reset
            </Button>
            <Button onClick={handleFilterApply} size="sm">
              Apply
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            Error loading events: {(error as Error).message}
          </div>
        ) : events.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead className="hidden md:table-cell">Block</TableHead>
                    <TableHead className="hidden md:table-cell">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event: ContractEvent) => (
                    <TableRow key={`${event.transactionHash}-${event.logIndex}`}>
                      <TableCell>
                        <div className="flex flex-col">
                          <Badge className={`mb-1 max-w-fit ${getEventBadgeColor(event.name)}`}>
                            {event.name}
                          </Badge>
                          <span className="text-xs text-gray-500 hidden md:inline">
                            {event.signature}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${event.transactionHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline text-blue-600 text-sm"
                        >
                          {formatAddress(event.transactionHash)}
                        </a>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <a 
                          href={`https://sepolia.etherscan.io/block/${event.blockNumber}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline text-blue-600 text-sm"
                        >
                          {event.blockNumber}
                        </a>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-600">
                        {formatTimestamp(event.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Display pagination if there are more events */}
            {range?.hasMore && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious href="#" />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">2</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink href="#">3</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext href="#" />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No events found for the specified criteria.
          </div>
        )}
      </CardContent>
    </Card>
  );
}