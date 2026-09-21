export type DrinkCategory = "cold-brew" | "frappe" | "espresso" | "tea" | "smoothie";

export interface DrinkItem {
  id: string;
  name: string;
  category: DrinkCategory;
  categoryLabel: string;
  description: string;
  price: number;
  popular?: boolean;
  tag?: string;
  image?: string;
  calories?: number;
  temperature: "Iced" | "Hot" | "Blended";
  tasteNotes: string[];
}

export type DrinkBase = "cold-brew" | "espresso" | "matcha" | "chai";
export type MilkOption = "whole" | "oat" | "almond" | "coconut";
export type SweetnessLevel = 0 | 25 | 50 | 75 | 100;
export type FlavorSyrup = "caramel" | "vanilla" | "hazelnut" | "none";
export type ColdFoamOption = "none" | "vanilla-sweet-foam" | "caramel-foam" | "matcha-foam";
export type ToppingOption = "cinnamon" | "cocoa-dust" | "caramel-drizzle" | "none";

export interface DrinkCustomization {
  base: DrinkBase;
  milk: MilkOption;
  sweetness: SweetnessLevel;
  flavor: FlavorSyrup;
  foam: ColdFoamOption;
  topping: ToppingOption;
  iceLevel: "No Ice" | "Light Ice" | "Regular Ice" | "Extra Ice";
}
