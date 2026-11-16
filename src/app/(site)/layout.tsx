import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  return (
    <>
      <Navbar user={user ? { name: user.fullName, role: user.role } : null} />
      <main>{children}</main>
      <Footer settings={settings} />
    </>
  );
}
