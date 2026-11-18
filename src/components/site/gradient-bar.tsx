"use client";

import * as React from "react";

/** Thin flowing line under the header, shown while a [data-gradient-bar] section is on screen (portfolio template). */
export function GradientBar() {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const check = () => {
      const els = document.querySelectorAll("[data-gradient-bar]");
      let on = false;
      els.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.6 && r.bottom > 80) on = true;
      });
      setVisible(on);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);
  return <div className="header-gradient-bar transition-opacity duration-500" style={{ opacity: visible ? 1 : 0 }} aria-hidden />;
}
