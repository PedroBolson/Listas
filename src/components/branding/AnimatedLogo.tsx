import { useEffect, useState } from "react";
import Lottie from "lottie-react";

type AnimationData = Record<string, unknown>;

let cachedAnimation: AnimationData | null = null;
let loadPromise: Promise<AnimationData> | null = null;

async function loadAnimation(): Promise<AnimationData> {
  if (cachedAnimation) return cachedAnimation;
  if (!loadPromise) {
    loadPromise = fetch("/images/wired-outline-56-document-hover-unfold.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load animation");
        }
        return response.json();
      })
      .then((data: AnimationData) => {
        cachedAnimation = data;
        return data;
      })
      .finally(() => {
        loadPromise = null;
      });
  }
  return loadPromise;
}

export function AnimatedLogo({ size = 160, className }: { size?: number; className?: string }) {
  const [animationData, setAnimationData] = useState<AnimationData | null>(cachedAnimation);

  useEffect(() => {
    let mounted = true;

    if (!animationData) {
      loadAnimation()
        .then((data) => {
          if (mounted) {
            setAnimationData(data);
          }
        })
        .catch(() => {
          if (mounted) {
            setAnimationData(null);
          }
        });
    }

    return () => {
      mounted = false;
    };
  }, [animationData]);

  if (!animationData) {
    return (
      <img src="/images/icon.svg" alt="ListsHub" width={size} height={size} className={className} />
    );
  }

  return (
    <div
      role="img"
      aria-label="ListsHub animated logo"
      style={{ width: size, height: size }}
      className={className}
    >
      <Lottie animationData={animationData} loop autoplay style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
