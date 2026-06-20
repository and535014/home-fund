import { Shapes } from "lucide-react";

import { ItemTitle } from "@/components/ui/item";

export function RecordCategoryLabel({ name }: { name: string }) {
  return (
    <ItemTitle className="flex max-w-full flex-col items-center gap-2">
      <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Shapes className="size-5" />
      </span>
      <span className="max-w-full truncate text-label text-muted-foreground">
        {name}
      </span>
    </ItemTitle>
  );
}
