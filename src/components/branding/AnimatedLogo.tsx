import Lottie from "lottie-react";
import { useTheme } from "../../providers/useTheme";
import animationData from "../../assets/images/wired-outline-56-document-hover-unfold.json";

export function AnimatedLogo({ size = 160, className }: { size?: number; className?: string }) {
  const { theme } = useTheme();

  return (
    <div
      role="img"
      aria-label="ListsHub animated logo"
      style={{ width: size, height: size }}
      className={className}
    >
      <Lottie
        animationData={animationData}
        loop
        autoplay
        style={{
          width: "100%",
          height: "100%",
          filter: theme === 'dark' ? 'brightness(3) invert(1) hue-rotate(180deg)' : 'none'
        }}
      />
    </div>
  );
}
