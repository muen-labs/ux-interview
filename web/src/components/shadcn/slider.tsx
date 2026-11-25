import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

type SliderValueLabelProps = {
  /** Shows a MUI-style value bubble attached to each handle. */
  valueLabelDisplay?: "on" | "off";
  /** Where the bubble sits relative to the handle. */
  valueLabelPosition?: "top" | "bottom" | "center";
  /** Formats the bubble text; defaults to the raw value. */
  getValueLabel?: (value: number) => string;
  /** Overrides the filled-track color (defaults to primary). */
  rangeClassName?: string;
};

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  valueLabelDisplay = "off",
  valueLabelPosition = "top",
  getValueLabel,
  rangeClassName,
  ...props
}: SliderPrimitive.Root.Props & SliderValueLabelProps) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max];

  const bubble = (v: number) =>
    `${(((v - min) / (max - min || 1)) * 100).toFixed(1)}%`;

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-muted select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className={cn(
              "bg-primary select-none data-horizontal:h-full data-vertical:w-full",
              rangeClassName,
            )}
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="relative block size-3 shrink-0 rounded-full border border-ring bg-white ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 focus-visible:ring-3 focus-visible:outline-hidden active:ring-3 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
        {/* MUI-style value bubbles following each handle. */}
        {valueLabelDisplay === "on" &&
          _values.map((v, index) => (
            <span
              key={`label-${index}`}
              aria-hidden="true"
              className={cn(
                "pointer-events-auto absolute z-10 -translate-x-1/2 cursor-grab rounded-md bg-popover px-1.5 py-0.5 text-[0.65rem] font-medium tabular-nums text-foreground shadow-sm ring-1 ring-foreground/10 select-none active:cursor-grabbing",
                valueLabelPosition === "top" && "bottom-full mb-1.5",
                valueLabelPosition === "bottom" && "top-full mt-1.5",
                valueLabelPosition === "center" && "top-1/2 -translate-y-1/2",
              )}
              style={{ left: bubble(v) }}
            >
              {getValueLabel ? getValueLabel(v) : v}
            </span>
          ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
