"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  ev: { id: string; title: string; type: string; start?: string; end?: string; description?: string };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function EventCard({ ev, onEdit, onDelete }: Props) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{ev.type}</Badge>
          <p className="font-medium">{ev.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(ev.id)}>Edit</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(ev.id)}>Delete</Button>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{ev.start || '--:--'} – {ev.end || '--:--'}</p>
      {ev.description && <p className="text-xs text-muted-foreground">{ev.description}</p>}
    </div>
  );
}

