import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { GradientBar } from "@/components/site/gradient-bar";
import { MagneticCursor } from "@/components/site/cursor";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  return (
    <>
      <MagneticCursor />
      <Header user={user ? { name: user.fullName, role: user.role } : null} />
      <GradientBar />
      <main>{children}</main>
      <Footer settings={settings} />
    </>
  );
}
