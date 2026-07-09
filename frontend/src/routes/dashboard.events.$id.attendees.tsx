import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { attendeesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Download, QrCode, Search, Trash2, CheckCircle2 } from "lucide-react";
import { EmptyState, LoadingBlock, FilterBar, Panel } from "@/components/ui-blocks";

export const Route = createFileRoute("/dashboard/events/$id/attendees")({
  component: Attendees,
});

const STATUS_COLORS: Record<string, string> = {
  registered: "bg-primary/10 text-primary",
  checked_in: "bg-green-500/10 text-green-700",
  waitlisted: "bg-amber-500/10 text-amber-700",
  cancelled: "bg-destructive/10 text-destructive",
};

function Attendees() {
  const { id: eventId } = Route.useParams();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [scanOpen, setScanOpen] = useState(false);
  const [qr, setQr] = useState("");

  const list = useQuery({
    queryKey: ["attendees", eventId, { page, search, status }],
    queryFn: () =>
      attendeesApi.list(eventId, { page, limit: 20, search: search || undefined, status: status || undefined }),
  });

  const remove = useMutation({
    mutationFn: (aid: string) => attendeesApi.remove(eventId, aid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendees", eventId] });
      toast.success("Attendee removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const checkIn = useMutation({
    mutationFn: (code: string) => attendeesApi.checkIn(eventId, code),
    onSuccess: (a) => {
      toast.success(`Checked in: ${a.fullName}`);
      qc.invalidateQueries({ queryKey: ["attendees", eventId] });
      setQr("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportCsv = async () => {
    try {
      const blob = await attendeesApi.exportCsv(eventId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendees-${eventId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  };

  return (
    <div>
      <FilterBar>
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="rounded-xl border-0 bg-background/80 pl-9"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          />
        </div>
        <Select value={status || "all"} onValueChange={(v) => { setPage(1); setStatus(v === "all" ? "" : v); }}>
          <SelectTrigger className="w-40 rounded-xl border-0 bg-background/80"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="registered">Registered</SelectItem>
            <SelectItem value="checked_in">Checked in</SelectItem>
            <SelectItem value="waitlisted">Waitlisted</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={scanOpen} onOpenChange={setScanOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-full"><QrCode className="mr-1.5 h-4 w-4" /> Check in</Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-sm">
            <DialogHeader><DialogTitle>Check in attendee</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Label>QR code</Label>
              <Input
                className="rounded-xl"
                autoFocus
                placeholder="Scan or paste QR code"
                value={qr}
                onChange={(e) => setQr(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && qr && checkIn.mutate(qr)}
              />
              <p className="text-xs text-muted-foreground">
                Focus a scanner on this field, or paste a code manually.
              </p>
            </div>
            <DialogFooter>
              <Button className="rounded-full" disabled={!qr || checkIn.isPending} onClick={() => checkIn.mutate(qr)}>
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" className="rounded-full" onClick={exportCsv}>
          <Download className="mr-1.5 h-4 w-4" /> Export CSV
        </Button>
      </FilterBar>

      {list.isLoading && <LoadingBlock />}
      {list.data && list.data.items.length === 0 && (
        <EmptyState title="No attendees" description="Registrations will appear here as they come in." />
      )}

      {list.data && list.data.items.length > 0 && (
        <Panel noPadding>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.data.items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">{a.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={STATUS_COLORS[a.status]}>
                      {String(a.status).replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {a.registeredAt ? new Date(a.registeredAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(a.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      )}

      {list.data && list.data.pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {list.data.pagination.page} of {list.data.pagination.totalPages} ·{" "}
            {list.data.pagination.totalItems} total
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= (list.data.pagination.totalPages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
