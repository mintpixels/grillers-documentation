"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CircleDot,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Label,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

// Week configuration - weeks starting Monday
const WEEKS = [
  { id: "dec-01", label: "Dec 1", startDate: "2024-12-01", endDate: "2024-12-07" },
  { id: "dec-08", label: "Dec 8", startDate: "2024-12-08", endDate: "2024-12-14" },
  { id: "dec-15", label: "Dec 15", startDate: "2024-12-15", endDate: "2024-12-21" },
  { id: "dec-22", label: "Dec 22", startDate: "2024-12-22", endDate: "2024-12-28" },
  { id: "dec-29", label: "Dec 29", startDate: "2024-12-29", endDate: "2025-01-04" },
  { id: "jan-05", label: "Jan 5", startDate: "2025-01-05", endDate: "2025-01-11" },
  { id: "jan-12", label: "Jan 12", startDate: "2025-01-12", endDate: "2025-01-18" },
];

// Each week column is 280px + 16px gap = 296px total
const WEEK_WIDTH = 296;

// Category configuration matching the main app
const CATEGORIES = [
  { id: "backend", label: "Backend", labelName: "medusa-backend", color: "#E11D48" },
  { id: "frontend", label: "Frontend", labelName: "medusa-frontend", color: "#0E8A16" },
  { id: "strapi", label: "Strapi", labelName: "strapi-cms", color: "#4945FF" },
];

// Placeholder data - will be replaced with real API data
const CATEGORY_PROGRESS = [
  { name: "Backend", completed: 12, total: 45, color: "#E11D48" },
  { name: "Frontend", completed: 15, total: 78, color: "#0E8A16" },
  { name: "Strapi", completed: 18, total: 24, color: "#4945FF" },
];

const PRIORITY_BREAKDOWN = [
  { name: "Critical", value: 10, color: "#B60205" },
  { name: "High", value: 26, color: "#D93F0B" },
  { name: "Medium", value: 43, color: "#FBCA04" },
  { name: "Low", value: 15, color: "#C2E0C6" },
];

