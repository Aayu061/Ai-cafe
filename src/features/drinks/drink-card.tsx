import React from "react";
import { DrinkItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Sliders, Flame } from "lucide-react";
import Link from "next/link";

interface DrinkCardProps {
  drink: DrinkItem;
}

export function DrinkCard({ drink }: DrinkCardProps) {
  return (
    <Card className="flex flex-col justify-between h-full bg-offwhite border-espresso/10 hover:border-caramel/40 transition-all duration-300">
      <div>
        {/* Header Tags */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-caramel">
            {drink.categoryLabel}
          </span>
          <div className="flex items-center gap-1.5">
            {drink.tag && (
              <Badge variant="caramel" size="sm">
                {drink.tag}
              </Badge>
            )}
            <Badge variant="cream" size="sm">
              {drink.temperature}
            </Badge>
          </div>
        </div>

        {/* Drink Title */}
        <h3 className="font-serif text-xl sm:text-2xl font-bold text-espresso mb-2 group-hover:text-caramel transition-colors">
          {drink.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-espresso/70 leading-relaxed mb-4">
          {drink.description}
        </p>

        {/* Taste Notes */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {drink.tasteNotes.map((note) => (
            <span
              key={note}
              className="text-[11px] px-2.5 py-0.5 rounded-full bg-cream text-espresso/80 border border-espresso/5 font-medium"
            >
              {note}
            </span>
          ))}
        </div>
      </div>

      {/* Footer / Pricing & Actions */}
      <div className="pt-4 border-t border-espresso/5 flex items-center justify-between mt-auto">
        <div className="flex flex-col">
          <span className="text-lg font-bold text-espresso font-serif">
            {formatPrice(drink.price)}
          </span>
          {drink.calories && (
            <span className="text-[11px] text-warmgray flex items-center gap-0.5">
              <Flame className="w-3 h-3 text-caramel/80" />
              {drink.calories} kcal
            </span>
          )}
        </div>

        <Link href={`/builder?product=${drink.id}`}>
          <Button variant="outline" size="sm" className="gap-1.5 hover:border-caramel hover:text-espresso">
            <Sliders className="w-3.5 h-3.5 text-caramel" />
            <span>Customize</span>
          </Button>
        </Link>
      </div>
    </Card>
  );
}
