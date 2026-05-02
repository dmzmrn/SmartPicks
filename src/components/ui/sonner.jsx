import { Toaster as Sonner } from "sonner";

const Toaster = (props) => (
  <Sonner
    theme="dark"
    position="bottom-right"
    toastOptions={{
      classNames: {
        toast:
          "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-white/10 group-[.toaster]:shadow-lg",
        description: "group-[.toast]:text-muted-foreground",
      },
    }}
    {...props}
  />
);

export { Toaster };
