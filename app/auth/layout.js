const pageTitle = "Account Access";
const pageDescription =
  "Sign in or create an account to access FieldDeskOps.";

export const metadata = {
  title: pageTitle,
  description: pageDescription,
  robots: { index: false, follow: false },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: "/auth/login",
  },
  twitter: {
    title: pageTitle,
    description: pageDescription,
  },
};

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
      {children}
    </div>
  );
}
