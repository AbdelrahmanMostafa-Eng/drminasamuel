import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { GradientBar } from "@/components/site/gradient-bar";
import { MagneticCursor } from "@/components/site/cursor";
import { ViewerProvider } from "@/components/site/viewer";
import { getSettings } from "@/lib/settings";

/** No cookies are read here, so every public page can be served from cache and prefetched. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <ViewerProvider>
      <MagneticCursor />
      <Header />
      <GradientBar />
      <main>{children}</main>
      <Footer settings={settings} />
    </ViewerProvider>
  );
}