// Placeholder issues per week - will be populated from API
const WEEKLY_ISSUES: Record<string, Array<{
  number: number;
  title: string;
  category: string;
  priority: string;
  status: "open" | "closed";
}>> = {
  "dec-01": [
    // Critical - Completed
    { number: 84, title: "[Strapi] CookieConsent single type", category: "strapi", priority: "critical", status: "closed" },
    { number: 83, title: "[Strapi] Analytics single type", category: "strapi", priority: "critical", status: "closed" },
    { number: 81, title: "[Strapi] Footer single type", category: "strapi", priority: "critical", status: "closed" },
    { number: 76, title: "[Strapi] Review content type", category: "strapi", priority: "critical", status: "closed" },
    { number: 38, title: "[General] Cookie consent banner", category: "frontend", priority: "critical", status: "closed" },
    { number: 37, title: "[General] Google Tag Manager", category: "frontend", priority: "critical", status: "closed" },
    { number: 36, title: "[General] Google Analytics 4 tracking", category: "frontend", priority: "critical", status: "closed" },
    // High Priority - Completed
    { number: 107, title: "[Strapi] SEO component to ProductCollection", category: "strapi", priority: "high", status: "closed" },
    { number: 98, title: "[Strapi] SEO component to Recipe", category: "strapi", priority: "high", status: "closed" },
    { number: 97, title: "[Strapi] AggregateRating to Product", category: "strapi", priority: "high", status: "closed" },
    { number: 96, title: "[Strapi] Schema fields to Product", category: "strapi", priority: "high", status: "closed" },
    { number: 87, title: "[Strapi] organization component", category: "strapi", priority: "high", status: "closed" },
    { number: 86, title: "[Strapi] newsletter component", category: "strapi", priority: "high", status: "closed" },
    { number: 82, title: "[Strapi] AnnouncementBar single type", category: "strapi", priority: "high", status: "closed" },
    { number: 53, title: "[Checkout] Grillers Pride branding", category: "frontend", priority: "high", status: "closed" },
    { number: 44, title: "[General] Focus visible styles", category: "frontend", priority: "high", status: "closed" },
    { number: 29, title: "[Collections] Grillers Pride branding", category: "frontend", priority: "high", status: "closed" },
    { number: 20, title: "[PDP] Grillers Pride branding", category: "frontend", priority: "high", status: "closed" },
    // Medium Priority - Completed
    { number: 104, title: "[Strapi] Rating fields to Recipe", category: "strapi", priority: "medium", status: "closed" },
    { number: 103, title: "[Strapi] RecipeCategory relation", category: "strapi", priority: "medium", status: "closed" },
    { number: 102, title: "[Strapi] VideoUrl field to Recipe", category: "strapi", priority: "medium", status: "closed" },
    { number: 101, title: "[Strapi] NutritionInfo to Recipe", category: "strapi", priority: "medium", status: "closed" },
    { number: 100, title: "[Strapi] Difficulty field to Recipe", category: "strapi", priority: "medium", status: "closed" },
    { number: 99, title: "[Strapi] Schema fields to Recipe", category: "strapi", priority: "medium", status: "closed" },
    { number: 92, title: "[Strapi] nutrition-info component", category: "strapi", priority: "medium", status: "closed" },
    { number: 78, title: "[Strapi] RecipeCategory content type", category: "strapi", priority: "medium", status: "closed" },
    { number: 66, title: "[Recipes] Grillers Pride branding", category: "frontend", priority: "medium", status: "closed" },
    // Low Priority - Completed
    { number: 58, title: "[Checkout] Fix shipping disclaimer typo", category: "frontend", priority: "low", status: "closed" },
    { number: 50, title: "[General] Page transition loading", category: "frontend", priority: "low", status: "closed" },
    { number: 35, title: "[Collections] Product count display", category: "frontend", priority: "low", status: "closed" },
    { number: 34, title: "[Collections] Remove legacy pages", category: "frontend", priority: "low", status: "closed" },
    { number: 28, title: "[PDP] Related products skeleton", category: "frontend", priority: "low", status: "closed" },
  ],
  "dec-08": [
    // 🔴 Critical - Strapi Content Types
    { number: 207, title: "[Strapi] Create Tag content type", category: "strapi", priority: "critical", status: "closed" },
    { number: 205, title: "[Strapi] Create Testimonial content type", category: "strapi", priority: "critical", status: "closed" },
    { number: 85, title: "[Strapi] ColdChainSettings single type", category: "strapi", priority: "critical", status: "closed" },
    // 🟠 High - Strapi
    { number: 206, title: "[Strapi] TestimonialSection component", category: "strapi", priority: "high", status: "closed" },
    { number: 108, title: "[Strapi] Organization schema fields", category: "strapi", priority: "high", status: "open" },
    { number: 105, title: "[Strapi] ProductCollection Description", category: "strapi", priority: "high", status: "closed" },
    { number: 106, title: "[Strapi] ProductCollection HeroImage", category: "strapi", priority: "high", status: "closed" },
    { number: 93, title: "[Strapi] CTA button fields for hero", category: "strapi", priority: "high", status: "closed" },
    { number: 95, title: "[Strapi] BackgroundImageAlt for hero", category: "strapi", priority: "high", status: "closed" },
    { number: 91, title: "[Strapi] product-image component", category: "strapi", priority: "high", status: "closed" },
    { number: 79, title: "[Strapi] ShippingBox content type", category: "strapi", priority: "high", status: "closed" },
    { number: 110, title: "[Strapi] UPS API config fields", category: "strapi", priority: "high", status: "closed" },
    // 🟠 High - Frontend (Checkout)
    { number: 203, title: "[Checkout] Per-lb pricing breakdown", category: "frontend", priority: "high", status: "closed" },
    { number: 204, title: "[Checkout] Net-weight messaging", category: "frontend", priority: "high", status: "closed" },
    { number: 208, title: "[Frontend] Testimonial display components", category: "frontend", priority: "high", status: "closed" },
    // 🟡 Medium - Strapi
    { number: 109, title: "[Strapi] Phone fields for Header", category: "strapi", priority: "medium", status: "closed" },
    { number: 94, title: "[Strapi] Subtitle field for hero", category: "strapi", priority: "medium", status: "closed" },
    { number: 90, title: "[Strapi] certification component", category: "strapi", priority: "medium", status: "closed" },
    { number: 88, title: "[Strapi] social-links component", category: "strapi", priority: "medium", status: "closed" },
    { number: 80, title: "[Strapi] Region content type", category: "strapi", priority: "medium", status: "closed" },
    { number: 77, title: "[Strapi] Wishlist content type", category: "strapi", priority: "medium", status: "closed" },
    // 🟡 Medium - Frontend (Easy 10)
    { number: 62, title: "[Checkout] Progress indicator", category: "frontend", priority: "medium", status: "closed" },
    { number: 60, title: "[Checkout] Order summary sticky", category: "frontend", priority: "medium", status: "closed" },
    { number: 22, title: "[PDP] Breadcrumb navigation", category: "frontend", priority: "medium", status: "closed" },
    { number: 49, title: "[General] Create 500 error page", category: "frontend", priority: "medium", status: "closed" },
    { number: 16, title: "[Footer] Social media links", category: "frontend", priority: "medium", status: "closed" },
    { number: 19, title: "[Footer] Kosher certification badge", category: "frontend", priority: "medium", status: "closed" },
    // 🟢 Low - Frontend (Easy)
    { number: 70, title: "[Recipes] Print functionality", category: "frontend", priority: "low", status: "closed" },
    { number: 71, title: "[Recipes] Social sharing", category: "frontend", priority: "low", status: "closed" },
    { number: 24, title: "[PDP] Social sharing buttons", category: "frontend", priority: "low", status: "closed" },
    { number: 18, title: "[Footer] Payment method icons", category: "frontend", priority: "low", status: "closed" },
    // 🟢 Low - Strapi
    { number: 89, title: "[Strapi] payment-methods component", category: "strapi", priority: "low", status: "closed" },
    { number: 201, title: "[Meta] SOW Coverage Map", category: "strapi", priority: "low", status: "open" },
  ],
  "dec-15": [
    // 🔴 Critical - Backend
    { number: 111, title: "UPS API Integration", category: "backend", priority: "critical", status: "open" },
    { number: 183, title: "Off-Session Payment Strategy", category: "backend", priority: "critical", status: "open" },
    { number: 181, title: "Net-Weight Order State Machine", category: "backend", priority: "critical", status: "open" },
    // 🔴 Critical - Frontend
    { number: 55, title: "[Checkout] UPS API real-time rates", category: "frontend", priority: "critical", status: "open" },
    { number: 43, title: "[General] WCAG 2.1 AA audit", category: "frontend", priority: "critical", status: "open" },
    // 🟠 High - Frontend
    { number: 56, title: "[Checkout] Shipping box estimation", category: "frontend", priority: "high", status: "open" },
    { number: 57, title: "[Checkout] Dry ice calculation", category: "frontend", priority: "high", status: "open" },
    { number: 54, title: "[Checkout] Credit card verification", category: "frontend", priority: "high", status: "open" },
    { number: 67, title: "[Recipes] JSON-LD structured data", category: "frontend", priority: "high", status: "open" },
    { number: 21, title: "[PDP] JSON-LD Product structured data", category: "frontend", priority: "high", status: "open" },
    { number: 46, title: "[General] Generate sitemap.xml", category: "frontend", priority: "high", status: "open" },
    { number: 45, title: "[General] ARIA live regions", category: "frontend", priority: "high", status: "open" },
    { number: 32, title: "[Collections] Filtering by attributes", category: "frontend", priority: "high", status: "open" },
    { number: 27, title: "[PDP] Image gallery accessibility", category: "frontend", priority: "high", status: "open" },
    { number: 12, title: "[Header] Keyboard navigation", category: "frontend", priority: "high", status: "open" },
    { number: 8, title: "[Header] Mobile search bar", category: "frontend", priority: "high", status: "open" },
    { number: 7, title: "[Home] Hero accessibility", category: "frontend", priority: "high", status: "open" },
    { number: 6, title: "[Home] JSON-LD Organization data", category: "frontend", priority: "high", status: "open" },
    { number: 4, title: "[Home] Newsletter signup section", category: "frontend", priority: "high", status: "open" },
  ],
  "dec-22": [
    // 🟠 High - Backend
    { number: 126, title: "Order Sync to QuickBooks", category: "backend", priority: "high", status: "open" },
    { number: 127, title: "Payment Sync to QuickBooks", category: "backend", priority: "high", status: "open" },
    // 🟠 High - Frontend
    { number: 59, title: "[Checkout] Plant pickup discount", category: "frontend", priority: "medium", status: "open" },
    { number: 39, title: "[General] Event tracking", category: "frontend", priority: "high", status: "open" },
    { number: 40, title: "[General] Unit testing framework", category: "frontend", priority: "high", status: "open" },
    { number: 41, title: "[General] E2E testing framework", category: "frontend", priority: "high", status: "open" },
    // 🟡 Medium - Frontend
    { number: 68, title: "[Recipes] Filtering/categories", category: "frontend", priority: "medium", status: "open" },
    { number: 69, title: "[Recipes] Search functionality", category: "frontend", priority: "medium", status: "open" },
    { number: 72, title: "[Recipes] Related products", category: "frontend", priority: "medium", status: "open" },
    { number: 75, title: "[Recipes] Cooking tips/video", category: "frontend", priority: "medium", status: "open" },
    { number: 64, title: "[Checkout] Promo code feedback", category: "frontend", priority: "medium", status: "open" },
    { number: 61, title: "[Checkout] Express checkout", category: "frontend", priority: "medium", status: "open" },
    { number: 65, title: "[Checkout] Fix negative price bug", category: "frontend", priority: "medium", status: "open" },
    { number: 47, title: "[General] Canonical URLs", category: "frontend", priority: "medium", status: "open" },
    { number: 48, title: "[General] hreflang tags", category: "frontend", priority: "medium", status: "open" },
    { number: 42, title: "[General] Component integration tests", category: "frontend", priority: "medium", status: "open" },
  ],
  "dec-29": [
    // 🔴 Critical - Backend
    { number: 174, title: "Configure Production Environment", category: "backend", priority: "critical", status: "open" },
    { number: 175, title: "Security Hardening", category: "backend", priority: "critical", status: "open" },
    // 🟡 Medium - Frontend
    { number: 26, title: "[PDP] Weight/nutritional info", category: "frontend", priority: "medium", status: "open" },
    { number: 30, title: "[Collections] Description from Strapi", category: "frontend", priority: "medium", status: "open" },
    { number: 31, title: "[Collections] JSON-LD CollectionPage", category: "frontend", priority: "medium", status: "open" },
    { number: 33, title: "[Collections] Banner/hero image", category: "frontend", priority: "medium", status: "open" },
    { number: 17, title: "[Footer] Strapi-driven content", category: "frontend", priority: "medium", status: "open" },
    { number: 11, title: "[Header] Region selector", category: "frontend", priority: "medium", status: "open" },
    { number: 3, title: "[Home] Hero CTA button", category: "frontend", priority: "medium", status: "open" },
    { number: 5, title: "[Home] Lazy loading sections", category: "frontend", priority: "medium", status: "open" },
    { number: 51, title: "[General] Component library docs", category: "frontend", priority: "medium", status: "open" },
    { number: 52, title: "[General] Technical stack docs", category: "frontend", priority: "medium", status: "open" },
  ],
  "jan-05": [
    // 🟠 High - QA & Testing
    { number: 198, title: "[QA] Test Plan and UAT Scenarios", category: "frontend", priority: "high", status: "open" },
    // 🟢 Low - Frontend Nice-to-haves
    { number: 63, title: "[Checkout] Gift options/messaging", category: "frontend", priority: "low", status: "open" },
    { number: 73, title: "[Recipes] Ratings/reviews", category: "frontend", priority: "low", status: "open" },
    { number: 74, title: "[Recipes] Save/favorites", category: "frontend", priority: "low", status: "open" },
    { number: 25, title: "[PDP] Wishlist functionality", category: "frontend", priority: "low", status: "open" },
  ],
  "jan-12": [
    // Final polish and launch prep
    // Any remaining items or overflow
  ],
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
};

