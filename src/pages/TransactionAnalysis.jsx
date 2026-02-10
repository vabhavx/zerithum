import React, { useState, useMemo } from "react";
import { base44 } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Search, 
  Filter, 
  Download, 
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TransactionAnalysis() {
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortField, setSortField] = useState("transaction_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // High density default

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["revenueTransactions"],
    queryFn: () => base44.entities.RevenueTransaction.list("-transaction_date", 1000),
  });

  const filteredAndSorted = useMemo(() => {
    let filtered = [...transactions];

    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.platform_transaction_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (platformFilter !== "all") filtered = filtered.filter(t => t.platform === platformFilter);
    if (categoryFilter !== "all") filtered = filtered.filter(t => t.category === categoryFilter);

    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (sortField === "transaction_date") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      if (sortOrder === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    return filtered;
  }, [transactions, searchQuery, platformFilter, categoryFilter, sortField, sortOrder]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSorted.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSorted, currentPage]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Platform", "Category", "Description", "Amount", "Fee", "Net"];
    const rows = filteredAndSorted.map(t => [
      format(new Date(t.transaction_date), "yyyy-MM-dd"),
      t.platform,
      t.category,
      t.description || "",
      t.amount,
      t.platform_fee || 0,
      t.amount - (t.platform_fee || 0)
    ]);
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Transaction Ledger</h1>
          <p className="text-sm text-muted-foreground font-mono">
             RAW DATA ACCESS · {filteredAndSorted.length} RECORDS
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          className="h-9 px-4 bg-foreground text-background hover:bg-foreground/90 font-mono text-xs uppercase tracking-wider rounded-none"
        >
          <Download className="w-3 h-3 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-muted/20 p-2 border border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search ID, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 border-border bg-background rounded-none text-xs font-mono"
            />
          </div>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[180px] h-9 border-border bg-background rounded-none text-xs font-mono uppercase">
              <SelectValue placeholder="PLATFORM" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-border">
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="patreon">Patreon</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
            </SelectContent>
          </Select>
           <Button
            onClick={() => {
              setSearchQuery("");
              setPlatformFilter("all");
              setCategoryFilter("all");
            }}
            variant="outline"
            className="h-9 border-border rounded-none"
          >
            <Filter className="w-3 h-3" />
          </Button>
      </div>

      <div className="border border-border bg-background">
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/50 border-b border-border">
                    <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort("transaction_date")}>
                         Date <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </TableHead>
                    <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort("platform")}>
                         Platform <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </TableHead>
                    <TableHead className="w-[140px]">Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right cursor-pointer" onClick={() => handleSort("amount")}>
                        Gross <ArrowUpDown className="w-3 h-3 inline ml-1" />
                    </TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground"/></TableCell>
                    </TableRow>
                ) : paginatedData.length === 0 ? (
                     <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground font-mono text-xs uppercase">No records found</TableCell>
                    </TableRow>
                ) : (
                    paginatedData.map((t) => (
                        <TableRow key={t.id} className="group font-mono text-xs hover:bg-muted/50 border-b border-border">
                             <TableCell className="text-muted-foreground">
                                {format(new Date(t.transaction_date), "yyyy-MM-dd")}
                             </TableCell>
                             <TableCell>
                                <span className="uppercase tracking-wider text-[10px] font-semibold">{t.platform}</span>
                             </TableCell>
                             <TableCell>
                                <Badge variant="neutral" className="rounded-none text-[10px] py-0">{t.category}</Badge>
                             </TableCell>
                             <TableCell className="text-foreground max-w-[300px] truncate" title={t.description}>
                                {t.description || "-"}
                             </TableCell>
                             <TableCell className="text-right font-medium">
                                {t.amount.toFixed(2)}
                             </TableCell>
                             <TableCell className="text-right text-destructive">
                                {(t.platform_fee || 0).toFixed(2)}
                             </TableCell>
                             <TableCell className="text-right text-emerald-500 font-bold">
                                {(t.amount - (t.platform_fee || 0)).toFixed(2)}
                             </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>

        {totalPages > 1 && (
            <div className="flex items-center justify-between p-2 border-t border-border bg-muted/20">
                <span className="text-[10px] font-mono text-muted-foreground uppercase pl-2">
                    Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-7 w-7 rounded-none"
                    >
                        <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-7 w-7 rounded-none"
                    >
                        <ChevronRight className="w-3 h-3" />
                    </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
