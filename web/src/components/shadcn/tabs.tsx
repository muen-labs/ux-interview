import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:flex group-data-vertical/tabs:flex-col group-data-vertical/tabs:w-max group-data-vertical/tabs:h-fit data-[variant=line]:rounded-none data-[variant=line]:gap-1 data-[variant=line]:bg-transparent",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsIndicator({ className, ...props }: TabsPrimitive.Indicator.Props) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      // shadcn's active-pill styling (bg-background + shadow) driven by our
      // sliding indicator — the pill glides between triggers instead of
      // appearing/disappearing. Calm 300ms ease-out; reduced-motion handled
      // by the primitive's own fallback.
      className={cn(
        "absolute rounded-md border border-transparent bg-background text-foreground transition-[left,right,top,bottom] duration-300 ease-out",
        "group-data-[color=default]/tabs-list:border-border",
        "left-(--active-tab-left) right-(--active-tab-right) top-(--active-tab-top) bottom-(--active-tab-bottom)",
        "group-data-[animated=true]/tabs-list:group-data-[color=primary]/tabs-list:bg-primary group-data-[animated=true]/tabs-list:group-data-[color=primary]/tabs-list:text-primary-foreground",
        "group-data-[animated=true]/tabs-list:group-data-[color=secondary]/tabs-list:border-secondary group-data-[animated=true]/tabs-list:group-data-[color=secondary]/tabs-list:text-secondary",
        "group-data-[animated=true]/tabs-list:group-data-[color=tertiary]/tabs-list:border-tertiary group-data-[animated=true]/tabs-list:group-data-[color=tertiary]/tabs-list:text-tertiary",
        className
      )}
      {...props}
    />
  )
}

function TabsList({
  className,
  variant = "default",
  animated = true,
  color = "default",
  children,
  ...props
}: TabsPrimitive.List.Props &
  VariantProps<typeof tabsListVariants> & {
    /** Sliding pill indicator (our signature animation) — on by default;
        set false for the shadcn site's static pill. */
    animated?: boolean
    /** Active-tone tint: secondary/tertiary tokens. Default stays monochrome. */
    color?: "default" | "primary" | "secondary" | "tertiary"
  }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      data-animated={animated}
      data-color={color}
      className={cn(
        tabsListVariants({ variant }),
        animated && variant === "default" && "relative",
        className
      )}
      {...props}
    >
      {animated && variant === "default" && <TabsIndicator />}
      {children}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex items-center justify-center gap-1.5 rounded-md border border-transparent h-[calc(100%-1px)] flex-1 px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Static pill (animated=false, matches shadcn): outline pill on the active trigger.
        // Gated on animated=false so it can't out-paint the sliding indicator (equal
        // specificity would otherwise make the static pill win in source order).
        "group-data-[animated=false]/tabs-list:group-data-[variant=default]/tabs-list:data-active:border-border group-data-[animated=false]/tabs-list:group-data-[variant=default]/tabs-list:data-active:bg-background group-data-[animated=false]/tabs-list:group-data-[variant=default]/tabs-list:data-active:text-foreground",
        // Animated opt-in: the indicator paints the pill, so the trigger stays transparent.
        "group-data-[animated=true]/tabs-list:group-data-[variant=default]/tabs-list:data-active:bg-transparent group-data-[animated=true]/tabs-list:group-data-[variant=default]/tabs-list:data-active:text-foreground group-data-[animated=true]/tabs-list:group-data-[variant=default]/tabs-list:dark:data-active:text-foreground",
        // Animated tone: active label follows the token (indicator paints the fill/border).
        "group-data-[animated=true]/tabs-list:group-data-[variant=default]/tabs-list:group-data-[color=primary]/tabs-list:data-active:text-primary-foreground",
        "group-data-[animated=true]/tabs-list:group-data-[variant=default]/tabs-list:group-data-[color=secondary]/tabs-list:data-active:text-secondary",
        "group-data-[animated=true]/tabs-list:group-data-[variant=default]/tabs-list:group-data-[color=tertiary]/tabs-list:data-active:text-tertiary",
        "group-data-[variant=line]/tabs-list:flex-1 group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:text-foreground dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        // Tone opt-in: default = mono outline; primary = filled; secondary/tertiary = outline tinted with the token (text + border, like Button).
        // Static pill only — line variant tints the underline only; text stays foreground (Mitsu rule).
        "group-data-[animated=false]/tabs-list:group-data-[variant=default]/tabs-list:group-data-[color=primary]/tabs-list:data-active:border-transparent group-data-[animated=false]/tabs-list:group-data-[variant=default]/tabs-list:group-data-[color=primary]/tabs-list:data-active:bg-primary group-data-[animated=false]/tabs-list:group-data-[variant=default]/tabs-list:group-data-[color=primary]/tabs-list:data-active:text-primary-foreground",
        "group-data-[animated=false]/tabs-list:group-data-[variant=default]/tabs-list:group-data-[color=secondary]/tabs-list:data-active:border-secondary group-data-[animated=false]/tabs-list:group-data-[variant=default]/tabs-list:group-data-[color=secondary]/tabs-list:data-active:text-secondary",
        "group-data-[animated=false]/tabs-list:group-data-[variant=default]/tabs-list:group-data-[color=tertiary]/tabs-list:data-active:border-tertiary group-data-[animated=false]/tabs-list:group-data-[variant=default]/tabs-list:group-data-[color=tertiary]/tabs-list:data-active:text-tertiary",
        "group-data-[variant=line]/tabs-list:group-data-[color=primary]/tabs-list:data-active:text-primary group-data-[variant=line]/tabs-list:group-data-[color=primary]/tabs-list:after:bg-primary",
        "group-data-[variant=line]/tabs-list:group-data-[color=secondary]/tabs-list:data-active:text-secondary group-data-[variant=line]/tabs-list:group-data-[color=secondary]/tabs-list:after:bg-secondary",
        "group-data-[variant=line]/tabs-list:group-data-[color=tertiary]/tabs-list:after:bg-tertiary",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger, tabsListVariants }
