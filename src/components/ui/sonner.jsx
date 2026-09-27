import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/components/theme-provider";

const Toaster = (props) => {
  const { resolvedMode } = useTheme();
  return (
    <Sonner
      theme={resolvedMode}
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
