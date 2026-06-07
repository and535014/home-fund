"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function CreateRecordToast() {
  useEffect(() => {
    toast.success("紀錄已新增", {
      description: "已更新本月紀錄與摘要。",
      id: "create-record-success",
    });

    const url = new URL(window.location.href);
    url.searchParams.delete("create");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, []);

  return null;
}
