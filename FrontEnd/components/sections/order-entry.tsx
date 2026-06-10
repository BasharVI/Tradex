"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";

export function OrderEntry() {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Order Entry</CardTitle>
          <p className="text-xs text-muted-foreground">Fast paper execution</p>
        </div>
        <Badge variant={side === "BUY" ? "success" : "danger"}>{side}</Badge>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Order side">
          <Button type="button" variant={side === "BUY" ? "success" : "outline"} onClick={() => setSide("BUY")}>
            Buy
          </Button>
          <Button type="button" variant={side === "SELL" ? "destructive" : "outline"} onClick={() => setSide("SELL")}>
            Sell
          </Button>
        </div>
        <label className="grid gap-1 text-xs font-medium">
          Symbol
          <Input defaultValue="RELIANCE" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-xs font-medium">
            Exchange
            <Select defaultValue="NSE">
              <option>NSE</option>
              <option>BSE</option>
            </Select>
          </label>
          <label className="grid gap-1 text-xs font-medium">
            Product
            <Select defaultValue="CNC">
              <option>CNC</option>
              <option>MIS</option>
            </Select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-xs font-medium">
            Qty
            <Input type="number" defaultValue={12} min={1} />
          </label>
          <label className="grid gap-1 text-xs font-medium">
            Type
            <Select defaultValue="MARKET">
              <option>MARKET</option>
              <option>LIMIT</option>
              <option>SL</option>
            </Select>
          </label>
        </div>
        <label className="grid gap-1 text-xs font-medium">
          Limit price
          <Input type="number" defaultValue={2864} />
        </label>
        <div className="rounded-md bg-muted p-3 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated value</span>
            <span className="font-semibold numeric">₹34,368</span>
          </div>
          <div className="mt-1 flex justify-between">
            <span className="text-muted-foreground">Available margin</span>
            <span className="font-semibold numeric">₹4,82,900</span>
          </div>
        </div>
        <Button variant={side === "BUY" ? "success" : "destructive"} className="h-10">
          Place {side} Order
        </Button>
      </CardContent>
    </Card>
  );
}