const CATEGORY_COLORS: Record<string, string> = {
  backend: "#E11D48",
  frontend: "#0E8A16",
  strapi: "#4945FF",
};

const CATEGORY_LABELS: Record<string, string> = {
  backend: "Backend",
  frontend: "Frontend",
  strapi: "Strapi",
};

function CategoryProgressCard({ data }: { data: typeof CATEGORY_PROGRESS[0] }) {
  const percentage = Math.round((data.completed / data.total) * 100);
  const chartData = [{ name: data.name, value: percentage, fill: data.color }];
  
  const chartConfig = {
    value: {
      label: data.name,
      color: data.color,
    },
  } satisfies ChartConfig;
  
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          {data.name}
        </CardTitle>
        <CardDescription className="text-xs">
          {data.completed} of {data.total} completed
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="relative">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square max-h-[180px]"
          >
            <RadialBarChart
              data={chartData}
              startAngle={90}
              endAngle={450}
              innerRadius={60}
              outerRadius={90}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} dataKey="value" tick={false} />
              <RadialBar
                dataKey="value"
                background={{ fill: "hsl(var(--muted))" }}
                cornerRadius={10}
              />
            </RadialBarChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{percentage}%</span>
            <span className="text-[11px] text-muted-foreground">{data.completed} of {data.total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PriorityPieChart({ data }: { data: typeof PRIORITY_BREAKDOWN }) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  
  const chartConfig = {
    critical: { label: "Critical", color: "#B60205" },
    high: { label: "High", color: "#D93F0B" },
    medium: { label: "Medium", color: "#FBCA04" },
    low: { label: "Low", color: "#C2E0C6" },
  } satisfies ChartConfig;
  
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-sm font-medium">Issues by Priority</CardTitle>
        <CardDescription className="text-xs">{total} total issues</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[180px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {total}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 18}
                          className="fill-muted-foreground text-xs"
                        >
                          Issues
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex flex-wrap gap-2 justify-center py-2">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-1 text-xs">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyProgressChart({ weeklyIssues }: { weeklyIssues: typeof WEEKLY_ISSUES }) {
  const data = WEEKS.map((week) => ({
    name: week.label,
    planned: weeklyIssues[week.id]?.length || 0,
    completed: weeklyIssues[week.id]?.filter((i) => i.status === "closed").length || 0,
  }));

  const chartConfig = {
    planned: { label: "Planned", color: "#3b82f6" },
    completed: { label: "Completed", color: "#22c55e" },
  } satisfies ChartConfig;

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-sm font-medium">Weekly Delivery</CardTitle>
        <CardDescription className="text-xs">Issues per week</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <ChartContainer config={chartConfig} className="h-[160px] w-full">
          <BarChart data={data} accessibilityLayer>
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fontSize: 10 }}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={25} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="planned" fill="var(--color-planned)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
        <div className="flex justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Planned</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Completed</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IssueRow({ issue }: { issue: typeof WEEKLY_ISSUES["dec-01"][0] }) {
  const isClosed = issue.status === "closed";
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg",
        "border transition-all",
        isClosed 
          ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900" 
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
      )}
    >
      <div
        className={cn(
          "w-1.5 h-8 rounded-full",
          isClosed ? "bg-green-500" : PRIORITY_COLORS[issue.priority]
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isClosed ? (
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          ) : (
            <CircleDot className="w-4 h-4 text-blue-500 flex-shrink-0" />
          )}
          <span className={cn("text-sm", isClosed ? "text-green-600" : "text-zinc-400")}>#{issue.number}</span>
          <span className={cn(
            "text-sm font-medium truncate",
            isClosed 
              ? "text-green-700 dark:text-green-400 line-through" 
              : "text-zinc-900 dark:text-zinc-100"
          )}>
            {issue.title}
          </span>
        </div>
      </div>
      <span
        className={cn(
          "px-2 py-0.5 rounded-full text-xs font-medium",
          isClosed && "opacity-60"
        )}
        style={{
          backgroundColor: `${CATEGORY_COLORS[issue.category]}20`,
          color: CATEGORY_COLORS[issue.category],
        }}
      >
        {CATEGORY_LABELS[issue.category] || issue.category}
      </span>
      <a
        href={`https://github.com/mintpixels/grillers-documentation/issues/${issue.number}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
      >
        <ExternalLink className="w-4 h-4 text-zinc-400" />
      </a>
    </motion.div>
  );
}

function WeekColumn({
  week,
  issues,
  isCurrentWeek,
  forecastOverall,
}: {
  week: typeof WEEKS[0];
  issues: typeof WEEKLY_ISSUES["dec-01"];
  isCurrentWeek: boolean;
  forecastOverall: number;
}) {
  const completedCount = issues.filter((i) => i.status === "closed").length;
  const totalCount = issues.length;

  return (
    <div
      className={cn(
        "week-column flex-shrink-0 rounded-xl p-4",
        "bg-zinc-50 dark:bg-zinc-900/50",
        "border-2",
        isCurrentWeek
          ? "border-blue-500 dark:border-blue-400"
          : "border-transparent"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Week of {week.label}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            {completedCount}/{totalCount} completed
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isCurrentWeek && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
              Current
            </span>
          )}
          <span
            title="Percentage Done Overall if all items in this week are completed"
            className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-medium rounded-full"
          >
            Overall if done: {forecastOverall}%
          </span>
        </div>
      </div>

      <Progress
        value={(completedCount / totalCount) * 100}
        className="h-1.5 mb-4"
        indicatorClassName="bg-blue-500"
      />

      <div className="space-y-2">
        {issues.length > 0 ? (
          issues.map((issue) => <IssueRow key={issue.number} issue={issue} />)
        ) : (
          <div className="text-center py-8 text-zinc-400 text-sm">
            No issues scheduled
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectPlanPage() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [weeklyIssues, setWeeklyIssues] = useState<typeof WEEKLY_ISSUES>(WEEKLY_ISSUES);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Show exactly 3 weeks at a time
  const VISIBLE_WEEKS = 3;
  const maxScroll = WEEKS.length - VISIBLE_WEEKS;
  
  // Measure container width for precise scrolling
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  // Hydrate issue states from GitHub via our API
  const refreshFromGitHub = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/issues?state=all', { cache: 'no-store' });
      const issues = await res.json();
      const map = new Map<number, 'open' | 'closed'>();
      for (const it of issues) {
        map.set(it.number, it.state);
      }
      setWeeklyIssues((prev) => {
        const next: typeof WEEKLY_ISSUES = {} as any;
        for (const w of WEEKS) {
          const arr = (prev[w.id] || []).map((iss) => ({
            ...iss,
            status: map.get(iss.number) === 'closed' ? 'closed' : 'open',
          }));
          (next as any)[w.id] = arr;
        }
        return next;
      });
    } catch (e) {
      console.error('Failed to refresh issues', e);
    } finally {
      setIsRefreshing(false);
    }
  };
  useEffect(() => { void refreshFromGitHub(); }, []);
  
  // Determine current week (dec-08 for demo)
  const currentWeekId = "dec-08";

  // Derive dynamic progress from scheduled issues
  const totals = Object.values(weeklyIssues).flat();
  const totalIssues = totals.length || 1;
  const totalCompleted = totals.filter((i) => i.status === 'closed').length;
  const overallProgress = Math.round((totalCompleted / totalIssues) * 100);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  Project Plan
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Grillers Pride • December 2024
                </p>
              </div>
            </div>
          <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-zinc-500">Overall Progress</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {overallProgress}%
                </p>
              </div>
              <div className="w-32">
                <Progress value={overallProgress} className="h-3" />
              </div>
              <Button variant="outline" size="sm" onClick={refreshFromGitHub} disabled={isRefreshing}>
                {isRefreshing ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 py-6">
        {/* Progress Charts Section */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Progress by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {(() => {
              const byCategory: Record<string, { name: string; color: string; completed: number; total: number }>= {};
              for (const c of CATEGORIES) {
                byCategory[c.id] = { name: c.label, color: c.color, completed: 0, total: 0 };
              }
              for (const item of totals) {
                const key = item.category;
                if (byCategory[key]) {
                  byCategory[key].total += 1;
                  if (item.status === 'closed') byCategory[key].completed += 1;
                }
              }
              return Object.values(byCategory).map((cat) => (
                <CategoryProgressCard key={cat.name} data={cat as any} />
              ));
            })()}
            {(() => {
              const counts: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
              for (const it of totals) {
                const p = it.priority?.toLowerCase() || 'low';
                if (p.startsWith('crit')) counts['Critical'] += 1;
                else if (p.startsWith('high')) counts['High'] += 1;
                else if (p.startsWith('med')) counts['Medium'] += 1;
                else counts['Low'] += 1;
              }
              const data = [
                { name: 'Critical', value: counts['Critical'], color: '#B60205' },
                { name: 'High', value: counts['High'], color: '#D93F0B' },
                { name: 'Medium', value: counts['Medium'], color: '#FBCA04' },
                { name: 'Low', value: counts['Low'], color: '#C2E0C6' },
              ];
              return (<PriorityPieChart data={data as any} />);
            })()}
            <WeeklyProgressChart weeklyIssues={weeklyIssues} />
          </div>
        </section>

        {/* Weekly Timeline Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Weekly Delivery Schedule
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">
                {scrollPosition + 1}-{Math.min(scrollPosition + VISIBLE_WEEKS, WEEKS.length)} of {WEEKS.length} weeks
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setScrollPosition(Math.max(0, scrollPosition - 1))}
                disabled={scrollPosition === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setScrollPosition(Math.min(maxScroll, scrollPosition + 1))}
                disabled={scrollPosition >= maxScroll}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div 
            ref={containerRef}
            className="overflow-hidden pb-4 w-full"
          >
            <div 
              className="flex gap-4 transition-transform duration-300 ease-out" 
              style={{ 
                // Scroll by 1/3 of container width + gap
                transform: `translateX(-${scrollPosition * ((containerWidth - 32) / 3 + 16)}px)`,
              }}
            >
              {(() => {
const totalPlanned = WEEKS.reduce((sum, w) => sum + ((weeklyIssues[w.id] || []).length), 0);
                return WEEKS.map((week, idx) => {
const weekIssues = weeklyIssues[week.id] || [];
const cumulativePlannedThroughWeek = WEEKS.slice(0, idx + 1).reduce((sum, w) => sum + ((weeklyIssues[w.id] || []).length), 0);
                  const forecastOverall = totalPlanned > 0 ? Math.round((cumulativePlannedThroughWeek / totalPlanned) * 100) : 0;
                  return (
                    <div 
                      key={week.id}
                      style={{ width: `${(containerWidth - 32) / 3}px` }}
                      className="flex-shrink-0"
                    >
                      <WeekColumn
                        week={week}
                        issues={weekIssues}
                        isCurrentWeek={week.id === currentWeekId}
                        forecastOverall={forecastOverall}
                      />
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
