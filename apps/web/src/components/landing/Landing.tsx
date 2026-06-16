"use client";

import { useState } from "react";
import { Preloader } from "./Preloader";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { About } from "./sections/About";
import { Work } from "./sections/Work";
import { Stack } from "./sections/Stack";
import { Contact } from "./sections/Contact";
import { CustomCursor } from "@/components/shared/CustomCursor";
import { SmoothScroll } from "@/components/shared/SmoothScroll";

export function Landing() {
  const [started, setStarted] = useState(false);

  return (
    <SmoothScroll>
      <CustomCursor />
      <Preloader onComplete={() => setStarted(true)} />
      <Header />
      <main className="relative">
        <Hero started={started} />
        <About />
        <Work />
        <Stack />
        <Contact />
      </main>
    </SmoothScroll>
  );
}
